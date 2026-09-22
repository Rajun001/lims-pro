import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkStatus() {
  try {
    const counts = {
      usuarios: await prisma.user.count(),
      pacientesClinicos: await prisma.patient.count(),
      muestrasClinicas: await prisma.clinicalSample.count(),
      ordenesClinicas: await prisma.clinicalOrder.count(),
      pruebasClinicas: await prisma.clinicalTest.count(),
      reglasClinicas: await prisma.clinicalRule.count(),
      clientesCorporativos: await prisma.corporateClient.count(),
      contratosIndustriales: await prisma.industrialContract.count(),
      muestrasIndustriales: await prisma.industrialSample.count(),
      pruebasIndustriales: await prisma.industrialTest.count(),
      planesMuestreo: await prisma.samplingPlan.count(),
      estudiosVidaUtil: await prisma.shelfLifeStudy.count(),
      reportesEmitidos: await prisma.report.count(),
      qbSyncedClients: await prisma.qbSyncedClient.count(),
      equipos: await prisma.equipment.count(),
      inventario: await prisma.inventoryItem.count()
    };

    console.log("=== ESTADO ACTUAL DE LA BASE DE DATOS LIMS ===");
    console.log(JSON.stringify(counts, null, 2));

    const sampleReports = await prisma.report.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    });
    console.log("=== ÚLTIMOS REPORTES ===", JSON.stringify(sampleReports, null, 2));

    const sampleCorp = await prisma.corporateClient.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    });
    console.log("=== ÚLTIMOS CLIENTES CORPORATIVOS ===", JSON.stringify(sampleCorp, null, 2));

    const samplePatients = await prisma.patient.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    });
    console.log("=== ÚLTIMOS PACIENTES ===", JSON.stringify(samplePatients, null, 2));

  } catch (err) {
    console.error("Error al consultar DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
