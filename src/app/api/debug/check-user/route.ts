import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Endpoint de diagnóstico TEMPORÁRIO — remover após correção
export async function GET(req: NextRequest) {
  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user }, error: authError } = await anonSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado', authError });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

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
