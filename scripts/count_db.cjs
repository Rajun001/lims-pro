const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const reports = await prisma.report.count();
    const clinical = await prisma.report.count({ where: { reportType: 'CLINICAL' } });
    const industrial = await prisma.report.count({ where: { reportType: 'INDUSTRIAL_COA' } });
    const patients = await prisma.patient.count();
    console.log(JSON.stringify({ totalReports: reports, clinicalReports: clinical, industrialReports: industrial, patients: patients }, null, 2));
}

main().finally(() => prisma.$disconnect());
