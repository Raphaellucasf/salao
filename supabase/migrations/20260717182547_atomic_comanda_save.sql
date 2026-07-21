-- BUG-03/BUG-04: criacao e edicao de comanda, itens, estoque, pacote e agenda atomicos.

create table if not exists public.servicos_produtos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references public.servicos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  quantidade_media numeric(12,3) not null check (quantidade_media > 0),
  criado_em timestamptz not null default now(),
  unique (servico_id, produto_id)
);
alter table public.servicos_produtos enable row level security;
revoke all on table public.servicos_produtos from anon, authenticated;
grant select, insert, update, delete on table public.servicos_produtos to service_role;

create table if not exists public.comanda_pacote_consumos (
  comanda_id bigint not null references public.comandas(id) on delete cascade,
  pacote_cliente_id uuid not null references public.pacotes_cliente(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  criado_em timestamptz not null default now(),
  primary key (comanda_id, pacote_cliente_id)
);
alter table public.comanda_pacote_consumos enable row level security;
revoke all on table public.comanda_pacote_consumos from anon, authenticated;
grant select, insert, update, delete on table public.comanda_pacote_consumos to service_role;

-- O trigger legado suprimia inclusive conflito de agenda. Falhas agora abortam a transacao.
create or replace function public.trigger_criar_agendamento_comanda()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.data_agendamento is not null and new.hora_inicio is not null
     and new.profissional_id is not null
     and not exists (select 1 from public.agendamentos where comanda_id = new.id) then
    perform public.criar_agendamento_da_comanda(new.id);
  end if;
  return new;
end;
$$;

create or replace function public.save_comanda_atomic(
  p_comanda_id bigint,
  p_client_id bigint,
  p_professional_id uuid,
  p_auxiliary_id uuid,
  p_schedule_date date,
  p_start_time time,
  p_notes text,
  p_items jsonb,
  p_admin_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_command public.comandas%rowtype;
  v_client public.clientes%rowtype;
  v_product public.produtos%rowtype;
  v_service public.servicos%rowtype;
  v_package public.pacotes_servicos%rowtype;
  v_balance public.pacotes_cliente%rowtype;
  v_stage public.servico_etapas%rowtype;
  v_item jsonb;
  v_assignment jsonb;
  v_item_id uuid;
  v_item_type text;
  v_quantity integer;
  v_value numeric(14,2);
  v_total numeric(14,2) := 0;
  v_command_item_id bigint;
  v_before integer;
  v_after integer;
  v_supply record;
  v_old record;
  v_consumption record;
  v_stock_quantity integer;
  v_duration integer;
  v_services jsonb;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 100 then
    raise exception using errcode='22023', message='INVALID_ITEMS';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where e->>'tipo' not in ('produto','servico','pacote')
       or coalesce(e->>'item_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce(e->>'quantidade','') !~ '^[1-9][0-9]{0,3}$'
       or (e ? 'pacote_cliente_id' and e->>'pacote_cliente_id' is not null
           and e->>'pacote_cliente_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
  ) then
    raise exception using errcode='22023', message='INVALID_ITEMS';
  end if;
  if (select count(*) from jsonb_array_elements(p_items)) <>
     (select count(distinct concat(e->>'tipo',':',e->>'item_id',':',coalesce(e->>'pacote_cliente_id','')))
      from jsonb_array_elements(p_items) e) then
    raise exception using errcode='22023', message='DUPLICATE_ITEMS';
  end if;

  select * into v_client from public.clientes where id=p_client_id and coalesce(ativo,true);
  if not found then raise exception using errcode='P0002', message='CLIENT_NOT_FOUND'; end if;
  if p_professional_id is not null and not exists (
    select 1 from public.profissionais where id=p_professional_id and coalesce(ativo,true)
  ) then raise exception using errcode='P0002', message='PROFESSIONAL_NOT_FOUND'; end if;
  if p_auxiliary_id is not null and not exists (
    select 1 from public.profissionais where id=p_auxiliary_id and coalesce(ativo,true)
  ) then raise exception using errcode='P0002', message='AUXILIARY_NOT_FOUND'; end if;
  if (p_schedule_date is null) <> (p_start_time is null)
     or (p_schedule_date is not null and p_professional_id is null) then
    raise exception using errcode='22023', message='INVALID_SCHEDULE';
  end if;

  if p_comanda_id is null then
    insert into public.comandas(cliente_id,cliente_nome,status,subtotal,desconto,total,observacoes,criado_por)
    values(p_client_id,v_client.nome,'aberta',0,0,0,left(coalesce(p_notes,''),2000),p_admin_id)
    returning * into v_command;
  else
    select * into v_command from public.comandas where id=p_comanda_id for update;
    if not found then raise exception using errcode='P0002', message='COMANDA_NOT_FOUND'; end if;
    if v_command.status <> 'aberta' then
      raise exception using errcode='23514', message='COMANDA_NOT_OPEN';
    end if;
  end if;

  -- Bloqueia todos os produtos afetados, inclusive insumos e itens antigos.
  perform p.id from public.produtos p
  where p.id in (
    select (e->>'item_id')::uuid from jsonb_array_elements(p_items) e where e->>'tipo'='produto'
    union
    select ci.item_id::uuid from public.comanda_itens ci
      where ci.comanda_id=v_command.id and ci.tipo='produto' and ci.item_id is not null
    union
    select sp.produto_id from public.servicos_produtos sp
      where sp.servico_id in (
        select (e->>'item_id')::uuid from jsonb_array_elements(p_items) e where e->>'tipo'='servico'
        union
        select ci.item_id::uuid from public.comanda_itens ci
          where ci.comanda_id=v_command.id and ci.tipo='servico' and ci.item_id is not null
      )
  ) order by p.id for update;

  -- Em edicao, desfaz de forma auditavel os efeitos dos itens anteriores.
  for v_old in select * from public.comanda_itens where comanda_id=v_command.id order by id
  loop
    if v_old.tipo='produto' and v_old.item_id is not null then
      select * into v_product from public.produtos where id=v_old.item_id::uuid;
      if found and coalesce(v_product.controla_estoque,true) then
        v_before:=coalesce(v_product.quantidade,0);
        v_stock_quantity:=ceil(coalesce(v_old.quantidade,0))::integer;
        v_after:=v_before+v_stock_quantity;
        update public.produtos set quantidade=v_after,updated_at=clock_timestamp() where id=v_product.id;
        insert into public.estoque_movimentacoes(produto_id,tipo,quantidade,quantidade_anterior,
          quantidade_atual,valor_unitario,valor_total,motivo,comanda_id,usuario_id)
        values(v_product.id,'devolucao',v_stock_quantity,v_before,v_after,v_old.valor_unitario,
          v_old.valor_total,'Estorno por edicao de comanda',v_command.id,p_admin_id);
      end if;
    elsif v_old.tipo='servico' and v_old.item_id is not null then
      for v_supply in select * from public.servicos_produtos where servico_id=v_old.item_id::uuid
      loop
        select * into v_product from public.produtos where id=v_supply.produto_id;
        if found and coalesce(v_product.controla_estoque,true) then
          v_stock_quantity:=ceil(v_supply.quantidade_media*coalesce(v_old.quantidade,0))::integer;
          v_before:=coalesce(v_product.quantidade,0); v_after:=v_before+v_stock_quantity;
          update public.produtos set quantidade=v_after,updated_at=clock_timestamp() where id=v_product.id;
          insert into public.estoque_movimentacoes(produto_id,tipo,quantidade,quantidade_anterior,
            quantidade_atual,motivo,comanda_id,usuario_id)
          values(v_product.id,'devolucao',v_stock_quantity,v_before,v_after,
            'Estorno de insumo por edicao de comanda',v_command.id,p_admin_id);
        end if;
      end loop;
    end if;
  end loop;

  for v_consumption in select * from public.comanda_pacote_consumos where comanda_id=v_command.id for update
  loop
    update public.pacotes_cliente
    set sessoes_consumidas=greatest(0,sessoes_consumidas-v_consumption.quantidade)
    where id=v_consumption.pacote_cliente_id;
  end loop;
  delete from public.comanda_pacote_consumos where comanda_id=v_command.id;
  delete from public.comanda_itens where comanda_id=v_command.id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_item_type:=v_item->>'tipo'; v_item_id:=(v_item->>'item_id')::uuid;
    v_quantity:=(v_item->>'quantidade')::integer;

    if v_item_type='produto' then
      select * into v_product from public.produtos where id=v_item_id and coalesce(ativo,true);
      if not found then raise exception using errcode='P0002',message='CATALOG_ITEM_NOT_FOUND'; end if;
      v_value:=round(v_product.preco_venda,2);
      if v_value<0 then raise exception using errcode='23514',message='INVALID_CATALOG_PRICE'; end if;
      if coalesce(v_product.controla_estoque,true) then
        v_before:=coalesce(v_product.quantidade,0); v_after:=v_before-v_quantity;
        if v_after<0 and not coalesce(v_product.permite_venda_estoque_negativo,false) then
          raise exception using errcode='23514',message='INSUFFICIENT_STOCK';
        end if;
        update public.produtos set quantidade=v_after,updated_at=clock_timestamp() where id=v_item_id;
        insert into public.estoque_movimentacoes(produto_id,tipo,quantidade,quantidade_anterior,
          quantidade_atual,valor_unitario,valor_total,motivo,comanda_id,usuario_id)
        values(v_item_id,'venda',v_quantity,v_before,v_after,v_value,round(v_value*v_quantity,2),
          'Produto em comanda',v_command.id,p_admin_id);
      end if;
      insert into public.comanda_itens(comanda_id,tipo,item_id,descricao,quantidade,valor_unitario,valor_total)
      values(v_command.id,'produto',v_item_id::text,v_product.nome,v_quantity,v_value,
        round(v_value*v_quantity,2)) returning id into v_command_item_id;
    elsif v_item_type='pacote' then
      select * into v_package from public.pacotes_servicos where id=v_item_id and coalesce(ativo,true);
      if not found then raise exception using errcode='P0002',message='CATALOG_ITEM_NOT_FOUND'; end if;
      v_value:=round(v_package.preco_total,2);
      insert into public.comanda_itens(comanda_id,tipo,item_id,descricao,quantidade,valor_unitario,valor_total)
      values(v_command.id,'pacote',v_item_id::text,v_package.nome,v_quantity,v_value,
        round(v_value*v_quantity,2)) returning id into v_command_item_id;
    else
      select * into v_service from public.servicos where id=v_item_id and coalesce(ativo,true);
      if not found then raise exception using errcode='P0002',message='CATALOG_ITEM_NOT_FOUND'; end if;
      if nullif(v_item->>'pacote_cliente_id','') is not null then
        select * into v_balance from public.pacotes_cliente
        where id=(v_item->>'pacote_cliente_id')::uuid and cliente_id=p_client_id
          and servico_id=v_item_id for update;
        if not found or v_balance.sessoes_consumidas+v_quantity>v_balance.sessoes_total
           or (v_balance.data_validade is not null and v_balance.data_validade<current_date) then
          raise exception using errcode='23514',message='PACKAGE_BALANCE_UNAVAILABLE';
        end if;
        update public.pacotes_cliente set sessoes_consumidas=sessoes_consumidas+v_quantity
          where id=v_balance.id;
        insert into public.comanda_pacote_consumos(comanda_id,pacote_cliente_id,quantidade)
        values(v_command.id,v_balance.id,v_quantity);
        v_value:=0;
      else
        v_value:=round(v_service.preco,2);
      end if;
      insert into public.comanda_itens(comanda_id,tipo,item_id,descricao,quantidade,valor_unitario,
        valor_total,profissional_id)
      values(v_command.id,'servico',v_item_id::text,v_service.nome,v_quantity,v_value,
        round(v_value*v_quantity,2),p_professional_id) returning id into v_command_item_id;

      for v_supply in select * from public.servicos_produtos where servico_id=v_item_id
      loop
        select * into v_product from public.produtos where id=v_supply.produto_id;
        if found and coalesce(v_product.controla_estoque,true) then
          v_stock_quantity:=ceil(v_supply.quantidade_media*v_quantity)::integer;
          v_before:=coalesce(v_product.quantidade,0); v_after:=v_before-v_stock_quantity;
          if v_after<0 and not coalesce(v_product.permite_venda_estoque_negativo,false) then
            raise exception using errcode='23514',message='INSUFFICIENT_SUPPLY_STOCK';
          end if;
          update public.produtos set quantidade=v_after,updated_at=clock_timestamp() where id=v_product.id;
          insert into public.estoque_movimentacoes(produto_id,tipo,quantidade,quantidade_anterior,
            quantidade_atual,motivo,comanda_id,usuario_id)
          values(v_product.id,'uso_interno',v_stock_quantity,v_before,v_after,
            'Consumo automatico por servico',v_command.id,p_admin_id);
        end if;
      end loop;

      if jsonb_typeof(v_item->'atribuicoes_etapas')='array' then
        for v_assignment in select value from jsonb_array_elements(v_item->'atribuicoes_etapas')
        loop
          select * into v_stage from public.servico_etapas
          where id=(coalesce(v_assignment->>'servico_etapa_id',v_assignment->>'etapa_id'))::uuid
            and servico_id=v_item_id and coalesce(ativo,true);
          if not found then raise exception using errcode='23514',message='INVALID_SERVICE_STAGE'; end if;
          insert into public.comanda_item_etapas(comanda_item_id,servico_etapa_id,ordem,nome,
            duracao_minutos,profissional_id,auxiliar_id)
          values(v_command_item_id,v_stage.id,v_stage.ordem,v_stage.nome,v_stage.duracao_minutos,
            nullif(v_assignment->>'profissional_id','')::uuid,
            nullif(v_assignment->>'auxiliar_id','')::uuid);
        end loop;
      end if;
    end if;
    v_total:=v_total+round(v_value*v_quantity,2);
  end loop;

  update public.comandas set cliente_id=p_client_id,cliente_nome=v_client.nome,
    profissional_id=p_professional_id,auxiliar_id=p_auxiliary_id,
    data_agendamento=p_schedule_date,hora_inicio=p_start_time,subtotal=round(v_total,2),
    total=round(v_total,2),observacoes=left(coalesce(p_notes,''),2000),updated_at=clock_timestamp()
  where id=v_command.id returning * into v_command;

  if p_schedule_date is null then
    delete from public.agendamentos where comanda_id=v_command.id and coalesce(criado_automaticamente,false);
  else
    select coalesce(public.calcular_duracao_total_comanda(v_command.id),60) into v_duration;
    if v_duration<=0 then v_duration:=60; end if;
    select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'nome',s.nome,'duracao',s.duracao_minutos,
      'valor',ci.valor_unitario,'quantidade',ci.quantidade) order by ci.id),'[]'::jsonb)
    into v_services from public.comanda_itens ci join public.servicos s on s.id::text=ci.item_id
    where ci.comanda_id=v_command.id and ci.tipo='servico';
    update public.agendamentos set cliente_id=p_client_id,cliente_nome=v_client.nome,
      cliente_telefone=v_client.telefone,profissional_id=p_professional_id,auxiliar_id=p_auxiliary_id,
      data_agendamento=p_schedule_date,hora_inicio=p_start_time,
      hora_fim=p_start_time+(v_duration||' minutes')::interval,duracao_total=v_duration,
      servicos=v_services,valor_total=round(v_total,2),observacoes=left(coalesce(p_notes,''),2000),
      updated_at=clock_timestamp() where comanda_id=v_command.id;
  end if;

  return jsonb_build_object('comanda_id',v_command.id,'numero_comanda',v_command.numero_comanda,
    'total',round(v_total,2));
end;
$$;

revoke all on function public.save_comanda_atomic(bigint,bigint,uuid,uuid,date,time,text,jsonb,uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.save_comanda_atomic(bigint,bigint,uuid,uuid,date,time,text,jsonb,uuid,uuid)
  to service_role;
