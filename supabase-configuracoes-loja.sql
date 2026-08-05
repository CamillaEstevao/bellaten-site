-- =========================================================
-- BELLATEN — CONFIGURAÇÕES DA LOJA
-- Execute uma vez no Supabase > SQL Editor
-- =========================================================

create table if not exists public.store_settings (
  id bigint primary key default 1 check (id = 1),
  store_name text not null default 'BellaTen',
  whatsapp text not null default '5511940746340',
  instagram text not null default 'https://instagram.com/bellaten.oficial',
  facebook text not null default '',
  address text not null default '',
  pix_key text not null default '',
  business_hours text not null default '',
  footer_text text not null default 'Seu novo jeito de comprar beleza.',
  seo_title text not null default 'BellaTen | Beleza e cosméticos',
  seo_description text not null default 'Produtos de beleza escolhidos com carinho para você.',
  logo_url text not null default '',
  banner_desktop_url text not null default '',
  banner_mobile_url text not null default '',
  primary_color text not null default '#e36b91',
  secondary_color text not null default '#d9a55f',
  delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.store_settings (
  id,
  store_name,
  whatsapp,
  instagram
)
values (
  1,
  'BellaTen',
  '5511940746340',
  'https://instagram.com/bellaten.oficial'
)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings"
on public.store_settings
for select
to anon, authenticated
using (id = 1);

drop policy if exists "Authenticated can update store settings" on public.store_settings;
create policy "Authenticated can update store settings"
on public.store_settings
for update
to authenticated
using (id = 1)
with check (id = 1);

drop policy if exists "Authenticated can insert store settings" on public.store_settings;
create policy "Authenticated can insert store settings"
on public.store_settings
for insert
to authenticated
with check (id = 1);

grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;
