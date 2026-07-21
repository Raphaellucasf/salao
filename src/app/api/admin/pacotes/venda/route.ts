import { NextRequest,NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { invalidateFinancialStats } from '@/lib/financial-stats-cache';
import { createServerSupabase } from '@/lib/supabase-server';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const METHODS=new Set(['dinheiro','pix','credito','debito','cartao_credito','cartao_debito']);
export async function POST(request:NextRequest){
 const auth=await requireAdmin(request);if(auth instanceof NextResponse)return auth;
 try{
  const body=await request.json();const clientId=Number(body.cliente_id);
  const quantity=Number(body.quantidade??1);const method=String(body.metodo_pagamento??'');
  if(!UUID.test(String(body.request_id??''))||!UUID.test(String(body.pacote_id??''))
    ||!Number.isSafeInteger(clientId)||clientId<=0||!Number.isInteger(quantity)
    ||quantity<1||quantity>100||!METHODS.has(method))
   return NextResponse.json({error:'Payload de venda inválido'},{status:400});
  const {data,error}=await createServerSupabase(auth.unitId).rpc('sell_package_atomic' as never,{
   p_request_id:body.request_id,p_client_id:clientId,p_package_id:body.pacote_id,
   p_quantity:quantity,p_payment_method:method,p_admin_id:auth.id,p_unit_id:auth.unitId,
  } as never);
  if(error){
   const statuses:Record<string,number>={CLIENT_NOT_FOUND:404,PACKAGE_NOT_FOUND:404,
    PACKAGE_WITHOUT_SERVICES:409,CASH_REGISTER_CLOSED:409,INVALID_QUANTITY:400,
    INVALID_PAYMENT_METHOD:400};const status=statuses[error.message]??500;
   return NextResponse.json({error:status===409?'Caixa fechado ou pacote sem serviços':
    status===404?'Cliente ou pacote não encontrado':status===400?'Dados inválidos':
      'Não foi possível vender o pacote'},{status});
  }
  invalidateFinancialStats();
  return NextResponse.json({ok:true,data});
 }catch{
  return NextResponse.json({error:'Erro interno'},{status:500});}
}
