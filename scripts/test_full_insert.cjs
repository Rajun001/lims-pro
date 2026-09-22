const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const prisma = new PrismaClient();

async function testFull() {
    const file = 'C:/Users/HP LAB/Desktop/revisar/public/Hi Drive (Clientes)/Hotel Tambor/72601.pdf';
    const parser = new PDFParse({ url: file });
    const res = await parser.getText();
    const fullText = res.text;

    let refMatch = fullText.match(/C[oó]digo de reporte:\s*(\d+)/i);
    let refNumber = refMatch ? refMatch[1].trim() : '72601';

    const empMatch = fullText.match(/Empresa solicitante:\s*([^\n\r]+)/i);
    let companyName = empMatch ? empMatch[1].trim() : 'Hotel Tambor';

    console.log('Inserting client for:', companyName);
    const clientTaxId = 'TAX-' + companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
    const client = await prisma.corporateClient.upsert({
        where: { taxId: clientTaxId },
        update: { companyName },
        create: { taxId: clientTaxId, companyName, industrySector: 'Alimentos y Bebidas' }
    });
    console.log('Client saved:', client.id);

    const projectCode = `PRJ-${companyName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-2026`;
    const contract = await prisma.industrialContract.upsert({
        where: { projectCode },
        update: { projectName: `Monitoreo Analítico - ${companyName}`, status: 'ACTIVE' },
        create: { clientId: client.id, projectCode, projectName: `Monitoreo Analítico - ${companyName}`, contractType: 'CONTROL_CALIDAD_LOTE', startDate: new Date(), status: 'ACTIVE' }
    });
    console.log('Contract saved:', contract.id);

    const sampleBarcode = `${refNumber}-1`;
    let sample = await prisma.industrialSample.upsert({
        where: { sampleBarcode },
        update: {},
        create: {
            contractId: contract.id,
            sampleBarcode,
            productName: 'FRUTA',
            matrixType: 'Alimento',
            condition: 'ALIMENTO',
            samplingDate: new Date(),
            receptionDate: new Date(),
            status: 'COMPLETED'
        }
    });
    console.log('Sample saved:', sample.id);

    const rep = await prisma.report.upsert({
        where: { reportNumber: String(refNumber) },
        update: { reportType: 'INDUSTRIAL_COA', industrialSampleId: sample.id, status: 'ISSUED', pdfUrl: file },
        create: { reportNumber: String(refNumber), reportType: 'INDUSTRIAL_COA', industrialSampleId: sample.id, status: 'ISSUED', pdfUrl: file }
    });
    console.log('Report saved:', rep.id);
}

testFull().then(() => prisma.$disconnect()).catch(err => {
    console.error('ERROR DETECTADO EN TEST FULL:', err);
    prisma.$disconnect();
});
