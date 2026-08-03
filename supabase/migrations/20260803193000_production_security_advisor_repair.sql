begin;

-- Keep extension-owned objects outside the API-exposed public schema.
create schema if not exists extensions;

do $$
declare
  v_extension record;
begin
  for v_extension in
    select e.extname
      from pg_extension e
      join pg_namespace n on n.oid = e.extnamespace
     where e.extname in ('pg_trgm', 'postgres_fdw')
       and n.nspname = 'public'
       and e.extrelocatable is true
  loop
    execute format('alter extension %I set schema extensions', v_extension.extname);
  end loop;
end;
$$;

revoke create on schema public from public, anon, authenticated;

-- Legacy functions were created before the project fixed function search paths.
-- Set a trusted, explicit path without replacing their bodies or signatures.
do $$
declare
  v_function record;
begin
  for v_function in
    select n.nspname,
           p.proname,
           pg_get_function_identity_arguments(p.oid) as identity_arguments
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and not exists (
         select 1
           from unnest(coalesce(p.proconfig, array[]::text[])) setting
          where setting like 'search_path=%'
       )
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public, private, extensions',
      v_function.nspname,
      v_function.proname,
      v_function.identity_arguments
    );
  end loop;
end;
$$;

-- These SECURITY DEFINER functions are triggers/helpers or backend operations.
-- They must never be callable through the anonymous/authenticated REST API.
do $$
declare
  v_function record;
begin
  for v_function in
    select n.nspname,
           p.proname,
           pg_get_function_identity_arguments(p.oid) as identity_arguments
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prosecdef is true
       and p.proname in (
         'check_comanda_periodo_fechado',
         'debitar_sessao_pacote',
         'decrement_product_quantity',
         'excluir_comanda',
         'handle_new_user',
         'is_admin',
         'is_authenticated_admin',
         'sync_agendamento_servicos_on_item'
       )
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from public, anon, authenticated',
      v_function.nspname,
      v_function.proname,
      v_function.identity_arguments
    );
    execute format(
      'grant execute on function %I.%I(%s) to service_role',
      v_function.nspname,
      v_function.proname,
      v_function.identity_arguments
    );
  end loop;
end;
$$;

alter default privileges in schema public revoke execute on functions from public;

-- Tables accessed only by trusted backend clients retain an explicit deny policy.
-- service_role bypasses RLS and keeps its direct privileges.
do $$
declare
  v_table text;
begin
  foreach v_table in array array['user_units', 'usuarios_sessoes', 'vw_servicos_n8n']
  loop
    if to_regclass('public.' || v_table) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', v_table);
    execute format('revoke all on table public.%I from public, anon, authenticated', v_table);
    execute format('grant all on table public.%I to service_role', v_table);
    execute format('drop policy if exists backend_only_deny_browser on public.%I', v_table);
    execute format(
      'create policy backend_only_deny_browser on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      v_table
    );
  end loop;
end;
$$;

-- webhook_log contains integration metadata and is backend-only.
alter table public.webhook_log enable row level security;
drop policy if exists webhook_log_insert on public.webhook_log;
drop policy if exists webhook_log_select on public.webhook_log;
drop policy if exists backend_only_deny_browser on public.webhook_log;
revoke all on table public.webhook_log from public, anon, authenticated;
grant all on table public.webhook_log to service_role;
create policy backend_only_deny_browser
  on public.webhook_log
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- Payment configuration is tenant data and can contain provider settings.
drop policy if exists formas_pagamento_select_policy on public.formas_pagamento;
drop policy if exists formas_pagamento_write_policy on public.formas_pagamento;
drop policy if exists formas_pagamento_member_select on public.formas_pagamento;
drop policy if exists formas_pagamento_admin_insert on public.formas_pagamento;
drop policy if exists formas_pagamento_admin_update on public.formas_pagamento;
drop policy if exists formas_pagamento_admin_delete on public.formas_pagamento;
revoke all on table public.formas_pagamento from public, anon;
grant select, insert, update, delete on table public.formas_pagamento to authenticated;
grant all on table public.formas_pagamento to service_role;
create policy formas_pagamento_member_select
  on public.formas_pagamento
  for select
  to authenticated
  using ((select private.user_has_unit(unit_id)));
create policy formas_pagamento_admin_insert
  on public.formas_pagamento
  for insert
  to authenticated
  with check ((select private.is_authenticated_admin()));
