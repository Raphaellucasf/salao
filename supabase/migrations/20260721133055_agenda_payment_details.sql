-- Agenda movement/removal and configured payment metadata.

alter table public.transacoes
  add column if not exists forma_pagamento_id uuid references public.formas_pagamento(id) on delete set null,
  add column if not exists parcelas integer not null default 1,
  add column if not exists bandeira text;

alter table public.transacoes
  drop constraint if exists transacoes_parcelas_check,
  add constraint transacoes_parcelas_check check (parcelas between 1 and 120);

create index if not exists transacoes_forma_pagamento_id_idx
  on public.transacoes(forma_pagamento_id);

create or replace function public.move_appointment_atomic(
  p_appointment_id uuid,
  p_date date,
  p_start_time time without time zone,
  p_professional_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_appointment public.agendamentos%rowtype;
  v_command public.comandas%rowtype;
  v_end_time time without time zone;
  v_delta interval;
begin
  select * into v_appointment
  from public.agendamentos
  where id = p_appointment_id and unit_id = p_unit_id
  for update;
  if not found then
    raise exception using errcode='P0002', message='APPOINTMENT_NOT_FOUND';
  end if;
  if v_appointment.status in ('cancelado', 'concluido') then
    raise exception using errcode='23514', message='APPOINTMENT_NOT_MOVABLE';
  end if;
  if not exists (
    select 1 from public.profissionais
    where id=p_professional_id and unit_id=p_unit_id and coalesce(ativo,true)
  ) then
    raise exception using errcode='P0002', message='PROFESSIONAL_NOT_FOUND';
  end if;

  if v_appointment.comanda_id is not null then
    select * into v_command from public.comandas
    where id=v_appointment.comanda_id and unit_id=p_unit_id for update;
    if not found or v_command.status <> 'aberta' then
      raise exception using errcode='23514', message='APPOINTMENT_NOT_MOVABLE';
    end if;
  end if;

  v_end_time := p_start_time + make_interval(mins => v_appointment.duracao_total);
  if v_end_time <= p_start_time then
    raise exception using errcode='22023', message='INVALID_SCHEDULE';
  end if;
  v_delta := p_start_time - v_appointment.hora_inicio;

  if exists (
    select 1 from public.vw_blocos_ocupados bo
    where bo.profissional_id=p_professional_id and bo.data=p_date
      and bo.hora_inicio < v_end_time and bo.hora_fim > p_start_time
      and bo.referencia_id <> p_appointment_id::text
      and not (
        v_appointment.comanda_id is not null
        and bo.referencia_id in (
          select cie.id::text from public.comanda_item_etapas cie
          join public.comanda_itens ci on ci.id=cie.comanda_item_id
          where ci.comanda_id=v_appointment.comanda_id
        )
      )
  ) then
    raise exception using errcode='23P01', message='APPOINTMENT_OVERLAP';
  end if;

  if v_appointment.comanda_id is not null and exists (
    select 1
    from public.comanda_item_etapas cie
    join public.comanda_itens ci on ci.id=cie.comanda_item_id
    join public.vw_blocos_ocupados bo
      on bo.data=p_date
      and bo.profissional_id in (cie.profissional_id, cie.auxiliar_id)
      and bo.hora_inicio < (cie.hora_fim + v_delta)
      and bo.hora_fim > (cie.hora_inicio + v_delta)
    where ci.comanda_id=v_appointment.comanda_id
      and cie.hora_inicio is not null and cie.hora_fim is not null
      and bo.referencia_id <> cie.id::text
      and bo.referencia_id not in (
        select own_stage.id::text from public.comanda_item_etapas own_stage
        join public.comanda_itens own_item on own_item.id=own_stage.comanda_item_id
        where own_item.comanda_id=v_appointment.comanda_id
      )
  ) then
    raise exception using errcode='23P01', message='APPOINTMENT_OVERLAP';
  end if;

  update public.agendamentos
  set data_agendamento=p_date,
      hora_inicio=p_start_time,
      hora_fim=v_end_time,
      profissional_id=p_professional_id,
      updated_at=clock_timestamp()
  where id=p_appointment_id;

  if v_appointment.comanda_id is not null then
    update public.comandas
    set data_agendamento=p_date,
        hora_inicio=p_start_time,
        profissional_id=p_professional_id,
        updated_at=clock_timestamp()
    where id=v_appointment.comanda_id;

    update public.comanda_item_etapas cie
    set hora_inicio=case when cie.hora_inicio is null then null else cie.hora_inicio + v_delta end,
        hora_fim=case when cie.hora_fim is null then null else cie.hora_fim + v_delta end,
        updated_at=clock_timestamp()
    from public.comanda_itens ci
    where ci.id=cie.comanda_item_id and ci.comanda_id=v_appointment.comanda_id;
  end if;

  return jsonb_build_object(
    'appointment_id', p_appointment_id,
    'date', p_date,
    'start_time', p_start_time,
    'end_time', v_end_time,
    'professional_id', p_professional_id
  );
end;
$$;

create or replace function public.remove_appointment_from_calendar_atomic(
  p_appointment_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_appointment public.agendamentos%rowtype;
  v_command_status text;
begin
  select * into v_appointment
  from public.agendamentos
  where id=p_appointment_id and unit_id=p_unit_id
  for update;
  if not found then
    raise exception using errcode='P0002', message='APPOINTMENT_NOT_FOUND';
  end if;

  if v_appointment.comanda_id is not null then
    select status into v_command_status from public.comandas
    where id=v_appointment.comanda_id and unit_id=p_unit_id;
    if v_command_status is distinct from 'fechada' then
      raise exception using errcode='23514', message='OPEN_COMANDA_MUST_BE_CANCELLED';
    end if;
  end if;

  delete from public.agendamentos where id=p_appointment_id;
  return jsonb_build_object(
    'appointment_id', p_appointment_id,
    'comanda_id', v_appointment.comanda_id
  );
end;
$$;

create or replace function public.close_comanda_with_payment_atomic(
  p_comanda_id bigint,
  p_payment_method_id uuid,
  p_installments integer,
  p_discount numeric,
  p_admin_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_method public.formas_pagamento%rowtype;
  v_subtotal numeric(14,2);
  v_total numeric(14,2);
  v_result jsonb;
begin
  select * into v_method
  from public.formas_pagamento
  where id=p_payment_method_id and unit_id=p_unit_id and coalesce(ativo,true)
  for share;
  if not found then
    raise exception using errcode='P0002', message='PAYMENT_METHOD_NOT_FOUND';
  end if;
  if v_method.tipo not in ('dinheiro','pix','cartao_credito','cartao_debito') then
    raise exception using errcode='22023', message='INVALID_PAYMENT_METHOD';
  end if;

  select round(coalesce(sum(valor_total),0),2) into v_subtotal
  from public.comanda_itens where comanda_id=p_comanda_id;
  v_total := v_subtotal - round(coalesce(p_discount,0),2);
  if p_installments is null or p_installments < 1
    or (not coalesce(v_method.permite_parcelamento,false) and p_installments <> 1)
    or p_installments > greatest(1,coalesce(v_method.max_parcelas,1))
    or (v_method.min_valor_parcela is not null and v_total / p_installments < v_method.min_valor_parcela)
  then
    raise exception using errcode='22023', message='INVALID_INSTALLMENTS';
  end if;

  v_result := public.close_comanda_atomic(
    p_comanda_id,
    v_method.tipo,
    p_discount,
    p_admin_id,
    p_unit_id
  );

  update public.transacoes
  set forma_pagamento_id=v_method.id,
      parcelas=p_installments,
      bandeira=v_method.bandeira
  where comanda_id=p_comanda_id and tipo='receita';

  return v_result || jsonb_build_object(
    'payment_method_id', v_method.id,
    'payment_method_name', v_method.nome,
    'installments', p_installments,
    'brand', v_method.bandeira
  );
end;
$$;

revoke all on function public.move_appointment_atomic(uuid,date,time without time zone,uuid,uuid) from public,anon,authenticated;
revoke all on function public.remove_appointment_from_calendar_atomic(uuid,uuid) from public,anon,authenticated;
revoke all on function public.close_comanda_with_payment_atomic(bigint,uuid,integer,numeric,uuid,uuid) from public,anon,authenticated;
grant execute on function public.move_appointment_atomic(uuid,date,time without time zone,uuid,uuid) to service_role;
grant execute on function public.remove_appointment_from_calendar_atomic(uuid,uuid) to service_role;
grant execute on function public.close_comanda_with_payment_atomic(bigint,uuid,integer,numeric,uuid,uuid) to service_role;
