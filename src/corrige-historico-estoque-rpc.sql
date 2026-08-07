-- =========================================================
-- BELLATEN — LEITURA SEGURA DO HISTÓRICO VIA RPC
-- Execute no Supabase > SQL Editor
-- Não apaga dados.
-- =========================================================

create or replace function public.get_stock_movements(
  movement_limit_input integer default 300
)
returns setof public.stock_movements
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  return query
  select *
  from public.stock_movements
  order by created_at desc
  limit greatest(1, least(coalesce(movement_limit_input, 300), 1000));
end;
$$;

grant execute on function public.get_stock_movements(integer)
to authenticated;

-- Teste direto da função no SQL Editor:
select *
from public.get_stock_movements(20);
