const fs = require('fs');
const path = require('path');

function decodePdfString(raw) {
    if (raw.startsWith('þÿ')) {
        // UTF-16BE
        const buf = Buffer.from(raw.slice(2), 'latin1');
        return buf.swap16().toString('utf16le');
    }
    return raw;
}

function parseAcroFormFields(filePath) {
    const content = fs.readFileSync(filePath, 'latin1');
    console.log('\n======================================================');
    console.log('FILE:', path.basename(filePath));
    console.log('======================================================');

    // Each field dictionary has /T (fieldname) and /V (value)
    // Regex matching objects or field entries
    const fieldRegex = /<<[^>]*?\/T\s*\((.*?)\)[^>]*?>>/gs;
    let match;
    let count = 0;
    while ((match = fieldRegex.exec(content)) !== null) {
        const block = match[0];
        const fieldNameMatch = block.match(/\/T\s*\((.*?)\)/);
        const valMatch = block.match(/\/V\s*(?:\((.*?)\)|\/([^\s\/>]+))/s);

        const fieldName = fieldNameMatch ? decodePdfString(fieldNameMatch[1]) : 'UNKNOWN';
        let val = '';
        if (valMatch) {
            val = valMatch[1] !== undefined ? decodePdfString(valMatch[1]) : valMatch[2];
        }

        if (val && val.trim().length > 0) {
            count++;
            console.log(`[Field ${count}] ${fieldName}: ${val.trim()}`);
        }
    }

    if (count === 0) {
        // Alternative search for /T and /V pairs
        console.log('Searching via alternative /T and /V pattern...');
        const tMatches = [...content.matchAll(/\/T\s*\((.*?)\)/g)];
        const vMatches = [...content.matchAll(/\/V\s*(?:\((.*?)\)|\/([A-Za-z0-9_]+))/g)];
        console.log(`Total /T: ${tMatches.length}, Total /V: ${vMatches.length}`);
        for (let i = 0; i < Math.max(tMatches.length, vMatches.length); i++) {
            const t = tMatches[i] ? decodePdfString(tMatches[i][1]) : '-';
            const v = vMatches[i] ? (vMatches[i][1] !== undefined ? decodePdfString(vMatches[i][1]) : vMatches[i][2]) : '-';
            if (v && v.trim() && v.trim() !== '-') {
                console.log(`  T: "${t}" => V: "${v.trim()}"`);
            }
        }
    }
}

const folder = 'C:\\Users\\HP LAB\\Documents\\PDFgear';
parseAcroFormFields(path.join(folder, 'AMPM - 2026-10-13 12-49-48.pdf'));
parseAcroFormFields(path.join(folder, 'AMPM - 2026-10-20 12-50-18.pdf'));
parseAcroFormFields(path.join(folder, 'AMPM - AGUA - 2026-10-20 12-26-40.pdf'));
