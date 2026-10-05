const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function dump(f) {
    const p = 'C:\\Users\\HP LAB\\Desktop\\' + f;
    if (!fs.existsSync(p)) return;
    const dataBuffer = fs.readFileSync(p);
    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const data = await parser.getText();
    console.log('==============================================');
    console.log('FILE:', f);
    console.log('==============================================');
    console.log(data.text || data);
}

async function main() {
    for (const f of ['131442.pdf', '131443.pdf', '129811.pdf']) {
        await dump(f);
    }
}

main().catch(console.error);
