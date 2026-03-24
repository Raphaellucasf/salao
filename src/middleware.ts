import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  // Rotas públicas (sem autenticação)
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/agendar');

  // Sem sessão → redireciona para login (exceto rotas públicas)
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Com sessão → busca role do usuário
  if (session) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = userData?.role ?? 'client';

    // Rota /admin → apenas admin
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'admin') {
        const dest = userRole === 'professional' ? '/profissionais' : '/';
        return NextResponse.redirect(new URL(dest, req.url));
      }
    }

    // Rota /profissionais → professional ou admin
    if (pathname.startsWith('/profissionais')) {
      if (userRole !== 'professional' && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Usuário logado na tela de login → redireciona
    if (pathname === '/login') {
      const dest =
        userRole === 'admin' ? '/admin/dashboard' :
        userRole === 'professional' ? '/profissionais' : '/';
      return NextResponse.redirect(new URL(dest, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
