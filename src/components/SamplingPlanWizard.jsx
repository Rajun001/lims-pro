import React, { useState } from 'react';
import { Hotel, Sparkles, CheckCircle2, Plus, Trash2, Droplets, Utensils, Waves, Wind, ShieldAlert, ArrowRight, Save, FileSpreadsheet } from 'lucide-react';

export default function SamplingPlanWizard({ _onSavePlan }) {
  const [profile, setProfile] = useState('NEW_HOTEL'); // 'NEW_HOTEL' (Desde cero) o 'EXISTING_HOTEL' (Plan existente)
  const [hotelName, setHotelName] = useState('Hotel Boutique Resort & Spa');
  const [_stars, _setStars] = useState(5);
  const [kitchenCount, setKitchenCount] = useState(2);
  const [poolCount, setPoolCount] = useState(1);
  const [iceMachineCount, setIceMachineCount] = useState(2);
  const [frequency, setFrequency] = useState('MENSUAL');

  // Puntos generados o cargados
  const [generatedPoints, setGeneratedPoints] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  // Generador de propuesta de plan desde cero
  const handleGenerateTemplate = () => {
    const points = [];

    // 1. Agua Potable y Fabricadores de Hielo
    for (let i = 1; i <= kitchenCount; i++) {
      points.push({
        id: crypto.randomUUID(),
        pointName: `Cocina #${i} - Grifo Principal Insumos y Emplatado`,
        zoneCategory: 'AGUA_POTABLE',
        matrixType: 'Agua Potable',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['Coliformes Totales', 'E. coli', 'Recuento 22°C/37°C'],
        isoStandardRef: 'ISO 6222 / ISO 9308-1'
      });
    }

    for (let i = 1; i <= iceMachineCount; i++) {
      points.push({
        id: crypto.randomUUID(),
        pointName: `Máquina de Hielo #${i} (Depósito y Boquilla Bar)`,
        zoneCategory: 'HIELO',
        matrixType: 'Hielo para Consumo',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['E. coli', 'Coliformes Fecales', 'Pseudomonas aeruginosa'],
        isoStandardRef: 'ISO 16266 / NMP Agua'
      });
    }

    // 2. Piscinas / Jacuzzis (Legionella ISO 11731)
    for (let i = 1; i <= poolCount; i++) {
      points.push({
        id: crypto.randomUUID(),
        pointName: `Piscina Principal / Jacuzzi #${i}`,
        zoneCategory: 'RECREACIONAL_PISCINA',
        matrixType: 'Agua Recreacional',
        samplingFrequency: 'QUINCENAL',
        targetParameters: ['Legionella pneumophila', 'Pseudomonas aeruginosa', 'S. aureus', 'Cloro / pH'],
        isoStandardRef: 'ISO 11731 (Legionella)'
      });
    }

    // 3. Superficies de Contacto y Utensilios (ISO 18593)
    points.push(
      {
        id: crypto.randomUUID(),
        pointName: 'Cocina - Tabla de Picar y Cuchillo Carnes Cruas',
        zoneCategory: 'SUPERFICIE_CONTACTO',
        matrixType: 'Hisopado de Superficie',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['Salmonella spp.', 'Listeria monocytogenes', 'E. coli'],
        isoStandardRef: 'ISO 18593 / ISO 6579-1'
      },
      {
        id: crypto.randomUUID(),
        pointName: 'Cocina - Mesa de Emplatado de Ensaladas',
        zoneCategory: 'SUPERFICIE_CONTACTO',
        matrixType: 'Hisopado de Superficie',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['Staphylococcus aureus', 'Recuento Aerobios Mesófilos'],
        isoStandardRef: 'ISO 6888-1 / ISO 4833-1'
      }
    );

    // 4. Manipuladores de Alimentos
    points.push({
      id: crypto.randomUUID(),
      pointName: 'Hisopado de Manos - Personal de Cocina & Buffet',
      zoneCategory: 'MANIPULADOR',
      matrixType: 'Hisopado de Manos',
      samplingFrequency: 'MENSUAL',
      targetParameters: ['Staphylococcus aureus coagulasa +', 'Enterobacterias'],
      isoStandardRef: 'ISO 6888-1'
    });

    // 5. Calidad de Aire HVAC
    points.push({
      id: crypto.randomUUID(),
      pointName: 'Muestreo Ambiental de Aire - Comedor Principal',
      zoneCategory: 'AIRE_AMBIENTAL',
      matrixType: 'Placa Sedimentación Aire',
      samplingFrequency: 'TRIMESTRAL',
      targetParameters: ['Aerobios Mesófilos', 'Hongos y Levaduras'],
      isoStandardRef: 'ISO 14698'
    });

    setGeneratedPoints(points);
    setIsGenerated(true);
  };

  const handleAddCustomPoint = () => {
    setGeneratedPoints([
      ...generatedPoints,
      {
        id: crypto.randomUUID(),
        pointName: 'Nuevo Punto Personalizado',
        zoneCategory: 'SUPERFICIE_CONTACTO',
        matrixType: 'Hisopado de Superficie',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['Aerobios Mesófilos'],
        isoStandardRef: 'ISO Standard'
      }
    ]);
  };

  const handleRemovePoint = (id) => {
    setGeneratedPoints(generatedPoints.filter(p => p.id !== id));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      {/* Encabezado del Asistente */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Hotel className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Diseñador de Planes de Muestreo para Hoteles y Restauración</h2>
            <p className="text-xs text-slate-400">Generación a la medida según el perfil operacional de la empresa o mapeo de plan existente</p>
          </div>
        </div>
      </div>

      {/* Selector de Perfil de Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => { setProfile('NEW_HOTEL'); setIsGenerated(false); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            profile === 'NEW_HOTEL'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" /> Perfil B: Hotel / Empresa iniciando desde cero
          </div>
          <p className="text-xs mt-1 text-slate-400">El sistema genera automáticamente el plan de muestreo optimizado según el tamaño de las instalaciones.</p>
        </button>

        <button
          type="button"
          onClick={() => { setProfile('EXISTING_HOTEL'); handleGenerateTemplate(); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            profile === 'EXISTING_HOTEL'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Perfil A: Hotel con Plan de Muestreo Existente
          </div>
          <p className="text-xs mt-1 text-slate-400">Cargar y personalizar la lista de puntos analíticos ya definidos por el cliente.</p>
        </button>
      </div>

      {/* Formulario de Configuración del Hotel */}
      {profile === 'NEW_HOTEL' && (
        <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Parámetros Operacionales del Hotel / Restaurante</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Establecimiento</label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Frecuencia Global de Control</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="MENSUAL">Mensual (Recomendado Estándar)</option>
                <option value="QUINCENAL">Quincenal (Alta Ocupación)</option>
                <option value="TRIMESTRAL">Trimestral (Temporada Baja)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Número de Cocinas / Áreas de Comida</label>
              <input
                type="number"
                value={kitchenCount}
                onChange={(e) => setKitchenCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Piscinas y Jacuzzis (Legionella)</label>
              <input
                type="number"
                value={poolCount}
                onChange={(e) => setPoolCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Fabricadores de Hielo</label>
              <input
                type="number"
                value={iceMachineCount}
                onChange={(e) => setIceMachineCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateTemplate}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generar Propuesta Automatizada de Plan de Muestreo
          </button>
        </div>
      )}

      {/* Tabla de Puntos de Muestreo Diseñados */}
      {isGenerated && generatedPoints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">Matriz de Puntos de Muestreo Diseñados ({generatedPoints.length} Puntos)</h3>
            <button
              type="button"
              onClick={handleAddCustomPoint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Agregar Punto Adicional
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Categoría de Zona</th>
                  <th className="p-3">Punto de Muestreo / Ubicación</th>
                  <th className="p-3">Matriz</th>
                  <th className="p-3">Parámetros Críticos Target</th>
                  <th className="p-3">Norma ISO Ref.</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {generatedPoints.map((pt, idx) => (
                  <tr key={pt.id} className="hover:bg-slate-900/60">
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {pt.zoneCategory}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-200">
                      <input
                        type="text"
                        value={pt.pointName}
                        onChange={(e) => {
                          const updated = [...generatedPoints];
                          updated[idx].pointName = e.target.value;
                          setGeneratedPoints(updated);
                        }}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 w-full font-medium"
                      />
                    </td>
                    <td className="p-3 text-slate-400">{pt.matrixType}</td>
                    <td className="p-3 text-emerald-400 font-mono">
                      {Array.isArray(pt.targetParameters) ? pt.targetParameters.join(', ') : pt.targetParameters}
                    </td>
                    <td className="p-3 text-slate-400">{pt.isoStandardRef}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleRemovePoint(pt.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
