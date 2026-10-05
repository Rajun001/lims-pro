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
const artifactDir = 'C:\\Users\\HP LAB\\.gemini\\antigravity-ide\\brain\\83d9067b-e780-405b-ade9-0f858a5e82b3';

async function generatePdfs() {
    console.log(`Using browser: ${executablePath}`);
    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1800']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1800 });

    try {
        console.log('Authenticating...');
        await page.goto('http://localhost:5173/home?bypass=admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));

        console.log('Generating Clinical Report PDF (131474)...');
        await page.goto('http://localhost:5173/final_report/131474', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2500));

        const clinicalPdfPath = path.join(artifactDir, 'Informe_Clinico_131474_MicroLabs.pdf');
        await page.pdf({
            path: clinicalPdfPath,
            format: 'Letter',
            printBackground: true,
            margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' }
        });
        console.log(`Clinical PDF saved: ${clinicalPdfPath}`);

        console.log('Generating Industrial Report PDF (EST-13526-2)...');
        await page.goto('http://localhost:5173/final_report/EST-13526-2', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2500));

        const industrialPdfPath = path.join(artifactDir, 'Certificado_Industrial_13526_MicroLabs.pdf');
        await page.pdf({
            path: industrialPdfPath,
            format: 'Letter',
            printBackground: true,
            margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' }
        });
        console.log(`Industrial PDF saved: ${industrialPdfPath}`);

    } catch (err) {
        console.error('PDF Generation Error:', err);
    } finally {
        await browser.close();
    }
}

generatePdfs();
