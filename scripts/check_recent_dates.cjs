const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecent() {
    try {
        console.log('--- REVISIÓN DETALLADA DE FECHAS EN LIMS (dev.db) ---');

        const latestReport = await prisma.report.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        console.log('Último Report (createdAt):', latestReport?.createdAt, 'ReportNumber:', latestReport?.reportNumber);

        const latestSignedReport = await prisma.report.findFirst({
            where: { signedAt: { not: null } },
            orderBy: { signedAt: 'desc' }
        });
        console.log('Último Report (signedAt):', latestSignedReport?.signedAt, 'ReportNumber:', latestSignedReport?.reportNumber);

        const latestOrder = await prisma.clinicalOrder.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        console.log('Última ClinicalOrder (createdAt):', latestOrder?.createdAt, 'OrderNumber:', latestOrder?.orderNumber);

        const latestSample = await prisma.industrialSample.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        console.log('Última IndustrialSample (createdAt):', latestSample?.createdAt, 'SampleCode:', latestSample?.sampleCode, 'SamplingDate:', latestSample?.samplingDate);

        const latestPatient = await prisma.patient.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        console.log('Último Patient (createdAt):', latestPatient?.createdAt, 'Name:', latestPatient?.fullName);

        const latestQbSync = await prisma.qbSyncedClient.findFirst({
            orderBy: { lastSyncAt: 'desc' }
        });
        console.log('Último QbSyncedClient (lastSyncAt):', latestQbSync?.lastSyncAt, 'Name:', latestQbSync?.clientName);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecent();
