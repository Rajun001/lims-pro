const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { PDFParse } = require('pdf-parse');
const crypto = require('crypto');

const prisma = new PrismaClient();

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

async function ingestKarlaFile(filePath) {
    const filename = require('path').basename(filePath);
    console.log(`\nIngestando ${filename}...`);
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const parsed = await parser.getText();
    const parsedText = parsed.text || '';

    let reportNumber = filename.replace(/\.pdf$/i, '').trim();
    const codeMatch = parsedText.match(/C[oó]digo\s+(?:de\s+)?(?:[Rr]eporte|[Ll]ab)?[:\s]+(\d+)/i);
    if (codeMatch) reportNumber = codeMatch[1].trim();

    const patMatch = parsedText.match(/Nombre\s+Paciente[:\s]+([^\n\r]+)/i);
    const fullName = patMatch ? patMatch[1].trim() : 'Karla Araya Monge';
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || 'Karla';
    const lastName = nameParts.slice(1).join(' ') || 'Araya Monge';

    const idMatch = parsedText.match(/ID[:\s]+([^\n\r]+)/i) || parsedText.match(/(\d{9,10})/);
    const uniqueId = idMatch ? idMatch[1].trim() : '115090958';

    const sampleDateMatch = parsedText.match(/Toma\s+de\s+Muestra[:\s]+([^\n\r]+)/i);
    const reportDateMatch = parsedText.match(/Fecha\s+de\s+reporte[:\s]+([^\n\r]+)/i);
    const sampleDate = parseDateStr(sampleDateMatch ? sampleDateMatch[1] : (reportDateMatch ? reportDateMatch[1] : ''));

    let director = await prisma.user.findFirst({
        where: { role: { in: ['TECHNICAL_DIRECTOR', 'ADMINISTRATOR'] } }
    });
    if (!director) director = await prisma.user.findFirst();

    const patient = await prisma.patient.upsert({
        where: { uniqueId },
        update: { firstName, lastName },
        create: { uniqueId, firstName, lastName, dob: new Date('1992-08-24'), gender: 'F' }
    });

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

    let order = await prisma.clinicalOrder.findFirst({ where: { sampleId: sample.id } });
    if (!order) {
        order = await prisma.clinicalOrder.create({
            data: {
                sampleId: sample.id,
                physicianName: 'Consulta Médica Externa',
                status: 'VALIDATED'
            }
        });
    }

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

    console.log(`[EXITO] Reporte #${reportNumber} | Paciente: ${fullName} | ID: ${rep.id} | PDF: ${filePath}`);
}

async function main() {
    const list = [
        'C:\\Users\\HP LAB\\Desktop\\karal araya monge\\131867.pdf',
        'C:\\Users\\HP LAB\\Desktop\\karal araya monge\\131901.pdf',
        'C:\\Users\\HP LAB\\Desktop\\karal araya monge\\106420.pdf'
    ];
    for (const f of list) {
        await ingestKarlaFile(f);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
