const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const prisma = new PrismaClient();

// Sufijos y palabras clave de clasificación
const CORPORATE_SUFFIXES = [
    'S.A.', 'SA', 'S.R.L.', 'SRL', 'LTDA', 'LIMITADA', 'CORP', 'CORPORACION',
    'INC', 'LLC', 'INVERSIONES', 'GRUPO', 'HOLDING', 'CIA', 'COMPAÑIA', 'COMPANIA'
];

const CORPORATE_KEYWORDS = [
    'HOTEL', 'RESORT', 'RESTAURANT', 'RESTAURANTE', 'SODA', 'CAFETERIA', 'BAR',
    'ALIMENTOS', 'ALIMENTARIA', 'AGRO', 'AGROPECUARIA', 'AGRICOLA', 'CARNICERIA',
    'CARNES', 'EMBUTIDOS', 'POLLO', 'POLLERIA', 'PESCADOS', 'MARISCOS', 'PANADERIA',
    'PASTELERIA', 'LACTEOS', 'QUESOS', 'LECHE', 'HELADOS', 'BEBIDAS', 'EMBOTELLADORA',
    'AGUA', 'AGUAS', 'ASADA', 'ACUEDUCTO', 'MUNICIPALIDAD', 'CONDOMINIO', 'CLUB',
    'FABRICA', 'INDUSTRIA', 'INDUSTRIAL', 'DISTRIBUIDORA', 'COMERCIALIZADORA',
    'EXPORTADORA', 'IMPORTADORA', 'SUPERMERCADO', 'ABASTECEDOR', 'PULPERIA',
    'LABORATORIO', 'FARMACEUTICA', 'CLINICA', 'HOSPITAL', 'COOPE', 'COOPERATIVA',
    'FINCA', 'AVICOLA', 'PORCINA', 'FRUTAS', 'VEGETALES', 'LEGUMBRES', 'PROCESADORA',
    'PACKING', 'SERVICIOS', 'LOGISTICA', 'CATERING', 'DELI', 'GOURMET', 'HIELO'
];

const CLINICAL_TEST_KEYWORDS = [
    'COPROCULTIVO', 'UROCULTIVO', 'HEMOGRAMA', 'EXUDADO', 'FROTIS', 'ANTIBIOGRAMA',
    'KOH', 'ORINA', 'HECES', 'SANGRE', 'PARASITOLOGICO', 'ESPUTO', 'BIOQUIMICA',
    'GLUCOSA', 'COLESTEROL', 'TRIGLICERIDOS', 'CREATININA', 'UREA', 'ACIDO URICO',
    'PERFIL LIPIDICO', 'HORMONAS', 'TIROIDES', 'TSH', 'T3', 'T4', 'ANTIGENO'
];

function classifyClient(name, template = '', testNames = []) {
    if (!name || typeof name !== 'string') {
        return { entityType: 'COMPANY', sector: 'Alimentos y Bebidas' };
    }
    const clean = name.trim().toUpperCase();
    const testsUpper = (testNames || []).map(t => (t || '').toUpperCase());

    const hasClinicalTests = testsUpper.some(t => 
        CLINICAL_TEST_KEYWORDS.some(k => t.includes(k))
    );
    if (hasClinicalTests) {
        return { entityType: 'PATIENT', sector: 'Microbiología Clínica y Salud Humana' };
    }

    if (clean.includes('CLINIC') || clean.includes('PACIENTE') || clean.includes('HUMAN')) {
        return { entityType: 'PATIENT', sector: 'Microbiología Clínica y Salud Humana' };
    }

    for (const suffix of CORPORATE_SUFFIXES) {
        const regex = new RegExp(`\\b${suffix}\\b`, 'i');
        if (regex.test(clean)) {
            return { entityType: 'COMPANY', sector: detectIndustrySector(clean) };
        }
    }

    for (const kw of CORPORATE_KEYWORDS) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(clean)) {
            return { entityType: 'COMPANY', sector: detectIndustrySector(clean) };
        }
    }

    const words = clean.split(/\s+/).filter(Boolean);
    const hasNumbers = /\d/.test(clean);
    if (words.length >= 2 && words.length <= 4 && !hasNumbers) {
        return { entityType: 'PATIENT', sector: 'Paciente Individual / Consulta Privada' };
    }

    return { entityType: 'COMPANY', sector: detectIndustrySector(clean) };
}

