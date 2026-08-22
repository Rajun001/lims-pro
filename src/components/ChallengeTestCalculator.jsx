import React, { useState } from 'react';
import { Calculator, ShieldAlert, CheckCircle2, XCircle, Beaker, Info } from 'lucide-react';

export default function ChallengeTestCalculator() {
  const [organism, setOrganism] = useState('Escherichia coli ATCC 8739');
  const [preservative, setPreservative] = useState('Benzoato de Sodio 0.1% + Parabenos');
  const [initialInoculum, setInitialInoculum] = useState(1500000); // 1.5 x 10^6 UFC/mL
  const [day7, setDay7] = useState(12000); // 1.2 x 10^4 UFC/mL
  const [day14, setDay14] = useState(120);  // 1.2 x 10^2 UFC/mL
  const [day28, setDay28] = useState(10);   // 1.0 x 10^1 UFC/mL

  // Cálculo de Reducciones Logarítmicas: log10(N0) - log10(Nt)
  const calcLogRed = (n0, nt) => {
    if (!n0 || n0 <= 0 || nt === null || nt === undefined || nt < 0) return 0;
    const ntAdj = nt === 0 ? 1 : nt;
    const red = Math.log10(n0) - Math.log10(ntAdj);
    return Math.max(0, red);
  };

  const logRed7 = calcLogRed(initialInoculum, day7);
  const logRed14 = calcLogRed(initialInoculum, day14);
  const logRed28 = calcLogRed(initialInoculum, day28);

  const isBacteria = !organism.includes('Candida') && !organism.includes('Aspergillus');

  // Criterios USP <51> Categoría 2 (Productos Tópicos / Cosméticos)
  let isPass = true;
  let failReason = '';

  if (isBacteria) {
    if (logRed14 < 2.0) {
      isPass = false;
      failReason = 'Día 14: La reducción logarítmica es inferior a 2.0 log (Criterio USP <51> Cat 2).';
    } else if (day28 > day14 * 1.5) {
      isPass = false;
      failReason = 'Día 28: Se detectó un incremento de bacterias respecto al Día 14.';
    }
  } else {
    // Hongos / Levaduras: No incremento respecto al inóculo inicial N0
    if (day7 > initialInoculum * 1.5 || day14 > initialInoculum * 1.5 || day28 > initialInoculum * 1.5) {
      isPass = false;
      failReason = 'Incremento de hongos/levaduras respecto al inóculo inicial (N0).';
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Beaker className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Calculadora Challenge Test USP &lt;51&gt;</h2>
            <p className="text-xs text-slate-400">Prueba de Efectividad de Sistemas Conservantes Antimicrobianos</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
          USP &lt;51&gt; Categoría 2
        </span>
      </div>

      {/* Configuración de Inóculo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Microorganismo de Ensayo ATCC</label>
          <select
            value={organism}
            onChange={(e) => setOrganism(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
          >
            <option value="Escherichia coli ATCC 8739">Escherichia coli ATCC 8739 (Bacterias)</option>
            <option value="Staphylococcus aureus ATCC 6538">Staphylococcus aureus ATCC 6538 (Bacterias)</option>
            <option value="Pseudomonas aeruginosa ATCC 9027">Pseudomonas aeruginosa ATCC 9027 (Bacterias)</option>
            <option value="Candida albicans ATCC 10231">Candida albicans ATCC 10231 (Levadura)</option>
            <option value="Aspergillus brasiliensis ATCC 16404">Aspergillus brasiliensis ATCC 16404 (Hongo)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Sistema Conservante</label>
          <input
            type="text"
            value={preservative}
            onChange={(e) => setPreservative(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Inóculo Inicial N₀ (UFC/mL)</label>
          <input
            type="number"
            value={initialInoculum}
            onChange={(e) => setInitialInoculum(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-purple-300 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla de Cronograma y Reducciones Logarítmicas */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3">Intervalo de Tiempo</th>
              <th className="p-3">Recuento UFC/mL</th>
              <th className="p-3">Reducción Logarítmica (Δ Log₁₀)</th>
              <th className="p-3">Criterio Regulado USP &lt;51&gt;</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr>
              <td className="p-3 font-medium text-slate-300">Día 0 (Inóculo Inicial N₀)</td>
              <td className="p-3 font-mono text-purple-400">{initialInoculum.toExponential(2)} UFC/mL</td>
              <td className="p-3 font-mono text-slate-400">0.00 log</td>
              <td className="p-3 text-xs text-slate-500">Punto de referencia (1.0x10⁶ - 1.0x10⁷)</td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-slate-300">Día 7</td>
              <td className="p-3">
                <input
                  type="number"
                  value={day7}
                  onChange={(e) => setDay7(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200 text-xs w-36"
                />
              </td>
              <td className="p-3 font-mono font-bold text-amber-400">{logRed7.toFixed(2)} log</td>
              <td className="p-3 text-xs text-slate-400">
                {isBacteria ? 'Informativo (Tendencia)' : 'No incremento sobre N₀'}
              </td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-slate-300">Día 14</td>
              <td className="p-3">
                <input
                  type="number"
                  value={day14}
                  onChange={(e) => setDay14(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200 text-xs w-36"
                />
              </td>
              <td className="p-3 font-mono font-bold text-emerald-400">{logRed14.toFixed(2)} log</td>
              <td className="p-3 text-xs text-slate-400">
                {isBacteria ? 'Mínimo 2.0 log de reducción' : 'No incremento sobre N₀'}
              </td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-slate-300">Día 28</td>
              <td className="p-3">
                <input
                  type="number"
                  value={day28}
                  onChange={(e) => setDay28(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200 text-xs w-36"
                />
              </td>
              <td className="p-3 font-mono font-bold text-emerald-400">{logRed28.toFixed(2)} log</td>
              <td className="p-3 text-xs text-slate-400">No incremento respecto al Día 14</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dictamen de Conformidad USP <51> */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        isPass
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
      }`}>
        <div className="flex items-center gap-3">
          {isPass ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <XCircle className="w-7 h-7 text-rose-400" />}
          <div>
            <h4 className="font-bold text-base">
              Dictamen USP &lt;51&gt;: {isPass ? 'CONFORME (CUMPLE CONSERVACIÓN)' : 'NO CONFORME (FALLO CONSERVACIÓN)'}
            </h4>
            <p className="text-xs opacity-90">
              {isPass
                ? `Reducción logarítmica en Día 14 de ${logRed14.toFixed(2)} log excede el requerimiento mínimo de 2.0 log.`
                : failReason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
