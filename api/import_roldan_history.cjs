const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    const jsonPath = 'C:/Users/HP LAB/Desktop/rach/estimaciones_completas_roldan.json';
    if (!fs.existsSync(jsonPath)) {
        console.error('No se encontró el archivo:', jsonPath);
        process.exit(1);
    }

    const reports = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Cargadas ${reports.length} estimaciones para migración.`);

    // 1. Upsert Patient
    const patientDob = new Date('1966-04-20T00:00:00.000Z');
    const patient = await prisma.patient.upsert({
        where: { uniqueId: '502310299' },
        update: {
            firstName: 'Roldan',
            lastName: 'Ajún Chaverri',
            dob: patientDob,
            gender: 'M',
            email: 'rajun@me.com',
            phone: '+506 88399753'
        },
        create: {
            uniqueId: '502310299',
            firstName: 'Roldan',
            lastName: 'Ajún Chaverri',
            dob: patientDob,
            gender: 'M',
            email: 'rajun@me.com',
            phone: '+506 88399753'
        }
    });

    console.log(`Paciente registrado con éxito. ID: ${patient.id} (${patient.firstName} ${patient.lastName})`);

    // 2. Upsert QbSyncedClient
    await prisma.qbSyncedClient.upsert({
        where: { listId: '32E0001-1211213258' },
        update: {
            name: 'Roldan Ajún Chaverri',
            email: 'rajun@me.com',
            phone: '+506 88399753',
            document: '502310299',
            documentType: 'CEDULA'
        },
        create: {
            listId: '32E0001-1211213258',
            name: 'Roldan Ajún Chaverri',
            email: 'rajun@me.com',
            phone: '+506 88399753',
            document: '502310299',
            documentType: 'CEDULA'
        }
    });

    console.log('Cliente QuickBooks vinculado exitosamente (ListID: 32E0001-1211213258).');

    let samplesCreated = 0;
    let ordersCreated = 0;
    let testsCreated = 0;
    let reportsCreated = 0;

    for (const rep of reports) {
        const barcode = String(rep.refNumber).trim();
        const dateObj = new Date(rep.txnDate + 'T12:00:00.000Z');

        // Determine sampleType
        let sampleType = 'Sangre / Suero';
        const memoUpper = (rep.memo || '').toUpperCase();
        if (memoUpper.includes('ORINA')) sampleType = 'Orina';
        else if (memoUpper.includes('HECES')) sampleType = 'Heces';
        else if (memoUpper.includes('COVID') || (rep.template && rep.template.includes('COVID'))) sampleType = 'Hisopado Nasofaríngeo';

        // 3. Upsert ClinicalSample
        const sample = await prisma.clinicalSample.upsert({
            where: { barcode },
            update: {
                sampleType,
                collectionTime: dateObj,
                receivedAt: dateObj,
                status: 'COMPLETED'
            },
            create: {
                patientId: patient.id,
                barcode,
                sampleType,
                collectionTime: dateObj,
                receivedAt: dateObj,
                status: 'COMPLETED'
            }
        });
        samplesCreated++;

        // 4. Find or Create ClinicalOrder
        let order = await prisma.clinicalOrder.findFirst({
            where: { sampleId: sample.id }
        });

        const physicianName = rep.headerCustom['Medico'] || null;

        if (!order) {
            order = await prisma.clinicalOrder.create({
                data: {
                    sampleId: sample.id,
                    physicianName,
                    status: 'COMPLETED',
                    createdAt: dateObj,
                    updatedAt: dateObj
                }
            });
            ordersCreated++;
        } else {
            await prisma.clinicalOrder.update({
                where: { id: order.id },
                data: { physicianName, status: 'COMPLETED' }
            });
        }

        // 5. Delete previous tests for this order to avoid duplicates on re-run
        await prisma.clinicalTest.deleteMany({
            where: { orderId: order.id }
        });

        // 6. Insert tests
        let currentGroup = '';
        for (const it of rep.items) {
            if (it.type === 'group_header') {
                currentGroup = it.name;
                continue;
            }

            // Skip empty spacer rows
            if (!it.item && !it.desc && !it.result) continue;

            const rawItemName = it.item || (currentGroup ? `${currentGroup} - Detalle` : 'Parámetro');
            const cleanName = rawItemName.replace(/^[^:]+:/, '').trim();

            // Try parse float
            let numVal = null;
            if (it.result) {
                const sanitized = String(it.result).replace(',', '.').trim();
                const parsed = parseFloat(sanitized);
                if (!isNaN(parsed) && isFinite(parsed)) {
                    numVal = parsed;
                }
            }

            const codeSlug = cleanName
                .substring(0, 20)
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '_');

            await prisma.clinicalTest.create({
                data: {
                    orderId: order.id,
                    testCode: codeSlug || 'TEST',
                    testName: cleanName,
                    rawResult: numVal,
                    calculatedResult: numVal,
                    unit: it.unit || null,
                    appliedReferenceRange: it.desc || null,
                    flag: 'NORMAL',
                    status: 'VALIDATED',
                    technicalNotes: [
                        it.result && isNaN(numVal) ? `Resultado textual: ${it.result}` : null,
                        it.method ? `Método: ${it.method}` : null,
                        currentGroup ? `Sección: ${currentGroup}` : null
                    ].filter(Boolean).join(' | ') || null,
                    createdAt: dateObj,
                    updatedAt: dateObj
                }
            });
            testsCreated++;
        }

        // 7. Upsert Report
        const pdfDiskPath = `C:/Users/HP LAB/Desktop/rach/${barcode}.pdf`;
        await prisma.report.upsert({
            where: { reportNumber: barcode },
            update: {
                reportType: 'CLINICAL_HUMAN',
                clinicalOrderId: order.id,
                status: 'ISSUED',
                pdfUrl: pdfDiskPath,
                signedAt: dateObj,
                technicalObservations: rep.memo || null
            },
            create: {
                reportNumber: barcode,
                reportType: 'CLINICAL_HUMAN',
                clinicalOrderId: order.id,
                status: 'ISSUED',
                pdfUrl: pdfDiskPath,
                createdAt: dateObj,
                updatedAt: dateObj,
                signedAt: dateObj,
                technicalObservations: rep.memo || null
            }
        });
        reportsCreated++;
    }

    console.log('\n=============================================');
    console.log('MIGRACIÓN A BASE DE DATOS LIMS COMPLETADA');
    console.log('=============================================');
    console.log(`Paciente: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
    console.log(`Muestras clínicas sincronizadas (ClinicalSample): ${samplesCreated}`);
    console.log(`Órdenes de laboratorio (ClinicalOrder): ${ordersCreated}`);
    console.log(`Pruebas y resultados individuales (ClinicalTest): ${testsCreated}`);
    console.log(`Informes oficiales vinculados a PDF (Report): ${reportsCreated}`);
    console.log('=============================================\n');
}

main()
    .catch((e) => {
        console.error('Error durante la migración:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
