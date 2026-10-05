const fs = require('fs');

const f = 'C:\\quickbooks2010\\alimentos10.QBW.SearchIndex\\_l7t.cfx';
console.log(`Checking ${f}...`);
try {
    const fd = fs.openSync(f, 'r');
    const stat = fs.fstatSync(fd);
    console.log(`File size: ${stat.size} bytes`);
    
    // Search in chunks
    const chunkSize = 10 * 1024 * 1024; // 10MB
    const buf = Buffer.alloc(chunkSize + 100);
    let bytesRead = 0;
    let offset = 0;
    const target = Buffer.from('131474');

    while ((bytesRead = fs.readSync(fd, buf, 0, chunkSize, offset)) > 0) {
        let idx = -1;
        while ((idx = buf.subarray(0, bytesRead).indexOf(target, idx + 1)) !== -1) {
            console.log(`Found 131474 at offset ${offset + idx}`);
            const start = Math.max(0, idx - 300);
            const end = Math.min(bytesRead, idx + 300);
            const slice = buf.subarray(start, end);
            let s = '';
            for (let i = 0; i < slice.length; i++) {
                const b = slice[i];
                if (b >= 32 && b <= 126) s += String.fromCharCode(b);
                else s += ' ';
            }
            console.log(s.replace(/\s+/g, ' '));
        }
        offset += (bytesRead - 20); // small overlap
        if (bytesRead < chunkSize) break;
    }
    fs.closeSync(fd);
    console.log('Search finished.');
} catch (e) {
    console.error('Error:', e.message);
}
