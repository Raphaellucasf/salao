import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifica se o chamador é um usuário autenticado com role 'admin'.
 * Usar nas API routes de /api/admin/* como camada extra de segurança
 * (complementa o middleware, que já bloqueia na borda).
 *
 * A role é lida da tabela `public.users` (via service_role) para evitar
 * que um usuário malicioso eleve sua própria role via user_metadata.
 *
 * @returns O objeto `user` do Supabase se autenticado e admin.
 * @throws NextResponse com status 401 ou 403 se a verificação falhar.
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   const userOrError = await requireAdmin(req);
 *   if (userOrError instanceof NextResponse) return userOrError;
 *   // ... lógica de negócio
 * }
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ id: string; email?: string; role: string } | NextResponse> {
  // O middleware já deve ter validado, mas verificamos novamente para defesa em profundidade.
  // Usa o header Authorization (Bearer token) se presente, caso contrário lê cookies.
  const authHeader = req.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Autenticar o usuário via SSR client (cookies ou Bearer token)
  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // Não precisamos persistir cookies neste contexto
        },
      },
      ...(accessToken
        ? {
            global: {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          }
        : {}),
    }
  );

  const {
    data: { user },
    error,
  } = await anonSupabase.auth.getUser(accessToken ?? undefined);

  if (error || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // C-03 FIX: Ler a role da tabela public.users via service_role (imutável pelo usuário).
  // user_metadata pode ser modificado pelo próprio client via supabase.auth.updateUser().
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: userRow, error: roleError } = await adminSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleError || !userRow) {
    // Tabela users não tem a linha — fallback seguro para negar acesso
    return NextResponse.json({ error: 'Não autorizado — perfil não encontrado' }, { status: 403 });
  }

  const role = userRow.role as string;

  if (role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso negado — requer role admin' },
      { status: 403 }
    );
  }

  return { id: user.id, email: user.email, role };
}
