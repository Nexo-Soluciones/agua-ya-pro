import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const driverId = parseInt(params.id, 10);
    const body = await req.json();
    const { lat, lng, speed, heading } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Latitud y longitud son requeridos' }, { status: 400 });
    }

    const updatedDriver = await db.user.update({
      where: { id: driverId },
      data: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        speed: speed !== undefined ? parseFloat(speed) : null,
        heading: heading !== undefined ? parseFloat(heading) : null,
        lastLocationUpdate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      driverId: updatedDriver.id,
      nombre: updatedDriver.nombre,
      lat: updatedDriver.lat,
      lng: updatedDriver.lng,
      lastLocationUpdate: updatedDriver.lastLocationUpdate,
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    return NextResponse.json({ error: 'Error al actualizar ubicación' }, { status: 500 });
  }
}
