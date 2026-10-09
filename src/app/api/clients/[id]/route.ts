import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, recordAudit } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id, 10);
    if (isNaN(clientId) || clientId <= 0) {
      return NextResponse.json({ error: 'ID de cliente inválido' }, { status: 400 });
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        pedidos: {
          take: 10,
          orderBy: { fechaCreacion: 'desc' },
          select: {
            id: true,
            numeroPedido: true,
            estadoEntrega: true,
            montoTotal: true,
            fechaCreacion: true,
          },
        },
        _count: {
          select: { pedidos: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(client, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching client by ID:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del cliente', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id, 10);
    if (isNaN(clientId) || clientId <= 0) {
      return NextResponse.json({ error: 'ID de cliente inválido' }, { status: 400 });
    }

    const existingClient = await db.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado en la base de datos' }, { status: 404 });
    }

    const body = await req.json();
    const {
      nombre,
      telefono,
      direccion,
      barrioSector,
      tipoCliente,
      precioAcordado,
      notasUbicacion,
      requiereFactura,
      numeroFactura,
    } = body;

    const cleanNombre = nombre !== undefined ? String(nombre).trim() : existingClient.nombre;
    const cleanTelefono = telefono !== undefined ? String(telefono).trim() : existingClient.telefono;
    const cleanDireccion = direccion !== undefined ? String(direccion).trim() : existingClient.direccion;
    const cleanBarrio = barrioSector !== undefined ? (barrioSector ? String(barrioSector).trim() : null) : existingClient.barrioSector;
    const cleanNotas = notasUbicacion !== undefined ? (notasUbicacion ? String(notasUbicacion).trim() : null) : existingClient.notasUbicacion;
    const cleanTipo = tipoCliente !== undefined ? (tipoCliente === 'NUEVO' ? 'NUEVO' : 'VIEJO') : existingClient.tipoCliente;
    
    const cleanPrecio = precioAcordado !== undefined && precioAcordado !== null
      ? Math.max(0, parseFloat(String(precioAcordado)))
      : existingClient.precioAcordado;

    const hasFactura = requiereFactura !== undefined ? Boolean(requiereFactura) : existingClient.requiereFactura;
    const cleanNumFactura = hasFactura && numeroFactura ? String(numeroFactura).trim() : null;

    if (!cleanNombre || !cleanTelefono || !cleanDireccion) {
      return NextResponse.json(
        { error: 'Nombre, teléfono y dirección son obligatorios.' },
        { status: 400 }
      );
    }

    // Check if new phone is used by another client
    if (cleanTelefono !== existingClient.telefono) {
      const phoneConflict = await db.client.findFirst({
        where: {
          telefono: cleanTelefono,
          id: { not: clientId },
        },
      });

      if (phoneConflict) {
        return NextResponse.json(
          {
            error: `El teléfono ${cleanTelefono} ya está registrado para otro cliente (${phoneConflict.nombre}).`,
          },
          { status: 409 }
        );
      }
    }

    const updatedClient = await db.client.update({
      where: { id: clientId },
      data: {
        nombre: cleanNombre,
        telefono: cleanTelefono,
        direccion: cleanDireccion,
        barrioSector: cleanBarrio,
        tipoCliente: cleanTipo,
        precioAcordado: cleanPrecio,
        notasUbicacion: cleanNotas,
        requiereFactura: hasFactura,
        numeroFactura: cleanNumFactura,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      client: updatedClient,
    });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const clientId = parseInt(params.id, 10);
    if (isNaN(clientId) || clientId <= 0) {
      return NextResponse.json({ error: 'ID de cliente inválido' }, { status: 400 });
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        _count: {
          select: { pedidos: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado en la base de datos' }, { status: 404 });
    }

    const operatorName = session?.nombre || 'Administración';

    // Delete client from DB (cascades to related order items/logs if any)
    await db.client.delete({
      where: { id: clientId },
    });

    await recordAudit({
      usuarioId: session?.userId || null,
      rol: session?.rol || 'ADMIN',
      accion: 'ELIMINAR_CLIENTE',
      detalles: `Cliente "${client.nombre}" (ID: #${client.id}, Tel: ${client.telefono}) con ${client._count.pedidos} pedido(s) asociado(s) fue eliminado por [${operatorName}]`,
    });

    return NextResponse.json({
      success: true,
      message: `Cliente "${client.nombre}" eliminado exitosamente`,
    });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el cliente', details: error?.message },
      { status: 500 }
    );
  }
}
