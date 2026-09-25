const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PRODUCTS_CATALOG = [
  {
    nombre: 'BOTELLON (20L)',
    categoria: 'BOTELLONES',
    precioBase: 10000,
    preciosDisponibles: JSON.stringify([10500, 10000, 9500, 9000, 8933, 8500, 8000, 7000, 6000, 5000]),
    icono: '💧',
    descripcion: 'Recarga estándar de agua purificada en botellón de 20 Litros',
    orden: 1,
  },
  {
    nombre: 'BOTELLON VC (Envase + Agua)',
    categoria: 'BOTELLONES',
    precioBase: 40000,
    preciosDisponibles: JSON.stringify([40000, 38000, 35000]),
    icono: '🆕',
    descripcion: 'Botellón plástico nuevo 20L completo con recarga de agua incluida',
    orden: 2,
  },
  {
    nombre: 'BANDEJA 620 ML',
    categoria: 'BANDEJAS',
    precioBase: 15000,
    preciosDisponibles: JSON.stringify([15000]),
    icono: '📦',
    descripcion: 'Bandeja de bolsas de agua purificada de 620 ml',
    orden: 3,
  },
  {
    nombre: 'BANDEJA 300 ML',
    categoria: 'BANDEJAS',
    precioBase: 14000,
    preciosDisponibles: JSON.stringify([14000]),
    icono: '📦',
    descripcion: 'Bandeja de bolsas de agua purificada de 300 ml',
    orden: 4,
  },
  {
    nombre: 'BANDEJA 250 ML',
    categoria: 'BANDEJAS',
    precioBase: 22000,
    preciosDisponibles: JSON.stringify([22000]),
    icono: '📦',
    descripcion: 'Bandeja de bolsas de agua purificada de 250 ml',
    orden: 5,
  },
  {
    nombre: 'BANDEJA 400 ML',
    categoria: 'BANDEJAS',
    precioBase: 14000,
    preciosDisponibles: JSON.stringify([14000]),
    icono: '📦',
    descripcion: 'Bandeja de bolsas de agua purificada de 400 ml',
    orden: 6,
  },
  {
    nombre: 'BANDEJA LITRO',
    categoria: 'BANDEJAS',
    precioBase: 16000,
    preciosDisponibles: JSON.stringify([16000]),
    icono: '📦',
    descripcion: 'Bandeja de bolsas de agua de 1 Litro (1000 ml)',
    orden: 7,
  },
  {
    nombre: 'GARRAFA 5 L',
    categoria: 'GARRAFAS',
    precioBase: 3500,
    preciosDisponibles: JSON.stringify([3500, 3000]),
    icono: '🪣',
    descripcion: 'Garrafa plástica de agua purificada 5 Litros',
    orden: 8,
  },
  {
    nombre: 'PAQUETE 360 ML',
    categoria: 'PAQUETES',
    precioBase: 3500,
    preciosDisponibles: JSON.stringify([3500, 3000]),
    icono: '🥤',
    descripcion: 'Paquete de agua purificada de 360 ml',
    orden: 9,
  },
  {
    nombre: 'PERSONALIZADA',
    categoria: 'ESPECIAL',
    precioBase: 22000,
    preciosDisponibles: JSON.stringify([22000, 21000, 20000, 19000]),
    icono: '🏷️',
    descripcion: 'Bolsas de agua purificada con empaque personalizado de marca',
    orden: 10,
  },
  {
    nombre: 'DISPENSADOR DE AGUA',
    categoria: 'DISPENSADORES',
    precioBase: 40000,
    preciosDisponibles: JSON.stringify([40000, 35000]),
    icono: '🚰',
    descripcion: 'Dispensador manual / de mesa para botellón de agua',
    orden: 11,
  },
];

async function seedProducts() {
  console.log('--- Sembrando Catálogo de Productos en Base de Datos ---');

  for (const prod of PRODUCTS_CATALOG) {
    const existing = await prisma.product.findUnique({
      where: { nombre: prod.nombre },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: prod,
      });
      console.log(`✅ Producto actualizado: ${prod.nombre} ($${prod.precioBase.toLocaleString('es-CO')})`);
    } else {
      const created = await prisma.product.create({
        data: prod,
      });
      console.log(`✅ Producto creado: ${created.nombre} ($${created.precioBase.toLocaleString('es-CO')})`);
    }
  }

  console.log('--- Catálogo de 11 Productos Inicializado con Éxito ---');
}

seedProducts()
  .catch((e) => {
    console.error('Error seeding products:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
