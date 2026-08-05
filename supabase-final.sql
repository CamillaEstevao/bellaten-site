-- BELLA TEN - FINALIZAÇÃO DO BANCO
-- Execute uma vez no SQL Editor do Supabase.

alter table public.products add column if not exists description text default '';

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null,
  phone text not null,
  email text,
  delivery_type text not null default 'retirada' check (delivery_type in ('retirada','entrega')),
  address text,
  payment_method text not null default 'pix',
  notes text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'novo' check (status in ('novo','atendimento','finalizado','cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
grant select, update, delete on public.orders to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

drop policy if exists "Admin visualiza pedidos" on public.orders;
drop policy if exists "Admin atualiza pedidos" on public.orders;
drop policy if exists "Admin exclui pedidos" on public.orders;
create policy "Admin visualiza pedidos" on public.orders for select to authenticated using (true);
create policy "Admin atualiza pedidos" on public.orders for update to authenticated using (true) with check (true);
create policy "Admin exclui pedidos" on public.orders for delete to authenticated using (true);

create or replace function public.create_order(order_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order public.orders;
  item jsonb;
  calc_total numeric(12,2) := 0;
  current_stock integer;
begin
  if coalesce(trim(order_payload->>'customer_name'),'') = '' or coalesce(trim(order_payload->>'phone'),'') = '' then
    raise exception 'Nome e telefone são obrigatórios';
  end if;

  if jsonb_array_length(coalesce(order_payload->'items','[]'::jsonb)) = 0 then
    raise exception 'O carrinho está vazio';
  end if;

  for item in select * from jsonb_array_elements(order_payload->'items') loop
    select stock into current_stock from public.products where id = (item->>'product_id')::bigint for update;
    if current_stock is null then raise exception 'Produto não encontrado'; end if;
    if current_stock < (item->>'quantity')::integer then raise exception 'Estoque insuficiente para %', item->>'name'; end if;
    calc_total := calc_total + ((item->>'price')::numeric * (item->>'quantity')::integer);
  end loop;

  insert into public.orders(customer_name,phone,email,delivery_type,address,payment_method,notes,items,subtotal,total)
  values(order_payload->>'customer_name',order_payload->>'phone',nullif(order_payload->>'email',''),coalesce(order_payload->>'delivery_type','retirada'),nullif(order_payload->>'address',''),coalesce(order_payload->>'payment_method','pix'),nullif(order_payload->>'notes',''),order_payload->'items',calc_total,calc_total)
  returning * into new_order;

  for item in select * from jsonb_array_elements(order_payload->'items') loop
    update public.products set stock = stock - (item->>'quantity')::integer where id = (item->>'product_id')::bigint;
  end loop;

  return jsonb_build_object('id',new_order.id,'order_number',new_order.order_number,'total',new_order.total);
end;
$$;

grant execute on function public.create_order(jsonb) to anon, authenticated;
