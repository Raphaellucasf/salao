import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createRequestSupabase } from '@/lib/supabase-request';
import { createServerSupabase } from '@/lib/supabase-server';

// Endpoint de diagnóstico TEMPORÁRIO — remover após correção
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const anonSupabase = createRequestSupabase(req);

  const { data: { user }, error: authError } = await anonSupabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Não autenticado', authError });
  }

  const adminClient = createServerSupabase(authResult.unitId);

  // Verifica na tabela users
  const { data: userRow, error: usersError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Verifica na tabela usuarios
  const { data: usuarioRow, error: usuariosError } = await adminClient
    .from('usuarios')
    .select('*')
    .eq('email', user.email)
    .maybeSingle();

  // Verifica roles
  const { data: roles, error: rolesError } = await adminClient
    .from('roles')
    .select('id, nome, nivel, ativo');

  // Conta usuários
  const { count: usuariosCount } = await adminClient
    .from('usuarios')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    auth_user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
    users_table: { row: userRow, error: usersError?.message },
    usuarios_table: { row: usuarioRow, error: usuariosError?.message },
    usuarios_count: usuariosCount,
    roles: { data: roles, error: rolesError?.message },
  });
}
