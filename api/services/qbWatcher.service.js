import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { classifyClient, detectIndustrySector } from './clientClassifier.service.js';
import { QbNormalizerService } from './qbNormalizer.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

let isSyncing = false;
let lastSyncTimestamp = null;
let lastSyncStats = {
    processed: 0,
    patients: 0,
    companies: 0,
    tests: 0,
    errors: 0,
    lastError: null
};

/**
 * Ejecuta el script PowerShell de extracción de Estimates de QuickBooks
 */
function runFetchEstimatesScript({ maxReturned = 500, fromTxnDate = '2024-01-01', refNumber = '' } = {}) {
    return new Promise((resolve, reject) => {
        const vbsScript = path.resolve(__dirname, '../../scripts/run_silent_estimates.vbs');
        const outputFile = path.resolve(__dirname, '../../scripts/qb_estimates_latest.json');

        const vbsArgs = [
            '//nologo',
            vbsScript,
            String(maxReturned),
            String(fromTxnDate || ''),
            String(refNumber || ''),
            outputFile
        ];

        // Se invoca mediante wscript.exe (subsistema WINDOWS) para garantizar 
        // 0% de parpadeo o apertura de ventanas negras de consola en pantalla.
        execFile('wscript.exe', vbsArgs, { 
            timeout: 90000, 
            windowsHide: true,
            maxBuffer: 10 * 1024 * 1024 
        }, (error, _stdout, _stderr) => {
            if (error) {
                // Fallback de contingencia en caso de que WSH esté restringido
                const psScript = path.resolve(__dirname, '../../scripts/fetch_qb_estimates.ps1');
                const psArgs = [
                    '-NoProfile',
                    '-NonInteractive',
                    '-WindowStyle', 'Hidden',
                    '-ExecutionPolicy', 'Bypass',
                    '-File', psScript,
                    '-MaxReturned', String(maxReturned),
                    '-OutputFile', outputFile
                ];
                if (fromTxnDate) psArgs.push('-FromTxnDate', String(fromTxnDate));
                if (refNumber) psArgs.push('-RefNumber', String(refNumber));

                return execFile('powershell.exe', psArgs, {
                    timeout: 60000,
                    windowsHide: true,
                    maxBuffer: 10 * 1024 * 1024
                }, (psErr, psStdout, psStderr) => {
                    if (psErr) {
                        return reject(new Error(`Error ejecutando PowerShell QB: ${psErr.message} - ${psStderr}`));
                    }
                    parseOutput();
                });
            }

            parseOutput();

            function parseOutput() {
                if (!fs.existsSync(outputFile)) {
                    return reject(new Error('El archivo de salida qb_estimates_latest.json no fue generado.'));
                }
                try {
                    let raw = fs.readFileSync(outputFile, 'utf8');
                    raw = raw.replace(/^\uFEFF/, '').trim();
                    const data = JSON.parse(raw);
                    resolve(data);
                } catch (err) {
                    reject(new Error(`Error parseando JSON de QB estimates: ${err.message}`));
                }
            }
        });
    });
}

/**
 * Deduce metadatos clínicos (Unidad, Rango, Alerta) para ensayos humanos
 */
