const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const prisma = new PrismaClient();

function classifyMatrix(textUpper) {
    if (textUpper.includes('HIELO')) {
        return { matrixType: 'Hielo', category: 'MICROBIOLOGICAL', condition: 'HIELO' };
    }
    if (textUpper.includes('AGUA') || textUpper.includes('PISCINA') || textUpper.includes('POZO')) {
        let condition = 'AGUA_POTABLE';
        if (textUpper.includes('FLAMEAD') && !textUpper.includes('NO FLAMEAD')) condition = 'TUBERIA_FLAMEADA';
        else if (textUpper.includes('NO FLAMEAD') || textUpper.includes('SIN FLAME')) condition = 'TUBERIA_NO_FLAMEADA';
        return {
            matrixType: textUpper.includes('PISCINA') ? 'Agua Recreacional' : 'Agua Potable',
            category: 'MICROBIOLOGICAL',
            condition
        };
    }
    if (textUpper.includes('MANOS') || textUpper.includes('MANIPULADOR')) {
        let condition = 'MANIPULADOR_MANOS';
        if (textUpper.includes('LIMPIA')) condition = 'MANOS_LIMPIAS';
        else if (textUpper.includes('SUCIA') || textUpper.includes('EN USO')) condition = 'MANOS_EN_USO';
        return { matrixType: 'Manipulador / Manos', category: 'MICROBIOLOGICAL', condition };
    }
    if (textUpper.includes('SUPERFICIE') || textUpper.includes('TABLA') || textUpper.includes('CUCHILLO') || 
        textUpper.includes('UTENSILIO') || textUpper.includes('RIEL') || textUpper.includes('BANDA') || textUpper.includes('LINEA CALIENTE')) {
        let condition = 'SUPERFICIE_INERTE';
        if (textUpper.includes('LIMPIA') || textUpper.includes('DESINFECTAD') || textUpper.includes('LAVAD')) condition = 'SUPERFICIE_LIMPIA';
        else if (textUpper.includes('SUCIA') || textUpper.includes('EN USO') || textUpper.includes('OPERACIONAL')) condition = 'SUPERFICIE_SUCIA';
        return { matrixType: 'Superficie Inerte', category: 'MICROBIOLOGICAL', condition };
    }
    if (textUpper.includes('AIRE COMPRIMIDO') || textUpper.includes('COMPRESOR')) {
        return { matrixType: 'Aire Comprimido', category: 'AIR_QUALITY', condition: 'AIRE_COMPRIMIDO' };
    }
    if (textUpper.includes('AMBIENTE') || textUpper.includes('IMPACTACION') || textUpper.includes('SEDIMENTACION')) {
        return {
            matrixType: 'Ambiente Aéreo',
            category: 'MICROBIOLOGICAL',
            condition: textUpper.includes('IMPACTACION') ? 'AMBIENTE_ACTIVO' : 'AMBIENTE_PASIVO'
        };
    }
    return { matrixType: 'Alimento Procesado', category: 'MICROBIOLOGICAL', condition: 'ALIMENTO' };
}

function parseDateStr(str) {
    if (!str) return new Date();
    const parts = str.trim().split('/');
    if (parts.length === 3) {
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[0], 10);
        return new Date(Date.UTC(year, month, day, 12, 0, 0));
    }
    return new Date();
}

