import React, { useState, useMemo, useEffect } from 'react';
import { Microscope, Clock, Activity, CheckCircle, ChevronRight, PlayCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { useNotification } from '../contexts/NotificationContext';
import { StatusBadge } from '../components/UI';
import { WorkcardDetail } from '../components/WorkcardDetail';

const STAGES = [
    { id: 'siembra', title: 'Recepción y Siembra', icon: <PlayCircle size={18} className="text-blue-500" /> },
    { id: 'incubacion', title: 'Incubación (24h-48h)', icon: <Clock size={18} className="text-amber-500" /> },
    { id: 'lectura', title: 'Lectura / Identificación', icon: <Microscope size={18} className="text-purple-500" /> },
    { id: 'completado', title: 'Completado (AST)', icon: <CheckCircle size={18} className="text-emerald-500" /> }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const MicrobiologyWorkcards = ({ requests, db, navigateTo }) => {
    const { addNotification } = useNotification();
    const [draggedReq, setDraggedReq] = useState(null);
    const [selectedReq, setSelectedReq] = useState(null);
    const [apiRequests, setApiRequests] = useState([]);

    // Fetch data from local Node.js API
    useEffect(() => {
        const fetchWorkcards = async () => {
            try {
                const res = await fetch(`${API_URL}/api/workcards`);
                if (res.ok) {
                    const data = await res.json();
                    setApiRequests(data);
                }
            } catch {
                console.log("No se pudo conectar al API local, usando Firebase fallback.");
            }
        };
        fetchWorkcards();
    }, []);

    // Combinar Firebase (requests prop) y API local
    const microRequests = useMemo(() => {
        let combined = [];
        if (requests) {
            combined = requests.filter(r =>
                (r.analysisRequested && r.analysisRequested.toLowerCase().includes('cultivo')) ||
                (r.sampleType && r.sampleType.toLowerCase() === 'cultivo microbiológico')
            );
        }
        // Mezclar las de la API local (asegurando IDs únicos)
        const apiIds = new Set(apiRequests.map(r => r.id));
        const filteredFirebase = combined.filter(r => !apiIds.has(r.id));
        return [...apiRequests, ...filteredFirebase];
    }, [requests, apiRequests]);

    const getStage = (req) => {
        return req.microbiologyStatus || 'siembra';
    };

    const handleDragStart = (e, req) => {
        setDraggedReq(req);
        // Opcional para efecto visual nativo
        e.dataTransfer.setData('text/plain', req.id);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Permitir el drop
    };

    const handleDrop = async (e, stageId) => {
        e.preventDefault();
        if (!draggedReq || draggedReq.microbiologyStatus === stageId) return;

        try {
            const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, draggedReq.id);
            await updateDoc(reqRef, { microbiologyStatus: stageId });
            addNotification(`Muestra ${draggedReq.id.substring(0, 6)} movida a ${stageId}.`, 'info');
        } catch (error) {
            console.error("Error updating micro status:", error);
            addNotification("Error al actualizar el estado.", "error");
        } finally {
            setDraggedReq(null);
        }
    };

    return (
        <div className="flex flex-col h-[85vh] animate-fade-in pb-8">
            <div className="mb-6 flex justify-between items-end shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Activity className="text-purple-600" /> Microbiology Workcards
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Flujo de trabajo interactivo para cultivos microbiológicos.</p>
                </div>
                <div className="text-sm font-bold text-slate-500">
                    Total Cultivos Activos: <span className="text-purple-600 text-lg">{microRequests.length}</span>
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
                {STAGES.map(stage => {
                    const stageRequests = microRequests.filter(r => getStage(r) === stage.id);
                    return (
                        <div
                            key={stage.id}
                            className="bg-slate-100 rounded-2xl flex flex-col min-w-[320px] max-w-[350px] w-full snap-start border border-slate-200"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    {stage.icon} {stage.title}
                                </h3>
                                <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full text-xs">
                                    {stageRequests.length}
                                </span>
                            </div>

                            <div className="flex-1 p-3 overflow-y-auto space-y-3">
                                {stageRequests.map(req => (
                                    <div
                                        key={req.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, req)}
                                        className="relative bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab hover:border-purple-300 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                {req.id.substring(0, 8).toUpperCase()}
                                            </span>
                                            <StatusBadge status={req.status} />
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm">{req.clientName}</h4>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{req.analysisRequested}</p>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400">
                                                Arrastra para mover
                                            </span>
                                            <button
                                                onClick={() => navigateTo('request_details', req.id)}
                                                className="text-xs font-bold text-indigo-600 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Ver Detalle <ChevronRight size={14} />
                                            </button>
                                        </div>
                                        {/* Overlay para clic en toda la tarjeta */}
                                        <div
                                            className="absolute inset-0 cursor-pointer"
                                            onClick={() => setSelectedReq(req)}
                                            title="Click para ver Workcard"
                                        />
                                    </div>
                                ))}
                                {stageRequests.length === 0 && (
                                    <div className="h-full flex items-center justify-center p-6 text-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl">
                                        Arrastra una muestra aquí
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <WorkcardDetail
                isOpen={!!selectedReq}
                request={selectedReq}
                onClose={() => setSelectedReq(null)}
                onSave={async (data) => {
                    console.log('Guardando datos de Workcard:', data);
                    try {
                        const res = await fetch(`${API_URL}/api/workcards/${selectedReq.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        if (res.ok) {
                            addNotification("Guardado en la base de datos local exitosamente", "success");
                            // Recargar workcards para ver el cambio (muy basico)
                            const refetch = await fetch(`${API_URL}/api/workcards`);
                            if (refetch.ok) setApiRequests(await refetch.json());
                        } else {
                            addNotification("Error al guardar en BD", "error");
                        }
                    } catch (e) {
                        console.error(e);
                        addNotification("Sin conexión a la API", "error");
                    }
                }}
            />
        </div>
    );
};
