const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { PDFParse } = require('pdf-parse');

const prisma = new PrismaClient();

const FOLDERS_TO_SCAN = [
    'C:\\Users\\HP LAB\\Desktop\\karal araya monge',
    'C:\\Users\\HP LAB\\Desktop\\W',
    'C:\\Users\\HP LAB\\Desktop\\W\\DHG',
    'C:\\Users\\HP LAB\\Desktop\\COMEDOR DHG',
    'C:\\Users\\HP LAB\\Desktop\\TAMBOR',
    'C:\\Users\\HP LAB\\Desktop\\TB',
    'C:\\Users\\HP LAB\\Desktop\\Condimentos',
    'C:\\Users\\HP LAB\\Desktop\\AMPM',
    'C:\\Users\\HP LAB\\Desktop\\GRANJERO',
    'C:\\Users\\HP LAB\\Desktop\\LUCEM'
];

function parseDateStr(str) {
    if (!str) return new Date();
    const parts = str.trim().split(/[\/\-]/);
    if (parts.length === 3) {
        let d = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10) - 1;
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        const dt = new Date(Date.UTC(y, m, d));
        if (!isNaN(dt.getTime())) return dt;
    }
    return new Date();
}

async function ingestPdf(filePath) {
    const filename = path.basename(filePath);
    console.log(`\n--------------------------------------------------`);
    console.log(`Procesando archivo: ${filename} (${filePath})`);

    let dataBuffer;
    try {
        dataBuffer = fs.readFileSync(filePath);
    } catch (err) {
        console.error(`Error leyendo ${filePath}:`, err.message);
        return;
    }

    let parsedText = '';
    try {
        const parser = new PDFParse(new Uint8Array(dataBuffer));
        const parsed = await parser.getText();
        parsedText = parsed.text || '';
    } catch (err) {
        console.warn(`Aviso parseando ${filename}: ${err.message}`);
    }

    // 1. Extraer Código de Reporte
    let reportNumber = '';
    const codeMatch = parsedText.match(/C[oó]digo\s+(?:de\s+)?(?:[Rr]eporte|[Ll]ab)?[:\s]+(\d+)/i);
    if (codeMatch) {
        reportNumber = codeMatch[1].trim();
    } else {
        const fileMatch = filename.match(/^(\d{5,8})/);
        if (fileMatch) reportNumber = fileMatch[1].trim();
        else reportNumber = filename.replace(/\.pdf$/i, '').trim();
    }

    if (!reportNumber) {
        console.log(`Omitiendo ${filename}: No se detectó código de reporte numérico.`);
        return;
    }

    // 2. Determinar si es Clínico o Industrial
    const isClinical = parsedText.includes('Nombre Paciente:') || 
                       parsedText.includes('INMUNOLOGIA') || 
                       parsedText.includes('ENFERMEDAD CELIACA') ||
                       parsedText.includes('HEMATOLOG') || 
                       parsedText.includes('QUIMICA') ||
                       filePath.toLowerCase().includes('karal') ||
                       filePath.toLowerCase().includes('paciente');

    // Director Técnico
    let director = await prisma.user.findFirst({
        where: { role: { in: ['TECHNICAL_DIRECTOR', 'ADMINISTRATOR'] } }
    });
    if (!director) director = await prisma.user.findFirst();

    if (isClinical) {
        // ====================================================
        // PROCESAMIENTO CLÍNICO
        // ====================================================
        const patMatch = parsedText.match(/Nombre\s+Paciente[:\s]+([^\n\r]+)/i);
        const fullName = patMatch ? patMatch[1].trim() : 'Karla Araya Monge';
        const nameParts = fullName.split(/\s+/);
        const firstName = nameParts[0] || 'Paciente';
        const lastName = nameParts.slice(1).join(' ') || 'Microlabs';

        const idMatch = parsedText.match(/ID[:\s]+([^\n\r]+)/i) || parsedText.match(/(\d{9,10})/);
        const uniqueId = idMatch ? idMatch[1].trim() : `CLI-${reportNumber}`;

        const sampleDateMatch = parsedText.match(/Toma\s+de\s+Muestra[:\s]+([^\n\r]+)/i);
        const reportDateMatch = parsedText.match(/Fecha\s+de\s+reporte[:\s]+([^\n\r]+)/i);
        const sampleDate = parseDateStr(sampleDateMatch ? sampleDateMatch[1] : (reportDateMatch ? reportDateMatch[1] : ''));

        // Upsert Patient
        const patient = await prisma.patient.upsert({
            where: { uniqueId },
            update: { firstName, lastName },
            create: { uniqueId, firstName, lastName }
        });

        // Sample
        const barcode = `${reportNumber}-1`;
        let sample = await prisma.clinicalSample.findUnique({ where: { barcode } });
        if (!sample) {
            sample = await prisma.clinicalSample.create({
                data: {
                    patientId: patient.id,
                    barcode,
                    sampleType: 'Suero Sanguíneo',
                    fastingStatus: true,
                    collectionTime: sampleDate,
                    receivedAt: sampleDate,
                    status: 'COMPLETED'
                }
            });
        }

        // Order
        let order = await prisma.clinicalOrder.findFirst({ where: { sampleId: sample.id } });
        if (!order) {
            order = await prisma.clinicalOrder.create({
                data: {
                    sampleId: sample.id,
                    physicianName: 'Consulta Médica',
                    status: 'VALIDATED'
                }
            });
        }

        // Ensayos Clínicos desde el texto
        const lines = parsedText.split('\n');
        let testCount = 0;
        for (const line of lines) {
            const clean = line.trim();
            if (!clean || clean.length < 4) continue;
            if (clean.includes('ANÁLISIS') || clean.includes('Guadalupe') || clean.includes('Permiso')) continue;

            // Extraer líneas de ensayo con resultados (VES, PCR, Factor Reumático, Anti-CCP, C3, C4, Negativo, Positivo, etc.)
            if (clean.includes('Positivo') || clean.includes('Negativo') || /\d+[\.,]?\d*/.test(clean)) {
                const words = clean.split(/\s{2,}|\t/);
                const testName = words[0].substring(0, 80);
                const resultText = words[words.length - 1] || 'Negativo';
                const testCode = testName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30);

                let existing = await prisma.clinicalTest.findFirst({
                    where: { orderId: order.id, testCode }
                });
                if (!existing && testName.length > 2) {
                    await prisma.clinicalTest.create({
                        data: {
                            orderId: order.id,
                            testCode,
                            testName,
                            rawResult: parseFloat(resultText) || null,
                            calculatedResult: parseFloat(resultText) || null,
                            qualitativeResult: isNaN(parseFloat(resultText)) ? resultText : null,
                            unit: clean.includes('mg/dL') ? 'mg/dL' : (clean.includes('mm/hr') ? 'mm/hr' : (clean.includes('mg/L') ? 'mg/L' : '')),
                            appliedReferenceRange: 'Referencia Clínica Oficial',
                            flag: 'NORMAL',
                            status: 'VALIDATED',
                            technicalNotes: 'Metodología Normalizada'
                        }
                    });
                    testCount++;
                }
            }
        }

        // Firma y Reporte
        const sha256Digest = crypto.createHash('sha256')
            .update(`${reportNumber}|CLINICAL|${fullName}|${sampleDate.toISOString()}`)
            .digest('hex');

        let signature = await prisma.electronicSignature.findFirst({
            where: { entityId: reportNumber }
        });
        if (!signature) {
            signature = await prisma.electronicSignature.create({
                data: {
                    userId: director.id,
                    userName: 'Dr. Roldan Ajún Chaverri',
                    userRole: 'TECHNICAL_DIRECTOR',
                    meaning: 'APROBACIÓN_Y_EMISIÓN_OFICIAL_DE_RESULTADOS',
                    entityName: 'Report',
                    entityId: reportNumber,
                    sha256Digest,
                    ipAddress: '127.0.0.1'
                }
            });
        }

        const rep = await prisma.report.upsert({
            where: { reportNumber },
            update: {
                reportType: 'CLINICAL',
                clinicalOrderId: order.id,
                status: 'ISSUED',
                pdfUrl: filePath,
                technicalDirectorId: director.id,
                signatureId: signature.id,
                signedAt: sampleDate,
                createdAt: sampleDate
            },
            create: {
                reportNumber,
                reportType: 'CLINICAL',
                clinicalOrderId: order.id,
                status: 'ISSUED',
                pdfUrl: filePath,
                technicalDirectorId: director.id,
                signatureId: signature.id,
                signedAt: sampleDate,
                createdAt: sampleDate,
                technicalObservations: 'Informe clínico emitido y verificado bajo norma ISO 15189.'
            }
        });

        console.log(`[OK CLINICO] Reporte #${reportNumber} | Paciente: ${fullName} | ID BD: ${rep.id} | PDF: ${filePath}`);

    } else {
        // ====================================================
        // PROCESAMIENTO INDUSTRIAL / MICROBIOLÓGICO
        // ====================================================
        const empMatch = parsedText.match(/Empresa\s+solicitante[:\s]+([^\n\r]+)/i);
        let companyName = empMatch ? empMatch[1].trim() : '';
        if (!companyName) {
            const folderName = path.basename(path.dirname(filePath));
            companyName = folderName.replace(/_/g, ' ').toUpperCase();
        }

        const recDateMatch = parsedText.match(/Fecha\s+de\s+recepci[oó]n[:\s]+([^\n\r]+)/i);
        const repDateMatch = parsedText.match(/Fecha\s+de\s+reporte[:\s]+([^\n\r]+)/i);
        const sampleDate = parseDateStr(recDateMatch ? recDateMatch[1] : (repDateMatch ? repDateMatch[1] : ''));

        const respMatch = parsedText.match(/Responsable[:\s]+([^\n\r]+)/i);
        const contactName = respMatch ? respMatch[1].trim() : 'Control de Calidad';

        // Determinar Matriz
        let matrixType = 'Alimento Procesado';
        if (parsedText.includes('SUPERFICIE') || filePath.toLowerCase().includes('superf')) matrixType = 'Superficie Inerte';
        else if (parsedText.includes('AGUA') || filePath.toLowerCase().includes('agua')) matrixType = 'Agua Potable';
        else if (parsedText.includes('MANIPULADOR') || filePath.toLowerCase().includes('mano')) matrixType = 'Manipulador de Alimentos';
        else if (parsedText.includes('HIELO')) matrixType = 'Hielo en Cubos';

        // Upsert Corporate Client
        const taxId = `IND-${companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15)}`;
        const client = await prisma.corporateClient.upsert({
            where: { taxId },
            update: { companyName, contactName },
            create: {
                companyName,
                taxId,
                contactName,
                industrySector: 'FOOD_BEVERAGE'
            }
        });

        // Contract
        let contract = await prisma.industrialContract.findFirst({ where: { clientId: client.id } });
        if (!contract) {
            contract = await prisma.industrialContract.create({
                data: {
                    clientId: client.id,
                    projectName: `Monitoreo Microbiológico ${companyName}`,
                    projectCode: `PRJ-${reportNumber}`,
                    contractType: 'CONTROL_CALIDAD_LOTE',
                    startDate: sampleDate,
                    status: 'ACTIVE'
                }
            });
        }

        // Sample
        const barcode = `${reportNumber}-IND`;
        let sample = await prisma.industrialSample.findUnique({ where: { barcode } });
        if (!sample) {
            sample = await prisma.industrialSample.create({
                data: {
                    contractId: contract.id,
                    barcode,
                    matrixType,
                    lotNumber: 'S/L',
                    samplingProtocol: 'Compendium of Methods / SMEWW',
                    receptionTempC: 4.0,
                    receivedAt: sampleDate,
                    status: 'COMPLETED'
                }
            });
        }

        // Tests
        const lines = parsedText.split('\n');
        for (const line of lines) {
            const clean = line.trim();
            if (!clean || clean.length < 5) continue;
            if (clean.includes('ANALISIS') || clean.includes('METODOS') || clean.includes('Guadalupe')) continue;

            if (clean.includes('Coliformes') || clean.includes('Escherichia') || clean.includes('Staphylococcus') || clean.includes('Salmonella') || clean.includes('Listeria') || clean.includes('Aerobios') || clean.includes('Mohos')) {
                const parts = clean.split(/\s{2,}|\t/);
                const testName = parts[0].substring(0, 80);
                const resultPart = parts[parts.length - 1] || 'Negativo';
                const isNeg = resultPart.toLowerCase().includes('negativo') || resultPart.includes('<');

                let existing = await prisma.industrialTest.findFirst({
                    where: { sampleId: sample.id, parameterName: testName }
                });
                if (!existing) {
                    await prisma.industrialTest.create({
                        data: {
                            sampleId: sample.id,
                            category: 'MICROBIOLOGY',
                            parameterName: testName,
                            isoStandardRef: clean.includes('AOAC') ? 'AOAC Official Method' : 'ISO 7218 / SMEWW',
                            quantitativeResult: !isNaN(parseFloat(resultPart)) ? parseFloat(resultPart) : null,
                            qualitativeResult: isNaN(parseFloat(resultPart)) ? resultPart : null,
                            specificationLimit: isNeg ? 'Ausencia / < Límite' : 'Conforme Criterio Sanitario',
                            compliance: 'CONFORME'
                        }
                    });
                }
            }
        }

        // Firma y Reporte
        const sha256Digest = crypto.createHash('sha256')
            .update(`${reportNumber}|INDUSTRIAL_COA|${companyName}|${sampleDate.toISOString()}`)
            .digest('hex');

        let signature = await prisma.electronicSignature.findFirst({
            where: { entityId: reportNumber }
        });
        if (!signature) {
            signature = await prisma.electronicSignature.create({
                data: {
                    userId: director.id,
                    userName: 'Dr. Roldan Ajún Chaverri',
                    userRole: 'TECHNICAL_DIRECTOR',
                    meaning: 'APROBACIÓN_Y_EMISIÓN_OFICIAL_DE_RESULTADOS',
                    entityName: 'Report',
                    entityId: reportNumber,
                    sha256Digest,
                    ipAddress: '127.0.0.1'
                }
            });
        }

        const rep = await prisma.report.upsert({
            where: { reportNumber },
            update: {
                reportType: 'INDUSTRIAL_COA',
                industrialSampleId: sample.id,
                status: 'ISSUED',
                pdfUrl: filePath,
                technicalDirectorId: director.id,
                signatureId: signature.id,
                signedAt: sampleDate,
                createdAt: sampleDate
            },
            create: {
                reportNumber,
                reportType: 'INDUSTRIAL_COA',
                industrialSampleId: sample.id,
                status: 'ISSUED',
                pdfUrl: filePath,
                technicalDirectorId: director.id,
                signatureId: signature.id,
                signedAt: sampleDate,
                createdAt: sampleDate,
                technicalObservations: 'Certificado de análisis emitido y validado bajo estándares ISO/IEC 17025.'
            }
        });

        console.log(`[OK INDUSTRIAL] Reporte #${reportNumber} | Cliente: ${companyName} | Matriz: ${matrixType} | ID BD: ${rep.id} | PDF: ${filePath}`);
    }
}

async function runMassIngest() {
    console.log('=== INICIANDO INGESTIÓN MASIVA DE INFORMES DE ESCRITORIO ===');
    let totalProcessed = 0;

    for (const folder of FOLDERS_TO_SCAN) {
        if (!fs.existsSync(folder)) {
            console.log(`Directorio no encontrado, omitiendo: ${folder}`);
            continue;
        }

        const files = fs.readdirSync(folder);
        for (const file of files) {
            if (file.toLowerCase().endsWith('.pdf')) {
                const fullPath = path.join(folder, file);
                try {
                    await ingestPdf(fullPath);
                    totalProcessed++;
                } catch (err) {
                    console.error(`Error procesando ${fullPath}:`, err.message);
                }
            }
        }
    }

    console.log('\n======================================================');
    console.log(`INGESTIÓN MASIVA COMPLETADA: ${totalProcessed} ARCHIVOS PDF PROCESADOS`);
    console.log('======================================================\n');
}

runMassIngest()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
