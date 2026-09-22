const XLSX = require('xlsx');

function dumpSheet(filePath, maxRows = 15) {
  console.log('\n======================================================');
  console.log('FILE:', filePath);
  console.log('======================================================');
  const wb = XLSX.readFile(filePath);
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\n--- Sheet: ${name} (total rows: ${data.length}) ---`);
    let count = 0;
    for (let i = 0; i < data.length && count < maxRows; i++) {
      const row = data[i];
      if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        console.log(`Row ${i}:`, JSON.stringify(row.filter(c => c !== null && c !== undefined)));
        count++;
      }
    }
  }
}

dumpSheet('C:/Users/HP LAB/Desktop/SPOON/Cronograma Microbiologicos  2026 Microlabs.xlsx');
dumpSheet('C:/Users/HP LAB/Desktop/TB/R-AC-07- Cronograma análisis microbiológicos 2026-.xlsx');
dumpSheet('C:/Users/HP LAB/Desktop/Muestreo II de superficies y alimentos Tabacón Thermal Resort.xlsx');
dumpSheet('C:/Users/HP LAB/Desktop/Copia de Primer muestreo 2026.xlsx');
