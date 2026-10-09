import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashSecret } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const drivers = await db.user.findMany({
      where: { rol: 'REPARTIDOR', estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        rol: true,
        estado: true,
        lat: true,
        lng: true,
        speed: true,
        heading: true,
        lastLocationUpdate: true,
        pedidosAsignados: {
          where: {
            estadoEntrega: {
              in: ['PENDIENTE', 'EN_CAMINO'],
            },
          },
          take: 3,
          select: {
            id: true,
            numeroPedido: true,
            estadoEntrega: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
              },
            },
          },
        },
        _count: {
          select: {
            pedidosAsignados: {
              where: {
                estadoEntrega: {
                  in: ['PENDIENTE', 'EN_CAMINO'],
                },
              },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(drivers, {
      headers: {
        'Cache-Control': 'public, s-maxage=6, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Error al obtener repartidores' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, telefono, pin } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre del repartidor es obligatorio' }, { status: 400 });
    }

    const tel = telefono && telefono.trim() ? telefono.trim() : `300${Math.floor(1000000 + Math.random() * 9000000)}`;
    const driverPin = pin && pin.toString().trim() ? pin.toString().trim() : '1234';
    const pinHash = await hashSecret(driverPin);

    const newDriver = await db.user.create({
      data: {
        nombre: nombre.trim(),
        telefono: tel,
        pinHash,
        rol: 'REPARTIDOR',
        estado: 'ACTIVO',
      },
    });

    return NextResponse.json(newDriver, { status: 201 });
  } catch (error: any) {
    console.error('Error creating driver:', error);
    return NextResponse.json({ error: 'Error al registrar repartidor' }, { status: 500 });
  }
}
