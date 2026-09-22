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
        textUpper.includes('UTENSILIO') || textUpper.includes('RIEL') || textUpper.includes('BANDA') || textUpper.includes('LINEA CALIENTE') || textUpper.includes('PINZA')) {
        let condition = 'SUPERFICIE_INERTE';
        if (textUpper.includes('LIMPIA') || textUpper.includes('DESINFECTAD') || textUpper.includes('LAVAD') || textUpper.includes('DESPUES') || textUpper.includes('DESPUÉS')) condition = 'SUPERFICIE_LIMPIA';
        else if (textUpper.includes('SUCIA') || textUpper.includes('EN USO') || textUpper.includes('OPERACIONAL') || textUpper.includes('ANTES')) condition = 'SUPERFICIE_SUCIA';
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
    // 1. DD/MM/YYYY or DD/MM/YY
    if (str.includes('/')) {
        const parts = str.trim().split('/');
        if (parts.length === 3) {
            let year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[0], 10);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                return new Date(Date.UTC(year, month, day, 12, 0, 0));
            }
        }
    }
    // 2. DD-Mon-YYYY (e.g. 25-Mar-2019)
    const monthMap = {
        ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
        jul: 6, ago: 7, set: 8, sep: 8, oct: 9, nov: 10, dic: 11
    };
    const mMatch = str.match(/(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})/);
    if (mMatch) {
        const day = parseInt(mMatch[1], 10);
        const mKey = mMatch[2].toLowerCase().substring(0, 3);
        const month = monthMap[mKey] !== undefined ? monthMap[mKey] : 0;
        const year = parseInt(mMatch[3], 10);
        return new Date(Date.UTC(year, month, day, 12, 0, 0));
    }
    return new Date();
}

