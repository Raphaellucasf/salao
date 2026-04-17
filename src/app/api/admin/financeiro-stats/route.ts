import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// GET /api/admin/financeiro-stats?hoje=2026-04-13&inicioMes=2026-04-01
export async function GET(req: NextRequest) {
  const hoje = req.nextUrl.searchParams.get('hoje');
  const inicioMes = req.nextUrl.searchParams.get('inicioMes');

  if (!hoje || !inicioMes) {
    return NextResponse.json({ error: 'hoje e inicioMes são obrigatórios' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const [{ data: hojeRows, error: e1 }, { data: mesRows, error: e2 }] = await Promise.all([
    (supabase as any)
      .from('transacoes')
      .select('valor')
      .eq('tipo', 'receita')
      .eq('data', hoje),
    (supabase as any)
      .from('transacoes')
      .select('valor')
      .eq('tipo', 'receita')
      .gte('data', inicioMes),
  ]);

  if (e1 || e2) {
    return NextResponse.json({ error: e1?.message || e2?.message }, { status: 500 });
  }

  const faturamentoHoje = ((hojeRows ?? []) as { valor: number }[])
    .reduce((s, t) => s + Number(t.valor), 0);
  const faturamentoMes = ((mesRows ?? []) as { valor: number }[])
    .reduce((s, t) => s + Number(t.valor), 0);

  return NextResponse.json({ faturamentoHoje, faturamentoMes });
}
