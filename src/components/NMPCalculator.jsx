/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Droplet, AlertOctagon, CheckCircle, Save, Beaker } from 'lucide-react';
import { FormInput } from './UI';

const MPN_3_TUBES = {
  "0-0-0": "< 3", "0-0-1": "3", "0-1-0": "3", "0-1-1": "6", "0-2-0": "6",
  "1-0-0": "4", "1-0-1": "7", "1-0-2": "11", "1-1-0": "7", "1-1-1": "11", "1-2-0": "11", "1-2-1": "15",
  "2-0-0": "9", "2-0-1": "14", "2-0-2": "20", "2-1-0": "15", "2-1-1": "20", "2-1-2": "27", "2-2-0": "21", "2-2-1": "28", "2-2-2": "35", "2-3-0": "29", "2-3-1": "36",
  "3-0-0": "23", "3-0-1": "39", "3-0-2": "64", "3-1-0": "43", "3-1-1": "75", "3-1-2": "120", "3-1-3": "160", "3-2-0": "93", "3-2-1": "150", "3-2-2": "210", "3-2-3": "290", "3-3-0": "240", "3-3-1": "460", "3-3-2": "1100", "3-3-3": "> 1100"
};

const MPN_5_TUBES = {
  "0-0-0": "< 2", "0-0-1": "2", "0-1-0": "2", "0-2-0": "4",
  "1-0-0": "2", "1-0-1": "4", "1-1-0": "4", "1-1-1": "6", "1-2-0": "6",
  "2-0-0": "4", "2-0-1": "7", "2-1-0": "7", "2-1-1": "9", "2-2-0": "9", "2-2-1": "12", "2-3-0": "12",
  "3-0-0": "8", "3-0-1": "11", "3-1-0": "11", "3-1-1": "14", "3-2-0": "14", "3-2-1": "17", "3-3-0": "17",
  "4-0-0": "13", "4-0-1": "17", "4-1-0": "17", "4-1-1": "21", "4-1-2": "26", "4-2-0": "22", "4-2-1": "26", "4-3-0": "27", "4-3-1": "33", "4-4-0": "34",
  "5-0-0": "23", "5-0-1": "31", "5-0-2": "43", "5-1-0": "33", "5-1-1": "46", "5-1-2": "63", "5-2-0": "49", "5-2-1": "70", "5-2-2": "94", "5-3-0": "79", "5-3-1": "110", "5-3-2": "140", "5-3-3": "180", "5-4-0": "130", "5-4-1": "170", "5-4-2": "220", "5-4-3": "280", "5-4-4": "350", "5-5-0": "240", "5-5-1": "350", "5-5-2": "540", "5-5-3": "920", "5-5-4": "1600", "5-5-5": "> 1600"
};