async function parseFoodPdf(filePath, fallbackCompanyName) {
    const parser = new PDFParse({ url: filePath });
    const res = await parser.getText();
    const fullText = res.text;

    // Header extraction
    let refMatch = fullText.match(/C[oó]digo de reporte:\s*(\d+)/i);
    let refNumber = refMatch ? refMatch[1].trim() : null;
    if (!refNumber) {
        const baseNameMatch = path.basename(filePath).match(/^(\d{4,7})/);
        refNumber = baseNameMatch ? baseNameMatch[1] : path.basename(filePath, '.pdf');
    }

    const empMatch = fullText.match(/Empresa solicitante:\s*([^\n\r]+)/i);
    let companyName = empMatch ? empMatch[1].trim() : fallbackCompanyName;
    if (!companyName || companyName === 'N/A' || companyName.length < 3) {
        companyName = fallbackCompanyName;
    }

    const respMatch = fullText.match(/Empresa solicitante:[^\n\r]+[\r\n]+([^\n\r]+)/i);
    let contactName = '';
    if (respMatch && !respMatch[1].includes('Muestreado') && !respMatch[1].includes('Fecha')) {
        contactName = respMatch[1].replace(/Responsable:\s*/i, '').trim();
    }

    const muestreadoMatch = fullText.match(/Muestreado por:\s*([^\r\n]+)/i);
    let sampledBy = 'MICROLABS';
    if (muestreadoMatch) {
        sampledBy = muestreadoMatch[1].split('Fecha')[0].trim();
    }

    const recMatch = fullText.match(/(?:Fecha de recepci[oó]n|Fecha de muestreo):\s*([^\r\n\t]+)/i);
    const repMatch = fullText.match(/Fecha de reporte:\s*([^\r\n\t]+)/i);
    const montMatch = fullText.match(/Fecha de montaje:\s*([^\r\n\t]+)/i);

    const receptionDate = parseDateStr(recMatch ? recMatch[1] : null);
    const reportDate = parseDateStr(repMatch ? repMatch[1] : null);
    const mountingDate = parseDateStr(montMatch ? montMatch[1] : null);

    const locMatch = fullText.match(/(?:LUGAR|LOCAL):\s*([^\r\n]+)/i);
    const generalLocation = locMatch ? locMatch[1].trim() : '';

    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

    const samples = [];
    let currentSample = null;
    let currentCategory = 'ALIMENTOS Y SUPERFICIES';

    const sampleHeaderRegex = /(?:ANTES|DESPU[EÉ]S|\b)\s*(\d+\.\s*[A-ZÁÉÍÓÚÑ0-9\s\(\)\:\-\/\.\,]+)/i;
    const testLineRegex = /^(Recuento|Coliformes|Escherichia|Salmonella|Listeria|Staphylococcus|Detecci[oó]n|E\s*coli|Pseudomonas|Enterococc|Hongos|Bacillus|Clostridium)/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line === 'SUPERFICIES' || line === 'ALIMENTOS' || line === 'AGUA' || line === 'MANOS' || line === 'AMBIENTE') {
            currentCategory = line;
            continue;
        }

        const sMatch = line.match(sampleHeaderRegex);
        if (sMatch && !testLineRegex.test(line)) {
            let sampleTitle = line;
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

        if (testLineRegex.test(line)) {
            let paramName = line;
            let resultVal = '';
            let unitVal = '';
            let methodVal = '';

            const tabParts = line.split('\t');
            if (tabParts.length >= 2) {
                resultVal = tabParts[tabParts.length - 1].trim();
                const leftSide = tabParts.slice(0, tabParts.length - 1).join(' ').trim();

                const unitMatch = leftSide.match(/(UFC\/50cm\^2|UFC\/g|UFC\/mL|NMP\/100mL|UFC\/100mL|NMP\/g|UFC\/placa|UFC\/m\^3)/i);
                if (unitMatch) {
                    unitVal = unitMatch[1].replace(/\^2/g, '²').replace(/\^3/g, '³');
                }

                const methodMatch = leftSide.match(/(AOAC\s*[0-9\.]+|AOAC\s*[A-Z0-9]+|SMEWW\s*[0-9]+[A-Z]*|ISO\s*[0-9\:\-]+)/i);
                if (methodMatch) {
                    methodVal = methodMatch[1];
                }

                let cleanP = leftSide;
                if (unitMatch) cleanP = cleanP.replace(unitMatch[0], '');
                if (methodMatch) cleanP = cleanP.replace(methodMatch[0], '');
                paramName = cleanP.trim();
            } else {
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

function getPdfsRecursive(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    try {
        const list = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of list) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                results = results.concat(getPdfsRecursive(fullPath));
            } else if (item.isFile() && item.name.toLowerCase().endsWith('.pdf')) {
                if (/^\d{4,7}/.test(item.name)) {
                    results.push(fullPath);
                }
            }
        }
    } catch(e) {}
    return results;
}

