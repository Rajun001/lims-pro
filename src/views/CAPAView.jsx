import React, { useState, useEffect } from 'react';
import { ShieldAlert, PlusCircle, Search, Edit, Trash2, Calendar, FileText, CheckCircle, AlertOctagon, Activity } from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';

export const CAPAView = ({ db, user }) => {
    const [capaList, setCapaList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCapaId, setEditingCapaId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    // Form fields
    const [title, setTitle] = useState('');
    const [type, setType] = useState('No Conformidad'); // No Conformidad, Acción Correctiva, Acción Preventiva
    const [origin, setOrigin] = useState('Auditoría Interna'); // Auditoría Interna, Queja de Cliente, Control de Calidad, Equipos, Otro
    const [severity, setSeverity] = useState('Media'); // Baja, Media, Alta, Crítica
    const [status, setStatus] = useState('Abierta'); // Abierta, En Análisis, Cerrada
    const [description, setDescription] = useState('');
    const [rootCause, setRootCause] = useState('');
    const [actionsTaken, setActionsTaken] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, `artifacts/${LIMSSystemId}/public/data/capa`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const capaData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCapaList(capaData);
        }, (err) => {
            console.error("Error cargando CAPAs:", err);
            addNotification("Error al cargar la lista de No Conformidades.", "error");
        });
        return () => unsub();
    }, [db, addNotification]);

    const filteredCapa = capaList.filter(c => 
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.assignedTo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = async (e) => {
        e.preventDefault();
        if (!title || !description) {
            addNotification("Por favor, complete el Título y la Descripción.", "error");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                title,
                type,
                origin,
                severity,
                status,
                description,
                rootCause,
                actionsTaken,
                assignedTo,
                dueDate,
            };

            if (editingCapaId) {
                const docRef = doc(db, `artifacts/${LIMSSystemId}/public/data/capa`, editingCapaId);
                await updateDoc(docRef, { ...payload, updatedAt: serverTimestamp() });
                await logAuditAction(db, user?.uid, 'EDITAR_CAPA', `Editó CAPA/NC: ${title}`, editingCapaId);
                addNotification("Registro actualizado exitosamente.", "success");
            } else {
                payload.createdAt = serverTimestamp();
                payload.createdBy = user?.uid || 'Sistema';
                const newDocRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/capa`), payload);
                await logAuditAction(db, user?.uid, 'REGISTRAR_CAPA', `Registró nueva CAPA/NC: ${title}`, newDocRef.id);
                addNotification("Registro creado exitosamente.", "success");
            }
            closeModal();
        } catch (error) {
            console.error("Error al guardar CAPA:", error);
            addNotification("Error al guardar el registro.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id, capaTitle) => {
        if (!window.confirm(`¿Está seguro de eliminar permanentemente este registro CAPA: "${capaTitle}"? Esta acción borrará la incidencia del historial de calidad de forma irreversible.`)) return;
        try {
            await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/capa`, id));
            await logAuditAction(db, user?.uid, 'ELIMINAR_CAPA', `Eliminó CAPA/NC: ${capaTitle}`, id);
            addNotification("Registro eliminado exitosamente.", "success");
        } catch (error) {
            console.error("Error eliminando CAPA:", error);
            addNotification("Error al eliminar el registro.", "error");
        }
    };

    const openEditModal = (capa) => {
        setEditingCapaId(capa.id);
        setTitle(capa.title || '');
        setType(capa.type || 'No Conformidad');
        setOrigin(capa.origin || 'Auditoría Interna');
        setSeverity(capa.severity || 'Media');
        setStatus(capa.status || 'Abierta');
        setDescription(capa.description || '');
        setRootCause(capa.rootCause || '');
        setActionsTaken(capa.actionsTaken || '');
        setAssignedTo(capa.assignedTo || '');
        setDueDate(capa.dueDate || '');
        setShowModal(true);
    };

    const closeModal = () => {
        setEditingCapaId(null);
        setTitle('');
        setType('No Conformidad');
        setOrigin('Auditoría Interna');
        setSeverity('Media');
        setStatus('Abierta');
        setDescription('');
        setRootCause('');
        setActionsTaken('');
        setAssignedTo('');
        setDueDate('');
        setShowModal(false);
    };

    const getSeverityBadge = (sev) => {
        switch(sev) {
            case 'Crítica': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">Crítica</span>;
            case 'Alta': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-200">Alta</span>;
            case 'Media': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200">Media</span>;
            case 'Baja': return <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded text-xs font-bold border border-sky-200">Baja</span>;
            default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{sev}</span>;
        }
    };

    const getStatusIcon = (stat) => {
        switch(stat) {
            case 'Abierta': return <AlertOctagon size={14} className="text-red-500" />;
            case 'En Análisis': return <Activity size={14} className="text-blue-500" />;
            case 'Cerrada': return <CheckCircle size={14} className="text-emerald-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-indigo-600" /> Módulo de Calidad (CAPA)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de No Conformidades, Acciones Correctivas y Preventivas (ISO 17025).</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all"
                >
                    <PlusCircle size={18} /> Nueva Incidencia
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar incidencias..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="p-4 font-bold w-1/3">Incidencia</th>
                                <th className="p-4 font-bold">Tipo / Origen</th>
                                <th className="p-4 font-bold">Severidad</th>
                                <th className="p-4 font-bold">Estado</th>
                                <th className="p-4 font-bold">Responsable</th>
                                <th className="p-4 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCapa.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500 italic">No se encontraron incidencias de calidad.</td>
                                </tr>
                            ) : (
                                filteredCapa.map(capa => (
                                    <tr key={capa.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                <FileText className="text-slate-400" size={16} />
                                                {capa.title}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 max-w-xs truncate" title={capa.description}>
                                                {capa.description}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                                                ID: {capa.id.substring(0, 8).toUpperCase()} | {new Date(capa.createdAt?.seconds * 1000).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-slate-700">{capa.type}</div>
                                            <div className="text-xs text-slate-500">{capa.origin}</div>
                                        </td>
                                        <td className="p-4">
                                            {getSeverityBadge(capa.severity)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                capa.status === 'Abierta' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                capa.status === 'En Análisis' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            }`}>
                                                {getStatusIcon(capa.status)}
                                                {capa.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-700">{capa.assignedTo || 'Sin asignar'}</div>
                                            {capa.dueDate && (
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Calendar size={12} /> Límite: {new Date(capa.dueDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEditModal(capa)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(capa.id, capa.title)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro/Edición CAPA */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl my-8 flex flex-col max-h-[90vh] animate-scale-up">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ShieldAlert className="text-indigo-600" size={20} />
                                {editingCapaId ? 'Editar Incidencia de Calidad' : 'Registrar Nueva Incidencia (CAPA)'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors">✕</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="capa-form" onSubmit={handleSave} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Título de la Incidencia *</label>
                                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="Ej. Falla de calibración en analizador químico" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                                        <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700">
                                            <option value="No Conformidad">No Conformidad</option>
                                            <option value="Acción Correctiva">Acción Correctiva</option>
                                            <option value="Acción Preventiva">Acción Preventiva</option>
                                            <option value="Oportunidad de Mejora">Oportunidad de Mejora</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Origen</label>
                                        <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700">
                                            <option value="Auditoría Interna">Auditoría Interna</option>
                                            <option value="Auditoría Externa">Auditoría Externa</option>
                                            <option value="Queja de Cliente">Queja de Cliente</option>
                                            <option value="Control de Calidad">Control de Calidad</option>
                                            <option value="Equipos">Falla de Equipos</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Severidad</label>
                                        <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700">
                                            <option value="Baja">Baja</option>
                                            <option value="Media">Media</option>
                                            <option value="Alta">Alta</option>
                                            <option value="Crítica">Crítica</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Descripción Detallada *</label>
                                    <textarea required value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-y" placeholder="Describa el problema, lugar y contexto..."></textarea>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Análisis de Causa Raíz (Opcional)</label>
                                    <textarea value={rootCause} onChange={e => setRootCause(e.target.value)} rows="2" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-y" placeholder="¿Por qué ocurrió el problema?"></textarea>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Acciones Tomadas / Plan de Acción</label>
                                    <textarea value={actionsTaken} onChange={e => setActionsTaken(e.target.value)} rows="3" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-y" placeholder="Acciones correctivas implementadas o planificadas..."></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Responsable</label>
                                        <input type="text" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombre del responsable" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Fecha Límite</label>
                                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Estado Actual</label>
                                        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800">
                                            <option value="Abierta">🔴 Abierta</option>
                                            <option value="En Análisis">🔵 En Análisis</option>
                                            <option value="Cerrada">🟢 Cerrada</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
                            <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                            <button type="submit" form="capa-form" disabled={isSaving} className="px-8 py-2.5 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50">
                                {isSaving ? 'Guardando...' : 'Guardar Registro'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