function deriveClinicalTestMeta(testName = '', desc = '', rawNum = null) {
    const tLower = testName.toLowerCase();
    const dStr = (desc || '').trim();

    let unit = 'mg/dL';
    let refRange = '< 200';
    let technicalNotes = 'Química Clínica';

    if (tLower.includes('vitamina d') || tLower.includes('25-oh')) {
        unit = 'ng/mL';
        refRange = '30.0 - 100.0 (Niveles Óptimos)';
        technicalNotes = 'Metodología: X3 CLIA';
    } else if (tLower.includes('hdl') && !tLower.includes('no-hdl')) {
        unit = 'mg/dL';
        refRange = '> 35';
        technicalNotes = 'Metodología: NX600';
    } else if (tLower.includes('ldl') && !tLower.includes('ldl/hdl')) {
        unit = 'mg/dL';
        refRange = '< 130';
        technicalNotes = 'Metodología: NX600';
    } else if (tLower.includes('ldl/hdl') || tLower.includes('ct/hdl') || tLower.includes('relacion') || tLower.includes('ratio')) {
        unit = 'Índice';
        refRange = tLower.includes('ldl/hdl') ? '< 3.5' : '< 4.5';
        technicalNotes = 'Cálculo de Riesgo Coronario';
    } else if (tLower.includes('no-hdl') || tLower.includes('no_hdl')) {
        unit = 'mg/dL';
        refRange = '< 130';
        technicalNotes = 'Evaluación de Riesgo Aterogénico';
    } else if (tLower.includes('triglic')) {
        unit = 'mg/dL';
        refRange = '< 150';
        technicalNotes = 'Metodología: NX600';
    } else if (tLower.includes('vldl')) {
        unit = 'mg/dL';
        refRange = '10 - 50';
        technicalNotes = 'Cálculo Friedewald';
    } else if (tLower.includes('glucosa')) {
        unit = 'mg/dL';
        refRange = '70 - 100';
        technicalNotes = 'Metodología: NX600';
    } else if (tLower.includes('creatinina')) {
        unit = 'mg/dL';
        refRange = '0.5 - 1.2';
        technicalNotes = 'Metodología: NX600';
    } else if (tLower.includes('acido urico') || tLower.includes('úrico')) {
        unit = 'mg/dL';
        refRange = '2.4 - 6.0';
        technicalNotes = 'Metodología: NX600';
    } else if (tLower.includes('hemoglobina') || tLower.includes('hb')) {
        unit = 'g/dL';
        refRange = '12.0 - 16.0';
        technicalNotes = 'Automatizado Hematología';
    }

    if (dStr && (dStr.includes('<') || dStr.includes('>') || dStr.includes('-'))) {
        refRange = dStr;
    }

    let flag = 'NORMAL';
    if (typeof rawNum === 'number' && !isNaN(rawNum)) {
        if (refRange.startsWith('<')) {
            const max = parseFloat(refRange.replace('<', '').trim());
            if (!isNaN(max) && rawNum > max) flag = 'HIGH';
        } else if (refRange.startsWith('>')) {
            const min = parseFloat(refRange.replace('>', '').trim());
            if (!isNaN(min) && rawNum < min) flag = 'LOW';
        } else if (refRange.includes('-')) {
            const parts = refRange.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
            if (parts.length === 2) {
                if (rawNum < parts[0]) flag = 'LOW';
                else if (rawNum > parts[1]) flag = 'HIGH';
            }
        }
    }

    return { unit, refRange, flag, technicalNotes };
}

/**
 * Ingiere un arreglo de estimaciones directamente en la base de datos de LIMS
 */
