import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        nombre: session.nombre,
        rol: session.rol,
        email: session.email,
        telefono: session.telefono,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
