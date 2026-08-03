-- Views in Postgres default to the owner's privileges. Force caller privileges
-- so base-table RLS is applied, and remove every anonymous grant.

do $$
declare
  v_view text;
  v_views constant text[] := array[
    'vw_comanda_item_etapas_completas',
    'vw_agendamentos_completos',
    'vw_servicos_com_etapas',
    'vw_profissionais_com_grupos',
    'vw_etapas_agendadas',
    'vw_blocos_ocupados'
  ];
begin
  foreach v_view in array v_views loop
    if exists (
      select 1
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relname = v_view
         and c.relkind = 'v'
    ) then
      execute format('alter view public.%I set (security_invoker = true)', v_view);
      execute format(
        'revoke all privileges on public.%I from public, anon, authenticated',
        v_view
      );
      execute format('grant select on public.%I to authenticated, service_role', v_view);
    end if;
  end loop;

  -- This aggregate exposes payroll, CPF and application-password fields. No
  -- browser flow reads it directly, so keep it backend-only.
  if exists (
    select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'vw_profissionais_com_grupos'
       and c.relkind = 'v'
  ) then
    revoke all privileges on public.vw_profissionais_com_grupos from authenticated;
    grant select on public.vw_profissionais_com_grupos to service_role;
  end if;
end;
$$;

-- This legacy object is a table despite its vw_ prefix. It has no application
-- reads and is intended for privileged automation only.
do $$
begin
  if exists (
    select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'vw_servicos_n8n'
       and c.relkind in ('r', 'p')
  ) then
    alter table public.vw_servicos_n8n enable row level security;
    revoke all privileges on public.vw_servicos_n8n from public, anon, authenticated;
    grant select on public.vw_servicos_n8n to service_role;
  end if;
end;
$$;
