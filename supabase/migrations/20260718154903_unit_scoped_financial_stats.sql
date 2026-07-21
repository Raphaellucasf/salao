create index if not exists idx_transacoes_unit_tipo_data
  on public.transacoes(unit_id,tipo,data) include(valor);

create or replace function public.get_financial_stats(
  p_unit_id uuid, p_month_start date, p_today date
)
returns jsonb language sql stable security invoker
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'faturamentoHoje', coalesce(round(sum(valor) filter(where data=p_today),2),0),
    'faturamentoMes', coalesce(round(sum(valor),2),0)
  )
  from public.transacoes
  where unit_id=p_unit_id and tipo='receita'
    and data between p_month_start and p_today;
$$;
revoke all on function public.get_financial_stats(uuid,date,date) from public,anon,authenticated;
grant execute on function public.get_financial_stats(uuid,date,date) to service_role;
