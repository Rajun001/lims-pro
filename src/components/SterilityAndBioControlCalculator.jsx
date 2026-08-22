import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Flame, ShieldAlert, Sparkles, Thermometer, Clock } from 'lucide-react';

export default function SterilityAndBioControlCalculator() {
  const [subModule, setSubModule] = useState('COMMERCIAL_STERILITY'); // 'COMMERCIAL_STERILITY' o 'BIOLOGICAL_INDICATORS'

  // Parámetros Esterilidad Comercial (USP <71> / FDA BAM)
  const [productName, setProductName] = useState('Conservas en Llama / Envasado Tetra Pak Low-Acid (pH > 4.6)');
  const [lotNumber, setLotNumber] = useState('LOT-2026-STER-88');
  const [_incubationDays, _setIncubationDays] = useState(14);
  const [ftmGrowth, setFtmGrowth] = useState(false); // Tioglicolato FTM 30-35°C
  const [tsbGrowth, setTsbGrowth] = useState(false); // Caldo Casoy TSB 20-25°C

  // Parámetros Control Biológico (Bioindicadores)
  const [sterilizationProcess, setSterilizationProcess] = useState('AUTOCLAVE_STEAM');
  const [bioindicatorOrganism, setBioindicatorOrganism] = useState('Geobacillus stearothermophilus ATCC 7953');
  const [readingHours, setReadingHours] = useState(24);
  const [biGrowthDetected, setBiGrowthDetected] = useState(false); // Crecimiento/Cambio de color del vial

  const isCommercialSterilePass = !ftmGrowth && !tsbGrowth;
  const isBioindicatorPass = !biGrowthDetected;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      {/* Encabezado Principal de Esterilidad y Control Biológico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Esterilidad Comercial & Control Biológico</h2>
            <p className="text-xs text-slate-400">Normativas Farmacéuticas USP &lt;71&gt;, FDA BAM Ch 21a y Verificación de Bioindicadores</p>
          </div>
        </div>

        {/* Tab de Selección */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubModule('COMMERCIAL_STERILITY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subModule === 'COMMERCIAL_STERILITY'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Esterilidad Comercial (14 Días)
          </button>
          <button
            onClick={() => setSubModule('BIOLOGICAL_INDICATORS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subModule === 'BIOLOGICAL_INDICATORS'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Control Biológico (Bioindicadores)
          </button>
        </div>
      </div>

      {/* SECCIÓN ESTERILIDAD COMERCIAL */}
      {subModule === 'COMMERCIAL_STERILITY' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              <strong>Protocolo USP &lt;71&gt; / FDA BAM:</strong> Requiere monitoreo de incubación durante 14 días completos en medio <strong>Tioglicolato FTM (30–35°C)</strong> y <strong>Caldo Casoy TSB (20–25°C)</strong>. Ausencia total de turbidez valida la Esterilidad Comercial.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Producto / Matriz Somatizada a Esterilidad</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Número de Lote / Batch</label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Estado de Incubación en Medios Duales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border space-y-3 transition-all ${
              ftmGrowth
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">Medio Tioglicolato FTM (30°C - 35°C)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">14 Días</span>
              </div>
              <p className="text-xs text-slate-400">Evalúa presencia de bacterias anaerobias y aerobias facultativas.</p>
              
              <button
                type="button"
                onClick={() => setFtmGrowth(!ftmGrowth)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  ftmGrowth
                    ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-900/40'
                    : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {ftmGrowth ? '❌ TURBIDEZ / CRECIMIENTO DETECTADO' : '✓ AUSENCIA DE CRECIMIENTO (CLARO)'}
              </button>
            </div>

            <div className={`p-4 rounded-xl border space-y-3 transition-all ${
              tsbGrowth
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">Medio Caldo Casoy TSB (20°C - 25°C)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">14 Días</span>
              </div>
              <p className="text-xs text-slate-400">Evalúa presencia de hongos, levaduras y bacterias estricta aerobias.</p>
              
              <button
                type="button"
                onClick={() => setTsbGrowth(!tsbGrowth)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  tsbGrowth
                    ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-900/40'
                    : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {tsbGrowth ? '❌ TURBIDEZ / CRECIMIENTO DETECTADO' : '✓ AUSENCIA DE CRECIMIENTO (CLARO)'}
              </button>
            </div>
          </div>

          {/* Dictamen de Esterilidad Comercial */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isCommercialSterilePass
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              {isCommercialSterilePass ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <XCircle className="w-7 h-7 text-rose-400" />}
              <div>
                <h4 className="font-bold text-base">
                  Dictamen USP &lt;71&gt;: {isCommercialSterilePass ? 'ESTERILIDAD COMERCIAL CONFORME' : 'NO CONFORME (CONTAMINACIÓN DETECTADA)'}
                </h4>
                <p className="text-xs opacity-90">
                  {isCommercialSterilePass
                    ? 'Ausencia total de turbidez y crecimiento microbiano en FTM y TSB tras 14 días de incubación regulada.'
                    : 'Se detectó crecimiento de microorganismos durante el periodo de incubación. El lote no es apto para liberación comercial.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN CONTROL BIOLÓGICO (BIOINDICADORES) */}
      {subModule === 'BIOLOGICAL_INDICATORS' && (
        <div className="space-y-6">
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 flex items-center gap-2">
            <Flame className="w-5 h-5 shrink-0 text-purple-400" />
            <span>
              <strong>Verificación de Bioindicadores:</strong> Evalúa la efectividad de ciclos de esterilización en autoclaves, calor seco u Óxido de Etileno mediante esporas de resistencia conocida.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Proceso de Esterilización</label>
              <select
                value={sterilizationProcess}
                onChange={(e) => {
                  setSterilizationProcess(e.target.value);
                  if (e.target.value === 'AUTOCLAVE_STEAM' || e.target.value === 'VHP_PEROXIDE') {
                    setBioindicatorOrganism('Geobacillus stearothermophilus ATCC 7953');
                  } else {
                    setBioindicatorOrganism('Bacillus atrophaeus ATCC 9372');
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="AUTOCLAVE_STEAM">Autoclave de Vapor de Agua (121°C / 134°C)</option>
                <option value="DRY_HEAT">Calor Seco / Horno Estufa (160°C - 180°C)</option>
                <option value="ETO_GAS">Óxido de Etileno (ETO Gas)</option>
                <option value="VHP_PEROXIDE">Peróxido de Hidrógeno en Vapor (VHP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Cepa Bioindicadora (Espora)</label>
              <input
                type="text"
                readOnly
                value={bioindicatorOrganism}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-semibold text-amber-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tiempo Lectura Incubación (Horas)</label>
              <select
                value={readingHours}
                onChange={(e) => setReadingHours(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
              >
                <option value={1}>1 Hora (Kit Lectura Rápida Fluorescencia)</option>
                <option value={24}>24 Horas (Incubación Convencional)</option>
                <option value={48}>48 Horas (Lectura Final Estándar)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-200">Lectura de Cambio de Color / Viabilidad de Esporas</h4>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setBiGrowthDetected(false)}
                className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                  !biGrowthDetected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> VIAL MORADO / SIN CRECIMIENTO
                </div>
                <p className="text-xs mt-1 text-slate-400">Las esporas fueron inactivadas totalmente durante el ciclo de esterilización.</p>
              </button>

              <button
                type="button"
                onClick={() => setBiGrowthDetected(true)}
                className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                  biGrowthDetected
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" /> VIAL AMARILLO / CRECIMIENTO DETECTADO
                </div>
                <p className="text-xs mt-1 text-slate-400">Las esporas sobrevivieron. El ciclo de esterilización fue ineficaz.</p>
              </button>
            </div>
          </div>

          {/* Dictamen de Control Biológico */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isBioindicatorPass
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              {isBioindicatorPass ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <XCircle className="w-7 h-7 text-rose-400" />}
              <div>
                <h4 className="font-bold text-base">
                  Dictamen Control Biológico: {isBioindicatorPass ? 'CICLO DE ESTERILIZACIÓN VALIDADAS Y EFICAZ' : 'FALLO CRÍTICO DE ESTERILIZACIÓN'}
                </h4>
                <p className="text-xs opacity-90">
                  {isBioindicatorPass
                    ? `Bioindicador (${bioindicatorOrganism}) negativo a crecimiento tras ${readingHours}h de incubación.`
                    : `Las esporas sobrevivieron. El equipo o ciclo de esterilización no alcanzó los parámetros de temperatura/tiempo requeridos.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
