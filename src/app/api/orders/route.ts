import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, recordAudit } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    const whereClause: any = {};

    if (driverId) {
      const parsedDriverId = parseInt(driverId, 10);
      if (!isNaN(parsedDriverId)) {
        whereClause.repartidorId = parsedDriverId;
      }
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
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error?.message || 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
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
      creadoPor: requestCreadoPor,
      requiereFactura,
      numeroFactura,
    } = body;

    const finalCreadoPor = requestCreadoPor || session?.nombre || 'Administración';
    const hasFactura = Boolean(requiereFactura);
    const numFactura = hasFactura && numeroFactura ? String(numeroFactura).trim() : null;

    // 1. Resolve Target Client safely
    let targetClientId: number | null = null;
    if (
      clienteId !== undefined &&
      clienteId !== null &&
      clienteId !== '' &&
      clienteId !== 'null' &&
      clienteId !== 'undefined'
    ) {
      const parsed = parseInt(String(clienteId), 10);
      if (!isNaN(parsed) && parsed > 0) {
        targetClientId = parsed;
      }
    }

    if (!targetClientId) {
      if (!telefonoCliente || !nombreCliente || !direccionCliente) {
        return NextResponse.json(
          { error: 'Datos de cliente incompletos (Nombre, teléfono y dirección son obligatorios).' },
          { status: 400 }
        );
      }

      const cleanPhone = String(telefonoCliente).trim();
      const cleanNombre = String(nombreCliente).trim();
      const cleanDir = String(direccionCliente).trim();
      const cleanBarrio = barrioSector ? String(barrioSector).trim() : '';
      const cleanNotas = notasUbicacion ? String(notasUbicacion).trim() : '';

      const basePrice = requestUnitPrice !== undefined && requestUnitPrice !== null
        ? Math.max(0, parseFloat(String(requestUnitPrice)) || 7000)
        : (tipoCliente === 'NUEVO' ? 8000 : 7000);

      // Upsert client to avoid unique constraint collisions on phone number
      const client = await db.client.upsert({
        where: { telefono: cleanPhone },
        update: {
          nombre: cleanNombre,
          direccion: cleanDir,
          barrioSector: cleanBarrio,
          tipoCliente: tipoCliente || 'VIEJO',
          precioAcordado: basePrice,
          notasUbicacion: cleanNotas,
          requiereFactura: hasFactura,
          numeroFactura: numFactura,
        },
        create: {
          nombre: cleanNombre,
          telefono: cleanPhone,
          direccion: cleanDir,
          barrioSector: cleanBarrio,
          tipoCliente: tipoCliente || 'NUEVO',
          precioAcordado: basePrice,
          notasUbicacion: cleanNotas,
          requiereFactura: hasFactura,
          numeroFactura: numFactura,
        },
      });
      targetClientId = client.id;
    }

    const client = await db.client.findUnique({ where: { id: targetClientId } });
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado en la base de datos.' }, { status: 404 });
    }

    // 2. Resolve Repartidor safely
    let finalRepartidorId: number | null = null;
    if (
      repartidorId !== undefined &&
      repartidorId !== null &&
      repartidorId !== '' &&
      repartidorId !== 'null' &&
      repartidorId !== 'undefined'
    ) {
      const parsedRepId = parseInt(String(repartidorId), 10);
      if (!isNaN(parsedRepId) && parsedRepId > 0) {
        const driverExists = await db.user.findFirst({
          where: { id: parsedRepId, rol: 'REPARTIDOR' },
          select: { id: true },
        });
        if (driverExists) {
          finalRepartidorId = driverExists.id;
        }
      }
    }

    // 3. Process items or fallback to single botellon calculation
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
      // Check valid product IDs in DB to prevent foreign key errors
      const validProducts = await db.product.findMany({ select: { id: true } });
      const validProductIds = new Set(validProducts.map((p) => p.id));

      orderItemsData = items.map((item: any) => {
        const itemQty = Math.max(1, parseInt(String(item.cantidad || '1'), 10) || 1);
        const itemPrice = Math.max(0, parseFloat(String(item.precioUnitario || '0')) || 0);
        const itemSubtotal = itemQty * itemPrice;
        calculatedTotal += itemSubtotal;

        const pId = item.productoId ? parseInt(String(item.productoId), 10) : null;
        const safeProductId = pId && !isNaN(pId) && validProductIds.has(pId) ? pId : null;

        if (String(item.nombreProducto || '').toUpperCase().includes('BOTELLON')) {
          totalBotellonesQty += itemQty;
        }

        return {
          productoId: safeProductId,
          nombreProducto: String(item.nombreProducto || 'Producto'),
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
      // Fallback
      const qty = Math.max(1, parseInt(String(cantidadBotellones || '1'), 10) || 1);
      const unitPrice = requestUnitPrice !== undefined && requestUnitPrice !== null
        ? Math.max(0, parseFloat(String(requestUnitPrice)) || 7000)
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

    // 4. Calculate unique and strictly increasing numeroPedido
    const lastOrder = await db.order.findFirst({
      orderBy: { id: 'desc' },
      select: { numeroPedido: true, id: true },
    });
    const lastNum = lastOrder?.numeroPedido || 1000;
    const numeroPedido = Math.max(lastNum + 1, (lastOrder?.id || 0) + 1001);

    const estadoEntrega = finalRepartidorId ? 'EN_CAMINO' : 'PENDIENTE';

    // 5. Create the Order with atomic items
    const order = await db.order.create({
      data: {
        numeroPedido,
        clienteId: targetClientId,
        repartidorId: finalRepartidorId,
        cantidadBotellones: totalBotellonesQty,
        precioUnitario: orderItemsData[0]?.precioUnitario || 7000,
        montoTotal: calculatedTotal,
        resumenProductos: summaryText,
        metodoPago: metodoPago || 'EFECTIVO',
        estadoPago: metodoPago === 'EFECTIVO' ? 'VERIFICADO' : 'PENDIENTE',
        estadoEntrega,
        numeroRemision: numeroRemision ? String(numeroRemision).trim() : null,
        creadoPor: finalCreadoPor,
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

    // 6. Record audit log
    await recordAudit({
      usuarioId: session?.userId || null,
      rol: session?.rol || 'ADMIN',
      accion: 'CREAR_PEDIDO',
      detalles: `Pedido #${numeroPedido} creado por [${finalCreadoPor}] para ${client.nombre}. Total: $${calculatedTotal.toLocaleString('es-CO')} (${summaryText})`,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al crear el pedido' },
      { status: 500 }
    );
  }
}