function detectIndustrySector(nameUpper) {
    if (nameUpper.includes('HOTEL') || nameUpper.includes('RESORT')) return 'Hotelería y Turismo';
    if (nameUpper.includes('RESTAURANT') || nameUpper.includes('SODA') || nameUpper.includes('CATERING') || nameUpper.includes('BAR')) return 'Restaurantes y Servicios Gastronómicos';
    if (nameUpper.includes('AGUA') || nameUpper.includes('ASADA') || nameUpper.includes('ACUEDUCTO') || nameUpper.includes('PISCINA')) return 'Aguas y Recursos Hídricos';
    if (nameUpper.includes('HIELO')) return 'Plantas de Hielo y Frío';
    if (nameUpper.includes('CARNE') || nameUpper.includes('POLLO') || nameUpper.includes('PESCADO') || nameUpper.includes('EMBUTIDO')) return 'Industria Cárnica y Avícola';
    if (nameUpper.includes('LACTEO') || nameUpper.includes('QUESO') || nameUpper.includes('LECHE')) return 'Industria Láctea';
    if (nameUpper.includes('PANADERIA') || nameUpper.includes('PASTEL') || nameUpper.includes('HARINA')) return 'Panificación y Repostería';
    if (nameUpper.includes('FARMACEUTICA') || nameUpper.includes('LABORATORIO')) return 'Industria Farmacéutica y Cosmética';
    if (nameUpper.includes('AGRO') || nameUpper.includes('FINCA') || nameUpper.includes('FRUTA') || nameUpper.includes('VEGETAL')) return 'Agroindustria y Exportación';
    if (nameUpper.includes('SUPERMERCADO') || nameUpper.includes('COMERCIAL')) return 'Comercio y Distribución Masiva';
    return 'Alimentos Procesados y Bebidas';
}

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

    const recMatch = fullText.match(/(?:Fecha de recepci[oó]n|Fecha de muestreo):\s*([^\r\n\t]+)/i);
    const repMatch = fullText.match(/Fecha de reporte:\s*([^\r\n\t]+)/i);
    const receptionDate = parseDateStr(recMatch ? recMatch[1] : null);
    const reportDate = parseDateStr(repMatch ? repMatch[1] : null);

    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
    const samples = [];
    let currentSample = null;
    let currentCategory = 'ALIMENTOS Y SUPERFICIES';

    const sampleHeaderRegex = /(?:ANTES|DESPU[EÉ]S|\b)\s*(\d+\.\s*[A-ZÁÉÍÓÚÑ0-9\s\(\)\:\-\/\.\,]+)/i;
    const testLineRegex = /^(Recuento|Coliformes|Escherichia|Salmonella|Listeria|Staphylococcus|Detecci[oó]n|E\s*coli|Pseudomonas|Enterococc|Hongos|Bacillus|Clostridium|Tiempo de Protrombina|Hemograma|Orina|Heces)/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (['SUPERFICIES', 'ALIMENTOS', 'AGUA', 'MANOS', 'AMBIENTE'].includes(line)) {
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
                isoStandardRef: methodVal || 'Compendio Normativo Microlabs',
                compliance: (resultVal.toUpperCase().includes('POSITIVO') || resultVal.toUpperCase().includes('NO CONFORME')) ? 'NO_CONFORME' : 'CONFORME'
            });
        }
    }

    return {
        refNumber,
        companyName,
        contactName,
        receptionDate,
        reportDate,
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

async function runFullMigration() {
    console.log('================================================================');
    console.log('  MIGRACIÓN INTEGRAL HI DRIVE (209 CARPETAS - PACIENTES Y EMPRESAS)');
    console.log('================================================================\n');

    const baseDir = 'C:/Users/HP LAB/Desktop/revisar/public/Hi Drive (Clientes)';
    if (!fs.existsSync(baseDir)) {
        console.error('No se encontró el directorio base:', baseDir);
        process.exit(1);
    }

    const limitPerCompanyArg = process.argv.find(a => a.startsWith('--limit='));
    const maxPerCompany = limitPerCompanyArg ? parseInt(limitPerCompanyArg.split('=')[1], 10) : 500;

    const existing = await prisma.report.findMany({ select: { reportNumber: true } });
    const existingReportNumbers = new Set(existing.map(r => r.reportNumber));
    console.log(`Reportes actualmente existentes en la base de datos: ${existingReportNumbers.size}`);

    const allDirs = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);

    console.log(`Total de carpetas en Hi Drive: ${allDirs.length}\n`);

    let stats = {
        foldersProcessed: 0,
        totalNewReports: 0,
        companiesCreated: 0,
        patientsCreated: 0,
        totalSamplesCreated: 0,
        totalTestsCreated: 0,
        errors: 0
    };

    for (let dIdx = 0; dIdx < allDirs.length; dIdx++) {
        const compDir = allDirs[dIdx];
        stats.foldersProcessed++;
        const fullDirPath = path.join(baseDir, compDir);
        const pdfFiles = getPdfsRecursive(fullDirPath);

        if (pdfFiles.length === 0) continue;

        const pendingFiles = pdfFiles.filter(f => {
            const baseMatch = path.basename(f).match(/^(\d{4,7})/);
            const ref = baseMatch ? baseMatch[1] : path.basename(f, '.pdf');
            return !existingReportNumbers.has(ref);
        }).slice(0, maxPerCompany);

        if (pendingFiles.length === 0) {
            continue; // Todo migrado para esta carpeta
        }

        console.log(`[${stats.foldersProcessed}/${allDirs.length}] 📁 Procesando "${compDir}" (${pendingFiles.length} pendientes de ${pdfFiles.length} PDFs)...`);

        let folderNew = 0;

        for (const file of pendingFiles) {
            try {
                const repData = await parseFoodPdf(file, compDir);
                if (!repData.refNumber || existingReportNumbers.has(String(repData.refNumber))) continue;

                // Extraer lista de ensayos para la clasificación
                const allTestNames = [];
                repData.samples.forEach(s => s.tests.forEach(t => allTestNames.push(t.parameterName)));

                // Clasificar Paciente vs Empresa
                const classification = classifyClient(repData.companyName, '', allTestNames);

                if (classification.entityType === 'PATIENT') {
                    // =========================================================
                    // RUTA PACIENTE CLÍNICO
                    // =========================================================
                    const nameParts = repData.companyName.split(/\s+/);
                    const firstName = nameParts[0] || 'Paciente';
                    const lastName = nameParts.slice(1).join(' ') || 'Sin Apellido';
                    const uniqueId = `PAC-${repData.companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20)}`;

                    const patient = await prisma.patient.upsert({
                        where: { uniqueId },
                        update: { firstName, lastName },
                        create: { uniqueId, firstName, lastName }
                    });
                    stats.patientsCreated++;

                    const sampleBarcode = `CLI-${repData.refNumber}`;
                    const clinicalSample = await prisma.clinicalSample.upsert({
                        where: { barcode: sampleBarcode },
                        update: {
                            sampleType: repData.samples[0]?.matrixType || 'Muestra Biológica',
                            receivedAt: repData.receptionDate,
                            status: 'COMPLETED'
                        },
                        create: {
                            patientId: patient.id,
                            barcode: sampleBarcode,
                            sampleType: repData.samples[0]?.matrixType || 'Muestra Biológica',
                            receivedAt: repData.receptionDate,
                            status: 'COMPLETED'
                        }
                    });

                    let order = await prisma.clinicalOrder.findFirst({
                        where: { sampleId: clinicalSample.id }
                    });
                    if (!order) {
                        order = await prisma.clinicalOrder.create({
                            data: {
                                sampleId: clinicalSample.id,
                                status: 'VALIDATED'
                            }
                        });
                    }

                    for (const s of repData.samples) {
                        for (const t of s.tests) {
                            await prisma.clinicalTest.create({
                                data: {
                                    orderId: order.id,
                                    testCode: t.parameterName.substring(0, 30).toUpperCase().replace(/[^A-Z0-9]/g, '_'),
                                    testName: t.parameterName.substring(0, 190),
                                    rawResult: t.rawResult,
                                    calculatedResult: t.rawResult,
                                    unit: t.unit,
                                    appliedReferenceRange: t.isoStandardRef,
                                    flag: t.compliance === 'NO_CONFORME' ? 'CRITICAL' : 'NORMAL',
                                    status: 'VALIDATED'
                                }
                            });
                            stats.totalTestsCreated++;
                        }
                    }

                    await prisma.report.upsert({
                        where: { reportNumber: String(repData.refNumber) },
                        update: {
                            reportType: 'CLINICAL_HUMAN',
                            clinicalOrderId: order.id,
                            status: 'ISSUED',
                            pdfUrl: repData.rawPdfPath,
                            signedAt: repData.reportDate
                        },
                        create: {
                            reportNumber: String(repData.refNumber),
                            reportType: 'CLINICAL_HUMAN',
                            clinicalOrderId: order.id,
                            status: 'ISSUED',
                            pdfUrl: repData.rawPdfPath,
                            signedAt: repData.reportDate,
                            createdAt: repData.reportDate
                        }
                    });

                } else {
                    // =========================================================
                    // RUTA EMPRESA INDUSTRIAL (COA)
                    // =========================================================
                    const clientTaxId = 'TAX-' + repData.companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
                    const client = await prisma.corporateClient.upsert({
                        where: { taxId: clientTaxId },
                        update: {
                            companyName: repData.companyName,
                            contactName: repData.contactName || undefined,
                            industrySector: classification.sector
                        },
                        create: {
                            taxId: clientTaxId,
                            companyName: repData.companyName,
                            contactName: repData.contactName || null,
                            industrySector: classification.sector
                        }
                    });
                    stats.companiesCreated++;

                    const projectCode = `PRJ-${repData.companyName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-HIST`;
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

                    let primarySampleId = null;
                    if (repData.samples.length === 0) {
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
                        stats.totalSamplesCreated++;

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
                            stats.totalTestsCreated++;
                        }
                    }

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
                }

                existingReportNumbers.add(String(repData.refNumber));
                folderNew++;
                stats.totalNewReports++;

            } catch (err) {
                stats.errors++;
            }
        }

        if (folderNew > 0) {
            console.log(`   ✅ "${compDir}": ${folderNew} nuevos informes guardados (Total acumulado: ${stats.totalNewReports}).`);
        }
    }

    console.log('\n================================================================');
    console.log('RESUMEN DE MIGRACIÓN HISTÓRICA:');
    console.log('================================================================');
    console.log(`Carpetas exploradas: ${stats.foldersProcessed}`);
    console.log(`Nuevos Informes Registrados: ${stats.totalNewReports}`);
    console.log(`Nuevos Pacientes Clínicos: ${stats.patientsCreated}`);
    console.log(`Nuevas Empresas Industriales: ${stats.companiesCreated}`);
    console.log(`Nuevas Muestras Totales: ${stats.totalSamplesCreated}`);
    console.log(`Nuevos Ensayos Totales: ${stats.totalTestsCreated}`);
    console.log(`Total acumulado de informes en LIMS: ${existingReportNumbers.size}`);
    console.log('================================================================\n');
}

runFullMigration()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
