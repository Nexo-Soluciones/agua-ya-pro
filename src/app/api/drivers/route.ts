import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const drivers = await db.user.findMany({
      where: { rol: 'REPARTIDOR', estado: 'ACTIVO' },
      include: {
        pedidosAsignados: {
          where: {
            estadoEntrega: {
              in: ['PENDIENTE', 'EN_CAMINO'],
            },
          },
          include: {
            cliente: true,
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

    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Error al obtener repartidores' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, telefono } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre del repartidor es obligatorio' }, { status: 400 });
    }

    const tel = telefono && telefono.trim() ? telefono.trim() : `300${Math.floor(1000000 + Math.random() * 9000000)}`;

    const newDriver = await db.user.create({
      data: {
        nombre: nombre.trim(),
        telefono: tel,
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
