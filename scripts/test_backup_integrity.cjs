const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupFile = 'C:\\lims-microlabs\\api\\prisma\\backups\\lims_backup_2026-10-20T23-06-00-022Z_STARTUP.db';
console.log('Testing backup file:', backupFile);
console.log('Exists:', fs.existsSync(backupFile));
console.log('Size:', (fs.statSync(backupFile).size / (1024 * 1024)).toFixed(2), 'MB');

// Use sqlite3 CLI if available or test via Prisma with custom DATABASE_URL
process.env.DATABASE_URL = `file:${backupFile.replace(/\\/g, '/')}`;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBackup() {
    try {
        const res = await prisma.$queryRawUnsafe('PRAGMA integrity_check;');
        console.log('Backup PRAGMA integrity_check:', res);
        const count = await prisma.industrialSample.count();
        console.log('Industrial samples count:', count);
        const ampmSamples = await prisma.industrialSample.findMany({
            where: { barcode: { startsWith: 'AMPM-' } },
            select: { barcode: true, matrixType: true }
        });
        console.log('AMPM samples in backup:', ampmSamples.length);
        console.log(ampmSamples);
    } catch (e) {
        console.error('Error on backup:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testBackup();
