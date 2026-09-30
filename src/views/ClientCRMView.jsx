import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, Building2, Stethoscope, ArrowUpRight, Search, Download, 
    RefreshCw, MessageCircle, Mail, PhoneCall, Calendar, AlertCircle, 
    Sparkles, CheckCircle2, Filter, FileText, ChevronRight, Activity,
    Zap, Database, Award, ShieldCheck, HelpCircle, ExternalLink
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';

const API_URL = getApiUrl();

export const ClientCRMView = ({ user: _user, userRole: _userRole, navigateTo: _navigateTo }) => {
    const { addNotification } = useNotification();
    const [stats, setStats] = useState(null);
    const [clients, setClients] = useState([]);
    const [rescueCandidates, setRescueCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncingQb, setSyncingQb] = useState(false);
    const [activeTab, setActiveTab] = useState('COMPANY'); // 'COMPANY' | 'PATIENT' | 'RESCUE'
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'AT_RISK' | 'INACTIVE'
    const [sectorFilter, setSectorFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/crm/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error('Error cargando stats CRM:', e);
        }
    };

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/crm/clients?entityType=${activeTab === 'RESCUE' ? 'COMPANY' : activeTab}&status=${statusFilter}&sector=${sectorFilter === 'ALL' ? '' : sectorFilter}&search=${encodeURIComponent(searchQuery)}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                setClients(data.data || []);
            }
        } catch (e) {
            console.error('Error cargando clientes CRM:', e);
        } finally {
            setLoading(false);
        }
    }, [activeTab, statusFilter, sectorFilter, searchQuery]);

    const fetchRescueCandidates = async () => {
        try {
            const res = await fetch(`${API_URL}/api/crm/export-reactivation`);
            if (res.ok) {
                const data = await res.json();
                setRescueCandidates(data.rescueCandidates || []);
            }
        } catch (e) {
            console.error('Error cargando rescate comercial:', e);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchRescueCandidates();
    }, []);

    useEffect(() => {
        if (activeTab === 'RESCUE') {
            fetchRescueCandidates();
        } else {
            fetchClients();
        }
    }, [activeTab, fetchClients]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchClients();
    };

    const handleSyncQuickBooksNow = async () => {
        setSyncingQb(true);
        try {
            const res = await fetch(`${API_URL}/api/qb/sync-now`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ maxReturned: 50 })
            });
            const data = await res.json();
            if (res.ok && data.status === 'SUCCESS') {
                addNotification(`QuickBooks sincronizado: ${data.stats?.processed} nuevos estimados procesados (${data.stats?.companies} empresas, ${data.stats?.patients} pacientes).`, 'success');
                await fetchStats();
                await fetchClients();
            } else {
                addNotification(data.message || 'QuickBooks está ocupado o no respondió.', 'warning');
            }
        } catch {
            addNotification('Error conectando con el servicio de QuickBooks.', 'error');
        } finally {
            setSyncingQb(false);
        }
    };

    const handleOpenWhatsAppPitch = (client) => {
        const phone = client.phone || client.telefono || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const sector = client.sector || 'Alimentos';
        const name = client.name || client.empresa || 'Estimado cliente';
        const days = client.daysInactive || client.diasInactivo || 'varios';

        let message = `Estimado equipo de ${name}, le saluda el Laboratorio Microlabs. Notamos que hace ${days} días realizamos su último análisis de control de calidad (${sector}). ¿Desean coordinar su muestreo preventivo de este periodo? Estamos a su entera disposición.`;
        if (client.mensajeReactivacionWhatsApp) {
            message = client.mensajeReactivacionWhatsApp;
        }

        const encoded = encodeURIComponent(message);
        const targetPhone = cleanPhone.length >= 8 ? (cleanPhone.startsWith('506') ? cleanPhone : '506' + cleanPhone) : '';
        const url = targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank');
    };

    const handleExportCSV = () => {
        const rows = activeTab === 'RESCUE' ? rescueCandidates : clients;
        if (!rows.length) return;

        const headers = ['Nombre / Empresa', 'Identificación / Cédula', 'Sector', 'Contacto', 'Teléfono', 'Email', 'Días Inactivo', 'Total Informes'];
        const csvContent = [
            headers.join(','),
            ...rows.map(r => [
                `"${r.name || r.empresa || ''}"`,
                `"${r.identifier || r.cedulaJuridica || ''}"`,
                `"${r.sector || ''}"`,
                `"${r.contactName || r.contacto || ''}"`,
                `"${r.phone || r.telefono || ''}"`,
                `"${r.email || ''}"`,
                r.daysInactive || r.diasInactivo || 0,
                r.totalReportsCount || r.totalAnalisisHistoricos || 0
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `microlabs_crm_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('Archivo CSV descargado con éxito.', 'success');
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar">
            {/* ENCABEZADO Y ACCIONES RÁPIDAS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                            <Users size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                                CRM, Trazabilidad & Reactivación de Clientes
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Histórico Hi Drive + QB
                                </span>
                            </h1>
                            <p className="text-xs text-slate-400">
                                Segmentación y reactivación comercial respetando la privacidad clínica y especificaciones industriales.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Botón Sincronizar QuickBooks */}
                    <button
                        onClick={handleSyncQuickBooksNow}
                        disabled={syncingQb}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw size={15} className={syncingQb ? 'animate-spin' : ''} />
                        {syncingQb ? 'Conectando con QB...' : 'Sincronizar QuickBooks'}
                    </button>

                    {/* Botón Exportar */}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer"
                    >
                        <Download size={15} />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* TARJETAS DE MÉTRICAS */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider">Empresas Industriales</span>
                            <Building2 size={17} className="text-blue-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{stats.summary?.totalCompanies}</div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">{stats.companies?.active} activas</span> · 
                            <span className="text-rose-400 font-bold">{stats.companies?.inactive} inactivas</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider">Pacientes Clínicos</span>
                            <Stethoscope size={17} className="text-teal-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{stats.summary?.totalPatients}</div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">{stats.patients?.active} recientes</span> · 
                            <span className="text-slate-400">{stats.patients?.inactive} en historial</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-extrabold text-purple-400 uppercase tracking-wider">Informes en Base de Datos</span>
                            <FileText size={17} className="text-purple-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{stats.summary?.totalReports}</div>
                        <div className="text-[11px] text-purple-300/80 mt-1 font-medium">Informes certificados migrados</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">Oportunidad de Rescate</span>
                            <Sparkles size={17} className="text-amber-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{stats.companies?.rescueOpportunityRate}%</div>
                        <div className="text-[11px] text-amber-300/80 mt-1 font-medium">Clientes reactivables (&gt;180d)</div>
                    </div>
                </div>
            )}

            {/* PESTAÑAS PRINCIPALES */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        <button
                            onClick={() => setActiveTab('COMPANY')}
                            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-2 ${
                                activeTab === 'COMPANY' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Building2 size={15} />
                            Empresas & Industrias (COA)
                        </button>
                        <button
                            onClick={() => setActiveTab('PATIENT')}
                            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-2 ${
                                activeTab === 'PATIENT' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Stethoscope size={15} />
                            Pacientes Clínicos (Salud Humana)
                        </button>
                        <button
                            onClick={() => setActiveTab('RESCUE')}
                            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-2 ${
                                activeTab === 'RESCUE' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Sparkles size={15} />
                            Campaña de Rescate Comercial ({rescueCandidates.length})
                        </button>
                    </div>

                    {/* Filtros para Empresas / Pacientes */}
                    {activeTab !== 'RESCUE' && (
                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="ALL">Todos los Estados</option>
                                <option value="ACTIVE">Activos (≤90 días)</option>
                                <option value="AT_RISK">En Riesgo (91-180 días)</option>
                                <option value="INACTIVE">Inactivos / Rescate (&gt;180 días)</option>
                            </select>
                            {activeTab === 'COMPANY' && (
                                <select
                                    value={sectorFilter}
                                    onChange={(e) => setSectorFilter(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="ALL">Todos los Sectores</option>
                                    <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
                                    <option value="Acueductos / ASADAS">Acueductos / ASADAS</option>
                                    <option value="Hotelería y Turismo">Hotelería y Turismo</option>
                                    <option value="Agroindustria">Agroindustria</option>
                                    <option value="Farmacéutica">Farmacéutica</option>
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {/* Barra de Búsqueda */}
                {activeTab !== 'RESCUE' && (
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, cédula jurídica, contacto, teléfono..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                    </form>
                )}
            </div>

            {/* CONTENIDO SEGÚN PESTAÑA */}
            {activeTab === 'RESCUE' ? (
                /* TABLA DE RESCATE COMERCIAL */
                <div className="space-y-3">
                    <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-2xl text-xs text-amber-200 flex items-start gap-3">
                        <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-white block mb-0.5">Motor de Reactivación de Clientes Pasados</strong>
                            Clientes con más de 90 o 180 días sin muestreo que poseen historial de análisis en Microlabs. Usa los botones de WhatsApp para iniciar contacto comercial con plantillas automáticas adaptadas a su sector (Aguas, Alimentos, Hotelería).
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase font-black border-b border-slate-800">
                                    <tr>
                                        <th className="p-3.5">Empresa / Razón Social</th>
                                        <th className="p-3.5">Sector</th>
                                        <th className="p-3.5">Contacto</th>
                                        <th className="p-3.5">Inactividad</th>
                                        <th className="p-3.5">Historial</th>
                                        <th className="p-3.5 text-right">Acción Comercial</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {rescueCandidates.map((c, i) => (
                                        <tr key={i} className="hover:bg-slate-800/40 transition">
                                            <td className="p-3.5 font-bold text-white">
                                                {c.empresa}
                                                <div className="text-[10px] font-mono text-slate-500">{c.cedulaJuridica}</div>
                                            </td>
                                            <td className="p-3.5">
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                                    {c.sector}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-slate-400">
                                                {c.contacto || 'Responsable General'}
                                                {c.telefono && <div className="text-[10px] text-slate-500">{c.telefono}</div>}
                                            </td>
                                            <td className="p-3.5">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                    {c.diasInactivo} días sin análisis
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-mono text-indigo-400 font-bold">
                                                {c.totalAnalisisHistoricos} informes
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <button
                                                    onClick={() => handleOpenWhatsAppPitch(c)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
                                                >
                                                    <MessageCircle size={13} />
                                                    WhatsApp Rescate
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* LISTA DE CLIENTES O PACIENTES */
                <div className="space-y-3">
                    {loading ? (
                        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                            <RefreshCw size={32} className="mx-auto text-indigo-400 animate-spin mb-3" />
                            <p className="text-xs text-slate-400">Cargando directorio de clientes...</p>
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                            <Users size={36} className="mx-auto text-slate-600 mb-3" />
                            <h3 className="text-sm font-bold text-white mb-1">No se encontraron clientes</h3>
                            <p className="text-xs text-slate-400">Intente cambiar los filtros o el término de búsqueda.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase font-black border-b border-slate-800">
                                        <tr>
                                            <th className="p-3.5">Nombre / Razón Social</th>
                                            <th className="p-3.5">Tipo / Sector</th>
                                            <th className="p-3.5">Contacto</th>
                                            <th className="p-3.5">Estado Actividad</th>
                                            <th className="p-3.5">Último Informe</th>
                                            <th className="p-3.5">Historial</th>
                                            <th className="p-3.5 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {clients.map((c) => {
                                            const isActive = c.activityStatus === 'ACTIVE';
                                            const isAtRisk = c.activityStatus === 'AT_RISK';

                                            return (
                                                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                                                    <td className="p-3.5 font-bold text-white">
                                                        {c.name}
                                                        <div className="text-[10px] font-mono text-slate-500">{c.identifier}</div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                                            {c.sector}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-slate-400">
                                                        {c.contactName}
                                                        {c.phone && <div className="text-[10px] text-slate-500">{c.phone}</div>}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                            isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                                            isAtRisk ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                                            'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                                        }`}>
                                                            {isActive ? 'Activo (≤90d)' : isAtRisk ? 'En Riesgo (90-180d)' : 'Inactivo (>180d)'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                                                        {c.lastReportDate ? new Date(c.lastReportDate).toLocaleDateString() : 'Sin fecha'}
                                                        {c.lastReportNumber && <div className="text-[10px] text-slate-500">#{c.lastReportNumber}</div>}
                                                    </td>
                                                    <td className="p-3.5 font-mono text-indigo-400 font-bold">
                                                        {c.totalReportsCount} informes
                                                    </td>
                                                    <td className="p-3.5 text-right space-x-2">
                                                        <button
                                                            onClick={() => handleOpenWhatsAppPitch(c)}
                                                            title="Enviar mensaje por WhatsApp"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                                                        >
                                                            <MessageCircle size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientCRMView;
