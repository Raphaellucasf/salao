-- Cancelamento seguro de comanda aberta com restauracao de estoque e pacotes.

create or replace function public.cancel_comanda_atomic(
  p_comanda_id bigint,
  p_admin_id uuid
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_command public.comandas%rowtype;
  v_product public.produtos%rowtype;
  v_item record;
  v_supply record;
  v_consumption record;
  v_before integer;
  v_after integer;
  v_quantity integer;
begin
  select * into v_command from public.comandas where id=p_comanda_id for update;
  if not found then raise exception using errcode='P0002',message='COMANDA_NOT_FOUND'; end if;
  if v_command.status<>'aberta' then
    raise exception using errcode='23514',message='ONLY_OPEN_COMANDA_CAN_BE_CANCELLED';
  end if;

  perform p.id from public.produtos p where p.id in (
    select ci.item_id::uuid from public.comanda_itens ci
      where ci.comanda_id=p_comanda_id and ci.tipo='produto' and ci.item_id is not null
    union
    select sp.produto_id from public.servicos_produtos sp where sp.servico_id in (
      select ci.item_id::uuid from public.comanda_itens ci
      where ci.comanda_id=p_comanda_id and ci.tipo='servico' and ci.item_id is not null
    )
  ) order by p.id for update;

  for v_item in select * from public.comanda_itens where comanda_id=p_comanda_id order by id
  loop
    if v_item.tipo='produto' and v_item.item_id is not null then
      select * into v_product from public.produtos where id=v_item.item_id::uuid;
      if found and coalesce(v_product.controla_estoque,true) then
        v_quantity:=ceil(coalesce(v_item.quantidade,0))::integer;
        v_before:=coalesce(v_product.quantidade,0); v_after:=v_before+v_quantity;
        update public.produtos set quantidade=v_after,updated_at=clock_timestamp() where id=v_product.id;
        insert into public.estoque_movimentacoes(produto_id,tipo,quantidade,quantidade_anterior,
          quantidade_atual,valor_unitario,valor_total,motivo,comanda_id,usuario_id)
        values(v_product.id,'devolucao',v_quantity,v_before,v_after,v_item.valor_unitario,
          v_item.valor_total,'Cancelamento de comanda',p_comanda_id,p_admin_id);
      end if;
    elsif v_item.tipo='servico' and v_item.item_id is not null then
      for v_supply in select * from public.servicos_produtos where servico_id=v_item.item_id::uuid
      loop
        select * into v_product from public.produtos where id=v_supply.produto_id;
        if found and coalesce(v_product.controla_estoque,true) then
          v_quantity:=ceil(v_supply.quantidade_media*coalesce(v_item.quantidade,0))::integer;
          v_before:=coalesce(v_product.quantidade,0); v_after:=v_before+v_quantity;
          update public.produtos set quantidade=v_after,updated_at=clock_timestamp() where id=v_product.id;
          insert into public.estoque_movimentacoes(produto_id,tipo,quantidade,quantidade_anterior,
            quantidade_atual,motivo,comanda_id,usuario_id)
          values(v_product.id,'devolucao',v_quantity,v_before,v_after,
            'Cancelamento de consumo de insumo',p_comanda_id,p_admin_id);
        end if;
      end loop;
    end if;
  end loop;

  for v_consumption in select * from public.comanda_pacote_consumos
    where comanda_id=p_comanda_id for update
  loop
    update public.pacotes_cliente
    set sessoes_consumidas=greatest(0,sessoes_consumidas-v_consumption.quantidade)
    where id=v_consumption.pacote_cliente_id;
  end loop;

  delete from public.agendamentos where comanda_id=p_comanda_id;
  delete from public.comandas where id=p_comanda_id;
  return jsonb_build_object('comanda_id',p_comanda_id,'numero_comanda',v_command.numero_comanda);
end;
$$;

revoke all on function public.cancel_comanda_atomic(bigint,uuid) from public,anon,authenticated;
grant execute on function public.cancel_comanda_atomic(bigint,uuid) to service_role;
