import { createServerSupabase } from '@/lib/supabase-server';
import { invalidateFinancialStats } from '@/lib/financial-stats-cache';
import { logSecurityEvent, toErrorDetails } from '@/lib/observability';
import { serviceFailure, serviceSuccess, type ServiceResult } from '@/services/result';
import type { Json } from '@/types/supabase';
import type { FinancialContext } from '@/services/transactions';

export interface ProductSaleInput {
  requestId: string;
  saleType: string;
  professionalId: string;
  products: Array<{ product_id: string; quantity: number }>;
  paymentMethod: string;
  installments: number;
}

export interface QuickSaleInput {
  requestId: string;
  clientId: number | null;
  items: Array<{ tipo: 'servico' | 'produto'; item_id: string; quantidade: number }>;
  paymentMethod: string;
}

export interface ProductFilters {
  retail?: boolean;
  category?: string | null;
  search?: string | null;
  lowStock?: boolean;
}

const PRODUCT_SALE_ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_SALE_TYPE: { status: 400, message: 'Tipo de venda inválido' },
  PROFESSIONAL_NOT_FOUND: { status: 404, message: 'Profissional não encontrado' },
  INVALID_ITEMS: { status: 400, message: 'Produtos inválidos' },
  DUPLICATE_ITEMS: { status: 400, message: 'Produtos duplicados' },
  INVALID_PAYMENT_METHOD: { status: 400, message: 'Método de pagamento inválido' },
  INVALID_INSTALLMENTS: { status: 400, message: 'Número de parcelas inválido' },
  CASH_REGISTER_CLOSED: { status: 409, message: 'Abra o caixa antes da venda' },
  CATALOG_ITEM_NOT_FOUND: { status: 404, message: 'Produto inativo ou não encontrado' },
  PRODUCT_NOT_RETAIL: { status: 400, message: 'Produto de uso interno não pode ser vendido' },
  INSUFFICIENT_STOCK: { status: 409, message: 'Estoque insuficiente' },
  INVALID_CATALOG_PRICE: { status: 409, message: 'Preço cadastrado inválido' },
  INSTALLMENT_VALUE_TOO_LOW: { status: 400, message: 'Valor mínimo de R$ 100,00 por parcela' },
};

const QUICK_SALE_ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_PAYMENT_METHOD: { status: 400, message: 'Método de pagamento inválido' },
  INVALID_ITEMS: { status: 400, message: 'Itens da venda inválidos' },
  CASH_REGISTER_CLOSED: { status: 409, message: 'Abra o caixa antes da venda' },
  CLIENT_NOT_FOUND: { status: 404, message: 'Cliente não encontrado' },
  CATALOG_ITEM_NOT_FOUND: { status: 409, message: 'Item inativo ou não encontrado' },
  INVALID_CATALOG_PRICE: { status: 409, message: 'Preço cadastrado inválido' },
  INSUFFICIENT_STOCK: { status: 409, message: 'Estoque insuficiente' },
};

export async function listSaleProducts(context: FinancialContext, filters: ProductFilters) {
  try {
    let query = createServerSupabase(context.unitId)
      .from('produtos')
      .select('*')
      .eq('unit_id', context.unitId)
      .eq('ativo', true)
      .order('nome');
    if (filters.retail !== undefined) query = query.eq('tipo', filters.retail ? 'revenda' : 'uso_interno');
    if (filters.category) query = query.eq('categoria', filters.category.slice(0, 100));
    if (filters.search) query = query.ilike('nome', `%${filters.search.slice(0, 100)}%`);
    if (filters.lowStock) query = query.filter('quantidade', 'lte', 'quantidade_minima');

    const { data, error } = await query;
    if (error) {
      logSecurityEvent({ event: 'operation.failure', ...context, status: 500, ...toErrorDetails(error) });
      return serviceFailure('INTERNAL_ERROR', 'Não foi possível listar os produtos', 500);
    }
    return serviceSuccess(data ?? []);
  } catch (error: unknown) {
    logSecurityEvent({ event: 'operation.failure', ...context, status: 500, ...toErrorDetails(error) });
    return serviceFailure('INTERNAL_ERROR', 'Não foi possível listar os produtos', 500);
  }
}

export async function executeProductSale(
  context: FinancialContext,
  input: ProductSaleInput,
): Promise<ServiceResult<Json>> {
  const { data, error } = await createServerSupabase(context.unitId).rpc('process_product_sale_atomic', {
    p_request_id: input.requestId,
    p_sale_type: input.saleType,
    p_professional_id: input.professionalId,
    p_items: input.products,
    p_payment_method: input.paymentMethod,
    p_installments: input.installments,
    p_admin_id: context.adminId,
    p_unit_id: context.unitId,
  });
  if (error) return mapSaleError(context, error, PRODUCT_SALE_ERRORS, 'Não foi possível processar a venda');
  if (input.saleType === 'retail_sale') invalidateFinancialStats();
  return serviceSuccess(data);
}

export async function executeQuickSale(
  context: FinancialContext,
  input: QuickSaleInput,
): Promise<ServiceResult<Json>> {
  const { data, error } = await createServerSupabase(context.unitId).rpc('finalize_quick_sale_atomic', {
    p_request_id: input.requestId,
    p_client_id: input.clientId as number,
    p_items: input.items,
    p_payment_method: input.paymentMethod,
    p_admin_id: context.adminId,
    p_unit_id: context.unitId,
  });
  if (error) return mapSaleError(context, error, QUICK_SALE_ERRORS, 'Não foi possível concluir a venda');
  invalidateFinancialStats();
  return serviceSuccess(data);
}

function mapSaleError(
  context: FinancialContext,
  error: { message: string; code?: string },
  mapping: Record<string, { status: number; message: string }>,
  fallback: string,
): ServiceResult<never> {
  const mapped = mapping[error.message];
  if (!mapped) {
    logSecurityEvent({ event: 'operation.failure', ...context, status: 500, ...toErrorDetails(error) });
    return serviceFailure('INTERNAL_ERROR', fallback, 500);
  }
  if (mapped.status === 409) {
    logSecurityEvent({ event: 'operation.conflict', ...context, status: 409, errorCode: error.message });
  }
  return serviceFailure(mapped.status === 409 ? 'CONFLICT' : mapped.status === 404 ? 'NOT_FOUND' : 'INVALID_INPUT', mapped.message, mapped.status);
}
