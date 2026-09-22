const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function generateDesktopSummary() {
    console.log('Generando archivo Excel consolidado en el Escritorio...');

    // 1. Conteos generales
    const counts = [
        { Concepto: 'Total Informes Oficiales Registrados (Report)', Cantidad: await prisma.report.count() },
        { Concepto: 'Informes Oficiales de Alimentos / Industrial (COA)', Cantidad: await prisma.report.count({ where: { reportType: 'INDUSTRIAL_COA' } }) },
        { Concepto: 'Informes Oficiales Clínicos / Pacientes', Cantidad: await prisma.report.count({ where: { reportType: 'CLINICAL_HUMAN' } }) },
        { Concepto: 'Ensayos Analíticos Clínicos Extraídos (ClinicalTest)', Cantidad: await prisma.clinicalTest.count() },
        { Concepto: 'Muestras Biológicas Clínicas (ClinicalSample)', Cantidad: await prisma.clinicalSample.count() },
        { Concepto: 'Pacientes Registrados (Patient)', Cantidad: await prisma.patient.count() },
        { Concepto: 'Empresas / Clientes Corporativos (CorporateClient)', Cantidad: await prisma.corporateClient.count() },
        { Concepto: 'Contratos Industriales Activos (IndustrialContract)', Cantidad: await prisma.industrialContract.count() },
        { Concepto: 'Muestras Industriales Procesadas (IndustrialSample)', Cantidad: await prisma.industrialSample.count() },
        { Concepto: 'Ensayos Microbiológicos / Químicos Guardados (IndustrialTest)', Cantidad: await prisma.industrialTest.count() },
        { Concepto: 'Planes de Muestreo / Cronogramas 2026 (SamplingPlan)', Cantidad: await prisma.samplingPlan.count() },
        { Concepto: 'Puntos de Muestreo Monitoreados (SamplingPlanPoint)', Cantidad: await prisma.samplingPlanPoint.count() }
    ];

    // 2. Planes de muestreo y cronogramas
    const samplingPoints = await prisma.samplingPlanPoint.findMany({
        include: {
            plan: {
                include: {
                    contract: {
                        include: { client: true }
                    }
                }
            }
        },
        orderBy: [{ planId: 'asc' }, { id: 'asc' }]
    });

    const cronogramasRows = samplingPoints.map(sp => ({
        ID_Punto: sp.id,
        Cliente: sp.plan.contract.client.companyName,
        Plan_Muestreo: sp.plan.planName,
        Punto_de_Muestreo: sp.pointName,
        Categoria_Zona: sp.zoneCategory,
        Matriz: sp.matrixType,
        Frecuencia: sp.samplingFrequency,
        Parametros_Analiticos: sp.targetParameters,
        Normativa_Referencia: sp.isoStandardRef || 'ISO Standard'
    }));

    // 3. Clientes corporativos
    const corpClients = await prisma.corporateClient.findMany({
        include: {
            _count: {
                select: { contracts: true }
            }
        },
        orderBy: { companyName: 'asc' }
    });

    const clientsRows = corpClients.map(c => ({
        ID: c.id,
        Codigo_Tributario: c.taxId,
        Empresa: c.companyName,
        Sector_Industrial: c.industrySector,
        Contacto: c.contactName || 'N/A',
        Contratos_Activos: c._count.contracts
    }));

    // 4. Últimos reportes oficiales
    const recentReports = await prisma.report.findMany({
        take: 300,
        orderBy: { id: 'desc' }
    });

    const reportsRows = recentReports.map(r => ({
        ID: r.id,
        Numero_Reporte: r.reportNumber,
        Tipo_Reporte: r.reportType,
        Estado: r.status,
        Fecha_Emision: r.signedAt ? r.signedAt.toISOString().split('T')[0] : (r.createdAt ? r.createdAt.toISOString().split('T')[0] : 'N/A'),
        Ruta_Archivo_PDF: r.pdfUrl || 'Generado en sistema'
    }));

    // Construir libro de Excel
    const wb = XLSX.utils.book_new();

    const wsCounts = XLSX.utils.json_to_sheet(counts);
    XLSX.utils.book_append_sheet(wb, wsCounts, 'Resumen General');

    const wsCrono = XLSX.utils.json_to_sheet(cronogramasRows);
    XLSX.utils.book_append_sheet(wb, wsCrono, 'Cronogramas 2026 (169 Puntos)');

    const wsClients = XLSX.utils.json_to_sheet(clientsRows);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Empresas y Clientes');

    const wsReports = XLSX.utils.json_to_sheet(reportsRows);
    XLSX.utils.book_append_sheet(wb, wsReports, 'Reportes Oficiales');

    const targetDesktopPath = 'C:/Users/HP LAB/Desktop/RESUMEN_TRASLADO_DATOS_LIMS.xlsx';
    XLSX.writeFile(wb, targetDesktopPath);

    console.log(`\n✅ Archivo Excel generado exitosamente en el Escritorio:`);
    console.log(`   👉 ${targetDesktopPath}\n`);
}

generateDesktopSummary()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
