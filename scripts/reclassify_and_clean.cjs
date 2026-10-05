const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sufijos y palabras clave
const CORPORATE_SUFFIXES = ['S.A.', 'SA', 'S.R.L.', 'SRL', 'LTDA', 'LIMITADA', 'CORP', 'CORPORACION', 'INC', 'LLC'];
const CORPORATE_KEYWORDS = ['HOTEL', 'RESTAURANT', 'ALIMENTOS', 'AGUA', 'ASADA', 'GRANJA', 'AVICOLA', 'CARNES', 'LACTEOS', 'PANADERIA', 'PROTEC', 'INDUSTRIAS', 'COMERCIAL', 'DISTRIBUIDORA'];

function isCompany(name) {
    const clean = (name || '').trim().toUpperCase();
    const cleanNoAccents = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanNoDots = clean.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanNoDots.split(' ');

    if (CORPORATE_SUFFIXES.some(s => words.includes(s.replace(/\./g, '')) || clean.endsWith(s))) return true;
    if (CORPORATE_KEYWORDS.some(kw => cleanNoAccents.includes(kw))) return true;
    return false;
}

async function reclassify() {
    console.log('--- RECLASIFICACIÓN DE INTEGRIDAD EN BD ---');
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
        if (isCompany(fullName)) {
            // Mover a CorporateClient
            const taxId = 'TAX-' + fullName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
            const client = await prisma.corporateClient.upsert({
                where: { taxId },
                update: { companyName: fullName },
                create: { taxId, companyName: fullName, industrySector: 'Alimentos y Bebidas' }
            });

            const projectCode = `PRJ-${fullName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-MIG`;
            const contract = await prisma.industrialContract.upsert({
                where: { projectCode },
                update: { projectName: `Control Analítico - ${fullName}` },
                create: { clientId: client.id, projectCode, projectName: `Control Analítico - ${fullName}`, contractType: 'CONTROL_CALIDAD_LOTE', startDate: new Date() }
            });

            // Re-vincular muestras y reportes a nivel industrial
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

                    // Eliminar tests y orden clínica
                    await prisma.clinicalTest.deleteMany({ where: { orderId: o.id } });
                    await prisma.clinicalOrder.delete({ where: { id: o.id } });
                }

                await prisma.clinicalSample.delete({ where: { id: s.id } });
            }

            // Eliminar registro del paciente erróneo
            await prisma.patient.delete({ where: { id: pat.id } });
            movedCount++;
            console.log(`  -> Reclasificado a Empresa: "${fullName}"`);
        }
    }

    console.log(`Reclasificación terminada: ${movedCount} registros corregidos hacia Empresas.`);
    await prisma.$disconnect();
}

reclassify().catch(console.error);
