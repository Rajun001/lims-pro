import React, { useState, useMemo, useCallback } from 'react';
import { FileSpreadsheet, Printer, PlusCircle, Search, ChevronRight, ScanBarcode, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/UI';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';

export const Dashboard = ({ requests, navigateTo, clients }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [barcodeScan, setBarcodeScan] = useState('');
    const [activeTab, setActiveTab] = useState('Todas'); // 'Todas' | 'Clínicas' | 'Industriales'
    const { addNotification } = useNotification();

    const handleDeleteRequest = async (e, req) => {
        e.stopPropagation();
        if (window.confirm(`¿Está seguro de eliminar esta Orden de Laboratorio (${req.id.substring(0, 8).toUpperCase()})? Se perderán todos los resultados y el historial asociado a esta muestra. Esta acción es irreversible.`)) {
            try {
                await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, req.id));
                await logAuditAction(db, null, 'ELIMINAR_ORDEN', `Orden eliminada: ${req.id}`, req.id);
                if (addNotification) addNotification("Orden eliminada exitosamente.", "success");
            } catch (error) {
                console.error("Error al eliminar orden:", error);
                if (addNotification) addNotification("Ocurrió un error al eliminar la orden.", "error");
            }
        }
    };

    const getClientName = useCallback((req) => {
        if (!req) return 'N/A';
        if (req.clientName) return req.clientName;
        const client = clients.find(c => c.id === req.clientId);
        return client ? client.name : 'Cliente Desconocido';
    }, [clients]);

    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        const code = barcodeScan.trim().toUpperCase();
        if (!code) return;
        
        // Find request by checking if its ID starts with the barcode
        const found = requests.find(r => r.id.toUpperCase().startsWith(code));
        if (found) {
            navigateTo('request_details', found.id);
        } else {
            alert(`No se encontró ninguna muestra con el código de barras: ${code}`);
            setBarcodeScan('');
        }
    };

    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        return requests.filter(req => {
            if (activeTab === 'Clínicas' && req.clientType !== 'Clínica') return false;
            if (activeTab === 'Industriales' && req.clientType === 'Clínica') return false;

            const term = searchTerm.toLowerCase();
            const clientName = getClientName(req).toLowerCase();
            const id = (req.id || '').toLowerCase();
            return clientName.includes(term) || id.includes(term);
        });
    }, [requests, searchTerm, getClientName, activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Recepción de Muestras</h2>
                    <p className="text-slate-500 text-sm">Gestione las solicitudes entrantes y su estado.</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    <button onClick={() => navigateTo('bulk_upload')} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all font-medium shadow-sm">
                        <FileSpreadsheet size={18} /> Carga Masiva CSV
                    </button>
                    <button onClick={() => navigateTo('manual_form')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all font-medium shadow-sm">
                        <Printer size={18} /> Formulario Vacío
                    </button>
                    <button onClick={() => navigateTo('new_request', null, { mode: 'clinical' })} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm">
                        <PlusCircle size={18} /> Paciente
                    </button>
                    <button onClick={() => navigateTo('new_request', null, { mode: 'industrial' })} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-all font-medium shadow-sm">
                        <PlusCircle size={18} /> Industria
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex bg-slate-200/60 p-1 rounded-xl w-max">
                    <button onClick={() => setActiveTab('Todas')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'Todas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todas</button>
                    <button onClick={() => setActiveTab('Clínicas')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'Clínicas' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🏥 Clínicas</button>
                    <button onClick={() => setActiveTab('Industriales')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'Industriales' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🏭 Industriales</button>
                </div>
                
                {/* Lector de Código de Barras */}
                <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-auto">
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                    <input
                        type="text"
                        placeholder="Escanear código de barras (ej. Pistola USB)..."
                        className="w-full sm:w-80 pl-10 pr-4 py-2 bg-indigo-50 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all font-mono font-bold text-indigo-900 placeholder-indigo-300"
                        value={barcodeScan}
                        onChange={(e) => setBarcodeScan(e.target.value)}
                        autoFocus
                    />
                </form>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por cliente, ID muestra o código..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">ID Sistema</th>
                                <th className="px-6 py-4">{activeTab === 'Clínicas' ? 'Paciente / Médico' : activeTab === 'Industriales' ? 'Empresa' : 'Cliente / Paciente'}</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRequests.length > 0 ? filteredRequests.map(req => (
                                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm text-slate-600 font-medium">{req.id.substring(0, 8).toUpperCase()}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-900">{getClientName(req)}</p>
                                        <p className="text-xs text-slate-500 capitalize">{req.clientType}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {req.requestDate?.toDate 
                                            ? req.requestDate.toDate().toLocaleDateString() 
                                            : req.requestDate?.seconds 
                                                ? new Date(req.requestDate.seconds * 1000).toLocaleDateString() 
                                                : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={(e) => handleDeleteRequest(e, req)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Eliminar Orden">
                                                <Trash2 size={18} />
                                            </button>
                                            <button onClick={() => navigateTo('request_details', req.id)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1">
                                                Ver <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="text-center py-12 text-slate-400 italic">No hay solicitudes activas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
