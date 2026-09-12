import React, { useState, useMemo, useCallback } from 'react';
import { 
    FileSpreadsheet, Printer, PlusCircle, Search, ChevronRight, 
    ScanBarcode, Trash2, Download, Zap, AlertCircle, CheckCircle2, Clock 
} from 'lucide-react';
import { StatusBadge } from '../components/UI';
import { SampleTraceabilityRoute } from '../components/SampleTraceabilityRoute';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';

export const Dashboard = ({ requests = [], navigateTo, clients = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [barcodeScan, setBarcodeScan] = useState('');
    const [activeTab, setActiveTab] = useState('Todas'); // 'Todas' | 'Clínicas' | 'Industriales'
    const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'urgentes' | 'en_proceso' | 'pendientes' | 'completadas'
    const { addNotification } = useNotification();

    const handleDeleteRequest = async (e, req) => {
        e.stopPropagation();
        const shortId = (req.id || '').toString().substring(0, 8).toUpperCase();
        if (window.confirm(`¿Está seguro de eliminar esta Orden de Laboratorio (${shortId})? Se perderán todos los resultados y el historial asociado a esta muestra. Esta acción es irreversible.`)) {
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
        const found = requests.find(r => (r.id || '').toUpperCase().startsWith(code));
        if (found) {
            navigateTo('request_details', found.id);
        } else {
            alert(`No se encontró ninguna muestra con el código de barras: ${code}`);
            setBarcodeScan('');
        }
    };

    // Live counts for status triage
    const statusCounts = useMemo(() => {
        const total = requests.length;
        const stat = requests.filter(r => r.priority === 'Urgente' || r.isUrgente).length;
        const inProgress = requests.filter(r => r.status === 'En Proceso').length;
        const pending = requests.filter(r => r.status === 'Pendiente' || r.status === 'Pendiente Revisión').length;
        const completed = requests.filter(r => r.status === 'Completado').length;
        return { total, stat, inProgress, pending, completed };
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        return requests.filter(req => {
            // Tab filter
            if (activeTab === 'Clínicas' && req.clientType !== 'Clínica') return false;
            if (activeTab === 'Industriales' && req.clientType === 'Clínica') return false;

            // Status filter
            if (statusFilter === 'urgentes' && !(req.priority === 'Urgente' || req.isUrgente)) return false;
            if (statusFilter === 'en_proceso' && req.status !== 'En Proceso') return false;
            if (statusFilter === 'pendientes' && !(req.status === 'Pendiente' || req.status === 'Pendiente Revisión')) return false;
            if (statusFilter === 'completadas' && req.status !== 'Completado') return false;

            // Search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const clientName = getClientName(req).toLowerCase();
                const id = (req.id || '').toLowerCase();
                const analysis = (req.analysisRequested || '').toLowerCase();
                return clientName.includes(term) || id.includes(term) || analysis.includes(term);
            }
            return true;
        });
    }, [requests, activeTab, statusFilter, searchTerm, getClientName]);

    // Quick CSV Export
    const handleExportCSV = () => {
        if (filteredRequests.length === 0) {
            if (addNotification) addNotification("No hay datos para exportar con los filtros actuales.", "warning");
            return;
        }
        const headers = ["ID Muestra", "Cliente/Paciente", "Tipo", "Análisis", "Fecha", "Estado", "Prioridad"];
        const rows = filteredRequests.map(r => [
            r.id || '',
            `"${(getClientName(r) || '').replace(/"/g, '""')}"`,
            r.clientType || '',
            `"${(r.analysisRequested || '').replace(/"/g, '""')}"`,
            r.requestDate?.seconds ? new Date(r.requestDate.seconds * 1000).toLocaleDateString() : 'N/A',
            r.status || '',
            (r.priority === 'Urgente' || r.isUrgente) ? 'URGENTE' : 'Normal'
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ordenes_lims_${new Date().toISOString().substring(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addNotification) addNotification("Archivo CSV exportado exitosamente.", "success");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Listado de Órdenes & Muestras</h1>
                    <p className="text-slate-500 text-sm">Monitoreo de estado, trazabilidad en tiempo real y triaje ágil.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={handleExportCSV}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Exportar listado actual a Excel/CSV"
                    >
                        <Download size={14} /> Exportar CSV
                    </button>
                    <button onClick={() => navigateTo('new_request', null, { mode: 'clinical' })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                        <PlusCircle size={15} /> + Paciente Clínico
                    </button>
                    <button onClick={() => navigateTo('new_request', null, { mode: 'industrial' })} className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                        <PlusCircle size={15} /> + Muestra Industrial
                    </button>
                </div>
            </div>

            {/* Quick Status Triage Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                <button
                    onClick={() => setStatusFilter('todos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'todos' 
                            ? 'bg-slate-800 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                >
                    <span>Todos</span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${statusFilter === 'todos' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                        {statusCounts.total}
                    </span>
                </button>

                <button
                    onClick={() => setStatusFilter('urgentes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'urgentes' 
                            ? 'bg-red-600 text-white shadow-xs shadow-red-600/30' 
                            : 'bg-white hover:bg-red-50 text-red-700 border border-red-200'
                    }`}
                >
                    <Zap size={13} className={statusFilter === 'urgentes' ? 'fill-white' : 'fill-red-500 text-red-500'} />
                    <span>⚡ Urgentes / STAT</span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${statusFilter === 'urgentes' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}`}>
                        {statusCounts.stat}
                    </span>
                </button>

                <button
                    onClick={() => setStatusFilter('en_proceso')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'en_proceso' 
                            ? 'bg-amber-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                >
                    <Clock size={13} />
                    <span>En Proceso</span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${statusFilter === 'en_proceso' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'}`}>
                        {statusCounts.inProgress}
                    </span>
                </button>

                <button
                    onClick={() => setStatusFilter('pendientes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'pendientes' 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                >
                    <AlertCircle size={13} />
                    <span>Pendientes</span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${statusFilter === 'pendientes' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>
                        {statusCounts.pending}
                    </span>
                </button>

                <button
                    onClick={() => setStatusFilter('completadas')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'completadas' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                >
                    <CheckCircle2 size={13} />
                    <span>Completadas</span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${statusFilter === 'completadas' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                        {statusCounts.completed}
                    </span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-slate-200 pb-2">
                <div className="flex gap-2">
                    {['Todas', 'Clínicas', 'Industriales'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                activeTab === tab 
                                    ? 'bg-slate-900 text-white' 
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleBarcodeSubmit} className="relative">
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                    <input
                        type="text"
                        placeholder="Escanear código de barras (ej. Pistola USB)..."
                        className="w-full sm:w-80 pl-10 pr-4 py-2 bg-indigo-50 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all font-mono font-bold text-indigo-900 placeholder-indigo-300"
                        value={barcodeScan}
                        onChange={(e) => setBarcodeScan(e.target.value)}
                    />
                </form>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por cliente, ID muestra o código (o presiona Ctrl + K en cualquier momento)..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all bg-white text-sm"
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
                                <th className="px-6 py-4">Ruta / Trazabilidad</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRequests.length > 0 ? filteredRequests.map(req => {
                                const isStat = req.priority === 'Urgente' || req.isUrgente;
                                return (
                                    <tr key={req.id} className={`hover:bg-slate-50 transition-colors ${isStat ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <span>{(req.id || '').toString().substring(0, 12).toUpperCase()}</span>
                                                {isStat && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                                        STAT
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-900">{getClientName(req)}</p>
                                            <p className="text-xs text-slate-500 capitalize">{req.clientType} • {req.analysisRequested || 'Análisis'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <SampleTraceabilityRoute request={req} compact={true} />
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
                                                <button onClick={(e) => handleDeleteRequest(e, req)} className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer" title="Eliminar Orden">
                                                    <Trash2 size={18} />
                                                </button>
                                                <button onClick={() => navigateTo('request_details', req.id)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 cursor-pointer">
                                                    Ver <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-400 italic">
                                        No hay solicitudes que coincidan con los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
