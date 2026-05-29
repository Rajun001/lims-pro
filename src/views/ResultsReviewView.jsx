import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, FlaskConical, Beaker, Clock, AlertOctagon, CheckSquare } from 'lucide-react';
import { doc, updateDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import NotificationService from '../services/NotificationService';

const validStatuses = ['En Proceso', 'Pendiente Lectura', 'Pendiente Revisión', 'Pendiente Aprobación'];

export const ResultsReviewView = ({ db, requests, analyses, navigateTo }) => {
    const [selectedIds, setSelectedIds] = useState([]);


    // Filtrar solicitudes que están en alguna etapa del flujo de trabajo
    const pendingRequests = useMemo(() => {
        if (!requests) return [];
        return requests.filter(r => validStatuses.includes(r.status));
    }, [requests]);

    const checkBounds = (testCode, value) => {
        if (!analyses) return null;
        const analysis = analyses.find(a => a.code === testCode);
        if (!analysis || !analysis.minRange || !analysis.maxRange) return null;
        const numVal = parseFloat(value);
        if (isNaN(numVal)) return null;
        if (numVal < parseFloat(analysis.minRange) || numVal > parseFloat(analysis.maxRange)) {
            return `Fuera de rango (${analysis.minRange} - ${analysis.maxRange})`;
        }
        return null;
    };

    const handleSelectAll = () => {
        if (selectedIds.length === pendingRequests.length) {
            setSelectedIds([]);
        } else {
            // Seleccionar solo los que NO tienen banderas rojas para evitar liberar errores por accidente
            const safeIds = pendingRequests.filter(req => !req.analyzerResults?.some(res => checkBounds(res.testCode, res.value))).map(r => r.id);
            setSelectedIds(safeIds);
            if (safeIds.length < pendingRequests.length) {
                alert("Se seleccionaron únicamente las muestras dentro de rangos normales por seguridad.");
            }
        }
    };

    const toggleSelection = (id, hasFlags) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id));
        } else {
            if (hasFlags && !window.confirm('Esta muestra tiene resultados fuera de rango. ¿Desea seleccionarla de todos modos?')) {
                return;
            }
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBatchRelease = async () => {
        if (!db || selectedIds.length === 0) return;
        if (!window.confirm(`¿Desea validar y liberar el lote de ${selectedIds.length} muestras seleccionadas?`)) return;

        try {
            // Chunking para evitar el límite de 500 operaciones de Firestore
            const CHUNK_SIZE = 450;
            for (let i = 0; i < selectedIds.length; i += CHUNK_SIZE) {
                const chunk = selectedIds.slice(i, i + CHUNK_SIZE);
                const batch = writeBatch(db);
                
                chunk.forEach(id => {
                    const req = pendingRequests.find(r => r.id === id);
                    if (req) {
                        const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, id);
                        const updatedResults = req.analyzerResults?.map(r => ({ ...r, status: 'released' })) || [];
                        batch.update(reqRef, {
                            analyzerResults: updatedResults,
                            status: 'Completado'
                        });
                    }
                });
                await batch.commit();
            }
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
            alert("Error al liberar resultados en lote.");
        }
    };

    const advanceWorkflowStep = async (request) => {
        if (!db) return;
        
        let nextStatus = 'Completado';
        let actionMessage = 'aprobado';
        
        if (request.status === 'En Proceso') {
            nextStatus = 'Pendiente Lectura';
            actionMessage = 'marcado como preparado y listo para lectura';
        } else if (request.status === 'Pendiente Lectura' || request.status === 'Pendiente Revisión') {
            const hasErrors = request.analyzerResults?.some(res => checkBounds(res.testCode, res.value));
            if (hasErrors && !window.confirm('Hay resultados fuera del rango de referencia. ¿Validar técnicamente de todos modos?')) {
                return;
            }
            nextStatus = 'Pendiente Aprobación';
            actionMessage = 'validado técnicamente';
        } else if (request.status === 'Pendiente Aprobación') {
            // Require technical signature
            const signature = window.prompt("Por favor, ingrese sus iniciales o PIN para la Aprobación Final:");
            if (!signature) {
                alert("La firma técnica es obligatoria para la aprobación final.");
                return;
            }
            nextStatus = 'Completado';
            actionMessage = 'aprobado y liberado finalmente';
        }

        try {
            const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, request.id);
            const updatePayload = { status: nextStatus };
            
            if (nextStatus === 'Completado' && request.analyzerResults) {
                updatePayload.analyzerResults = request.analyzerResults.map(r => ({ ...r, status: 'released' }));
                
                // Integración ERP: Descontar de inventario automáticamente si existe un reactivo asociado
                try {
                    const invSnapshot = await getDocs(collection(db, `artifacts/${LIMSSystemId}/public/data/inventory`));
                    invSnapshot.forEach(async (invDoc) => {
                        const invData = invDoc.data();
                        // Deduct if the inventory name is mentioned in the analysis Requested or tests
                        if (invData.name && request.analysisRequested && request.analysisRequested.toLowerCase().includes(invData.name.toLowerCase().replace('reactivo', '').trim())) {
                            if (invData.quantity && invData.quantity > 0) {
                                await updateDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/inventory`, invDoc.id), {
                                    quantity: invData.quantity - 1
                                });
                                console.log(`Consumo automático ERP: Descontado 1 unidad de ${invData.name}`);
                            }
                        }
                    });
                } catch (erpError) {
                    console.error("Error en módulo ERP:", erpError);
                }
            }

            await updateDoc(reqRef, updatePayload);
            setSelectedIds(selectedIds.filter(id => id !== request.id));
            
            // Disparador de Notificación Externa si se ha completado
            if (nextStatus === 'Completado') {
                await NotificationService.notifyClientResultsReady(request, alert);
            } else {
                alert(`Flujo actualizado: Muestra ${actionMessage}.`);
            }
            
        } catch (e) {
            console.error(e);
            alert("Error al avanzar el flujo de trabajo.");
        }
    };

    const getWorkflowActionText = (status) => {
        if (status === 'En Proceso') return { text: 'Fase 1: Marcar Preparado', icon: <Beaker size={18} /> };
        if (status === 'Pendiente Lectura' || status === 'Pendiente Revisión') return { text: 'Fase 2: Validación Técnica', icon: <CheckCircle2 size={18} /> };
        if (status === 'Pendiente Aprobación') return { text: 'Fase 3: Aprobación Final', icon: <CheckSquare size={18} /> };
        return { text: 'Avanzar Flujo', icon: <Clock size={18} /> };
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <FlaskConical className="text-indigo-600" /> Flujos de Trabajo y Resultados
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Avance sus muestras a través del flujo ISO/IEC 17025 (Preparación {'>'} Lectura {'>'} Aprobación).</p>
                </div>
                <div className="flex gap-3 items-center">
                    {selectedIds.length > 0 && (
                        <button onClick={handleBatchRelease} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md animate-slide-in-right">
                            <CheckSquare size={18} /> Liberar Lote ({selectedIds.length})
                        </button>
                    )}
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-amber-200 shadow-sm shrink-0">
                        <Clock size={18} /> {pendingRequests.length} Pendientes
                    </div>
                </div>
            </div>

            {pendingRequests.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Todo al día</h3>
                    <p className="text-slate-500 mt-2">No hay resultados pendientes de revisión en este momento.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2 pb-2 border-b border-slate-200">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedIds.length === pendingRequests.length && pendingRequests.length > 0}
                            onChange={handleSelectAll}
                        />
                        <span className="text-sm font-bold text-slate-600 cursor-pointer select-none" onClick={handleSelectAll}>
                            Seleccionar Lote Seguro (Auto-QC)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingRequests.map(req => {
                            const hasFlags = req.analyzerResults?.some(r => checkBounds(r.testCode, r.value));
                            const isSelected = selectedIds.includes(req.id);
                            
                            return (
                            <div key={req.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all ${hasFlags ? 'border-red-300 shadow-red-100' : isSelected ? 'border-indigo-400 shadow-indigo-100 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                                <div className={`p-5 border-b flex justify-between items-start ${hasFlags ? 'bg-red-50 border-red-100' : isSelected ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="pt-1">
                                            <input 
                                                type="checkbox" 
                                                className={`w-5 h-5 rounded cursor-pointer ${hasFlags ? 'border-red-300 text-red-600 focus:ring-red-500' : 'border-slate-300 text-indigo-600 focus:ring-indigo-500'}`}
                                                checked={isSelected}
                                                onChange={() => toggleSelection(req.id, hasFlags)}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`text-xs font-bold uppercase tracking-wider ${hasFlags ? 'text-red-500' : 'text-slate-500'}`}>Muestra #{req.id.substring(0, 8)}</div>
                                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{req.status}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-lg">{req.clientName}</h3>
                                            <p className={`text-sm flex items-center gap-1 mt-1 ${hasFlags ? 'text-red-700 font-bold' : 'text-slate-600'}`}>
                                                {hasFlags ? <AlertOctagon size={14} /> : <Beaker size={14} />} 
                                                {req.analysisRequested}
                                                {hasFlags && ' (Alerta QC)'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => navigateTo('request_details', req.id)} className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                                        Ver Detalle
                                    </button>
                                </div>
                                
                                <div className="p-5 flex-1">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-slate-500 border-b border-slate-100">
                                                <th className="pb-2 font-bold">Parámetro</th>
                                                <th className="pb-2 font-bold">Resultado</th>
                                                <th className="pb-2 font-bold text-right">Equipo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {req.analyzerResults?.map((res, i) => {
                                                const boundError = checkBounds(res.testCode, res.value);
                                                return (
                                                <tr key={i} className={boundError ? 'bg-red-50/50' : ''}>
                                                    <td className="py-2 font-medium text-slate-700">
                                                        {res.testCode}
                                                        {boundError && <p className="text-[10px] text-red-600 font-bold uppercase">{boundError}</p>}
                                                    </td>
                                                    <td className={`py-2 font-black text-base ${boundError ? 'text-red-600' : 'text-blue-700'}`}>
                                                        {!res.value ? (
                                                            <span className="text-slate-400 italic font-medium text-sm">Pendiente</span>
                                                        ) : (
                                                            res.value
                                                        )}
                                                    </td>
                                                    <td className="py-2 text-right text-xs">
                                                        {res.origin && res.origin.includes('Automatizado') ? (
                                                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100" title={res.origin}>
                                                                🤖 {res.origin.replace('Automatizado (', '').replace(')', '')}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200" title={res.origin || 'Ingreso Manual'}>
                                                                📝 {res.origin || 'Manual'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                    <button onClick={() => advanceWorkflowStep(req)} className={`${hasFlags ? 'bg-red-600 hover:bg-red-700' : req.status === 'Pendiente Aprobación' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm`}>
                                        {getWorkflowActionText(req.status).icon} {getWorkflowActionText(req.status).text}
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
