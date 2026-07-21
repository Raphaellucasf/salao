alter table public.pacotes_cliente add column if not exists source_request_id uuid;
create unique index if not exists pacotes_cliente_request_servico_uidx
  on public.pacotes_cliente(source_request_id,servico_id) where source_request_id is not null;

create or replace function public.sell_package_atomic(
  p_request_id uuid,
  p_client_id bigint,
  p_package_id uuid,
  p_quantity integer,
  p_payment_method text,
  p_admin_id uuid,
  p_unit_id uuid
)
returns jsonb
language plpgsql
set search_path=pg_catalog,public
as $$
declare
 v_client public.clientes%rowtype;v_package public.pacotes_servicos%rowtype;
 v_transaction_id bigint;v_total numeric(14,2);v_rows integer;v_method text;
begin
 select id into v_transaction_id from public.transacoes where request_id=p_request_id;
 if found then return jsonb_build_object('duplicate',true,'transaction_id',v_transaction_id); end if;
 if p_quantity<1 or p_quantity>100 then raise exception using errcode='22023',message='INVALID_QUANTITY'; end if;
 v_method:=case p_payment_method when 'credito' then 'cartao_credito'
   when 'debito' then 'cartao_debito' else p_payment_method end;
 if v_method not in ('dinheiro','pix','cartao_credito','cartao_debito') then
   raise exception using errcode='22023',message='INVALID_PAYMENT_METHOD'; end if;
 select * into v_client from public.clientes where id=p_client_id and coalesce(ativo,true);
 if not found then raise exception using errcode='P0002',message='CLIENT_NOT_FOUND'; end if;
 select * into v_package from public.pacotes_servicos where id=p_package_id and coalesce(ativo,true) for share;
 if not found then raise exception using errcode='P0002',message='PACKAGE_NOT_FOUND'; end if;
 if not exists(select 1 from public.pacotes_servicos_itens where pacote_id=p_package_id) then
   raise exception using errcode='23514',message='PACKAGE_WITHOUT_SERVICES'; end if;
 if not exists(select 1 from public.abertura_caixa where unit_id=p_unit_id and data=current_date)
    or exists(select 1 from public.fechamentos_caixa where unit_id=p_unit_id
      and data_fechamento=current_date and status='fechado') then
   raise exception using errcode='23514',message='CASH_REGISTER_CLOSED'; end if;
 v_total:=round(v_package.preco_total*p_quantity,2);
 insert into public.transacoes(tipo,descricao,categoria,valor,metodo,data,unit_id,request_id,criado_por)
 values('receita','Venda de pacote '||p_request_id::text,'Pacotes',v_total,v_method,current_date,
   p_unit_id,p_request_id,p_admin_id) returning id into v_transaction_id;
 insert into public.pacotes_cliente(unit_id,cliente_id,cliente_cpf,servico_id,sessoes_total,
   sessoes_consumidas,data_validade,source_request_id)
 select p_unit_id,p_client_id,v_client.cpf,psi.servico_id,
   sum(coalesce(psi.quantidade,1)*p_quantity)::integer,0,
   case when v_package.validade_dias is null then null else current_date+v_package.validade_dias end,
   p_request_id
 from public.pacotes_servicos_itens psi where psi.pacote_id=p_package_id group by psi.servico_id
 on conflict(source_request_id,servico_id) where source_request_id is not null do nothing;
 get diagnostics v_rows=row_count;
 return jsonb_build_object('duplicate',false,'transaction_id',v_transaction_id,'total',v_total,
   'balances_created',v_rows);
end;
$$;
revoke all on function public.sell_package_atomic(uuid,bigint,uuid,integer,text,uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.sell_package_atomic(uuid,bigint,uuid,integer,text,uuid,uuid) to service_role;
