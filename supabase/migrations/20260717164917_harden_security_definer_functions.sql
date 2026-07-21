begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.users (id, email, full_name, role, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    'client',
    now()
  );
  return new;
end;
$$;

alter function public.check_comanda_periodo_fechado() set search_path = pg_catalog, public;
revoke execute on function public.check_comanda_periodo_fechado() from public, anon, authenticated;
grant execute on function public.check_comanda_periodo_fechado() to service_role;

alter function public.debitar_sessao_pacote(uuid) set search_path = pg_catalog, public;
revoke execute on function public.debitar_sessao_pacote(uuid) from public, anon, authenticated;
grant execute on function public.debitar_sessao_pacote(uuid) to service_role;

alter function public.decrement_product_quantity(uuid, numeric) set search_path = pg_catalog, public;
revoke execute on function public.decrement_product_quantity(uuid, numeric) from public, anon, authenticated;
grant execute on function public.decrement_product_quantity(uuid, numeric) to service_role;

alter function public.excluir_comanda(bigint) set search_path = pg_catalog, public;
revoke execute on function public.excluir_comanda(bigint) from public, anon, authenticated;
grant execute on function public.excluir_comanda(bigint) to service_role;

alter function public.handle_new_user() set search_path = pg_catalog, public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

alter function public.is_admin() set search_path = pg_catalog, public;
revoke execute on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to service_role, authenticated;

alter function public.is_authenticated_admin() set search_path = pg_catalog, public;
revoke execute on function public.is_authenticated_admin() from public, anon, authenticated;
grant execute on function public.is_authenticated_admin() to service_role, authenticated;

alter function public.sync_agendamento_servicos_on_item() set search_path = pg_catalog, public;
revoke execute on function public.sync_agendamento_servicos_on_item() from public, anon, authenticated;
grant execute on function public.sync_agendamento_servicos_on_item() to service_role;

commit;

-- Não restaurar automaticamente metadata.role nem EXECUTE para anon/PUBLIC.
-- Qualquer rollback deve ser uma nova migration revisada, preservando role canônica.
