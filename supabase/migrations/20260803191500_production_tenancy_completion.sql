-- Complete and enforce unit ownership without replacing the application-specific
-- permissive policies already used by each feature. The restrictive policy is
-- evaluated together with those policies and prevents cross-unit access.

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
  select min(uu.unit_id::text)::uuid
    into v_target_unit
    from public.user_units uu
   where uu.is_active is true
     and uu.is_default is true
  having count(distinct uu.unit_id) = 1;

  if v_target_unit is null then
    raise exception using
      errcode = '23514',
      message = 'TENANCY_BACKFILL_REQUIRES_ONE_ACTIVE_DEFAULT_UNIT';
  end if;

  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is null then
      continue;
    end if;

    execute format('alter table public.%I add column if not exists unit_id uuid', v_table);
    execute format('update public.%I set unit_id = $1 where unit_id is null', v_table)
      using v_target_unit;
    execute format('alter table public.%I alter column unit_id set default private.current_request_unit()', v_table);
    execute format('alter table public.%I alter column unit_id set not null', v_table);

    v_constraint := left(v_table || '_unit_id_fkey', 63);
    if not exists (
      select 1
        from pg_constraint c
        join unnest(c.conkey) as key(attnum) on true
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = key.attnum
       where c.conrelid = format('public.%I', v_table)::regclass
         and c.contype = 'f'
         and c.confrelid = 'public.units'::regclass
         and a.attname = 'unit_id'
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (unit_id) references public.units(id) on delete restrict',
        v_table,
        v_constraint
      );
    end if;

    if not exists (
      select 1
        from pg_index i
        join pg_attribute a
          on a.attrelid = i.indrelid
         and a.attnum = i.indkey[0]
       where i.indrelid = format('public.%I', v_table)::regclass
         and i.indisvalid
         and a.attname = 'unit_id'
    ) then
      execute format(
        'create index %I on public.%I(unit_id)',
        left(v_table || '_unit_id_idx', 63),
        v_table
      );
    end if;

    execute format('alter table public.%I enable row level security', v_table);
    execute format('drop policy if exists tenant_unit_boundary on public.%I', v_table);
    execute format(
      'create policy tenant_unit_boundary on public.%I as restrictive for all to authenticated using ((select private.user_has_unit(unit_id))) with check ((select private.user_has_unit(unit_id)))',
      v_table
    );

    execute format('drop trigger if exists reject_unit_change on public.%I', v_table);
    execute format(
      'create trigger reject_unit_change before update of unit_id on public.%I for each row execute function private.reject_unit_change()',
      v_table
    );
  end loop;
end;
$$;

-- Service-role workflows bypass RLS. This trigger prevents those workflows from
-- linking child rows to parents owned by a different unit.
create or replace function private.enforce_parent_unit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_child_value text;
  v_parent_unit uuid;
begin
  v_child_value := to_jsonb(new) ->> tg_argv[0];
  if v_child_value is null then
    return new;
  end if;

  execute format(
    'select unit_id from %I.%I where %I::text = $1',
    tg_argv[1],
    tg_argv[2],
    tg_argv[3]
  )
  into v_parent_unit
  using v_child_value;

  if v_parent_unit is not null and v_parent_unit is distinct from new.unit_id then
    raise exception using errcode = '23514', message = 'CROSS_UNIT_REFERENCE';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_parent_unit() from public, anon, authenticated;
grant execute on function private.enforce_parent_unit() to service_role;

do $$
declare
  v_fk record;
  v_trigger text;
begin
  for v_fk in
    select
      con.conname,
      child_ns.nspname as child_schema,
      child.relname as child_table,
      child_att.attname as child_column,
      parent_ns.nspname as parent_schema,
      parent.relname as parent_table,
      parent_att.attname as parent_column
    from pg_constraint con
    join pg_class child on child.oid = con.conrelid
    join pg_namespace child_ns on child_ns.oid = child.relnamespace
    join pg_class parent on parent.oid = con.confrelid
    join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
    join pg_attribute child_att
      on child_att.attrelid = child.oid
     and child_att.attnum = con.conkey[1]
    join pg_attribute parent_att
      on parent_att.attrelid = parent.oid
     and parent_att.attnum = con.confkey[1]
    where con.contype = 'f'
      and cardinality(con.conkey) = 1
      and child_ns.nspname = 'public'
      and parent_ns.nspname = 'public'
      and child_att.attname <> 'unit_id'
      and exists (
        select 1 from pg_attribute a
         where a.attrelid = child.oid
           and a.attname = 'unit_id'
           and not a.attisdropped
      )
      and exists (
        select 1 from pg_attribute a
         where a.attrelid = parent.oid
           and a.attname = 'unit_id'
           and not a.attisdropped
      )
  loop
    v_trigger := left('tenant_fk_' || md5(v_fk.conname || v_fk.child_table), 63);
    execute format(
      'drop trigger if exists %I on %I.%I',
      v_trigger,
      v_fk.child_schema,
      v_fk.child_table
    );
    execute format(
      'create trigger %I before insert or update on %I.%I for each row execute function private.enforce_parent_unit(%L,%L,%L,%L)',
      v_trigger,
      v_fk.child_schema,
      v_fk.child_table,
      v_fk.child_column,
      v_fk.parent_schema,
      v_fk.parent_table,
      v_fk.parent_column
    );
  end loop;
end;
$$;
