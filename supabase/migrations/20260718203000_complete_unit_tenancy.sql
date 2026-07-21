-- Complete tenant ownership for every business table in the test schema.
-- Global identity/authorization tables (units, users, usuarios, roles,
-- user_units and usuarios_sessoes) intentionally remain outside row tenancy.

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
begin
  if auth.uid() is not null then
    select uu.unit_id into v_unit_id
      from public.user_units uu
     where uu.user_id = auth.uid()
       and uu.is_active
       and uu.is_default
     limit 1;
    return v_unit_id;
  end if;

  begin
    v_header := current_setting('request.headers', true)::jsonb ->> 'x-unit-id';
    if v_header is not null then
      v_unit_id := v_header::uuid;
      if exists (select 1 from public.units u where u.id = v_unit_id) then
        return v_unit_id;
      end if;
    end if;
  exception when others then
    return null;
  end;

  -- Compatibility for the current single-tenant service runtime. This fails
  -- closed as soon as more than one active default unit exists.
  if current_setting('request.jwt.claim.role', true) = 'service_role' then
    select min(uu.unit_id::text)::uuid into v_unit_id
      from public.user_units uu
     where uu.is_active and uu.is_default
    having count(distinct uu.unit_id) = 1;
  end if;
  return v_unit_id;
end;
$$;

revoke all on function private.current_request_unit() from public, anon;
grant execute on function private.current_request_unit() to authenticated, service_role;

do $$
declare
  v_table text;
  v_target_unit uuid;
  v_constraint text;
  v_tables constant text[] := array[
    'abertura_caixa','agendamentos','agendamentos_blocos','anamneses',
    'avisos_clientes','cadastro_templates','cadastros_excluidos',
    'cadastros_recuperacoes','chat_messages','chats','cliente_saldos','clientes',
    'comanda_item_etapas','comanda_itens','comanda_pacote_consumos','comandas',
    'comissoes','configuracoes_sistema','contas_fixas','contas_fixas_pagamentos',
    'estoque_alertas','estoque_movimentacoes','faq_estabelecimento',
    'fechamentos_caixa','formas_pagamento','fornecedores','fundo_caixa',
    'fundo_caixa_movimentacoes','grupos_produtos','grupos_servicos',
    'n8n_chat_histories','orcamento_itens','orcamentos','pacote_consumos',
    'pacote_operacoes','pacotes_cliente','pacotes_servicos',
    'pacotes_servicos_itens','produto_operacoes','produtos','profissional_horarios',
    'profissionais','promocoes','prontuarios','servico_etapas','servico_operacoes',
    'servicos','servicos_produtos','transacoes','webhook_log'
  ];
begin
  select min(uu.unit_id::text)::uuid into v_target_unit
    from public.user_units uu
   where uu.is_active and uu.is_default
  having count(distinct uu.unit_id) = 1;

  if v_target_unit is null then
    raise exception using errcode = '23514',
      message = 'TENANCY_BACKFILL_REQUIRES_ONE_ACTIVE_DEFAULT_UNIT';
  end if;

  foreach v_table in array v_tables loop
    execute format('alter table public.%I add column if not exists unit_id uuid', v_table);
    execute format('update public.%I set unit_id = $1 where unit_id is null', v_table)
      using v_target_unit;
    execute format('alter table public.%I alter column unit_id set default private.current_request_unit()', v_table);
    execute format('alter table public.%I alter column unit_id set not null', v_table);

    v_constraint := left(v_table || '_unit_id_fkey', 63);
    if not exists (
      select 1 from pg_constraint c
       where c.conrelid = format('public.%I', v_table)::regclass
         and c.contype = 'f'
         and c.conname = v_constraint
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (unit_id) references public.units(id) on delete restrict',
        v_table, v_constraint
      );
    end if;

    if not exists (
      select 1
      from pg_index i
      join pg_attribute a on a.attrelid=i.indrelid and a.attnum=i.indkey[0]
      where i.indrelid=format('public.%I',v_table)::regclass
        and a.attname='unit_id'
    ) then
      execute format('create index %I on public.%I(unit_id)',
        left(v_table || '_unit_id_idx', 63), v_table);
    end if;
    execute format('drop policy if exists tenant_unit_boundary on public.%I', v_table);
    execute format(
      'create policy tenant_unit_boundary on public.%I as restrictive for all to authenticated using (private.user_has_unit(unit_id)) with check (private.user_has_unit(unit_id))',
      v_table
    );
  end loop;
end;
$$;

create or replace function private.reject_unit_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.unit_id is distinct from old.unit_id then
    raise exception using errcode = '23514', message = 'UNIT_ID_IMMUTABLE';
  end if;
  return new;
end;
$$;

revoke all on function private.reject_unit_change() from public, anon, authenticated;
grant execute on function private.reject_unit_change() to service_role;

do $$
declare
  v_table text;
  v_tables constant text[] := array[
    'abertura_caixa','agendamentos','agendamentos_blocos','anamneses',
    'avisos_clientes','cadastro_templates','cadastros_excluidos',
    'cadastros_recuperacoes','chat_messages','chats','cliente_saldos','clientes',
    'comanda_item_etapas','comanda_itens','comanda_pacote_consumos','comandas',
    'comissoes','configuracoes_sistema','contas_fixas','contas_fixas_pagamentos',
    'estoque_alertas','estoque_movimentacoes','faq_estabelecimento',
    'fechamentos_caixa','formas_pagamento','fornecedores','fundo_caixa',
    'fundo_caixa_movimentacoes','grupos_produtos','grupos_servicos',
    'n8n_chat_histories','orcamento_itens','orcamentos','pacote_consumos',
    'pacote_operacoes','pacotes_cliente','pacotes_servicos',
    'pacotes_servicos_itens','produto_operacoes','produtos','profissional_horarios',
    'profissionais','promocoes','prontuarios','servico_etapas','servico_operacoes',
    'servicos','servicos_produtos','transacoes','webhook_log'
  ];
begin
  foreach v_table in array v_tables loop
    execute format('drop trigger if exists reject_unit_change on public.%I', v_table);
    execute format(
      'create trigger reject_unit_change before update of unit_id on public.%I for each row execute function private.reject_unit_change()',
      v_table
    );
  end loop;
end;
$$;
