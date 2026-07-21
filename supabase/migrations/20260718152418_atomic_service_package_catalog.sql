create unique index if not exists pacotes_servicos_itens_pacote_servico_uidx
  on public.pacotes_servicos_itens (pacote_id, servico_id);

create table if not exists public.pacote_operacoes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  pacote_id uuid references public.pacotes_servicos(id) on delete set null,
  criado_por uuid not null references public.users(id),
  resultado jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists pacote_operacoes_pacote_id_idx on public.pacote_operacoes (pacote_id);
create index if not exists pacote_operacoes_criado_por_idx on public.pacote_operacoes (criado_por);

alter table public.pacote_operacoes enable row level security;
revoke all on table public.pacote_operacoes from public, anon, authenticated;
grant all on table public.pacote_operacoes to service_role;

-- Keep the existing read contract, but force every catalog mutation through
-- an admin API route and the atomic function below.
revoke insert, update, delete, truncate, references, trigger
  on table public.pacotes_servicos from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.pacotes_servicos_itens from anon, authenticated;

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
set search_path = pg_catalog, public
as $$
declare
  v_package_id uuid;
  v_item_count integer;
  v_distinct_count integer;
  v_original numeric(14,2);
  v_duration integer;
  v_total numeric(14,2);
  v_result jsonb;
