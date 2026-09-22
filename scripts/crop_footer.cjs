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
                    const canvas = document.getElementById('c');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const imgData = ctx.getImageData(0, 0, img.width, img.height);
                    let lineY = -1;
                    for (let y = Math.floor(img.height * 0.7); y < img.height; y++) {
                        for (let x = 50; x < img.width - 50; x++) {
                            const idx = (y * img.width + x) * 4;
                            const r = imgData.data[idx];
                            const g = imgData.data[idx + 1];
                            const b = imgData.data[idx + 2];
                            if (r > 200 && g > 70 && g < 150 && b < 50) {
                                lineY = y;
                                break;
                            }
                        }
                        if (lineY !== -1) break;
                    }
                    
                    window.detectedLineY = lineY;
                    
                    const cropCanvas = document.createElement('canvas');
                    cropCanvas.width = img.width;
                    cropCanvas.height = img.height - lineY + 5;
                    const cropCtx = cropCanvas.getContext('2d');
                    cropCtx.drawImage(img, 0, lineY - 2, img.width, cropCanvas.height, 0, 0, img.width, cropCanvas.height);
                    window.croppedDataUrl = cropCanvas.toDataURL('image/png');
                };
                img.src = 'data:image/png;base64,' + "${imgBase64}";
            </script>
        </body>
        </html>
    `);
    
    await page.waitForFunction('window.croppedDataUrl');
    const lineY = await page.evaluate(() => window.detectedLineY);
    const dataUrl = await page.evaluate(() => window.croppedDataUrl);
    console.log('Detected orange line at Y:', lineY);
    
    const base64Only = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('c:/lims-microlabs/scripts/report_assets/footer_official.png', Buffer.from(base64Only, 'base64'));
    console.log('Saved footer_official.png');
    await browser.close();
})();
