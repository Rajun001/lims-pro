const fs = require('fs');

const text = fs.readFileSync('ocr.txt', 'utf-8');
const lines = text.split('\n');

let catalog = [];
let currentCategory = "General";

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Regex to match a test line: (Name) (Code: 4-5 digits) (Currency Symbol/Text) (Price)
    const match = line.match(/^(.+?)\s+(\d{4,5})\s*(₡|\$|Lab Internacional)?\s*([\d,.]+)?$/);
    
    if (match) {
        let name = match[1].trim();
        let code = match[2];
        let symbol = match[3] || '';
        let priceStr = match[4] || '';
        
        if (!symbol && !priceStr) {
            currentCategory = name;
            continue;
        }
        
        let price = priceStr.replace(/,/g, '');
        if (symbol.includes('Lab Internacional')) {
            price = 'Lab Internacional';
            symbol = '';
        }
        
        catalog.push({
            category: currentCategory,
            code: code,
            name: name,
            price: price,
            currency: symbol === '₡' ? 'CRC' : (symbol === '$' ? 'USD' : '')
        });
    } else {
        const fallbackMatch = line.match(/(.+)\s+(\d{4,5})\s+₡\s+([\d,.]+)/);
        if (fallbackMatch) {
            catalog.push({
                category: currentCategory,
                code: fallbackMatch[2],
                name: fallbackMatch[1].trim(),
                price: fallbackMatch[3].replace(/,/g, ''),
                currency: 'CRC'
            });
        }
    }
}

if (!fs.existsSync('./src/data')) {
    fs.mkdirSync('./src/data', { recursive: true });
}

fs.writeFileSync('./src/data/cmqccr_catalog.json', JSON.stringify(catalog, null, 2));
console.log(`Extracted ${catalog.length} tests into src/data/cmqccr_catalog.json`);
