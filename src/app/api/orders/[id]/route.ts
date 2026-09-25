import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, recordAudit } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const orderId = parseInt(params.id, 10);
    const body = await req.json();
    const {
      estadoEntrega,
      repartidorId,
      estadoPago,
      metodoPago,
      comprobanteRef,
      numeroRemision,
      notasEntrega,
      operadorNombre,
    } = body;

    const finalOperador = operadorNombre || session?.nombre || 'Administración';

    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const updateData: any = {};

    if (estadoEntrega !== undefined) {
      updateData.estadoEntrega = estadoEntrega;
      if (estadoEntrega === 'ENTREGADO') {
        updateData.fechaEntrega = new Date();
      }
    }

    if (repartidorId !== undefined) {
      updateData.repartidorId = repartidorId ? parseInt(repartidorId, 10) : null;
      if (existingOrder.estadoEntrega === 'PENDIENTE' && repartidorId) {
        updateData.estadoEntrega = 'EN_CAMINO';
      }
    }

    if (estadoPago !== undefined) {
      updateData.estadoPago = estadoPago;
    }

    if (metodoPago !== undefined) {
      updateData.metodoPago = metodoPago;
    }

    if (comprobanteRef !== undefined) {
      updateData.comprobanteRef = comprobanteRef;
    }

    if (numeroRemision !== undefined) {
      updateData.numeroRemision = numeroRemision;
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        cliente: true,
        repartidor: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    // Create log entry if delivery status or driver changed
    const targetDriverId = updateData.repartidorId || existingOrder.repartidorId;
    if (targetDriverId) {
      await db.deliveryLog.create({
        data: {
          pedidoId: orderId,
          repartidorId: targetDriverId,
          estadoNuevo: updatedOrder.estadoEntrega,
          notasEntrega: notasEntrega || null,
        },
      });
    }

    // Record audit event for operational traceability
    const auditDetails = [];
    if (estadoEntrega && estadoEntrega !== existingOrder.estadoEntrega) {
      auditDetails.push(`Estado de entrega cambiado a [${estadoEntrega}]`);
    }
    if (repartidorId && repartidorId !== existingOrder.repartidorId) {
      auditDetails.push(`Repartidor asignado: ${updatedOrder.repartidor?.nombre || repartidorId}`);
    }
    if (estadoPago && estadoPago !== existingOrder.estadoPago) {
      auditDetails.push(`Estado de pago: [${estadoPago}]`);
    }
    if (metodoPago && metodoPago !== existingOrder.metodoPago) {
      auditDetails.push(`Método de pago: [${metodoPago}]`);
    }

    if (auditDetails.length > 0) {
      await recordAudit({
        usuarioId: session?.userId || null,
        rol: session?.rol || 'ADMIN',
        accion: 'ACTUALIZAR_PEDIDO',
        detalles: `Pedido #${updatedOrder.numeroPedido || orderId} actualizado por [${finalOperador}]: ${auditDetails.join(', ')}`,
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 });
  }
}
