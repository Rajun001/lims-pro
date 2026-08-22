import React, { useMemo, useState, useCallback } from 'react';
import { 
    CheckCircle2, AlertCircle, FlaskConical, Beaker, Clock, AlertOctagon, 
    CheckSquare, Search, Filter, Edit3, Trash2, Plus, LayoutGrid, LayoutList, 
    X, Save, RotateCcw, AlertTriangle, ShieldCheck, Cpu, FileSpreadsheet
} from 'lucide-react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import NotificationService from '../services/NotificationService';
import { deductInventoryForRequest } from '../utils/inventoryDeduction';
import { logAuditAction } from '../utils/audit';

export const ResultsReviewView = ({ db, user, requests = [], analyses = [], labInfo, navigateTo }) => {
    // --- ESTADOS DE FILTRADO Y BÚSQUEDA ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all_pending'); // 'all_pending' | 'all' | 'En Proceso' | 'Pendiente Lectura' | 'Pendiente Aprobación' | 'Completado'
    const [qcFilter, setQcFilter] = useState('all'); // 'all' | 'alerts_only' | 'normal_only'
    const [originFilter, setOriginFilter] = useState('all'); // 'all' | 'automated' | 'manual'
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [selectedIds, setSelectedIds] = useState([]);

    // --- ESTADOS DE EDICIÓN E INVALIDACIÓN IN-LINE ---
    const [editingItem, setEditingItem] = useState(null); // { reqId, testIndex, testCode, testName, value, origin }
    const [deletingItem, setDeletingItem] = useState(null); // { reqId, testIndex, testCode, testName, value }
    const [deleteReason, setDeleteReason] = useState('');
    const [showAddParamModal, setShowAddParamModal] = useState(null); // reqId
    const [newParamCode, setNewParamCode] = useState('');
    const [newParamVal, setNewParamVal] = useState('');

    // Evaluación de rangos de referencia (QC Bounds Check)
    const checkBounds = useCallback((testCode, value) => {
        if (!analyses || !value) return null;
        const analysis = analyses.find(a => a.code === testCode || a.name === testCode);
        if (!analysis || !analysis.minRange || !analysis.maxRange) return null;
        const numVal = parseFloat(value);
        if (isNaN(numVal)) return null;
        const min = parseFloat(analysis.minRange);
        const max = parseFloat(analysis.maxRange);
        if (numVal < min) {
            return `Bajo (${numVal} < Min: ${min})`;
        }
        if (numVal > max) {
            return `Alto (${numVal} > Max: ${max})`;
        }
        return null;
    }, [analyses]);

    // --- FILTRADO AVANZADO DE MUESTRAS ---
    const filteredRequests = useMemo(() => {
        if (!requests) return [];

        return requests.filter(req => {
            // 1. Filtro por Estado
            if (statusFilter === 'all_pending') {
                const pendingStatuses = ['En Proceso', 'Pendiente Lectura', 'Pendiente Revisión', 'Pendiente Aprobación'];
                if (!pendingStatuses.includes(req.status)) return false;
            } else if (statusFilter !== 'all') {
                if (req.status !== statusFilter) return false;
            }

            // 2. Filtro por Búsqueda (Búsqueda en tiempo real por Cliente, ID, Muestra, Examen o Código de Barras)
            if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase().trim();
                const matchClient = req.clientName?.toLowerCase().includes(term);
                const matchId = req.id?.toLowerCase().includes(term);
                const matchBarcode = req.barcode?.toLowerCase().includes(term);
                const matchAnalysis = req.analysisRequested?.toLowerCase().includes(term);
                const matchDoctor = req.doctorName?.toLowerCase().includes(term);
                const matchTests = req.analyzerResults?.some(r => 
                    r.testCode?.toLowerCase().includes(term) || r.value?.toLowerCase().includes(term)
                );

                if (!matchClient && !matchId && !matchBarcode && !matchAnalysis && !matchDoctor && !matchTests) {
                    return false;
                }
            }

            // 3. Filtro por Alerta de Calidad (QC Flags)
            const hasQcFlags = req.analyzerResults?.some(r => checkBounds(r.testCode, r.value));
            if (qcFilter === 'alerts_only' && !hasQcFlags) return false;
            if (qcFilter === 'normal_only' && hasQcFlags) return false;

            // 4. Filtro por Origen de Datos (Analizador vs Manual)
            const hasAutomated = req.analyzerResults?.some(r => r.origin && r.origin.includes('Automatizado'));
            if (originFilter === 'automated' && !hasAutomated) return false;
            if (originFilter === 'manual' && hasAutomated) return false;

            return true;
        });
    }, [requests, searchTerm, statusFilter, qcFilter, originFilter, checkBounds]);

    // Estadísticas del tablero
    const stats = useMemo(() => {
        const total = filteredRequests.length;
        const alerts = filteredRequests.filter(r => r.analyzerResults?.some(res => checkBounds(res.testCode, res.value))).length;
        const pendingApproval = filteredRequests.filter(r => r.status === 'Pendiente Aprobación').length;
        const automated = filteredRequests.filter(r => r.analyzerResults?.some(res => res.origin?.includes('Automatizado'))).length;
        return { total, alerts, pendingApproval, automated };
    }, [filteredRequests, checkBounds]);

    // --- ACCIONES DE SELECCIÓN Y LOTE ---
    const handleSelectAll = () => {
        if (selectedIds.length === filteredRequests.length) {
            setSelectedIds([]);
        } else {
            // Seleccionar únicamente las muestras sin alertas para evitar liberar errores por descuido
            const safeIds = filteredRequests
                .filter(req => !req.analyzerResults?.some(res => checkBounds(res.testCode, res.value)))
                .map(r => r.id);
            setSelectedIds(safeIds);
            if (safeIds.length < filteredRequests.length) {
                alert("Se seleccionaron únicamente las muestras con resultados dentro de rangos normales por seguridad de calidad.");
            }
        }
    };

    const toggleSelection = (id, hasFlags) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id));
        } else {
            if (hasFlags && !window.confirm('Esta muestra tiene resultados fuera de rango (Alerta QC). ¿Desea seleccionarla de todos modos?')) {
                return;
            }
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Liberación en Lote con firma digital e historia ISO
    const handleBatchRelease = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`¿Confirma la liberación y firma digital en lote de ${selectedIds.length} muestras seleccionadas?`)) return;

        const signerName = labInfo?.directorName || user?.displayName || 'Dr. Roldán Ajún Chaverri';
        const signerCode = labInfo?.directorCode || '802';
        const validationTimestamp = new Date().toISOString();

        try {
            if (user?.uid === 'offline-user') {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                selectedIds.forEach(id => {
                    const idx = localReqs.findIndex(r => r.id === id);
                    if (idx > -1) {
                        const updatedResults = localReqs[idx].analyzerResults?.map(r => ({ ...r, status: 'released' })) || [];
                        localReqs[idx].status = 'Completado';
                        localReqs[idx].analyzerResults = updatedResults;
                        localReqs[idx].signedByName = signerName;
                        localReqs[idx].signedByCode = signerCode;
                        localReqs[idx].validatedAt = validationTimestamp;
                        localReqs[idx].validationDate = validationTimestamp;
                        localReqs[idx].isVerified = true;
                    }
                });
                localStorage.setItem('lims_local_requests', JSON.stringify(localReqs));
                window.dispatchEvent(new Event('lims_local_data_updated'));
                setSelectedIds([]);
                alert(`Lote de ${selectedIds.length} muestras liberado y firmado digitalmente.`);
            } else {
                if (!db) return;
                const CHUNK_SIZE = 450;
                for (let i = 0; i < selectedIds.length; i += CHUNK_SIZE) {
                    const chunk = selectedIds.slice(i, i + CHUNK_SIZE);
                    const batch = writeBatch(db);
                    chunk.forEach(id => {
                        const req = filteredRequests.find(r => r.id === id);
                        if (req) {
                            const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, id);
                            const updatedResults = req.analyzerResults?.map(r => ({ ...r, status: 'released' })) || [];
                            batch.update(reqRef, {
                                analyzerResults: updatedResults,
                                status: 'Completado',
                                signedByName: signerName,
                                signedByCode: signerCode,
                                validatedAt: validationTimestamp,
                                validationDate: validationTimestamp,
                                isVerified: true
                            });
                        }
                    });
                    await batch.commit();
                }

                for (const id of selectedIds) {
                    const req = filteredRequests.find(r => r.id === id);
                    if (req) {
                        await deductInventoryForRequest(db, req, user);
                    }
                }
                setSelectedIds([]);
                alert(`Lote de ${selectedIds.length} muestras liberado y firmado digitalmente.`);
            }
        } catch (e) {
            console.error(e);
            alert("Error al liberar resultados en lote: " + e.message);
        }
    };

    // --- AVANCE DEL FLUJO DE TRABAJO ---
    const advanceWorkflowStep = async (request) => {
        const isOffline = user?.uid === 'offline-user';
        if (!db && !isOffline) return;
        
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
            const signature = window.prompt("Por favor, ingrese sus iniciales o PIN para la Aprobación Final:");
            if (!signature) {
                alert("La firma técnica es obligatoria para la aprobación final.");
                return;
            }
            nextStatus = 'Completado';
            actionMessage = 'aprobado y liberado finalmente';
        }

        try {
            const signerName = labInfo?.directorName || user?.displayName || 'Dr. Roldán Ajún Chaverri';
            const signerCode = labInfo?.directorCode || '802';
            const validationTimestamp = new Date().toISOString();

            const updatePayload = { status: nextStatus };
            if (nextStatus === 'Completado') {
                if (request.analyzerResults) {
                    updatePayload.analyzerResults = request.analyzerResults.map(r => ({ ...r, status: 'released' }));
                }
                updatePayload.signedByName = signerName;
                updatePayload.signedByCode = signerCode;
                updatePayload.validatedAt = validationTimestamp;
                updatePayload.validationDate = validationTimestamp;
                updatePayload.isVerified = true;
            }

            if (isOffline) {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const idx = localReqs.findIndex(r => r.id === request.id);
                if (idx > -1) {
                    localReqs[idx] = { ...localReqs[idx], ...updatePayload };
                }
                localStorage.setItem('lims_local_requests', JSON.stringify(localReqs));
                window.dispatchEvent(new Event('lims_local_data_updated'));
                setSelectedIds(selectedIds.filter(id => id !== request.id));
                
                if (nextStatus === 'Completado') {
                    await NotificationService.notifyClientResultsReady(request, alert);
                } else {
                    alert(`Flujo actualizado: Muestra ${actionMessage}.`);
                }
            } else {
                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, request.id);
                await updateDoc(reqRef, updatePayload);

                if (nextStatus === 'Completado') {
                    await deductInventoryForRequest(db, request, user);
                    await NotificationService.notifyClientResultsReady(request, alert);
                } else {
                    alert(`Flujo actualizado: Muestra ${actionMessage}.`);
                }
                setSelectedIds(selectedIds.filter(id => id !== request.id));
            }
        } catch (error) {
            console.error("Error al avanzar etapa:", error);
            alert("Ocurrió un error al actualizar la solicitud.");
        }
    };

    // --- ACCIÓN: EDICIÓN IN-LINE DE VALORES DE RESULTADO ---
    const handleSaveInlineEdit = async () => {
        if (!editingItem) return;
        const { reqId, testIndex, newValue } = editingItem;

        try {
            const isOffline = user?.uid === 'offline-user';
            let targetReq = filteredRequests.find(r => r.id === reqId);
            if (!targetReq) return;

            const updatedResults = [...(targetReq.analyzerResults || [])];
            const oldVal = updatedResults[testIndex]?.value || '';
            updatedResults[testIndex] = {
                ...updatedResults[testIndex],
                value: newValue,
                lastModifiedBy: user?.displayName || 'Analista',
                lastModifiedAt: new Date().toISOString()
            };

            if (isOffline) {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const idx = localReqs.findIndex(r => r.id === reqId);
                if (idx > -1) {
                    localReqs[idx].analyzerResults = updatedResults;
                    localStorage.setItem('lims_local_requests', JSON.stringify(localReqs));
                }
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else {
                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, reqId);
                await updateDoc(reqRef, { analyzerResults: updatedResults });
            }

            await logAuditAction(
                db, 
                user?.uid || 'user', 
                'RESULTADO_MODIFICADO_INLINE', 
                `Valor del parámetro ${editingItem.testCode} modificado de "${oldVal}" a "${newValue}"`, 
                reqId
            );

            setEditingItem(null);
            alert(`Resultado actualizado correctamente a "${newValue}".`);

        } catch (e) {
            console.error("Error editando resultado:", e);
            alert("Error al actualizar el resultado.");
        }
    };

    // --- ACCIÓN: ELIMINACIÓN / ANULACIÓN DE PARÁMETRO CON MOTIVO ---
    const handleConfirmDelete = async () => {
        if (!deletingItem || !deleteReason.trim()) {
            alert("Debe indicar la razón de la eliminación para cumplir con auditoría ISO 15189.");
            return;
        }

        const { reqId, testIndex, testCode, value } = deletingItem;

        try {
            const isOffline = user?.uid === 'offline-user';
            let targetReq = filteredRequests.find(r => r.id === reqId);
            if (!targetReq) return;

            const updatedResults = (targetReq.analyzerResults || []).filter((_, idx) => idx !== testIndex);

            if (isOffline) {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const idx = localReqs.findIndex(r => r.id === reqId);
                if (idx > -1) {
                    localReqs[idx].analyzerResults = updatedResults;
                    localStorage.setItem('lims_local_requests', JSON.stringify(localReqs));
                }
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else {
                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, reqId);
                await updateDoc(reqRef, { analyzerResults: updatedResults });
            }

            await logAuditAction(
                db, 
                user?.uid || 'user', 
                'RESULTADO_ELIMINADO_ANULADO', 
                `Parámetro ${testCode} (valor: "${value}") eliminado. Motivo: ${deleteReason}`, 
                reqId
            );

            setDeletingItem(null);
            setDeleteReason('');
            alert(`Parámetro ${testCode} eliminado y registrado en la bitácora de auditoría.`);

        } catch (e) {
            console.error("Error eliminando resultado:", e);
            alert("Error al eliminar el resultado.");
        }
    };

    // --- ACCIÓN: AÑADIR PARÁMETRO MANUALMENTE ---
    const handleSaveNewParam = async () => {
        if (!showAddParamModal || !newParamCode || !newParamVal) {
            alert("Complete el código y el valor del parámetro.");
            return;
        }

        try {
            const reqId = showAddParamModal;
            const isOffline = user?.uid === 'offline-user';
            let targetReq = filteredRequests.find(r => r.id === reqId);
            if (!targetReq) return;

            const newObj = {
                testCode: newParamCode,
                value: newParamVal,
                origin: 'Ingreso Manual In-Line',
                timestamp: new Date().toISOString(),
                status: 'pending_review'
            };

            const updatedResults = [...(targetReq.analyzerResults || []), newObj];

            if (isOffline) {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const idx = localReqs.findIndex(r => r.id === reqId);
                if (idx > -1) {
                    localReqs[idx].analyzerResults = updatedResults;
                    localStorage.setItem('lims_local_requests', JSON.stringify(localReqs));
                }
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else {
                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, reqId);
                await updateDoc(reqRef, { analyzerResults: updatedResults });
            }

            setShowAddParamModal(null);
            setNewParamCode('');
            setNewParamVal('');
            alert(`Parámetro ${newParamCode} añadido exitosamente a la muestra.`);

        } catch (e) {
            console.error(e);
            alert("Error añadiendo parámetro.");
        }
    };

    const getWorkflowActionText = (status) => {
        if (status === 'En Proceso') return { text: 'Marcar Preparado', icon: <Beaker size={16} /> };
        if (status === 'Pendiente Lectura' || status === 'Pendiente Revisión') return { text: 'Validar Técnico', icon: <CheckCircle2 size={16} /> };
        if (status === 'Pendiente Aprobación') return { text: 'Aprobar & Firmar', icon: <CheckSquare size={16} /> };
        return { text: 'Avanzar Flujo', icon: <Clock size={16} /> };
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 text-slate-800">
            {/* Header del Módulo */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <FlaskConical className="text-indigo-600" /> Módulo de Revisión, Edición y Búsqueda de Resultados
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Busque muestras, edite valores in-line, anule parámetros erróneos y firme liberaciones con auditoría ISO 15189.</p>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                    <button 
                        onClick={handleSelectAll} 
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Selecciona automáticamente todas las muestras 100% dentro de límites normales"
                    >
                        <CheckSquare size={16} /> Auto-Aprobar Normales
                    </button>
                    {selectedIds.length > 0 && (
                        <button onClick={handleBatchRelease} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md animate-slide-in-right cursor-pointer">
                            <CheckCircle2 size={16} /> Liberar Lote ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* TABLERO DE ESTADÍSTICAS RÁPIDAS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase text-[10px]">Muestras en Pantalla</p>
                        <h3 className="text-xl font-black text-slate-800">{stats.total}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                        <AlertOctagon size={20} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase text-[10px]">Alertas Fuera Rango (QC)</p>
                        <h3 className="text-xl font-black text-red-600">{stats.alerts}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase text-[10px]">Pendientes Firma</p>
                        <h3 className="text-xl font-black text-slate-800">{stats.pendingApproval}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <Cpu size={20} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase text-[10px]">De Analizadores</p>
                        <h3 className="text-xl font-black text-blue-600">{stats.automated}</h3>
                    </div>
                </div>
            </div>

            {/* BARRA DE BÚSQUEDA INTELIGENTE Y FILTROS AVANZADOS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* Input de Búsqueda Principal */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por Paciente, Cédula, Código de Barras (MC-XXXX), Doctor o Examen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Selector Vista Tarjetas / Tabla */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-end md:self-auto shrink-0">
                        <button 
                            onClick={() => setViewMode('cards')} 
                            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                            title="Vista de Tarjetas Detalladas"
                        >
                            <LayoutGrid size={16} /> Tarjetas
                        </button>
                        <button 
                            onClick={() => setViewMode('table')} 
                            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                            title="Vista Tabla Hoja de Cálculo"
                        >
                            <LayoutList size={16} /> Tabla
                        </button>
                    </div>
                </div>

                {/* Dropdowns de Filtros */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
                    {/* Filtro Estado */}
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all_pending">⏳ Todos los Pendientes (En Flujo)</option>
                        <option value="all">🌐 Todas las Muestras (Incluye Completados)</option>
                        <option value="En Proceso">🔬 En Proceso</option>
                        <option value="Pendiente Lectura">📖 Pendiente Lectura</option>
                        <option value="Pendiente Aprobación">✍️ Pendiente Aprobación / Firma</option>
                        <option value="Completado">✅ Completados y Liberados</option>
                    </select>

                    {/* Filtro QC */}
                    <select 
                        value={qcFilter} 
                        onChange={(e) => setQcFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">📊 Alertas QC: Todas</option>
                        <option value="alerts_only">🚨 Solo Fuera de Rango (Alertas)</option>
                        <option value="normal_only">🟢 Solo Parámetros Normales</option>
                    </select>

                    {/* Filtro Origen */}
                    <select 
                        value={originFilter} 
                        onChange={(e) => setOriginFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">🤖 Origen: Todos</option>
                        <option value="automated">📟 Solo Analizador Automatizado (HL7/ASTM)</option>
                        <option value="manual">📝 Solo Ingreso Manual</option>
                    </select>

                    {(searchTerm || statusFilter !== 'all_pending' || qcFilter !== 'all' || originFilter !== 'all') && (
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all_pending');
                                setQcFilter('all');
                                setOriginFilter('all');
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1.5 flex items-center gap-1 ml-auto cursor-pointer"
                        >
                            <RotateCcw size={14} /> Limpiar Filtros
                        </button>
                    )}
                </div>
            </div>

            {/* SECCIÓN PRINCIPAL DE RESULTADOS */}
            {filteredRequests.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-3" />
                    <h3 className="text-lg font-extrabold text-slate-700">No se encontraron resultados</h3>
                    <p className="text-slate-500 text-xs mt-1">No hay muestras que coincidan con el término de búsqueda o los filtros seleccionados.</p>
                </div>
            ) : viewMode === 'cards' ? (
                /* VISTA DE TARJETAS DETALLADAS */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredRequests.map(req => {
                        const hasFlags = req.analyzerResults?.some(r => checkBounds(r.testCode, r.value));
                        const isSelected = selectedIds.includes(req.id);

                        return (
                            <div key={req.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all ${hasFlags ? 'border-red-300 ring-1 ring-red-200' : isSelected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                                {/* Tarjeta Header */}
                                <div className={`p-4 border-b flex justify-between items-start ${hasFlags ? 'bg-red-50/60 border-red-100' : isSelected ? 'bg-indigo-50/60 border-indigo-100' : 'bg-slate-50/70 border-slate-100'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="pt-1">
                                            <input 
                                                type="checkbox" 
                                                className={`w-4 h-4 rounded cursor-pointer ${hasFlags ? 'border-red-300 text-red-600' : 'border-slate-300 text-indigo-600'}`}
                                                checked={isSelected}
                                                onChange={() => toggleSelection(req.id, hasFlags)}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">#{req.id.substring(0, 10)}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${req.status === 'Completado' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{req.status}</span>
                                            </div>
                                            <h3 className="font-extrabold text-slate-800 text-base">{req.clientName || req.patientName || 'Cliente'}</h3>
                                            <p className={`text-xs flex items-center gap-1 mt-0.5 ${hasFlags ? 'text-red-700 font-bold' : 'text-slate-600 font-medium'}`}>
                                                {hasFlags ? <AlertOctagon size={14} className="text-red-600" /> : <Beaker size={14} />} 
                                                {req.analysisRequested || 'Análisis Clinico'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => setShowAddParamModal(req.id)}
                                            className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                                            title="Añadir parámetro manualmente"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <button 
                                            onClick={() => navigateTo('request_details', req.id)} 
                                            className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Ver Ficha
                                        </button>
                                    </div>
                                </div>

                                {/* Tabla de Resultados en la Tarjeta */}
                                <div className="p-4 flex-1 overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-slate-400 border-b border-slate-100 font-bold uppercase text-[9px]">
                                                <th className="pb-2">Parámetro</th>
                                                <th className="pb-2">Resultado</th>
                                                <th className="pb-2 text-right">Origen</th>
                                                <th className="pb-2 text-center w-16">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {req.analyzerResults?.map((res, i) => {
                                                const boundError = checkBounds(res.testCode, res.value);
                                                return (
                                                    <tr key={i} className={`hover:bg-slate-50/80 transition-colors ${boundError ? 'bg-red-50/40' : ''}`}>
                                                        <td className="py-2.5 font-bold text-slate-700">
                                                            {analyses?.find(a => a.code === res.testCode)?.name || res.testCode}
                                                            {boundError && <p className="text-[9px] text-red-600 font-black uppercase mt-0.5">{boundError}</p>}
                                                        </td>
                                                        <td className={`py-2.5 font-black text-sm ${boundError ? 'text-red-600' : 'text-blue-900'}`}>
                                                            {!res.value ? (
                                                                <span className="text-slate-400 italic font-medium text-xs">Pendiente</span>
                                                            ) : (
                                                                res.value
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 text-right text-[10px]">
                                                            {res.origin && res.origin.includes('Automatizado') ? (
                                                                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100" title={res.origin}>
                                                                    📟 {res.origin.replace('Automatizado (', '').replace(')', '')}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold" title={res.origin || 'Ingreso Manual'}>
                                                                    📝 {res.origin || 'Manual'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button 
                                                                    onClick={() => setEditingItem({ reqId: req.id, testIndex: i, testCode: res.testCode, testName: analyses?.find(a => a.code === res.testCode)?.name || res.testCode, value: res.value, newValue: res.value || '' })}
                                                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                                                                    title="Modificar resultado in-line"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setDeletingItem({ reqId: req.id, testIndex: i, testCode: res.testCode, testName: analyses?.find(a => a.code === res.testCode)?.name || res.testCode, value: res.value })}
                                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Eliminar / Anular parámetro"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer de Acción de la Tarjeta */}
                                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-bold font-mono">Recibido: {req.requestDate ? new Date(req.requestDate.seconds ? req.requestDate.seconds * 1000 : req.requestDate).toLocaleDateString('es-CR') : 'Hoy'}</span>
                                    <button 
                                        onClick={() => advanceWorkflowStep(req)} 
                                        className={`px-4 py-1.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-xs cursor-pointer ${hasFlags ? 'bg-red-600 hover:bg-red-700' : req.status === 'Pendiente Aprobación' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    >
                                        {getWorkflowActionText(req.status).icon} {getWorkflowActionText(req.status).text}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* VISTA TABLA HOJA DE CÁLCULO */
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                                <tr>
                                    <th className="p-3 w-10 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                                            checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="p-3">Código Muestra</th>
                                    <th className="p-3">Paciente / Cliente</th>
                                    <th className="p-3">Examen / Análisis</th>
                                    <th className="p-3 text-center">Parámetros Detalle</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.map(req => {
                                    const hasFlags = req.analyzerResults?.some(r => checkBounds(r.testCode, r.value));
                                    const isSelected = selectedIds.includes(req.id);

                                    return (
                                        <tr key={req.id} className={`hover:bg-slate-50 transition-colors ${hasFlags ? 'bg-red-50/30' : ''}`}>
                                            <td className="p-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(req.id, hasFlags)}
                                                />
                                            </td>
                                            <td className="p-3 font-mono font-bold text-blue-600">#{req.id.substring(0, 10)}</td>
                                            <td className="p-3 font-bold text-slate-800">{req.clientName || req.patientName || 'Cliente'}</td>
                                            <td className="p-3 text-slate-700 font-medium">{req.analysisRequested || 'Análisis Clínico'}</td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {req.analyzerResults?.map((r, i) => {
                                                        const err = checkBounds(r.testCode, r.value);
                                                        return (
                                                            <span 
                                                                key={i} 
                                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${err ? 'bg-red-100 text-red-800 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                                                                title={`${r.testCode}: ${r.value || 'Pendiente'}`}
                                                            >
                                                                {r.testCode}: <strong>{r.value || '?'}</strong>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${req.status === 'Completado' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{req.status}</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button 
                                                        onClick={() => advanceWorkflowStep(req)}
                                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-colors"
                                                    >
                                                        Avanzar
                                                    </button>
                                                    <button 
                                                        onClick={() => navigateTo('request_details', req.id)}
                                                        className="p-1 text-slate-500 hover:text-blue-600 rounded"
                                                        title="Ver Ficha"
                                                    >
                                                        <Search size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL 1: EDICIÓN IN-LINE DE RESULTADOS */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                                <Edit3 className="text-indigo-600" size={18} /> Modificar Valor de Resultado
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <p className="text-slate-500 font-bold uppercase text-[9px]">Parámetro / Examen</p>
                                <p className="font-black text-slate-800 text-sm">{editingItem.testName} ({editingItem.testCode})</p>
                                <p className="text-slate-500 text-[10px] mt-0.5">Valor actual registrado: <strong className="text-slate-700">{editingItem.value || 'Pendiente'}</strong></p>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Nuevo Valor Modificado</label>
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={editingItem.newValue}
                                    onChange={(e) => setEditingItem({ ...editingItem, newValue: e.target.value })}
                                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-black font-mono text-blue-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {checkBounds(editingItem.testCode, editingItem.newValue) && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl flex items-center gap-2 font-bold text-xs">
                                    <AlertTriangle size={16} />
                                    <span>Alerta QC: {checkBounds(editingItem.testCode, editingItem.newValue)}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 flex justify-end gap-2 text-xs">
                            <button onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold">
                                Cancelar
                            </button>
                            <button onClick={handleSaveInlineEdit} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md flex items-center gap-1.5">
                                <Save size={16} /> Guardar Cambio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ELIMINACIÓN Y ANULACIÓN DE RESULTADO CON MOTIVO */}
            {deletingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-red-100">
                            <h3 className="font-extrabold text-base text-red-700 flex items-center gap-2">
                                <Trash2 size={18} /> Anular / Eliminar Parámetro
                            </h3>
                            <button onClick={() => setDeletingItem(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-slate-700">
                            <div className="bg-red-50/50 p-3 rounded-xl border border-red-200">
                                <p className="text-red-600 font-bold uppercase text-[9px]">Confirme la eliminación del parámetro</p>
                                <p className="font-black text-slate-800 text-sm mt-0.5">{deletingItem.testName} ({deletingItem.testCode})</p>
                                <p className="text-slate-600 text-[10px]">Valor registrado: <strong>{deletingItem.value || 'N/A'}</strong></p>
                            </div>

                            <div>
                                <label className="font-bold text-slate-800 block mb-1">Motivo Obligatorio de Anulación (ISO 15189)</label>
                                <textarea 
                                    rows={3}
                                    required
                                    placeholder="Ej. Muestra hemolizada / Transmisión errónea del analizador / Parámetro no solicitado..."
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2 text-xs">
                            <button onClick={() => setDeletingItem(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDelete} className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-md flex items-center gap-1.5">
                                <Trash2 size={16} /> Confirmar Anulación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: AÑADIR PARÁMETRO MANUALMENTE */}
            {showAddParamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                                <Plus className="text-indigo-600" size={18} /> Añadir Parámetro a la Muestra
                            </h3>
                            <button onClick={() => setShowAddParamModal(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Código / Nombre del Parámetro</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. GLU-01, HEM-05, Proteínas..."
                                    value={newParamCode}
                                    onChange={(e) => setNewParamCode(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Valor Obtenido</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. 95, Positivo, Ausencia..."
                                    value={newParamVal}
                                    onChange={(e) => setNewParamVal(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2 text-xs">
                            <button onClick={() => setShowAddParamModal(null)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold">
                                Cancelar
                            </button>
                            <button onClick={handleSaveNewParam} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md flex items-center gap-1.5">
                                <Save size={16} /> Añadir Parámetro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
