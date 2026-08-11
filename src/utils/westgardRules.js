/**
 * Motor de Evaluación Estadística de Control de Calidad (QC) - Reglas de Westgard
 * Cumplimiento ISO 15189 / CLSI C24-A3
 */

/**
 * Calcula la media (Mean), desviación estándar (SD) y coeficiente de variación (CV%)
 * a partir de un arreglo de valores numéricos de control.
 */
export const calculateStatistics = (values) => {
    if (!values || values.length === 0) {
        return { mean: 0, sd: 0, cv: 0, count: 0 };
    }

    const validValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const count = validValues.length;

    if (count === 0) return { mean: 0, sd: 0, cv: 0, count: 0 };

    const mean = validValues.reduce((sum, v) => sum + v, 0) / count;

    if (count === 1) {
        return { mean: parseFloat(mean.toFixed(2)), sd: 0, cv: 0, count: 1 };
    }

    const variance = validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (count - 1);
    const sd = Math.sqrt(variance);
    const cv = mean !== 0 ? (sd / mean) * 100 : 0;

    return {
        mean: parseFloat(mean.toFixed(2)),
        sd: parseFloat(sd.toFixed(3)),
        cv: parseFloat(cv.toFixed(2)),
        count
    };
};

/**
 * Evalúa las reglas multirregla de Westgard para una serie cronológica de controles.
 * 
 * Reglas evaluadas:
 * - 1_2s: 1 punto excede ±2 SD (Regla de Advertencia)
 * - 1_3s: 1 punto excede ±3 SD (Error Aleatorio / Rechazo)
 * - 2_2s: 2 puntos consecutivos exceden ±2 SD en el mismo lado (Error Sistemático / Rechazo)
 * - R_4s: 1 punto excede +2 SD y otro excede -2 SD en la misma corrida o consecutiva (Error Aleatorio / Rechazo)
 * - 4_1s: 4 puntos consecutivos exceden ±1 SD en el mismo lado (Error Sistemático / Mantenimiento)
 * - 10_x: 10 puntos consecutivos caen en el mismo lado de la media (Desplazamiento / Error Sistemático)
 */
export const evaluateWestgardRules = (dataPoints, targetMean, targetSD) => {
    if (!dataPoints || dataPoints.length === 0 || !targetSD || targetSD <= 0) {
        return {
            status: 'IN_CONTROL',
            violations: [],
            zScores: [],
            summary: 'Datos insuficientes para evaluación multirregla'
        };
    }

    const points = dataPoints.map(p => ({
        date: p.date,
        value: parseFloat(p.value),
        zScore: (parseFloat(p.value) - targetMean) / targetSD
    })).filter(p => !isNaN(p.value));

    const violations = [];
    const n = points.length;

    if (n === 0) return { status: 'IN_CONTROL', violations: [], zScores: [] };

    const lastPoint = points[n - 1];
    const lastZ = lastPoint.zScore;

    // Regla 1_3s (Rechazo inmediato)
    if (Math.abs(lastZ) > 3) {
        violations.push({
            rule: '1_3s',
            type: 'REJECTION',
            message: `🚨 Violación Regla 1:3s. El último valor (${lastPoint.value}) excede ±3 SD (${lastZ.toFixed(2)} SD). Posible error aleatorio grande o reactivo degradado.`
        });
    }

    // Regla 1_2s (Advertencia)
    else if (Math.abs(lastZ) > 2) {
        violations.push({
            rule: '1_2s',
            type: 'WARNING',
            message: `⚠️ Advertencia Regla 1:2s. El último valor (${lastPoint.value}) excede ±2 SD (${lastZ.toFixed(2)} SD). Evaluar siguientes reglas.`
        });
    }

    // Regla 2_2s (Rechazo sistemático)
    if (n >= 2) {
        const prevZ = points[n - 2].zScore;
        if ((lastZ > 2 && prevZ > 2) || (lastZ < -2 && prevZ < -2)) {
            violations.push({
                rule: '2_2s',
                type: 'REJECTION',
                message: `🚨 Violación Regla 2:2s. Dos puntos consecutivos exceden ±2 SD hacia el mismo lado (${prevZ.toFixed(2)} SD y ${lastZ.toFixed(2)} SD). Error sistemático.`
            });
        }
    }

    // Regla R_4s (Rango 4 SD entre puntos)
    if (n >= 2) {
        const prevZ = points[n - 2].zScore;
        if ((lastZ > 2 && prevZ < -2) || (lastZ < -2 && prevZ > 2) || Math.abs(lastZ - prevZ) >= 4) {
            violations.push({
                rule: 'R_4s',
                type: 'REJECTION',
                message: `🚨 Violación Regla R:4s. Diferencia mayor a 4 SD entre dos corridas consecutivas (${prevZ.toFixed(2)} SD vs ${lastZ.toFixed(2)} SD). Error aleatorio.`
            });
        }
    }

    // Regla 4_1s (4 consecutivos superan 1 SD del mismo lado)
    if (n >= 4) {
        const last4 = points.slice(n - 4);
        const allHigh = last4.every(p => p.zScore > 1);
        const allLow = last4.every(p => p.zScore < -1);
        if (allHigh || allLow) {
            violations.push({
                rule: '4_1s',
                type: 'WARNING',
                message: `⚠️ Violación Regla 4:1s. Cuatro controles consecutivos superan 1 SD hacia el mismo lado. Tendencia sistemática incipiente.`
            });
        }
    }

    // Regla 10_x (10 consecutivos del mismo lado de la media)
    if (n >= 10) {
        const last10 = points.slice(n - 10);
        const allAbove = last10.every(p => p.zScore > 0);
        const allBelow = last10.every(p => p.zScore < 0);
        if (allAbove || allBelow) {
            violations.push({
                rule: '10_x',
                type: 'WARNING',
                message: `⚠️ Violación Regla 10:x. Diez controles consecutivos caen del mismo lado de la media. Desplazamiento sistemático (Shift).`
            });
        }
    }

    const hasRejection = violations.some(v => v.type === 'REJECTION');
    const hasWarning = violations.some(v => v.type === 'WARNING');

    let status = 'IN_CONTROL';
    let summary = '✅ En Control. Todas las reglas de Westgard conformes.';

    if (hasRejection) {
        status = 'OUT_OF_CONTROL';
        summary = '❌ Fuera de Control. Corrida analítica rechazada por regla de Westgard.';
    } else if (hasWarning) {
        status = 'WARNING';
        summary = '⚠️ Advertencia activa. Monitorear calibración y consumibles.';
    }

    return {
        status,
        summary,
        violations,
        zScores: points.map(p => p.zScore),
        lastZScore: lastZ ? parseFloat(lastZ.toFixed(2)) : 0
    };
};
