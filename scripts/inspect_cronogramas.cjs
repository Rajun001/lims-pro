const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
  'C:/Users/HP LAB/Desktop/SPOON/Cronograma Microbiologicos  2026 Microlabs.xlsx',
  'C:/Users/HP LAB/Desktop/TB/R-AC-07- Cronograma análisis microbiológicos 2026-.xlsx',
  'C:/Users/HP LAB/Desktop/Muestreo II de superficies y alimentos Tabacón Thermal Resort.xlsx',
  'C:/Users/HP LAB/Desktop/Copia de Primer muestreo 2026.xlsx',
  'C:/Users/HP LAB/Desktop/DE TODO/Cronograma anual de aguas Taco Bell.xlsx'
];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.log('NO EXISTE:', f);
    continue;
  }
  console.log('\n=============================================================');
  console.log('ARCHIVO:', path.basename(f));
  console.log('=============================================================');
  const wb = XLSX.readFile(f);
  console.log('Hojas:', wb.SheetNames);
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\n--- Hoja: ${sheetName} (Filas: ${data.length}) ---`);
    // Print first 8 rows that are non-empty
    const sampleRows = data.filter(r => r && r.length > 0).slice(0, 8);
    for (const r of sampleRows) {
      console.log(JSON.stringify(r));
    }
  }
}