export const NMPCalculator = ({ savedResults, onSave, onCalculate }) => {
    const [testName, setTestName] = useState(savedResults?.testName || 'Coliformes Totales y Fecales (NMP)');
    const [referenceNorm, setReferenceNorm] = useState(savedResults?.referenceNorm || 'Standard Methods'); // Normativa
    const [tubeSeries, setTubeSeries] = useState(savedResults?.tubeSeries || '5'); // '3' o '5'
    
    // Positives for 10mL, 1mL, 0.1mL
    const [pos10, setPos10] = useState(savedResults?.pos10 || '0');
    const [pos1, setPos1] = useState(savedResults?.pos1 || '0');
    const [pos01, setPos01] = useState(savedResults?.pos01 || '0');
    
    const [limit, setLimit] = useState(savedResults?.limit || 'Ausencia'); 
    
    const [resultNMP, setResultNMP] = useState(null);
    const [isRejected, setIsRejected] = useState(false);

    useEffect(() => {
        const p10 = parseInt(pos10) || 0;
        const p1 = parseInt(pos1) || 0;
        const p01 = parseInt(pos01) || 0;
        
        const key = `${p10}-${p1}-${p01}`;
        let nmpValue = "Consultar Tabla";
        
        if (tubeSeries === '3') {
            if (MPN_3_TUBES[key]) nmpValue = MPN_3_TUBES[key];
        } else {
            if (MPN_5_TUBES[key]) nmpValue = MPN_5_TUBES[key];
        }
        
        setResultNMP(nmpValue);
        
        // Logic for rejection: If limit is "Ausencia" and we have something else than < 1.1, < 2, < 3 or 0.
        if (limit.toLowerCase().includes('ausencia') || limit === '< 1.1' || limit === '< 2' || limit === '< 3') {
            setIsRejected(!nmpValue.includes('<'));
        } else {
            // Numeric limit comparison
            const numericLimit = parseFloat(limit);
            const numericNMP = parseFloat(nmpValue.replace('>', '').replace('<', '').trim());
            if (!isNaN(numericLimit) && !isNaN(numericNMP)) {
                setIsRejected(numericNMP > numericLimit);
            } else {
                setIsRejected(false);
            }
        }
        
        if (onCalculate && nmpValue !== "Consultar Tabla") {
            onCalculate({ resultNMP: nmpValue });
        }
    }, [pos10, pos1, pos01, tubeSeries, limit]);

    const handleSave = () => {
        if (onSave && resultNMP) {
            onSave({
                testName,
                referenceNorm,
                tubeSeries,
                pos10,
                pos1,
                pos01,
                limit,
                resultNMP,
                isRejected
            });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-cyan-800 text-white border-b border-cyan-700 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                    <Droplet className="text-cyan-300" size={18} /> Calculadora NMP (Agua y Hielo)
                </h3>
                {isRejected && (
                    <span className="flex items-center gap-1 bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30 animate-pulse">
                        <AlertOctagon size={14} /> Rechazo (No Potable)
                    </span>
                )}
                {resultNMP && !isRejected && resultNMP !== "Consultar Tabla" && (
                    <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                        <CheckCircle size={14} /> Aprobado (Potable)
                    </span>
                )}
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Beaker size={14} /> Configuración de la Prueba
                            </h4>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Análisis</label>
                                        <input 
                                            type="text"
                                            value={testName}
                                            onChange={e => setTestName(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-bold bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Normativa de Referencia</label>
                                        <select 
                                            value={referenceNorm} 
                                            onChange={e => setReferenceNorm(e.target.value)} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-bold bg-white text-slate-800"
                                        >
                                            <option value="Standard Methods (APHA/AWWA/WEF)">Standard Methods (APHA/AWWA)</option>
                                            <option value="BAM FDA">BAM FDA</option>
                                            <option value="Farmacopea (USP/EP/JP)">Farmacopea (USP / EP / JP)</option>
                                            <option value="ISO">Normas ISO</option>
                                            <option value="Normativa Local Oficial">Normativa Local Oficial</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Serie de Tubos Inoculados</label>
                                        <select 
                                            value={tubeSeries} 
                                            onChange={e => setTubeSeries(e.target.value)} 
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-bold bg-white text-slate-800"
                                        >
                                            <option value="3">Serie de 3 Tubos</option>
                                            <option value="5">Serie de 5 Tubos</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Límite Normativo</label>
                                        <input 
                                            type="text"
                                            value={limit}
                                            onChange={e => setLimit(e.target.value)}
                                            placeholder="Ej. Ausencia o < 1.1"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-bold bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Tubos Positivos (Turbidez / Gas)
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            <FormInput 
                                label="Inóculo 10 mL" 
                                type="number" 
                                min="0" max={tubeSeries}
                                value={pos10} 
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    if(val >= 0 && val <= parseInt(tubeSeries)) setPos10(e.target.value);
                                }} 
                                required 
                            />
                            <FormInput 
                                label="Inóculo 1 mL" 
                                type="number" 
                                min="0" max={tubeSeries}
                                value={pos1} 
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    if(val >= 0 && val <= parseInt(tubeSeries)) setPos1(e.target.value);
                                }} 
                                required 
                            />
                            <FormInput 
                                label="Inóculo 0.1 mL" 
                                type="number" 
                                min="0" max={tubeSeries}
                                value={pos01} 
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    if(val >= 0 && val <= parseInt(tubeSeries)) setPos01(e.target.value);
                                }} 
                                required 
                            />
                        </div>
                        <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded mt-2">
                            Asegúrese de leer las burbujas en las campanas de Durham si aplica. Combinación ingresada: <span className="font-mono font-bold text-slate-800">{pos10}-{pos1}-{pos01}</span>
                        </div>
                        
                        <div className={`mt-4 p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-colors ${
                            resultNMP === 'Consultar Tabla' ? 'bg-slate-50 border-slate-200' :
                            isRejected ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}>
                            <span className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70">Índice Estadístico (NMP/100 mL)</span>
                            <div className="text-3xl md:text-4xl font-black font-mono tracking-tight text-cyan-700">
                                {resultNMP} 
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleSave} 
                    disabled={!resultNMP || resultNMP === 'Consultar Tabla'}
                    className="flex items-center gap-2 bg-cyan-700 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-cyan-800 transition-colors shadow-sm disabled:opacity-50"
                >
                    <Save size={18} /> Guardar Análisis NMP
                </button>
            </div>
        </div>
    );
};
