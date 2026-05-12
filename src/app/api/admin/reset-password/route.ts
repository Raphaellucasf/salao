import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/api-auth';

/**
 * POST /api/admin/reset-password
 * Reseta a senha de um usuário no Supabase Auth (senha real).
 * Requer role 'admin'.
 */
export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const { authId, novaSenha } = await req.json();

    if (!authId || !novaSenha) {
      return NextResponse.json(
        { error: 'authId e novaSenha são obrigatórios' },
        { status: 400 }
      );
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Atualiza senha real no Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authId, {
      password: novaSenha,
      user_metadata: { must_change_password: true },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Marca senha_temporaria na tabela usuarios
    await supabaseAdmin
      .from('usuarios')
      .update({ senha_temporaria: true })
      .eq('auth_id', authId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
