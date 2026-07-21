import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';
import { invalidateFinancialStats } from '@/lib/financial-stats-cache';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ERRORS: Record<string, { status: number; message: string }> = {
  COMANDA_NOT_FOUND: { status: 404, message: 'Comanda não encontrada' },
  COMANDA_NOT_OPEN: { status: 409, message: 'A comanda não está aberta' },
  CLOSED_COMANDA_WITHOUT_TRANSACTION: { status: 409, message: 'Comanda fechada sem lançamento financeiro' },
  INVALID_COMANDA_ITEM: { status: 409, message: 'A comanda contém itens inválidos' },
  INVALID_DISCOUNT: { status: 400, message: 'Desconto inválido' },
  INVALID_PAYMENT_METHOD: { status: 400, message: 'Método de pagamento inválido' },
  PAYMENT_METHOD_NOT_FOUND: { status: 404, message: 'Forma de pagamento não encontrada ou inativa' },
  INVALID_INSTALLMENTS: { status: 400, message: 'Número de parcelas fora das regras configuradas' },
};

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const comandaId = Number(body.comanda_id);
    const paymentMethodId = typeof body.forma_pagamento_id === 'string' ? body.forma_pagamento_id : '';
    const installments = Number(body.parcelas ?? 1);
    const desconto = Number(body.desconto ?? 0);

    if (!Number.isSafeInteger(comandaId) || comandaId <= 0 || !UUID_PATTERN.test(paymentMethodId)
      || !Number.isSafeInteger(installments) || installments < 1 || installments > 120
      || !Number.isFinite(desconto) || desconto < 0) {
      return NextResponse.json({ error: 'Dados de fechamento inválidos' }, { status: 400 });
    }

    const { data, error } = await createServerSupabase(authResult.unitId).rpc('close_comanda_with_payment_atomic' as never, {
      p_comanda_id: comandaId,
      p_payment_method_id: paymentMethodId,
      p_installments: installments,
      p_discount: Math.round(desconto * 100) / 100,
      p_admin_id: authResult.id,
      p_unit_id: authResult.unitId,
    } as never);

    if (error) {
      const mapped = ERRORS[error.message];
      return NextResponse.json(
        { error: mapped?.message ?? 'Não foi possível fechar a comanda' },
        { status: mapped?.status ?? 500 },
      );
    }

    invalidateFinancialStats();
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
