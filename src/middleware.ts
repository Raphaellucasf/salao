import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // MIDDLEWARE DESATIVADO TEMPORARIAMENTE PARA TESTES
  return NextResponse.next();
  
  /* CÓDIGO ORIGINAL COMENTADO
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
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Verificar sessão do usuário
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/', '/login', '/agendar'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/agendar')
  );

  // Se estiver tentando acessar rota protegida sem estar logado
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Se estiver logado, buscar role do usuário
  if (session) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = userData?.role;

    // Proteção de rotas admin
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'admin') {
        // Se for profissional tentando acessar /admin, redirecionar para /profissionais
        if (userRole === 'professional') {
          return NextResponse.redirect(new URL('/profissionais', req.url));
        }
        // Qualquer outro caso, redirecionar para home
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Proteção de rotas profissionais
    if (pathname.startsWith('/profissionais')) {
      if (userRole !== 'professional' && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Se estiver logado e tentar acessar /login, redirecionar baseado na role
    if (pathname === '/login') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else if (userRole === 'professional') {
        return NextResponse.redirect(new URL('/profissionais', req.url));
      } else {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Se estiver logado e acessar a raiz /, redirecionar baseado na role
    if (pathname === '/') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else if (userRole === 'professional') {
        return NextResponse.redirect(new URL('/profissionais', req.url));
      }
    }
  }

  return res;
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
