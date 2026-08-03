create schema if not exists private;
create schema if not exists extensions;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_authenticated_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select exists (
    select 1
      from public.users u
     where u.id = (select auth.uid())
       and u.role = 'admin'
  ) and exists (
    select 1
      from public.user_units uu
     where uu.user_id = (select auth.uid())
       and uu.is_active is true
       and uu.is_default is true
  );
$$;
revoke all on function private.is_authenticated_admin() from public, anon;
grant execute on function private.is_authenticated_admin() to authenticated, service_role;

create or replace function private.user_has_unit(p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select p_unit_id is not null and exists (
    select 1
      from public.user_units uu
     where uu.user_id = (select auth.uid())
       and uu.unit_id = p_unit_id
       and uu.is_active is true
  );
$$;
revoke all on function private.user_has_unit(uuid) from public, anon;
grant execute on function private.user_has_unit(uuid) to authenticated, service_role;

create or replace function private.current_request_unit()
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_unit_id uuid;
  v_header text;
  v_role text;
begin
  if (select auth.uid()) is not null then
    select uu.unit_id
      into v_unit_id
      from public.user_units uu
     where uu.user_id = (select auth.uid())
       and uu.is_active is true
       and uu.is_default is true
     limit 1;
    return v_unit_id;
  end if;

  begin
    v_header := current_setting('request.headers', true)::jsonb ->> 'x-unit-id';
    if v_header is not null then
      v_unit_id := v_header::uuid;
      if exists (select 1 from public.units u where u.id = v_unit_id and u.is_active is true) then
        return v_unit_id;
      end if;
    end if;
  exception when others then
    null;
  end;

  begin
    v_role := coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      current_setting('request.jwt.claims', true)::jsonb ->> 'role'
    );
  exception when others then
    v_role := null;
  end;

  if v_role = 'service_role' then
    select min(uu.unit_id::text)::uuid
      into v_unit_id
      from public.user_units uu
     where uu.is_active is true
       and uu.is_default is true
    having count(distinct uu.unit_id) = 1;
  end if;
  return v_unit_id;
end;
$$;
revoke all on function private.current_request_unit() from public, anon;
grant execute on function private.current_request_unit() to authenticated, service_role;

-- These operation tables are used by the idempotent catalog RPCs below.
create table if not exists public.servico_operacoes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  servico_id uuid references public.servicos(id) on delete set null,
  unit_id uuid not null references public.units(id) on delete restrict,
  criado_por uuid not null references public.users(id),
  resultado jsonb not null,
  created_at timestamptz not null default now(),
  unique (unit_id, request_id)
);
create table if not exists public.pacote_operacoes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  pacote_id uuid references public.pacotes_servicos(id) on delete set null,
  unit_id uuid not null references public.units(id) on delete restrict,
  criado_por uuid not null references public.users(id),
  resultado jsonb not null,
  created_at timestamptz not null default now(),
  unique (unit_id, request_id)
);
create index if not exists servico_operacoes_unit_id_idx on public.servico_operacoes(unit_id);
create index if not exists pacote_operacoes_unit_id_idx on public.pacote_operacoes(unit_id);
alter table public.servico_operacoes enable row level security;
alter table public.pacote_operacoes enable row level security;
revoke all on table public.servico_operacoes, public.pacote_operacoes from public, anon, authenticated;
grant all on table public.servico_operacoes, public.pacote_operacoes to service_role;

-- Narrow production step: catalog RPCs and the tables that feed agenda/package flows.
-- This migration is intentionally limited so it can be verified before the remaining
-- business tables are migrated.

do $$
declare
  v_table text;
  v_policy record;
  v_target_unit uuid;
  v_tables constant text[] := array[
    'agendamentos_blocos','comissoes','grupos_servicos','pacotes_servicos',
    'pacotes_servicos_itens','profissionais','servico_etapas','servicos'
  ];
