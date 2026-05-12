import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/api-auth';

/**
 * POST /api/admin/delete-user
 * Exclui um usuário da tabela usuarios e do Supabase Auth.
 * Usa POST (mais confiável que DELETE para cookies/auth).
 * Requer role 'admin'.
 */
export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const { id, authId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    // 1. Remove da tabela usuarios
    const { error: deleteError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao deletar de usuarios:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // 2. Se tem auth_id, remove também do Supabase Auth e da tabela users
    if (authId) {
      await supabaseAdmin.from('users').delete().eq('id', authId);

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authId);
      if (authError) {
        console.error('Aviso: erro ao remover do Auth:', authError.message);
        // Não bloqueia — registro da tabela já foi removido
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro interno delete-user:', err);
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
