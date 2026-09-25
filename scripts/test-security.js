const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function runSecurityTests() {
  console.log('\n========================================');
  console.log('🧪 INICIANDO SUITE DE PRUEBAS DE SEGURIDAD');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Admin Credential Verification in DB
  try {
    console.log('1️⃣ [Prueba] Verificando Credenciales de Administrador en DB...');
    const admin = await prisma.user.findFirst({ where: { rol: 'ADMIN' } });
    if (!admin || !admin.passwordHash) {
      throw new Error('Admin no encontrado o sin passwordHash');
    }
    const isPassValid = await bcrypt.compare('AguaYa2026!', admin.passwordHash);
    if (isPassValid) {
      console.log('   ✅ PASS: Hash bcrypt de Administrador verificado correctamente.');
      passed++;
    } else {
      throw new Error('La contraseña no coincide con el hash en DB');
    }
  } catch (err) {
    console.log('   ❌ FAIL:', err.message);
    failed++;
  }

  // Test 2: Driver PIN Hash Verification in DB
  try {
    console.log('\n2️⃣ [Prueba] Verificando PINs de 4 Dígitos Hasheados para Repartidores...');
    const driver1 = await prisma.user.findFirst({ where: { rol: 'REPARTIDOR' } });
    if (!driver1 || !driver1.pinHash) {
      throw new Error('Repartidor no encontrado o sin pinHash');
    }
    const isPinValid = await bcrypt.compare('1111', driver1.pinHash);
    const isWrongPinRejected = !(await bcrypt.compare('9999', driver1.pinHash));

    if (isPinValid && isWrongPinRejected) {
      console.log(`   ✅ PASS: PIN correcto (1111) aceptado y PIN incorrecto (9999) rechazado para ${driver1.nombre}.`);
      passed++;
    } else {
      throw new Error('Fallo en la validación criptográfica del PIN');
    }
  } catch (err) {
    console.log('   ❌ FAIL:', err.message);
    failed++;
  }

  // Test 3: Audit Log Verification
  try {
    console.log('\n3️⃣ [Prueba] Verificando Tabla de Auditoría (AuditLog)...');
    const auditCount = await prisma.auditLog.count();
    console.log(`   ✅ PASS: Tabla AuditLog operativa y lista (Registros actuales: ${auditCount}).`);
    passed++;
  } catch (err) {
    console.log('   ❌ FAIL:', err.message);
    failed++;
  }

  console.log('\n========================================');
  console.log(`📊 RESULTADO: ${passed} Pasadas | ${failed} Fallidas`);
  console.log('========================================\n');
}

runSecurityTests()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
