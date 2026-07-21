-- Financial support tables were referenced by the application but did not exist
-- in the test schema. Keep them service-only and expose mutations through
-- idempotent, atomic database functions.

create table if not exists public.fundo_caixa (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  valor numeric(12,2) not null default 0 check (valor >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id) on delete set null,
  unique (unit_id)
);

create table if not exists public.fundo_caixa_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  tipo text not null check (tipo in ('deposito', 'retirada')),
  valor numeric(12,2) not null check (valor > 0),
  descricao text not null check (char_length(descricao) between 1 and 500),
  saldo_apos numeric(12,2) not null check (saldo_apos >= 0),
  criado_por uuid references public.users(id) on delete set null,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique (request_id)
);

create table if not exists public.contas_fixas (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  nome varchar(120) not null check (char_length(btrim(nome)) > 0),
  valor numeric(12,2) not null default 0 check (valor >= 0),
  vencimento_dia integer check (vencimento_dia between 1 and 31),
  categoria varchar(60) not null default 'outros',
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contas_fixas_pagamentos (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  conta_fixa_id uuid not null references public.contas_fixas(id) on delete restrict,
  valor_pago numeric(12,2) not null check (valor_pago > 0),
  data_pagamento date not null default current_date,
  transacao_id bigint not null references public.transacoes(id) on delete restrict,
  observacao text,
  pago_por uuid references public.users(id) on delete set null,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique (request_id),
  unique (transacao_id)
);

alter table public.fundo_caixa enable row level security;
alter table public.fundo_caixa_movimentacoes enable row level security;
alter table public.contas_fixas enable row level security;
alter table public.contas_fixas_pagamentos enable row level security;

revoke all on table public.fundo_caixa from anon, authenticated;
revoke all on table public.fundo_caixa_movimentacoes from anon, authenticated;
revoke all on table public.contas_fixas from anon, authenticated;
revoke all on table public.contas_fixas_pagamentos from anon, authenticated;
grant select, insert, update, delete on table public.fundo_caixa to service_role;
grant select, insert, update, delete on table public.fundo_caixa_movimentacoes to service_role;
grant select, insert, update, delete on table public.contas_fixas to service_role;
grant select, insert, update, delete on table public.contas_fixas_pagamentos to service_role;

create index if not exists fundo_caixa_mov_unit_created_idx
  on public.fundo_caixa_movimentacoes (unit_id, created_at desc);
create index if not exists contas_fixas_unit_ativo_idx
  on public.contas_fixas (unit_id, ativo, nome);
create index if not exists contas_fixas_pagamentos_conta_data_idx
  on public.contas_fixas_pagamentos (conta_fixa_id, data_pagamento desc);
create index if not exists contas_fixas_pagamentos_unit_data_idx
  on public.contas_fixas_pagamentos (unit_id, data_pagamento desc);

create or replace function public.adjust_cash_fund_atomic(
  p_unit_id uuid,
  p_type text,
  p_amount numeric,
  p_description text,
  p_actor_id uuid,
  p_request_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_fund public.fundo_caixa%rowtype;
  v_movement public.fundo_caixa_movimentacoes%rowtype;
  v_new_balance numeric(12,2);
begin
  if p_request_id is null or p_unit_id is null or p_actor_id is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;
  if p_type not in ('deposito', 'retirada') or p_amount is null or p_amount <= 0
     or p_amount > 100000000 or char_length(btrim(coalesce(p_description, ''))) not between 1 and 500 then
    raise exception using errcode = '22023', message = 'invalid_fund_adjustment';
  end if;

  select * into v_movement
  from public.fundo_caixa_movimentacoes
  where request_id = p_request_id;
  if found then
    return jsonb_build_object('movement_id', v_movement.id, 'balance', v_movement.saldo_apos, 'replayed', true);
  end if;

  insert into public.fundo_caixa (unit_id, valor, updated_by)
  values (p_unit_id, 0, p_actor_id)
  on conflict (unit_id) do nothing;

  select * into v_fund from public.fundo_caixa where unit_id = p_unit_id for update;
  v_new_balance := round(v_fund.valor + case when p_type = 'deposito' then p_amount else -p_amount end, 2);
  if v_new_balance < 0 then
    raise exception using errcode = '22003', message = 'insufficient_fund_balance';
  end if;

  update public.fundo_caixa
  set valor = v_new_balance, updated_at = now(), updated_by = p_actor_id
  where id = v_fund.id;

  insert into public.fundo_caixa_movimentacoes
    (unit_id, tipo, valor, descricao, saldo_apos, criado_por, request_id)
  values
    (p_unit_id, p_type, round(p_amount, 2), btrim(p_description), v_new_balance, p_actor_id, p_request_id)
  returning * into v_movement;

  return jsonb_build_object('movement_id', v_movement.id, 'balance', v_new_balance, 'replayed', false);
end;
$$;

create or replace function public.pay_fixed_account_atomic(
  p_unit_id uuid,
  p_fixed_account_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_note text,
  p_actor_id uuid,
  p_request_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_account public.contas_fixas%rowtype;
  v_payment public.contas_fixas_pagamentos%rowtype;
  v_transaction_id bigint;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_request_id is null or p_unit_id is null or p_fixed_account_id is null or p_actor_id is null
     or p_amount is null or p_amount <= 0 or p_amount > 100000000 or p_payment_date is null
     or char_length(coalesce(v_note, '')) > 500 then
    raise exception using errcode = '22023', message = 'invalid_payment';
  end if;

  select * into v_payment from public.contas_fixas_pagamentos where request_id = p_request_id;
  if found then
    return jsonb_build_object('payment_id', v_payment.id, 'transaction_id', v_payment.transacao_id, 'replayed', true);
  end if;

  select * into v_account
  from public.contas_fixas
  where id = p_fixed_account_id and unit_id = p_unit_id and ativo
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'fixed_account_not_found';
  end if;

  insert into public.transacoes
    (unit_id, tipo, valor, descricao, categoria, data, metodo, request_id, criado_por)
  values
    (p_unit_id, 'despesa', round(p_amount, 2),
     left('Conta fixa: ' || v_account.nome || case when v_note is null then '' else ' — ' || v_note end, 500),
     coalesce(nullif(btrim(v_account.categoria), ''), 'contas_fixas'), p_payment_date, 'dinheiro', p_request_id, p_actor_id)
  returning id into v_transaction_id;

  insert into public.contas_fixas_pagamentos
    (unit_id, conta_fixa_id, valor_pago, data_pagamento, transacao_id, observacao, pago_por, request_id)
  values
    (p_unit_id, p_fixed_account_id, round(p_amount, 2), p_payment_date, v_transaction_id, v_note, p_actor_id, p_request_id)
  returning * into v_payment;

  return jsonb_build_object('payment_id', v_payment.id, 'transaction_id', v_transaction_id, 'replayed', false);
end;
$$;

revoke all on function public.adjust_cash_fund_atomic(uuid,text,numeric,text,uuid,uuid) from public, anon, authenticated;
revoke all on function public.pay_fixed_account_atomic(uuid,uuid,numeric,date,text,uuid,uuid) from public, anon, authenticated;
grant execute on function public.adjust_cash_fund_atomic(uuid,text,numeric,text,uuid,uuid) to service_role;
grant execute on function public.pay_fixed_account_atomic(uuid,uuid,numeric,date,text,uuid,uuid) to service_role;
