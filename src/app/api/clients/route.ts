import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (query) {
      const clients = await db.client.findMany({
        where: {
          OR: [
            { nombre: { contains: query } },
            { telefono: { contains: query } },
          ],
        },
        orderBy: { nombre: 'asc' },
        take: 10,
      });
      return NextResponse.json(clients);
    }

    const clients = await db.client.findMany({
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, telefono, direccion, barrioSector, tipoCliente, precioAcordado, notasUbicacion } = body;
    const precio = precioAcordado !== undefined && precioAcordado !== null ? parseFloat(precioAcordado) : (tipoCliente === 'NUEVO' ? 8000 : 7000);

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
      },
      create: {
        nombre,
        telefono,
        direccion,
        barrioSector,
        tipoCliente: tipoCliente || 'NUEVO',
        precioAcordado: precio,
        notasUbicacion,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error saving client:', error);
    return NextResponse.json({ error: 'Error al guardar cliente' }, { status: 500 });
  }
}
