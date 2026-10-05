const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const patients = await prisma.patient.findMany({
        orderBy: { id: 'desc' },
        take: 10,
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

    console.log('=== LISTA DE ÚLTIMOS PACIENTES CLÍNICOS REALES REGISTRADOS ===\n');
    patients.forEach(p => {
        const tests = [];
        p.samples.forEach(s => s.orders.forEach(o => o.tests.forEach(t => tests.push(t.testName))));
        const rep = p.samples[0]?.orders[0]?.reports[0];
        console.log(`- Paciente: ${p.firstName} ${p.lastName}`);
        console.log(`  Identificación: ${p.uniqueId}`);
        console.log(`  Análisis Clínicos: ${tests.slice(0, 4).join(', ') || 'Perfil Clínico General'}`);
        console.log(`  Informe Asociado: #${rep?.reportNumber || 'N/A'} (Tipo: ${rep?.reportType || 'CLINICAL_HUMAN'})\n`);
    });
    await prisma.$disconnect();
}

main().catch(console.error);
