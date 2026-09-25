import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
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
