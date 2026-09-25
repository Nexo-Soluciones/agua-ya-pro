import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'aguaya_session';
const JWT_SECRET_STRING = process.env.JWT_SECRET || 'aguaya-super-secret-production-jwt-key-2026-secure';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Endpoints that require ADMIN privileges
  const isAdminOnlyRoute = 
    pathname.startsWith('/api/orders/daily-close') ||
    (pathname.startsWith('/api/clients') && ['POST', 'PUT', 'DELETE'].includes(req.method));

  if (isAdminOnlyRoute) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado. Inicie sesión como Administrador.' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.rol !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Acceso denegado. Se requieren permisos de Administrador.' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Token de sesión inválido o expirado.' },
        { status: 401 }
      );
    }
  }

  // 2. Protect mutation operations on drivers
  if (pathname.startsWith('/api/drivers') && ['POST', 'DELETE'].includes(req.method)) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado.' },
        { status: 401 }
      );
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.rol !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Acceso denegado. Solo administradores pueden gestionar repartidores.' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
  }

  // 3. Security response headers (Defense in Depth)
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/api/orders/daily-close/:path*',
    '/api/clients/:path*',
    '/api/drivers/:path*',
  ],
};
