import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { apiError } from '@/lib/api-response';
import { getRequestId } from '@/lib/observability';
import { asPositiveInteger, isUuid, parseJsonObject } from '@/lib/validation';
import { executeQuickSale } from '@/services/sales';

interface SaleItemInput { tipo: 'servico' | 'produto'; item_id: string; quantidade: number }

const PAYMENT_METHODS = new Set(['dinheiro', 'pix', 'credito', 'debito']);

export async function POST(request: NextRequest) {
  const auditRequestId = getRequestId(request);
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await parseJsonObject(request, { maxBytes: 65_536 });
    const operationRequestId = body.request_id;
    const paymentMethod = body.metodo_pagamento;
    const clientId = body.cliente_id == null ? null : asPositiveInteger(body.cliente_id);
    const items = normalizeItems(body.itens);
    if (!isUuid(operationRequestId) || typeof paymentMethod !== 'string' || !PAYMENT_METHODS.has(paymentMethod)
      || (body.cliente_id != null && clientId === null) || !items) {
      return apiError('INVALID_INPUT', 'Payload de venda inválido', 400, auditRequestId);
    }
    const result = await executeQuickSale(
      { adminId: auth.id, unitId: auth.unitId, requestId: auditRequestId, route: '/api/admin/venda-rapida' },
      { requestId: operationRequestId, clientId, items, paymentMethod },
    );
    if (!result.ok) return apiError(result.code, result.message, result.status, auditRequestId);
    const payload = typeof result.data === 'object' && result.data !== null ? result.data : {};
    return NextResponse.json({ ok: true, ...payload });
  } catch {
    return apiError('INVALID_INPUT', 'Payload de venda inválido', 400, auditRequestId);
  }
}

function normalizeItems(value: unknown): SaleItemInput[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return null;
  const aggregated = new Map<string, SaleItemInput>();
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return null;
    const item = entry as Record<string, unknown>;
    const tipo = item.tipo;
    const itemId = item.item_id;
    const quantidade = item.quantidade;
    if ((tipo !== 'servico' && tipo !== 'produto') || !isUuid(itemId)
      || typeof quantidade !== 'number' || !Number.isInteger(quantidade) || quantidade <= 0) return null;
    const key = `${tipo}:${itemId}`;
    const total = (aggregated.get(key)?.quantidade ?? 0) + quantidade;
    if (total > 1000) return null;
    aggregated.set(key, { tipo, item_id: itemId, quantidade: total });
  }
  return [...aggregated.values()];
}
