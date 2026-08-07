-- =========================================================
-- BELLATEN — ACOMPANHAMENTO PÚBLICO DE PEDIDOS
-- Execute uma vez no Supabase > SQL Editor
-- Requer que o módulo de cupons já esteja instalado.
-- =========================================================

create extension if not exists pgcrypto;

alter table public.orders
add column if not exists tracking_token uuid;

update public.orders
set tracking_token = gen_random_uuid()
where tracking_token is null;

alter table public.orders
alter column tracking_token set default gen_random_uuid();

alter table public.orders
alter column tracking_token set not null;

create unique index if not exists orders_tracking_token_key
on public.orders (tracking_token);

create or replace function public.get_order_tracking(
  tracking_token_input uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_record public.orders%rowtype;
begin
  select *
    into order_record
    from public.orders
   where tracking_token = tracking_token_input;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'order_number', order_record.order_number,
    'customer_name', order_record.customer_name,
    'delivery_type', order_record.delivery_type,
    'address', order_record.address,
    'payment_method', order_record.payment_method,
    'items', order_record.items,
    'subtotal', order_record.subtotal,
    'discount', order_record.discount,
    'coupon_code', order_record.coupon_code,
    'total', order_record.total,
    'status', order_record.status,
    'created_at', order_record.created_at,
    'updated_at', order_record.updated_at
  );
end;
$$;

grant execute on function public.get_order_tracking(uuid)
to anon, authenticated;

create or replace function public.create_order(order_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_record public.products%rowtype;
  requested_quantity integer;
  product_id_value bigint;
  calculated_subtotal numeric(12,2) := 0;
  calculated_discount numeric(12,2) := 0;
  calculated_total numeric(12,2) := 0;
  normalized_coupon_code text;
  coupon_result jsonb;
  coupon_id_value bigint;
  new_order public.orders%rowtype;
begin
  if coalesce(trim(order_payload->>'customer_name'), '') = '' then
    raise exception 'Informe o nome do cliente.';
  end if;

  if coalesce(trim(order_payload->>'phone'), '') = '' then
    raise exception 'Informe o WhatsApp do cliente.';
  end if;

  if jsonb_typeof(order_payload->'items') <> 'array'
     or jsonb_array_length(order_payload->'items') = 0 then
    raise exception 'O carrinho está vazio.';
  end if;

  for item in
    select value
    from jsonb_array_elements(order_payload->'items')
  loop
    requested_quantity := greatest(
      coalesce((item->>'quantity')::integer, 1),
      1
    );

    product_id_value := (item->>'product_id')::bigint;

    select *
      into product_record
      from public.products
     where id = product_id_value
     for update;

    if not found then
      raise exception 'Produto não encontrado: %', item->>'name';
    end if;

    if coalesce(product_record.active, true) = false then
      raise exception 'Produto indisponível: %', product_record.name;
    end if;

    if coalesce(product_record.stock, 0) < requested_quantity then
      raise exception
        'Estoque insuficiente para %. Disponível: %.',
        product_record.name,
        product_record.stock;
    end if;

    calculated_subtotal :=
      calculated_subtotal +
      (coalesce(product_record.price, 0) * requested_quantity);
  end loop;

  normalized_coupon_code :=
    upper(trim(coalesce(order_payload->>'coupon_code', '')));

  if normalized_coupon_code <> '' then
    coupon_result := public.validate_coupon(
      normalized_coupon_code,
      calculated_subtotal
    );

    calculated_discount :=
      coalesce((coupon_result->>'discount')::numeric, 0);
    coupon_id_value :=
      (coupon_result->>'id')::bigint;
  end if;

  calculated_total :=
    greatest(calculated_subtotal - calculated_discount, 0);

  for item in
    select value
    from jsonb_array_elements(order_payload->'items')
  loop
    requested_quantity := greatest(
      coalesce((item->>'quantity')::integer, 1),
      1
    );
    product_id_value := (item->>'product_id')::bigint;

    update public.products
       set stock = stock - requested_quantity
     where id = product_id_value;
  end loop;

  if coupon_id_value is not null then
    update public.coupons
       set usage_count = usage_count + 1,
           updated_at = now()
     where id = coupon_id_value;
  end if;

  insert into public.orders (
    customer_name,
    phone,
    email,
    delivery_type,
    address,
    payment_method,
    notes,
    items,
    subtotal,
    discount,
    coupon_code,
    total,
    status,
    tracking_token
  )
  values (
    trim(order_payload->>'customer_name'),
    trim(order_payload->>'phone'),
    nullif(trim(order_payload->>'email'), ''),
    coalesce(nullif(order_payload->>'delivery_type', ''), 'retirada'),
    nullif(trim(order_payload->>'address'), ''),
    coalesce(nullif(order_payload->>'payment_method', ''), 'pix'),
    nullif(trim(order_payload->>'notes'), ''),
    order_payload->'items',
    calculated_subtotal,
    calculated_discount,
    nullif(normalized_coupon_code, ''),
    calculated_total,
    'recebido',
    gen_random_uuid()
  )
  returning * into new_order;

  return jsonb_build_object(
    'id', new_order.id,
    'order_number', new_order.order_number,
    'subtotal', new_order.subtotal,
    'discount', new_order.discount,
    'coupon_code', new_order.coupon_code,
    'total', new_order.total,
    'status', new_order.status,
    'tracking_token', new_order.tracking_token
  );
end;
$$;

grant execute on function public.create_order(jsonb)
to anon, authenticated;
