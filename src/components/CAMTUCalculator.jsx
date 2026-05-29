import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { Wind, AlertOctagon, CheckCircle, Save, Beaker } from 'lucide-react';
import { FormInput } from './UI';

export const CAMTUCalculator = ({ savedResults, onSave, onCalculate }) => {
    const [equipmentType, setEquipmentType] = useState(savedResults?.equipmentType || 'CAMTU (Aire Comprimido)');
    const [testName, setTestName] = useState(savedResults?.testName || 'Recuento Microbiológico de Aire Comprimido (CAMTU)');
    const [flowRate, setFlowRate] = useState(savedResults?.flowRate || '20'); // L/min (Standard is often 28.3 L/min or 20 L/min)
    const [samplingTime, setSamplingTime] = useState(savedResults?.samplingTime || '50'); // minutos
    const [colonies, setColonies] = useState(savedResults?.colonies || ''); // Conteo en placa
    const [limit, setLimit] = useState(savedResults?.limit || '10'); // Límite legal UFC/m3 (ISO 8573-7)
    
    // Additional parameters for the scientific report
    const [pressure, setPressure] = useState(savedResults?.pressure || '6.0'); // Bar
    
    // Automatically adjust test name based on equipment
    useEffect(() => {
        if (equipmentType === 'Impactador Portátil (Aire Ambiental)') {
            setTestName('Recuento Microbiológico de Aire Ambiental (Impactación)');
        } else {
            setTestName('Recuento Microbiológico de Aire Comprimido (CAMTU)');
        }
    }, [equipmentType]);

    const [location, setLocation] = useState(savedResults?.location || 'Punto de uso L1'); 
    
    const [resultUFC, setResultUFC] = useState(null);
    const [totalVolumeLiters, setTotalVolumeLiters] = useState(null);
    const [isRejected, setIsRejected] = useState(false);

    useEffect(() => {
        const flow = parseFloat(flowRate);
        const time = parseFloat(samplingTime);
        const count = parseFloat(colonies);
        const lim = parseFloat(limit);

        if (!isNaN(flow) && !isNaN(time) && !isNaN(count) && flow > 0 && time > 0) {
            // Volumen Total en Litros = Flujo (L/min) * Tiempo (min)
            const volLiters = flow * time;
            setTotalVolumeLiters(volLiters);

            // Fórmula: (Conteo * 1000) / Volumen Total en Litros
            // Porque 1 m^3 = 1000 Litros
            const ufcPerM3 = (count * 1000) / volLiters;
            setResultUFC(ufcPerM3);
            
            setIsRejected(!isNaN(lim) && ufcPerM3 > lim);

            if (onCalculate) {
                onCalculate({ resultUFC: ufcPerM3, volumeLiters: volLiters });
            }
        } else {
            setResultUFC(null);
            setTotalVolumeLiters(null);
            setIsRejected(false);
        }
    }, [flowRate, samplingTime, colonies, limit]);

    const handleSave = () => {
        if (onSave && resultUFC !== null) {
            onSave({
                equipmentType,
                testName,
                flowRate,
                samplingTime,
                colonies,
                limit,
                pressure,
                location,
                totalVolumeLiters,
                resultUFC,
                isRejected
            });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`p-4 text-white border-b flex justify-between items-center ${equipmentType === 'CAMTU (Aire Comprimido)' ? 'bg-slate-800 border-slate-700' : 'bg-indigo-800 border-indigo-700'}`}>
                <h3 className="font-bold flex items-center gap-2">
                    <Wind className="text-sky-400" size={18} /> Calculadora de Impactación de Aire
                </h3>
                {isRejected && (
                    <span className="flex items-center gap-1 bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30 animate-pulse">
                        <AlertOctagon size={14} /> Rechazo (Fuera de Norma)
                    </span>
                )}
                {resultUFC !== null && !isRejected && (
                    <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                        <CheckCircle size={14} /> Aprobado
                    </span>
                )}
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Beaker size={14} /> Configuración del Equipo
                        </h4>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tipo de Muestreador</label>
                            <select 
                                value={equipmentType} 
                                onChange={e => setEquipmentType(e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold bg-white text-slate-800"
                            >
                                <option value="CAMTU (Aire Comprimido)">CAMTU (Aire Comprimido)</option>
                                <option value="Impactador Portátil (Aire Ambiental)">Máquina Portátil (Aire Ambiental)</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput 
                                label="Flujo de Aire (L/min)" 
                                type="number" 
                                step="0.1"
                                value={flowRate} 
                                onChange={e => setFlowRate(e.target.value)} 
                                placeholder="Ej. 20" 
                                required 
                            />
                            <FormInput 
                                label="Tiempo (min)" 
                                type="number" 
                                step="1"
                                value={samplingTime} 
                                onChange={e => setSamplingTime(e.target.value)} 
                                placeholder="Ej. 50" 
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {equipmentType === 'CAMTU (Aire Comprimido)' && (
                                <FormInput 
                                    label="Presión de Línea (Bar)" 
                                    type="number" 
                                    step="0.1"
                                    value={pressure} 
                                    onChange={e => setPressure(e.target.value)} 
                                    placeholder="Ej. 6.0" 
                                />
                            )}
                            <FormInput 
                                label={equipmentType === 'CAMTU (Aire Comprimido)' ? "Punto de Muestreo" : "Área / Sala (EMP)"}
                                type="text" 
                                value={location} 
                                onChange={e => setLocation(e.target.value)} 
                                placeholder={equipmentType === 'CAMTU (Aire Comprimido)' ? "Ej. Línea 1" : "Ej. Sala Limpia"}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <AlertOctagon size={14} /> Análisis Microbiológico
                        </h4>
                        <FormInput 
                            label="Conteo en Placa de Impacto (UFC)" 
                            type="number" 
                            value={colonies} 
                            onChange={e => setColonies(e.target.value)} 
                            placeholder="Ej. 3" 
                            required 
                        />
                        <FormInput 
                            label="Límite Máximo Permitido (UFC/m³)" 
                            type="number" 
                            value={limit} 
                            onChange={e => setLimit(e.target.value)} 
                            placeholder="Ej. 10" 
                        />
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-colors ${
                    resultUFC === null ? 'bg-slate-50 border-slate-200' :
                    isRejected ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                    <span className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">Resultado Extrapolado (Volumen: {totalVolumeLiters || 0} L)</span>
                    <div className="text-4xl md:text-5xl font-black font-mono tracking-tight">
                        {resultUFC !== null ? resultUFC.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'} <span className="text-xl md:text-2xl ml-1 font-bold">UFC/m³</span>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleSave} 
                    disabled={resultUFC === null}
                    className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-sky-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    <Save size={18} /> Guardar Reporte de Aire
                </button>
            </div>
        </div>
    );
};