export async function ingestEstimatesArray(estimates = []) {
    const stats = {
        processed: 0,
        patients: 0,
        companies: 0,
        tests: 0,
        errors: 0,
        lastError: null
    };

    console.log(`[QB-INGEST] Procesando ${estimates.length} estimaciones hacia la base de datos...`);

    try {
        for (const est of estimates) {
            try {
                if (!est.CustomerName || !est.RefNumber) continue;

                const clientName = est.CustomerName.trim();
                const testNames = (est.Lines || []).map(l => l.ItemName || l.Desc || '').filter(Boolean);
                const classification = classifyClient(clientName, '', testNames);

                const txnDate = est.TxnDate ? new Date(est.TxnDate) : new Date();
                const reportNumber = String(est.RefNumber).trim();

                if (classification.entityType === 'PATIENT') {
                    // =========================================================
                    // MÓDULO PACIENTE CLÍNICO
                    // =========================================================
                    const nameParts = clientName.split(/\s+/);
                    const firstName = nameParts[0] || 'Paciente';
                    const lastName = nameParts.slice(1).join(' ') || 'Sin Apellido';
                    
                    const uniqueId = est.CustomFields?.['ID'] || est.CustomFields?.['Cédula'] || est.CustomFields?.['Cedula'] 
                        || `PAC-${clientName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20)}`;

                    const patient = await prisma.patient.upsert({
                        where: { uniqueId },
                        update: { firstName, lastName },
                        create: {
                            uniqueId,
                            firstName,
                            lastName
                        }
                    });

                    const sampleBarcode = `CLI-${est.RefNumber}`;
                    const clinicalSample = await prisma.clinicalSample.upsert({
                        where: { barcode: sampleBarcode },
                        update: {
                            sampleType: 'Suero Sanguíneo',
                            receivedAt: txnDate,
                            status: 'COMPLETED'
                        },
                        create: {
                            patientId: patient.id,
                            barcode: sampleBarcode,
                            sampleType: 'Suero Sanguíneo',
                            receivedAt: txnDate,
                            status: 'COMPLETED'
                        }
                    });

                    // Upsert Clinical Order
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

                    // Clinical Tests
                    for (const line of (est.Lines || [])) {
                        const tName = (line.ItemName || line.Desc || 'Ensayo Clínico').substring(0, 190);
                        const tCode = tName.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30);
                        const valObj = QbNormalizerService.parseResult(line.Amount || line.Rate || line.Quantity);
                        const meta = deriveClinicalTestMeta(tName, line.Desc, valObj.numVal);

                        let existingTest = await prisma.clinicalTest.findFirst({
                            where: { orderId: order.id, testCode: tCode || 'TEST' }
                        });

                        if (!existingTest) {
                            await prisma.clinicalTest.create({
                                data: {
                                    orderId: order.id,
                                    testCode: tCode || 'TEST',
                                    testName: tName,
                                    rawResult: valObj.numVal,
                                    calculatedResult: valObj.numVal,
                                    unit: meta.unit,
                                    appliedReferenceRange: meta.refRange,
                                    flag: meta.flag,
                                    technicalNotes: meta.technicalNotes,
                                    status: 'VALIDATED'
                                }
                            });
                            stats.tests++;
                        }
                    }

                    // Upsert Report
                    await prisma.report.upsert({
                        where: { reportNumber },
                        update: {
                            reportType: 'CLINICAL',
                            clinicalOrderId: order.id,
                            status: 'ISSUED',
                            signedAt: txnDate
                        },
                        create: {
                            reportNumber,
                            reportType: 'CLINICAL',
                            clinicalOrderId: order.id,
                            status: 'ISSUED',
                            signedAt: txnDate,
                            createdAt: txnDate
                        }
                    });

                    stats.patients++;
                } else {
                    // =========================================================
                    // MÓDULO EMPRESA INDUSTRIAL (COA)
                    // =========================================================
                    const taxId = `TAX-${clientName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15)}`;
                    const sector = classification.sector || detectIndustrySector(clientName.toUpperCase());

                    const client = await prisma.corporateClient.upsert({
                        where: { taxId },
                        update: {
                            companyName: clientName,
                            industrySector: sector
                        },
                        create: {
                            taxId,
                            companyName: clientName,
                            industrySector: sector
                        }
                    });

                    const projectCode = `PRJ-${clientName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}-QB`;
                    const contract = await prisma.industrialContract.upsert({
                        where: { projectCode },
                        update: {
                            projectName: `Control Analítico - ${clientName}`,
                            status: 'ACTIVE'
                        },
                        create: {
                            clientId: client.id,
                            projectCode,
                            projectName: `Control Analítico - ${clientName}`,
                            contractType: 'CONTROL_CALIDAD_LOTE',
                            startDate: txnDate,
                            status: 'ACTIVE'
                        }
                    });

                    const sampleBarcode = `IND-EST-${est.RefNumber}`;
                    const matrixInfo = QbNormalizerService.classifyMatrix(testNames.join(' '));

                    const sample = await prisma.industrialSample.upsert({
                        where: { barcode: sampleBarcode },
                        update: {
                            matrixType: matrixInfo.matrixType,
                            lotNumber: `Estimado QB #${est.RefNumber}`,
                            samplingProtocol: matrixInfo.condition || 'RTCA / ISO',
                            receivedAt: txnDate,
                            status: 'COMPLETED'
                        },
                        create: {
                            contractId: contract.id,
                            barcode: sampleBarcode,
                            matrixType: matrixInfo.matrixType,
                            lotNumber: `Estimado QB #${est.RefNumber}`,
                            samplingProtocol: matrixInfo.condition || 'RTCA / ISO',
                            receivedAt: txnDate,
                            status: 'COMPLETED'
                        }
                    });

                    for (const line of (est.Lines || [])) {
                        const tName = (line.ItemName || line.Desc || 'Parámetro').substring(0, 190);
                        const valObj = QbNormalizerService.parseResult(line.Amount || line.Rate);

                        await prisma.industrialTest.create({
                            data: {
                                sampleId: sample.id,
                                category: matrixInfo.category || 'MICROBIOLOGICAL',
                                parameterName: tName,
                                isoStandardRef: 'Método Oficial AOAC / SMEWW',
                                quantitativeResult: valObj.numVal,
                                qualitativeResult: valObj.textVal,
                                specificationLimit: null,
                                compliance: 'CONFORME'
                            }
                        });
                        stats.tests++;
                    }

                    // Upsert Report
                    await prisma.report.upsert({
                        where: { reportNumber },
                        update: {
                            reportType: 'INDUSTRIAL_COA',
                            industrialSampleId: sample.id,
                            status: 'ISSUED',
                            signedAt: txnDate
                        },
                        create: {
                            reportNumber,
                            reportType: 'INDUSTRIAL_COA',
                            industrialSampleId: sample.id,
                            status: 'ISSUED',
                            signedAt: txnDate,
                            createdAt: txnDate
                        }
                    });

                    stats.companies++;
                }

                // Guardar en QbSyncedClient para referencia de sincronización
                if (est.CustomerListID) {
                    await prisma.qbSyncedClient.upsert({
                        where: { listId: est.CustomerListID },
                        update: {
                            name: clientName,
                            syncedAt: new Date()
                        },
                        create: {
                            listId: est.CustomerListID,
                            name: clientName,
                            syncedAt: new Date()
                        }
                    });
                }

                stats.processed++;
            } catch (err) {
                stats.errors++;
                stats.lastError = err.message;
                console.error(`[QB-SYNC] Error procesando estimate #${est?.RefNumber}:`, err.message);
            }
        }

        lastSyncTimestamp = new Date();
        lastSyncStats = { ...stats };
        console.log(`[QB-INGEST] Finalizado con éxito: ${stats.processed} estimates procesados (${stats.companies} empresas, ${stats.patients} pacientes, ${stats.tests} ensayos).`);
        return {
            status: 'SUCCESS',
            timestamp: lastSyncTimestamp,
            stats
        };
    } catch (error) {
        lastSyncStats.lastError = error.message;
        console.error('[QB-INGEST] Error general durante la ingestión:', error.message);
        return {
            status: 'ERROR',
            message: error.message,
            stats: lastSyncStats
        };
    }
}