create policy formas_pagamento_admin_update
  on public.formas_pagamento
  for update
  to authenticated
  using ((select private.is_authenticated_admin()))
  with check ((select private.is_authenticated_admin()));
create policy formas_pagamento_admin_delete
  on public.formas_pagamento
  for delete
  to authenticated
  using ((select private.is_authenticated_admin()));

-- Preserve the existing authenticated behavior for operational tables with one
-- permissive policy per command. The restrictive tenant boundary remains active.
do $$
declare
  v_table text;
  v_policy record;
begin
  foreach v_table in array array['clientes', 'comanda_itens', 'comandas']
  loop
    for v_policy in
      select policyname
        from pg_policies
       where schemaname = 'public'
         and tablename = v_table
         and policyname <> 'tenant_unit_boundary'
    loop
      execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_table);
    end loop;

    execute format(
      'create policy tenant_member_all on public.%I for all to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null)',
      v_table
    );
  end loop;
end;
$$;

-- Catalog tables keep member reads and admin-only writes without an overlapping
-- FOR ALL policy. Public booking policies remain separate and column-limited.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'agendamentos_blocos',
    'comissoes',
    'grupos_servicos',
    'pacotes_servicos',
    'pacotes_servicos_itens',
    'profissionais',
    'servico_etapas',
    'servicos'
  ]
  loop
    execute format('drop policy if exists tenant_admin_all on public.%I', v_table);
    execute format('drop policy if exists tenant_admin_insert on public.%I', v_table);
    execute format('drop policy if exists tenant_admin_update on public.%I', v_table);
    execute format('drop policy if exists tenant_admin_delete on public.%I', v_table);
    execute format(
      'create policy tenant_admin_insert on public.%I for insert to authenticated with check ((select private.is_authenticated_admin()))',
      v_table
    );
    execute format(
      'create policy tenant_admin_update on public.%I for update to authenticated using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()))',
      v_table
    );
    execute format(
      'create policy tenant_admin_delete on public.%I for delete to authenticated using ((select private.is_authenticated_admin()))',
      v_table
    );
  end loop;
end;
$$;

-- Consolidate legacy policies that were still assigned to PUBLIC.
do $$
declare
  v_table text;
  v_policy record;
begin
  foreach v_table in array array['fornecedores', 'grupos_produtos', 'produtos']
  loop
    for v_policy in
      select policyname
        from pg_policies
       where schemaname = 'public'
         and tablename = v_table
         and policyname <> 'tenant_unit_boundary'
    loop
      execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_table);
    end loop;

    execute format(
      'create policy tenant_member_select on public.%I for select to authenticated using ((select private.user_has_unit(unit_id)))',
      v_table
    );
    execute format(
      'create policy tenant_admin_insert on public.%I for insert to authenticated with check ((select private.is_authenticated_admin()))',
      v_table
    );
    execute format(
      'create policy tenant_admin_update on public.%I for update to authenticated using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()))',
      v_table
    );
    execute format(
      'create policy tenant_admin_delete on public.%I for delete to authenticated using ((select private.is_authenticated_admin()))',
      v_table
    );
  end loop;
end;
$$;

-- usuarios can be read/updated by the owner or an administrator, scoped to unit.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename = 'usuarios'
       and policyname <> 'tenant_unit_boundary'
  loop
    execute format('drop policy if exists %I on public.usuarios', v_policy.policyname);
  end loop;
end;
$$;

create policy usuarios_select_canonical
  on public.usuarios
  for select
  to authenticated
  using (auth_id = (select auth.uid()) or (select private.is_authenticated_admin()));
create policy usuarios_insert_admin
  on public.usuarios
  for insert
  to authenticated
  with check ((select private.is_authenticated_admin()));
create policy usuarios_update_canonical
  on public.usuarios
  for update
  to authenticated
  using (auth_id = (select auth.uid()) or (select private.is_authenticated_admin()))
  with check (auth_id = (select auth.uid()) or (select private.is_authenticated_admin()));
create policy usuarios_delete_admin
  on public.usuarios
  for delete
  to authenticated
  using ((select private.is_authenticated_admin()));

-- units exposes only active, allowlisted columns to anonymous booking clients.
drop policy if exists auth_all_units on public.units;
drop policy if exists authenticated_select_units on public.units;
create policy authenticated_select_units
  on public.units
  for select
  to authenticated
  using ((select private.user_has_unit(id)));

commit;
