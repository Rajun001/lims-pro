const fs = require('fs');
const zlib = require('zlib');

function parsePdf(filePath) {
    console.log('\n==================================================');
    console.log('PARSING:', filePath);
    console.log('==================================================');
    const content = fs.readFileSync(filePath);
    
    // Find all stream / endstream blocks
    let startIdx = 0;
    let streamCount = 0;

    while ((startIdx = content.indexOf('stream', startIdx)) !== -1) {
        // Skip 'stream' and newline
        let dataStart = startIdx + 6;
        while (content[dataStart] === 10 || content[dataStart] === 13) dataStart++;
        
        const endIdx = content.indexOf('endstream', dataStart);
        if (endIdx === -1) break;

        const streamBuf = content.subarray(dataStart, endIdx);
        try {
            const decomp = zlib.inflateSync(streamBuf);
            const str = decomp.toString('latin1');
            
            // Extract Tj and TJ
            const matches = [];
            const regex = /\((.*?)\)\s*Tj/g;
            let m;
            while ((m = regex.exec(str)) !== null) {
                matches.push(m[1]);
            }
            if (matches.length > 0) {
                console.log(`[Stream ${streamCount}] Text:`);
                console.log(matches.join(' '));
            }
        } catch (e) {
            // not zlib compressed or error
        }

        streamCount++;
        startIdx = endIdx + 9;
    }
}

for (const f of ['131442.pdf', '131443.pdf', '129811.pdf']) {
    const p = 'C:\\Users\\HP LAB\\Desktop\\' + f;
    if (fs.existsSync(p)) {
        parsePdf(p);
    }
}
