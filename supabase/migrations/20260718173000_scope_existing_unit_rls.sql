create or replace function private.user_has_unit(p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select exists (
    select 1 from public.user_units
    where user_id = (select auth.uid())
      and unit_id = p_unit_id
      and is_active
  );
$$;
revoke all on function private.user_has_unit(uuid) from public, anon;
grant execute on function private.user_has_unit(uuid) to authenticated, service_role;

drop policy if exists fechamentos_caixa_insert on public.fechamentos_caixa;
drop policy if exists fechamentos_caixa_select on public.fechamentos_caixa;
drop policy if exists fechamentos_caixa_update on public.fechamentos_caixa;
create policy fechamentos_caixa_select_unit on public.fechamentos_caixa for select to authenticated
  using ((select private.is_authenticated_admin()) and private.user_has_unit(unit_id));
create policy fechamentos_caixa_insert_unit on public.fechamentos_caixa for insert to authenticated
  with check ((select private.is_authenticated_admin()) and private.user_has_unit(unit_id));
create policy fechamentos_caixa_update_unit on public.fechamentos_caixa for update to authenticated
  using ((select private.is_authenticated_admin()) and private.user_has_unit(unit_id))
  with check ((select private.is_authenticated_admin()) and private.user_has_unit(unit_id));

drop policy if exists pacotes_cliente_insert on public.pacotes_cliente;
drop policy if exists pacotes_cliente_select on public.pacotes_cliente;
drop policy if exists pacotes_cliente_update on public.pacotes_cliente;
create policy pacotes_cliente_select_unit on public.pacotes_cliente for select to authenticated
  using (private.user_has_unit(unit_id));
create policy pacotes_cliente_insert_unit on public.pacotes_cliente for insert to authenticated
  with check (private.user_has_unit(unit_id));
create policy pacotes_cliente_update_unit on public.pacotes_cliente for update to authenticated
  using (private.user_has_unit(unit_id)) with check (private.user_has_unit(unit_id));

drop policy if exists auth_all_transacoes on public.transacoes;
create policy transacoes_select_admin_unit on public.transacoes for select to authenticated
  using ((select private.is_authenticated_admin()) and private.user_has_unit(unit_id));

drop policy if exists webhook_log_select on public.webhook_log;
