const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const desktop = 'C:/Users/HP LAB/Desktop';
const skipDirs = new Set(['revisar', '.git', 'node_modules']);

function getAllPdfs(dir) {
  let res = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (!skipDirs.has(item.name)) res = res.concat(getAllPdfs(full));
      } else if (item.isFile() && item.name.toLowerCase().endsWith('.pdf')) {
        res.push(full);
      }
    }
  } catch(e) {}
  return res;
}

async function analyze() {
  const allPdfs = getAllPdfs(desktop);
  console.log('Total PDFs encontrados en Desktop (sin revisar):', allPdfs.length);

  const existing = await prisma.report.findMany({ select: { reportNumber: true } });
  const existingReports = new Set(existing.map(r => r.reportNumber));
  console.log('Reportes ya existentes en BD:', existingReports.size);

  let foodCount = 0;
  let clinicalCount = 0;
  let formCount = 0;
  let otherCount = 0;
  let alreadyImported = 0;

  const toImportFood = [];
  const toImportClinical = [];
  const others = [];

  for (const f of allPdfs) {
    try {
      const parser = new PDFParse({ url: f });
      const textObj = await parser.getText();
      const text = textObj.text;

      const isFood = /C[oó]digo de reporte:\s*(\d+)/i.test(text) && /Empresa solicitante:/i.test(text);
      const isClinical = /C[oó]digo\s*Reporte:\s*(\d+)/i.test(text) && /Nombre\s*Paciente:/i.test(text);
      const isForm = /FORMULARIO DE SOLICITUD/i.test(text);

      let refNum = null;
      if (isFood) {
        const m = text.match(/C[oó]digo de reporte:\s*(\d+)/i);
        refNum = m ? m[1] : null;
      } else if (isClinical) {
        const m = text.match(/C[oó]digo\s*Reporte:\s*(\d+)/i);
        refNum = m ? m[1] : null;
      }

      if (refNum && existingReports.has(refNum)) {
        alreadyImported++;
      } else if (isFood) {
        foodCount++;
        toImportFood.push({ ref: refNum, file: f });
      } else if (isClinical) {
        clinicalCount++;
        toImportClinical.push({ ref: refNum, file: f });
      } else if (isForm) {
        formCount++;
      } else {
        otherCount++;
        others.push(path.basename(f));
      }
    } catch (e) {
      otherCount++;
      others.push(path.basename(f) + ' (err: ' + e.message + ')');
    }
  }

  console.log('\n=== RESULTADO DEL ESCANEO DE ESCRITORIO ===');
  console.log({
    totalPdfsEncontrados: allPdfs.length,
    yaEnBaseDeDatos: alreadyImported,
    pendientesAlimentos: foodCount,
    pendientesClinicos: clinicalCount,
    formulariosPlantillas: formCount,
    otrosDocumentosOAdmin: otherCount
  });

  console.log('\nPendientes de Alimentos:', toImportFood);
  console.log('\nPendientes Clínicos:', toImportClinical);
  console.log('\nOtros / Administrativos:', others);
}

analyze()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
