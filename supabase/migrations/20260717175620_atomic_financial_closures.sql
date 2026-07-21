-- BUG-02: fechamento financeiro atomico e idempotente.
-- Aplicar primeiro em teste. As funcoes sao SECURITY INVOKER e ficam expostas
-- somente ao service_role usado pelas API routes autenticadas.

alter table public.transacoes
  add column if not exists comanda_id bigint references public.comandas(id) on delete set null,
  add column if not exists agendamento_id uuid references public.agendamentos(id) on delete set null,
  add column if not exists request_id uuid,
  add column if not exists criado_por uuid references public.users(id) on delete set null;

create unique index if not exists transacoes_receita_comanda_uidx
  on public.transacoes (comanda_id)
  where comanda_id is not null and tipo = 'receita';

create unique index if not exists transacoes_agendamento_uidx
  on public.transacoes (agendamento_id)
  where agendamento_id is not null;

create unique index if not exists transacoes_request_uidx
  on public.transacoes (request_id)
  where request_id is not null;

create unique index if not exists comissoes_comanda_profissional_uidx
  on public.comissoes (comanda_id, profissional_id);

create unique index if not exists pacotes_cliente_origem_servico_uidx
  on public.pacotes_cliente (comanda_origem_id, servico_id)
  where comanda_origem_id is not null;

-- A sequence ja existe no schema legado, mas era ignorada pelas funcoes.
select setval(
  'public.comandas_numero_seq',
  coalesce((select max(numero_comanda) + 1 from public.comandas), 1),
  false
);

create or replace function public.gerar_numero_comanda()
returns integer
language sql
volatile
set search_path = pg_catalog, public
as $$
  select nextval('public.comandas_numero_seq')::integer;
$$;

create or replace function public.set_numero_comanda()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.numero_comanda is null or new.numero_comanda = 0 then
    new.numero_comanda := nextval('public.comandas_numero_seq')::integer;
  end if;
  return new;
end;
$$;

