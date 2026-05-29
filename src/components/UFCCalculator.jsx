/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Calculator, AlertOctagon, CheckCircle } from 'lucide-react';
import { FormInput } from './UI';

export const UFCCalculator = ({ savedResults, onSave, onCalculate }) => {
    const [testName, setTestName] = useState(savedResults?.testName || 'Recuento de Aerobios Mesófilos');
    const [result, setResult] = useState(savedResults?.result || null);
    const [referenceNorm, setReferenceNorm] = useState(savedResults?.referenceNorm || 'BAM FDA');
    const [limit, setLimit] = useState(savedResults?.limit || '10000');
    const [isRejected, setIsRejected] = useState(false);
    
    // Legacy single-plate state
    const [platingMethod, setPlatingMethod] = useState(savedResults?.platingMethod || 'Siembra en Profundidad');
    const [colonies, setColonies] = useState(savedResults?.colonies || '');
    const [dilution, setDilution] = useState(savedResults?.dilution || '-1');
    const [volume, setVolume] = useState(savedResults?.volume || '1');


    // Re-calculate automatically when variables change
    useEffect(() => {
        const calculateUFC = () => {
            const count = parseFloat(colonies);
            const vol = parseFloat(volume);
            
            if (isNaN(count) || isNaN(vol) || vol <= 0 || colonies === '') {
                setResult(null);
                setIsRejected(false);
                return;
            }

            const exponent = parseInt(dilution);
            const dilutionFactor = Math.pow(10, Math.abs(exponent));
            
            const rawUFC = count / (vol * (1 / dilutionFactor));
            const finalUFC = Math.round(rawUFC);

            let interpretation = 'Normal';
            if (finalUFC > 100000) interpretation = 'Crítico';
            else if (finalUFC > 1000) interpretation = 'Alerta';

            const lim = parseFloat(limit);
            const rejected = !isNaN(lim) && finalUFC > lim;

            const resultData = {
                resultUFC: finalUFC,
                scientificNotation: rawUFC.toExponential(2),
                interpretation: interpretation
            };

            setResult(resultData);
            setIsRejected(rejected);
            if (onCalculate) onCalculate(resultData);
        };

        calculateUFC();
    }, [colonies, dilution, volume, limit]);

    const handleSave = () => {
        if (onSave && result !== null) {
            onSave({
                testName,
                referenceNorm,
                platingMethod,
                colonies,
                dilution,
                volume,
                limit,
                resultUFC: result.resultUFC,
                isRejected
            });
        }
    };

    const formatScientific = (num) => {
        if (num === null || isNaN(num)) return '-';
        if (num === 0) return '< 10 Estimado';
        return num.toExponential(2).replace('e+', ' x 10^');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="text-indigo-600" size={18} /> Calculadora de Recuentos (UFC)
                </h3>
                {isRejected && (
                    <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 animate-pulse">
                        <AlertOctagon size={14} /> Rechazo (Fuera de Especificación)
                    </span>
                )}
                {result !== null && !isRejected && (
                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                        <CheckCircle size={14} /> Aprobado
                    </span>
                )}
            </div>

            <div className="p-6">
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Análisis a Reportar</label>
                    <select 
                        value={testName} 
                        onChange={e => setTestName(e.target.value)} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-800"
                    >
                        <option value="Recuento de Aerobios Mesófilos">Recuento de Aerobios Mesófilos</option>
                        <option value="Recuento de Coliformes Totales">Recuento de Coliformes Totales</option>
                        <option value="Recuento de Mohos y Levaduras">Recuento de Mohos y Levaduras</option>
                        <option value="Recuento de S. aureus">Recuento de S. aureus</option>
                        <option value="Recuento de Enterobacterias">Recuento de Enterobacterias</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Normativa de Referencia</label>
                        <select 
                            value={referenceNorm} 
                            onChange={e => setReferenceNorm(e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-800"
                        >
                            <option value="BAM FDA">BAM FDA (Bacteriological Analytical Manual)</option>
                            <option value="Farmacopea (USP/EP/JP)">Farmacopea (USP / EP / JP)</option>
                            <option value="ISO">Normas ISO</option>
                            <option value="AOAC Official Methods">AOAC Official Methods</option>
                            <option value="Normativa Local (NOM/INVIMA, etc.)">Normativa Local Oficial</option>
                            <option value="Método Interno Validado">Método Interno Validado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Método de Siembra</label>
                        <select 
                            value={platingMethod} 
                            onChange={e => setPlatingMethod(e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-800"
                        >
                            <optgroup label="Métodos Rápidos / Comerciales">
                                <option value="Placa Petrifilm (Neogen/3M)">Placa Petrifilm (Neogen/3M)</option>
                                <option value="Compact Dry">Compact Dry</option>
                            </optgroup>
                            <optgroup label="Métodos Automatizados">
                                <option value="Siembra Espiral - IUL Eddy Jet 2">Siembra Espiral Automatizada (IUL Eddy Jet 2)</option>
                            </optgroup>
                            <optgroup label="Métodos Tradicionales">
                                <option value="Siembra en Profundidad">Siembra en Profundidad (Vertido en Placa)</option>
                                <option value="Siembra en Superficie">Siembra en Superficie (Extensión)</option>
                                <option value="Filtración por Membrana">Filtración por Membrana</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div>
                        <FormInput 
                            label="Conteo en Placa (Colonias)" 
                            type="number" 
                            value={colonies} 
                            onChange={e => setColonies(e.target.value)} 
                            placeholder="Ej. 45" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dilución (10^x)</label>
                        <select 
                            value={dilution} 
                            onChange={e => setDilution(e.target.value)} 
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold"
                        >
                            <option value="0">Sin diluir (10⁰)</option>
                            <option value="-1">10⁻¹ (1/10)</option>
                            <option value="-2">10⁻² (1/100)</option>
                            <option value="-3">10⁻³ (1/1000)</option>
                            <option value="-4">10⁻⁴ (1/10000)</option>
                            <option value="-5">10⁻⁵ (1/100000)</option>
                        </select>
                    </div>
                    <div>
                        <FormInput 
                            label="Vol. Sembrado (mL)" 
                            type="number" 
                            step="0.1"
                            value={volume} 
                            onChange={e => setVolume(e.target.value)} 
                            placeholder="Ej. 1" 
                            required 
                        />
                    </div>
                    <div>
                        <FormInput 
                            label="Límite Legal (UFC max)" 
                            type="number" 
                            value={limit} 
                            onChange={e => setLimit(e.target.value)} 
                            placeholder="Ej. 10000" 
                        />
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-colors ${
                    result === null ? 'bg-slate-50 border-slate-200' :
                    isRejected ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                    <span className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">Resultado Calculado</span>
                    <div className="text-4xl md:text-5xl font-black font-mono tracking-tight">
                        {result !== null ? result.resultUFC.toLocaleString() : '---'} <span className="text-xl md:text-2xl ml-1 font-bold">UFC/g</span>
                    </div>
                    {result !== null && (
                        <div className="mt-2 text-sm font-mono opacity-80 font-bold">
                            Notación Científica: {formatScientific(result.resultUFC)}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleSave} 
                    disabled={result === null}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    <Save size={18} /> Guardar Recuento Oficial
                </button>
            </div>
        </div>
    );
};
