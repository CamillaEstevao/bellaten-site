-- =========================================================
-- BELLATEN — CORREÇÃO DE ACESSO AO HISTÓRICO DE ESTOQUE
-- Execute no Supabase > SQL Editor
-- Não apaga dados.
-- =========================================================

alter table public.stock_movements enable row level security;

drop policy if exists "Authenticated can read stock movements"
on public.stock_movements;

create policy "Authenticated can read stock movements"
on public.stock_movements
for select
to authenticated
using (true);

grant select on table public.stock_movements to authenticated;
grant usage, select on sequence public.stock_movements_id_seq to authenticated;

-- Teste de leitura:
select
  id,
  product_name,
  movement_type,
  quantity,
  stock_before,
  stock_after,
  reason,
  created_at
from public.stock_movements
order by created_at desc
limit 20;