begin
  select min(uu.unit_id::text)::uuid into v_target_unit
    from public.user_units uu
   where uu.is_active is true and uu.is_default is true
  having count(distinct uu.unit_id) = 1;
  if v_target_unit is null then
    raise exception using errcode = '23514', message = 'CATALOG_REPAIR_REQUIRES_ONE_ACTIVE_DEFAULT_UNIT';
  end if;

  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is null then continue; end if;
    execute format('alter table public.%I add column if not exists unit_id uuid', v_table);
    execute format('update public.%I set unit_id = $1 where unit_id is null', v_table) using v_target_unit;
    execute format('alter table public.%I alter column unit_id set default private.current_request_unit()', v_table);
    execute format('alter table public.%I alter column unit_id set not null', v_table);
    if not exists (
      select 1 from pg_constraint c where c.conrelid = format('public.%I', v_table)::regclass
        and c.conname = left(v_table || '_unit_id_fkey', 63)
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (unit_id) references public.units(id) on delete restrict',
        v_table, left(v_table || '_unit_id_fkey', 63)
      );
    end if;
    execute format('create index if not exists %I on public.%I(unit_id)', left(v_table || '_unit_id_idx',63), v_table);
    execute format('alter table public.%I enable row level security', v_table);

    for v_policy in select policyname from pg_policies where schemaname='public' and tablename=v_table loop
      execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_table);
    end loop;

    execute format('revoke all on table public.%I from public, anon, authenticated', v_table);
    execute format('grant all on table public.%I to service_role', v_table);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', v_table);
    execute format(
      'create policy tenant_unit_boundary on public.%I as restrictive for all to authenticated using ((select private.user_has_unit(unit_id))) with check ((select private.user_has_unit(unit_id)))',
      v_table
    );
    execute format(
      'create policy tenant_member_select on public.%I for select to authenticated using ((select private.user_has_unit(unit_id)))',
      v_table
    );
    execute format(
      'create policy tenant_admin_all on public.%I for all to authenticated using ((select private.is_authenticated_admin()) and (select private.user_has_unit(unit_id))) with check ((select private.is_authenticated_admin()) and (select private.user_has_unit(unit_id)))',
      v_table
    );
  end loop;
end;
$$;

create index if not exists agendamentos_blocos_agendamento_id_idx on public.agendamentos_blocos(agendamento_id);
create index if not exists agendamentos_blocos_etapa_id_idx on public.agendamentos_blocos(etapa_id);
create index if not exists agendamentos_blocos_profissional_id_idx on public.agendamentos_blocos(profissional_id);
create index if not exists comissoes_criado_por_idx on public.comissoes(criado_por);
create index if not exists comissoes_profissional_id_idx on public.comissoes(profissional_id);
create index if not exists pacotes_servicos_itens_pacote_id_idx on public.pacotes_servicos_itens(pacote_id);
create index if not exists pacotes_servicos_itens_servico_id_idx on public.pacotes_servicos_itens(servico_id);
create index if not exists servicos_grupo_id_idx on public.servicos(grupo_id);
create index if not exists servico_operacoes_servico_id_idx on public.servico_operacoes(servico_id);
create index if not exists servico_operacoes_criado_por_idx on public.servico_operacoes(criado_por);
create index if not exists pacote_operacoes_pacote_id_idx on public.pacote_operacoes(pacote_id);
create index if not exists pacote_operacoes_criado_por_idx on public.pacote_operacoes(criado_por);

-- Anonymous booking needs only the public catalog columns, never sensitive staff data.
revoke all on table public.servicos from anon;
grant select (id, unit_id, nome, categoria, preco, duracao_minutos, ativo, grupo_id, aceita_agendamento) on public.servicos to anon;
create policy servicos_public_active_select on public.servicos for select to anon
  using (ativo is true and coalesce(aceita_agendamento, true) is true);

revoke all on table public.servico_etapas from anon;
grant select (id, servico_id, ordem, nome, descricao, duracao_minutos, pode_ter_auxiliar, exige_profissional, ativo) on public.servico_etapas to anon;
create policy servico_etapas_public_active_select on public.servico_etapas for select to anon using (ativo is true);

revoke all on table public.grupos_servicos from anon;
grant select (id, nome, cor, icone, ativo) on public.grupos_servicos to anon;
create policy grupos_servicos_public_active_select on public.grupos_servicos for select to anon using (ativo is true);

revoke all on table public.profissionais from anon;
grant select (id, unit_id, nome, ativo, cor_agenda, foto_url) on public.profissionais to anon;
create policy profissionais_public_active_select on public.profissionais for select to anon using (ativo is true);

revoke all on table public.units from anon;
grant select (id, name, address, is_active) on public.units to anon;
drop policy if exists anon_select_units on public.units;
create policy units_public_active_select on public.units for select to anon using (is_active is true);

