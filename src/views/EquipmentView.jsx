import React, { useState, useEffect } from 'react';
import { Microscope, PlusCircle, Search, Edit, Trash2, Calendar, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';

export const EquipmentView = ({ db, user }) => {
    const [equipmentList, setEquipmentList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEquipmentId, setEditingEquipmentId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    // Form fields
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [status, setStatus] = useState('Activo');
    const [location, setLocation] = useState('Laboratorio General');
    const [lastMaintenance, setLastMaintenance] = useState('');
    const [nextMaintenance, setNextMaintenance] = useState('');
    const [calibrationDate, setCalibrationDate] = useState('');

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, `artifacts/${LIMSSystemId}/public/data/equipment`));
        const unsub = onSnapshot(q, (snapshot) => {
            const eqData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEquipmentList(eqData);
        }, (err) => {
            console.error("Error cargando equipos:", err);
            addNotification("Error al cargar la lista de equipos.", "error");
        });
        return () => unsub();
    }, [db, addNotification]);

    const filteredEquipment = equipmentList.filter(eq => 
        (eq.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (eq.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (eq.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name || !brand || !serialNumber) {
            addNotification("Por favor, complete los campos obligatorios.", "error");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name,
                brand,
                model,
                serialNumber,
                status,
                location,
                lastMaintenance,
                nextMaintenance,
                calibrationDate,
            };

            if (editingEquipmentId) {
                const docRef = doc(db, `artifacts/${LIMSSystemId}/public/data/equipment`, editingEquipmentId);
                await updateDoc(docRef, { ...payload, updatedAt: serverTimestamp() });
                await logAuditAction(db, user?.uid, 'EDITAR_EQUIPO', `Editó equipo: ${name} (${serialNumber})`, editingEquipmentId);
                addNotification("Equipo actualizado exitosamente.", "success");
            } else {
                payload.createdAt = serverTimestamp();
                const newDocRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/equipment`), payload);
                await logAuditAction(db, user?.uid, 'REGISTRAR_EQUIPO', `Registró nuevo equipo: ${name} (${serialNumber})`, newDocRef.id);
                addNotification("Equipo registrado exitosamente.", "success");
            }
            closeModal();
        } catch (error) {
            console.error("Error al guardar equipo:", error);
            addNotification("Error al guardar el equipo.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id, eqName) => {
        if (!window.confirm(`¿Está seguro de eliminar permanentemente el equipo "${eqName}"? Esta acción no se puede deshacer y borrará todo el historial asociado.`)) return;
        try {
            await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/equipment`, id));
            await logAuditAction(db, user?.uid, 'ELIMINAR_EQUIPO', `Eliminó equipo: ${eqName}`, id);
            addNotification("Equipo eliminado exitosamente.", "success");
        } catch (error) {
            console.error("Error eliminando equipo:", error);
            addNotification("Error al eliminar el equipo.", "error");
        }
    };

    const openEditModal = (eq) => {
        setEditingEquipmentId(eq.id);
        setName(eq.name || '');
        setBrand(eq.brand || '');
        setModel(eq.model || '');
        setSerialNumber(eq.serialNumber || '');
        setStatus(eq.status || 'Activo');
        setLocation(eq.location || 'Laboratorio General');
        setLastMaintenance(eq.lastMaintenance || '');
        setNextMaintenance(eq.nextMaintenance || '');
        setCalibrationDate(eq.calibrationDate || '');
        setShowModal(true);
    };

    const closeModal = () => {
        setEditingEquipmentId(null);
        setName('');
        setBrand('');
        setModel('');
        setSerialNumber('');
        setStatus('Activo');
        setLocation('Laboratorio General');
        setLastMaintenance('');
        setNextMaintenance('');
        setCalibrationDate('');
        setShowModal(false);
    };

    const isMaintenanceDue = (nextMaintDate) => {
        if (!nextMaintDate) return false;
        const nextDate = new Date(nextMaintDate);
        const today = new Date();
        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 15; // Alerta 15 días antes
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Wrench className="text-indigo-600" /> Inventario de Equipos
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de analizadores, mantenimientos y calibraciones.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all"
                >
                    <PlusCircle size={18} /> Registrar Equipo
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, marca o serie..."
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
                                <th className="p-4 font-bold w-1/4">Equipo</th>
                                <th className="p-4 font-bold">Marca / Modelo</th>
                                <th className="p-4 font-bold">No. Serie</th>
                                <th className="p-4 font-bold">Estado</th>
                                <th className="p-4 font-bold">Próx. Mantenimiento</th>
                                <th className="p-4 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEquipment.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500 italic">No hay equipos registrados.</td>
                                </tr>
                            ) : (
                                filteredEquipment.map(eq => {
                                    const needsMaint = isMaintenanceDue(eq.nextMaintenance);
                                    return (
                                        <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    <Microscope className="text-slate-400" size={16} />
                                                    {eq.name}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">{eq.location}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-slate-700">{eq.brand}</div>
                                                <div className="text-xs text-slate-500">{eq.model || 'N/A'}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                                                    {eq.serialNumber}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    eq.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' :
                                                    eq.status === 'En Reparación' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {eq.status === 'Activo' && <CheckCircle2 size={12} />}
                                                    {eq.status === 'En Reparación' && <Wrench size={12} />}
                                                    {eq.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className={`flex items-center gap-2 text-sm ${needsMaint ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                                    <Calendar size={14} />
                                                    {eq.nextMaintenance ? new Date(eq.nextMaintenance).toLocaleDateString() : 'No definido'}
                                                    {needsMaint && <AlertTriangle size={14} className="text-red-500" title="Mantenimiento próximo o vencido" />}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditModal(eq)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar Equipo">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(eq.id, eq.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Equipo">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro/Edición */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-scale-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Microscope className="text-indigo-600" />
                                {editingEquipmentId ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">✕</button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre del Equipo *</label>
                                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Ej. Analizador de Hematología XN-1000" />
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Marca *</label>
                                    <input type="text" required value={brand} onChange={e => setBrand(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Ej. Sysmex" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Modelo</label>
                                    <input type="text" value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Número de Serie *</label>
                                    <input type="text" required value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors font-mono text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
                                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors">
                                        <option value="Activo">Activo (Operativo)</option>
                                        <option value="En Reparación">En Reparación</option>
                                        <option value="Inactivo">Inactivo / De baja</option>
                                    </select>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Ubicación</label>
                                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Ej. Área de Hematología" />
                                </div>

                                <div className="md:col-span-2 border-t border-slate-100 my-2 pt-4">
                                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Calendar size={16}/> Fechas Clave</h4>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Último Mantenimiento</label>
                                    <input type="date" value={lastMaintenance} onChange={e => setLastMaintenance(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors text-slate-700" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Próximo Mantenimiento</label>
                                    <input type="date" value={nextMaintenance} onChange={e => setNextMaintenance(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors text-slate-700" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Última Calibración</label>
                                    <input type="date" value={calibrationDate} onChange={e => setCalibrationDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors text-slate-700" />
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50">
                                    {isSaving ? 'Guardando...' : 'Guardar Equipo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
