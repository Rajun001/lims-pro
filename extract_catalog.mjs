import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('tarifario.pdf');

pdf(dataBuffer).then(function(data) {
    const text = data.text;
    const lines = text.split('\n');
    
    let catalog = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const match = line.match(/^(.+?)\s+(\d{4,5})\s*(₡|\$|Lab Internacional)?\s*([\d,.]+)?$/);
        
        if (match) {
            let name = match[1].trim();
            let code = match[2];
            let symbol = match[3] || '';
            let priceStr = match[4] || '';
            
            if (!symbol && !priceStr) {
                continue;
            }
            
            let price = priceStr.replace(/,/g, '');
            if (symbol.includes('Lab Internacional')) {
                price = 'Lab Internacional';
                symbol = '';
            }
            
            catalog.push({
                code: code,
                name: name,
                price: price,
                currency: symbol === '₡' ? 'CRC' : (symbol === '$' ? 'USD' : '')
            });
        } else {
            const fallbackMatch = line.match(/(.+)\s+(\d{4,5})\s+₡\s+([\d,.]+)/);
            if (fallbackMatch) {
                catalog.push({
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
}).catch(function(error) {
    console.error("Error parsing PDF:", error);
});
