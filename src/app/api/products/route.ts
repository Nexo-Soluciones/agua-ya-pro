import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { orden: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Error al obtener catálogo de productos' }, { status: 500 });
  }
}
