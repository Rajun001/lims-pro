/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Wind, Calculator, CheckCircle, AlertTriangle } from 'lucide-react';

export const AirSamplerCalculator = ({ onCalculate }) => {
    const [colonies, setColonies] = useState('');
    const [mode, setMode] = useState('volume'); // 'volume' or 'time_flow'
    const [volumeLiters, setVolumeLiters] = useState('100'); // Standard 100L or 1000L
    const [flowRate, setFlowRate] = useState('100'); // L/min (Standard portable sampler)
    const [timeMinutes, setTimeMinutes] = useState('1'); 
    const [result, setResult] = useState(null);

    const calculateCFU = () => {
        let totalVolumeLiters = 0;
        if (mode === 'volume') {
            totalVolumeLiters = parseFloat(volumeLiters);
        } else {
            totalVolumeLiters = parseFloat(flowRate) * parseFloat(timeMinutes);
        }

        const count = parseInt(colonies);

        if (isNaN(count) || isNaN(totalVolumeLiters) || totalVolumeLiters <= 0) {
            setResult(null);
            return;
        }

        // CFU/m3 = (Count / Total Volume in Liters) * 1000
        const cfuPerM3 = (count / totalVolumeLiters) * 1000;
        const formattedResult = Math.round(cfuPerM3);

        let interpretation = 'Normal';
        if (formattedResult > 500) interpretation = 'Crítico';
        else if (formattedResult > 200) interpretation = 'Alerta';

        const resultData = {
            value: formattedResult,
            unit: 'UFC/m³',
            interpretation,
            rawCount: count,
            volumeSampled: totalVolumeLiters
        };
        
        setResult(resultData);
        if (onCalculate) {
            onCalculate(resultData);
        }
    };

    useEffect(() => {
        calculateCFU();
    }, [colonies, mode, volumeLiters, flowRate, timeMinutes]);

    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden w-full max-w-lg">
            <div className="bg-sky-50 p-4 border-b border-sky-100 flex items-center gap-3">
                <div className="bg-sky-500 text-white p-2 rounded-lg"><Wind size={20} /></div>
                <div>
                    <h3 className="font-bold text-sky-900">Muestreador de Aire (Impactación)</h3>
                    <p className="text-xs text-sky-700">Calculadora de UFC/m³ para calidad de aire</p>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <button 
                        onClick={() => setMode('volume')}
                        className={`py-2 text-sm font-bold rounded-md border transition-colors ${mode === 'volume' ? 'bg-sky-600 text-white border-sky-700' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                        Volumen Directo
                    </button>
                    <button 
                        onClick={() => setMode('time_flow')}
                        className={`py-2 text-sm font-bold rounded-md border transition-colors ${mode === 'time_flow' ? 'bg-sky-600 text-white border-sky-700' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                        Flujo x Tiempo
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Colonias Contadas (UFC)
                        </label>
                        <input 
                            type="number" min="0" value={colonies} onChange={e => setColonies(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-sky-500 outline-none text-lg font-bold"
                            placeholder="Ej. 15"
                        />
                    </div>

                    {mode === 'volume' ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Volumen Muestreado (Litros)
                            </label>
                            <select 
                                value={volumeLiters} onChange={e => setVolumeLiters(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-sky-500 outline-none"
                            >
                                <option value="100">100 Litros</option>
                                <option value="200">200 Litros</option>
                                <option value="500">500 Litros</option>
                                <option value="1000">1000 Litros (1 m³)</option>
                                <option value="custom">Otro valor...</option>
                            </select>
                            {volumeLiters === 'custom' && (
                                <input 
                                    type="number" min="1" placeholder="Ingrese volumen en L"
                                    onChange={e => { if (e.target.value) setVolumeLiters(e.target.value) }}
                                    className="w-full p-2 border border-slate-300 rounded outline-none mt-2"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Flujo (L/min)</label>
                                <input 
                                    type="number" min="1" value={flowRate} onChange={e => setFlowRate(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tiempo (min)</label>
                                <input 
                                    type="number" min="0.1" step="0.1" value={timeMinutes} onChange={e => setTimeMinutes(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {result && (
                    <div className={`mt-4 p-4 rounded-xl border ${result.interpretation === 'Crítico' ? 'bg-red-50 border-red-200' : result.interpretation === 'Alerta' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-500 uppercase">Concentración en Aire</span>
                            {result.interpretation === 'Crítico' ? <AlertTriangle size={16} className="text-red-500"/> : result.interpretation === 'Alerta' ? <AlertTriangle size={16} className="text-amber-500"/> : <CheckCircle size={16} className="text-emerald-500"/>}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black ${result.interpretation === 'Crítico' ? 'text-red-700' : result.interpretation === 'Alerta' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {result.value}
                            </span>
                            <span className="text-sm font-bold text-slate-600">{result.unit}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Volumen procesado: {result.volumeSampled}L</p>
                    </div>
                )}
            </div>
        </div>
    );
};
