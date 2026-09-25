import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando base de datos para producción (0 pedidos, 0 clientes, 0 historial)...');

  await prisma.deliveryLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.client.deleteMany();

  // Reset driver GPS positions and assigned order references
  await prisma.user.updateMany({
    data: {
      lat: null,
      lng: null,
      speed: null,
      heading: null,
      lastLocationUpdate: null,
    },
  });

  console.log('¡Base de datos limpiada con éxito!');
  console.log('- Pedidos: 0');
  console.log('- Clientes: 0');
  console.log('- Registros de entrega: 0');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
