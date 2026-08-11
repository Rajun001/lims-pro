import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { RestrictedAccess } from '../components/UI';
import { Search, Globe, Home, Laptop, UserCheck, ShieldAlert, FileText, RefreshCw, KeyRound } from 'lucide-react';
import { formatToCRDateTime } from '../utils/dateFormatter.js';
import { getApiUrl } from '../utils/api.js';

const formatTimestamp = formatToCRDateTime;

export const AuditView = ({ db, userRole, user, navigateTo }) => {
    const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'access'
    
    // Audit Logs States
    const [logs, setLogs] = useState([]);
    
    // Access Logs States
    const [accessLogs, setAccessLogs] = useState([]);
    const [accessSearch, setAccessSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'LOCAL' | 'EXTERNAL'
    const [refreshing, setRefreshing] = useState(false);

    const API_URL = getApiUrl();

    // Helper to parse User Agent
    const parseUserAgent = (ua) => {
        if (!ua) return 'Desconocido';
        if (ua.includes('Postman')) return 'Postman client';
        if (ua.includes('localtunnel')) return 'LocalTunnel Agent';
        if (ua.includes('Android')) return 'Android Mobile';
        if (ua.includes('iPhone')) return 'iPhone (iOS)';
        if (ua.includes('iPad')) return 'iPad (iOS)';
        
        let browser = 'Navegador';
        if (ua.includes('Firefox/')) browser = 'Firefox';
        else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
        else if (ua.includes('Chrome/')) browser = 'Google Chrome';
        else if (ua.includes('Safari/')) browser = 'Safari';

        let os = 'Sistema Operativo';
        if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
        else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
        else if (ua.includes('Macintosh')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';

        return `${browser} en ${os}`;
    };

    // Load Audit Action Logs
    useEffect(() => {
        if (userRole !== 'admin') return;

        if (user?.uid === 'offline-user') {
            const loadLocalLogs = () => {
                const localLogs = localStorage.getItem('lims_local_audit_logs')
                    ? JSON.parse(localStorage.getItem('lims_local_audit_logs'))
                    : [];
                localLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setLogs(localLogs.slice(0, 50));
            };
            loadLocalLogs();
            window.addEventListener('lims_local_data_updated', loadLocalLogs);
            return () => window.removeEventListener('lims_local_data_updated', loadLocalLogs);
        }

        if (!db) return;
        const q = query(collection(db, `artifacts/${LIMSSystemId}/public/data/audit_logs`), orderBy('timestamp', 'desc'), limit(100));
        const unsub = onSnapshot(q, (snapshot) => { 
            setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); 
        });
        return () => unsub();
    }, [db, userRole, user]);

    // Load Access Control Logs
    const fetchAccessLogs = useCallback(async () => {
        if (userRole !== 'admin') return;
        setRefreshing(true);

        if (user?.uid === 'offline-user') {
            const localLogs = localStorage.getItem('lims_local_access_logs')
                ? JSON.parse(localStorage.getItem('lims_local_access_logs'))
                : [];
            localLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setAccessLogs(localLogs);
            setRefreshing(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/logs/access`, {
                headers: {
                    'x-user-role': userRole || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setAccessLogs(data);
            }
        } catch (err) {
            console.error("Error al cargar logs de acceso:", err);
        } finally {
            setRefreshing(false);
        }
    }, [userRole, user, API_URL]);

    useEffect(() => {
        if (activeTab === 'access') {
            fetchAccessLogs();
        }

        if (user?.uid === 'offline-user' && activeTab === 'access') {
            window.addEventListener('lims_local_data_updated', fetchAccessLogs);
            return () => window.removeEventListener('lims_local_data_updated', fetchAccessLogs);
        }
    }, [activeTab, user, userRole, fetchAccessLogs]);



    if (userRole !== 'admin') {
        return <RestrictedAccess navigateTo={navigateTo} />;
    }

    // Filter Access Logs
    const filteredAccessLogs = accessLogs.filter(log => {
        // Filter by connection type
        if (typeFilter === 'LOCAL' && log.accessType !== 'LOCAL') return false;
        if (typeFilter === 'EXTERNAL' && log.accessType !== 'EXTERNAL') return false;

        // Search text filter
        const queryText = accessSearch.toLowerCase();
        if (!queryText) return true;

        const email = (log.email || '').toLowerCase();
        const ip = (log.ip || '').toLowerCase();
        const company = (log.company || '').toLowerCase();
        const action = (log.action || '').toLowerCase();

        return email.includes(queryText) || ip.includes(queryText) || company.includes(queryText) || action.includes(queryText);
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldAlert size={26} className="text-indigo-600" />
                        Consola de Seguridad y Auditoría
                    </h2>
                    <p className="text-slate-500 text-sm">Monitoree la integridad de los datos y el origen de las conexiones locales y externas.</p>
                </div>
                <button onClick={() => navigateTo('dashboard')} className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-all text-sm font-semibold shadow-xs">
                    Volver al Dashboard
                </button>
            </div>

            {/* Selector de Pestañas */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 rounded-2xl w-max gap-2">
                <button 
                    onClick={() => setActiveTab('audit')} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === 'audit' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <FileText size={16} /> Trazabilidad de Acciones (Auditoría)
                </button>
                <button 
                    onClick={() => setActiveTab('access')} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === 'access' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <Globe size={16} /> Control de Accesos (Local / Externo)
                </button>
            </div>

            {/* CONTENIDO PESTAÑA 1: TRAZABILIDAD (AUDITORÍA) */}
            {activeTab === 'audit' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-xs text-blue-800">
                        <ShieldAlert className="shrink-0 text-blue-600 mt-0.5" size={18} />
                        <div>
                            <span className="font-bold">Registro de Seguridad (CFR 21 Parte 11):</span> Este registro documenta todos los cambios significativos en muestras, pacientes, cotizaciones y resultados de laboratorio. Es de carácter inmutable.
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 border-b font-semibold text-slate-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Fecha y Hora</th>
                                        <th className="p-4">Acción</th>
                                        <th className="p-4">Usuario</th>
                                        <th className="p-4">Detalles y Trazabilidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-mono text-slate-500">{formatTimestamp(log.timestamp)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                    log.action.includes('ELIMINAR') || log.action.includes('DELETE')
                                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                        : log.action.includes('NUEVA') || log.action.includes('CREAR')
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 font-semibold text-slate-700">{log.performedBy || 'Sistema'}</td>
                                            <td className="p-4 text-slate-600">{log.details}</td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-400">Sin registros de auditoría disponibles.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENIDO PESTAÑA 2: CONTROL DE ACCESOS */}
            {activeTab === 'access' && (
                <div className="space-y-4 animate-fade-in">
                    
                    {/* Barra de Filtros */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Buscar por usuario, IP, empresa o acción..."
                                value={accessSearch}
                                onChange={e => setAccessSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap items-center">
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-250">
                                <button 
                                    onClick={() => setTypeFilter('ALL')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${typeFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    Todos
                                </button>
                                <button 
                                    onClick={() => setTypeFilter('LOCAL')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${typeFilter === 'LOCAL' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    <Home size={12} /> Local
                                </button>
                                <button 
                                    onClick={() => setTypeFilter('EXTERNAL')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${typeFilter === 'EXTERNAL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    <Globe size={12} /> Externo
                                </button>
                            </div>

                            <button 
                                onClick={fetchAccessLogs}
                                disabled={refreshing}
                                className="p-2 border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 rounded-xl transition-all hover:text-indigo-600 disabled:opacity-50"
                                title="Refrescar logs"
                            >
                                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Tabla de Logs de Acceso */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 border-b font-semibold text-slate-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Fecha / Hora</th>
                                        <th className="p-4">Tipo Conexión</th>
                                        <th className="p-4">Identidad / Empresa</th>
                                        <th className="p-4">Rol</th>
                                        <th className="p-4">Acción / Ruta</th>
                                        <th className="p-4">Dirección IP</th>
                                        <th className="p-4">Dispositivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredAccessLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-mono text-slate-500">{formatTimestamp(log.timestamp)}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] flex items-center gap-1 w-max ${
                                                    log.accessType === 'LOCAL'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                                                }`}>
                                                    {log.accessType === 'LOCAL' ? <Home size={10} /> : <Globe size={10} />}
                                                    {log.accessType}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-semibold text-slate-800">{log.email || 'Acceso Anónimo'}</p>
                                                {log.company && (
                                                    <p className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 font-medium mt-1 w-max">
                                                        💼 {log.company}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4 font-medium text-slate-500 uppercase text-[10px]">{log.role || 'N/A'}</td>
                                            <td className="p-4">
                                                <span className={`font-semibold ${
                                                    log.action === 'SESSION_START' 
                                                        ? 'text-emerald-600 flex items-center gap-1' 
                                                        : log.action === 'SESSION_END' 
                                                            ? 'text-slate-500 flex items-center gap-1' 
                                                            : 'text-indigo-600'
                                                }`}>
                                                    {log.action === 'SESSION_START' && <KeyRound size={12} />}
                                                    {log.action === 'SESSION_START' 
                                                        ? 'Inicio de Sesión' 
                                                        : log.action === 'SESSION_END' 
                                                            ? 'Cierre de Sesión' 
                                                            : log.action === 'API_REQUEST' 
                                                                ? 'Petición de API' 
                                                                : log.action
                                                    }
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-slate-600">{log.ip}</td>
                                            <td className="p-4 text-slate-500 max-w-xs overflow-hidden text-ellipsis" title={log.details}>
                                                <span className="flex items-center gap-1">
                                                    <Laptop size={12} className="text-slate-400 shrink-0" />
                                                    {log.action === 'API_REQUEST' ? (log.details || '').split(' - ')[0] : parseUserAgent(log.details)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAccessLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-slate-400">
                                                {refreshing ? 'Cargando logs de acceso...' : 'No se encontraron registros de accesos con los filtros seleccionados.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