-- Atomic service catalog save, including tenant ownership and idempotency.
create or replace function public.save_service_catalog_atomic(
  p_service_id uuid,
  p_payload jsonb,
  p_stages jsonb,
  p_actor_id uuid,
  p_request_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_id uuid;
  v_unit_id uuid;
  v_result jsonb;
  v_has_stages boolean;
  v_stage_count integer;
  v_duration integer;
  v_terms text[];
begin
  v_unit_id := private.current_request_unit();
  if p_actor_id is null or p_request_id is null or v_unit_id is null
     or coalesce(jsonb_typeof(p_payload), 'null') <> 'object'
     or coalesce(jsonb_typeof(p_stages), 'null') <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_service_request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select resultado into v_result from public.servico_operacoes where request_id = p_request_id and unit_id = v_unit_id;
  if found then return v_result; end if;
  if not exists (
    select 1
      from public.users u
      join public.user_units uu on uu.user_id = u.id
     where u.id = p_actor_id
       and u.role = 'admin'
       and uu.unit_id = v_unit_id
       and uu.is_active is true
  ) then
    raise exception using errcode = '42501', message = 'actor_not_authorized_for_unit';
  end if;

  v_has_stages := coalesce((p_payload ->> 'tem_etapas')::boolean, false);
  select count(*) into v_stage_count from jsonb_to_recordset(p_stages)
    as x(nome text, descricao text, duracao_minutos integer, pode_ter_auxiliar boolean, exige_profissional boolean, ordem integer);
  if (v_has_stages and (v_stage_count < 1 or v_stage_count > 50)) or (not v_has_stages and v_stage_count <> 0) then
    raise exception using errcode = '22023', message = 'invalid_service_stages';
  end if;
  if v_has_stages and exists (
    select 1 from jsonb_to_recordset(p_stages)
      as x(nome text, descricao text, duracao_minutos integer, pode_ter_auxiliar boolean, exige_profissional boolean, ordem integer)
     where nullif(btrim(nome), '') is null or length(nome) > 160
        or duracao_minutos < 1 or duracao_minutos > 1440 or ordem < 1 or ordem > 50
  ) then
    raise exception using errcode = '22023', message = 'invalid_service_stage';
  end if;
  if v_has_stages then
    select sum(duracao_minutos)::integer into v_duration from jsonb_to_recordset(p_stages)
      as x(nome text, descricao text, duracao_minutos integer, pode_ter_auxiliar boolean, exige_profissional boolean, ordem integer);
  else
    v_duration := (p_payload ->> 'duracao_minutos')::integer;
  end if;
  if nullif(btrim(p_payload ->> 'nome'), '') is null or length(p_payload ->> 'nome') > 160
     or (p_payload ->> 'preco')::numeric < 0 or (p_payload ->> 'preco')::numeric > 100000000
     or v_duration < 1 or v_duration > 10080 then
    raise exception using errcode = '22023', message = 'invalid_service_payload';
  end if;
  if jsonb_typeof(coalesce(p_payload -> 'termos_busca', '[]'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_search_terms';
  end if;
  if not exists (
    select 1 from public.grupos_servicos
     where id = (p_payload ->> 'grupo_id')::uuid and unit_id = v_unit_id and coalesce(ativo, true)
  ) then
    raise exception using errcode = '23503', message = 'service_group_not_found';
  end if;
  select coalesce(array_agg(value), array[]::text[]) into v_terms
    from jsonb_array_elements_text(coalesce(p_payload -> 'termos_busca', '[]'::jsonb));

  if p_service_id is null then
    v_id := gen_random_uuid();
    insert into public.servicos(
      id, codigo, nome, descricao, termos_busca, duracao_minutos, preco, ativo,
      observacoes, grupo_id, tem_etapas, duracao_calculada, usa_produtos, unit_id
    ) values (
      v_id, nullif(btrim(p_payload ->> 'codigo'), ''), btrim(p_payload ->> 'nome'),
      nullif(btrim(p_payload ->> 'descricao'), ''), v_terms, v_duration,
      round((p_payload ->> 'preco')::numeric, 2), coalesce((p_payload ->> 'ativo')::boolean, true),
      nullif(btrim(p_payload ->> 'observacoes'), ''), (p_payload ->> 'grupo_id')::uuid,
      v_has_stages, v_has_stages and coalesce((p_payload ->> 'duracao_calculada')::boolean, false),
      coalesce((p_payload ->> 'usa_produtos')::boolean, false), v_unit_id
    );
  else
    select id into v_id from public.servicos where id = p_service_id and unit_id = v_unit_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'service_not_found'; end if;
    update public.servicos set
      codigo = nullif(btrim(p_payload ->> 'codigo'), ''), nome = btrim(p_payload ->> 'nome'),
      descricao = nullif(btrim(p_payload ->> 'descricao'), ''), termos_busca = v_terms,
      duracao_minutos = v_duration, preco = round((p_payload ->> 'preco')::numeric, 2),
      ativo = coalesce((p_payload ->> 'ativo')::boolean, true),
      observacoes = nullif(btrim(p_payload ->> 'observacoes'), ''), grupo_id = (p_payload ->> 'grupo_id')::uuid,
      tem_etapas = v_has_stages,
      duracao_calculada = v_has_stages and coalesce((p_payload ->> 'duracao_calculada')::boolean, false),
      usa_produtos = coalesce((p_payload ->> 'usa_produtos')::boolean, false), updated_at = now()
    where id = v_id and unit_id = v_unit_id;
    delete from public.servico_etapas where servico_id = v_id and unit_id = v_unit_id;
  end if;

  if v_has_stages then
    insert into public.servico_etapas(
      id, servico_id, unit_id, ordem, nome, descricao, duracao_minutos,
      pode_ter_auxiliar, exige_profissional, ativo
    )
    select gen_random_uuid(), v_id, v_unit_id, ordem, btrim(nome), nullif(btrim(descricao), ''), duracao_minutos,
      coalesce(pode_ter_auxiliar, true), coalesce(exige_profissional, true), true
      from jsonb_to_recordset(p_stages)
        as x(nome text, descricao text, duracao_minutos integer, pode_ter_auxiliar boolean, exige_profissional boolean, ordem integer);
  end if;
  v_result := jsonb_build_object('service_id', v_id, 'stage_count', v_stage_count, 'duration_minutes', v_duration);
  insert into public.servico_operacoes(request_id, servico_id, unit_id, criado_por, resultado)
    values (p_request_id, v_id, v_unit_id, p_actor_id, v_result);
  return v_result;
end;
$$;

-- Atomic package catalog save, including tenant ownership and idempotency.
create or replace function public.save_service_package_atomic(
  p_package_id uuid,
  p_payload jsonb,
  p_items jsonb,
  p_actor_id uuid,
  p_request_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_package_id uuid;
  v_unit_id uuid;
  v_item_count integer;
  v_distinct_count integer;
  v_original numeric(14,2);
  v_duration integer;
  v_total numeric(14,2);
  v_result jsonb;
begin
  v_unit_id := private.current_request_unit();
  if p_actor_id is null or p_request_id is null or v_unit_id is null
     or coalesce(jsonb_typeof(p_payload), 'null') <> 'object'
     or coalesce(jsonb_typeof(p_items), 'null') <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_package_request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select resultado into v_result from public.pacote_operacoes where request_id = p_request_id and unit_id = v_unit_id;
  if found then return v_result; end if;
  if not exists (
    select 1
      from public.users u
      join public.user_units uu on uu.user_id = u.id
     where u.id = p_actor_id
       and u.role = 'admin'
       and uu.unit_id = v_unit_id
       and uu.is_active is true
  ) then
    raise exception using errcode = '42501', message = 'actor_not_authorized_for_unit';
  end if;
  select count(*), count(distinct item.servico_id) into v_item_count, v_distinct_count
    from jsonb_to_recordset(p_items) as item(servico_id uuid, quantidade integer, ordem integer);
  if v_item_count < 1 or v_item_count > 100 or v_distinct_count <> v_item_count then
    raise exception using errcode = '22023', message = 'invalid_package_items';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as item(servico_id uuid, quantidade integer, ordem integer)
     where item.servico_id is null or item.quantidade is null or item.quantidade < 1 or item.quantidade > 1000
        or item.ordem is null or item.ordem < 1 or item.ordem > 100
  ) then
    raise exception using errcode = '22023', message = 'invalid_package_item';
  end if;
  select round(sum(s.preco * item.quantidade), 2), sum(coalesce(s.duracao_minutos, s.duracao, 0) * item.quantidade)::integer
    into v_original, v_duration
    from jsonb_to_recordset(p_items) as item(servico_id uuid, quantidade integer, ordem integer)
    join public.servicos s on s.id = item.servico_id and s.unit_id = v_unit_id and s.ativo is true;
  if v_original is null or v_duration is null or v_item_count <> (
    select count(*) from jsonb_to_recordset(p_items) as item(servico_id uuid, quantidade integer, ordem integer)
      join public.servicos s on s.id = item.servico_id and s.unit_id = v_unit_id and s.ativo is true
  ) then
    raise exception using errcode = '23503', message = 'package_service_not_found';
  end if;
  v_total := round((p_payload ->> 'preco_total')::numeric, 2);
  if nullif(btrim(p_payload ->> 'nome'), '') is null or v_total <= 0 or v_total > 100000000 or v_duration < 1 then
    raise exception using errcode = '22023', message = 'invalid_package_payload';
  end if;

  if p_package_id is null then
    v_package_id := gen_random_uuid();
    insert into public.pacotes_servicos(
      id, unit_id, codigo, nome, descricao, preco_total, preco_original, desconto_percentual,
      duracao_total_minutos, ativo, validade_dias, permite_parcelamento, max_parcelas, cor, icone, observacoes, termos_uso
    ) values (
      v_package_id, v_unit_id, nullif(btrim(p_payload ->> 'codigo'), ''), btrim(p_payload ->> 'nome'),
      nullif(btrim(p_payload ->> 'descricao'), ''), v_total, v_original,
      case when v_original > 0 then round(((v_original - v_total) / v_original) * 100, 2) else 0 end,
      v_duration, coalesce((p_payload ->> 'ativo')::boolean, true), (p_payload ->> 'validade_dias')::integer,
      coalesce((p_payload ->> 'permite_parcelamento')::boolean, true), (p_payload ->> 'max_parcelas')::integer,
      nullif(btrim(p_payload ->> 'cor'), ''), nullif(btrim(p_payload ->> 'icone'), ''),
      nullif(btrim(p_payload ->> 'observacoes'), ''), nullif(btrim(p_payload ->> 'termos_uso'), '')
    );
  else
    select id into v_package_id from public.pacotes_servicos where id = p_package_id and unit_id = v_unit_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'service_package_not_found'; end if;
    update public.pacotes_servicos set
      codigo = nullif(btrim(p_payload ->> 'codigo'), ''), nome = btrim(p_payload ->> 'nome'),
      descricao = nullif(btrim(p_payload ->> 'descricao'), ''), preco_total = v_total, preco_original = v_original,
      desconto_percentual = case when v_original > 0 then round(((v_original - v_total) / v_original) * 100, 2) else 0 end,
      duracao_total_minutos = v_duration, ativo = coalesce((p_payload ->> 'ativo')::boolean, true),
      validade_dias = (p_payload ->> 'validade_dias')::integer,
      permite_parcelamento = coalesce((p_payload ->> 'permite_parcelamento')::boolean, true),
      max_parcelas = (p_payload ->> 'max_parcelas')::integer, cor = nullif(btrim(p_payload ->> 'cor'), ''),
      icone = nullif(btrim(p_payload ->> 'icone'), ''), observacoes = nullif(btrim(p_payload ->> 'observacoes'), ''),
      termos_uso = nullif(btrim(p_payload ->> 'termos_uso'), ''), updated_at = now()
     where id = v_package_id and unit_id = v_unit_id;
    delete from public.pacotes_servicos_itens where pacote_id = v_package_id and unit_id = v_unit_id;
  end if;

  insert into public.pacotes_servicos_itens(unit_id, pacote_id, servico_id, quantidade, ordem, preco_unitario)
    select v_unit_id, v_package_id, item.servico_id, item.quantidade, item.ordem, s.preco
      from jsonb_to_recordset(p_items) as item(servico_id uuid, quantidade integer, ordem integer)
      join public.servicos s on s.id = item.servico_id and s.unit_id = v_unit_id and s.ativo is true;
  v_result := jsonb_build_object('package_id', v_package_id, 'item_count', v_item_count,
    'original_price', v_original, 'total_price', v_total, 'duration_minutes', v_duration);
  insert into public.pacote_operacoes(request_id, pacote_id, unit_id, criado_por, resultado)
    values (p_request_id, v_package_id, v_unit_id, p_actor_id, v_result);
  return v_result;
end;
$$;

create or replace function public.delete_service_catalog_atomic(p_service_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, private, extensions
as $$
declare v_unit_id uuid;
begin
  v_unit_id := private.current_request_unit();
  if not exists (select 1 from public.servicos where id = p_service_id and unit_id = v_unit_id) then
    raise exception using errcode = 'P0002', message = 'service_not_found';
  end if;
  delete from public.servico_etapas where servico_id = p_service_id and unit_id = v_unit_id;
  delete from public.servicos where id = p_service_id and unit_id = v_unit_id;
  return jsonb_build_object('id', p_service_id);
end;
$$;

revoke all on function public.save_service_catalog_atomic(uuid, jsonb, jsonb, uuid, uuid) from public, anon, authenticated;
grant execute on function public.save_service_catalog_atomic(uuid, jsonb, jsonb, uuid, uuid) to service_role;
revoke all on function public.save_service_package_atomic(uuid, jsonb, jsonb, uuid, uuid) from public, anon, authenticated;
grant execute on function public.save_service_package_atomic(uuid, jsonb, jsonb, uuid, uuid) to service_role;
revoke all on function public.delete_service_catalog_atomic(uuid) from public, anon, authenticated;
grant execute on function public.delete_service_catalog_atomic(uuid) to service_role;
