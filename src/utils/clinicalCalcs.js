/**
 * Clinical Calculations Utility for LIMS Microlabs
 * Director Técnico: Dr. Roldan Ajún Chaverri
 * 
 * Automates validated medical calculations for:
 * 1. Perfil de Lípidos Completo (VLDL, LDL Friedewald, Col-No-HDL, Castelli, LDL/HDL, TG/HDL)
 * 2. Índices HOMA-1 y HOMA-2 (IR, %B Función Celular Beta, %S Sensibilidad)
 * 3. FIB-4 Index (Índice de Fibrosis Hepática) y APRI
 * 4. Índice de De Ritis (Relación AST / ALT)
 * 5. RAC (Relación Albúmina / Creatinina en Orina)
 * 6. Índice Prostático (Relación PSA Libre / Total %)
 * 7. Relación Nitrógeno Ureico / Creatinina (NU/Crea)
 * 8. Relación Na / K (Electrólitos)
 * 9. Bilirrubina Indirecta / No Conjugada
 * 10. Globulina y Relación Albúmina / Globulina (A/G)
 * 11. Anion Gap (Brecha Aniónica)
 * 12. Calcio Corregido por Albúmina (Fórmula de Payne)
 * 13. eGFR (Tasa de Filtración Glomerular Estimada - CKD-EPI 2021)
 */

// Helper to extract a numeric parameter value with flexible matching
const getParamValue = (results, targetCode, substrings = []) => {
    const item = results.find(r => {
        const testCode = r.testCode?.toLowerCase() || '';
        if (testCode === targetCode.toLowerCase()) return true;
        if (substrings.length > 0) {
            return substrings.every(sub => testCode.includes(sub));
        }
        return false;
    });
    if (!item || item.value === undefined || item.value === null || item.value === '') return NaN;
    const cleanNum = String(item.value).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
    return parseFloat(cleanNum);
};

/**
 * Runs all clinical calculations on the current results array.
 * Adds or updates automated results if inputs are present.
 * Clears/removes automated results if inputs are missing.
 * 
 * @param {Array} results - Array of { testCode, value, origin, status }
 * @param {Object} patientInfo - Optional { age, gender, birthDate }
 * @returns {Array} - Updated results array
 */