/**
 * Normaliza y persiste los estimates en LIMS consultando directamente QuickBooks
 */
export async function syncQuickBooksEstimates(maxReturned = 500, fromDate = '2024-01-01') {
    if (isSyncing) {
        return { status: 'IN_PROGRESS', message: 'Ya hay una sincronización en ejecución.' };
    }

    isSyncing = true;
    try {
        console.log(`[QB-SYNC] Iniciando sincronización de hasta ${maxReturned} estimates desde ${fromDate}...`);
        const estimates = await runFetchEstimatesScript({ maxReturned, fromTxnDate: fromDate });
        console.log(`[QB-SYNC] ${estimates.length} estimates recibidos desde QuickBooks.`);
        return await ingestEstimatesArray(estimates);
    } catch (error) {
        lastSyncStats.lastError = error.message;
        console.error('[QB-SYNC] Error general durante la sincronización:', error.message);
        return {
            status: 'ERROR',
            message: error.message,
            stats: lastSyncStats
        };
    } finally {
        isSyncing = false;
    }
}

/**
 * Obtiene el estado actual del servicio de sincronización
 */
export function getSyncStatus() {
    return {
        isSyncing,
        lastSyncTimestamp,
        lastSyncStats
    };
}

/**
 * Obtiene e ingesta un estimado puntual desde QuickBooks si no existe en LIMS
 */
