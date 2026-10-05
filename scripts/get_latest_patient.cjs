const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const latestPatients = await prisma.patient.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: {
            samples: {
                include: {
                    orders: {
                        include: {
                            tests: true,
                            reports: true
                        }
                    }
                }
            }
        }
    });

    console.log('=== ÚLTIMOS PACIENTES INGRESADOS ===');
    for (const p of latestPatients) {
        console.log(`\nID: ${p.id} | UniqueID: ${p.uniqueId} | Nombre: ${p.firstName} ${p.lastName}`);
        console.log(`Fecha de Ingreso al Sistema: ${p.createdAt}`);
        for (const s of p.samples) {
            console.log(`  Muestra: ${s.barcode} (${s.sampleType}) - Recibido: ${s.receivedAt}`);
            for (const o of s.orders) {
                console.log(`    Ensayos (${o.tests.length}): `, o.tests.map(t => t.testName).join(', '));
                for (const r of o.reports) {
                    console.log(`    Informe Oficial: #${r.reportNumber} (Tipo: ${r.reportType} - Estado: ${r.status})`);
                }
            }
        }
    }
    await prisma.$disconnect();
}

main().catch(console.error);
