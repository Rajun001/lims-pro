import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Beaker, Zap, Percent, Clock, Droplets } from 'lucide-react';

export default function DisinfectantTestCalculator() {
  const [testMethod, setTestMethod] = useState('555_TEST'); // '555_TEST' o 'AOAC_96009'
  
  // Parámetros para Prueba 5,5,5
  const [organism555, setOrganism555] = useState('Pseudomonas aeruginosa ATCC 15442');
  const [initialN0_555, setInitialN0_555] = useState(15000000); // 1.5 x 10^7 UFC/mL
  const [finalNt_555, setFinalNt_555] = useState(10);           // 10 UFC/mL (Reducción 6.18 log)
  const [contactTime555, setContactTime555] = useState(5);      // 5 Minutos
  const [organicLoad555, setOrganicLoad555] = useState('0.3 g/L BSA (Condición Limpia)');

  // Parámetros para AOAC 960.09
  const [organismAOAC, setOrganismAOAC] = useState('Escherichia coli ATCC 11229');
  const [initialN0_AOAC, setInitialN0_AOAC] = useState(100000000); // 1.0 x 10^8 UFC/mL
  const [finalNt_AOAC, setFinalNt_AOAC] = useState(5);             // 5 UFC/mL (Reducción 99.999995%)
  const [waterHardness, setWaterHardness] = useState(200);        // 200 ppm CaCO3

  // Cálculos Prueba 5,5,5
  const logN0_555 = Math.log10(initialN0_555 || 1);
  const logNt_555 = Math.log10(finalNt_555 <= 0 ? 1 : finalNt_555);
  const logRed_555 = Math.max(0, logN0_555 - logNt_555);
  const isBacteria555 = !organism555.includes('Candida') && !organism555.includes('Aspergillus');
  const requiredLogRed555 = isBacteria555 ? 5.0 : 4.0;
  const isPass555 = logRed_555 >= requiredLogRed555;

  // Cálculos AOAC 960.09
  const percentRedAOAC = initialN0_AOAC > 0
    ? Number((((initialN0_AOAC - (finalNt_AOAC || 0)) / initialN0_AOAC) * 100).toFixed(5))
    : 0;
  const logRedAOAC = Math.max(0, Math.log10(initialN0_AOAC || 1) - Math.log10(finalNt_AOAC <= 0 ? 1 : finalNt_AOAC));
  const isPassAOAC = percentRedAOAC >= 99.999;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      {/* Header Selector de Métodos de Desinfectantes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Eficacia de Desinfectantes y Sanitizantes</h2>
            <p className="text-xs text-slate-400">Pruebas Normadas EN 1276 / EN 1650 (5,5,5) y AOAC Official Method 960.09</p>
          </div>
        </div>

        {/* Tab de Selección de Norma */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setTestMethod('555_TEST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              testMethod === '555_TEST'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Prueba 5,5,5 (EN 1276 / 1650)
          </button>
          <button
            onClick={() => setTestMethod('AOAC_96009')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              testMethod === 'AOAC_96009'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AOAC 960.09 (30 Seg)
          </button>
        </div>
      </div>

      {/* CALCULADORA PRUEBA 5,5,5 */}
      {testMethod === '555_TEST' && (
        <div className="space-y-6">
          <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>
              <strong>Regla 5,5,5:</strong> Exige la prueba contra 5 cepas patógenas, 5 minutos de tiempo de contacto, y una reducción mínima de <strong>5.0 logs (99.999%)</strong> para bacterias en presencia de carga orgánica de interferencia.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Microorganismo de Ensayo (Cepa Cepa)</label>
              <select
                value={organism555}
                onChange={(e) => setOrganism555(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
              >
                <option value="Pseudomonas aeruginosa ATCC 15442">Pseudomonas aeruginosa ATCC 15442</option>
                <option value="Staphylococcus aureus ATCC 6538">Staphylococcus aureus ATCC 6538</option>
                <option value="Escherichia coli ATCC 10536">Escherichia coli ATCC 10536</option>
                <option value="Enterococcus hirae ATCC 10541">Enterococcus hirae ATCC 10541</option>
                <option value="Candida albicans ATCC 10231">Candida albicans ATCC 10231 (Levadura - Requerido 4 log)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Carga Orgánica de Interferencia</label>
              <select
                value={organicLoad555}
                onChange={(e) => setOrganicLoad555(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
              >
                <option value="0.3 g/L BSA (Condición Limpia)">0.3 g/L Albúmina Sérica (Condición Limpia)</option>
                <option value="3.0 g/L BSA + Eritrocitos (Condición Sucia)">3.0 g/L Albúmina + Eritrocitos (Condición Sucia)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tiempo de Contacto (Minutos)</label>
              <input
                type="number"
                value={contactTime555}
                onChange={(e) => setContactTime555(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-teal-300 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Inóculo Inicial N₀ (UFC/mL)</label>
              <input
                type="number"
                value={initialN0_555}
                onChange={(e) => setInitialN0_555(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Sobrevivientes al Tiempo t N_t (UFC/mL)</label>
              <input
                type="number"
                value={finalNt_555}
                onChange={(e) => setFinalNt_555(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-teal-300 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Resultado de Evaluación 5,5,5 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-slate-400 block">Reducción Logarítmica Calculada</span>
              <span className="text-2xl font-mono font-bold text-teal-400">{logRed_555.toFixed(2)} log</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Reducción Exigida (Norma EN)</span>
              <span className="text-2xl font-mono font-bold text-slate-300">{requiredLogRed555.toFixed(1)} log</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Dictamen de Eficacia</span>
              <span className={`text-xl font-bold flex items-center justify-center gap-1 mt-1 ${isPass555 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPass555 ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {isPass555 ? 'CONFORME (APROBADO)' : 'NO CONFORME'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CALCULADORA AOAC 960.09 */}
      {testMethod === 'AOAC_96009' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2">
            <Droplets className="w-5 h-5 shrink-0" />
            <span>
              <strong>AOAC Official Method 960.09:</strong> Prueba estándar para Sanitizantes en Alimentos. Exige una reducción no menor a <strong>99.999% en 30 segundos</strong> de exposición a dureza de agua sintética.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Cepa Sanitizante Oficial AOAC</label>
              <select
                value={organismAOAC}
                onChange={(e) => setOrganismAOAC(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="Escherichia coli ATCC 11229">Escherichia coli ATCC 11229</option>
                <option value="Staphylococcus aureus ATCC 6538">Staphylococcus aureus ATCC 6538</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Dureza del Agua (ppm CaCO₃)</label>
              <select
                value={waterHardness}
                onChange={(e) => setWaterHardness(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value={200}>200 ppm CaCO₃ (Dureza Estándar)</option>
                <option value={500}>500 ppm CaCO₃ (Dureza Severa)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tiempo de Exposición</label>
              <div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-blue-400 flex items-center justify-between">
                <span>30 Segundos</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Inóculo Inicial N₀ (UFC/mL)</label>
              <input
                type="number"
                value={initialN0_AOAC}
                onChange={(e) => setInitialN0_AOAC(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Sobrevivientes en 30s N_t (UFC/mL)</label>
              <input
                type="number"
                value={finalNt_AOAC}
                onChange={(e) => setFinalNt_AOAC(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-blue-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Resultado de Evaluación AOAC 960.09 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-slate-400 block">% Reducción Alcanzado</span>
              <span className="text-2xl font-mono font-bold text-blue-400">{percentRedAOAC}%</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Reducción Logarítmica</span>
              <span className="text-2xl font-mono font-bold text-slate-300">{logRedAOAC.toFixed(2)} log</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Dictamen AOAC 960.09</span>
              <span className={`text-xl font-bold flex items-center justify-center gap-1 mt-1 ${isPassAOAC ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPassAOAC ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {isPassAOAC ? 'CUMPLE (SANANTIZANTE APROBADO)' : 'NO CUMPLE'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
