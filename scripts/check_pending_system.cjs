const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPending() {
  try {
    console.log('========================================================');
    console.log('          ESTADO Y TAREAS PENDIENTES DEL SISTEMA LIMS   ');
    console.log('========================================================\n');

    // 1. Muestras Industriales
    const indStatus = await prisma.industrialSample.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log('1. Muestras Industriales por Estado:');
    console.log(indStatus);

    const receivedInd = await prisma.industrialSample.findMany({
      where: { status: 'RECEIVED' },
      include: { contract: { include: { client: true } }, tests: true }
    });
    console.log(`\n   -> Muestras Industriales en estado "RECEIVED" (Pendientes de proceso): ${receivedInd.length}`);
    receivedInd.forEach(s => {
      console.log(`      * Barcode: ${s.barcode} | Lote: ${s.lotNumber} | Cliente: ${s.contract?.client?.companyName} | Tests: ${s.tests.length}`);
    });

    // 2. Muestras Clínicas
    const clinStatus = await prisma.clinicalSample.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log('\n2. Muestras Clínicas por Estado:');
    console.log(clinStatus);

    const clinOrdersPending = await prisma.clinicalOrder.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log('   -> Órdenes Clínicas por Estado:', clinOrdersPending);

    const clinTestsPending = await prisma.clinicalTest.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log('   -> Tests Clínicos por Estado:', clinTestsPending);

    // 3. Reportes
    const repStatus = await prisma.report.groupBy({
      by: ['status', 'reportType'],
      _count: { id: true }
    });
    console.log('\n3. Reportes por Estado y Tipo:');
    console.log(repStatus);

    const pendingReports = await prisma.report.findMany({
      where: { status: { in: ['DRAFT', 'PENDING_SIGNATURE'] } },
      select: { id: true, reportNumber: true, reportType: true, status: true, createdAt: true }
    });
    console.log(`   -> Reportes pendientes de firma / borrador: ${pendingReports.length}`);
    pendingReports.forEach(r => {
      console.log(`      * Reporte: ${r.reportNumber} (${r.reportType}) - Estado: ${r.status}`);
    });

    // 4. Recordatorios (ReminderSchedule)
    const pendingReminders = await prisma.reminderSchedule.findMany({
      where: { status: 'PENDING' },
      orderBy: { dueDate: 'asc' }
    });
    console.log(`\n4. Recordatorios Pendientes (ReminderSchedule): ${pendingReminders.length}`);
    pendingReminders.forEach(rem => {
      console.log(`      * [${rem.priority}] ${rem.title} | Vence: ${rem.dueDate.toISOString().slice(0, 10)} | Destinatario: ${rem.recipientName} (${rem.targetAudience})`);
    });

    // 5. Estudios de Vida Útil (ShelfLifeTimepoint)
    const pendingTimepoints = await prisma.shelfLifeTimepoint.findMany({
      where: { status: { in: ['PENDING', 'SAMPLING_DUE', 'OVERDUE'] } },
      include: { study: true }
    });
    console.log(`\n5. Timepoints de Vida Útil Pendientes / Vencidos: ${pendingTimepoints.length}`);
    pendingTimepoints.forEach(tp => {
      console.log(`      * Estudio: ${tp.study.productName} (Lote: ${tp.study.lotNumber}) | Día ${tp.targetDay} | Fecha: ${tp.scheduledDate.toISOString().slice(0, 10)} | Estado: ${tp.status}`);
    });

    // 6. Equipos e Instrumentos (Calibraciones)
    const now = new Date();
    const equipments = await prisma.equipment.findMany();
    const overdueEquip = equipments.filter(e => e.nextCalibration && new Date(e.nextCalibration) < now);
    console.log(`\n6. Equipos con Calibración Vencida o Pendiente: ${overdueEquip.length}`);
    overdueEquip.forEach(eq => {
      console.log(`      * ${eq.name} (${eq.id}) | Próxima: ${eq.nextCalibration?.toISOString().slice(0, 10)} | Estado: ${eq.status}`);
    });

    // 7. CAPAs abiertas
    const openCapas = await prisma.capa.findMany({
      where: { status: 'Abierta' }
    });
    console.log(`\n7. CAPAs Abiertas: ${openCapas.length}`);
    openCapas.forEach(c => {
      console.log(`      * [${c.id}] ${c.title} (Origen: ${c.origin}) - Asignado a: ${c.assignedTo}`);
    });

    // 8. Clientes QuickBooks Sincronizados
    const qbClients = await prisma.qbSyncedClient.count();
    console.log(`\n8. Total Clientes QuickBooks Sincronizados: ${qbClients}`);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPending();
