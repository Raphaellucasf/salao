create or replace function public.adjust_inventory_atomic(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_unit_value numeric,
  p_reason text,
  p_admin_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_product public.produtos%rowtype;
  v_before integer;
  v_after integer;
  v_delta integer;
  v_movement_id uuid;
begin
  if p_movement_type not in ('entrada','saida','ajuste','uso_interno','perda','devolucao')
     or p_quantity<=0 or p_quantity>100000 or p_unit_value<0 then
    raise exception using errcode='22023',message='INVALID_INVENTORY_ADJUSTMENT';
  end if;
  select * into v_product from public.produtos where id=p_product_id for update;
  if not found then raise exception using errcode='P0002',message='PRODUCT_NOT_FOUND'; end if;
  v_delta:=case when p_movement_type in ('entrada','devolucao') then p_quantity else -p_quantity end;
  v_before:=coalesce(v_product.quantidade,0); v_after:=v_before+v_delta;
  if coalesce(v_product.controla_estoque,true) and v_after<0
     and not coalesce(v_product.permite_venda_estoque_negativo,false) then
    raise exception using errcode='23514',message='INSUFFICIENT_STOCK';
  end if;
  if coalesce(v_product.controla_estoque,true) then
    update public.produtos set quantidade=v_after,updated_at=clock_timestamp() where id=p_product_id;
  else
    v_after:=v_before;
  end if;
  insert into public.estoque_movimentacoes(produto_id,tipo,quantidade,quantidade_anterior,
    quantidade_atual,valor_unitario,valor_total,motivo,usuario_id)
  values(p_product_id,p_movement_type,p_quantity,v_before,v_after,round(p_unit_value,2),
    round(p_unit_value*p_quantity,2),left(nullif(trim(p_reason),''),1000),p_admin_id)
  returning id into v_movement_id;
  return jsonb_build_object('movement_id',v_movement_id,'product_id',p_product_id,
    'quantity_before',v_before,'quantity_after',v_after);
end;
$$;

revoke all on function public.adjust_inventory_atomic(uuid,text,integer,numeric,text,uuid)
  from public,anon,authenticated;
grant execute on function public.adjust_inventory_atomic(uuid,text,integer,numeric,text,uuid)
  to service_role;
