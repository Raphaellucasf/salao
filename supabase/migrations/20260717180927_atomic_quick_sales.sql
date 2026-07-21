-- BUG-03: venda rapida, receita e estoque na mesma transacao.

create table if not exists public.abertura_caixa (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  data date not null,
  valor_abertura numeric(14,2) not null default 0 check (valor_abertura >= 0),
  observacao text,
  aberto_por uuid not null references public.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  unique (unit_id, data)
);

alter table public.abertura_caixa enable row level security;
revoke all on table public.abertura_caixa from anon, authenticated;
grant select, insert, update, delete on table public.abertura_caixa to service_role;

create or replace function public.finalize_quick_sale_atomic(
  p_request_id uuid,
  p_client_id bigint,
  p_items jsonb,
  p_payment_method text,
  p_admin_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_existing record;
  v_client public.clientes%rowtype;
  v_command public.comandas%rowtype;
  v_product public.produtos%rowtype;
  v_service public.servicos%rowtype;
  v_item jsonb;
  v_item_type text;
  v_item_id uuid;
  v_quantity integer;
  v_unit_value numeric(14,2);
  v_item_total numeric(14,2);
  v_total numeric(14,2) := 0;
  v_before integer;
  v_after integer;
  v_transaction_id bigint;
  v_payment_method text;
begin
  v_payment_method := case p_payment_method
    when 'credito' then 'cartao_credito'
    when 'debito' then 'cartao_debito'
    else p_payment_method
  end;
  if v_payment_method not in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito') then
    raise exception using errcode = '22023', message = 'INVALID_PAYMENT_METHOD';
  end if;

  select t.id as transaction_id, t.comanda_id, c.numero_comanda, t.valor
  into v_existing
  from public.transacoes t
  left join public.comandas c on c.id = t.comanda_id
  where t.request_id = p_request_id;
  if found then
    return jsonb_build_object(
      'duplicate', true,
      'transaction_id', v_existing.transaction_id,
      'comanda_id', v_existing.comanda_id,
      'numero_comanda', v_existing.numero_comanda,
      'total', v_existing.valor
    );
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 100 then
    raise exception using errcode = '22023', message = 'INVALID_ITEMS';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where e->>'tipo' not in ('produto', 'servico')
       or coalesce(e->>'item_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce(e->>'quantidade', '') !~ '^[1-9][0-9]{0,3}$'
  ) then
    raise exception using errcode = '22023', message = 'INVALID_ITEMS';
  end if;

  if not exists (
    select 1 from public.abertura_caixa
    where unit_id = p_unit_id and data = current_date
  ) or exists (
    select 1 from public.fechamentos_caixa
    where unit_id = p_unit_id and data_fechamento = current_date and status = 'fechado'
  ) then
    raise exception using errcode = '23514', message = 'CASH_REGISTER_CLOSED';
  end if;

  if p_client_id is not null then
    select * into v_client from public.clientes where id = p_client_id;
    if not found then
      raise exception using errcode = 'P0002', message = 'CLIENT_NOT_FOUND';
    end if;
  end if;

  -- Ordem deterministica evita deadlock entre duas vendas com os mesmos produtos.
  perform p.id
  from public.produtos p
  where p.id in (
    select (e->>'item_id')::uuid from jsonb_array_elements(p_items) e
    where e->>'tipo' = 'produto'
  )
  order by p.id
  for update;

  perform s.id
  from public.servicos s
  where s.id in (
    select (e->>'item_id')::uuid from jsonb_array_elements(p_items) e
    where e->>'tipo' = 'servico'
  )
  order by s.id
  for share;

  insert into public.comandas (
    cliente_id, cliente_nome, status, subtotal, desconto, total, criado_por
  ) values (
    p_client_id,
    coalesce(v_client.nome, 'Cliente Balcao'),
    'aberta', 0, 0, 0, p_admin_id
  ) returning * into v_command;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_item_type := v_item->>'tipo';
    v_item_id := (v_item->>'item_id')::uuid;
    v_quantity := (v_item->>'quantidade')::integer;

    if v_item_type = 'produto' then
      select * into v_product from public.produtos where id = v_item_id and coalesce(ativo, true);
      if not found then
        raise exception using errcode = 'P0002', message = 'CATALOG_ITEM_NOT_FOUND';
      end if;
      v_unit_value := round(v_product.preco_venda, 2);
      if v_unit_value < 0 then
        raise exception using errcode = '23514', message = 'INVALID_CATALOG_PRICE';
      end if;

      if coalesce(v_product.controla_estoque, true) then
        v_before := coalesce(v_product.quantidade, 0);
        v_after := v_before - v_quantity;
        if v_after < 0 and not coalesce(v_product.permite_venda_estoque_negativo, false) then
          raise exception using errcode = '23514', message = 'INSUFFICIENT_STOCK';
        end if;
        update public.produtos
        set quantidade = v_after, updated_at = clock_timestamp()
        where id = v_item_id;
      end if;
    else
      select * into v_service from public.servicos where id = v_item_id and coalesce(ativo, true);
      if not found then
        raise exception using errcode = 'P0002', message = 'CATALOG_ITEM_NOT_FOUND';
      end if;
      v_unit_value := round(v_service.preco, 2);
      if v_unit_value < 0 then
        raise exception using errcode = '23514', message = 'INVALID_CATALOG_PRICE';
      end if;
    end if;

    v_item_total := round(v_unit_value * v_quantity, 2);
    v_total := v_total + v_item_total;

    insert into public.comanda_itens (
      comanda_id, tipo, item_id, descricao, quantidade, valor_unitario, valor_total
    ) values (
      v_command.id, v_item_type, v_item_id::text,
      case when v_item_type = 'produto' then v_product.nome else v_service.nome end,
      v_quantity, v_unit_value, v_item_total
    );

    if v_item_type = 'produto' and coalesce(v_product.controla_estoque, true) then
      insert into public.estoque_movimentacoes (
        produto_id, tipo, quantidade, quantidade_anterior, quantidade_atual,
        valor_unitario, valor_total, motivo, comanda_id, usuario_id
      ) values (
        v_item_id, 'venda', v_quantity, v_before, v_after,
        v_unit_value, v_item_total, 'Venda rapida ' || p_request_id::text,
        v_command.id, p_admin_id
      );
    end if;
  end loop;

  v_total := round(v_total, 2);
  insert into public.transacoes (
    tipo, descricao, categoria, valor, metodo, data, unit_id,
    comanda_id, request_id, criado_por
  ) values (
    'receita', 'Venda rapida ' || p_request_id::text, 'Vendas', v_total,
    v_payment_method, current_date, p_unit_id, v_command.id, p_request_id, p_admin_id
  ) returning id into v_transaction_id;

  update public.comandas
  set status = 'fechada', subtotal = v_total, total = v_total,
      data_fechamento = clock_timestamp(), fechado_por = p_admin_id
  where id = v_command.id;

  return jsonb_build_object(
    'duplicate', false,
    'transaction_id', v_transaction_id,
    'comanda_id', v_command.id,
    'numero_comanda', v_command.numero_comanda,
    'total', v_total
  );
end;
$$;

revoke all on function public.finalize_quick_sale_atomic(uuid, bigint, jsonb, text, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.finalize_quick_sale_atomic(uuid, bigint, jsonb, text, uuid, uuid)
  to service_role;
