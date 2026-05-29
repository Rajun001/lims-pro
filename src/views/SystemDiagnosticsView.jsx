import React, { useState, useEffect } from 'react';
import { ShieldAlert, Download, CheckCircle2, ServerCrash, HardDrive, Trash2 } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { RestrictedAccess } from '../components/UI';

export const SystemDiagnosticsView = ({ db, requests, clients, userRole, navigateTo }) => {
    const [activeTab, setActiveTab] = useState('errores');
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        if (!db || userRole !== 'admin') return;
        const unsub = onSnapshot(collection(db, `artifacts/${LIMSSystemId}/public/data/lab_system_errors`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            setErrors(data);
        });
        return () => unsub();
    }, [db, userRole]);

    if (userRole !== 'admin') {
        return <RestrictedAccess navigateTo={navigateTo} />;
    }

    const markAsResolved = async (errorId) => {
        try {
            await updateDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/lab_system_errors`, errorId), {
                status: 'Resuelto'
            });
        } catch (e) {
            console.error("Error al actualizar:", e);
        }
    };

    const deleteError = async (errorId) => {
        if (window.confirm('¿Eliminar este registro permanentemente?')) {
            try {
                await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/lab_system_errors`, errorId));
            } catch (e) {
                console.error("Error al eliminar:", e);
            }
        }
    };

    const downloadBackup = () => {
        const backupData = {
            exportDate: new Date().toISOString(),
            system: LIMSSystemId,
            collections: {
                requests: requests || [],
                clients: clients || []
            }
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `lims_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-indigo-600" /> Diagnósticos y Respaldo
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de errores de plataforma y seguridad de datos empresariales.</p>
                </div>
            </div>

            <div className="flex bg-white rounded-xl shadow-sm p-1.5 gap-2 border border-slate-200 shrink-0">
                <button onClick={() => setActiveTab('errores')} className={`flex-1 py-2.5 font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === 'errores' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <ServerCrash size={18} /> Consola de Errores
                </button>
                <button onClick={() => setActiveTab('respaldos')} className={`flex-1 py-2.5 font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === 'respaldos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <HardDrive size={18} /> Garantía de Datos (Backup)
                </button>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-0">
                {activeTab === 'errores' && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-slate-800">Crashes Interceptados ({errors.filter(e => e.status !== 'Resuelto').length} Pendientes)</h3>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-slate-50">
                            {errors.length === 0 ? (
                                <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                                    <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
                                    <h3 className="text-xl font-bold text-slate-700">Sistema Saludable</h3>
                                    <p className="text-slate-500 mt-2">No se han registrado fallos en el sistema.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {errors.map(err => (
                                        <div key={err.id} className={`p-4 rounded-xl border ${err.status === 'Resuelto' ? 'bg-white border-slate-200 opacity-70' : 'bg-red-50 border-red-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${err.status === 'Resuelto' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'}`}>
                                                        {err.status}
                                                    </span>
                                                    <h4 className="font-bold text-slate-800 text-sm font-mono">{err.errorMessage}</h4>
                                                    <p className="text-xs text-slate-500 mt-1">Detectado: {err.timestamp?.seconds ? new Date(err.timestamp.seconds * 1000).toLocaleString() : 'Reciente'}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {err.status !== 'Resuelto' && (
                                                        <button onClick={() => markAsResolved(err.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                            Resolver
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteError(err.id)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded-lg transition-colors" title="Eliminar Permanente">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            {err.status !== 'Resuelto' && err.componentStack && (
                                                <pre className="mt-3 bg-slate-900 text-slate-300 p-3 rounded-lg text-[10px] overflow-x-auto font-mono leading-relaxed">
                                                    {err.componentStack}
                                                </pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'respaldos' && (
                    <div className="p-8">
                        <div className="max-w-2xl mx-auto text-center space-y-6">
                            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <HardDrive size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">Exportación y Respaldo Local</h3>
                            <p className="text-slate-600 leading-relaxed">
                                El sistema realiza replicación y respaldos automáticos en la nube (Data Assurance) para evitar cualquier pérdida de información ante fallos. 
                                Además, puedes descargar una copia física en formato JSON de las principales bases de datos operativas (Solicitudes Clínicas y Base de Clientes) para tu almacenamiento o auditoría interna.
                            </p>
                            
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center">
                                <p className="font-bold text-slate-800 mb-2">Respaldo Disponible</p>
                                <p className="text-sm text-slate-500 mb-6">Incluye: {requests?.length || 0} Solicitudes, {clients?.length || 0} Clientes.</p>
                                
                                <button onClick={downloadBackup} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-md hover:shadow-lg">
                                    <Download size={24} /> Descargar Respaldo Seguro
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
