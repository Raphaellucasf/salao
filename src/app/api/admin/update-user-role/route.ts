import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * PATCH /api/admin/update-user-role
 * Atualiza o role de um usuário existente no Supabase Auth + tabela users.
 * Chamado pela UsuarioModal ao salvar edição de role.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      authId,     // UUID do auth.users
      roleName,   // nome da role (ex: 'Administrador')
      roleNivel,  // nivel numérico da role
    } = body;

    if (!authId) {
      return NextResponse.json({ error: 'authId é obrigatório' }, { status: 400 });
    }

    const isAdmin = roleNivel >= 80 || roleName?.toLowerCase().includes('admin');
    const authRole: 'admin' | 'professional' = isAdmin ? 'admin' : 'professional';

    // Atualiza user_metadata no Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authId, {
      user_metadata: { role: authRole },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Atualiza tabela users
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .update({ role: authRole })
      .eq('id', authId);

    if (usersError) {
      console.error('Aviso: erro ao atualizar users.role:', usersError.message);
    }

    return NextResponse.json({ success: true, authRole });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
