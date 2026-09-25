import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Seed GPS Coordinates for Test Drivers (Cúcuta Map Simulation)
 */
export async function POST() {
  try {
    const drivers = await db.user.findMany({
      where: { rol: 'REPARTIDOR' },
    });

    if (drivers.length === 0) {
      return NextResponse.json({ error: 'No se encontraron repartidores' }, { status: 404 });
    }

    // Realistic Cúcuta coordinates
    const coordinates = [
      { lat: 7.8939, lng: -72.5078, name: 'Repartidor 1' }, // Centro Cúcuta
      { lat: 7.9051, lng: -72.5023, name: 'Repartidor 2' }, // Vía Boconó / Barrio Latino
      { lat: 7.8824, lng: -72.5198, name: 'Repartidor 3' }, // San Martín
    ];

    for (let i = 0; i < drivers.length; i++) {
      const coord = coordinates[i % coordinates.length];
      await db.user.update({
        where: { id: drivers[i].id },
        data: {
          lat: coord.lat,
          lng: coord.lng,
          speed: 15.5,
          heading: 90,
          lastLocationUpdate: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Coordenadas GPS simuladas cargadas con éxito para el mapa',
    });
  } catch (error) {
    console.error('Error seeding GPS coordinates:', error);
    return NextResponse.json({ error: 'Error al simular coordenadas GPS' }, { status: 500 });
  }
}
