import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { apiError } from '@/lib/api-response';
import { getRequestId } from '@/lib/observability';
import { isUuid, parseJsonObject } from '@/lib/validation';
import { executeProductSale, listSaleProducts } from '@/services/sales';

interface ProductInput { product_id: string; quantity: number }

const PAYMENT_METHODS = new Set(['dinheiro', 'pix', 'credito', 'debito', 'cartao_credito', 'cartao_debito']);

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const params = request.nextUrl.searchParams;
  const retailValue = params.get('is_retail');
  const result = await listSaleProducts(
    { adminId: auth.id, unitId: auth.unitId, requestId, route: '/api/sales' },
    {
      ...(retailValue === 'true' || retailValue === 'false' ? { retail: retailValue === 'true' } : {}),
      category: params.get('category'),
      search: params.get('search'),
      lowStock: params.get('low_stock') === 'true',
    },
  );
  if (!result.ok) return apiError(result.code, result.message, result.status, requestId);
  return NextResponse.json({ products: result.data });
}

export async function POST(request: NextRequest) {
  const auditRequestId = getRequestId(request);
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await parseJsonObject(request, { maxBytes: 65_536 });
    const saleType = typeof body.sale_type === 'string' ? body.sale_type : '';
    const professionalId = typeof body.professional_id === 'string' ? body.professional_id : '';
    const paymentMethod = typeof body.payment_method === 'string' ? body.payment_method : 'dinheiro';
    const operationRequestId = isUuid(body.request_id) ? body.request_id : randomUUID();
    const installments = typeof body.installments === 'number' ? body.installments : 1;
    const products = normalizeProducts(body.products);
    if (!['retail_sale', 'internal_use'].includes(saleType) || !isUuid(professionalId)
      || !products || !Number.isInteger(installments) || installments < 1 || installments > 12
      || (saleType === 'retail_sale' && !PAYMENT_METHODS.has(paymentMethod))) {
      return apiError('INVALID_INPUT', 'Payload de venda inválido', 400, auditRequestId);
    }
    const result = await executeProductSale(
      { adminId: auth.id, unitId: auth.unitId, requestId: auditRequestId, route: '/api/sales' },
      { requestId: operationRequestId, saleType, professionalId, products, paymentMethod, installments },
    );
    if (!result.ok) return apiError(result.code, result.message, result.status, auditRequestId);
    const payload = typeof result.data === 'object' && result.data !== null ? result.data : {};
    return NextResponse.json({ success: true, ...payload }, { status: 201 });
  } catch {
    return apiError('INVALID_INPUT', 'Payload de venda inválido', 400, auditRequestId);
  }
}

function normalizeProducts(value: unknown): ProductInput[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return null;
  const products = new Map<string, number>();
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;
    const productId = item.product_id;
    const quantity = item.quantity;
    if (!isUuid(productId) || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) return null;
    const total = (products.get(productId) ?? 0) + quantity;
    if (total > 1000) return null;
    products.set(productId, total);
  }
  return [...products].map(([product_id, quantity]) => ({ product_id, quantity }));
}
