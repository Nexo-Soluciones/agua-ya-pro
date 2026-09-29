import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'aguaya_session';
const JWT_SECRET_STRING = process.env.JWT_SECRET;
if (!JWT_SECRET_STRING) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Cannot start without it.');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

// ── Helper: extract and verify JWT, returning the payload or null ──
async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public routes that don't require authentication ──
  const isAuthRoute = pathname.startsWith('/api/auth/');
  const isProductsGet = pathname.startsWith('/api/products') && req.method === 'GET';

  if (isAuthRoute || isProductsGet) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // ── All other /api/ routes require at least a valid session ──
  if (pathname.startsWith('/api/')) {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado. Inicie sesión para acceder.' },
        { status: 401 }
      );
    }

    // ── ADMIN-ONLY routes ──
    const isAdminOnlyRoute =
      pathname.startsWith('/api/orders/daily-close') ||
      pathname.startsWith('/api/audit') ||
      pathname.startsWith('/api/drivers/seed-gps') ||
      (pathname.startsWith('/api/clients') && ['POST', 'PUT', 'DELETE'].includes(req.method)) ||
      (pathname.startsWith('/api/drivers') && ['POST', 'DELETE'].includes(req.method));

    if (isAdminOnlyRoute) {
      if (session.rol !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Acceso denegado. Se requieren permisos de Administrador.' },
          { status: 403 }
        );
      }
    }

    // ── Mutation on orders (POST/PATCH/DELETE) requires any authenticated user ──
    // (already guaranteed by the session check above)

    // ── GPS location update: only the driver themselves or an admin ──
    const locationRouteMatch = pathname.match(/^\/api\/drivers\/(\d+)\/location$/);
    if (locationRouteMatch && req.method === 'PATCH') {
      const routeDriverId = parseInt(locationRouteMatch[1], 10);
      if (session.rol !== 'ADMIN' && session.userId !== routeDriverId) {
        return NextResponse.json(
          { error: 'Solo puedes actualizar tu propia ubicación.' },
          { status: 403 }
        );
      }
    }
  }

  // ── Security response headers (Defense in Depth) ──
  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
