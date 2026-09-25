import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Reset existing data
  await prisma.deliveryLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // Create Users (Admin & 3 Drivers)
  const admin = await prisma.user.create({
    data: {
      nombre: 'Administrador Oficina',
      telefono: '3000000000',
      rol: 'ADMIN',
      estado: 'ACTIVO',
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      nombre: 'Repartidor 1',
      telefono: '3001111111',
      rol: 'REPARTIDOR',
      estado: 'ACTIVO',
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      nombre: 'Repartidor 2',
      telefono: '3002222222',
      rol: 'REPARTIDOR',
      estado: 'ACTIVO',
    },
  });

  const driver3 = await prisma.user.create({
    data: {
      nombre: 'Repartidor 3',
      telefono: '3003333333',
      rol: 'REPARTIDOR',
      estado: 'ACTIVO',
    },
  });

  // Create Initial Clients
  const client1 = await prisma.client.create({
    data: {
      nombre: 'Carlos Mendoza',
      telefono: '3104567890',
      direccion: 'Calle 45 # 12-34',
      barrioSector: 'Centro',
      tipoCliente: 'VIEJO',
      notasUbicacion: 'Casa de 2 pisos, portón azul',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      nombre: 'Maria Fernanda Gomez',
      telefono: '3159876543',
      direccion: 'Carrera 18 # 7-89',
      barrioSector: 'Prados del Norte',
      tipoCliente: 'NUEVO',
      notasUbicacion: 'Apartamento 302',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      nombre: 'Don Pedro Restrepo',
      telefono: '3201122334',
      direccion: 'Transversal 5 # 22-10',
      barrioSector: 'San Antonio',
      tipoCliente: 'VIEJO',
      notasUbicacion: 'Local Comercial Tienda Don Pedro',
    },
  });

  // Create Sample Orders
  await prisma.order.create({
    data: {
      clienteId: client1.id,
      repartidorId: driver1.id,
      cantidadBotellones: 2,
      precioUnitario: 7000,
      montoTotal: 14000,
      metodoPago: 'EFECTIVO',
      estadoPago: 'VERIFICADO',
      estadoEntrega: 'EN_CAMINO',
    },
  });

  await prisma.order.create({
    data: {
      clienteId: client2.id,
      repartidorId: driver2.id,
      cantidadBotellones: 1,
      precioUnitario: 8000,
      montoTotal: 8000,
      metodoPago: 'NEQUI',
      estadoPago: 'PENDIENTE',
      estadoEntrega: 'EN_CAMINO',
      comprobanteRef: 'NEQ-894721',
    },
  });

  await prisma.order.create({
    data: {
      clienteId: client3.id,
      repartidorId: null,
      cantidadBotellones: 3,
      precioUnitario: 7000,
      montoTotal: 21000,
      metodoPago: 'EFECTIVO',
      estadoPago: 'PENDIENTE',
      estadoEntrega: 'PENDIENTE',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
