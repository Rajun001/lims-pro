import React, { useState } from 'react';
import { ShieldCheck, Calendar, Clock, AlertCircle, CheckCircle2, FileSpreadsheet, Building2, Beaker, Tag, Zap, Flame, Hotel } from 'lucide-react';
import ChallengeTestCalculator from '../components/ChallengeTestCalculator';
import DisinfectantTestCalculator from '../components/DisinfectantTestCalculator';
import SterilityAndBioControlCalculator from '../components/SterilityAndBioControlCalculator';
import SamplingPlanWizard from '../components/SamplingPlanWizard';

export default function IndustrialMicrobiologyView() {
  const [activeTab, setActiveTab] = useState('shelf-life');

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      {/* Header Módulo Microbiología Industrial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Microbiología Industrial y Farmacéutica</h1>
            <p className="text-xs text-slate-400">Vida Útil (RTCA), Challenge Test (USP &lt;51&gt;), Planes de Muestreo Hoteles, Desinfectantes & Bioindicadores</p>
          </div>
        </div>

        {/* Tabs de Navegación del Módulo */}
        <div className="flex flex-wrap bg-slate-950 p-1.5 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('sampling-plans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sampling-plans'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Planes Muestreo Hoteles
          </button>
          <button
            onClick={() => setActiveTab('shelf-life')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'shelf-life'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vida Útil (RTCA)
          </button>
          <button
            onClick={() => setActiveTab('challenge-test')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'challenge-test'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Challenge Test (USP &lt;51&gt;)
          </button>
          <button
            onClick={() => setActiveTab('disinfectants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'disinfectants'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Desinfectantes (5,5,5 & AOAC)
          </button>
          <button
            onClick={() => setActiveTab('sterility-biocontrol')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sterility-biocontrol'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Esterilidad & Bioindicadores
          </button>
          <button
            onClick={() => setActiveTab('iso-safety')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'iso-safety'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Inocuidad & Kits 3D
          </button>
        </div>
      </div>

      {/* Contenido según Tab Seleccionado */}
      {activeTab === 'sampling-plans' && <SamplingPlanWizard />}

      {activeTab === 'shelf-life' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Proyectos Activos</span>
              <p className="text-2xl font-bold text-white">12 Contratos</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Próximo Muestreo (Día 60)</span>
              <p className="text-2xl font-bold text-amber-400">En 3 Días</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Normativa de Estabilidad</span>
              <p className="text-2xl font-bold text-purple-400">RTCA / ICH Q1A</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Condición Almacenamiento</span>
              <p className="text-2xl font-bold text-emerald-400">25°C / 60% HR</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Cronogramas de Vida Útil (30, 60, 90, 180 Días)</h3>
              <span className="text-xs text-slate-400">Cliente Corporativo: Pharmalab Corp</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Código Proyecto</th>
                    <th className="p-3">Matriz / Producto</th>
                    <th className="p-3">Lote</th>
                    <th className="p-3">Punto 30 Días</th>
                    <th className="p-3">Punto 60 Días</th>
                    <th className="p-3">Punto 90 Días</th>
                    <th className="p-3">Punto 180 Días</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3 font-mono font-bold text-purple-400">PRJ-2026-STAB-089</td>
                    <td className="p-3">Emulsión Cosmética Hidratante</td>
                    <td className="p-3 font-mono text-slate-400">LOT-2026-X9</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20 font-semibold">
                        ✓ COMPLETADO
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded border border-amber-500/20 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> PENDIENTE (15 AGO)
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">Programado 14 SEP</td>
                    <td className="p-3 text-xs text-slate-500">Programado 14 DIC</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'challenge-test' && <ChallengeTestCalculator />}

      {activeTab === 'disinfectants' && <DisinfectantTestCalculator />}

      {activeTab === 'sterility-biocontrol' && <SterilityAndBioControlCalculator />}

      {activeTab === 'iso-safety' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Tag className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Pruebas de Inocuidad (ISO 7218 / ISO 6888) & Kits Rápidos 3D</h2>
              <p className="text-xs text-slate-400">Registro cualitativo y cuantitativo para alimentos, superficies y detección de alérgenos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-200">Ensayo Staphylococcus aureus (ISO 6888-1:2021)</h3>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Matriz:</span> <span className="text-slate-200">Queso Madurado</span>
                </div>
                <div className="flex justify-between">
                  <span>Recuento Coagulasa Positiva:</span> <span className="font-mono text-emerald-400">&lt; 10 UFC/g</span>
                </div>
                <div className="flex justify-between">
                  <span>Especificación:</span> <span className="font-mono text-slate-300">&lt; 100 UFC/g</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-slate-800">
                  <span>Dictamen Conformidad:</span> <span className="text-emerald-400">CONFORME</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-200">Kit Rápido Detección Alérgeno Maní (Tira 3D Express)</h3>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Superficie / Muestra:</span> <span className="text-slate-200">Línea de Envasado A2</span>
                </div>
                <div className="flex justify-between">
                  <span>Resultado Cualitativo:</span> <span className="font-mono text-emerald-400">NEGATIVO (AUSENCIA)</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-slate-800">
                  <span>Dictamen Inocuidad:</span> <span className="text-emerald-400">CONFORME (LÍNEA LIBRE DE ALÉRGENO)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
