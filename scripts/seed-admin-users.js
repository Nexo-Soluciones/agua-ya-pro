const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_USERS = [
  {
    nombre: 'Thalia Jimenez',
    email: 'thalia@aguaya.com',
    telefono: '3101000001',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'AguaYa2026!',
    rol: 'ADMIN',
  },
  {
    nombre: 'Leidy Giraldo',
    email: 'leidy@aguaya.com',
    telefono: '3101000002',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'AguaYa2026!',
    rol: 'ADMIN',
  },
  {
    nombre: 'Maritza Correa',
    email: 'maritza@aguaya.com',
    telefono: '3101000003',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'AguaYa2026!',
    rol: 'ADMIN',
  },
  {
    nombre: 'Administrador Principal',
    email: 'admin@aguaya.com',
    telefono: '3000000000',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'AguaYa2026!',
    rol: 'ADMIN',
  },
];

async function main() {
  console.log('--- Creando / Actualizando Usuarios Administrativos ---');

  for (const user of ADMIN_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    const existingByEmail = await prisma.user.findFirst({
      where: { email: { equals: user.email, mode: 'insensitive' } },
    });

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          nombre: user.nombre,
          telefono: user.telefono,
          passwordHash,
          rol: user.rol,
          estado: 'ACTIVO',
        },
      });
      console.log(`✅ Usuario actualizado: ${user.nombre} (${user.email})`);
    } else {
      const existingByPhone = await prisma.user.findUnique({
        where: { telefono: user.telefono },
      });

      if (existingByPhone) {
        await prisma.user.update({
          where: { id: existingByPhone.id },
          data: {
            nombre: user.nombre,
            email: user.email,
            passwordHash,
            rol: user.rol,
            estado: 'ACTIVO',
          },
        });
        console.log(`✅ Usuario actualizado por teléfono: ${user.nombre} (${user.email})`);
      } else {
        const created = await prisma.user.create({
          data: {
            nombre: user.nombre,
            email: user.email,
            telefono: user.telefono,
            passwordHash,
            rol: user.rol,
            estado: 'ACTIVO',
          },
        });
        console.log(`✅ Usuario creado exitosamente: ${created.nombre} (${created.email})`);
      }
    }
  }

  const allAdmins = await prisma.user.findMany({
    where: { rol: 'ADMIN' },
    select: { id: true, nombre: true, email: true, rol: true, estado: true },
  });

  console.log('\n--- Lista de Administradores Registrados ---');
  console.table(allAdmins);
}

main()
  .catch((e) => {
    console.error('Error seeding admin users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
