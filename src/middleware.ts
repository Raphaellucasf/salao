import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware de autenticação — Otimiza Beauty
 *
 * C-02 FIX: Valida o JWT real via supabase.auth.getUser() em vez de verificar
 * apenas a presença de um cookie com nome contendo "sb-" (bypassável com cookie falso).
 *
 * A validação completa de role ocorre no servidor via requireAdmin() nas API routes.
 */

const PUBLIC_PATHS = ['/login', '/agendar', '/api/appointments', '/api/whatsapp'];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Deixa assets estáticos e next internals passarem
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(ico|png|jpg|jpeg|svg|webp|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Rotas públicas — sem verificação de autenticação
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // C-02 FIX: Criar response mutável para que o Supabase SSR possa
  // atualizar os cookies de sessão (refresh token) quando necessário.
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propagar cookies de sessão atualizados para o browser
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Validação real do JWT — getUser() verifica assinatura no Supabase Auth Server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  // Protege /admin/*
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Protege /api/admin/* (role check em profundidade via requireAdmin())
  if (pathname.startsWith('/api/admin')) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    return response;
  }

  // Demais /api/* autenticadas
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
