import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Actualizar todos los pedidos con estado ENTREGADO a CERRADO para despejar la vista de despacho
    const updateResult = await db.order.updateMany({
      where: {
        estadoEntrega: 'ENTREGADO',
      },
      data: {
        estadoEntrega: 'CERRADO',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cierre de caja completado exitosamente. Se archivaron ${updateResult.count} pedidos entregados.`,
      closedOrdersCount: updateResult.count,
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
