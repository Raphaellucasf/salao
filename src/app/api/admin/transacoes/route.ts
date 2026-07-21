import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { apiError } from '@/lib/api-response';
import { getRequestId } from '@/lib/observability';
import { asBoundedText, asMoney, isIsoDate, parseJsonObject } from '@/lib/validation';
import { createTransaction, listTransactions } from '@/services/transactions';

const METHODS = new Set(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'Dinheiro', 'Pix', 'Crédito', 'Débito']);

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const startDate = request.nextUrl.searchParams.get('dataInicio');
  const endDate = request.nextUrl.searchParams.get('dataFim');
  if (!startDate || !isIsoDate(startDate) || (endDate && !isIsoDate(endDate))) {
    return apiError('INVALID_INPUT', 'Intervalo de datas inválido', 400, requestId);
  }
  const result = await listTransactions(
    { adminId: auth.id, unitId: auth.unitId, requestId, route: '/api/admin/transacoes' },
    { startDate, endDate },
  );
  if (!result.ok) return apiError(result.code, result.message, result.status, requestId);
  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await parseJsonObject(request);
    const type = body.tipo;
    const description = asBoundedText(body.descricao, 500);
    const amount = asMoney(body.valor);
    const date = body.data;
    const method = asBoundedText(body.metodo, 40) ?? 'dinheiro';
    if ((type !== 'receita' && type !== 'despesa') || !description || !amount || !isIsoDate(date) || !METHODS.has(method)) {
      return apiError('INVALID_INPUT', 'Dados da transação inválidos', 400, requestId);
    }
    const result = await createTransaction(
      { adminId: auth.id, unitId: auth.unitId, requestId, route: '/api/admin/transacoes' },
      {
        tipo: type,
        descricao: description,
        categoria: asBoundedText(body.categoria, 100) ?? '',
        valor: amount,
        metodo: method,
        data: date,
      },
    );
    if (!result.ok) return apiError(result.code, result.message, result.status, requestId);
    return NextResponse.json(result.data);
  } catch {
    return apiError('INVALID_INPUT', 'Payload da transação inválido', 400, requestId);
  }
}
