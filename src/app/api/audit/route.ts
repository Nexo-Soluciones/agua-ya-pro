import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();
    
    // Only Admin General can access the audit traceability module
    const isMasterAdmin =
      session &&
      session.rol === 'ADMIN' &&
      (session.email?.toLowerCase() === 'admin@aguaya.com' ||
       session.nombre?.toLowerCase().includes('administrador') ||
       session.nombre?.toLowerCase().includes('admin general'));

    if (!isMasterAdmin) {
      return NextResponse.json(
        { error: 'Acceso restringido. El módulo de trazabilidad solo puede ser visto por el usuario de Admin General.' },
        { status: 403 }
      );
    }

    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
      },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Error al obtener registros de auditoría' }, { status: 500 });
  }
}

