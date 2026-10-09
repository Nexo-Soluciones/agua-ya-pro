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
      numeroFactura,
      notasEntrega,
      operadorNombre,
      cantidadBotellones,
      montoTotal,
      precioUnitario,
      items,
    } = body;

    const finalOperador = operadorNombre || session?.nombre || 'Administración';

    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Validación estricta: Referencia obligatoria para validar pagos no en efectivo
    const targetMetodoPago = metodoPago || existingOrder.metodoPago;
    const isDigitalPayment =
      targetMetodoPago === 'NEQUI' ||
      targetMetodoPago === 'TRANSFERENCIA' ||
      targetMetodoPago === 'PAGOMOVIL';

    if (estadoPago === 'VERIFICADO' && isDigitalPayment) {
      const finalRef = (comprobanteRef !== undefined ? comprobanteRef : existingOrder.comprobanteRef) || '';
      if (!String(finalRef).trim()) {
        return NextResponse.json(
          { error: 'Es obligatorio ingresar la referencia o comprobante bancario antes de validar el pago.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (estadoEntrega !== undefined) {
      updateData.estadoEntrega = estadoEntrega;
      if (estadoEntrega === 'ENTREGADO') {
        updateData.fechaEntrega = new Date();
      }
      if (estadoEntrega === 'PROGRAMADO_MANANA') {
        updateData.repartidorId = null;
        updateData.updatedAt = new Date();
      }
    }

    if (precioUnitario !== undefined && precioUnitario >= 0) {
      updateData.precioUnitario = parseFloat(precioUnitario);
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
      if (estadoPago === undefined) {
        if (metodoPago === 'EFECTIVO') {
          updateData.estadoPago = 'VERIFICADO';
        } else if (metodoPago === 'NEQUI' || metodoPago === 'TRANSFERENCIA' || metodoPago === 'CREDITO') {
          updateData.estadoPago = 'PENDIENTE';
        }
      }
    }

    if (comprobanteRef !== undefined) {
      updateData.comprobanteRef = comprobanteRef;
    }

    if (numeroRemision !== undefined) {
      updateData.numeroRemision = numeroRemision;
    }

    if (numeroFactura !== undefined) {
      updateData.numeroFactura = numeroFactura ? String(numeroFactura).trim() : null;
    }

    // Update individual OrderItems in parallel (allows drivers/admins to correct prices/quantities of ANY product)
    let itemsUpdated = false;
    if (items && Array.isArray(items) && items.length > 0) {
      const updatePromises: Promise<any>[] = [];

      for (const itm of items) {
        if (itm.id) {
          const existingItem = existingOrder.items?.find((i) => i.id === itm.id);
          if (existingItem) {
            const newUnitPrice =
              itm.precioUnitario !== undefined && itm.precioUnitario !== null && itm.precioUnitario >= 0
                ? parseFloat(String(itm.precioUnitario))
                : existingItem.precioUnitario;
            const newQty =
              itm.cantidad !== undefined && itm.cantidad !== null && itm.cantidad >= 0
                ? parseInt(String(itm.cantidad), 10)
                : existingItem.cantidad;

            updatePromises.push(
              db.orderItem.update({
                where: { id: itm.id },
                data: {
                  precioUnitario: newUnitPrice,
                  cantidad: newQty,
                  subtotal: newQty * newUnitPrice,
                },
              })
            );
            itemsUpdated = true;

            const isStandardBotellon =
              existingItem.nombreProducto.toUpperCase().includes('BOTELLON (20L)') ||
              (existingItem.nombreProducto.toUpperCase().includes('BOTELLON') && !existingItem.nombreProducto.toUpperCase().includes('VC'));
            if (isStandardBotellon) {
              updateData.precioUnitario = newUnitPrice;
              updateData.cantidadBotellones = newQty;
            }
          }
        }
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    }

    // Synchronize Botellon OrderItem if cantidadBotellones changed and not already updated via items
    if (!itemsUpdated && cantidadBotellones !== undefined && parseInt(cantidadBotellones, 10) >= 0) {
      const newBotellonesQty = parseInt(cantidadBotellones, 10);
      updateData.cantidadBotellones = newBotellonesQty;

      if (existingOrder.items && existingOrder.items.length > 0) {
        const botellonItem = existingOrder.items.find(
          (i) =>
            i.nombreProducto.toUpperCase().includes('BOTELLON (20L)') ||
            (i.nombreProducto.toUpperCase().includes('BOTELLON') && !i.nombreProducto.toUpperCase().includes('VC'))
        );

        if (botellonItem) {
          if (newBotellonesQty === 0) {
            await db.orderItem.delete({
              where: { id: botellonItem.id },
            });
          } else {
            const unitPrice = updateData.precioUnitario !== undefined ? updateData.precioUnitario : botellonItem.precioUnitario;
            await db.orderItem.update({
              where: { id: botellonItem.id },
              data: {
                cantidad: newBotellonesQty,
                precioUnitario: unitPrice,
                subtotal: newBotellonesQty * unitPrice,
              },
            });
          }
        }
      }
    }

    // Calculate accurate montoTotal from all items if multi-product items exist
    const currentItems = await db.orderItem.findMany({
      where: { pedidoId: orderId },
    });

    if (currentItems.length > 0) {
      const itemsSum = currentItems.reduce((sum, item) => sum + item.subtotal, 0);
      updateData.montoTotal = itemsSum;
      updateData.resumenProductos = currentItems.map((i) => `${i.cantidad}x ${i.nombreProducto}`).join(', ');
    } else if (montoTotal !== undefined && montoTotal >= 0) {
      updateData.montoTotal = parseFloat(montoTotal);
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: updateData,
      select: {
        id: true,
        numeroPedido: true,
        clienteId: true,
        repartidorId: true,
        cantidadBotellones: true,
        precioUnitario: true,
        montoTotal: true,
        resumenProductos: true,
        metodoPago: true,
        estadoPago: true,
        estadoEntrega: true,
        comprobanteRef: true,
        numeroRemision: true,
        numeroFactura: true,
        creadoPor: true,
        fechaCreacion: true,
        fechaEntrega: true,
        updatedAt: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            direccion: true,
            barrioSector: true,
            tipoCliente: true,
            precioAcordado: true,
            notasUbicacion: true,
            lat: true,
            lng: true,
          },
        },
        repartidor: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
        items: {
          select: {
            id: true,
            nombreProducto: true,
            cantidad: true,
            precioUnitario: true,
            subtotal: true,
            productoId: true,
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
      auditDetails.push(`Método de pago: [${existingOrder.metodoPago || 'N/A'} -> ${metodoPago}]`);
    }
    if (comprobanteRef !== undefined && comprobanteRef !== existingOrder.comprobanteRef) {
      auditDetails.push(`Comprobante: [${comprobanteRef || 'Ninguno'}]`);
    }
    if (numeroRemision !== undefined && numeroRemision !== existingOrder.numeroRemision) {
      auditDetails.push(`Remisión: [${numeroRemision || 'Ninguna'}]`);
    }
    if (numeroFactura !== undefined && numeroFactura !== existingOrder.numeroFactura) {
      auditDetails.push(`Número de factura: [${updateData.numeroFactura || 'Sin Factura'}]`);
    }
    if (notasEntrega) {
      auditDetails.push(`Nota: [${notasEntrega}]`);
    }
    if (itemsUpdated) {
      auditDetails.push('Precios/cantidades de productos actualizados');
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
