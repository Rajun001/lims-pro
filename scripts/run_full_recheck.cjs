const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runFullRecheck() {
    const { classifyClient } = await import('../api/services/clientClassifier.service.js');
    console.log('--- REVISIÓN TOTAL CON MOTOR CLASIFICADOR OFICIAL ---');

    const allPatients = await prisma.patient.findMany({
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

    let movedCount = 0;
    for (const pat of allPatients) {
        const fullName = `${pat.firstName} ${pat.lastName}`.trim();
        
        // Extraer nombres de tests
        const testNames = [];
        pat.samples.forEach(s => s.orders.forEach(o => o.tests.forEach(t => testNames.push(t.testName))));
        
        const decision = classifyClient(fullName, '', testNames);
        if (decision.entityType === 'COMPANY') {
            const taxId = 'TAX-' + fullName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
            const client = await prisma.corporateClient.upsert({
                where: { taxId },
                update: { companyName: fullName, industrySector: decision.sector },
                create: { taxId, companyName: fullName, industrySector: decision.sector }
            });

            const projectCode = `PRJ-${fullName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-IND`;
            const contract = await prisma.industrialContract.upsert({
                where: { projectCode },
                update: { projectName: `Control Analítico - ${fullName}` },
                create: { clientId: client.id, projectCode, projectName: `Control Analítico - ${fullName}`, contractType: 'CONTROL_CALIDAD_LOTE', startDate: new Date() }
            });

            for (const s of pat.samples) {
                const indSample = await prisma.industrialSample.upsert({
                    where: { barcode: `IND-${s.barcode}` },
                    update: { matrixType: s.sampleType, lotNumber: `Muestra ${s.barcode}`, samplingProtocol: 'RTCA / ISO', receivedAt: s.receivedAt, status: 'COMPLETED' },
                    create: { contractId: contract.id, barcode: `IND-${s.barcode}`, matrixType: s.sampleType, lotNumber: `Muestra ${s.barcode}`, samplingProtocol: 'RTCA / ISO', receivedAt: s.receivedAt, status: 'COMPLETED' }
                });

                for (const o of s.orders) {
                    for (const t of o.tests) {
                        await prisma.industrialTest.create({
                            data: {
                                sampleId: indSample.id,
                                category: 'MICROBIOLOGICAL',
                                parameterName: t.testName,
                                quantitativeResult: t.calculatedResult,
                                qualitativeResult: t.flag,
                                compliance: 'CONFORME'
                            }
                        });
                    }

                    for (const r of o.reports) {
                        await prisma.report.update({
                            where: { id: r.id },
                            data: {
                                reportType: 'INDUSTRIAL_COA',
                                clinicalOrderId: null,
                                industrialSampleId: indSample.id
                            }
                        });
                    }

                    await prisma.clinicalTest.deleteMany({ where: { orderId: o.id } });
                    await prisma.clinicalOrder.delete({ where: { id: o.id } });
                }

                await prisma.clinicalSample.delete({ where: { id: s.id } });
            }

            await prisma.patient.delete({ where: { id: pat.id } });
            movedCount++;
            console.log(`  -> Corregido a Empresa: "${fullName}" (${decision.sector})`);
        }
    }

    console.log(`\nRevisión terminada: ${movedCount} registros reclasificados hacia Empresas.`);
    
    // Consultar el paciente más nuevo
    const newest = await prisma.patient.findFirst({
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

    if (newest) {
        console.log('\n=== PACIENTE MÁS NUEVO / RECIENTE EN EL SISTEMA ===');
        console.log(`ID: ${newest.id}`);
        console.log(`Nombre Completo: ${newest.firstName} ${newest.lastName}`);
        console.log(`Identificación: ${newest.uniqueId}`);
        console.log(`Fecha de Ingreso: ${newest.createdAt}`);
        for (const s of newest.samples) {
            console.log(`  Muestra: ${s.barcode} (${s.sampleType})`);
            for (const o of s.orders) {
                console.log(`  Ensayos: ${o.tests.map(t => t.testName).join(', ')}`);
                for (const r of o.reports) {
                    console.log(`  Informe Oficial: #${r.reportNumber} (Estado: ${r.status})`);
                }
            }
        }
    }

    await prisma.$disconnect();
}

runFullRecheck().catch(console.error);
