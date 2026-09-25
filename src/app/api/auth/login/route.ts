import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compareSecret, signToken, COOKIE_NAME, recordAudit } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    
    // Rate limit: 5 login attempts per minute per IP
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos. Por seguridad, intente nuevamente en ${rateLimit.resetInSec} segundos.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { type, email, password, driverId, pin } = body;

    // 1. Admin Login Flow
    if (type === 'ADMIN') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Debe ingresar el correo y la contraseña.' },
          { status: 400 }
        );
      }

      const user = await db.user.findFirst({
        where: {
          email: { equals: email.trim(), mode: 'insensitive' },
          rol: 'ADMIN',
          estado: 'ACTIVO',
        },
      });

      if (!user || !user.passwordHash) {
        await recordAudit({
          rol: 'ADMIN',
          accion: 'LOGIN_FALLIDO',
          detalles: `Intento de acceso fallido para correo: ${email}`,
          ipAddress: ip,
        });
        return NextResponse.json(
          { error: 'Credenciales inválidas o usuario no autorizado.' },
          { status: 401 }
        );
      }

      const isMatch = await compareSecret(password, user.passwordHash);
      if (!isMatch) {
        await recordAudit({
          usuarioId: user.id,
          rol: 'ADMIN',
          accion: 'LOGIN_PASSWORD_ERRADO',
          detalles: `Contraseña incorrecta para ${user.email}`,
          ipAddress: ip,
        });
        return NextResponse.json(
          { error: 'Credenciales inválidas o contraseña incorrecta.' },
          { status: 401 }
        );
      }

      const token = await signToken({
        userId: user.id,
        nombre: user.nombre,
        rol: 'ADMIN',
        email: user.email || undefined,
        telefono: user.telefono,
      });

      await recordAudit({
        usuarioId: user.id,
        rol: 'ADMIN',
        accion: 'LOGIN_EXITOSO',
        detalles: `Sesión administrativa iniciada`,
        ipAddress: ip,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          nombre: user.nombre,
          rol: 'ADMIN',
          email: user.email,
        },
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // 2. Driver PIN Login Flow
    if (type === 'REPARTIDOR') {
      if (!driverId || !pin) {
        return NextResponse.json(
          { error: 'Debe seleccionar un repartidor e ingresar el PIN de 4 dígitos.' },
          { status: 400 }
        );
      }

      const driver = await db.user.findUnique({
        where: { id: Number(driverId) },
      });

      if (!driver || driver.rol !== 'REPARTIDOR' || driver.estado !== 'ACTIVO') {
        return NextResponse.json(
          { error: 'Repartidor no encontrado o inactivo.' },
          { status: 404 }
        );
      }

      if (!driver.pinHash) {
        return NextResponse.json(
          { error: 'PIN no configurado en el sistema. Contacte al administrador.' },
          { status: 400 }
        );
      }

      const isMatch = await compareSecret(pin, driver.pinHash);
      if (!isMatch) {
        await recordAudit({
          usuarioId: driver.id,
          rol: 'REPARTIDOR',
          accion: 'LOGIN_PIN_ERRADO',
          detalles: `PIN incorrecto ingresado para ${driver.nombre}`,
          ipAddress: ip,
        });
        return NextResponse.json(
          { error: 'PIN de 4 dígitos incorrecto. Verifique e intente nuevamente.' },
          { status: 401 }
        );
      }

      const token = await signToken({
        userId: driver.id,
        nombre: driver.nombre,
        rol: 'REPARTIDOR',
        telefono: driver.telefono,
      });

      await recordAudit({
        usuarioId: driver.id,
        rol: 'REPARTIDOR',
        accion: 'LOGIN_EXITOSO',
        detalles: `Turno iniciado por ${driver.nombre}`,
        ipAddress: ip,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: driver.id,
          nombre: driver.nombre,
          rol: 'REPARTIDOR',
          telefono: driver.telefono,
        },
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Tipo de autenticación no soportado.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la autenticación.' },
      { status: 500 }
    );
  }
}
