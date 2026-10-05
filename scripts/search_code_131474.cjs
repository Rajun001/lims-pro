const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Searching 131474 in database...');
  const reports = await prisma.report.findMany({
    where: {
      reportNumber: { contains: '131474' }
    },
    include: {
      clinicalOrder: { include: { sample: { include: { patient: true } }, tests: true } },
      industrialSample: { include: { contract: { include: { client: true } }, tests: true } }
    }
  });
  console.log('Reports found:', JSON.stringify(reports, null, 2));

  const samples = await prisma.clinicalSample.findMany({
    where: {
      barcode: { contains: '131474' }
    }
  });
  console.log('ClinicalSamples found:', JSON.stringify(samples, null, 2));

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { idNumber: { contains: '131474' } },
        { internalId: { contains: '131474' } }
      ]
    }
  });
  console.log('Patients found:', JSON.stringify(patients, null, 2));

  const indSamples = await prisma.industrialSample.findMany({
    where: {
      OR: [
        { barcode: { contains: '131474' } },
        { lotNumber: { contains: '131474' } }
      ]
    }
  });
  console.log('IndustrialSamples found:', JSON.stringify(indSamples, null, 2));

  // Top 10 most recent reports
  console.log('\n--- Top 10 Most Recent Reports ---');
  const recentReports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      clinicalOrder: { include: { sample: { include: { patient: true } } } },
      industrialSample: { include: { contract: { include: { client: true } } } }
    }
  });
  recentReports.forEach(r => {
    const p = r.clinicalOrder?.sample?.patient;
    const clientOrPatient = p ? `${p.firstName} ${p.lastName} (${p.internalId})` : (r.industrialSample?.contract?.client?.name || 'N/A');
    console.log(`Report: ${r.reportNumber} | Type: ${r.reportType} | Entity: ${clientOrPatient} | Created: ${r.createdAt.toISOString()}`);
  });

  // Top 10 latest patients
  console.log('\n--- Top 10 Most Recent Patients ---');
  const recentPatients = await prisma.patient.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  recentPatients.forEach(p => {
    console.log(`Patient ID: ${p.id} | InternalId: ${p.internalId} | Name: ${p.firstName} ${p.lastName} | ID/Cedula: ${p.idNumber} | Created: ${p.createdAt.toISOString()}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
