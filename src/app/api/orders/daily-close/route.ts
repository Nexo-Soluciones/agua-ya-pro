import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Actualizar todos los pedidos con estado ENTREGADO, CANCELADO y RECHAZADO a CERRADO para despejar la vista de despacho
    const updateResult = await db.order.updateMany({
      where: {
        estadoEntrega: { in: ['ENTREGADO', 'CANCELADO', 'RECHAZADO'] },
      },
      data: {
        estadoEntrega: 'CERRADO',
      },
    });

    // 2. Pasar automáticamente todos los pedidos PROGRAMADO_MANANA a PENDIENTE listos para la nueva jornada
    const activatedTomorrowResult = await db.order.updateMany({
      where: {
        estadoEntrega: 'PROGRAMADO_MANANA',
      },
      data: {
        estadoEntrega: 'PENDIENTE',
        repartidorId: null,
        updatedAt: new Date(),
      },
    });

    const activatedMsg =
      activatedTomorrowResult.count > 0
        ? ` y se activaron ${activatedTomorrowResult.count} pedidos reprogramados para la jornada de hoy.`
        : '.';

    return NextResponse.json({
      success: true,
      message: `Cierre de caja completado exitosamente. Se archivaron ${updateResult.count} pedidos entregados${activatedMsg}`,
      closedOrdersCount: updateResult.count,
      activatedTomorrowCount: activatedTomorrowResult.count,
      closedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error al ejecutar cierre de caja:', error);
    return NextResponse.json(
      { error: 'Error al procesar el cierre de caja', details: error.message },
      { status: 500 }
    );
  }
}
