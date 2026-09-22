const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const imgBase64 = fs.readFileSync('c:/lims-microlabs/scripts/sample_pdf_page.png').toString('base64');
    
    await page.setContent(`
        <html>
        <body style="margin:0;padding:0;">
            <canvas id="c"></canvas>
            <script>
                const img = new Image();
                img.onload = () => {
                    const lineY = 650;
                    const cropCanvas = document.createElement('canvas');
                    cropCanvas.width = img.width;
                    cropCanvas.height = img.height - lineY;
                    const cropCtx = cropCanvas.getContext('2d');
                    cropCtx.drawImage(img, 0, lineY, img.width, cropCanvas.height, 0, 0, img.width, cropCanvas.height);
                    window.croppedDataUrl = cropCanvas.toDataURL('image/png');
                };
                img.src = 'data:image/png;base64,' + "${imgBase64}";
            </script>
        </body>
        </html>
    `);
    
    await page.waitForFunction('window.croppedDataUrl');
    const dataUrl = await page.evaluate(() => window.croppedDataUrl);
    const base64Only = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('c:/lims-microlabs/scripts/report_assets/footer_official.png', Buffer.from(base64Only, 'base64'));
    console.log('footer_official.png guardado con éxito!');
    await browser.close();
})();
