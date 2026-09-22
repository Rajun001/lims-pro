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
        <body>
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
                    const colors = [];
                    for (let y = 630; y < 670; y += 1) {
                        for (let x = 50; x < 200; x++) {
                            const idx = (y * img.width + x) * 4;
                            const r = imgData.data[idx];
                            const g = imgData.data[idx+1];
                            const b = imgData.data[idx+2];
                            if (r > 200 && g < 150) {
                                colors.push({ y, x, r, g, b });
                                break;
                            }
                        }
                    }
                    window.sampleColors = colors;
                };
                img.src = 'data:image/png;base64,' + "${imgBase64}";
            </script>
        </body>
        </html>
    `);
    
    await page.waitForFunction('window.sampleColors');
    const cols = await page.evaluate(() => window.sampleColors);
    console.log('Orange line pixels detected:', cols.slice(0, 10));
    await browser.close();
})();
