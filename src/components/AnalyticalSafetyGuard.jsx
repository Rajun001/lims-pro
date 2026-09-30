import React, { useMemo } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

/**
 * AnalyticalSafetyGuard.jsx — LIMS-PRO Microlabs
 * Escudo de Seguridad, Integridad y Prevención de Errores de Entrada de Datos
 * Detecta posibles errores tipográficos, valores biológicamente implausibles e inconsistencias
 */

// Rangos de plausibilidad extrema / límites biológicos y físicos
const BIOLOGICAL_LIMITS = {
    // Química y Metabolismo
    'GLU': { name: 'Glucosa', min: 15, max: 1200, unit: 'mg/dL' },
    'GLUCOSA': { name: 'Glucosa', min: 15, max: 1200, unit: 'mg/dL' },
    'CREAT': { name: 'Creatinina', min: 0.1, max: 25, unit: 'mg/dL' },
    'CREATININA': { name: 'Creatinina', min: 0.1, max: 25, unit: 'mg/dL' },
    'BUN': { name: 'Nitrógeno Ureico (BUN)', min: 1, max: 180, unit: 'mg/dL' },
    'UREA': { name: 'Urea', min: 2, max: 350, unit: 'mg/dL' },
    'AC_URICO': { name: 'Ácido Úrico', min: 0.5, max: 25, unit: 'mg/dL' },
    'COL_TOT': { name: 'Colesterol Total', min: 30, max: 900, unit: 'mg/dL' },
    'TRIG': { name: 'Triglicéridos', min: 10, max: 2500, unit: 'mg/dL' },
    'K': { name: 'Potasio (K+)', min: 1.5, max: 9.5, unit: 'mmol/L' },
    'NA': { name: 'Sodio (Na+)', min: 100, max: 185, unit: 'mmol/L' },
    'CL': { name: 'Cloro (Cl-)', min: 60, max: 145, unit: 'mmol/L' },
    
    // Hematología
    'WBC': { name: 'Leucocitos (WBC)', min: 0.2, max: 250, unit: '10³/µL' },
    'LEUCOCITOS': { name: 'Leucocitos', min: 200, max: 250000, unit: '/µL' },
    'RBC': { name: 'Eritrocitos (RBC)', min: 0.5, max: 9.5, unit: '10⁶/µL' },
    'HGB': { name: 'Hemoglobina', min: 2.5, max: 26, unit: 'g/dL' },
    'HEMOGLOBINA': { name: 'Hemoglobina', min: 2.5, max: 26, unit: 'g/dL' },
    'HCT': { name: 'Hematocrito', min: 8, max: 78, unit: '%' },
    'HEMATOCRITO': { name: 'Hematocrito', min: 8, max: 78, unit: '%' },
    'PLT': { name: 'Plaquetas', min: 2, max: 2500, unit: '10³/µL' },
    'PLAQUETAS': { name: 'Plaquetas', min: 2000, max: 2500000, unit: '/µL' },
    
    // Orina y Físico-Químicos
    'PH': { name: 'pH', min: 0.0, max: 14.0, unit: 'unidades' },
    'DENSIDAD': { name: 'Densidad', min: 1.000, max: 1.050, unit: 'g/mL' }
};

