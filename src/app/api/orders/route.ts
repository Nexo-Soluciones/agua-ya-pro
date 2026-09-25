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
        items: {
          include: {
            producto: true,
          },
        },
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
      items, // Multi-product items array
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

    // Process items or fallback to single botellon calculation
    let calculatedTotal = 0;
    let totalBotellonesQty = 0;
    let orderItemsData: Array<{
      productoId?: number | null;
      nombreProducto: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }> = [];
    let summaryText = '';

    if (Array.isArray(items) && items.length > 0) {
      orderItemsData = items.map((item: any) => {
        const itemQty = parseInt(item.cantidad || '1', 10);
        const itemPrice = parseFloat(item.precioUnitario || '0');
        const itemSubtotal = itemQty * itemPrice;
        calculatedTotal += itemSubtotal;

        if (item.nombreProducto.toUpperCase().includes('BOTELLON')) {
          totalBotellonesQty += itemQty;
        }

        return {
          productoId: item.productoId ? parseInt(item.productoId, 10) : null,
          nombreProducto: item.nombreProducto,
          cantidad: itemQty,
          precioUnitario: itemPrice,
          subtotal: itemSubtotal,
        };
      });

      summaryText = orderItemsData.map((i) => `${i.cantidad}x ${i.nombreProducto}`).join(', ');
      if (totalBotellonesQty === 0) {
        totalBotellonesQty = orderItemsData.reduce((sum, i) => sum + i.cantidad, 0);
      }
    } else {
      // Legacy fallback
      const qty = parseInt(cantidadBotellones || '1', 10);
      const unitPrice = requestUnitPrice !== undefined && requestUnitPrice !== null
        ? parseFloat(requestUnitPrice)
        : (client.precioAcordado || (client.tipoCliente === 'NUEVO' ? 8000 : 7000));
      calculatedTotal = qty * unitPrice;
      totalBotellonesQty = qty;
      summaryText = `${qty}x BOTELLON (20L)`;

      orderItemsData = [
        {
          productoId: null,
          nombreProducto: 'BOTELLON (20L)',
          cantidad: qty,
          precioUnitario: unitPrice,
          subtotal: calculatedTotal,
        },
      ];
    }

    // Get order count for numeroPedido
    const orderCount = await db.order.count();
    const numeroPedido = 1001 + orderCount;

    const order = await db.order.create({
      data: {
        numeroPedido,
        clienteId: targetClientId,
        repartidorId: repartidorId ? parseInt(repartidorId, 10) : null,
        cantidadBotellones: totalBotellonesQty,
        precioUnitario: orderItemsData[0]?.precioUnitario || 7000,
        montoTotal: calculatedTotal,
        resumenProductos: summaryText,
        metodoPago: metodoPago || 'EFECTIVO',
        estadoPago: metodoPago === 'EFECTIVO' ? 'VERIFICADO' : 'PENDIENTE',
        estadoEntrega: repartidorId ? 'EN_CAMINO' : 'PENDIENTE',
        numeroRemision: numeroRemision || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        cliente: true,
        repartidor: true,
        items: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
  }
}
