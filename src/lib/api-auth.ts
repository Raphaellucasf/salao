import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { getRequestId, logSecurityEvent, toErrorDetails } from '@/lib/observability';
import { createRequestSupabase } from '@/lib/supabase-request';
import { createServerSupabase } from '@/lib/supabase-server';

export interface AdminContext {
  id: string;
  email?: string;
  role: string;
  unitId: string;
}

function isMissingTenantSchema(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (
    error.code === 'PGRST205'
    || error.code === '42P01'
    || error.message?.includes('user_units')
  ));
}

/**
 * Autentica a sessão e resolve papel/unidade exclusivamente das tabelas
 * canônicas. Falha fechado e registra apenas metadados permitidos.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminContext | NextResponse> {
  const requestId = getRequestId(req);
  const route = req.nextUrl.pathname;

  try {
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const requestSupabase = createRequestSupabase(req);
    const { data: { user }, error } = await requestSupabase.auth.getUser(accessToken);

    if (error || !user) {
      logSecurityEvent({ event: 'auth.rejected', route, status: 401, requestId });
      return apiError('AUTH_REQUIRED', 'Não autenticado', 401, requestId);
    }

    const adminSupabase = createServerSupabase();
    const { data: userRow, error: roleError } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (roleError || !userRow) {
      logSecurityEvent({
        event: 'auth.profile_missing', route, status: 403, requestId,
        ...toErrorDetails(roleError),
      });
      return apiError('ACCESS_DENIED', 'Não autorizado — perfil administrativo não encontrado', 403, requestId);
    }

    const role = userRow.role as string;
    if (role !== 'admin') {
      logSecurityEvent({ event: 'auth.role_rejected', route, status: 403, requestId });
      return apiError('ACCESS_DENIED', 'Acesso negado — requer role admin', 403, requestId);
    }

    const { data: membership, error: membershipError } = await adminSupabase
      .from('user_units')
      .select('unit_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_default', true)
      .maybeSingle();

    if (membershipError && isMissingTenantSchema(membershipError)) {
      logSecurityEvent({
        event: 'auth.tenant_schema_missing', route, status: 503, requestId,
        ...toErrorDetails(membershipError),
      });
      return apiError(
        'SUPABASE_SYNC_REQUIRED',
        'Ambiente Supabase desatualizado — aplique as migrações de unidades antes de usar a agenda e as comandas',
        503,
        requestId,
      );
    }

    if (membershipError || !membership) {
      logSecurityEvent({
        event: 'auth.unit_missing', route, status: 403, requestId,
        ...toErrorDetails(membershipError),
      });
      return apiError('ACCESS_DENIED', 'Não autorizado — unidade administrativa não definida', 403, requestId);
    }

    return { id: user.id, email: user.email, role, unitId: membership.unit_id };
  } catch (error: unknown) {
    logSecurityEvent({ event: 'auth.failure', route, status: 500, requestId, ...toErrorDetails(error) });
    return apiError('INTERNAL_ERROR', 'Erro interno de autenticação', 500, requestId);
  }
}
