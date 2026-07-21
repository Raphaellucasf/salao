create table if not exists public.pacote_consumos (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  cliente_id bigint not null references public.clientes(id) on delete restrict,
  servico_id uuid not null references public.servicos(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  request_id uuid not null unique,
  criado_por uuid references public.users(id) on delete set null,
  detalhes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.pacote_consumos enable row level security;
revoke all on table public.pacote_consumos from anon, authenticated;
grant select, insert on table public.pacote_consumos to service_role;
create index if not exists pacote_consumos_cliente_servico_idx
  on public.pacote_consumos (cliente_id, servico_id, created_at desc);

create or replace function public.consume_package_sessions_atomic(
  p_unit_id uuid,
  p_client_id bigint,
  p_service_id uuid,
  p_quantity integer,
  p_actor_id uuid,
  p_request_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_existing public.pacote_consumos%rowtype;
  v_package record;
  v_available integer := 0;
  v_remaining integer := p_quantity;
  v_take integer;
  v_details jsonb := '[]'::jsonb;
begin
  if p_unit_id is null or p_client_id is null or p_client_id <= 0 or p_service_id is null
     or p_actor_id is null or p_request_id is null or p_quantity is null
     or p_quantity <= 0 or p_quantity > 1000 then
    raise exception using errcode = '22023', message = 'invalid_package_consumption';
  end if;

  select * into v_existing from public.pacote_consumos where request_id = p_request_id;
  if found then
    return jsonb_build_object('consumption_id', v_existing.id, 'details', v_existing.detalhes, 'replayed', true);
  end if;

  for v_package in
    select id, sessoes_total, sessoes_consumidas
    from public.pacotes_cliente
    where unit_id = p_unit_id and cliente_id = p_client_id and servico_id = p_service_id
      and (data_validade is null or data_validade >= current_date)
      and sessoes_consumidas < sessoes_total
    order by criado_em, id
    for update
  loop
    v_available := v_available + (v_package.sessoes_total - v_package.sessoes_consumidas);
  end loop;

  if v_available < p_quantity then
    raise exception using errcode = '22003', message = 'insufficient_package_balance';
  end if;

  for v_package in
    select id, sessoes_total, sessoes_consumidas
    from public.pacotes_cliente
    where unit_id = p_unit_id and cliente_id = p_client_id and servico_id = p_service_id
      and (data_validade is null or data_validade >= current_date)
      and sessoes_consumidas < sessoes_total
    order by criado_em, id
    for update
  loop
    exit when v_remaining = 0;
    v_take := least(v_remaining, v_package.sessoes_total - v_package.sessoes_consumidas);
    update public.pacotes_cliente
    set sessoes_consumidas = sessoes_consumidas + v_take
    where id = v_package.id;
    v_details := v_details || jsonb_build_array(jsonb_build_object('package_id', v_package.id, 'quantity', v_take));
    v_remaining := v_remaining - v_take;
  end loop;

  insert into public.pacote_consumos
    (unit_id, cliente_id, servico_id, quantidade, request_id, criado_por, detalhes)
  values
    (p_unit_id, p_client_id, p_service_id, p_quantity, p_request_id, p_actor_id, v_details)
  returning * into v_existing;

  return jsonb_build_object('consumption_id', v_existing.id, 'details', v_details, 'replayed', false);
end;
$$;

revoke all on function public.consume_package_sessions_atomic(uuid,bigint,uuid,integer,uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.consume_package_sessions_atomic(uuid,bigint,uuid,integer,uuid,uuid)
  to service_role;
