import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, TestTube, PlusCircle, AlertOctagon, CheckCircle2, Download } from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { FormInput } from '../components/UI';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';
import { exportToCSV } from '../utils/exportUtils';

export const QCView = ({ db, user }) => {
    const [activeTab, setActiveTab] = useState('equipos');
    const [equipments, setEquipments] = useState([]);
    const [qcSamples, setQcSamples] = useState([]);
    
    const [showEqModal, setShowEqModal] = useState(false);
    const [newEq, setNewEq] = useState({ id: '', name: '', lastCal: '', nextCal: '' });
    
    const [showQcModal, setShowQcModal] = useState(false);
    const [newQc, setNewQc] = useState({ id: '', type: 'Blanco', parameter: '', result: '', limit: '' });
    const { addNotification } = useNotification();

    useEffect(() => {
        const unsubEq = onSnapshot(collection(db, `artifacts/${LIMSSystemId}/public/data/lab_equipment`), (snap) => {
            setEquipments(snap.docs.map(d => ({ docId: d.id, ...d.data() })));
        });
        const unsubQc = onSnapshot(collection(db, `artifacts/${LIMSSystemId}/public/data/lab_qc_samples`), (snap) => {
            const data = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
            data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setQcSamples(data);
        });
        return () => { unsubEq(); unsubQc(); };
    }, [db]);

    const addEquipment = async (e) => {
        e.preventDefault();
        try {
            const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/lab_equipment`), {
                ...newEq,
                status: 'Operativo',
                createdAt: serverTimestamp()
            });
            await logAuditAction(db, user?.uid, 'AGREGAR_EQUIPO', `Equipo registrado: ${newEq.name} (${newEq.id})`, docRef.id);
            addNotification('Equipo registrado exitosamente.', 'success');
            setNewEq({ id: '', name: '', lastCal: '', nextCal: '' });
            setShowEqModal(false);
        } catch (error) {
            console.error("Error adding equipment:", error);
            addNotification('Error al registrar el equipo.', 'error');
        }
    };

    const addQcSample = async (e) => {
        e.preventDefault();
        try {
            // Super basic OOS logic: if result includes "OOS" or is out of numeric range (naive approach for demo)
            const isOos = String(newQc.result || '').toUpperCase().includes('OOS');
            const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/lab_qc_samples`), {
                ...newQc,
                status: isOos ? 'OOS' : 'Aprobado',
                createdAt: serverTimestamp()
            });
            await logAuditAction(db, user?.uid, 'REGISTRAR_QC', `Lectura de QC registrada para lote ${newQc.id} (${newQc.parameter}: ${newQc.result}). Veredicto: ${isOos ? 'OOS' : 'Aprobado'}`, docRef.id);
            addNotification('Lectura de control de calidad registrada exitosamente.', 'success');
            setNewQc({ id: '', type: 'Blanco', parameter: '', result: '', limit: '' });
            setShowQcModal(false);
        } catch (error) {
            console.error("Error registering QC sample:", error);
            addNotification('Error al registrar la lectura de QC.', 'error');
        }
    };

    const handleExportEquipments = () => {
        if (!equipments.length) return addNotification('No hay equipos para exportar', 'warning');
        const exportData = equipments.map(eq => ({
            ID: eq.id,
            Nombre: eq.name,
            UltimaCalibracion: eq.lastCal ? new Date(eq.lastCal).toLocaleDateString() : 'N/A',
            ProximaCalibracion: eq.nextCal ? new Date(eq.nextCal).toLocaleDateString() : 'N/A',
            Estado: eq.status
        }));
        exportToCSV(exportData, `Equipos_LIMS_${new Date().toISOString().slice(0,10)}`);
        addNotification('Registro de equipos exportado exitosamente.', 'success');
    };

    const handleExportQcSamples = () => {
        if (!qcSamples.length) return addNotification('No hay lecturas QC para exportar', 'warning');
        const exportData = qcSamples.map(mc => ({
            Fecha: mc.createdAt?.seconds ? new Date(mc.createdAt.seconds*1000).toLocaleString() : 'N/A',
            Lote: mc.id,
            Tipo: mc.type,
            Parametro: mc.parameter,
            Resultado: mc.result,
            Limite: mc.limit,
            Veredicto: mc.status
        }));
        exportToCSV(exportData, `QC_LIMS_${new Date().toISOString().slice(0,10)}`);
        addNotification('Lecturas QC exportadas exitosamente.', 'success');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Activity className="text-indigo-600" /> Control de Calidad (QC)</h2>
                    <p className="text-slate-500 text-sm mt-1">Monitoreo de calibración de equipos y muestras de control analítico.</p>
                </div>
            </div>

            <div className="flex bg-white rounded-xl shadow-sm p-1.5 gap-2 border border-slate-200 shrink-0">
                <button onClick={() => setActiveTab('equipos')} className={`flex-1 py-2.5 font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === 'equipos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Thermometer size={18} /> Equipos y Calibración
                </button>
                <button onClick={() => setActiveTab('control')} className={`flex-1 py-2.5 font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === 'control' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <TestTube size={18} /> Muestras de Control
                </button>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-0">
                {activeTab === 'equipos' && (
                    <>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-slate-800">Estado Operativo de Equipos ({equipments.length})</h3>
                            <div className="flex gap-2">
                                <button onClick={handleExportEquipments} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-2 border border-indigo-200 transition-colors shadow-sm">
                                    <Download size={16} /> Exportar CSV
                                </button>
                                <button onClick={() => setShowEqModal(true)} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2 shadow-sm">
                                    <PlusCircle size={16} /> Nuevo Equipo
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white border-b border-slate-100 text-slate-500 sticky top-0 shadow-sm z-10">
                                    <tr>
                                        <th className="p-4 font-bold">ID Equipo</th>
                                        <th className="p-4 font-bold">Nombre / Modelo</th>
                                        <th className="p-4 font-bold">Última Calibración</th>
                                        <th className="p-4 font-bold">Próxima Calibración</th>
                                        <th className="p-4 font-bold">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {equipments.map(eq => (
                                        <tr key={eq.docId} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-indigo-600">{eq.id}</td>
                                            <td className="p-4 font-bold text-slate-800">{eq.name}</td>
                                            <td className="p-4 text-slate-600 font-medium">{eq.lastCal ? new Date(eq.lastCal).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-4 text-slate-600 font-medium">{eq.nextCal ? new Date(eq.nextCal).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex w-fit items-center gap-1 ${eq.status === 'Operativo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                    <CheckCircle2 size={14} /> {eq.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {equipments.length === 0 && (
                                        <tr><td colSpan="5" className="p-10 text-center text-slate-500">No hay equipos registrados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'control' && (
                    <>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-slate-800">Registro de Controles Analíticos</h3>
                            <div className="flex gap-2">
                                <button onClick={handleExportQcSamples} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-2 border border-indigo-200 transition-colors shadow-sm">
                                    <Download size={16} /> Exportar CSV
                                </button>
                                <button onClick={() => setShowQcModal(true)} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2 shadow-sm">
                                    <PlusCircle size={16} /> Registrar Lectura
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white border-b border-slate-100 text-slate-500 sticky top-0 shadow-sm z-10">
                                    <tr>
                                        <th className="p-4 font-bold">Fecha / Hora</th>
                                        <th className="p-4 font-bold">Lote Control</th>
                                        <th className="p-4 font-bold">Tipo</th>
                                        <th className="p-4 font-bold">Parámetro</th>
                                        <th className="p-4 font-bold">Resultado Obtenido</th>
                                        <th className="p-4 font-bold">Límite Aceptable</th>
                                        <th className="p-4 font-bold">Veredicto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {qcSamples.map(mc => (
                                        <tr key={mc.docId} className={`hover:bg-slate-50 transition-colors ${mc.status === 'OOS' ? 'bg-red-50/50' : ''}`}>
                                            <td className="p-4 text-slate-500 text-xs">{mc.createdAt?.seconds ? new Date(mc.createdAt.seconds*1000).toLocaleString() : 'Reciente'}</td>
                                            <td className="p-4 font-mono font-bold text-indigo-600">{mc.id}</td>
                                            <td className="p-4 font-bold text-slate-700">{mc.type}</td>
                                            <td className="p-4 font-bold text-slate-800">{mc.parameter}</td>
                                            <td className={`p-4 font-mono font-bold ${mc.status === 'OOS' ? 'text-red-600' : 'text-slate-700'}`}>{mc.result}</td>
                                            <td className="p-4 text-slate-500 font-medium">{mc.limit}</td>
                                            <td className="p-4">
                                                {mc.status === 'Aprobado' ? (
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex w-fit items-center gap-1"><CheckCircle2 size={14}/> OK</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 flex w-fit items-center gap-1"><AlertOctagon size={14}/> OOS - Rechazado</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {qcSamples.length === 0 && (
                                        <tr><td colSpan="7" className="p-10 text-center text-slate-500">No hay lecturas de control registradas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {showEqModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Registrar Nuevo Equipo</h3>
                        <form onSubmit={addEquipment} className="space-y-4">
                            <FormInput label="Código Interno (ID)" name="id" value={newEq.id} onChange={e => setNewEq({...newEq, id: e.target.value})} required placeholder="Ej. EQ-004" />
                            <FormInput label="Nombre del Equipo" name="name" value={newEq.name} onChange={e => setNewEq({...newEq, name: e.target.value})} required placeholder="Ej. Analizador Snibe" />
                            <FormInput type="date" label="Fecha Última Calibración" name="lastCal" value={newEq.lastCal} onChange={e => setNewEq({...newEq, lastCal: e.target.value})} required />
                            <FormInput type="date" label="Fecha Próxima Calibración" name="nextCal" value={newEq.nextCal} onChange={e => setNewEq({...newEq, nextCal: e.target.value})} required />
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setShowEqModal(false)} className="flex-1 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showQcModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Nueva Lectura de QC</h3>
                        <form onSubmit={addQcSample} className="space-y-4">
                            <FormInput label="Lote de Control" name="id" value={newQc.id} onChange={e => setNewQc({...newQc, id: e.target.value})} required placeholder="Ej. LOTE-A1" />
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Control</label>
                                <select value={newQc.type} onChange={e => setNewQc({...newQc, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none">
                                    <option>Blanco</option><option>Estándar</option><option>Control Normal</option><option>Control Patológico</option>
                                </select>
                            </div>
                            <FormInput label="Parámetro Analizado" name="parameter" value={newQc.parameter} onChange={e => setNewQc({...newQc, parameter: e.target.value})} required placeholder="Ej. Glucosa" />
                            <FormInput label="Resultado Obtenido" name="result" value={newQc.result} onChange={e => setNewQc({...newQc, result: e.target.value})} required placeholder="(Nota: escriba 'OOS' para simular falla)" />
                            <FormInput label="Límites Aceptables" name="limit" value={newQc.limit} onChange={e => setNewQc({...newQc, limit: e.target.value})} required placeholder="Ej. 70 - 110 mg/dL" />
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setShowQcModal(false)} className="flex-1 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">Guardar Registro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
