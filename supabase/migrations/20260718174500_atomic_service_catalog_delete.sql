create or replace function public.delete_service_catalog_atomic(p_service_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  perform 1 from public.servicos where id = p_service_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'service_not_found'; end if;
  delete from public.servico_etapas where servico_id = p_service_id;
  delete from public.servicos where id = p_service_id;
  return jsonb_build_object('id', p_service_id);
end;
$$;
revoke all on function public.delete_service_catalog_atomic(uuid) from public, anon, authenticated;
grant execute on function public.delete_service_catalog_atomic(uuid) to service_role;