begin
  if p_actor_id is null or p_request_id is null
     or pg_catalog.jsonb_typeof(p_payload) <> 'object'
     or pg_catalog.jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_package_request';
  end if;

  select resultado into v_result
    from public.pacote_operacoes
   where request_id = p_request_id;
  if found then return v_result; end if;

  perform 1 from public.users where id = p_actor_id;
  if not found then
    raise exception using errcode = '23503', message = 'actor_not_found';
  end if;

  select count(*), count(distinct item.servico_id)
    into v_item_count, v_distinct_count
    from pg_catalog.jsonb_to_recordset(p_items)
      as item(servico_id uuid, quantidade integer, ordem integer);

  if v_item_count < 1 or v_item_count > 100 or v_distinct_count <> v_item_count then
    raise exception using errcode = '22023', message = 'invalid_package_items';
  end if;

  if exists (
    select 1
      from pg_catalog.jsonb_to_recordset(p_items)
        as item(servico_id uuid, quantidade integer, ordem integer)
     where item.servico_id is null or item.quantidade is null
        or item.quantidade < 1 or item.quantidade > 1000
        or item.ordem is null or item.ordem < 1 or item.ordem > 100
  ) then
    raise exception using errcode = '22023', message = 'invalid_package_item';
  end if;

  select
    pg_catalog.round(sum(s.preco * item.quantidade), 2),
    sum(coalesce(s.duracao_minutos, s.duracao, 0) * item.quantidade)::integer
    into v_original, v_duration
    from pg_catalog.jsonb_to_recordset(p_items)
      as item(servico_id uuid, quantidade integer, ordem integer)
    join public.servicos s on s.id = item.servico_id and s.ativo is true;

  if v_original is null or v_duration is null
     or (select count(*) from pg_catalog.jsonb_to_recordset(p_items)
           as item(servico_id uuid, quantidade integer, ordem integer))
        <> (select count(*) from pg_catalog.jsonb_to_recordset(p_items)
           as item(servico_id uuid, quantidade integer, ordem integer)
           join public.servicos s on s.id = item.servico_id and s.ativo is true) then
    raise exception using errcode = '23503', message = 'package_service_not_found';
  end if;

  v_total := pg_catalog.round((p_payload ->> 'preco_total')::numeric, 2);
  if pg_catalog.length(pg_catalog.btrim(p_payload ->> 'nome')) < 1
     or v_total <= 0 or v_total > 100000000
     or v_duration < 1 then
    raise exception using errcode = '22023', message = 'invalid_package_payload';
  end if;

  if p_package_id is null then
    v_package_id := gen_random_uuid();
    insert into public.pacotes_servicos (
      id, codigo, nome, descricao, preco_total, preco_original,
      desconto_percentual, duracao_total_minutos, ativo, validade_dias,
      permite_parcelamento, max_parcelas, cor, icone, observacoes, termos_uso
    ) values (
      v_package_id,
      nullif(pg_catalog.btrim(p_payload ->> 'codigo'), ''),
      pg_catalog.btrim(p_payload ->> 'nome'),
      nullif(pg_catalog.btrim(p_payload ->> 'descricao'), ''),
      v_total,
      v_original,
      case when v_original > 0 then pg_catalog.round(((v_original - v_total) / v_original) * 100, 2) else 0 end,
      v_duration,
      coalesce((p_payload ->> 'ativo')::boolean, true),
      (p_payload ->> 'validade_dias')::integer,
      coalesce((p_payload ->> 'permite_parcelamento')::boolean, true),
      (p_payload ->> 'max_parcelas')::integer,
      nullif(pg_catalog.btrim(p_payload ->> 'cor'), ''),
      nullif(pg_catalog.btrim(p_payload ->> 'icone'), ''),
      nullif(pg_catalog.btrim(p_payload ->> 'observacoes'), ''),
      nullif(pg_catalog.btrim(p_payload ->> 'termos_uso'), '')
    );
  else
    select id into v_package_id
      from public.pacotes_servicos
     where id = p_package_id
     for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'service_package_not_found';
    end if;

    update public.pacotes_servicos set
      codigo = nullif(pg_catalog.btrim(p_payload ->> 'codigo'), ''),
      nome = pg_catalog.btrim(p_payload ->> 'nome'),
      descricao = nullif(pg_catalog.btrim(p_payload ->> 'descricao'), ''),
      preco_total = v_total,
      preco_original = v_original,
      desconto_percentual = case when v_original > 0 then pg_catalog.round(((v_original - v_total) / v_original) * 100, 2) else 0 end,
      duracao_total_minutos = v_duration,
      ativo = coalesce((p_payload ->> 'ativo')::boolean, true),
      validade_dias = (p_payload ->> 'validade_dias')::integer,
      permite_parcelamento = coalesce((p_payload ->> 'permite_parcelamento')::boolean, true),
      max_parcelas = (p_payload ->> 'max_parcelas')::integer,
      cor = nullif(pg_catalog.btrim(p_payload ->> 'cor'), ''),
      icone = nullif(pg_catalog.btrim(p_payload ->> 'icone'), ''),
      observacoes = nullif(pg_catalog.btrim(p_payload ->> 'observacoes'), ''),
      termos_uso = nullif(pg_catalog.btrim(p_payload ->> 'termos_uso'), ''),
      updated_at = now()
    where id = v_package_id;

    delete from public.pacotes_servicos_itens where pacote_id = v_package_id;
  end if;

  insert into public.pacotes_servicos_itens (
    pacote_id, servico_id, quantidade, ordem, preco_unitario
  )
  select v_package_id, item.servico_id, item.quantidade, item.ordem, s.preco
    from pg_catalog.jsonb_to_recordset(p_items)
      as item(servico_id uuid, quantidade integer, ordem integer)
    join public.servicos s on s.id = item.servico_id and s.ativo is true;

  v_result := pg_catalog.jsonb_build_object(
    'package_id', v_package_id,
    'item_count', v_item_count,
    'original_price', v_original,
    'total_price', v_total,
    'duration_minutes', v_duration
  );

  insert into public.pacote_operacoes (request_id, pacote_id, criado_por, resultado)
  values (p_request_id, v_package_id, p_actor_id, v_result);

  return v_result;
end;
$$;

revoke all on function public.save_service_package_atomic(uuid, jsonb, jsonb, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.save_service_package_atomic(uuid, jsonb, jsonb, uuid, uuid)
  to service_role;
