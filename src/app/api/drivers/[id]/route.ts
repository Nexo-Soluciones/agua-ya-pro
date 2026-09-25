import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const driverId = parseInt(params.id, 10);
    const body = await req.json();
    const { nombre, telefono, estado } = body;

    const updated = await db.user.update({
      where: { id: driverId },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(telefono && { telefono: telefono.trim() }),
        ...(estado && { estado }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ error: 'Error al actualizar repartidor' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const driverId = parseInt(params.id, 10);

    // Unassign pending orders first to prevent foreign key issues
    await db.order.updateMany({
      where: { repartidorId: driverId, estadoEntrega: { in: ['PENDIENTE', 'EN_CAMINO'] } },
      data: { repartidorId: null, estadoEntrega: 'PENDIENTE' },
    });

    await db.user.delete({
      where: { id: driverId },
    });

    return NextResponse.json({ success: true, message: 'Repartidor eliminado' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: 'Error al eliminar repartidor' }, { status: 500 });
  }
}