export async function fetchAndIngestSingleEstimate(refNumber) {
    if (!refNumber) return null;
    const cleanRef = String(refNumber).replace(/[^0-9A-Za-z_-]/g, '').trim();
    if (!cleanRef) return null;

    console.log(`[QB-JIT] Intentando recuperar de QuickBooks el reporte/estimado puntual #${cleanRef}...`);
    try {
        const estimates = await runFetchEstimatesScript({ maxReturned: 5, refNumber: cleanRef });
        if (estimates && estimates.length > 0) {
            await ingestEstimatesArray(estimates);
            const report = await prisma.report.findFirst({
                where: { reportNumber: { contains: cleanRef } },
                include: {
                    industrialSample: {
                        include: {
                            contract: { include: { client: true } },
                            tests: true
                        }
                    },
                    clinicalOrder: {
                        include: {
                            sample: { include: { patient: true } },
                            tests: true
                        }
                    },
                    technicalDirector: {
                        select: { id: true, fullName: true, email: true }
                    },
                    signature: true
                }
            });
            if (report) {
                console.log(`[QB-JIT] Reporte #${cleanRef} importado y disponible en LIMS.`);
                return report;
            }
        }
        return null;
    } catch (err) {
        console.warn(`[QB-JIT] No fue posible obtener #${cleanRef} de QuickBooks en este momento:`, err.message);
        return null;
    }
}

/**
 * Inicia el observador en tiempo real del archivo de transacciones de QuickBooks (.TLG)
 */
export function startQuickBooksTLGWatcher(tlgPath = 'C:\\quickbooks2010\\alimentos10.QBW.TLG') {
    const parentDir = path.dirname(tlgPath);
    if (!fs.existsSync(parentDir)) {
        console.warn(`[QB-TLG-WATCHER] Directorio ${parentDir} no existe, se omitirá el watcher.`);
        return;
    }

    console.log(`[QB-TLG-WATCHER] 👁️ Monitoreo en tiempo real activo sobre: ${tlgPath}`);
    let debounceTimer = null;
    let lastMtime = 0;

    const triggerSync = (reason) => {
        if (isSyncing) return;
        const now = Date.now();
        if (now - lastMtime < 15000) return;
        lastMtime = now;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            if (isSyncing) return;
            console.log(`[QB-TLG-WATCHER] ⚡ Evento (${reason}) detectado en QuickBooks. Ejecutando sincronización silenciosa en segundo plano...`);
            try {
                const today = new Date().toISOString().split('T')[0];
                await syncQuickBooksEstimates(25, today);
            } catch (err) {
                console.warn('[QB-TLG-WATCHER] Sincronización en espera (QuickBooks ocupado):', err.message);
            }
        }, 15000);
    };

    // Observar cambios específicos sobre el archivo de transacciones TLG
    try {
        if (fs.existsSync(tlgPath)) {
            fs.watchFile(tlgPath, { interval: 10000 }, (curr, prev) => {
                if (curr.mtimeMs !== prev.mtimeMs && curr.size !== prev.size) {
                    triggerSync(`watchFile TLG modificado (${curr.size} bytes)`);
                }
            });
        }
    } catch (dirErr) {
        console.warn('[QB-TLG-WATCHER] Observador de archivo TLG no pudo iniciarse:', dirErr.message);
    }
}

/**
 * Inicia el observador periódico de QuickBooks
 */
export function startQuickBooksWatcher(intervalMinutes = 20) {
    console.log(`[QB-WATCHER] Sincronización automática programada cada ${intervalMinutes} minutos.`);
    
    // NOTA TÉCNICA: Se desactiva la observación reactiva por fs.watchFile (.TLG)
    // porque el propio driver de QuickBooks escribe en el archivo .TLG cada vez que se le
    // consulta, generando un ciclo de retroalimentación infinita cada 9 segundos.
    // La sincronización periódica en segundo plano combinada con la extracción bajo demanda (JIT)
    // provee los datos de forma 100% silenciosa sin afectar la experiencia del usuario.

    // Programador de intervalo periódico
    setInterval(async () => {
        if (!isSyncing) {
            console.log('[QB-WATCHER] Ejecutando sincronización periódica en segundo plano...');
            try {
                const today = new Date().toISOString().split('T')[0];
                await syncQuickBooksEstimates(30, today);
            } catch (err) {
                console.error('[QB-WATCHER] Error en ciclo periódico:', err.message);
            }
        }
    }, intervalMinutes * 60 * 1000);
}
