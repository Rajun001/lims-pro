
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { buildHtml } = require('./report_template.cjs');

(async () => {
    const jsonPath = 'C:/Users/HP LAB/Desktop/rach/estimaciones_completas_roldan.json';
    const outDir = 'C:/Users/HP LAB/Desktop/rach';
    
    if (!fs.existsSync(jsonPath)) {
        console.error('No se encontró el archivo de datos JSON.');
        process.exit(1);
    }

    const allReports = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Total reportes cargados: ${allReports.length}`);

    // Filter only those that don't already exist on disk
    const missingReports = allReports.filter(r => {
        const destPdf = path.join(outDir, `${r.refNumber}.pdf`);
        return !fs.existsSync(destPdf);
    });

    console.log(`Reportes que faltan generar: ${missingReports.length}`);

    if (missingReports.length === 0) {
        console.log('Todos los reportes ya existen en formato PDF.');
        return;
    }

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    let count = 0;
    const startTime = Date.now();

    for (const report of missingReports) {
        count++;
        const targetPdf = path.join(outDir, `${report.refNumber}.pdf`);
        const reportLabel = `[${count}/${missingReports.length}] Reporte #${report.refNumber} (${report.txnDate}) - ${report.memo || report.template}`;
        console.log(`Generando ${reportLabel}...`);

        try {
            const html = await buildHtml(report);
            await page.setContent(html, { waitUntil: 'domcontentloaded' });
            
            await page.pdf({
                path: targetPdf,
                format: 'Letter',
                printBackground: true,
                margin: { top: 0, right: 0, bottom: 0, left: 0 }
            });

            report.alreadyInPdf = true;
        } catch (err) {
            console.error(`Error generando reporte #${report.refNumber}: ${err.message}`);
        }
    }

    await browser.close();

    // Update JSON
    fs.writeFileSync(jsonPath, JSON.stringify(allReports, null, 2), 'utf8');

    const totalPdfsOnDisk = fs.readdirSync(outDir).filter(f => f.endsWith('.pdf')).length;
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n========================================');
    console.log(`PROCESO COMPLETADO EN ${duration} SEGUNDOS`);
    console.log(`Reportes recién generados: ${count}`);
    console.log(`Total archivos PDF en "${outDir}": ${totalPdfsOnDisk} de 79`);
    console.log('========================================');
})();
