import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { apiError } from '@/lib/api-response';
import { getRequestId } from '@/lib/observability';
import { asBoundedText, asMoney, isIsoDate, parseJsonObject } from '@/lib/validation';
import { createTransaction, listTransactions } from '@/services/transactions';

const METHODS = new Set(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito']);

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await parseJsonObject(request);
    const rawType = body.type;
    const type = rawType === 'income' ? 'receita' : rawType === 'expense' ? 'despesa' : rawType;
    const amount = asMoney(body.amount);
    const description = asBoundedText(body.description, 500);
    const method = asBoundedText(body.payment_method, 40);
    if ((type !== 'receita' && type !== 'despesa') || !amount || !description || !method || !METHODS.has(method)) {
      return apiError('INVALID_INPUT', 'Dados da transação inválidos', 400, requestId);
    }
    const result = await createTransaction(
      { adminId: auth.id, unitId: auth.unitId, requestId, route: '/api/transactions' },
      {
        tipo: type,
        valor: amount,
        descricao: description,
        categoria: asBoundedText(body.category, 100) ?? 'Outros',
        metodo: method,
        data: new Date().toISOString().slice(0, 10),
      },
    );
    if (!result.ok) return apiError(result.code, result.message, result.status, requestId);
    return NextResponse.json({ transaction: result.data }, { status: 201 });
  } catch {
    return apiError('INVALID_INPUT', 'Payload da transação inválido', 400, requestId);
  }
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const params = request.nextUrl.searchParams;
  const startDate = params.get('start_date');
  const endDate = params.get('end_date');
  if ((startDate && !isIsoDate(startDate)) || (endDate && !isIsoDate(endDate))) {
    return apiError('INVALID_INPUT', 'Intervalo de datas inválido', 400, requestId);
  }
  const result = await listTransactions(
    { adminId: auth.id, unitId: auth.unitId, requestId, route: '/api/transactions' },
    { type: params.get('type'), startDate, endDate },
  );
  if (!result.ok) return apiError(result.code, result.message, result.status, requestId);
  return NextResponse.json({ transactions: result.data });
}
