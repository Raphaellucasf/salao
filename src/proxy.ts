import { NextResponse, type NextRequest } from 'next/server';
import { createRequestSupabase } from '@/lib/supabase-request';

/**
 * Middleware de autenticação — Otimiza Beauty
 *
 * C-02 FIX: Valida o JWT real via supabase.auth.getUser() em vez de verificar
 * apenas a presença de um cookie com nome contendo "sb-" (bypassável com cookie falso).
 *
 * A validação completa de role ocorre no servidor via requireAdmin() nas API routes.
 */

function isPublicPath(pathname: string, method: string): boolean {
  if (pathname === '/') return true;
  if (pathname === '/login' || pathname.startsWith('/login/')) return true;
  if (pathname === '/agendar' || pathname.startsWith('/agendar/')) return true;
  if (pathname === '/api/whatsapp' || pathname.startsWith('/api/whatsapp/')) return true;

  // O fluxo público pode apenas consultar disponibilidade e criar agendamentos.
  if (pathname === '/api/appointments' && method === 'POST') return true;
  if (pathname === '/api/appointments/availability' && method === 'GET') return true;

  return false;
}

export default async function proxy(request: NextRequest) {
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
  if (isPublicPath(pathname, request.method)) {
    return NextResponse.next();
  }

  // C-02 FIX: Criar response mutável para que o Supabase SSR possa
  // atualizar os cookies de sessão (refresh token) quando necessário.
  const response = NextResponse.next();

  const supabase = createRequestSupabase(request, response);

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
