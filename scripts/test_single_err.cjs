const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const prisma = new PrismaClient();

async function testSingle() {
    const file = 'C:/Users/HP LAB/Desktop/revisar/public/Hi Drive (Clientes)/Hotel Tambor/72601.pdf';
    console.log('Testing file:', file);

    const parser = new PDFParse({ url: file });
    const res = await parser.getText();
    const fullText = res.text;

    console.log('Text length:', fullText.length);

    let refMatch = fullText.match(/C[oó]digo de reporte:\s*(\d+)/i);
    let refNumber = refMatch ? refMatch[1].trim() : null;
    console.log('refNumber:', refNumber);

    const empMatch = fullText.match(/Empresa solicitante:\s*([^\n\r]+)/i);
    let companyName = empMatch ? empMatch[1].trim() : 'Hotel Tambor';
    console.log('companyName:', companyName);

    const recMatch = fullText.match(/Fecha de recepci[oó]n:\s*([^\r\n\t]+)/i);
    const repMatch = fullText.match(/Fecha de reporte:\s*([^\r\n\t]+)/i);
    console.log('recMatch:', recMatch);
    console.log('repMatch:', repMatch);
}

testSingle().then(() => prisma.$disconnect()).catch(err => {
    console.error('ERROR DETECTADO:', err);
    prisma.$disconnect();
});
