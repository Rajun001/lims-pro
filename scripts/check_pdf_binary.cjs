const fs = require('fs');
const path = require('path');

const folder = 'C:\\Users\\HP LAB\\Documents\\PDFgear';
const file = 'AMPM - 2026-10-20 12-50-18.pdf';
const content = fs.readFileSync(path.join(folder, file));

// Search for strings inside the binary
const str = content.toString('latin1');
console.log('Size of PDF:', content.length);

// Let's search for text like Cartago, AMPM, Asis, etc.
const keywords = ['Cartago', 'Santa Ana', 'AMPM', 'Inversiones', '2026', 'Agua', 'Muestra'];
for (const kw of keywords) {
    const idx = str.indexOf(kw);
    console.log(`Keyword "${kw}":`, idx !== -1 ? `FOUND at ${idx}` : 'NOT FOUND');
}

// Let's inspect /Annots or form fields or stream contents
const annotsMatches = str.match(/\/Annots\s*\[(.*?)\]/gs);
console.log('Annots matches count:', annotsMatches ? annotsMatches.length : 0);
if (annotsMatches) {
    console.log('Annots sample:', annotsMatches[0].substring(0, 300));
}

// Check /Fields or /V (form values)
const vMatches = str.match(/\/V\s*\((.*?)\)/g);
console.log('/V (values) count:', vMatches ? vMatches.length : 0);
if (vMatches) {
    console.log('/V sample:', vMatches.slice(0, 20));
}

// Check for text in Tj or TJ
const tjMatches = str.match(/\((.*?)\)\s*Tj/g);
console.log('Tj matches count:', tjMatches ? tjMatches.length : 0);
if (tjMatches) {
    console.log('Tj non-empty sample:', tjMatches.filter(t => t.length > 5).slice(0, 25));
}
