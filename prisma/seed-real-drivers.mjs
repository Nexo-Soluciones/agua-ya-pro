import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Configurando repartidores reales...');

  // Ensure Admin exists
  const admin = await prisma.user.upsert({
    where: { telefono: '3000000000' },
    update: { nombre: 'Administrador Oficina', rol: 'ADMIN', estado: 'ACTIVO' },
    create: { nombre: 'Administrador Oficina', telefono: '3000000000', rol: 'ADMIN', estado: 'ACTIVO' },
  });

  // Real drivers requested by user
  const realDrivers = [
    { nombre: 'Jesús', telefono: '3001111111' },
    { nombre: 'Isaac', telefono: '3002222222' },
    { nombre: 'Andrés', telefono: '3003333333' },
    { nombre: 'Obed', telefono: '3004444444' },
    { nombre: 'Francisco', telefono: '3005555555' },
  ];

  for (const d of realDrivers) {
    await prisma.user.upsert({
      where: { telefono: d.telefono },
      update: { nombre: d.nombre, rol: 'REPARTIDOR', estado: 'ACTIVO' },
      create: { nombre: d.nombre, telefono: d.telefono, rol: 'REPARTIDOR', estado: 'ACTIVO' },
    });
  }

  const allDrivers = await prisma.user.findMany({ where: { rol: 'REPARTIDOR' }, orderBy: { id: 'asc' } });
  console.log('Repartidores configurados con éxito:');
  allDrivers.forEach((d, i) => console.log(`- Repartidor ${i + 1}: ${d.nombre} (${d.telefono})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
