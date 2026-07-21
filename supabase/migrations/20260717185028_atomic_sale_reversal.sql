alter table public.estoque_movimentacoes
 add column if not exists estornada_em timestamptz,
 add column if not exists estornada_por uuid references public.users(id) on delete set null,
 add column if not exists motivo_estorno text,
 add column if not exists movimentacao_origem_id uuid references public.estoque_movimentacoes(id) on delete set null;
create unique index if not exists estoque_movimentacoes_estorno_origem_uidx
 on public.estoque_movimentacoes(movimentacao_origem_id) where movimentacao_origem_id is not null;
alter table public.transacoes add column if not exists estorno_movimentacao_id uuid
 references public.estoque_movimentacoes(id) on delete set null;
create unique index if not exists transacoes_estorno_movimentacao_uidx
 on public.transacoes(estorno_movimentacao_id) where estorno_movimentacao_id is not null;

create or replace function public.reverse_stock_sale_atomic(
 p_movement_id uuid,p_reason text,p_admin_id uuid,p_unit_id uuid)
returns jsonb language plpgsql set search_path=pg_catalog,public as $$
declare v_movement public.estoque_movimentacoes%rowtype;v_product public.produtos%rowtype;
 v_before integer;v_after integer;v_refund_id bigint;v_original public.transacoes%rowtype;
begin
 select * into v_movement from public.estoque_movimentacoes where id=p_movement_id for update;
 if not found then raise exception using errcode='P0002',message='MOVEMENT_NOT_FOUND';end if;
 if v_movement.tipo<>'venda' then raise exception using errcode='23514',message='MOVEMENT_NOT_REVERSIBLE';end if;
 if v_movement.estornada_em is not null then
  select id into v_refund_id from public.transacoes where estorno_movimentacao_id=p_movement_id;
  return jsonb_build_object('duplicate',true,'refund_transaction_id',v_refund_id);
 end if;
 if nullif(trim(p_reason),'') is null then raise exception using errcode='22023',message='REASON_REQUIRED';end if;
 select * into v_product from public.produtos where id=v_movement.produto_id for update;
 if not found then raise exception using errcode='P0002',message='PRODUCT_NOT_FOUND';end if;
 v_before:=coalesce(v_product.quantidade,0);v_after:=v_before+ceil(abs(v_movement.quantidade))::integer;
 update public.produtos set quantidade=v_after,updated_at=clock_timestamp() where id=v_product.id;
 update public.estoque_movimentacoes set estornada_em=clock_timestamp(),estornada_por=p_admin_id,
  motivo_estorno=left(trim(p_reason),1000) where id=p_movement_id;
 insert into public.estoque_movimentacoes(produto_id,tipo,quantidade,quantidade_anterior,quantidade_atual,
  valor_unitario,valor_total,motivo,comanda_id,usuario_id,movimentacao_origem_id)
 values(v_product.id,'devolucao',abs(v_movement.quantidade),v_before,v_after,v_movement.valor_unitario,
  v_movement.valor_total,'Estorno: '||left(trim(p_reason),900),v_movement.comanda_id,p_admin_id,p_movement_id);
 select * into v_original from public.transacoes where
  (v_movement.request_id is not null and request_id=v_movement.request_id)
  or (v_movement.comanda_id is not null and comanda_id=v_movement.comanda_id and tipo='receita')
 order by id limit 1;
 if coalesce(v_movement.valor_total,0)>0 then
  insert into public.transacoes(tipo,descricao,categoria,valor,metodo,data,unit_id,criado_por,
    estorno_movimentacao_id)
  values('despesa','Estorno de venda '||p_movement_id::text,'Estornos',round(abs(v_movement.valor_total),2),
    coalesce(v_original.metodo,'estorno'),current_date,coalesce(v_original.unit_id,p_unit_id),p_admin_id,p_movement_id)
  returning id into v_refund_id;
 end if;
 return jsonb_build_object('duplicate',false,'quantity_after',v_after,'refund_transaction_id',v_refund_id);
end;$$;
revoke all on function public.reverse_stock_sale_atomic(uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.reverse_stock_sale_atomic(uuid,text,uuid,uuid) to service_role;
