/**
 * Módulo de Alertas Clínicas de Valores Críticos (Valores de Pánico) y Delta Check
 * Cumplimiento con estándares internacionales CLSI / ISO 15189
 */

export const CLINICAL_PANIC_LIMITS = {
    // Hematología
    'HGB': { name: 'Hemoglobina', min: 7.0, max: 20.0, unit: 'g/dL' },
    'HCT': { name: 'Hematocrito', min: 20.0, max: 60.0, unit: '%' },
    'WBC': { name: 'Leucocitos Totales', min: 2.0, max: 30.0, unit: 'x10³/µL' },
    'PLT': { name: 'Plaquetas', min: 20.0, max: 1000.0, unit: 'x10³/µL' },
    'NEU_ABS': { name: 'Neutrófilos Absolutos', min: 0.5, max: 20.0, unit: 'x10³/µL' },

    // Química Clínica
    'GLU': { name: 'Glucosa', min: 45.0, max: 400.0, unit: 'mg/dL' },
    'GLUCOSA': { name: 'Glucosa', min: 45.0, max: 400.0, unit: 'mg/dL' },
    'GLICEMIA': { name: 'Glicemia', min: 45.0, max: 400.0, unit: 'mg/dL' },
    'CREA': { name: 'Creatinina', min: 0.2, max: 5.0, unit: 'mg/dL' },
    'CREATININA': { name: 'Creatinina', min: 0.2, max: 5.0, unit: 'mg/dL' },
    'UREA': { name: 'Urea', min: 5.0, max: 100.0, unit: 'mg/dL' },
    'BUN': { name: 'Nitrógeno Ureico', min: 3.0, max: 60.0, unit: 'mg/dL' },

    // Electrólitos
    'K': { name: 'Potasio (K+)', min: 2.8, max: 6.2, unit: 'mmol/L' },
    'POTASIO': { name: 'Potasio (K+)', min: 2.8, max: 6.2, unit: 'mmol/L' },
    'NA': { name: 'Sodio (Na+)', min: 120.0, max: 160.0, unit: 'mmol/L' },
    'SODIO': { name: 'Sodio (Na+)', min: 120.0, max: 160.0, unit: 'mmol/L' },
    'CA': { name: 'Calcio Total', min: 6.5, max: 13.0, unit: 'mg/dL' },
    'CALCIO': { name: 'Calcio Total', min: 6.5, max: 13.0, unit: 'mg/dL' },
    'CL': { name: 'Cloro', min: 80.0, max: 125.0, unit: 'mmol/L' },
    'MG': { name: 'Magnesio', min: 1.0, max: 4.5, unit: 'mg/dL' },

    // Gases & Coagulación
    'INR': { name: 'INR (Tiempo Protrombina)', min: 0.8, max: 4.5, unit: '' },
    'TP': { name: 'Tiempo Protrombina', min: 9.0, max: 35.0, unit: 'seg' },
    'TPT': { name: 'Tiempo Tromboplastina', min: 20.0, max: 80.0, unit: 'seg' },
    'TROPONINA': { name: 'Troponina I/T', min: 0.0, max: 0.04, unit: 'ng/mL' }
};

/**
 * Evalúa si un resultado cae en rango de valor crítico o pánico.
 */
export const evaluateCriticalPanicValue = (testCode, rawValue) => {
    if (!testCode || rawValue === undefined || rawValue === null) return { isPanic: false };
    
    const code = testCode.toUpperCase().trim();
    const numericVal = parseFloat(rawValue);

    if (isNaN(numericVal)) return { isPanic: false };

    // Buscar coincidencia en el diccionario
    let limit = CLINICAL_PANIC_LIMITS[code];
    if (!limit) {
        // Búsqueda por subcadena
        const key = Object.keys(CLINICAL_PANIC_LIMITS).find(k => code.includes(k));
        if (key) limit = CLINICAL_PANIC_LIMITS[key];
    }

    if (!limit) return { isPanic: false };

    if (numericVal < limit.min) {
        return {
            isPanic: true,
            type: 'CRITICAL_LOW',
            testName: limit.name,
            value: numericVal,
            limitMin: limit.min,
            unit: limit.unit,
            message: `🚨 VALOR CRÍTICO BAJO: ${limit.name} (${numericVal} ${limit.unit}) está por debajo del límite de seguridad (${limit.min}). Notificar al médico tratante de inmediato.`
        };
    }

    if (numericVal > limit.max) {
        return {
            isPanic: true,
            type: 'CRITICAL_HIGH',
            testName: limit.name,
            value: numericVal,
            limitMax: limit.max,
            unit: limit.unit,
            message: `🚨 VALOR CRÍTICO ALTO: ${limit.name} (${numericVal} ${limit.unit}) supera el límite de seguridad (${limit.max}). Notificar al médico tratante de inmediato.`
        };
    }

    return { isPanic: false };
};

/**
 * Evalúa la variación porcentual con respecto al histórico del mismo paciente (Delta Check).
 */
export const calculateDeltaCheck = (currentValue, previousValue, thresholdPercent = 40) => {
    const cur = parseFloat(currentValue);
    const prev = parseFloat(previousValue);

    if (isNaN(cur) || isNaN(prev) || prev === 0) {
        return { isDeltaAlert: false, deltaPercent: 0 };
    }

    const deltaPercent = ((cur - prev) / prev) * 100;
    const absDelta = Math.abs(deltaPercent);

    if (absDelta >= thresholdPercent) {
        return {
            isDeltaAlert: true,
            deltaPercent: deltaPercent.toFixed(1),
            isIncrease: deltaPercent > 0,
            message: `⚠️ DELTA CHECK: Variación inusual de ${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}% respecto al resultado anterior (${prev}). Se sugiere verificar o repetir la muestra.`
        };
    }

    return { isDeltaAlert: false, deltaPercent: deltaPercent.toFixed(1) };
};
