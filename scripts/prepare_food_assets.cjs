
const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const imgBase64 = fs.readFileSync('c:/lims-microlabs/scripts/food_130650_preview.png').toString('base64');
    
    await page.setContent(`
        <html>
        <body style="margin:0;padding:0;">
            <script>
                const img = new Image();
                img.onload = () => {
                    const lineY = 573;
                    const c = document.createElement('canvas');
                    c.width = img.width;
                    c.height = img.height - lineY;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, lineY, img.width, c.height, 0, 0, img.width, c.height);
                    window.cropped = c.toDataURL('image/png');
                };
                img.src = 'data:image/png;base64,' + "${imgBase64}";
            </script>
        </body>
        </html>
    `);

    await page.waitForFunction('window.cropped');
    const dataUrl = await page.evaluate(() => window.cropped);
    const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('c:/lims-microlabs/scripts/report_assets/footer_food_official.png', Buffer.from(b64, 'base64'));
    console.log('footer_food_official.png guardado con éxito!');
    await browser.close();
})();
