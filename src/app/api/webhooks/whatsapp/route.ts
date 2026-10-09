import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook API Endpoint for Netlify / WhatsApp Bot Integration
 * Receives incoming automated WhatsApp order messages parsed by Netlify Function / Bot
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clienteNombre,
      clienteTelefono,
      clienteDireccion,
      barrioSector,
      cantidadBotellones,
      metodoPago,
      apiToken,
    } = body;

    if (!clienteTelefono || !clienteNombre || !clienteDireccion) {
      return NextResponse.json(
        {
          error: 'Formato de pedido WhatsApp incompleto. Se requiere nombre, teléfono y dirección.',
        },
        { status: 400 }
      );
    }

    // Check or create client
    let client = await db.client.findUnique({
      where: { telefono: clienteTelefono },
    });

    if (!client) {
      client = await db.client.create({
        data: {
          nombre: clienteNombre,
          telefono: clienteTelefono,
          direccion: clienteDireccion,
          barrioSector: barrioSector || '',
          tipoCliente: 'NUEVO',
        },
      });
    }

    const qty = parseInt(cantidadBotellones || '1', 10);
    const unitPrice = client.tipoCliente === 'NUEVO' ? 8000 : 7000;
    const totalAmount = qty * unitPrice;

    // Get active drivers to auto-assign the one with fewest active orders
    const drivers = await db.user.findMany({
      where: { rol: 'REPARTIDOR', estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        _count: {
          select: {
            pedidosAsignados: {
              where: { estadoEntrega: { in: ['PENDIENTE', 'EN_CAMINO'] } },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    let assignedDriverId: number | null = null;
    let assignedDriverName = 'Sin Asignar';

    if (drivers.length > 0) {
      // Pick driver with lowest workload
      const sortedDrivers = [...drivers].sort(
        (a, b) => a._count.pedidosAsignados - b._count.pedidosAsignados
      );
      assignedDriverId = sortedDrivers[0].id;
      assignedDriverName = sortedDrivers[0].nombre;
    }

    // 4. Calculate unique and strictly increasing numeroPedido using O(1) B-tree index lookup
    const lastOrder = await db.order.findFirst({
      orderBy: { id: 'desc' },
      select: { numeroPedido: true, id: true },
    });
    const lastNum = lastOrder?.numeroPedido || 1000;
    const numeroPedido = Math.max(lastNum + 1, (lastOrder?.id || 0) + 1001);

    const newOrder = await db.order.create({
      data: {
        numeroPedido,
        clienteId: client.id,
        repartidorId: assignedDriverId,
        cantidadBotellones: qty,
        precioUnitario: unitPrice,
        montoTotal: totalAmount,
        metodoPago: metodoPago || 'EFECTIVO',
        estadoPago: metodoPago === 'EFECTIVO' ? 'VERIFICADO' : 'PENDIENTE',
        estadoEntrega: assignedDriverId ? 'EN_CAMINO' : 'PENDIENTE',
      },
      include: {
        cliente: true,
        repartidor: true,
      },
    });

    const replyMessage = `💧 *AGUA YA - Confirmación de Pedido #${numeroPedido}*\n\nHola *${client.nombre}*, hemos recibido tu pedido por WhatsApp:\n\n📦 *Detalle*: ${qty} Botellón(es) de 20L\n💰 *Total*: $${totalAmount.toLocaleString('es-CO')} COP (${metodoPago || 'EFECTIVO'})\n🚚 *Repartidor Asignado*: ${assignedDriverName}\n📍 *Dirección*: ${client.direccion}\n\n¡Tu pedido ya está registrado en nuestro sistema y va en camino!`;

    return NextResponse.json({
      success: true,
      source: 'NETLIFY_WHATSAPP_WEBHOOK',
      pedido: {
        id: newOrder.id,
        numeroPedido: newOrder.numeroPedido,
        cliente: client.nombre,
        montoTotal: newOrder.montoTotal,
        repartidor: assignedDriverName,
        estadoEntrega: newOrder.estadoEntrega,
      },
      whatsappReply: replyMessage,
    });
  } catch (error) {
    console.error('Error processing Netlify WhatsApp webhook:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar el pedido vía Webhook Netlify' },
      { status: 500 }
    );
  }
}
