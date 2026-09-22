const puppeteer = require('puppeteer-core');
const fs = require('fs');
const { buildFoodHtml } = require('./food_report_template.cjs');
const { PDFParse } = require('pdf-parse');

(async () => {
    // Exact structured data for 130650
    const report130650 = {
        refNumber: '130650',
        customerName: 'COMEDOR DHG',
        responsible: 'JANDIER LORIO',
        sampledBy: 'MICROLABS',
        receptionDate: '22/7/26',
        mountingDate: '22/07/26',
        reportDate: '28/7/26',
        categories: [
            {
                name: 'SUPERFICIES',
                samples: [
                    {
                        name: '1. TABLA DE CORTAR BLANCA<br>EN USO',
                        condition: 'SUPERFICIE_SUCIA',
                        tests: [
                            { parameter: 'Recuento Total Aeróbico', result: '1 300', unit: 'UFC/50cm^2', method: 'AOAC 990.12' },
                            { parameter: 'Coliformes Totales', result: '320', unit: 'UFC/50cm^2', method: 'AOAC 991.14' },
                            { parameter: 'Coliformes Fecales', result: '20', unit: 'UFC/50cm^2', method: 'AOAC991.14' },
                            { parameter: 'Escherichia coli', result: '< 4', unit: 'UFC/50cm^2', method: 'AOAC991.14' },
                            { parameter: 'Salmonella spp MDA2', result: 'Negativo', unit: '', method: 'AOAC2016.01' },
                            { parameter: 'Listeria spp MDA2', result: 'Negativo', unit: '', method: 'AOAC 2016.07' },
                            { parameter: 'Listeria monocytogenes MDA2', result: 'Negativo', unit: '', method: 'AOAC 2016.08' },
                            { parameter: 'E coli O157 Molecular Detection Assay', result: 'Negativo', unit: '', method: 'AOAC RI071202' }
                        ]
                    },
                    {
                        name: '2. TABLA DE CORTAR BLANCA<br>LIMPIA',
                        condition: 'SUPERFICIE_LIMPIA',
                        tests: [
                            { parameter: 'Recuento Total Aeróbico', result: '180', unit: 'UFC/50cm^2', method: 'AOAC 990.12' },
                            { parameter: 'Coliformes Totales', result: '32', unit: 'UFC/50cm^2', method: 'AOAC 991.14' },
                            { parameter: 'Coliformes Fecales', result: '< 4', unit: 'UFC/50cm^2', method: 'AOAC991.14' },
                            { parameter: 'Escherichia coli', result: '< 4', unit: 'UFC/50cm^2', method: 'AOAC991.14' },
                            { parameter: 'Detección Molecular Salmonella spp', result: 'Negativo', unit: '', method: 'AOAC2016.01' },
                            { parameter: 'Detección Molecular Listeria spp', result: 'Negativo', unit: '', method: 'AOAC 2016.07' },
                            { parameter: 'Detección Molecular Listeria monocytogenes', result: 'Negativo', unit: '', method: 'AOAC 2016.08' },
                            { parameter: 'Detección Molecular E coli O157', result: 'Negativo', unit: '', method: 'AOAC 2017.01' }
                        ]
                    }
                ]
            }
        ]
    };

    const html = await buildFoodHtml(report130650);
    fs.writeFileSync('c:/lims-microlabs/scripts/test_food_preview.html', html, 'utf8');

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfPath = 'c:/lims-microlabs/scripts/test_food_130650.pdf';
    await page.pdf({
        path: pdfPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    await browser.close();
    console.log('PDF generado en', pdfPath);

    // Render snapshot
    const p = new PDFParse({ data: fs.readFileSync(pdfPath) });
    await p.load();
    const sc = await p.getScreenshot({});
    if (sc.pages && sc.pages[0] && sc.pages[0].data) {
        fs.writeFileSync('c:/lims-microlabs/scripts/test_food_130650_preview.png', Buffer.from(sc.pages[0].data));
        console.log('Saved test_food_130650_preview.png');
    }
})();
