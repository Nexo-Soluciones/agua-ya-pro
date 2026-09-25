const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Configurando Repartidores 1, 2, 3, 4 ---');

  // 1. Limpiar o actualizar repartidores
  const driverNames = ['Repartidor 1', 'Repartidor 2', 'Repartidor 3', 'Repartidor 4'];
  const drivers = [];

  // Actualizar o crear los 4 repartidores
  for (let i = 0; i < driverNames.length; i++) {
    const name = driverNames[i];
    const phone = `300100000${i + 1}`;
    
    // Buscar si ya existe
    let driver = await prisma.user.findFirst({
      where: {
        OR: [
          { nombre: name },
          { telefono: phone }
        ]
      }
    });

    if (!driver) {
      driver = await prisma.user.create({
        data: {
          nombre: name,
          telefono: phone,
          rol: 'REPARTIDOR',
          estado: 'ACTIVO',
          lat: 7.8939 + (i * 0.005),
          lng: -72.5078 + (i * 0.005),
        }
      });
    } else {
      driver = await prisma.user.update({
        where: { id: driver.id },
        data: {
          nombre: name,
          rol: 'REPARTIDOR',
          estado: 'ACTIVO',
        }
      });
    }
    drivers.push(driver);
  }

  console.log(`Repartidores listos:`, drivers.map(d => `${d.id}: ${d.nombre}`));

  // 2. Leer archivo Excel
  console.log('--- Leyendo Contactos por direccion.xlsx ---');
  const wb = XLSX.readFile('Contactos por direccion.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Total registros en Excel: ${rawRows.length}`);

  // 3. Eliminar pedidos de prueba anteriores si se desea un entorno limpio
  await prisma.order.deleteMany({});
  console.log('Pedidos anteriores limpiados para iniciar prueba fresca.');

  let orderCount = 1001;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rawAddress = (row['CLIENTE'] || '').toString().trim();
    if (!rawAddress) continue;

    const bottles = row['Cant'] ? parseInt(row['Cant'], 10) : 1;
    const remision = row['REMISION'] ? String(row['REMISION']).trim() : null;

    // Buscar si hay teléfono dentro del texto
    const phoneMatch = rawAddress.match(/(3\d{2}\s?\d{3}\s?\d{4})/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s/g, '') : `310000${String(i + 1).padStart(4, '0')}`;

    // Crear cliente con nombre vacío / dirección
    const client = await prisma.client.create({
      data: {
        nombre: '', // Dejar nombre vacío como pidió el usuario
        telefono: phone,
        direccion: rawAddress,
        barrioSector: rawAddress.toLowerCase().includes('caobos') ? 'Caobos' : rawAddress.toLowerCase().includes('latino') ? 'Barrio Latino' : '',
        tipoCliente: 'VIEJO',
        precioAcordado: 7000,
        notasUbicacion: '',
      }
    });

    // Asignar cíclicamente a Repartidor 1, 2, 3, 4
    const assignedDriver = drivers[i % drivers.length];
    const unitPrice = 7000;
    const total = bottles * unitPrice;

    await prisma.order.create({
      data: {
        numeroPedido: orderCount++,
        clienteId: client.id,
        repartidorId: assignedDriver.id,
        cantidadBotellones: bottles,
        precioUnitario: unitPrice,
        montoTotal: total,
        metodoPago: remision ? 'CREDITO' : (i % 3 === 0 ? 'EFECTIVO' : i % 3 === 1 ? 'NEQUI' : 'CREDITO'),
        estadoPago: 'PENDIENTE',
        estadoEntrega: 'EN_CAMINO',
        numeroRemision: remision,
        fechaCreacion: new Date(Date.now() - (rawRows.length - i) * 60000), // En orden cronológico para los turnos
      }
    });
  }

  console.log(`✅ Se insertaron exitosamente ${orderCount - 1001} pedidos asignados a Repartidor 1, 2, 3 y 4.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
