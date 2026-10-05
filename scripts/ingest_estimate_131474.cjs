const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ingestEstimate131474() {
    console.log('>>> Iniciando ingestión directa de Estimado QuickBooks 131474 en LIMS Database <<<');

    // 1. Upsert Patient
    const uniqueId = '105380673';
    const firstName = 'Patricia';
    const lastName = 'Bonilla Madrigal';
    const dob = new Date('1960-08-22');
    const gender = 'F';

    console.log(`1. Registrando Paciente: ${firstName} ${lastName} (Cédula: ${uniqueId})...`);
    const patient = await prisma.patient.upsert({
        where: { uniqueId },
        update: {
            firstName,
            lastName,
            dob,
            gender
        },
        create: {
            uniqueId,
            firstName,
            lastName,
            dob,
            gender
        }
    });
    console.log(`[OK] Paciente ID en BD: ${patient.id}`);

    // 2. Upsert Sample
    const barcode = '131474-1';
    const collectionTime = new Date('2026-09-21T08:00:00.000Z');
    const receivedAt = new Date('2026-09-21T08:30:00.000Z');

    console.log(`2. Registrando Muestra Clínica (Código: ${barcode})...`);
    let sample = await prisma.clinicalSample.findUnique({
        where: { barcode }
    });

    if (!sample) {
        sample = await prisma.clinicalSample.create({
            data: {
                patientId: patient.id,
                barcode,
                sampleType: 'Suero / Química Sanguínea',
                fastingStatus: true,
                collectionTime,
                receivedAt,
                status: 'COMPLETED'
            }
        });
    }
    console.log(`[OK] Muestra ID en BD: ${sample.id}`);

    // 3. Create Clinical Order
    console.log('3. Creando Orden Clínica...');
    let order = await prisma.clinicalOrder.findFirst({
        where: { sampleId: sample.id }
    });

    if (!order) {
        order = await prisma.clinicalOrder.create({
            data: {
                sampleId: sample.id,
                physicianName: 'Consulta Externa',
                status: 'VALIDATED'
            }
        });
    }
    console.log(`[OK] Orden Clínica ID: ${order.id}`);

    // 4. Ingest All 9 Analytical Tests
    const testDefinitions = [
        {
            testCode: 'CHOL_TOTAL',
            testName: 'Colesterol Total',
            rawResult: 247.0,
            calculatedResult: 247.0,
            unit: 'mg/dL',
            appliedReferenceRange: '< 200',
            flag: 'HIGH',
            technicalNotes: 'Metodología: NX600'
        },
        {
            testCode: 'HDL_CHOL',
            testName: 'HDL-Colesterol',
            rawResult: 67.0,
            calculatedResult: 67.0,
            unit: 'mg/dL',
            appliedReferenceRange: '> 35',
            flag: 'NORMAL',
            technicalNotes: 'Metodología: NX600'
        },
        {
            testCode: 'LDL_CHOL',
            testName: 'LDL-Colesterol',
            rawResult: 145.0,
            calculatedResult: 145.0,
            unit: 'mg/dL',
            appliedReferenceRange: '< 130',
            flag: 'HIGH',
            technicalNotes: 'Metodología: NX600'
        },
        {
            testCode: 'RATIO_LDL_HDL',
            testName: 'LDL/HDL',
            rawResult: 2.16,
            calculatedResult: 2.16,
            unit: 'Índice',
            appliedReferenceRange: '< 3.5',
            flag: 'NORMAL',
            technicalNotes: 'Cálculo de Riesgo Coronario'
        },
        {
            testCode: 'RATIO_CT_HDL',
            testName: 'FR- CT/HDL',
            rawResult: 3.69,
            calculatedResult: 3.69,
            unit: 'Índice',
            appliedReferenceRange: '< 4.5',
            flag: 'NORMAL',
            technicalNotes: 'Factor de Riesgo Castelli'
        },
        {
            testCode: 'NON_HDL_CHOL',
            testName: 'Colesterol No-HDL',
            rawResult: 180.0,
            calculatedResult: 180.0,
            unit: 'mg/dL',
            appliedReferenceRange: '< 130',
            flag: 'HIGH',
            technicalNotes: 'Evaluación de Riesgo Aterogénico'
        },
        {
            testCode: 'TRIGLYCERIDES',
            testName: 'Triglicéridos',
            rawResult: 176.0,
            calculatedResult: 176.0,
            unit: 'mg/dL',
            appliedReferenceRange: '< 150',
            flag: 'HIGH',
            technicalNotes: 'Metodología: NX600'
        },
        {
            testCode: 'VLDL_CHOL',
            testName: 'VLDL',
            rawResult: 35.2,
            calculatedResult: 35.2,
            unit: 'mg/dL',
            appliedReferenceRange: '10 - 50',
            flag: 'NORMAL',
            technicalNotes: 'Cálculo Friedewald'
        },
        {
            testCode: 'VIT_D_25OH',
            testName: 'Vitamina D, 25-OH',
            rawResult: 32.04,
            calculatedResult: 32.04,
            unit: 'ng/mL',
            appliedReferenceRange: '30.0 - 100.0 (Niveles Óptimos)',
            flag: 'NORMAL',
            technicalNotes: 'Metodología: X3 CLIA'
        }
    ];

    console.log(`4. Insertando ${testDefinitions.length} determinaciones clínicas analizadas...`);
    for (const t of testDefinitions) {
        let existingTest = await prisma.clinicalTest.findFirst({
            where: {
                orderId: order.id,
                testCode: t.testCode
            }
        });

        if (!existingTest) {
            await prisma.clinicalTest.create({
                data: {
                    orderId: order.id,
                    testCode: t.testCode,
                    testName: t.testName,
                    rawResult: t.rawResult,
                    calculatedResult: t.calculatedResult,
                    unit: t.unit,
                    appliedReferenceRange: t.appliedReferenceRange,
                    flag: t.flag,
                    status: 'VALIDATED',
                    technicalNotes: t.technicalNotes
                }
            });
            console.log(`   + [TEST] ${t.testName}: ${t.rawResult} ${t.unit} -> [${t.flag}]`);
        } else {
            console.log(`   * [TEST YA EXISTE] ${t.testName}`);
        }
    }

    // 5. Upsert Official Report
    const reportNumber = '131474';
    const pdfUrl = 'C:/lims-microlabs/scripts/131474_Patricia_Bonilla.pdf';

    console.log(`5. Emitiendo Registro Oficial de Reporte ${reportNumber}...`);
    const report = await prisma.report.upsert({
        where: { reportNumber },
        update: {
            reportType: 'CLINICAL',
            clinicalOrderId: order.id,
            status: 'ISSUED',
            pdfUrl
        },
        create: {
            reportNumber,
            reportType: 'CLINICAL',
            clinicalOrderId: order.id,
            status: 'ISSUED',
            pdfUrl
        }
    });
    console.log(`[EXITO TOTAL] Reporte oficial emitido con ID: ${report.id}`);

    // Verify insertion
    const verify = await prisma.patient.findUnique({
        where: { uniqueId },
        include: {
            samples: {
                include: {
                    orders: {
                        include: {
                            tests: true,
                            reports: true
                        }
                    }
                }
            }
        }
    });

    console.log('\n=== VERIFICACIÓN EN BASE DE DATOS LIMS ===');
    console.log(`Paciente: ${verify.firstName} ${verify.lastName} | Cédula: ${verify.uniqueId}`);
    console.log(`Total Muestras: ${verify.samples.length}`);
    console.log(`Total Ensayos Registrados: ${verify.samples[0].orders[0].tests.length}`);
    console.log(`Reporte Asociado: ${verify.samples[0].orders[0].reports[0].reportNumber} (Estado: ${verify.samples[0].orders[0].reports[0].status})`);
}

ingestEstimate131474()
    .then(() => prisma.$disconnect())
    .catch(err => {
        console.error('ERROR AL INGERIR:', err);
        prisma.$disconnect();
        process.exit(1);
    });
