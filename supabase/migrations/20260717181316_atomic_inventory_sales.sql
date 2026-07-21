-- BUG-03: venda de produtos/uso interno e baixa de estoque atomicos.

alter table public.transacoes
  add column if not exists profissional_id uuid references public.profissionais(id) on delete set null;

alter table public.estoque_movimentacoes
  add column if not exists request_id uuid;

create unique index if not exists estoque_movimentacoes_request_produto_uidx
  on public.estoque_movimentacoes (request_id, produto_id)
  where request_id is not null;

create or replace function public.process_product_sale_atomic(
  p_request_id uuid,
  p_sale_type text,
  p_professional_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_installments integer,
  p_admin_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_product public.produtos%rowtype;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_before integer;
  v_after integer;
  v_price numeric(14,2);
  v_total numeric(14,2) := 0;
  v_transaction_id bigint;
  v_payment_method text;
  v_products jsonb := '[]'::jsonb;
  v_alerts jsonb := '[]'::jsonb;
begin
  if p_sale_type not in ('retail_sale', 'internal_use') then
    raise exception using errcode = '22023', message = 'INVALID_SALE_TYPE';
  end if;
  if not exists (
    select 1 from public.profissionais where id = p_professional_id and coalesce(ativo, true)
  ) then
    raise exception using errcode = 'P0002', message = 'PROFESSIONAL_NOT_FOUND';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 100 then
    raise exception using errcode = '22023', message = 'INVALID_ITEMS';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where coalesce(e->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce(e->>'quantity', '') !~ '^[1-9][0-9]{0,3}$'
  ) then
    raise exception using errcode = '22023', message = 'INVALID_ITEMS';
  end if;
  if (select count(*) from jsonb_array_elements(p_items)) <>
     (select count(distinct e->>'product_id') from jsonb_array_elements(p_items) e) then
    raise exception using errcode = '22023', message = 'DUPLICATE_ITEMS';
  end if;

  select id into v_transaction_id from public.transacoes where request_id = p_request_id;
  if found or exists (
    select 1 from public.estoque_movimentacoes where request_id = p_request_id
  ) then
    return jsonb_build_object('duplicate', true, 'request_id', p_request_id,
      'transaction_id', v_transaction_id);
  end if;

  v_payment_method := case p_payment_method
    when 'credito' then 'cartao_credito'
    when 'debito' then 'cartao_debito'
    else p_payment_method
  end;
  if p_sale_type = 'retail_sale' then
    if v_payment_method not in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito') then
      raise exception using errcode = '22023', message = 'INVALID_PAYMENT_METHOD';
    end if;
    if p_installments < 1 or p_installments > 12 then
      raise exception using errcode = '22023', message = 'INVALID_INSTALLMENTS';
    end if;
    if not exists (
      select 1 from public.abertura_caixa where unit_id = p_unit_id and data = current_date
    ) or exists (
      select 1 from public.fechamentos_caixa
      where unit_id = p_unit_id and data_fechamento = current_date and status = 'fechado'
    ) then
      raise exception using errcode = '23514', message = 'CASH_REGISTER_CLOSED';
    end if;
  end if;

  perform p.id
  from public.produtos p
  where p.id in (select (e->>'product_id')::uuid from jsonb_array_elements(p_items) e)
  order by p.id
  for update;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product
    from public.produtos
    where id = v_product_id and coalesce(ativo, true);
    if not found then
      raise exception using errcode = 'P0002', message = 'CATALOG_ITEM_NOT_FOUND';
    end if;
    if p_sale_type = 'retail_sale' and v_product.tipo <> 'revenda' then
      raise exception using errcode = '23514', message = 'PRODUCT_NOT_RETAIL';
    end if;

    v_before := coalesce(v_product.quantidade, 0);
    v_after := v_before - v_quantity;
    if coalesce(v_product.controla_estoque, true)
       and v_after < 0 and not coalesce(v_product.permite_venda_estoque_negativo, false) then
      raise exception using errcode = '23514', message = 'INSUFFICIENT_STOCK';
    end if;
    v_price := case when p_sale_type = 'retail_sale'
      then round(v_product.preco_venda, 2) else 0 end;
    if p_sale_type = 'retail_sale' and v_price <= 0 then
      raise exception using errcode = '23514', message = 'INVALID_CATALOG_PRICE';
    end if;

    if coalesce(v_product.controla_estoque, true) then
      update public.produtos
      set quantidade = v_after, updated_at = clock_timestamp()
      where id = v_product_id;
    else
      v_after := v_before;
    end if;

    insert into public.estoque_movimentacoes (
      produto_id, tipo, quantidade, quantidade_anterior, quantidade_atual,
      valor_unitario, valor_total, motivo, usuario_id, request_id
    ) values (
      v_product_id,
      case when p_sale_type = 'retail_sale' then 'venda' else 'uso_interno' end,
      v_quantity, v_before, v_after, v_price, round(v_price * v_quantity, 2),
      case when p_sale_type = 'retail_sale' then 'Venda de produto' else 'Uso interno' end,
      p_admin_id, p_request_id
    );

    v_total := v_total + round(v_price * v_quantity, 2);
    v_products := v_products || jsonb_build_array(jsonb_build_object(
      'product_id', v_product_id, 'name', v_product.nome, 'quantity', v_quantity,
      'price', case when p_sale_type = 'retail_sale' then v_price else null end
    ));
    if v_after <= coalesce(v_product.quantidade_minima, 0) then
      v_alerts := v_alerts || jsonb_build_array(jsonb_build_object(
        'product', v_product.nome, 'quantity', v_after,
        'min_quantity', coalesce(v_product.quantidade_minima, 0)
      ));
    end if;
  end loop;

  v_total := round(v_total, 2);
  if p_sale_type = 'retail_sale' then
    if p_installments > 1 and v_total / p_installments < 100 then
      raise exception using errcode = '23514', message = 'INSTALLMENT_VALUE_TOO_LOW';
    end if;
    insert into public.transacoes (
      tipo, descricao, categoria, valor, metodo, data, unit_id,
      request_id, criado_por, profissional_id
    ) values (
      'receita', 'Venda de produtos ' || p_request_id::text, 'Vendas', v_total,
      v_payment_method, current_date, p_unit_id, p_request_id, p_admin_id, p_professional_id
    ) returning id into v_transaction_id;
  end if;

  return jsonb_build_object(
    'duplicate', false, 'request_id', p_request_id, 'sale_type', p_sale_type,
    'transaction_id', v_transaction_id, 'total_amount', v_total,
    'products', v_products,
    'low_stock_alerts', case when jsonb_array_length(v_alerts) > 0 then v_alerts else null end
  );
end;
$$;

revoke all on function public.process_product_sale_atomic(uuid, text, uuid, jsonb, text, integer, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.process_product_sale_atomic(uuid, text, uuid, jsonb, text, integer, uuid, uuid)
  to service_role;
