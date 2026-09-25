import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    const whereClause: any = {};

    if (driverId) {
      whereClause.repartidorId = parseInt(driverId, 10);
    }

    if (status) {
      whereClause.estadoEntrega = status;
    }

    if (paymentStatus) {
      whereClause.estadoPago = paymentStatus;
    }

    const rawOrders = await db.order.findMany({
      where: whereClause,
      include: {
        cliente: true,
        repartidor: true,
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    const orders = rawOrders.map((o) => ({
      ...o,
      numeroPedido: o.numeroPedido || o.id + 1000,
    }));

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clienteId,
      nombreCliente,
      telefonoCliente,
      direccionCliente,
      barrioSector,
      tipoCliente,
      precioUnitario: requestUnitPrice,
      notasUbicacion,
      repartidorId,
      cantidadBotellones,
      metodoPago,
      numeroRemision,
    } = body;

    let targetClientId = clienteId;

    if (!targetClientId) {
      if (!telefonoCliente || !nombreCliente || !direccionCliente) {
        return NextResponse.json(
          { error: 'Datos de cliente incompletos (Nombre, teléfono y dirección obligatorios)' },
          { status: 400 }
        );
      }

      let existingClient = await db.client.findUnique({
        where: { telefono: telefonoCliente },
      });

      if (existingClient) {
        targetClientId = existingClient.id;
      } else {
        const newClient = await db.client.create({
          data: {
            nombre: nombreCliente,
            telefono: telefonoCliente,
            direccion: direccionCliente,
            barrioSector: barrioSector || '',
            tipoCliente: tipoCliente || 'NUEVO',
            precioAcordado: requestUnitPrice ? parseFloat(requestUnitPrice) : (tipoCliente === 'NUEVO' ? 8000 : 7000),
            notasUbicacion: notasUbicacion || '',
          },
        });
        targetClientId = newClient.id;
      }
    }

    const client = await db.client.findUnique({ where: { id: targetClientId } });
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const qty = parseInt(cantidadBotellones || '1', 10);
    const unitPrice = requestUnitPrice !== undefined && requestUnitPrice !== null
      ? parseFloat(requestUnitPrice)
      : (client.precioAcordado || (client.tipoCliente === 'NUEVO' ? 8000 : 7000));
    const totalAmount = qty * unitPrice;

    // Get order count for numeroPedido
    const orderCount = await db.order.count();
    const numeroPedido = 1001 + orderCount;

    const order = await db.order.create({
      data: {
        numeroPedido,
        clienteId: targetClientId,
        repartidorId: repartidorId ? parseInt(repartidorId, 10) : null,
        cantidadBotellones: qty,
        precioUnitario: unitPrice,
        montoTotal: totalAmount,
        metodoPago: metodoPago || 'EFECTIVO',
        estadoPago: metodoPago === 'EFECTIVO' ? 'VERIFICADO' : 'PENDIENTE',
        estadoEntrega: repartidorId ? 'EN_CAMINO' : 'PENDIENTE',
        numeroRemision: numeroRemision || null,
      },
      include: {
        cliente: true,
        repartidor: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
  }
}
