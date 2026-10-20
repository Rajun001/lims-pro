const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const folder = 'C:\\Users\\HP LAB\\Documents\\PDFgear';
const files = [
    'AMPM - 2026-10-20 12-50-18.pdf',
    'AMPM - AGUA - 2026-10-20 12-26-40.pdf'
];

async function inspect() {
    for (const f of files) {
        const fullPath = path.join(folder, f);
        if (!fs.existsSync(fullPath)) {
            console.log('File does not exist:', fullPath);
            continue;
        }
        console.log('\n======================================================');
        console.log('FILE:', f);
        console.log('======================================================');
        const dataBuffer = fs.readFileSync(fullPath);
        const parser = new PDFParse(new Uint8Array(dataBuffer));
        const data = await parser.getText();
        console.log('Total Pages:', data.total || data.numpages || 'N/A');
        console.log('--- TEXT PREVIEW (first 2500 chars) ---');
        const text = data.text || data;
        console.log(text.substring(0, 2500));
        console.log('--- END PREVIEW ---');
    }
}

inspect().catch(err => console.error(err));
