const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('--- REVISANDO BASE DE DATOS LIMS (dev.db) ---');

        // Total general
        const totalReports = await prisma.report.count();
        const totalPatients = await prisma.patient.count();
        const totalCompanies = await prisma.corporateClient.count();
        const totalClinicalSamples = await prisma.clinicalSample.count();
        const totalIndustrialSamples = await prisma.industrialSample.count();
        const totalQbSynced = await prisma.qbSyncedClient.count();

        console.log(`Total Reportes en LIMS: ${totalReports}`);
        console.log(`Total Pacientes: ${totalPatients}`);
        console.log(`Total Empresas: ${totalCompanies}`);
        console.log(`Total Muestras Clínicas: ${totalClinicalSamples}`);
        console.log(`Total Muestras Industriales: ${totalIndustrialSamples}`);
        console.log(`Total Clientes Sincronizados QB: ${totalQbSynced}`);

        // Ver últimos reportes
        const latestReports = await prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                clinicalOrder: {
                    include: {
                        sample: {
                            include: { patient: true }
                        }
                    }
                },
                industrialSample: {
                    include: {
                        contract: {
                            include: { client: true }
                        }
                    }
                }
            }
        });

        console.log('\n--- ÚLTIMOS 10 REPORTES REGISTRADOS ---');
        latestReports.forEach(r => {
            const client = r.clinicalOrder?.sample?.patient?.fullName || r.industrialSample?.contract?.client?.companyName || 'Sin asignar';
            console.log(`Reporte #${r.reportNumber} | Tipo: ${r.reportType} | Cliente: ${client} | Fecha Creación: ${r.createdAt.toISOString()}`);
        });

        // Buscar reportes con fechas recientes (últimos 7 días y hoy 2026-09-23)
        const todayStart = new Date('2026-09-23T00:00:00Z');
        const todayEnd = new Date('2026-09-23T23:59:59Z');
        const todayReports = await prisma.report.findMany({
            where: {
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd
                }
            }
        });
        console.log(`\nReportes creados hoy (2026-09-23): ${todayReports.length}`);

        // Revisar últimas muestras clínicas e industriales
        const latestClinical = await prisma.clinicalSample.findMany({
            orderBy: { collectionDate: 'desc' },
            take: 5,
            include: { patient: true }
        });
        console.log('\n--- ÚLTIMAS 5 MUESTRAS CLÍNICAS (POR FECHA DE TOMA) ---');
        latestClinical.forEach(s => {
            console.log(`Muestra: ${s.sampleCode} | Paciente: ${s.patient?.fullName} | Fecha Toma: ${s.collectionDate?.toISOString()}`);
        });

        const latestIndustrial = await prisma.industrialSample.findMany({
            orderBy: { samplingDate: 'desc' },
            take: 5,
            include: { contract: { include: { client: true } } }
        });
        console.log('\n--- ÚLTIMAS 5 MUESTRAS INDUSTRIALES (POR FECHA DE MUESTREO) ---');
        latestIndustrial.forEach(s => {
            console.log(`Muestra: ${s.sampleCode} | Empresa: ${s.contract?.client?.companyName} | Fecha Muestreo: ${s.samplingDate?.toISOString()}`);
        });

        // Revisar QbSettings
        const qbSettings = await prisma.qbSettings.findFirst();
        console.log('\n--- CONFIGURACIÓN QB SYNC ---');
        console.log(qbSettings || 'No hay QbSettings configurado');

    } catch (e) {
        console.error('Error al consultar Prisma:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
