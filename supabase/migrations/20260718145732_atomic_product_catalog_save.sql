create table if not exists public.produto_operacoes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  criado_por uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.produto_operacoes enable row level security;
revoke all on table public.produto_operacoes from anon, authenticated;
grant select, insert on table public.produto_operacoes to service_role;
create index if not exists produto_operacoes_produto_idx on public.produto_operacoes (produto_id, created_at desc);

create or replace function public.save_product_atomic(
  p_product_id uuid,
  p_payload jsonb,
  p_actor_id uuid,
  p_request_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_product public.produtos%rowtype;
  v_operation public.produto_operacoes%rowtype;
  v_id uuid := coalesce(p_product_id, gen_random_uuid());
  v_previous_quantity integer := 0;
  v_quantity integer;
  v_cost numeric;
  v_price numeric;
  v_margin numeric;
  v_name text;
  v_type text;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or p_actor_id is null or p_request_id is null then
    raise exception using errcode = '22023', message = 'invalid_product';
  end if;

  select * into v_operation from public.produto_operacoes where request_id = p_request_id;
  if found then
    return jsonb_build_object('product_id', v_operation.produto_id, 'replayed', true);
  end if;

  v_name := btrim(coalesce(p_payload->>'nome', ''));
  v_type := p_payload->>'tipo';
  v_quantity := (p_payload->>'quantidade')::integer;
  v_cost := round((p_payload->>'preco_custo')::numeric, 2);
  v_price := round((p_payload->>'preco_venda')::numeric, 2);
  if char_length(v_name) not between 1 and 160 or v_type not in ('revenda', 'uso_interno', 'insumo')
     or v_quantity < 0 or v_quantity > 100000000 or v_cost < 0 or v_price < 0
     or (p_payload->>'quantidade_minima')::integer < 0
     or (p_payload->>'quantidade_minima')::integer > 100000000
     or (p_payload->>'percentual_comissao')::numeric not between 0 and 100
     or char_length(coalesce(p_payload->>'unidade_medida', '')) not between 1 and 20
     or char_length(coalesce(p_payload->>'descricao', '')) > 2000
     or char_length(coalesce(p_payload->>'observacoes', '')) > 2000 then
    raise exception using errcode = '22023', message = 'invalid_product';
  end if;
  v_margin := case when v_cost > 0 then round(((v_price - v_cost) / v_cost) * 100, 2) else 0 end;

  if p_product_id is not null then
    select * into v_product from public.produtos where id = p_product_id for update;
    if not found then raise exception using errcode = 'P0002', message = 'product_not_found'; end if;
    v_previous_quantity := coalesce(v_product.quantidade, 0);
    update public.produtos set
      codigo = nullif(btrim(p_payload->>'codigo'), ''),
      codigo_barras = nullif(btrim(p_payload->>'codigo_barras'), ''),
      nome = v_name,
      descricao = nullif(btrim(p_payload->>'descricao'), ''),
      grupo_id = nullif(p_payload->>'grupo_id', '')::uuid,
      categoria = nullif(btrim(p_payload->>'categoria'), ''),
      tipo = v_type,
      fornecedor_id = nullif(p_payload->>'fornecedor_id', '')::uuid,
      quantidade = v_quantity,
      quantidade_minima = (p_payload->>'quantidade_minima')::integer,
      unidade_medida = p_payload->>'unidade_medida',
      preco_custo = v_cost,
      preco_venda = v_price,
      margem_lucro = v_margin,
      controla_estoque = (p_payload->>'controla_estoque')::boolean,
      permite_venda_estoque_negativo = (p_payload->>'permite_venda_estoque_negativo')::boolean,
      ativo = (p_payload->>'ativo')::boolean,
      gera_comissao = (p_payload->>'gera_comissao')::boolean,
      percentual_comissao = round((p_payload->>'percentual_comissao')::numeric, 2),
      localizacao = nullif(btrim(p_payload->>'localizacao'), ''),
      observacoes = nullif(btrim(p_payload->>'observacoes'), ''),
      updated_at = now()
    where id = p_product_id;
  else
    insert into public.produtos (
      id,codigo,codigo_barras,nome,descricao,grupo_id,categoria,tipo,fornecedor_id,
      quantidade,quantidade_minima,unidade_medida,preco_custo,preco_venda,margem_lucro,
      controla_estoque,permite_venda_estoque_negativo,ativo,gera_comissao,
      percentual_comissao,localizacao,observacoes
    ) values (
      v_id,nullif(btrim(p_payload->>'codigo'), ''),nullif(btrim(p_payload->>'codigo_barras'), ''),
      v_name,nullif(btrim(p_payload->>'descricao'), ''),nullif(p_payload->>'grupo_id', '')::uuid,
      nullif(btrim(p_payload->>'categoria'), ''),v_type,nullif(p_payload->>'fornecedor_id', '')::uuid,
      v_quantity,(p_payload->>'quantidade_minima')::integer,p_payload->>'unidade_medida',v_cost,v_price,v_margin,
      (p_payload->>'controla_estoque')::boolean,(p_payload->>'permite_venda_estoque_negativo')::boolean,
      (p_payload->>'ativo')::boolean,(p_payload->>'gera_comissao')::boolean,
      round((p_payload->>'percentual_comissao')::numeric, 2),nullif(btrim(p_payload->>'localizacao'), ''),
      nullif(btrim(p_payload->>'observacoes'), '')
    );
  end if;

  if v_quantity <> v_previous_quantity then
    insert into public.estoque_movimentacoes
      (produto_id,tipo,quantidade,quantidade_anterior,quantidade_atual,valor_unitario,valor_total,motivo,usuario_id,request_id)
    values
      (v_id,'ajuste',abs(v_quantity-v_previous_quantity),v_previous_quantity,v_quantity,v_cost,
       round(abs(v_quantity-v_previous_quantity)*v_cost,2),'Cadastro/edição de produto',p_actor_id,p_request_id);
  end if;

  insert into public.produto_operacoes (request_id,produto_id,criado_por)
  values (p_request_id,v_id,p_actor_id) returning * into v_operation;
  return jsonb_build_object('product_id',v_id,'replayed',false);
end;
$$;

revoke all on function public.save_product_atomic(uuid,jsonb,uuid,uuid) from public, anon, authenticated;
grant execute on function public.save_product_atomic(uuid,jsonb,uuid,uuid) to service_role;
