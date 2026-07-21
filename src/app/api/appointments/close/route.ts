import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { invalidateFinancialStats } from '@/lib/financial-stats-cache';
import { createServerSupabase } from '@/lib/supabase-server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_METHODS = new Set(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito']);

const ERRORS: Record<string, { status: number; message: string }> = {
  APPOINTMENT_NOT_FOUND: { status: 404, message: 'Agendamento não encontrado' },
  APPOINTMENT_HAS_COMANDA: { status: 409, message: 'Conclua este agendamento pelo fechamento da comanda' },
  APPOINTMENT_CANCELLED: { status: 409, message: 'Agendamento cancelado não pode ser concluído' },
  INVALID_APPOINTMENT_VALUE: { status: 409, message: 'Valor financeiro do agendamento inválido' },
  INVALID_COMMISSION_PERCENTAGE: { status: 409, message: 'Percentual de comissão inválido' },
  INVALID_PAYMENT_METHOD: { status: 400, message: 'Método de pagamento inválido' },
};

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const appointmentId = typeof body.appointment_id === 'string' ? body.appointment_id : '';
    const paymentMethod = typeof body.payment_method === 'string' ? body.payment_method : '';

    if (!UUID_PATTERN.test(appointmentId) || !PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json({ error: 'Dados de fechamento inválidos' }, { status: 400 });
    }

    const { data, error } = await createServerSupabase(authResult.unitId).rpc('close_appointment_atomic' as never, {
      p_appointment_id: appointmentId,
      p_payment_method: paymentMethod,
      p_admin_id: authResult.id,
      p_unit_id: authResult.unitId,
    } as never);

    if (error) {
      const mapped = ERRORS[error.message];
      return NextResponse.json(
        { error: mapped?.message ?? 'Não foi possível concluir o agendamento' },
        { status: mapped?.status ?? 500 },
      );
    }

    invalidateFinancialStats();
    return NextResponse.json({ message: 'Agendamento finalizado com sucesso', data });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
