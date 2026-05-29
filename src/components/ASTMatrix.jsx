import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { FormInput } from './UI';

// Diccionario Mock básico CLSI (Halo en mm)
const CLSI_RULES = {
    'Amoxicilina': { S: 18, I_min: 14, I_max: 17, R: 13 },
    'Ciprofloxacino': { S: 21, I_min: 16, I_max: 20, R: 15 },
    'Gentamicina': { S: 15, I_min: 13, I_max: 14, R: 12 },
    'Penicilina': { S: 29, I_min: 20, I_max: 28, R: 19 },
    'Vancomicina': { S: 17, I_min: 15, I_max: 16, R: 14 },
    // Nuevos antibióticos del antibiograma del PDF
    'Trimetoprin-sulfa-SXT': { S: 16, I_min: 11, I_max: 15, R: 10 },
    'Ceftriaxona-CRO': { S: 21, I_min: 14, I_max: 20, R: 13 },
    'Ciprofloxacina-CIP': { S: 21, I_min: 16, I_max: 20, R: 15 },
    'Nitrofurantoína-F': { S: 17, I_min: 15, I_max: 16, R: 14 },
    'Fosfomicina': { S: 16, I_min: 13, I_max: 15, R: 12 },
    'Levofloxacina-LEV': { S: 17, I_min: 14, I_max: 16, R: 13 },
    'Cefaclor-CEC': { S: 18, I_min: 15, I_max: 17, R: 14 },
    'Ceftazidime-CAZ': { S: 18, I_min: 15, I_max: 17, R: 14 }
};

export const ASTMatrix = ({ savedResults, onChange, onSave }) => {
    const initialPathogen = savedResults?.pathogen || savedResults?.bacteriaIdentified || '';
    const initialConcentration = savedResults?.concentration || '';
    let initialAntibiotics = [];
    if (savedResults?.antibiotics) {
        initialAntibiotics = savedResults.antibiotics;
    } else if (savedResults?.jsonResults) {
        try {
            initialAntibiotics = typeof savedResults.jsonResults === 'string'
                ? JSON.parse(savedResults.jsonResults)
                : savedResults.jsonResults;
        } catch (e) {
            console.error(e);
        }
    }

    const [pathogen, setPathogen] = useState(initialPathogen);
    const [concentration, setConcentration] = useState(initialConcentration);
    const [antibiotics, setAntibiotics] = useState(initialAntibiotics);
    const [newAbx, setNewAbx] = useState('');
    const [newHalo, setNewHalo] = useState('');

    // Sincronizar estados cuando cambian los resultados guardados
    useEffect(() => {
        if (savedResults) {
            /* eslint-disable react-hooks/set-state-in-effect */
            setPathogen(savedResults.pathogen || savedResults.bacteriaIdentified || '');
            setConcentration(savedResults.concentration || '');
            if (savedResults.antibiotics) {
                setAntibiotics(savedResults.antibiotics);
            } else if (savedResults.jsonResults) {
                try {
                    setAntibiotics(typeof savedResults.jsonResults === 'string'
                        ? JSON.parse(savedResults.jsonResults)
                        : savedResults.jsonResults);
                } catch (e) {
                    console.error(e);
                }
            }
            /* eslint-enable react-hooks/set-state-in-effect */
        }
    }, [savedResults]);

    const calculateSIR = (name, haloStr) => {
        const halo = parseInt(haloStr, 10);
        if (isNaN(halo)) return '-';
        const rule = CLSI_RULES[name];
        if (!rule) return 'N/A'; // No hay regla para evaluar

        if (halo >= rule.S) return 'S';
        if (halo <= rule.R) return 'R';
        if (halo >= rule.I_min && halo <= rule.I_max) return 'I';
        return '-';
    };

    const triggerChange = (updatedPathogen, updatedConcentration, updatedAntibiotics) => {
        const payload = {
            pathogen: updatedPathogen,
            bacteriaIdentified: updatedPathogen,
            concentration: updatedConcentration,
            antibiotics: updatedAntibiotics,
            jsonResults: JSON.stringify(updatedAntibiotics)
        };
        if (onChange) onChange(payload);
        if (onSave) onSave(payload);
    };

    const addAntibiotic = () => {
        if (!newAbx || !newHalo) return;
        const resultSIR = calculateSIR(newAbx, newHalo);
        const newAbxList = [...antibiotics, { name: newAbx, halo: newHalo, sir: resultSIR }];
        setAntibiotics(newAbxList);
        setNewAbx('');
        setNewHalo('');
        triggerChange(pathogen, concentration, newAbxList);
    };

    const removeAntibiotic = (idx) => {
        const updated = [...antibiotics];
        updated.splice(idx, 1);
        setAntibiotics(updated);
        triggerChange(pathogen, concentration, updated);
    };

    const isCritical = pathogen.toLowerCase().includes('mrsa') || pathogen.toLowerCase().includes('kpc') || antibiotics.some(a => a.sir === 'R');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Antibiograma (AST)</h3>
                {isCritical && (
                    <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                        <AlertTriangle size={14} /> Alerta Epidemiológica
                    </span>
                )}
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Identificación del Patógeno</label>
                        <input
                            type="text"
                            value={pathogen}
                            onChange={e => {
                                setPathogen(e.target.value);
                                triggerChange(e.target.value, concentration, antibiotics);
                            }}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-800"
                            placeholder="Ej. Escherichia coli"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Concentración (UFC/mL)</label>
                        <input
                            type="text"
                            value={concentration}
                            onChange={e => {
                                setConcentration(e.target.value);
                                triggerChange(pathogen, e.target.value, antibiotics);
                            }}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-800"
                            placeholder="Ej. > 100 000 UFC/mL"
                        />
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Añadir Prueba de Susceptibilidad</h4>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <select
                                value={newAbx}
                                onChange={e => setNewAbx(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                            >
                                <option value="">Seleccionar Antibiótico...</option>
                                {Object.keys(CLSI_RULES).map(abx => (
                                    <option key={abx} value={abx}>{abx}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-32">
                            <FormInput
                                label="Halo (mm)"
                                type="number"
                                value={newHalo}
                                onChange={e => setNewHalo(e.target.value)}
                                placeholder="Ej. 20"
                            />
                        </div>
                        <button
                            onClick={addAntibiotic}
                            disabled={!newAbx || !newHalo}
                            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 h-[42px] aspect-square flex items-center justify-center mb-1"
                        >
                            <PlusCircle size={20} />
                        </button>
                    </div>
                </div>

                {antibiotics.length > 0 && (
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                                <th className="pb-2 font-bold">Antibiótico</th>
                                <th className="pb-2 font-bold text-center">Diámetro (mm)</th>
                                <th className="pb-2 font-bold text-center">Interpretación</th>
                                <th className="pb-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {antibiotics.map((abx, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 font-medium text-slate-800">{abx.name}</td>
                                    <td className="py-3 text-center font-mono">{abx.halo || '-'}</td>
                                    <td className="py-3 flex justify-center">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${abx.sir === 'S' || abx.sir?.toLowerCase() === 'sensible' ? 'bg-green-100 text-green-700 border-green-200' :
                                                abx.sir === 'R' || abx.sir?.toLowerCase() === 'resistente' ? 'bg-red-100 text-red-700 border-red-200' :
                                                    abx.sir === 'I' || abx.sir?.toLowerCase() === 'intermedio' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                            }`}>
                                            {abx.sir}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <button onClick={() => removeAntibiotic(idx)} className="text-slate-400 hover:text-red-600 p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
};