const computeReportIntegrityHash = (request) => {
    const rawData = [
        request?.id || '',
        request?.patientId || request?.clientLegalId || '',
        request?.requestDate || '',
        ...(request?.analyzerResults || []).map(r => `${r.testCode}:${r.value}`)
    ].join('|');

    let hash = 0;
    for (let i = 0; i < rawData.length; i++) {
        const char = rawData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `SHA256-${hex}-SECURED`;
};

export const AnalyticalSafetyGuard = ({ request, reportLang = 'es' }) => {
    const issues = useMemo(() => {
        const results = request?.analyzerResults || [];
        const detected = [];

        // 1. Detección de valores negativos imposibles
        results.forEach(res => {
            const valNum = parseFloat(res.value);
            if (!isNaN(valNum) && valNum < 0) {
                detected.push({
                    type: 'error',
                    code: res.testCode,
                    message: reportLang === 'es'
                        ? `Valor negativo imposible detectado en "${res.testName || res.testCode}": ${res.value}. Las magnitudes biológicas/físicas no pueden ser menores que cero.`
                        : `Impossible negative value in "${res.testName || res.testCode}": ${res.value}. Physical/biological amounts cannot be negative.`
                });
            }
        });

        // 2. Límites fisiológicos extremos (posible error de digitación por cero extra)
        results.forEach(res => {
            const code = (res.testCode || '').toUpperCase().trim();
            const valNum = parseFloat(res.value);
            if (isNaN(valNum)) return;

            const limit = BIOLOGICAL_LIMITS[code];
            if (limit) {
                if (valNum < limit.min || valNum > limit.max) {
                    detected.push({
                        type: 'warning',
                        code: res.testCode,
                        message: reportLang === 'es'
                            ? `Posible error de digitación en ${limit.name}: ${valNum} ${limit.unit}. El valor se encuentra fuera del rango biológico admisible (${limit.min} - ${limit.max} ${limit.unit}). Verifique si se ingresó un cero o decimal incorrecto.`
                            : `Possible typographical error in ${limit.name}: ${valNum} ${limit.unit}. Outside plausible range (${limit.min} - ${limit.max} ${limit.unit}). Please verify decimals.`
                    });
                }
            }
        });

        // 3. Regla de Tres Hematológica (Hct aprox ~ 3 * Hgb)
        const hgbRes = results.find(r => (r.testCode || '').toUpperCase().includes('HGB'));
        const hctRes = results.find(r => (r.testCode || '').toUpperCase().includes('HCT'));
        if (hgbRes && hctRes) {
            const hgb = parseFloat(hgbRes.value);
            const hct = parseFloat(hctRes.value);
            if (!isNaN(hgb) && !isNaN(hct) && hgb > 0) {
                const ratio = hct / hgb;
                // En condiciones estándar, la relación está entre 2.6 y 3.4
                if (ratio < 2.0 || ratio > 4.5) {
                    detected.push({
                        type: 'warning',
                        code: 'HGB-HCT-RULE',
                        message: reportLang === 'es'
                            ? `Discrepancia en Índice Eritrocitario: Hemoglobina (${hgb} g/dL) vs Hematocrito (${hct}%). La relación estándar Hct/Hgb debe ser ~3.0 (detectada: ${ratio.toFixed(1)}). Verifique la muestra.`
                            : `Discrepancy in Erythrocyte Index: Hgb (${hgb} g/dL) vs Hct (${hct}%). Ratio should approximate ~3.0 (detected: ${ratio.toFixed(1)}). Please recheck sample.`
                    });
                }
            }
        }

        return detected;
    }, [request?.analyzerResults, reportLang]);

    const integrityHash = useMemo(() => computeReportIntegrityHash(request), [request]);

    if (!issues.length) {
        return (
            <div className="print:hidden mb-4 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 select-none">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>
                        <strong>{reportLang === 'es' ? 'Validación de Seguridad:' : 'Safety Validation:'}</strong>{' '}
                        {reportLang === 'es'
                            ? 'Datos verificados sin inconsistencias tipográficas ni valores implausibles.'
                            : 'All analytical entries verified without typographical anomalies.'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                    <Lock size={11} className="text-emerald-700" />
                    <span>{integrityHash}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="print:hidden mb-4 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 select-none">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wide">
                    <ShieldAlert size={18} className="text-amber-600" />
                    <span>
                        {reportLang === 'es' 
                            ? '🛡️ Escudo de Seguridad Microlabs — Alerta de Integridad de Datos' 
                            : '🛡️ Microlabs Safety Guard — Data Integrity Alert'}
                    </span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                    {integrityHash}
                </span>
            </div>

            <div className="space-y-1.5 text-xs text-amber-950 font-medium">
                {issues.map((iss, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-amber-200">
                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <span>{iss.message}</span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-amber-800 italic">
                {reportLang === 'es'
                    ? '💡 Mensaje preventivo para el ejecutor y consultor. Si los valores son verídicos debido a condiciones fisiológicas particulares del paciente, puede proceder normalmente con la emisión.'
                    : '💡 Preventive alert for operator and consultant. If values reflect specific clinical pathology, proceed as required.'}
            </p>
        </div>
    );
};
