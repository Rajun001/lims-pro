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
                    const c = document.createElement('canvas');
                    c.width = img.width;
                    c.height = img.height;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imgData = ctx.getImageData(0, 0, img.width, img.height);
                    const pixels = imgData.data;

                    const nonWhiteRows = [];
                    for (let y = 540; y < 630; y++) {
                        let nonWhite = 0;
                        let sampleColor = null;
                        for (let x = 30; x < img.width - 30; x++) {
                            const idx = (y * img.width + x) * 4;
                            const r = pixels[idx];
                            const g = pixels[idx + 1];
                            const b = pixels[idx + 2];
                            if (r < 240 || g < 240 || b < 240) {
                                nonWhite++;
                                if (!sampleColor && (r > 150 || b < 100)) {
                                    sampleColor = { r, g, b, x };
                                }
                            }
                        }
                        if (nonWhite > 50) {
                            nonWhiteRows.push({ y, nonWhite, sampleColor });
                        }
                    }
                    window.rows = nonWhiteRows;
                };
                img.src = 'data:image/png;base64,' + "${imgBase64}";
            </script>
        </body>
        </html>
    `);

    await page.waitForFunction('window.rows');
    const rows = await page.evaluate(() => window.rows);
    console.log('Detected non-white rows between 540 and 630:');
    rows.forEach(r => console.log(`Y=${r.y}: count=${r.nonWhite}, sample=`, r.sampleColor));
    await browser.close();
})();
