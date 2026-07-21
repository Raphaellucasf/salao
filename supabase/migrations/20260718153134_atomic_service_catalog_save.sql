create table if not exists public.servico_operacoes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  servico_id uuid references public.servicos(id) on delete set null,
  criado_por uuid not null references public.users(id),
  resultado jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists servico_operacoes_servico_id_idx on public.servico_operacoes(servico_id);
create index if not exists servico_operacoes_criado_por_idx on public.servico_operacoes(criado_por);
alter table public.servico_operacoes enable row level security;
revoke all on table public.servico_operacoes from public, anon, authenticated;
grant all on table public.servico_operacoes to service_role;

create or replace function public.save_service_catalog_atomic(
  p_service_id uuid,
  p_payload jsonb,
  p_stages jsonb,
  p_actor_id uuid,
  p_request_id uuid
)
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare
  v_id uuid;
  v_result jsonb;
  v_has_stages boolean;
  v_stage_count integer;
  v_duration integer;
  v_terms text[];
begin
  if p_actor_id is null or p_request_id is null
     or jsonb_typeof(p_payload) <> 'object' or jsonb_typeof(p_stages) <> 'array' then
    raise exception using errcode='22023', message='invalid_service_request';
  end if;
  select resultado into v_result from public.servico_operacoes where request_id=p_request_id;
  if found then return v_result; end if;
  perform 1 from public.users where id=p_actor_id;
  if not found then raise exception using errcode='23503', message='actor_not_found'; end if;

  v_has_stages := coalesce((p_payload->>'tem_etapas')::boolean,false);
  select count(*) into v_stage_count from jsonb_to_recordset(p_stages)
    as x(nome text,descricao text,duracao_minutos integer,pode_ter_auxiliar boolean,exige_profissional boolean,ordem integer);
  if (v_has_stages and (v_stage_count < 1 or v_stage_count > 50))
     or (not v_has_stages and v_stage_count <> 0) then
    raise exception using errcode='22023', message='invalid_service_stages';
  end if;
  if v_has_stages and exists(
    select 1 from jsonb_to_recordset(p_stages)
      as x(nome text,descricao text,duracao_minutos integer,pode_ter_auxiliar boolean,exige_profissional boolean,ordem integer)
    where nullif(btrim(nome),'') is null or length(nome)>160
      or duracao_minutos < 1 or duracao_minutos > 1440 or ordem < 1 or ordem > 50
  ) then raise exception using errcode='22023', message='invalid_service_stage'; end if;

  if v_has_stages then
    select sum(duracao_minutos)::integer into v_duration from jsonb_to_recordset(p_stages)
      as x(nome text,descricao text,duracao_minutos integer,pode_ter_auxiliar boolean,exige_profissional boolean,ordem integer);
  else
    v_duration := (p_payload->>'duracao_minutos')::integer;
  end if;
  if nullif(btrim(p_payload->>'nome'),'') is null or length(p_payload->>'nome')>160
     or (p_payload->>'preco')::numeric < 0 or (p_payload->>'preco')::numeric > 100000000
     or v_duration < 1 or v_duration > 10080 then
    raise exception using errcode='22023', message='invalid_service_payload';
  end if;
  if jsonb_typeof(coalesce(p_payload->'termos_busca','[]'::jsonb)) <> 'array' then
    raise exception using errcode='22023', message='invalid_search_terms';
  end if;
  select coalesce(array_agg(value),array[]::text[]) into v_terms
    from jsonb_array_elements_text(coalesce(p_payload->'termos_busca','[]'::jsonb));

  if p_service_id is null then
    v_id := gen_random_uuid();
    insert into public.servicos(id,codigo,nome,descricao,termos_busca,duracao_minutos,preco,ativo,
      observacoes,grupo_id,tem_etapas,duracao_calculada,usa_produtos)
    values(v_id,nullif(btrim(p_payload->>'codigo'),''),btrim(p_payload->>'nome'),
      nullif(btrim(p_payload->>'descricao'),''),v_terms,v_duration,round((p_payload->>'preco')::numeric,2),
      coalesce((p_payload->>'ativo')::boolean,true),nullif(btrim(p_payload->>'observacoes'),''),
      (p_payload->>'grupo_id')::uuid,v_has_stages,v_has_stages and coalesce((p_payload->>'duracao_calculada')::boolean,false),
      coalesce((p_payload->>'usa_produtos')::boolean,false));
  else
    select id into v_id from public.servicos where id=p_service_id for update;
    if not found then raise exception using errcode='P0002', message='service_not_found'; end if;
    update public.servicos set codigo=nullif(btrim(p_payload->>'codigo'),''),nome=btrim(p_payload->>'nome'),
      descricao=nullif(btrim(p_payload->>'descricao'),''),termos_busca=v_terms,duracao_minutos=v_duration,
      preco=round((p_payload->>'preco')::numeric,2),ativo=coalesce((p_payload->>'ativo')::boolean,true),
      observacoes=nullif(btrim(p_payload->>'observacoes'),''),grupo_id=(p_payload->>'grupo_id')::uuid,
      tem_etapas=v_has_stages,duracao_calculada=v_has_stages and coalesce((p_payload->>'duracao_calculada')::boolean,false),
      usa_produtos=coalesce((p_payload->>'usa_produtos')::boolean,false),updated_at=now()
    where id=v_id;
    delete from public.servico_etapas where servico_id=v_id;
  end if;
  if v_has_stages then
    insert into public.servico_etapas(servico_id,ordem,nome,descricao,duracao_minutos,pode_ter_auxiliar,exige_profissional,ativo)
    select v_id,ordem,btrim(nome),nullif(btrim(descricao),''),duracao_minutos,
      coalesce(pode_ter_auxiliar,true),coalesce(exige_profissional,true),true
    from jsonb_to_recordset(p_stages)
      as x(nome text,descricao text,duracao_minutos integer,pode_ter_auxiliar boolean,exige_profissional boolean,ordem integer);
  end if;
  v_result:=jsonb_build_object('service_id',v_id,'stage_count',v_stage_count,'duration_minutes',v_duration);
  insert into public.servico_operacoes(request_id,servico_id,criado_por,resultado)
  values(p_request_id,v_id,p_actor_id,v_result);
  return v_result;
end; $$;

revoke all on function public.save_service_catalog_atomic(uuid,jsonb,jsonb,uuid,uuid) from public,anon,authenticated;
grant execute on function public.save_service_catalog_atomic(uuid,jsonb,jsonb,uuid,uuid) to service_role;
