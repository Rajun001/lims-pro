const fs = require('fs');
const path = require('path');

function searchDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            searchDir(full);
        } else if (ent.isFile()) {
            try {
                const buf = fs.readFileSync(full);
                for (const enc of ['ascii', 'utf16le']) {
                    const target = Buffer.from('131474', enc);
                    let idx = -1;
                    while ((idx = buf.indexOf(target, idx + 1)) !== -1) {
                        console.log(`\n========================================`);
                        console.log(`File: ${full} (${enc}) at byte ${idx}`);
                        console.log(`========================================`);
                        const start = Math.max(0, idx - 500);
                        const end = Math.min(buf.length, idx + 500);
                        const slice = buf.subarray(start, end);
                        let text = '';
                        for (let i = 0; i < slice.length; i++) {
                            const b = slice[i];
                            if (b >= 32 && b <= 126) text += String.fromCharCode(b);
                            else if (b >= 160 && b <= 255) text += String.fromCharCode(b);
                            else if (b === 10 || b === 13) text += ' ';
                            else text += ' ';
                        }
                        console.log(text.replace(/\s+/g, ' '));
                    }
                }
            } catch (e) {
                // Ignore locked
            }
        }
    }
}

searchDir('C:\\quickbooks2010\\alimentos10.QBW.SearchIndex');
