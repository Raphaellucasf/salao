import { createServerSupabase } from '@/lib/supabase-server';
import { invalidateFinancialStats } from '@/lib/financial-stats-cache';
import { logSecurityEvent, toErrorDetails } from '@/lib/observability';
import { serviceFailure, serviceSuccess, type ServiceResult } from '@/services/result';
import type { Database } from '@/types/supabase';

type Transaction = Database['public']['Tables']['transacoes']['Row'];
type TransactionInsert = Database['public']['Tables']['transacoes']['Insert'];

export interface FinancialContext {
  adminId: string;
  unitId: string;
  requestId: string;
  route: string;
}

export interface TransactionFilters {
  type?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export async function listTransactions(
  context: FinancialContext,
  filters: TransactionFilters,
): Promise<ServiceResult<Transaction[]>> {
  try {
    let query = createServerSupabase(context.unitId)
      .from('transacoes')
      .select('*')
      .eq('unit_id', context.unitId)
      .order('data', { ascending: false });

    if (filters.type) query = query.eq('tipo', filters.type);
    if (filters.startDate) query = query.gte('data', filters.startDate);
    if (filters.endDate) query = query.lte('data', filters.endDate);

    const { data, error } = await query;
    if (error) {
      logSecurityEvent({ event: 'operation.failure', ...context, status: 500, ...toErrorDetails(error) });
      return serviceFailure('INTERNAL_ERROR', 'Não foi possível carregar as transações', 500);
    }
    return serviceSuccess(data ?? []);
  } catch (error: unknown) {
    logSecurityEvent({ event: 'operation.failure', ...context, status: 500, ...toErrorDetails(error) });
    return serviceFailure('INTERNAL_ERROR', 'Não foi possível carregar as transações', 500);
  }
}

export async function createTransaction(
  context: FinancialContext,
  input: Omit<TransactionInsert, 'unit_id' | 'criado_por'>,
): Promise<ServiceResult<Transaction>> {
  try {
    const { data, error } = await createServerSupabase(context.unitId)
      .from('transacoes')
      .insert({ ...input, unit_id: context.unitId, criado_por: context.adminId })
      .select()
      .single();

    if (error) {
      logSecurityEvent({ event: 'operation.failure', ...context, status: 500, ...toErrorDetails(error) });
      return serviceFailure('INTERNAL_ERROR', 'Não foi possível salvar a transação', 500);
    }
    invalidateFinancialStats();
    return serviceSuccess(data);
  } catch (error: unknown) {
    logSecurityEvent({ event: 'operation.failure', ...context, status: 500, ...toErrorDetails(error) });
    return serviceFailure('INTERNAL_ERROR', 'Não foi possível salvar a transação', 500);
  }
}
