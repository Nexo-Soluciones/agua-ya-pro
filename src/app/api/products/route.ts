import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        precioBase: true,
        categoria: true,
        icono: true,
        orden: true,
        estado: true,
      },
      orderBy: { orden: 'asc' },
    });
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Error al obtener catálogo de productos' }, { status: 500 });
  }
}
