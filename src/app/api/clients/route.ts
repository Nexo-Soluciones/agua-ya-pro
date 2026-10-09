import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();

    if (query && query.length >= 2) {
      const clients = await db.client.findMany({
        where: {
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { telefono: { contains: query } },
            { direccion: { contains: query, mode: 'insensitive' } },
            { barrioSector: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          direccion: true,
          barrioSector: true,
          tipoCliente: true,
          precioAcordado: true,
          notasUbicacion: true,
          requiereFactura: true,
          numeroFactura: true,
          lat: true,
          lng: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      });
      return NextResponse.json(clients, {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=20',
        },
      });
    }

    // Default limit to 50 recent clients to keep frontend fast with large database
    const clients = await db.client.findMany({
      select: {
        id: true,
        nombre: true,
        telefono: true,
        direccion: true,
        barrioSector: true,
        tipoCliente: true,
        precioAcordado: true,
        notasUbicacion: true,
        requiereFactura: true,
        numeroFactura: true,
        lat: true,
        lng: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(clients, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const precio = precioAcordado !== undefined && precioAcordado !== null ? parseFloat(precioAcordado) : 10000;
    const hasFactura = Boolean(requiereFactura);
    const numFactura = hasFactura && numeroFactura ? String(numeroFactura).trim() : null;

    if (!nombre || !telefono || !direccion) {
      return NextResponse.json({ error: 'Nombre, teléfono y dirección son obligatorios' }, { status: 400 });
    }

    const client = await db.client.upsert({
      where: { telefono },
      update: {
        nombre,
        direccion,
        barrioSector,
        tipoCliente: tipoCliente || 'VIEJO',
        precioAcordado: precio,
        notasUbicacion,
        requiereFactura: hasFactura,
        numeroFactura: numFactura,
      },
      create: {
        nombre,
        telefono,
        direccion,
        barrioSector,
        tipoCliente: tipoCliente || 'NUEVO',
        precioAcordado: precio,
        notasUbicacion,
        requiereFactura: hasFactura,
        numeroFactura: numFactura,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error saving client:', error);
    return NextResponse.json({ error: 'Error al guardar cliente' }, { status: 500 });
  }
}
