import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServerSupabase(authResult.unitId);
  const [fundResult, movementsResult] = await Promise.all([
    supabase.from('fundo_caixa').select('valor').eq('unit_id', authResult.unitId).maybeSingle(),
    supabase.from('fundo_caixa_movimentacoes').select('*').eq('unit_id', authResult.unitId)
      .order('created_at', { ascending: false }).limit(30),
  ]);
  if (fundResult.error || movementsResult.error) {
    return NextResponse.json({ error: 'Não foi possível carregar o fundo de caixa' }, { status: 500 });
  }
  return NextResponse.json({ saldo: fundResult.data?.valor ?? 0, movimentacoes: movementsResult.data ?? [] });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const amount = Number(body.valor);
    const description = typeof body.descricao === 'string' ? body.descricao.trim() : '';
    const requestId = typeof body.request_id === 'string' && UUID_PATTERN.test(body.request_id)
      ? body.request_id
      : crypto.randomUUID();
    if (!['deposito', 'retirada'].includes(body.tipo) || !Number.isFinite(amount) || amount <= 0
      || amount > 100_000_000 || !description || description.length > 500) {
      return NextResponse.json({ error: 'Dados da movimentação inválidos' }, { status: 400 });
    }

    const supabase = createServerSupabase(authResult.unitId);
    const { data, error } = await supabase.rpc('adjust_cash_fund_atomic', {
      p_unit_id: authResult.unitId,
      p_type: body.tipo,
      p_amount: Math.round(amount * 100) / 100,
      p_description: description,
      p_actor_id: authResult.id,
      p_request_id: requestId,
    });
    if (error) {
      const insufficient = error.message === 'insufficient_fund_balance';
      return NextResponse.json(
        { error: insufficient ? 'Saldo insuficiente no fundo de caixa' : 'Não foi possível movimentar o fundo de caixa' },
        { status: 400 },
      );
    }
    const result = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    return NextResponse.json({
      ok: true,
      novo_saldo: 'balance' in result ? result.balance : null,
      replayed: 'replayed' in result ? result.replayed : false,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