create or replace function public.close_appointment_atomic(
  p_appointment_id uuid,
  p_payment_method text,
  p_admin_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_appointment public.agendamentos%rowtype;
  v_transaction_id bigint;
  v_service_value numeric(14,2);
  v_commission_percentage numeric(7,4) := 0;
  v_commission_amount numeric(14,2) := 0;
begin
  if p_payment_method not in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito') then
    raise exception using errcode = '22023', message = 'INVALID_PAYMENT_METHOD';
  end if;

  select * into v_appointment
  from public.agendamentos
  where id = p_appointment_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'APPOINTMENT_NOT_FOUND';
  end if;

  if v_appointment.comanda_id is not null then
    raise exception using errcode = '23514', message = 'APPOINTMENT_HAS_COMANDA';
  end if;

  select id into v_transaction_id
  from public.transacoes
  where agendamento_id = p_appointment_id;

  if v_appointment.status = 'concluido' then
    return jsonb_build_object(
      'appointment_id', p_appointment_id,
      'transaction_id', v_transaction_id,
      'duplicate', true
    );
  end if;

  if v_appointment.status = 'cancelado' then
    raise exception using errcode = '23514', message = 'APPOINTMENT_CANCELLED';
  end if;

  v_service_value := round(coalesce(v_appointment.valor_total, 0), 2);
  if v_service_value < 0 then
    raise exception using errcode = '23514', message = 'INVALID_APPOINTMENT_VALUE';
  end if;

  if v_appointment.profissional_id is not null then
    select case when coalesce(recebe_comissao, true)
      then coalesce(percentual_comissao, 0) else 0 end
    into v_commission_percentage
    from public.profissionais
    where id = v_appointment.profissional_id;
  end if;

  if v_commission_percentage < 0 or v_commission_percentage > 100 then
    raise exception using errcode = '23514', message = 'INVALID_COMMISSION_PERCENTAGE';
  end if;

  v_commission_amount := round(v_service_value * v_commission_percentage / 100, 2);

  insert into public.transacoes (
    tipo, descricao, categoria, valor, metodo, data, unit_id,
    agendamento_id, criado_por
  ) values (
    'receita',
    'Agendamento #' || p_appointment_id::text,
    'Servicos',
    v_service_value,
    p_payment_method,
    current_date,
    p_unit_id,
    p_appointment_id,
    p_admin_id
  )
  returning id into v_transaction_id;

  update public.agendamentos
  set status = 'concluido', concluido_em = clock_timestamp(), updated_at = clock_timestamp()
  where id = p_appointment_id;

  return jsonb_build_object(
    'appointment_id', p_appointment_id,
    'service_price', v_service_value,
    'commission_percentage', v_commission_percentage,
    'commission_amount', v_commission_amount,
    'salon_amount', v_service_value - v_commission_amount,
    'transaction_id', v_transaction_id,
    'duplicate', false
  );
end;
$$;

create or replace function public.close_comanda_atomic(
  p_comanda_id bigint,
  p_payment_method text,
  p_discount numeric,
  p_admin_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_comanda public.comandas%rowtype;
  v_subtotal numeric(14,2);
  v_discount numeric(14,2);
  v_total numeric(14,2);
  v_service_total numeric(14,2);
  v_transaction_id bigint;
  v_commissions integer := 0;
  v_packages integer := 0;
begin
  if p_payment_method not in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito') then
    raise exception using errcode = '22023', message = 'INVALID_PAYMENT_METHOD';
  end if;

  select * into v_comanda
  from public.comandas
  where id = p_comanda_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'COMANDA_NOT_FOUND';
  end if;

  select id into v_transaction_id
  from public.transacoes
  where comanda_id = p_comanda_id and tipo = 'receita';

  if v_comanda.status = 'fechada' then
    if v_transaction_id is null then
      raise exception using errcode = '23514', message = 'CLOSED_COMANDA_WITHOUT_TRANSACTION';
    end if;
    return jsonb_build_object(
      'comanda_id', p_comanda_id,
      'transaction_id', v_transaction_id,
      'total', v_comanda.total,
      'duplicate', true
    );
  end if;

  if v_comanda.status <> 'aberta' then
    raise exception using errcode = '23514', message = 'COMANDA_NOT_OPEN';
  end if;

  if exists (
    select 1 from public.comanda_itens
    where comanda_id = p_comanda_id
      and (valor_total is null or valor_total < 0 or quantidade is null or quantidade <= 0)
  ) then
    raise exception using errcode = '23514', message = 'INVALID_COMANDA_ITEM';
  end if;

  select round(coalesce(sum(valor_total), 0), 2),
         round(coalesce(sum(valor_total) filter (where tipo = 'servico'), 0), 2)
  into v_subtotal, v_service_total
  from public.comanda_itens
  where comanda_id = p_comanda_id;

  v_discount := round(coalesce(p_discount, 0), 2);
  if v_discount < 0 or v_discount > v_subtotal then
    raise exception using errcode = '22023', message = 'INVALID_DISCOUNT';
  end if;
  v_total := v_subtotal - v_discount;

  insert into public.transacoes (
    tipo, descricao, categoria, valor, metodo, data, unit_id,
    comanda_id, criado_por
  ) values (
    'receita',
    'Comanda #' || v_comanda.numero_comanda::text,
    'Servicos',
    v_total,
    p_payment_method,
    current_date,
    p_unit_id,
    p_comanda_id,
    p_admin_id
  )
  returning id into v_transaction_id;

  with assigned_professionals as (
    select v_comanda.profissional_id as profissional_id
    union
    select v_comanda.auxiliar_id
  )
  insert into public.comissoes (comanda_id, profissional_id, valor_comissao, criado_por)
  select
    p_comanda_id,
    p.id,
    round(v_service_total * coalesce(p.percentual_comissao, 0) / 100, 2),
    p_admin_id
  from assigned_professionals a
  join public.profissionais p on p.id = a.profissional_id
  where a.profissional_id is not null
    and coalesce(p.recebe_comissao, true)
    and coalesce(p.percentual_comissao, 0) between 0 and 100
  on conflict (comanda_id, profissional_id) do nothing;
  get diagnostics v_commissions = row_count;

  if v_comanda.cliente_id is not null then
    with package_services as (
      select
        psi.servico_id,
        sum(coalesce(psi.quantidade, 1) * ci.quantidade)::integer as sessoes_total,
        max(
          case when ps.validade_dias is null then null
               else current_date + ps.validade_dias end
        ) as data_validade
      from public.comanda_itens ci
      join public.pacotes_servicos ps on ps.id::text = ci.item_id and coalesce(ps.ativo, true)
      join public.pacotes_servicos_itens psi on psi.pacote_id = ps.id
      where ci.comanda_id = p_comanda_id and ci.tipo = 'pacote'
      group by psi.servico_id
    )
    insert into public.pacotes_cliente (
      unit_id, cliente_id, cliente_cpf, servico_id, sessoes_total,
      sessoes_consumidas, comanda_origem_id, data_validade
    )
    select
      p_unit_id, v_comanda.cliente_id, c.cpf, ps.servico_id,
      ps.sessoes_total, 0, p_comanda_id, ps.data_validade
    from package_services ps
    join public.clientes c on c.id = v_comanda.cliente_id
    on conflict (comanda_origem_id, servico_id)
      where comanda_origem_id is not null
      do nothing;
    get diagnostics v_packages = row_count;
  end if;

  update public.comandas
  set status = 'fechada',
      data_fechamento = clock_timestamp(),
      subtotal = v_subtotal,
      desconto = v_discount,
      total = v_total,
      fechado_por = p_admin_id,
      desconto_aplicado_por = case when v_discount > 0 then p_admin_id else null end,
      desconto_aplicado_em = case when v_discount > 0 then clock_timestamp() else null end
  where id = p_comanda_id;

  update public.agendamentos
  set status = 'concluido', concluido_em = coalesce(concluido_em, clock_timestamp()),
      updated_at = clock_timestamp()
  where comanda_id = p_comanda_id and status <> 'cancelado';

  return jsonb_build_object(
    'comanda_id', p_comanda_id,
    'transaction_id', v_transaction_id,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_total,
    'commissions_created', v_commissions,
    'package_balances_created', v_packages,
    'duplicate', false
  );
end;
$$;

revoke all on function public.close_appointment_atomic(uuid, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.close_comanda_atomic(bigint, text, numeric, uuid, uuid) from public, anon, authenticated;
grant execute on function public.close_appointment_atomic(uuid, text, uuid, uuid) to service_role;
grant execute on function public.close_comanda_atomic(bigint, text, numeric, uuid, uuid) to service_role;
grant usage, select on sequence public.comandas_numero_seq to service_role;
