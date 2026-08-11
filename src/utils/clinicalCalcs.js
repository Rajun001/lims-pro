/**
 * Clinical Calculations Utility for LIMS Microlabs
 * 
 * Automates calculations for:
 * 1. Perfil de Lípidos (VLDL, LDL, LDL/HDL, Risk Factor, Non-HDL)
 * 2. HOMA Indexes (IR, %B, %S)
 * 3. RAC (Relación Albúmina/Creatinina)
 * 4. Prostatic Index (PSA Libre/Total Ratio)
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
    return item ? parseFloat(item.value) : NaN;
};

/**
 * Runs all clinical calculations on the current results array.
 * Adds or updates automated results if inputs are present.
 * Clears/removes automated results if inputs are missing.
 * 
 * @param {Array} results - Array of { testCode, value, origin, status }
 * @returns {Array} - Updated results array
 */
export const runClinicalCalculations = (results) => {
    let updated = [...results];
    const timestamp = new Date().toISOString();

    const upsertCalculatedResult = (code, value) => {
        const idx = updated.findIndex(r => r.testCode === code);
        const item = {
            testCode: code,
            value: value,
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

    // 1. LIPID PROFILE
    const tc = getParamValue(updated, '1170', ['colesterol', 'total']);
    const hdl = getParamValue(updated, '1490', ['hdl']);
    const tg = getParamValue(updated, '1750', ['triglic']);

    const hasLipids = !isNaN(tc) && !isNaN(hdl) && !isNaN(tg);
    const lipidKeys = ['VLDL', '1550', 'LDL_HDL', 'FR_CT_HDL', 'COL_NO_HDL'];

    if (hasLipids && hdl > 0) {
        const vldl = tg / 5;
        const ldl = tc - hdl - vldl;
        const ldlHdl = ldl / hdl;
        const riskFactor = tc / hdl;
        const nonHdl = tc - hdl;

        upsertCalculatedResult('VLDL', (Math.round(vldl * 10) / 10).toString());
        upsertCalculatedResult('1550', Math.round(ldl).toString()); // LDL-Colesterol code in catalog is 1550
        upsertCalculatedResult('LDL_HDL', (Math.round(ldlHdl * 100) / 100).toString());
        upsertCalculatedResult('FR_CT_HDL', (Math.round(riskFactor * 100) / 100).toString());
        upsertCalculatedResult('COL_NO_HDL', Math.round(nonHdl).toString());
    } else {
        // If inputs are removed, clear calculations
        updated = updated.filter(r => !lipidKeys.includes(r.testCode));
    }

    // 2. HOMA INDEXES (%B, %S, IR)
    const glucose = getParamValue(updated, '1450', ['glicemia']);
    const insulin = getParamValue(updated, '2160', ['insulinemia']);

    const hasHoma = !isNaN(glucose) && !isNaN(insulin);
    const homaKeys = ['HOMA_IR', 'HOMA_BETA', 'HOMA_SENS'];

    if (hasHoma && glucose > 0) {
        const homaIr = (glucose * insulin) / 405;
        const homaBeta = glucose > 63 ? (360 * insulin) / (glucose - 63) : 0;
        const homaSens = homaIr > 0 ? 100 / homaIr : 0;

        upsertCalculatedResult('HOMA_IR', (Math.round(homaIr * 100) / 100).toString());
        upsertCalculatedResult('HOMA_BETA', (Math.round(homaBeta * 10) / 10).toString());
        upsertCalculatedResult('HOMA_SENS', (Math.round(homaSens * 10) / 10).toString());
    } else {
        updated = updated.filter(r => !homaKeys.includes(r.testCode));
    }

    // 3. RAC (Relación Albúmina/Creatinina)
    const microalb = getParamValue(updated, 'MICROALBUMINA', ['microalb']);
    const creatUrine = getParamValue(updated, '7110', ['creatinina', 'orina']); // Matches "Creatinina orina"

    const hasRac = !isNaN(microalb) && !isNaN(creatUrine);
    
    if (hasRac && creatUrine > 0) {
        // Standard formula: (Microalbumin [mg/L] / Creatinine [mg/dL]) * 100 -> RAC [mg/g]
        const rac = (microalb / creatUrine) * 100;
        upsertCalculatedResult('RAC', (Math.round(rac * 10) / 10).toString());
    } else {
        updated = updated.filter(r => r.testCode !== 'RAC');
    }

    // 4. PROSTATIC INDEX (PSA Libre/Total Ratio)
    const freePsa = getParamValue(updated, '3030', ['psa', 'libre']);
    const totalPsa = getParamValue(updated, '3040', ['psa', 'total']);

    const hasPsa = !isNaN(freePsa) && !isNaN(totalPsa);

    if (hasPsa && totalPsa > 0) {
        const ratio = (freePsa / totalPsa) * 100;
        upsertCalculatedResult('PSA_L_T', (Math.round(ratio * 10) / 10).toString());
    } else {
        updated = updated.filter(r => r.testCode !== 'PSA_L_T');
    }

    // 5. RELACIÓN NU/CREA (Perfil Renal)
    const bun = getParamValue(updated, '1610', ['nitrógeno', 'ureico']); // Nitrógeno Ureico
    const creat = getParamValue(updated, '1230', ['creatinina']); // Serum Creatinina (ensures it doesn't match urine as we look for code 1230 or no urine keyword)
    
    const hasNuCrea = !isNaN(bun) && !isNaN(creat);
    if (hasNuCrea && creat > 0) {
        const nuCrea = bun / creat;
        upsertCalculatedResult('NU_CREA', (Math.round(nuCrea * 10) / 10).toString());
    } else {
        updated = updated.filter(r => r.testCode !== 'NU_CREA');
    }

    // 6. RELACIÓN NA/K (Electrólitos)
    const sodium = getParamValue(updated, '1740', ['sodio']);
    const potassium = getParamValue(updated, '1670', ['potasio']);

    const hasNaK = !isNaN(sodium) && !isNaN(potassium);
    if (hasNaK && potassium > 0) {
        const naK = sodium / potassium;
        upsertCalculatedResult('NA_K', (Math.round(naK * 10) / 10).toString());
    } else {
        updated = updated.filter(r => r.testCode !== 'NA_K');
    }

    return updated;
};
