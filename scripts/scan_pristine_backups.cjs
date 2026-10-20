const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const dirs = [
    'C:\\lims-microlabs\\api\\prisma\\backups',
    'C:\\IONOS HiDrive\\Publica\\Respaldos_LIMS'
];

async function checkAll() {
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        console.log('\n--- Checking directory:', dir, '---');
        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.db'))
            .sort()
            .reverse();

        for (const f of files.slice(0, 10)) {
            const fullPath = path.join(dir, f);
            const url = `file:${fullPath.replace(/\\/g, '/')}`;
            const prisma = new PrismaClient({
                datasources: { db: { url } }
            });
            try {
                const res = await prisma.$queryRawUnsafe('PRAGMA quick_check;');
                const ok = res && res[0] && (res[0].quick_check === 'ok' || Object.values(res[0])[0] === 'ok');
                const samples = await prisma.industrialSample.count();
                console.log(`[${ok ? 'OK' : 'ERR'}] ${f} -> Samples: ${samples}`);
                await prisma.$disconnect();
                if (ok) {
                    console.log('>>> Found valid pristine backup:', fullPath);
                    return fullPath;
                }
            } catch (err) {
                console.log(`[MALFORMED] ${f}: ${err.message.split('\n')[0]}`);
                await prisma.$disconnect();
            }
        }
    }
    return null;
}

checkAll().catch(console.error);
