import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getServerSession, recordAudit } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (session) {
      await recordAudit({
        usuarioId: session.userId,
        rol: session.rol,
        accion: 'LOGOUT',
        detalles: `Sesión finalizada por ${session.nombre}`,
        ipAddress: ip,
      });
    }

    const response = NextResponse.json({ success: true, message: 'Sesión cerrada exitosamente.' });
    
    // Clear the cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Error in /api/auth/logout:', error);
    return NextResponse.json({ error: 'Error al cerrar sesión.' }, { status: 500 });
  }
}
