const puppeteer = require('puppeteer-core');
const fs = require('fs');
const { buildHtml } = require('./report_template.cjs');
const { PDFParse } = require('pdf-parse');

(async () => {
    const data = JSON.parse(fs.readFileSync('C:/Users/HP LAB/Desktop/rach/estimaciones_completas_roldan.json', 'utf8'));
    const report104749 = data.find(x => x.refNumber === '104749');

    const html = await buildHtml(report104749);
    fs.writeFileSync('c:/lims-microlabs/scripts/test_preview.html', html, 'utf8');

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfPath = 'c:/lims-microlabs/scripts/test_104749.pdf';
    await page.pdf({
        path: pdfPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    await browser.close();
    console.log('PDF generado en', pdfPath);

    // Render snapshot
    const buf = fs.readFileSync(pdfPath);
    const p = new PDFParse({ data: buf });
    await p.load();
    const sc = await p.getScreenshot({});
    if (sc.pages && sc.pages[0] && sc.pages[0].data) {
        fs.writeFileSync('c:/lims-microlabs/scripts/test_104749_preview.png', Buffer.from(sc.pages[0].data));
        console.log('Saved test_104749_preview.png');
    }
})();
