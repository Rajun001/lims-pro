const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const res = await prisma.$queryRawUnsafe('PRAGMA integrity_check;');
        console.log('INTEGRITY CHECK RESULT:', res);
    } catch (e) {
        console.error('Integrity Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