async function parseFoodPdf(filePath) {
    const parser = new PDFParse({ url: filePath });
    const res = await parser.getText();
    const fullText = res.text;

    // Header extraction
    const refMatch = fullText.match(/C[oó]digo de reporte:\s*(\d+)/i);
    const refNumber = refMatch ? refMatch[1].trim() : path.basename(filePath, '.pdf');

    const empMatch = fullText.match(/Empresa solicitante:\s*([^\n\r]+)/i);
    const companyName = empMatch ? empMatch[1].trim() : 'Empresa Alimentos';

    const respMatch = fullText.match(/Empresa solicitante:[^\n\r]+[\r\n]+([^\n\r]+)/i);
    let contactName = '';
    if (respMatch && !respMatch[1].includes('Muestreado')) {
        contactName = respMatch[1].replace(/Responsable:\s*/i, '').trim();
    }

    const muestreadoMatch = fullText.match(/Muestreado por:\s*([^\r\n]+)/i);
    let sampledBy = 'MICROLABS';
    if (muestreadoMatch) {
        sampledBy = muestreadoMatch[1].split('Fecha')[0].trim();
    }

    const recMatch = fullText.match(/Fecha de recepci[oó]n:\s*([0-9\/]+)/i);
    const repMatch = fullText.match(/Fecha de reporte:\s*([0-9\/]+)/i);
    const montMatch = fullText.match(/Fecha de montaje:\s*([0-9\/]+)/i);

    const receptionDate = parseDateStr(recMatch ? recMatch[1] : null);
    const reportDate = parseDateStr(repMatch ? repMatch[1] : null);
    const mountingDate = parseDateStr(montMatch ? montMatch[1] : null);

    // Location / Sitio
    const locMatch = fullText.match(/LUGAR:\s*([^\r\n]+)/i);
    const generalLocation = locMatch ? locMatch[1].trim() : '';

    // Split lines
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

    // Find table lines
    const samples = [];
    let currentSample = null;
    let currentCategory = 'ALIMENTOS Y SUPERFICIES';

    const sampleHeaderRegex = /^(\d+\.\s*[A-ZÁÉÍÓÚÑ0-9\s\(\)\:\-\/\.\,]+)/;
    const testLineRegex = /^(Recuento|Coliformes|Escherichia|Salmonella|Listeria|Staphylococcus|Detecci[oó]n|E\s*coli|Pseudomonas|Enterococc|Hongos|Bacillus|Clostridium)/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Section category detection
        if (line === 'SUPERFICIES' || line === 'ALIMENTOS' || line === 'AGUA' || line === 'MANOS' || line === 'AMBIENTE') {
            currentCategory = line;
            continue;
        }

        // Sample item detection (e.g. 1. TABLA DE CORTAR...)
        if (sampleHeaderRegex.test(line)) {
            let sampleTitle = line;
            // peek next line if it's subtitle like "EN USO" or "LIMPIA" or "CENTRO"
            if (i + 1 < lines.length && !testLineRegex.test(lines[i + 1]) && !sampleHeaderRegex.test(lines[i + 1]) && lines[i + 1].length < 40) {
                sampleTitle += ' ' + lines[i + 1];
                i++;
            }

            const matrixInfo = classifyMatrix(sampleTitle + ' ' + currentCategory);
            currentSample = {
                name: sampleTitle,
                matrixType: matrixInfo.matrixType,
                condition: matrixInfo.condition,
                category: matrixInfo.category,
                tests: []
            };
            samples.push(currentSample);
            continue;
        }

        // Test parameter detection
        if (testLineRegex.test(line)) {
            // Examples:
            // "Recuento Total Aeróbico UFC/50cm^2 AOAC 990.12\t1 300"
            // "Salmonella spp MDA2 AOAC2016.01\tNegativo"
            // "Escherichia coli UFC/g AOAC 991.14\t< 10"
            let paramName = line;
            let resultVal = '';
            let unitVal = '';
            let methodVal = '';

            const tabParts = line.split('\t');
            if (tabParts.length >= 2) {
                resultVal = tabParts[1].trim();
                const leftSide = tabParts[0].trim();

                // Check unit
                const unitMatch = leftSide.match(/(UFC\/50cm\^2|UFC\/g|UFC\/mL|NMP\/100mL|UFC\/100mL|NMP\/g|UFC\/placa|UFC\/m\^3)/i);
                if (unitMatch) {
                    unitVal = unitMatch[1].replace(/\^2/g, '²').replace(/\^3/g, '³');
                }

                // Check method
                const methodMatch = leftSide.match(/(AOAC\s*[0-9\.]+|AOAC\s*[A-Z0-9]+|SMEWW\s*[0-9]+[A-Z]*|ISO\s*[0-9\:\-]+)/i);
                if (methodMatch) {
                    methodVal = methodMatch[1];
                }

                // Clean param name
                let cleanP = leftSide;
                if (unitMatch) cleanP = cleanP.replace(unitMatch[0], '');
                if (methodMatch) cleanP = cleanP.replace(methodMatch[0], '');
                paramName = cleanP.trim();
            } else {
                // If on separate lines or space separated
                paramName = line;
            }

            if (!currentSample) {
                const matrixInfo = classifyMatrix(currentCategory);
                currentSample = {
                    name: 'Muestra General',
                    matrixType: matrixInfo.matrixType,
                    condition: matrixInfo.condition,
                    category: matrixInfo.category,
                    tests: []
                };
                samples.push(currentSample);
            }

            // Parse numeric vs text result
            let numVal = null;
            if (resultVal) {
                const cleanNum = resultVal.replace(/\s+/g, '').replace(',', '.');
                const parsed = parseFloat(cleanNum);
                if (!isNaN(parsed) && isFinite(parsed) && !resultVal.startsWith('<') && !resultVal.startsWith('>')) {
                    numVal = parsed;
                }
            }

            currentSample.tests.push({
                parameterName: paramName,
                rawResult: numVal,
                qualitativeResult: numVal === null ? resultVal : null,
                unit: unitVal,
                isoStandardRef: methodVal || 'Compendium APHA / AOAC',
                compliance: (resultVal.toUpperCase().includes('POSITIVO') || resultVal.toUpperCase().includes('NO CONFORME')) ? 'NO_CONFORME' : 'CONFORME'
            });
        }
    }

    return {
        refNumber,
        companyName,
        contactName,
        sampledBy,
        receptionDate,
        mountingDate,
        reportDate,
        generalLocation,
        samples,
        rawPdfPath: filePath
    };
}

