import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/api-auth';

/**
 * GET /api/admin/get-users
 * Retorna todos os usuários do sistema (bypassa RLS via service_role).
 * Requer role 'admin'.
 */
export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const { data: usuarios, error } = await supabaseAdmin
      .from('usuarios')
      .select(`
        *,
        roles (
          nome,
          cor,
          nivel
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ usuarios: usuarios ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
