import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { invalidateFinancialStats } from '@/lib/financial-stats-cache';
import { createServerSupabase } from '@/lib/supabase-server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES = new Set(['entrada', 'saida', 'ajuste', 'uso_interno', 'perda', 'devolucao']);

export async function GET(request:NextRequest){
  const auth=await requireAdmin(request);if(auth instanceof NextResponse)return auth;
  const since=new Date(Date.now()-7*86_400_000).toISOString();
  const {data,error}=await createServerSupabase(auth.unitId).from('estoque_movimentacoes')
    .select('id,produto_id,quantidade,valor_unitario,valor_total,created_at,produtos(nome)')
    .eq('unit_id',auth.unitId).eq('tipo','venda').is('estornada_em',null).gte('created_at',since)
    .order('created_at',{ascending:false}).limit(100);
  if(error){
    return NextResponse.json({error:'Não foi possível listar as vendas'},{status:500});}
  return NextResponse.json({vendas:data??[]});
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const body = await request.json();
    const productId = typeof body.produto_id === 'string' ? body.produto_id : '';
    const type = typeof body.tipo === 'string' ? body.tipo : '';
    const quantity = Number(body.quantidade);
    const unitValue = Number(body.valor_unitario ?? 0);
    if (!UUID_PATTERN.test(productId) || !TYPES.has(type) || !Number.isInteger(quantity)
      || quantity<=0 || quantity>100000 || !Number.isFinite(unitValue) || unitValue<0) {
      return NextResponse.json({ error: 'Movimentação inválida' }, { status: 400 });
    }
    const { data, error } = await createServerSupabase(authResult.unitId).rpc('adjust_inventory_atomic' as never, {
      p_product_id: productId,
      p_movement_type: type,
      p_quantity: quantity,
      p_unit_value: Math.round(unitValue*100)/100,
      p_reason: typeof body.motivo === 'string' ? body.motivo.trim().slice(0,1000) : '',
      p_admin_id: authResult.id,
    } as never);
    if (error) {
      const status = error.message==='PRODUCT_NOT_FOUND' ? 404
        : error.message==='INSUFFICIENT_STOCK' ? 409
          : error.message==='INVALID_INVENTORY_ADJUSTMENT' ? 400 : 500;
      return NextResponse.json({ error: status===404 ? 'Produto não encontrado'
        : status===409 ? 'Estoque insuficiente' : status===400 ? 'Movimentação inválida'
          : 'Não foi possível movimentar o estoque' },{ status });
    }
    return NextResponse.json({ ok:true,data });
  } catch {
    return NextResponse.json({ error:'Erro interno' },{ status:500 });
  }
}

export async function DELETE(request:NextRequest){
  const auth=await requireAdmin(request);if(auth instanceof NextResponse)return auth;
  const id=request.nextUrl.searchParams.get('movimentacao_id');
  const body=await request.json().catch(()=>null);const reason=typeof body?.motivo==='string'?body.motivo.trim():'';
  if(!id||!UUID_PATTERN.test(id)||!reason||reason.length>1000)
    return NextResponse.json({error:'Dados de estorno inválidos'},{status:400});
  const {data,error}=await createServerSupabase(auth.unitId).rpc('reverse_stock_sale_atomic' as never,{
    p_movement_id:id,p_reason:reason,p_admin_id:auth.id,
    p_unit_id:auth.unitId} as never);
  if(error){const status=error.message==='MOVEMENT_NOT_FOUND'||error.message==='PRODUCT_NOT_FOUND'?404:
    error.message==='MOVEMENT_NOT_REVERSIBLE'?409:error.message==='REASON_REQUIRED'?400:500;
    return NextResponse.json({error:status===404?'Venda não encontrada':status===409?
      'Venda não pode ser estornada':status===400?'Motivo obrigatório':'Não foi possível estornar a venda'},{status});}
  invalidateFinancialStats();
  return NextResponse.json({ok:true,data});
}
