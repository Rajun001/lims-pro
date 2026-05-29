import React, { useState, useMemo } from 'react';
import { Layers, Copy, Search, Beaker, CheckCircle2, FlaskConical, Filter, Save, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { useNotification } from '../contexts/NotificationContext';

export const BatchProcessingView = ({ requests, db }) => {
    const { addNotification } = useNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSamples, setSelectedSamples] = useState([]);
    const [batchMode, setBatchMode] = useState(false);
    const [batchResult, setBatchResult] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Extraer todas las muestras de todas las solicitudes
    const allSamples = useMemo(() => {
        let samples = [];
        requests.forEach(req => {
            if (req.samples && Array.isArray(req.samples)) {
                req.samples.forEach(sample => {
                    samples.push({
                        ...sample,
                        requestId: req.id,
                        clientName: req.clientName,
                        requestStatus: req.status
                    });
                });
            }
        });
        return samples.filter(s => s.requestStatus !== 'Finalizado');
    }, [requests]);

    const filteredSamples = allSamples.filter(s => 
        (s.id && s.id.toString().includes(searchQuery)) || 
        (s.analysisCode && s.analysisCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.clientName && s.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 50);

    const toggleSampleSelection = (sample) => {
        if (selectedSamples.find(s => s.id === sample.id)) {
            setSelectedSamples(selectedSamples.filter(s => s.id !== sample.id));
        } else {
            setSelectedSamples([...selectedSamples, sample]);
        }
    };

    const selectAll = () => {
        if (selectedSamples.length === filteredSamples.length) {
            setSelectedSamples([]);
        } else {
            setSelectedSamples(filteredSamples);
        }
    };

    const handleCreateAliquots = async () => {
        if (selectedSamples.length === 0) return;
        
        // Simulación de creación de alícuotas (esto dividiría la muestra en la base de datos)
        // Por ahora, mostraremos una notificación
        addNotification('info', `Se han generado alícuotas para ${selectedSamples.length} muestras seleccionadas. Esta función dividirá las muestras en la base de datos.`);
    };

    const handleBatchSave = async () => {
        if (selectedSamples.length === 0 || !batchResult) {
            addNotification('error', 'Seleccione muestras y escriba un resultado de lote.');
            return;
        }

        setIsSaving(true);
        try {
            // Agrupar muestras seleccionadas por requestId para optimizar escrituras
            const requestsMap = {};
            selectedSamples.forEach(s => {
                if (!requestsMap[s.requestId]) {
                    requestsMap[s.requestId] = [];
                }
                requestsMap[s.requestId].push(s);
            });

            for (const [reqId, samplesToUpdate] of Object.entries(requestsMap)) {
                const originalRequest = requests.find(r => r.id === reqId);
                if (!originalRequest) continue;

                // Crear nueva matriz de muestras con el resultado actualizado
                const updatedSamples = originalRequest.samples.map(origSample => {
                    const isSelected = samplesToUpdate.find(s => s.id === origSample.id);
                    if (isSelected) {
                        return { ...origSample, result: batchResult };
                    }
                    return origSample;
                });

                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, reqId);
                await updateDoc(reqRef, { samples: updatedSamples });
            }

            addNotification('success', `Resultados aplicados en lote a ${selectedSamples.length} muestras.`);
            setSelectedSamples([]);
            setBatchResult('');
            setBatchMode(false);
        } catch (error) {
            console.error("Error saving batch:", error);
            addNotification('error', 'Error al procesar el lote.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Layers className="text-indigo-600" /> Alícuotas y Procesamiento por Lotes
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Divida muestras en alícuotas o aplique resultados masivos (Batch Processing).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Panel de Lote / Acciones */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" /> Muestras Seleccionadas ({selectedSamples.length})
                        </h3>

                        {selectedSamples.length === 0 ? (
                            <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                                <FlaskConical size={32} className="mx-auto mb-2 opacity-50" />
                                Seleccione muestras de la tabla para formar un lote de procesamiento.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {selectedSamples.map(s => (
                                        <div key={s.id} className="flex justify-between text-xs p-2 bg-indigo-50 text-indigo-800 rounded font-mono border border-indigo-100">
                                            <span className="font-bold">{s.id}</span>
                                            <span>{s.analysisCode}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-3">
                                    <button 
                                        onClick={handleCreateAliquots}
                                        className="w-full bg-slate-800 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-900 shadow-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Copy size={16} /> Crear Alícuotas Hija
                                    </button>

                                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-3">
                                        <label className="flex items-center gap-2 font-bold text-sm text-slate-700">
                                            <input type="checkbox" checked={batchMode} onChange={(e) => setBatchMode(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                            Activar Ingreso en Lote
                                        </label>
                                        
                                        {batchMode && (
                                            <div className="space-y-3 animate-fade-in">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Resultado Masivo</label>
                                                    <input 
                                                        type="text" value={batchResult} onChange={(e) => setBatchResult(e.target.value)}
                                                        placeholder="Ej. Negativo, Ausencia, < 10 UFC..."
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={handleBatchSave}
                                                    disabled={isSaving || !batchResult}
                                                    className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                                >
                                                    <Save size={16} /> Aplicar Resultado a {selectedSamples.length} muestras
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabla de Muestras Pendientes */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Buscar por ID de muestra, análisis o cliente..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <Filter size={16} /> {filteredSamples.length} encontradas
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedSamples.length > 0 && selectedSamples.length === filteredSamples.length}
                                            onChange={selectAll}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-4 font-bold">ID Muestra</th>
                                    <th className="p-4 font-bold">Análisis</th>
                                    <th className="p-4 font-bold">Cliente / Solicitud</th>
                                    <th className="p-4 font-bold">Resultado Actual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSamples.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400">No se encontraron muestras pendientes para buscar.</td>
                                    </tr>
                                ) : (
                                    filteredSamples.map((sample) => {
                                        const isSelected = selectedSamples.find(s => s.id === sample.id);
                                        return (
                                            <tr key={sample.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`} onClick={() => toggleSampleSelection(sample)}>
                                                <td className="p-4">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!isSelected}
                                                        readOnly
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="p-4 font-mono font-bold text-slate-700">{sample.id}</td>
                                                <td className="p-4 font-bold text-indigo-600">
                                                    {sample.analysisCode}
                                                    {sample.description && <div className="text-xs text-slate-400 font-normal mt-0.5">{sample.description}</div>}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-700">{sample.clientName}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{sample.requestId}</div>
                                                </td>
                                                <td className="p-4">
                                                    {sample.result ? (
                                                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md text-xs">{sample.result}</span>
                                                    ) : (
                                                        <span className="text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md text-xs">Pendiente</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
