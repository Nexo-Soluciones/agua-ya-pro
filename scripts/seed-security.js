const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Configurando Credenciales Seguras en Base de Datos ---');

  // 1. Admin setup
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AguaYa2026!';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const adminEmail = 'admin@aguaya.com';

  const existingAdmin = await prisma.user.findFirst({
    where: { rol: 'ADMIN' },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: existingAdmin.email || adminEmail,
        passwordHash: adminPasswordHash,
        rol: 'ADMIN',
      },
    });
    console.log(`✅ Administrador actualizado: ${existingAdmin.nombre} (${existingAdmin.email || adminEmail})`);
  } else {
    const createdAdmin = await prisma.user.create({
      data: {
        nombre: 'Administrador Principal',
        telefono: '3000000000',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        rol: 'ADMIN',
        estado: 'ACTIVO',
      },
    });
    console.log(`✅ Administrador creado: ${createdAdmin.nombre} (${createdAdmin.email})`);
  }

  // 2. Repartidores PINs Setup
  const pinMap = {
    'Repartidor 1': '1111',
    'Repartidor 2': '2222',
    'Repartidor 3': '3333',
    'Repartidor 4': '4444',
  };

  const allDrivers = await prisma.user.findMany({
    where: { rol: 'REPARTIDOR' },
  });

  for (const driver of allDrivers) {
    // Default PIN if matching name or '1234'
    const pin = pinMap[driver.nombre] || '1111';
    const pinHash = await bcrypt.hash(pin, 10);
    await prisma.user.update({
      where: { id: driver.id },
      data: { pinHash },
    });
    console.log(`✅ PIN hasheado configurado para ${driver.nombre} (PIN: ${pin})`);
  }

  // If no drivers exist, create the standard 4
  if (allDrivers.length === 0) {
    for (const [name, pin] of Object.entries(pinMap)) {
      const pinHash = await bcrypt.hash(pin, 10);
      const phoneNum = '300' + pin + '0000'.slice(0, 3);
      await prisma.user.create({
        data: {
          nombre: name,
          telefono: phoneNum,
          pinHash,
          rol: 'REPARTIDOR',
          estado: 'ACTIVO',
        },
      });
      console.log(`✅ Repartidor creado: ${name} (PIN: ${pin})`);
    }
  }

  console.log('--- Seguridad de Usuarios Inicializada con Éxito ---');
}

main()
  .catch((e) => {
    console.error('Error seeding security:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
