const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = edgePaths.find(p => fs.existsSync(p));

if (!executablePath) {
    console.error('No Edge or Chrome binary found');
    process.exit(1);
}

const artifactDir = 'C:\\Users\\HP LAB\\.gemini\\antigravity-ide\\brain\\83d9067b-e780-405b-ade9-0f858a5e82b3';

async function run() {
    console.log(`Launching browser: ${executablePath}`);
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1800']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1800 });

    try {
        console.log('Authenticating with bypass=admin...');
        await page.goto('http://localhost:5173/home?bypass=admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));

        console.log('Navigating to Clinical Report 131474...');
        await page.goto('http://localhost:5173/final_report/131474', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2500));

        const clinicalPath = path.join(artifactDir, 'worldclass_clinical_report_131474.png');
        await page.screenshot({ path: clinicalPath });
        console.log(`Saved: ${clinicalPath}`);

        // Scroll the main container to the bottom and capture footer
        await page.evaluate(() => {
            const main = document.querySelector('main');
            if (main) main.scrollTop = main.scrollHeight;
        });
        await new Promise(r => setTimeout(r, 1000));

        const clinicalFooterPath = path.join(artifactDir, 'worldclass_clinical_footer_131474.png');
        await page.screenshot({ path: clinicalFooterPath });
        console.log(`Saved: ${clinicalFooterPath}`);

        console.log('Navigating to Industrial Report EST-13526-2...');
        await page.goto('http://localhost:5173/final_report/EST-13526-2', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2500));

        const industrialPath = path.join(artifactDir, 'worldclass_industrial_report_13526.png');
        await page.screenshot({ path: industrialPath });
        console.log(`Saved: ${industrialPath}`);

        await page.evaluate(() => {
            const main = document.querySelector('main');
            if (main) main.scrollTop = main.scrollHeight;
        });
        await new Promise(r => setTimeout(r, 1000));

        const industrialFooterPath = path.join(artifactDir, 'worldclass_industrial_footer_13526.png');
        await page.screenshot({ path: industrialFooterPath });
        console.log(`Saved: ${industrialFooterPath}`);

    } catch (err) {
        console.error('Screenshot error:', err);
    } finally {
        await browser.close();
    }
}

run();