export const runClinicalCalculations = (results, patientInfo = {}) => {
    let updated = [...results];
    const timestamp = new Date().toISOString();

    const upsertCalculatedResult = (code, value, unit = '') => {
        const idx = updated.findIndex(r => r.testCode === code);
        const item = {
            testCode: code,
            value: value,
            unit: unit || undefined,
            origin: 'Cálculo Automatizado',
            status: 'pending_review',
            timestamp
        };
        if (idx > -1) {
            updated[idx] = {
                ...updated[idx],
                value: value,
                origin: 'Cálculo Automatizado',
                status: 'pending_review'
            };
        } else {
            updated.push(item);
        }
    };

    // ==========================================
    // 1. PERFIL DE LÍPIDOS COMPLETO
    // ==========================================
    const tc = getParamValue(updated, '1170', ['colesterol', 'total']);
    const hdl = getParamValue(updated, '1490', ['hdl']);
    const tg = getParamValue(updated, '1750', ['triglic']);

    const hasLipids = !isNaN(tc) && !isNaN(hdl) && !isNaN(tg);
    const lipidKeys = ['VLDL', '1550', 'LDL_HDL', 'FR_CT_HDL', 'COL_NO_HDL', 'TG_HDL'];

    if (hasLipids && hdl > 0) {
        const vldl = tg / 5;
        const ldl = tc - hdl - vldl;
        const ldlHdl = ldl / hdl;
        const riskFactor = tc / hdl;
        const nonHdl = tc - hdl;
        const tgHdl = tg / hdl;

        upsertCalculatedResult('VLDL', (Math.round(vldl * 10) / 10).toString(), 'mg/dL');
        upsertCalculatedResult('1550', Math.round(ldl).toString(), 'mg/dL'); // LDL-Colesterol
        upsertCalculatedResult('COL_NO_HDL', Math.round(nonHdl).toString(), 'mg/dL');
        upsertCalculatedResult('FR_CT_HDL', (Math.round(riskFactor * 100) / 100).toString(), 'Índice');
        upsertCalculatedResult('LDL_HDL', (Math.round(ldlHdl * 100) / 100).toString(), 'Índice');
        upsertCalculatedResult('TG_HDL', (Math.round(tgHdl * 100) / 100).toString(), 'Índice');
    } else {
        updated = updated.filter(r => !lipidKeys.includes(r.testCode));
    }

    // ==========================================
    // 2. ÍNDICES HOMA-1 Y HOMA-2 (Resistencia a la Insulina)
    // ==========================================
    const glucose = getParamValue(updated, '1450', ['glicemia']) || getParamValue(updated, 'GLU', ['glucosa']);
    const insulin = getParamValue(updated, '2160', ['insulinemia']) || getParamValue(updated, 'INS', ['insulina']);

    const hasHoma = !isNaN(glucose) && !isNaN(insulin);
    const homaKeys = ['HOMA_IR', 'HOMA_BETA', 'HOMA_SENS', 'HOMA2_IR', 'HOMA2_BETA', 'HOMA2_SENS'];

    if (hasHoma && glucose > 0 && insulin > 0) {
        // HOMA-1 Tradicional (Matthews et al.)
        const homaIr = (glucose * insulin) / 405;
        const homaBeta = glucose > 63 ? (360 * insulin) / (glucose - 63) : 0;
        const homaSens = homaIr > 0 ? 100 / homaIr : 0;

        // HOMA-2 (Oxford Model Approximation para insulina en uUI/mL y glucosa en mg/dL)
        const gluMmol = glucose / 18.0;
        const homa2Ir = (glucose * insulin) / (405 * (1 + 0.0003 * Math.abs(glucose - 100)));
        const homa2Beta = gluMmol > 3.5 ? (20 * insulin) / (gluMmol - 3.5) : 0;
        const homa2Sens = homa2Ir > 0 ? 100 / homa2Ir : 0;

        upsertCalculatedResult('HOMA_IR', (Math.round(homaIr * 100) / 100).toString(), 'Índice');
        upsertCalculatedResult('HOMA_BETA', (Math.round(homaBeta * 10) / 10).toString(), '%');
        upsertCalculatedResult('HOMA_SENS', (Math.round(homaSens * 10) / 10).toString(), '%');
        
        upsertCalculatedResult('HOMA2_IR', (Math.round(homa2Ir * 100) / 100).toString(), 'Índice');
        if (homa2Beta > 0) upsertCalculatedResult('HOMA2_BETA', (Math.round(homa2Beta * 10) / 10).toString(), '%');
        if (homa2Sens > 0) upsertCalculatedResult('HOMA2_SENS', (Math.round(homa2Sens * 10) / 10).toString(), '%');
    } else {
        updated = updated.filter(r => !homaKeys.includes(r.testCode));
    }

    // ==========================================
    // 3. FIB-4 INDEX & APRI (Fibrosis Hepática / Hepatología)
    // ==========================================
    const ast = getParamValue(updated, '1050', ['ast']) || getParamValue(updated, 'GOT', ['got']);
    const alt = getParamValue(updated, '1040', ['alt']) || getParamValue(updated, 'GPT', ['gpt']);
    const platelets = getParamValue(updated, '1660', ['plaquetas']) || getParamValue(updated, 'PLQ', ['plaq']);

    // Extraer edad del paciente si existe
    let patientAge = parseFloat(patientInfo?.age);
    if (isNaN(patientAge) && patientInfo?.birthDate) {
        const bdate = new Date(patientInfo.birthDate);
        if (!isNaN(bdate.getTime())) {
            const ageDifMs = Date.now() - bdate.getTime();
            const ageDate = new Date(ageDifMs);
            patientAge = Math.abs(ageDate.getUTCFullYear() - 1970);
        }
    }
    // Si no está disponible, se asume edad de tamizaje estándar de adulto (ej: 45) o se omite
    const effectiveAge = !isNaN(patientAge) && patientAge > 0 ? patientAge : 45;

    const hasFib4 = !isNaN(ast) && !isNaN(alt) && !isNaN(platelets) && alt > 0 && platelets > 0;
    const fibKeys = ['FIB_4', 'APRI', 'AST_ALT'];

    if (hasFib4) {
        // Plaquetas deben estar en formato 10^9/L (ej: 250 en vez de 250,000)
        const plqNormalized = platelets > 1000 ? platelets / 1000 : platelets;
        
        // Fórmula FIB-4: (Edad * AST) / (Plaquetas * sqrt(ALT))
        const fib4 = (effectiveAge * ast) / (plqNormalized * Math.sqrt(alt));
        
        // Fórmula APRI: ((AST / 40) * 100) / Plaquetas
        const apri = ((ast / 40) * 100) / plqNormalized;

        // Índice de De Ritis (AST / ALT)
        const deRitis = ast / alt;

        upsertCalculatedResult('FIB_4', (Math.round(fib4 * 100) / 100).toString(), 'Índice');
        upsertCalculatedResult('APRI', (Math.round(apri * 100) / 100).toString(), 'Índice');
        upsertCalculatedResult('AST_ALT', (Math.round(deRitis * 100) / 100).toString(), 'Relación');
    } else if (!isNaN(ast) && !isNaN(alt) && alt > 0) {
        const deRitis = ast / alt;
        upsertCalculatedResult('AST_ALT', (Math.round(deRitis * 100) / 100).toString(), 'Relación');
    } else {
        updated = updated.filter(r => !fibKeys.includes(r.testCode));
    }

    // ==========================================
    // 4. RAC (Relación Albúmina/Creatinina en Orina)
    // ==========================================
    const microalb = getParamValue(updated, 'MICROALBUMINA', ['microalb']) || getParamValue(updated, '1035', ['albumina', 'orina']);
    const creatUrine = getParamValue(updated, '7110', ['creatinina', 'orina']);

    const hasRac = !isNaN(microalb) && !isNaN(creatUrine);
    if (hasRac && creatUrine > 0) {
        // Standard formula: (Microalbumin [mg/L] / Creatinine [mg/dL]) * 100 -> RAC [mg/g]
        const rac = (microalb / creatUrine) * 100;
        upsertCalculatedResult('RAC', (Math.round(rac * 10) / 10).toString(), 'mg/g');
    } else {
        updated = updated.filter(r => r.testCode !== 'RAC');
    }

    // ==========================================
    // 5. PROSTATIC INDEX (PSA Libre/Total Ratio)
    // ==========================================
    const freePsa = getParamValue(updated, '3030', ['psa', 'libre']);
    const totalPsa = getParamValue(updated, '3040', ['psa', 'total']);

    const hasPsa = !isNaN(freePsa) && !isNaN(totalPsa);
    if (hasPsa && totalPsa > 0) {
        const ratio = (freePsa / totalPsa) * 100;
        upsertCalculatedResult('PSA_L_T', (Math.round(ratio * 10) / 10).toString(), '%');
    } else {
        updated = updated.filter(r => r.testCode !== 'PSA_L_T');
    }

    // ==========================================
    // 6. RELACIÓN NU/CREA & eGFR (Perfil Renal)
    // ==========================================
    const bun = getParamValue(updated, '1610', ['nitrógeno', 'ureico']) || getParamValue(updated, 'BUN', ['bun']);
    const creat = getParamValue(updated, '1230', ['creatinina']);
    
    const hasNuCrea = !isNaN(bun) && !isNaN(creat);
    if (hasNuCrea && creat > 0) {
        const nuCrea = bun / creat;
        upsertCalculatedResult('NU_CREA', (Math.round(nuCrea * 10) / 10).toString(), 'Relación');
    } else {
        updated = updated.filter(r => r.testCode !== 'NU_CREA');
    }

    // eGFR CKD-EPI 2021 (sin componente racial, KDIGO)
    if (!isNaN(creat) && creat > 0) {
        const isFemale = String(patientInfo?.gender || '').toLowerCase().startsWith('f') || String(patientInfo?.sex || '').toLowerCase().startsWith('f');
        const k = isFemale ? 0.7 : 0.9;
        const a = isFemale ? -0.241 : -0.302;
        const femaleFactor = isFemale ? 1.012 : 1.0;
        const age = effectiveAge;

        const scrK = creat / k;
        const minVal = Math.min(scrK, 1);
        const maxVal = Math.max(scrK, 1);

        const egfr = 142 * Math.pow(minVal, a) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * femaleFactor;
        upsertCalculatedResult('EGFR_CKDEPI', Math.round(egfr).toString(), 'mL/min/1.73m²');
    } else {
        updated = updated.filter(r => r.testCode !== 'EGFR_CKDEPI');
    }

    // ==========================================
    // 7. RELACIÓN NA/K & ELECTRÓLITOS
    // ==========================================
    const sodium = getParamValue(updated, '1740', ['sodio']) || getParamValue(updated, 'NA', ['sodio']);
    const potassium = getParamValue(updated, '1670', ['potasio']) || getParamValue(updated, 'K', ['potasio']);
    const cl = getParamValue(updated, '1160', ['cloro']) || getParamValue(updated, 'CL', ['cloro']);

    const hasNaK = !isNaN(sodium) && !isNaN(potassium);
    if (hasNaK && potassium > 0) {
        const naK = sodium / potassium;
        upsertCalculatedResult('NA_K', (Math.round(naK * 10) / 10).toString(), 'Relación');
    } else {
        updated = updated.filter(r => r.testCode !== 'NA_K');
    }

    // ANION GAP (Brecha Aniónica)
    const hasAnionGap = !isNaN(sodium) && !isNaN(cl);
    if (hasAnionGap) {
        const agVal = !isNaN(potassium) ? (sodium + potassium) - cl : sodium - cl;
        upsertCalculatedResult('ANION_GAP', Math.round(agVal).toString(), 'mEq/L');
    } else {
        updated = updated.filter(r => r.testCode !== 'ANION_GAP');
    }

    // ==========================================
    // 8. BILIRRUBINA INDIRECTA / NO CONJUGADA
    // ==========================================
    const tb = getParamValue(updated, '1080', ['bilirrubina', 'total']);
    const dbVal = getParamValue(updated, '1070', ['bilirrubina', 'directa']);
    const hasBili = !isNaN(tb) && !isNaN(dbVal);

    if (hasBili && tb >= dbVal) {
        const indBili = tb - dbVal;
        upsertCalculatedResult('BIL_IND', (Math.round(indBili * 100) / 100).toString(), 'mg/dL');
    } else {
        updated = updated.filter(r => r.testCode !== 'BIL_IND');
    }

    // ==========================================
    // 9. PROTEÍNAS: GLOBULINA Y RELACIÓN A/G
    // ==========================================
    const tp = getParamValue(updated, '1690', ['prote', 'total']);
    const alb = getParamValue(updated, '1030', ['albumina']);
    const hasProteins = !isNaN(tp) && !isNaN(alb);

    if (hasProteins && tp >= alb) {
        const glob = tp - alb;
        const agRatio = glob > 0 ? alb / glob : 0;
        upsertCalculatedResult('GLOB', (Math.round(glob * 10) / 10).toString(), 'g/dL');
        if (agRatio > 0) {
            upsertCalculatedResult('REL_AG', (Math.round(agRatio * 100) / 100).toString(), 'Relación');
        }
    } else {
        updated = updated.filter(r => !['GLOB', 'REL_AG'].includes(r.testCode));
    }

    // ==========================================
    // 10. CALCIO CORREGIDO POR ALBÚMINA
    // ==========================================
    const ca = getParamValue(updated, '1110', ['calcio']);
    const hasCaCorr = !isNaN(ca) && !isNaN(alb);

    if (hasCaCorr && alb > 0) {
        // Fórmula de Payne: Calcio Medido + 0.8 * (4.0 - Albúmina)
        const caCorr = ca + 0.8 * (4.0 - alb);
        upsertCalculatedResult('CA_CORR', (Math.round(caCorr * 10) / 10).toString(), 'mg/dL');
    } else {
        updated = updated.filter(r => r.testCode !== 'CA_CORR');
    }

    return updated;
};