async function runMigration() {
    console.log('================================================================');
    console.log('  MIGRACIÓN MASIVA DE CLIENTES - HI DRIVE (CLIENTES) -> LIMS');
    console.log('================================================================\n');

    const baseDir = 'C:/Users/HP LAB/Desktop/revisar/public/Hi Drive (Clientes)';
    if (!fs.existsSync(baseDir)) {
        console.error('No se encontró el directorio base:', baseDir);
        process.exit(1);
    }

    let targetCompanies = null;
    const compArg = process.argv.find(a => a.startsWith('--companies='));
    const limitArg = process.argv.find(a => a.startsWith('--limit='));
    const maxPerCompany = limitArg ? parseInt(limitArg.split('=')[1], 10) : 5000;

    if (compArg) {
        targetCompanies = compArg.split('=')[1].split(',').map(s => s.trim().toLowerCase());
        console.log('Filtro de empresas solicitado:', targetCompanies);
    }

    const existing = await prisma.report.findMany({ select: { reportNumber: true } });
    const existingReportNumbers = new Set(existing.map(r => r.reportNumber));
    console.log(`Reportes actualmente existentes en la base de datos: ${existingReportNumbers.size}\n`);

    const allCompanyDirs = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);

    let selectedDirs = allCompanyDirs;
    if (targetCompanies) {
        selectedDirs = allCompanyDirs.filter(d => targetCompanies.some(t => d.toLowerCase().includes(t)));
    }

    console.log(`Total de empresas seleccionadas para procesar: ${selectedDirs.length}\n`);

    let totalReportsNew = 0;
    let totalSamplesNew = 0;
    let totalTestsNew = 0;
    let companiesProcessed = 0;

    for (const compDir of selectedDirs) {
        companiesProcessed++;
        const fullDirPath = path.join(baseDir, compDir);
        const pdfFiles = getPdfsRecursive(fullDirPath);

        if (pdfFiles.length === 0) continue;

        const pendingFiles = pdfFiles.filter(f => {
            const baseMatch = path.basename(f).match(/^(\d{4,7})/);
            const ref = baseMatch ? baseMatch[1] : path.basename(f, '.pdf');
            return !existingReportNumbers.has(ref);
        }).slice(0, maxPerCompany);

        console.log(`[${companiesProcessed}/${selectedDirs.length}] 🏢 Empresa: "${compDir}" | Total PDFs: ${pdfFiles.length} | Pendientes: ${pendingFiles.length}`);

        if (pendingFiles.length === 0) {
            console.log(`   -> Todo al día, saltando.\n`);
            continue;
        }

        let compReports = 0;

        for (let i = 0; i < pendingFiles.length; i++) {
            const file = pendingFiles[i];
            try {
                const repData = await parseFoodPdf(file, compDir);
                if (!repData.refNumber) continue;

                if (existingReportNumbers.has(String(repData.refNumber))) continue;

                // 1. Upsert CorporateClient
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

                // 2. Upsert IndustrialContract
                const projectCode = `PRJ-${repData.companyName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-2026`;
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

                if (repData.samples.length === 0) {
                    // Fallback sample if no items separated
                    repData.samples.push({
                        name: `Lote General ${repData.refNumber}`,
                        matrixType: 'Alimento Procesado',
                        condition: 'ALIMENTO',
                        category: 'MICROBIOLOGICAL',
                        tests: []
                    });
                }

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
                    totalSamplesNew++;

                    // Insert tests
                    for (const t of s.tests) {
                        await prisma.industrialTest.create({
                            data: {
                                sampleId: sample.id,
                                category: s.category || 'MICROBIOLOGICAL',
                                parameterName: t.parameterName.substring(0, 190),
                                isoStandardRef: t.isoStandardRef,
                                quantitativeResult: t.rawResult,
                                qualitativeResult: t.qualitativeResult,
                                specificationLimit: t.unit,
                                compliance: t.compliance
                            }
                        });
                        totalTestsNew++;
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

                existingReportNumbers.add(String(repData.refNumber));
                compReports++;
                totalReportsNew++;

                if (compReports % 15 === 0 || i === pendingFiles.length - 1) {
                    console.log(`   [Progreso ${compDir}] ${i + 1}/${pendingFiles.length} reportes procesados (${compReports} nuevos guardados).`);
                }

            } catch (err) {
                console.error(`   [AVISO] No se pudo procesar ${path.basename(file)}: ${err.message}`);
            }
        }
        console.log(`   ✅ Finalizado "${compDir}": ${compReports} nuevos reportes guardados.\n`);
    }

    console.log('\n================================================================');
    console.log('RESUMEN GENERAL DE LA MIGRACIÓN:');
    console.log('================================================================');
    console.log(`Nuevos Informes Oficiales Registrados: ${totalReportsNew}`);
    console.log(`Nuevas Muestras Industriales Creadas: ${totalSamplesNew}`);
    console.log(`Nuevos Ensayos Analíticos Guardados: ${totalTestsNew}`);
    console.log(`Total acumulado de reportes en LIMS: ${existingReportNumbers.size}`);
    console.log('================================================================\n');
}

runMigration()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
