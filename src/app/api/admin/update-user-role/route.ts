import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

/**
 * PATCH /api/admin/update-user-role
 * Atualiza o role de um usuário existente no Supabase Auth + tabela users.
 * Chamado pela UsuarioModal ao salvar edição de role.
 * Requer role 'admin'.
 */
export async function PATCH(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;
  const supabaseAdmin = createServerSupabase(authCheck.unitId);

  try {
    const body = await req.json();
    const {
      authId,     // UUID do auth.users
      roleName,   // nome da role (ex: 'Administrador')
      roleNivel,  // nivel numérico da role
    } = body;

    if (typeof authId !== 'string' || !/^[0-9a-f-]{36}$/i.test(authId)) {
      return NextResponse.json({ error: 'authId é obrigatório' }, { status: 400 });
    }

    const isAdmin = roleNivel >= 80 || roleName?.toLowerCase().includes('admin');
    const authRole: 'admin' | 'professional' = isAdmin ? 'admin' : 'professional';

    // A role canônica vive somente em public.users. user_metadata é editável pelo cliente.
    const { data: updatedUser, error: usersError } = await supabaseAdmin
      .from('users')
      .update({ role: authRole })
      .eq('id', authId)
      .select('id')
      .maybeSingle();

    if (usersError || !updatedUser) {
      return NextResponse.json({ error: 'Não foi possível atualizar a função do usuário' }, { status: usersError ? 400 : 404 });
    }

    return NextResponse.json({ success: true, authRole });

  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
