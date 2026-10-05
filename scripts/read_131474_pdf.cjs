const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
    const filePath = 'C:\\lims-microlabs\\scripts\\131474_Patricia_Bonilla.pdf';
    console.log('Leyendo:', filePath);
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const data = await parser.getText();
    console.log('====================================================');
    console.log('CONTENIDO EXTRAÍDO DIRECTAMENTE DE QUICKBOOKS (131474):');
    console.log('====================================================');
    console.log(data.text || data);
}

main().catch(console.error);