async function main() {
    console.log('================================================================');
    console.log('  MIGRACION Y DIFERENCIACION DE REPORTES DE ALIMENTOS / LIMS');
    console.log('================================================================\n');

    // Scan all active desktop company folders
    const targetFolders = [
        'C:/Users/HP LAB/Desktop/TB',
        'C:/Users/HP LAB/Desktop/W',
        'C:/Users/HP LAB/Desktop/TAMBOR',
        'C:/Users/HP LAB/Desktop/COMEDOR DHG',
        'C:/Users/HP LAB/Desktop/Condimentos',
        'C:/Users/HP LAB/Desktop/DE TODO',
        'C:/Users/HP LAB/Desktop/revisar/public/Hi Drive (Clientes)/Alaska'
    ];

    function getPdfFiles(dir) {
        let results = [];
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of list) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                results = results.concat(getPdfFiles(fullPath));
            } else if (item.isFile() && item.name.endsWith('.pdf')) {
                // Match report files (usually numbers like 130650.pdf, or contains report number)
                if (/^\d{5,6}/.test(item.name)) {
                    results.push(fullPath);
                }
            }
        }
        return results;
    }

    let allFiles = [];
    for (const f of targetFolders) {
        allFiles = allFiles.concat(getPdfFiles(f));
    }

    console.log(`Total de archivos PDF de reportes oficiales detectados: ${allFiles.length}\n`);

    let clientsUpserted = 0;
    let samplesUpserted = 0;
    let testsUpserted = 0;
    let reportsUpserted = 0;

    for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        try {
            console.log(`[${i + 1}/${allFiles.length}] Procesando reporte: ${path.basename(file)}...`);
            const repData = await parseFoodPdf(file);
            console.log(` - Empresa: ${repData.companyName}`);
            console.log(` - Código Reporte (RefNumber): ${repData.refNumber}`);
            console.log(` - Muestras detectadas: ${repData.samples.length}`);

        // 1. Upsert CorporateClient
        // Create clean taxId slug if none
        const clientTaxId = 'TAX-' + repData.companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
        const client = await prisma.corporateClient.upsert({
            where: { taxId: clientTaxId },
            update: {
                companyName: repData.companyName,
                contactName: repData.contactName || undefined,
                industrySector: 'Alimentos y Bebidas'
            },
            create: {
                taxId: clientTaxId,
                companyName: repData.companyName,
                contactName: repData.contactName || null,
                industrySector: 'Alimentos y Bebidas'
            }
        });
        clientsUpserted++;

        // 2. Upsert IndustrialContract
        const projectCode = `PRJ-${repData.companyName.substring(0, 4).toUpperCase()}-2026`;
        const contract = await prisma.industrialContract.upsert({
            where: { projectCode },
            update: {
                projectName: `Monitoreo Analítico - ${repData.companyName}`,
                status: 'ACTIVE'
            },
            create: {
                clientId: client.id,
                projectCode,
                projectName: `Monitoreo Analítico - ${repData.companyName}`,
                contractType: 'CONTROL_CALIDAD_LOTE',
                startDate: repData.receptionDate,
                status: 'ACTIVE'
            }
        });

        // 3. Upsert IndustrialSamples & Tests
        let primarySampleId = null;

        for (let sIdx = 0; sIdx < repData.samples.length; sIdx++) {
            const s = repData.samples[sIdx];
            const sampleBarcode = `${repData.refNumber}-${sIdx + 1}`;

            const sample = await prisma.industrialSample.upsert({
                where: { barcode: sampleBarcode },
                update: {
                    matrixType: s.matrixType,
                    lotNumber: s.name.substring(0, 100),
                    samplingProtocol: s.condition || 'MICROLABS_REV03_21',
                    receivedAt: repData.receptionDate,
                    status: 'COMPLETED'
                },
                create: {
                    contractId: contract.id,
                    barcode: sampleBarcode,
                    matrixType: s.matrixType,
                    lotNumber: s.name.substring(0, 100),
                    samplingProtocol: s.condition || 'MICROLABS_REV03_21',
                    receivedAt: repData.receptionDate,
                    status: 'COMPLETED'
                }
            });

            if (sIdx === 0) primarySampleId = sample.id;
            samplesUpserted++;

            // Delete old tests to prevent duplicates on rerun
            await prisma.industrialTest.deleteMany({
                where: { sampleId: sample.id }
            });

            // Insert tests
            for (const t of s.tests) {
                await prisma.industrialTest.create({
                    data: {
                        sampleId: sample.id,
                        category: s.category || 'MICROBIOLOGICAL',
                        parameterName: t.parameterName,
                        isoStandardRef: t.isoStandardRef,
                        quantitativeResult: t.rawResult,
                        qualitativeResult: t.qualitativeResult,
                        specificationLimit: t.unit,
                        compliance: t.compliance
                    }
                });
                testsUpserted++;
            }
        }

        // 4. Upsert Official Report
        await prisma.report.upsert({
            where: { reportNumber: String(repData.refNumber) },
            update: {
                reportType: 'INDUSTRIAL_COA',
                industrialSampleId: primarySampleId,
                status: 'ISSUED',
                pdfUrl: repData.rawPdfPath,
                signedAt: repData.reportDate
            },
            create: {
                reportNumber: String(repData.refNumber),
                reportType: 'INDUSTRIAL_COA',
                industrialSampleId: primarySampleId,
                status: 'ISSUED',
                pdfUrl: repData.rawPdfPath,
                signedAt: repData.reportDate,
                createdAt: repData.reportDate
            }
        });
        reportsUpserted++;
        console.log(` -> Reporte #${repData.refNumber} sincronizado con éxito.\n`);
    } catch (err) {
        console.error(` [ERROR] No se pudo procesar ${path.basename(file)}: ${err.message}\n`);
    }
}

    console.log('================================================================');
    console.log('RESUMEN DE MIGRACION Y CARGA A LIMS:');
    console.log('================================================================');
    console.log(`Empresas Corporativas registradas (CorporateClient): ${clientsUpserted}`);
    console.log(`Muestras Industriales diferenciadas (IndustrialSample): ${samplesUpserted}`);
    console.log(`Ensayos microbiológicos/químicos guardados (IndustrialTest): ${testsUpserted}`);
    console.log(`Informes oficiales vinculados a PDF (Report): ${reportsUpserted}`);
    console.log('================================================================\n');
}

main()
    .catch(e => {
        console.error('Error durante la migración:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
