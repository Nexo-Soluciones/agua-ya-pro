import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

function cleanPhone(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  str = str.replace(/[^\d+]/g, '');
  if (str.startsWith('+57')) str = str.slice(3);
  if (str.startsWith('57') && str.length === 12) str = str.slice(2);
  return str.trim();
}

function safeSlice(str, maxLen) {
  if (!str) return '';
  // Convert to array of unicode characters to avoid breaking surrogate pairs (emojis)
  return Array.from(str).slice(0, maxLen).join('').trim();
}

function sanitizeText(str) {
  if (!str) return '';
  // Strip broken unpaired surrogates and control characters
  return String(str)
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

function formatClientName(direccion, barrio) {
  const dir = sanitizeText(direccion);
  const bar = sanitizeText(barrio);

  const lower = dir.toLowerCase();
  if (
    lower.includes('edificio') ||
    lower.includes('local') ||
    lower.includes('taller') ||
    lower.includes('óptica') ||
    lower.includes('tienda') ||
    lower.includes('oficina') ||
    lower.includes('inmobiliaria')
  ) {
    return `Cliente (${safeSlice(dir, 45)})`;
  }

  if (bar && bar.length > 2) {
    return `Cliente - ${bar} (${safeSlice(dir, 30)})`;
  }

  return `Cliente - ${safeSlice(dir, 35)}`;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📥 IMPORTACIÓN MASIVA DE CLIENTES REALES — AGUA FONT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const filePath = path.join(process.cwd(), 'contactos por Direccion1.xlsx');
  console.log(`📖 Leyendo archivo: ${filePath}`);

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Total registros leídos del Excel: ${rawRows.length}`);

  const uniqueClientsMap = new Map();
  let invalidCount = 0;

  for (const row of rawRows) {
    const rawTel = row['TELEFONO'];
    const rawDir = sanitizeText((row['DIRECCION'] || '').toString());
    const rawBarrio = sanitizeText((row['BARRIO'] || '').toString());

    const telefono = cleanPhone(rawTel);
    if (!telefono || telefono.length < 7) {
      invalidCount++;
      continue;
    }

    if (uniqueClientsMap.has(telefono)) {
      const existing = uniqueClientsMap.get(telefono);
      if (rawDir.length > existing.direccion.length) {
        existing.direccion = rawDir || 'Dirección por confirmar';
        existing.barrioSector = rawBarrio && rawBarrio.toLowerCase() !== 'undefined' ? rawBarrio : existing.barrioSector;
      }
      continue;
    }

    const direccion = rawDir || 'Dirección por confirmar';
    const barrioSector = rawBarrio && rawBarrio.toLowerCase() !== 'undefined' ? rawBarrio : null;
    const nombre = formatClientName(direccion, barrioSector);

    uniqueClientsMap.set(telefono, {
      nombre,
      telefono,
      direccion,
      barrioSector,
      tipoCliente: 'VIEJO',
      precioAcordado: 7000,
      notasUbicacion: barrioSector ? `Sector: ${barrioSector}` : null,
    });
  }

  const clientsToInsert = Array.from(uniqueClientsMap.values());
  console.log(`✨ Total clientes únicos depurados listos para insertar: ${clientsToInsert.length}`);
  if (invalidCount > 0) {
    console.log(`⚠️ Registros ignorados por teléfono inválido: ${invalidCount}`);
  }

  // Inserción en lotes de 500 registros con skipDuplicates
  const CHUNK_SIZE = 500;
  let insertedTotal = 0;

  console.log('\n🚀 Iniciando inserción en base de datos por lotes...');
  for (let i = 0; i < clientsToInsert.length; i += CHUNK_SIZE) {
    const chunk = clientsToInsert.slice(i, i + CHUNK_SIZE);
    const result = await prisma.client.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    insertedTotal += result.count;
    console.log(`   ⏳ Progreso: Lote ${Math.floor(i / CHUNK_SIZE) + 1} procesado (${insertedTotal} / ${clientsToInsert.length} clientes en base de datos)...`);
  }

  const totalInDb = await prisma.client.count();
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ IMPORTACIÓN COMPLETADA CON ÉXITO');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   - Nuevos clientes creados: ${insertedTotal}`);
  console.log(`   - Total clientes en base de datos: ${totalInDb}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en la importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
