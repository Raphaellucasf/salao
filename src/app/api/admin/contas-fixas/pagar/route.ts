import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';
import { invalidateFinancialStats } from '@/lib/financial-stats-cache';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const amount = Number(body.valor_pago);
    const paymentDate = typeof body.data_pagamento === 'string'
      ? body.data_pagamento
      : new Date().toISOString().slice(0, 10);
    const note = typeof body.observacao === 'string' ? body.observacao.trim() : '';
    const requestId = typeof body.request_id === 'string' && UUID_PATTERN.test(body.request_id)
      ? body.request_id
      : crypto.randomUUID();

    if (!UUID_PATTERN.test(body.conta_fixa_id ?? '') || !Number.isFinite(amount) || amount <= 0
      || amount > 100_000_000 || !DATE_PATTERN.test(paymentDate)
      || Number.isNaN(Date.parse(`${paymentDate}T00:00:00Z`)) || note.length > 500) {
      return NextResponse.json({ error: 'Dados do pagamento inválidos' }, { status: 400 });
    }

    const supabase = createServerSupabase(authResult.unitId);
    const { data, error } = await supabase.rpc('pay_fixed_account_atomic', {
      p_unit_id: authResult.unitId,
      p_fixed_account_id: body.conta_fixa_id,
      p_amount: Math.round(amount * 100) / 100,
      p_payment_date: paymentDate,
      p_note: note || null,
      p_actor_id: authResult.id,
      p_request_id: requestId,
    });

    if (error) {
      const status = error.message === 'fixed_account_not_found' ? 404 : 400;
      return NextResponse.json({ error: status === 404 ? 'Conta fixa não encontrada' : 'Não foi possível registrar o pagamento' }, { status });
    }

    invalidateFinancialStats();
    const result = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
