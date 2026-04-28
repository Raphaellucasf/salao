import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const DEFAULT_UNIT_ID = '00000000-0000-0000-0000-000000000001';

// POST /api/admin/contas-fixas/pagar
// Body: { conta_fixa_id, valor_pago, data_pagamento, observacao, user_id }
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { conta_fixa_id, valor_pago, data_pagamento, observacao, user_id } = body;

    if (!conta_fixa_id || valor_pago === undefined) {
      return NextResponse.json(
        { error: 'conta_fixa_id e valor_pago são obrigatórios' },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();

    // 1. Busca dados da conta fixa
    const { data: conta, error: errConta } = await (supabase as any)
      .from('contas_fixas')
      .select('nome, categoria')
      .eq('id', conta_fixa_id)
      .eq('unit_id', DEFAULT_UNIT_ID)
      .maybeSingle();

    if (errConta || !conta) {
      return NextResponse.json({ error: 'Conta fixa não encontrada' }, { status: 404 });
    }

    const dataPag = data_pagamento ?? new Date().toISOString().split('T')[0];

    // 2. Cria transação de despesa
    const { data: transacao, error: errTx } = await (supabase as any)
      .from('transacoes')
      .insert([{
        unit_id: DEFAULT_UNIT_ID,
        tipo: 'despesa',
        valor: Number(valor_pago),
        descricao: `Conta fixa: ${conta.nome}${observacao ? ` — ${observacao}` : ''}`,
        categoria: conta.categoria ?? 'contas_fixas',
        data: dataPag,
        metodo: 'dinheiro',
      }])
      .select('id')
      .single();

    if (errTx) return NextResponse.json({ error: errTx.message }, { status: 500 });

    // 3. Registra pagamento da conta fixa
    const { error: errPag } = await (supabase as any)
      .from('contas_fixas_pagamentos')
      .insert([{
        unit_id: DEFAULT_UNIT_ID,
        conta_fixa_id,
        valor_pago: Number(valor_pago),
        data_pagamento: dataPag,
        transacao_id: transacao?.id ?? null,
        observacao: observacao ?? null,
        pago_por: user_id ?? null,
      }]);

    if (errPag) return NextResponse.json({ error: errPag.message }, { status: 500 });

    return NextResponse.json({ ok: true, transacao_id: transacao?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
