const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const req = await prisma.sampleRequest.findUnique({
        where: { id: 'EST-13526-2' },
        include: { results: true }
    });
    console.log('Sample EST-13526-2 exists:', !!req);
    if (req) {
        console.log('Client:', req.clientName);
        console.log('Results count:', req.results?.length);
        console.log('Sample results:', JSON.stringify(req.results?.slice(0, 8), null, 2));
    }
    await prisma.$disconnect();
}

main().catch(console.error);
