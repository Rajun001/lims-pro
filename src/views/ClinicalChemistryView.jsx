import React, { useState } from 'react';
import { Activity, Clock, ShieldCheck, Cpu, RefreshCw, Calculator, AlertTriangle, Layers } from 'lucide-react';

export default function ClinicalChemistryView() {
  const [dilutionFactor, setDilutionFactor] = useState(10.0);
  const [rawResult, setRawResult] = useState(15.4);
  const [testCode, setTestCode] = useState('CORTISOL_AM');
  const [collectionTime, setCollectionTime] = useState('07:30');
  const [fastingStatus, setFastingStatus] = useState(true);

  // Resultado calculado transparente en BD
  const calculatedResult = Number((rawResult * dilutionFactor).toFixed(2));

  // Motor de reglas en vivo
  let flag = 'NORMAL';
  let appliedRange = '6.2 - 19.4 µg/dL (06:00 - 10:00 AM Muestra Matutina)';
  if (testCode === 'CORTISOL_AM') {
    if (calculatedResult > 19.4) flag = 'HIGH';
    if (calculatedResult < 6.2) flag = 'LOW';
  } else if (testCode === 'ALB_MICRO') {
    appliedRange = '< 30.0 mg/L (Muestra Orina)';
    if (calculatedResult >= 30.0) flag = 'HIGH';
  }

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      {/* Header Analítico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Química Clínica y Autoanalizadores</h1>
            <p className="text-xs text-slate-400">Integración de Datastreams HL7/ASTM, Calculadora de Dilución y Motor de Reglas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> ROCHE COBAS 6000 [ONLINE]
          </span>
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border border-slate-700">
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar HL7 Stream
          </button>
        </div>
      </div>

      {/* Grid Interactivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Factor de Dilución Transparente */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 text-blue-400 border-b border-slate-800 pb-3">
            <Calculator className="w-5 h-5" />
            <h2 className="font-bold text-lg text-white">Calculadora de Factor de Dilución</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Prueba Analítica</label>
            <select
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="CORTISOL_AM">Cortisol Matutino (CORTISOL_AM)</option>
              <option value="ALB_MICRO">Microalbúmina en Orina (ALB_MICRO)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Valor Bruto Equipo</label>
              <input
                type="number"
                step="0.1"
                value={rawResult}
                onChange={(e) => setRawResult(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Factor Dilución</label>
              <select
                value={dilutionFactor}
                onChange={(e) => setDilutionFactor(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value={1.0}>1.0 (Sin dilución)</option>
                <option value={5.0}>5.0 (Dilución 1/5)</option>
                <option value={10.0}>10.0 (Dilución 1/10)</option>
                <option value={20.0}>20.0 (Dilución 1/20)</option>
                <option value={50.0}>50.0 (Dilución 1/50)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Valor Bruto Almacenado en BD:</span>
              <span className="font-mono text-slate-300">{rawResult}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Factor Multiplicador Transparente:</span>
              <span className="font-mono text-blue-400">x{dilutionFactor}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span>Resultado Reportable Calculado:</span>
              <span className="font-mono text-emerald-400 text-base">{calculatedResult} µg/dL</span>
            </div>
          </div>
        </div>

        {/* Panel de Motor de Reglas Biológicas */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="font-bold text-lg text-white">Evaluación de Reglas Biológicas Circadianas y Factores</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Hora Extracción Muestra
              </label>
              <input
                type="time"
                value={collectionTime}
                onChange={(e) => setCollectionTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Estado de Ayuno</label>
              <button
                type="button"
                onClick={() => setFastingStatus(!fastingStatus)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  fastingStatus
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {fastingStatus ? '✓ Ayuno Completo (Requerido)' : '✕ Sin Ayuno'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Clasificación Flag</label>
              <div className={`p-2 rounded-xl text-center font-bold text-xs border ${
                flag === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                flag === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {flag}
              </div>
            </div>
          </div>

          {/* Tarjeta Informativa de Regla Aplicada */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Regla Biológica Activa Evaluada</h4>
            <p className="text-sm font-medium text-slate-200">{appliedRange}</p>
            <p className="text-xs text-slate-400">
              {testCode === 'CORTISOL_AM'
                ? 'Regla: Se valida que para muestras extraídas entre 06:00 y 10:00 AM en ayuno, el rango de referencia matutino de Cortisol sea aplicado automáticamente.'
                : 'Regla: Se aplica rango de cribado de microalbuminuria.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
