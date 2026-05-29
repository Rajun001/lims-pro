const fs = require('fs');

const lines = fs.readFileSync('ocr.txt', 'utf8').split('\n');
const catalog = [];

for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Pattern: Name Code Symbol Price
    const match = trimmed.match(/^(.+?)\s+(\d{4,5})\s*(₡|\$)?\s*([\d,.]+)?$/);
    if (match) {
        let name = match[1].trim();
        let code = match[2];
        let price = match[4] ? match[4].replace(/,/g, '') : '';
        let catEntry = { code, name };
        if (price) catEntry.price = price;
        catalog.push(catEntry);
    }
}

if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data', { recursive: true });
}

fs.writeFileSync('src/data/cmqccr_catalog.json', JSON.stringify(catalog, null, 2));
console.log(`Generated ${catalog.length} records in src/data/cmqccr_catalog.json`);
