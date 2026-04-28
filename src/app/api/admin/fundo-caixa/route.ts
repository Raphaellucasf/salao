import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const DEFAULT_UNIT_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/admin/fundo-caixa  — saldo atual + últimas movimentações
export async function GET(_req: NextRequest) {
  const supabase = createServerSupabase();

  const [{ data: fundo }, { data: movs }] = await Promise.all([
    (supabase as any)
      .from('fundo_caixa')
      .select('*')
      .eq('unit_id', DEFAULT_UNIT_ID)
      .maybeSingle(),
    (supabase as any)
      .from('fundo_caixa_movimentacoes')
      .select('*')
      .eq('unit_id', DEFAULT_UNIT_ID)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  return NextResponse.json({
    saldo: fundo?.valor ?? 0,
    movimentacoes: movs ?? [],
  });
}

// POST /api/admin/fundo-caixa  — depositar ou retirar
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { tipo, valor, descricao, user_id } = body;

    if (!tipo || !valor || !descricao) {
      return NextResponse.json(
        { error: 'tipo, valor e descricao são obrigatórios' },
        { status: 400 },
      );
    }
    if (!['deposito', 'retirada'].includes(tipo)) {
      return NextResponse.json({ error: 'tipo deve ser deposito ou retirada' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Busca saldo atual
    const { data: fundo } = await (supabase as any)
      .from('fundo_caixa')
      .select('valor')
      .eq('unit_id', DEFAULT_UNIT_ID)
      .maybeSingle();

    const saldoAtual = Number(fundo?.valor ?? 0);
    const valorNum = Number(valor);
    const novoSaldo = tipo === 'deposito' ? saldoAtual + valorNum : saldoAtual - valorNum;

    if (novoSaldo < 0) {
      return NextResponse.json(
        { error: `Saldo insuficiente no fundo de caixa. Saldo atual: R$ ${saldoAtual.toFixed(2)}` },
        { status: 400 },
      );
    }

    // Atualiza saldo
    const { error: errFundo } = await (supabase as any)
      .from('fundo_caixa')
      .upsert([{
        unit_id: DEFAULT_UNIT_ID,
        valor: novoSaldo,
        updated_at: new Date().toISOString(),
        updated_by: user_id ?? null,
      }], { onConflict: 'unit_id' });

    if (errFundo) return NextResponse.json({ error: errFundo.message }, { status: 500 });

    // Registra movimentação
    const { error: errMov } = await (supabase as any)
      .from('fundo_caixa_movimentacoes')
      .insert([{
        unit_id: DEFAULT_UNIT_ID,
        tipo,
        valor: valorNum,
        descricao,
        saldo_apos: novoSaldo,
        criado_por: user_id ?? null,
      }]);

    if (errMov) return NextResponse.json({ error: errMov.message }, { status: 500 });

    return NextResponse.json({ ok: true, novo_saldo: novoSaldo });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
