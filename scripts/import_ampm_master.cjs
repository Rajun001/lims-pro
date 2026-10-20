const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('===============================================================');
    console.log('  IMPORTACION MAESTRA DE CLIENTE Y MUESTREOS: INVERSIONES AMPM');
    console.log('===============================================================\n');

    // 1. Cliente Corporativo AMPM
    console.log('1. Verificando Cliente Corporativo AMPM...');
    const client = await prisma.corporateClient.upsert({
        where: { taxId: 'TAX-INVERSIONESAMPM' },
        update: {
            companyName: 'Inversiones AMPM S.A.',
            industrySector: 'Cadena de Tiendas de Conveniencia / Retail',
            contactName: 'Alejandro Calderón / Marilim Rodríguez',
            email: 'servicioalcliente@ampm.co.cr',
            phone: '2283-0000',
            address: 'San José, Costa Rica'
        },
        create: {
            taxId: 'TAX-INVERSIONESAMPM',
            companyName: 'Inversiones AMPM S.A.',
            industrySector: 'Cadena de Tiendas de Conveniencia / Retail',
            contactName: 'Alejandro Calderón / Marilim Rodríguez',
            email: 'servicioalcliente@ampm.co.cr',
            phone: '2283-0000',
            address: 'San José, Costa Rica'
        }
    });
    console.log(`[OK] Cliente ID ${client.id}: ${client.companyName}`);

    // 2. Contrato Industrial
    console.log('\n2. Creando Contrato Industrial PRJ-AMPM-CRONO-2026...');
    const contract = await prisma.industrialContract.upsert({
        where: { projectCode: 'PRJ-AMPM-CRONO-2026' },
        update: {
            projectName: 'Plan Maestro de Vigilancia Microbiológica y Calidad de Agua AMPM 2026',
            status: 'ACTIVE'
        },
        create: {
            clientId: client.id,
            projectCode: 'PRJ-AMPM-CRONO-2026',
            projectName: 'Plan Maestro de Vigilancia Microbiológica y Calidad de Agua AMPM 2026',
            contractType: 'PLAN_MUESTREO_PERSONALIZADO',
            startDate: new Date('2026-01-01T00:00:00.000Z'),
            status: 'ACTIVE'
        }
    });
    console.log(`[OK] Contrato ID ${contract.id}: ${contract.projectName}`);

    // 3. Planes de Muestreo
    console.log('\n3. Creando Planes de Muestreo (Superficies/Manipuladores y Agua)...');
    let planSuperficies = await prisma.samplingPlan.findFirst({
        where: { contractId: contract.id, planName: 'Vigilancia Microbiológica Superficies y Manipuladores AMPM 2026' }
    });
    if (!planSuperficies) {
        planSuperficies = await prisma.samplingPlan.create({
            data: {
                contractId: contract.id,
                planName: 'Vigilancia Microbiológica Superficies y Manipuladores AMPM 2026',
                industrySector: 'RESTO_BAR',
                profileType: 'EXISTING_PLAN_MAPPED',
                frequency: 'MENSUAL',
                status: 'ACTIVE'
            }
        });
    }

    let planAgua = await prisma.samplingPlan.findFirst({
        where: { contractId: contract.id, planName: 'Control Físico-Químico y Bacteriológico de Agua Potable AMPM 2026' }
    });
    if (!planAgua) {
        planAgua = await prisma.samplingPlan.create({
            data: {
                contractId: contract.id,
                planName: 'Control Físico-Químico y Bacteriológico de Agua Potable AMPM 2026',
                industrySector: 'RESTO_BAR',
                profileType: 'EXISTING_PLAN_MAPPED',
                frequency: 'MENSUAL',
                status: 'ACTIVE'
            }
        });
    }
    console.log(`[OK] Plan Superficies ID: ${planSuperficies.id}`);
    console.log(`[OK] Plan Agua ID: ${planAgua.id}`);

    // 4. Cargar sucursales de AMPM desde Excel si está disponible
    const excelPath = 'C:/Users/HP LAB/Desktop/revisar/public/Laboratorio/Empresas No Nube/AM - PM/DIRECCIONES - ACTUALIZADAS - AMPM (22.04.2019).xlsx';
    if (fs.existsSync(excelPath)) {
        console.log('\n4. Leyendo catálogo oficial de 83 sucursales desde Excel...');
        const wb = XLSX.readFile(excelPath);
        const ws = wb.Sheets['LOCALES'] || wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Limpiar puntos previos para regeneración limpia
        await prisma.samplingPlanPoint.deleteMany({ where: { planId: planSuperficies.id } });
        await prisma.samplingPlanPoint.deleteMany({ where: { planId: planAgua.id } });

        let countAgua = 0;
        let countSup = 0;

        for (let r = 2; r < rows.length; r++) {
            const row = rows[r];
            if (!row || !row[1]) continue;
            const idSucursal = row[0] ? String(row[0]).trim() : String(r);
            const nombreSucursal = String(row[1]).trim();
            const direccion = row[4] ? String(row[4]).trim() : '';
            const email = row[3] ? String(row[3]).trim() : '';

            // Punto de Agua
            await prisma.samplingPlanPoint.create({
                data: {
                    planId: planAgua.id,
                    pointName: `AMPM ${nombreSucursal} (Local #${idSucursal}) - Agua de Red & Hielo`,
                    zoneCategory: 'AGUA_POTABLE',
                    matrixType: 'Agua Potable',
                    samplingFrequency: 'MENSUAL',
                    targetParameters: JSON.stringify(['Coliformes Fecales', 'Escherichia coli', 'Cloro Libre Residual']),
                    isoStandardRef: 'Decreto Ejecutivo 38924-S'
                }
            });
            countAgua++;

            // Punto de Superficie / Manipulador
            await prisma.samplingPlanPoint.create({
                data: {
                    planId: planSuperficies.id,
                    pointName: `AMPM ${nombreSucursal} (Local #${idSucursal}) - Manipuladores y Equipos Preparación`,
                    zoneCategory: 'SUPERFICIE_CONTACTO',
                    matrixType: 'Hisopado Superficie / Manos',
                    samplingFrequency: 'MENSUAL',
                    targetParameters: JSON.stringify(['Recuento Aerobios Mesófilos', 'Escherichia coli', 'Staphylococcus aureus']),
                    isoStandardRef: 'ISO 18593'
                }
            });
            countSup++;
        }
        console.log(`[OK] Puntos de control registrados: ${countAgua} de Agua y ${countSup} de Superficies.`);
    }

    // 5. Ingestar las Órdenes de Muestreo de Octubre 2026 (extraídas de los PDF interactivos de PDFgear)
    console.log('\n5. Ingestando muestras reales del 20 y 13 de Octubre 2026...');

    const sampleOrders = [
        // 20 de Octubre 2026 - Yoses
        {
            barcode: 'AMPM-20261020-001-AGUA',
            matrixType: 'Agua Potable',
            lotNumber: 'LOTE-YOSES-20261020',
            samplingProtocol: 'Decreto 38924-S / NCG',
            receptionTempC: 4.8,
            receivedAt: new Date('2026-10-20T12:50:00Z'),
            status: 'RECEIVED',
            tests: [
                { category: 'MICROBIOLOGICAL', parameterName: 'Coliformes Fecales (CF)', isoStandardRef: 'ISO 9308-1', quantitativeResult: 0, qualitativeResult: '<1 NMP/100mL' },
                { category: 'MICROBIOLOGICAL', parameterName: 'Escherichia coli (EC)', isoStandardRef: 'ISO 9308-1', quantitativeResult: 0, qualitativeResult: 'AUSENCIA/100mL' },
                { category: 'PHYSICOCHEMICAL', parameterName: 'Cloro Libre Residual', isoStandardRef: 'SM 4500-Cl G', quantitativeResult: 0.65, qualitativeResult: '0.65 mg/L Cl2 (En Rango)' }
            ]
        },
        {
            barcode: 'AMPM-20261020-002-MANOS',
            matrixType: 'Hisopado Manos Manipuladores',
            lotNumber: 'MANOS-YOSES-20261020',
            samplingProtocol: 'ISO 18593',
            receptionTempC: 4.5,
            receivedAt: new Date('2026-10-20T12:50:00Z'),
            status: 'RECEIVED',
            tests: [
                { category: 'MICROBIOLOGICAL', parameterName: 'Escherichia coli (EC)', isoStandardRef: 'ISO 16649-2', quantitativeResult: 0, qualitativeResult: '<10 UFC/mano' },
                { category: 'MICROBIOLOGICAL', parameterName: 'Staphylococcus aureus (STA)', isoStandardRef: 'ISO 6888-1', quantitativeResult: 0, qualitativeResult: '<10 UFC/mano' }
            ]
        },
        {
            barcode: 'AMPM-20261020-003-CUCHILLO',
            matrixType: 'Hisopado Superficie Inerte (Cuchillo Panadería)',
            lotNumber: 'SUP-PAN-YOSES-20261020',
            samplingProtocol: 'ISO 18593',
            receptionTempC: 4.6,
            receivedAt: new Date('2026-10-20T12:50:00Z'),
            status: 'RECEIVED',
            tests: [
                { category: 'MICROBIOLOGICAL', parameterName: 'Recuento Total Aeróbico (RTA)', isoStandardRef: 'ISO 4833-1', quantitativeResult: 15, qualitativeResult: '15 UFC/cm²' },
                { category: 'MICROBIOLOGICAL', parameterName: 'Escherichia coli (EC)', isoStandardRef: 'ISO 16649-2', quantitativeResult: 0, qualitativeResult: 'AUSENCIA/50cm²' }
            ]
        },

        // 20 de Octubre 2026 - Coyol
        {
            barcode: 'AMPM-20261020-004-COYOL-AGUA',
            matrixType: 'Agua Potable',
            lotNumber: 'LOTE-COYOL-20261020',
            samplingProtocol: 'Decreto 38924-S / NCG',
            receptionTempC: 5.1,
            receivedAt: new Date('2026-10-20T12:26:00Z'),
            status: 'RECEIVED',
            tests: [
                { category: 'MICROBIOLOGICAL', parameterName: 'Coliformes Fecales (CF)', isoStandardRef: 'ISO 9308-1', quantitativeResult: 0, qualitativeResult: '<1 NMP/100mL' },
                { category: 'MICROBIOLOGICAL', parameterName: 'Escherichia coli (EC)', isoStandardRef: 'ISO 9308-1', quantitativeResult: 0, qualitativeResult: 'AUSENCIA/100mL' },
                { category: 'PHYSICOCHEMICAL', parameterName: 'Cloro Libre Residual', isoStandardRef: 'SM 4500-Cl G', quantitativeResult: 0.50, qualitativeResult: '0.50 mg/L Cl2 (En Rango)' }
            ]
        },

        // 13 de Octubre 2026 - Logic Park
        {
            barcode: 'AMPM-20261013-005-LOGIC-AGUA',
            matrixType: 'Agua Potable',
            lotNumber: 'LOTE-LOGIC-20261013',
            samplingProtocol: 'Decreto 38924-S / NCG',
            receptionTempC: 4.2,
            receivedAt: new Date('2026-10-13T12:49:00Z'),
            status: 'COMPLETED',
            tests: [
                { category: 'MICROBIOLOGICAL', parameterName: 'Coliformes Fecales (CF)', isoStandardRef: 'ISO 9308-1', quantitativeResult: 0, qualitativeResult: '0 NMP/100mL (CONFORME)' },
                { category: 'MICROBIOLOGICAL', parameterName: 'Escherichia coli (EC)', isoStandardRef: 'ISO 9308-1', quantitativeResult: 0, qualitativeResult: 'AUSENCIA/100mL (CONFORME)' },
                { category: 'PHYSICOCHEMICAL', parameterName: 'Cloro Libre Residual', isoStandardRef: 'SM 4500-Cl G', quantitativeResult: 0.80, qualitativeResult: '0.80 mg/L Cl2 (CONFORME)' }
            ]
        },
        {
            barcode: 'AMPM-20261013-006-LOGIC-MANOS',
            matrixType: 'Hisopado Manos Manipuladores',
            lotNumber: 'MANOS-LOGIC-20261013',
            samplingProtocol: 'ISO 18593',
            receptionTempC: 4.2,
            receivedAt: new Date('2026-10-13T12:49:00Z'),
            status: 'COMPLETED',
            tests: [
                { category: 'MICROBIOLOGICAL', parameterName: 'Escherichia coli (EC)', isoStandardRef: 'ISO 16649-2', quantitativeResult: 0, qualitativeResult: '<10 UFC/mano (CONFORME)' },
                { category: 'MICROBIOLOGICAL', parameterName: 'Staphylococcus aureus (STA)', isoStandardRef: 'ISO 6888-1', quantitativeResult: 0, qualitativeResult: '<10 UFC/mano (CONFORME)' }
            ]
        },
        {
            barcode: 'AMPM-20261013-007-LOGIC-CONT',
            matrixType: 'Hisopado Superficie Inerte (Contenedor plástico)',
            lotNumber: 'SUP-CONT-LOGIC-20261013',
            samplingProtocol: 'ISO 18593',
            receptionTempC: 4.4,
            receivedAt: new Date('2026-10-13T12:49:00Z'),
            status: 'COMPLETED',
            tests: [
                { category: 'MICROBIOLOGICAL', parameterName: 'Recuento Total Aeróbico (RTA)', isoStandardRef: 'ISO 4833-1', quantitativeResult: 20, qualitativeResult: '20 UFC/cm² (CONFORME)' },
                { category: 'MICROBIOLOGICAL', parameterName: 'Escherichia coli (EC)', isoStandardRef: 'ISO 16649-2', quantitativeResult: 0, qualitativeResult: 'AUSENCIA/50cm² (CONFORME)' }
            ]
        }
    ];

    let insertedCount = 0;
    for (const s of sampleOrders) {
        const sample = await prisma.industrialSample.upsert({
            where: { barcode: s.barcode },
            update: {
                matrixType: s.matrixType,
                lotNumber: s.lotNumber,
                samplingProtocol: s.samplingProtocol,
                receptionTempC: s.receptionTempC,
                receivedAt: s.receivedAt,
                status: s.status
            },
            create: {
                contractId: contract.id,
                barcode: s.barcode,
                matrixType: s.matrixType,
                lotNumber: s.lotNumber,
                samplingProtocol: s.samplingProtocol,
                receptionTempC: s.receptionTempC,
                receivedAt: s.receivedAt,
                status: s.status
            }
        });

        // Insertar análisis si no existen
        await prisma.industrialTest.deleteMany({ where: { sampleId: sample.id } });
        for (const t of s.tests) {
            await prisma.industrialTest.create({
                data: {
                    sampleId: sample.id,
                    category: t.category,
                    parameterName: t.parameterName,
                    isoStandardRef: t.isoStandardRef,
                    quantitativeResult: t.quantitativeResult,
                    qualitativeResult: t.qualitativeResult
                }
            });
        }
        insertedCount++;
        console.log(`  -> Muestra registrada [${sample.barcode}] - ${sample.matrixType} (${s.tests.length} análisis vinculados)`);
    }

    console.log(`\n[EXITO TOTAL] Se registraron ${insertedCount} muestras industriales de AMPM con sus perfiles de ensayo completos.`);

    // Resumen final de la base de datos
    const totalSamples = await prisma.industrialSample.count();
    const totalTests = await prisma.industrialTest.count();
    const totalPoints = await prisma.samplingPlanPoint.count();
    console.log('\n--- ESTADISTICAS ACTUALES LIMS-PRO ---');
    console.log(`Total Muestras Industriales: ${totalSamples}`);
    console.log(`Total Ensayos Industriales: ${totalTests}`);
    console.log(`Total Puntos de Planes de Muestreo: ${totalPoints}`);
    console.log('---------------------------------------\n');
}

main()
    .catch(e => {
        console.error('Error al importar:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
