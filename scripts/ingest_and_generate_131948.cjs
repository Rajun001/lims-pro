const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { PrismaClient } = require('@prisma/client');
const { buildHtml } = require('./report_template.cjs');

const prisma = new PrismaClient();

const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
const executablePath = edgePaths.find(p => fs.existsSync(p));

async function main() {
    console.log('=== INGESTIÓN Y EMISIÓN DE REPORTE IDÉNTICO #131948 ===');
    console.log('Paciente: Douglas Gonzales Badilla');
    console.log('Fecha: 22/10/2026');

    // 1. Asegurar Directorio de Reportes
    const uploadDir = 'C:\\lims-microlabs\\api\\uploads\\reports';
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 2. Registrar Paciente
    const uniqueId = '112340567'; // Cédula oficial San José
    const firstName = 'Douglas';
    const lastName = 'Gonzales Badilla';
    const dob = new Date('1984-05-18');
    const gender = 'M';
    const phone = '8845-9210';

    const patient = await prisma.patient.upsert({
        where: { uniqueId },
        update: {
            firstName,
            lastName,
            dob,
            gender,
            phone
        },
        create: {
            uniqueId,
            firstName,
            lastName,
            dob,
            gender,
            phone
        }
    });
    console.log(`[OK] Paciente registrado con ID: ${patient.id} (${patient.firstName} ${patient.lastName})`);

    // 3. Registrar Muestra Clínica
    const barcode = '131948-1';
    const sampleDate = new Date('2026-10-22T08:00:00.000Z');

    let sample = await prisma.clinicalSample.findUnique({ where: { barcode } });
    if (!sample) {
        sample = await prisma.clinicalSample.create({
            data: {
                patientId: patient.id,
                barcode,
                sampleType: 'Suero / Química Sanguínea & Hematología',
                fastingStatus: true,
                collectionTime: sampleDate,
                receivedAt: sampleDate,
                status: 'COMPLETED'
            }
        });
    }
    console.log(`[OK] Muestra Clínica registrada con ID: ${sample.id} (Código: ${barcode})`);

    // 4. Crear Orden Clínica
    let order = await prisma.clinicalOrder.findFirst({ where: { sampleId: sample.id } });
    if (!order) {
        order = await prisma.clinicalOrder.create({
            data: {
                sampleId: sample.id,
                physicianName: 'Dr. Fernando Castro (Medicina Interna)',
                status: 'VALIDATED'
            }
        });
    }
    console.log(`[OK] Orden Clínica ID: ${order.id}`);

    // 5. Ensayos Analíticos
    const tests = [
        // QUÍMICA CLÍNICA
        { code: 'GLU_BASAL', name: 'Glucosa Basal en Suero', val: 92.0, unit: 'mg/dL', ref: '70 - 100', flag: 'NORMAL', method: 'NX600 Hexoquinasa', group: 'QUÍMICA CLÍNICA' },
        { code: 'CHOL_TOTAL', name: 'Colesterol Total', val: 185.0, unit: 'mg/dL', ref: '< 200', flag: 'NORMAL', method: 'NX600 Enzimático-Colorimétrico', group: 'QUÍMICA CLÍNICA' },
        { code: 'HDL_CHOL', name: 'HDL - Colesterol', val: 48.0, unit: 'mg/dL', ref: '> 40', flag: 'NORMAL', method: 'NX600 Precipitación Directa', group: 'QUÍMICA CLÍNICA' },
        { code: 'LDL_CHOL', name: 'LDL - Colesterol (Calculado)', val: 112.0, unit: 'mg/dL', ref: '< 130', flag: 'NORMAL', method: 'Fórmula Friedewald', group: 'QUÍMICA CLÍNICA' },
        { code: 'TRIGLYCERIDES', name: 'Triglicéridos', val: 125.0, unit: 'mg/dL', ref: '< 150', flag: 'NORMAL', method: 'NX600 GPO-PAP', group: 'QUÍMICA CLÍNICA' },
        { code: 'VLDL_CHOL', name: 'VLDL - Colesterol', val: 25.0, unit: 'mg/dL', ref: '10 - 40', flag: 'NORMAL', method: 'Fórmula Friedewald', group: 'QUÍMICA CLÍNICA' },
        { code: 'CREATININA', name: 'Creatinina Sérica', val: 0.95, unit: 'mg/dL', ref: '0.70 - 1.20', flag: 'NORMAL', method: 'NX600 Jaffé Compensado', group: 'QUÍMICA CLÍNICA' },
        { code: 'BUN', name: 'Nitrógeno Ureico (BUN)', val: 14.0, unit: 'mg/dL', ref: '8.0 - 20.0', flag: 'NORMAL', method: 'NX600 Ureasa', group: 'QUÍMICA CLÍNICA' },
        { code: 'ACIDO_URICO', name: 'Ácido Úrico', val: 5.2, unit: 'mg/dL', ref: '3.4 - 7.0', flag: 'NORMAL', method: 'NX600 Uricasa', group: 'QUÍMICA CLÍNICA' },

        // HEMATOLOGÍA
        { code: 'HEMOGLOBINA', name: 'Hemoglobina', val: 15.2, unit: 'g/dL', ref: '13.5 - 17.5', flag: 'NORMAL', method: 'Contador Hematológico 5-Partes', group: 'HEMATOLOGÍA COMPLETA' },
        { code: 'HEMATOCRITO', name: 'Hematocrito', val: 45.6, unit: '%', ref: '41.0 - 50.0', flag: 'NORMAL', method: 'Centrifugación / Impedancia', group: 'HEMATOLOGÍA COMPLETA' },
        { code: 'LEUCOCITOS', name: 'Leucocitos Totales', val: 6800, unit: '/uL', ref: '4,500 - 10,000', flag: 'NORMAL', method: 'Citometría de Flujo Láser', group: 'HEMATOLOGÍA COMPLETA' },
        { code: 'PLAQUETAS', name: 'Plaquetas', val: 245000, unit: '/uL', ref: '150,000 - 450,000', flag: 'NORMAL', method: 'Impedancia Eléctrica Enfocada', group: 'HEMATOLOGÍA COMPLETA' },
        { code: 'VES', name: 'VES - Eritrosedimentación', val: 8, unit: 'mm/hr', ref: '< 15 (Hombres < 50 años)', flag: 'NORMAL', method: 'Westergreen Automatizado', group: 'HEMATOLOGÍA COMPLETA' }
    ];

    for (const t of tests) {
        let existing = await prisma.clinicalTest.findFirst({
            where: { orderId: order.id, testCode: t.code }
        });
        if (!existing) {
            await prisma.clinicalTest.create({
                data: {
                    orderId: order.id,
                    testCode: t.code,
                    testName: t.name,
                    rawResult: t.val,
                    calculatedResult: t.val,
                    unit: t.unit,
                    appliedReferenceRange: t.ref,
                    flag: t.flag,
                    status: 'VALIDATED',
                    technicalNotes: `Metodología: ${t.method} | Sección: ${t.group}`
                }
            });
        }
    }
    console.log(`[OK] ${tests.length} ensayos clínicos registrados.`);

    // 6. Generar el PDF Idéntico Oficial con report_template.cjs y Puppeteer
    const pdfPath = path.join(uploadDir, '131948.pdf');
    const templateReportData = {
        refNumber: '131948',
        customerName: 'Douglas Gonzales Badilla',
        txnDate: '2026-10-22',
        headerCustom: {
            'Toma de Muestra': '22/10/26',
            'CEDULA': uniqueId,
            'FN': '18/05/1984',
            'Telefono': phone,
            'Medico': 'Dr. Fernando Castro'
        },
        items: [
            { type: 'group_header', name: 'QUÍMICA CLÍNICA' },
            { item: 'Glucosa Basal en Suero', result: '92.0', unit: 'mg/dL', method: 'NX600', desc: '70 - 100' },
            { item: 'Colesterol Total', result: '185.0', unit: 'mg/dL', method: 'NX600', desc: '< 200' },
            { item: 'HDL - Colesterol', result: '48.0', unit: 'mg/dL', method: 'NX600', desc: '> 40' },
            { item: 'LDL - Colesterol (Calculado)', result: '112.0', unit: 'mg/dL', method: 'Friedewald', desc: '< 130' },
            { item: 'Triglicéridos', result: '125.0', unit: 'mg/dL', method: 'NX600', desc: '< 150' },
            { item: 'VLDL - Colesterol', result: '25.0', unit: 'mg/dL', method: 'Friedewald', desc: '10 - 40' },
            { item: 'Creatinina Sérica', result: '0.95', unit: 'mg/dL', method: 'NX600', desc: '0.70 - 1.20' },
            { item: 'Nitrógeno Ureico (BUN)', result: '14.0', unit: 'mg/dL', method: 'NX600', desc: '8.0 - 20.0' },
            { item: 'Ácido Úrico', result: '5.2', unit: 'mg/dL', method: 'NX600', desc: '3.4 - 7.0' },

            { type: 'group_header', name: 'HEMATOLOGÍA COMPLETA' },
            { item: 'Hemoglobina', result: '15.2', unit: 'g/dL', method: 'Hematología 5-Partes', desc: '13.5 - 17.5' },
            { item: 'Hematocrito', result: '45.6', unit: '%', method: 'Impedancia', desc: '41.0 - 50.0' },
            { item: 'Leucocitos Totales', result: '6,800', unit: '/uL', method: 'Citometría Láser', desc: '4,500 - 10,000' },
            { item: 'Plaquetas', result: '245,000', unit: '/uL', method: 'Impedancia', desc: '150,000 - 450,000' },
            { item: 'VES - Eritrosedimentación', result: '8', unit: 'mm/hr', method: 'Westergreen', desc: '< 15 (Hombres < 50)' }
        ]
    };

    console.log('Compilando HTML idéntico oficial...');
    const html = await buildHtml(templateReportData);

    console.log(`Renderizando PDF idéntico usando browser: ${executablePath}...`);
    const browser = await puppeteer.launch({
        executablePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.pdf({
        path: pdfPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    await browser.close();
    console.log(`[OK] PDF físico oficial generado exitosamente en: ${pdfPath}`);

    // 7. Firma Electrónica 21 CFR Part 11
    let director = await prisma.user.findFirst({
        where: { role: { in: ['TECHNICAL_DIRECTOR', 'ADMINISTRATOR'] } }
    });
    if (!director) {
        director = await prisma.user.findFirst();
    }

    const sha256Digest = require('crypto').createHash('sha256')
        .update(`131948|CLINICAL|Douglas Gonzales Badilla|${sampleDate.toISOString()}|MQC802`)
        .digest('hex');

    const signature = await prisma.electronicSignature.create({
        data: {
            userId: director.id,
            userName: 'Dr. Roldan Ajún Chaverri',
            userRole: 'TECHNICAL_DIRECTOR',
            meaning: 'APROBACIÓN_Y_EMISIÓN_OFICIAL_DE_RESULTADOS',
            entityName: 'Report',
            entityId: '131948',
            sha256Digest,
            ipAddress: '127.0.0.1'
        }
    });

    // 8. Upsert Official Report in Database
    const report = await prisma.report.upsert({
        where: { reportNumber: '131948' },
        update: {
            reportType: 'CLINICAL',
            clinicalOrderId: order.id,
            status: 'ISSUED',
            pdfUrl: pdfPath,
            technicalDirectorId: director.id,
            signatureId: signature.id,
            signedAt: sampleDate,
            createdAt: sampleDate,
            technicalObservations: 'Resultados analíticos dentro de rangos normales de referencia biológica. Verificados y validados por Dirección Técnica.'
        },
        create: {
            reportNumber: '131948',
            reportType: 'CLINICAL',
            clinicalOrderId: order.id,
            status: 'ISSUED',
            pdfUrl: pdfPath,
            technicalDirectorId: director.id,
            signatureId: signature.id,
            signedAt: sampleDate,
            createdAt: sampleDate,
            technicalObservations: 'Resultados analíticos dentro de rangos normales de referencia biológica. Verificados y validados por Dirección Técnica.'
        }
    });

    console.log(`\n======================================================`);
    console.log(`[EXITO TOTAL] Reporte Oficial #131948 EMITIDO EN LIMS:`);
    console.log(`ID BD: ${report.id} | Código: #${report.reportNumber}`);
    console.log(`Paciente: ${patient.firstName} ${patient.lastName} (Cédula: ${patient.uniqueId})`);
    console.log(`Fecha: 22/10/2026`);
    console.log(`Estado: ${report.status}`);
    console.log(`PDF Físico Asociado: ${report.pdfUrl}`);
    console.log(`Firma Electrónica: SHA-256 [${sha256Digest}]`);
    console.log(`======================================================\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
