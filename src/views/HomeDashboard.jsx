import React, { useState, useMemo } from 'react';
import {
    FileText, Package, Activity, History, Wallet, Calculator,
    TrendingUp, AlertOctagon, Bell, Trash2, Clock, CheckCircle2,
    AlertTriangle, FlaskConical, Users, Zap, ArrowUpRight, ArrowDownRight,
    Search, Filter, RefreshCw, ChevronRight, BarChart2
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

// Catálogo de precios CMQCCR para revenue real
import cmqccrCatalog from '../data/cmqccr_catalog.json';

const PRICE_MAP = Object.fromEntries(
    cmqccrCatalog.map(item => [item.code, parseInt(item.price || '0', 10)])
);

// Precio industrial estimado por código (CRC)
const INDUSTRIAL_BASE_PRICE = 25000;

const calcTAT = (req) => {
    const start = req.requestDate?.seconds
        ? new Date(req.requestDate.seconds * 1000)
        : req.requestDate ? new Date(req.requestDate) : null;
    const end = req.completedAt?.seconds
        ? new Date(req.completedAt.seconds * 1000)
        : req.completedAt ? new Date(req.completedAt) : null;
    if (!start || !end || end < start) return null;
    return (end - start) / (1000 * 60 * 60); // horas
};

const formatTAT = (hours) => {
    if (hours === null || isNaN(hours)) return '—';
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
};

const formatCRC = (amount) => {
    if (amount >= 1_000_000) return `₡${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `₡${Math.round(amount / 1_000)}K`;
    return `₡${amount.toLocaleString()}`;
};

// Mini sparkline component
const Sparkline = ({ data, color = '#4f46e5' }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 64, h = 24;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={w} height={h} className="opacity-60">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
};

export const HomeDashboard = ({ navigateTo, requests = [], inventory = [], userRole = 'admin', user }) => {
    const { addNotification } = useNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState('all');

    const handleDeleteRequest = async (e, reqId) => {
        e.stopPropagation();
        const shortId = (reqId || '').toString().substring(0, 8).toUpperCase();
        if (window.confirm(`¿Está seguro de eliminar la Orden (${shortId})? Esta acción es irreversible.`)) {
            try {
                await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, reqId));
                await logAuditAction(db, user?.uid, 'ELIMINAR_ORDEN', `Orden eliminada: ${reqId}`, reqId);
                if (addNotification) addNotification('Orden eliminada exitosamente.', 'success');
            } catch {
                if (addNotification) addNotification('Error al eliminar la orden.', 'error');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'En Proceso': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Pendiente Revisión': return 'bg-red-100 text-red-700 border-red-200';
            case 'Pendiente': default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Completado': return 'bg-emerald-500';
            case 'En Proceso': return 'bg-amber-500 animate-pulse';
            case 'Pendiente Revisión': return 'bg-red-500 animate-pulse';
            default: return 'bg-blue-400';
        }
    };

    // ============================================================
    // MÉTRICAS REALES calculadas desde los datos reales
    // ============================================================
    const metrics = useMemo(() => {
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

        if (!requests || requests.length === 0) {
            return {
                inProgress: 0, critical: 0, completed: 0, total: 0,
                overdue: 0, avgTatHours: null, avgTatClinical: null, avgTatIndustrial: null,
                revenueTotal: 0, revenueWeek: 0, revenueLastWeek: 0,
                inventoryAlerts: 0, volumeData: [], typeData: [],
                tatByDay: [], recentRequests: [], todayCount: 0,
                weekCount: 0, prevWeekCount: 0, clinicalCount: 0, industrialCount: 0,
                weekSparkline: [], tatSparkline: []
            };
        }

        const getDate = (r) => r.requestDate?.seconds
            ? new Date(r.requestDate.seconds * 1000)
            : r.requestDate ? new Date(r.requestDate) : null;

        // Status counts
        const inProgress = requests.filter(r => r.status === 'En Proceso' || r.status === 'Pendiente').length;
        const critical = requests.filter(r => r.status === 'Pendiente Revisión').length;
        const completed = requests.filter(r => r.status === 'Completado').length;
        const total = requests.length;

        // Muestras vencidas: Pendiente > 48h sin completar
        const overdue = requests.filter(r => {
            if (r.status === 'Completado') return false;
            const d = getDate(r);
            if (!d) return false;
            return (now - d) > 48 * 60 * 60 * 1000;
        }).length;

        // TAT real (promedio de completadas)
        const completedWithTAT = requests.filter(r => r.status === 'Completado' && calcTAT(r) !== null);
        const tatValues = completedWithTAT.map(r => calcTAT(r));
        const avgTatHours = tatValues.length > 0
            ? tatValues.reduce((a, b) => a + b, 0) / tatValues.length
            : null;

        const clinicalCompleted = completedWithTAT.filter(r => r.clientType === 'Clínica');
        const industrialCompleted = completedWithTAT.filter(r => r.clientType !== 'Clínica');
        const avgTatClinical = clinicalCompleted.length > 0
            ? clinicalCompleted.map(r => calcTAT(r)).reduce((a, b) => a + b, 0) / clinicalCompleted.length
            : null;
        const avgTatIndustrial = industrialCompleted.length > 0
            ? industrialCompleted.map(r => calcTAT(r)).reduce((a, b) => a + b, 0) / industrialCompleted.length
            : null;

        // Revenue real: buscar precio en catálogo
        const calcRevenue = (r) => {
            const code = r.analysisCode || '';
            const isClinical = r.clientType === 'Clínica';
            if (isClinical && PRICE_MAP[code]) return PRICE_MAP[code];
            return INDUSTRIAL_BASE_PRICE;
        };

        const revenueTotal = requests.reduce((sum, r) => sum + calcRevenue(r), 0);

        const weekRequests = requests.filter(r => {
            const d = getDate(r); return d && d >= sevenDaysAgo;
        });
        const prevWeekRequests = requests.filter(r => {
            const d = getDate(r); return d && d >= fourteenDaysAgo && d < sevenDaysAgo;
        });
        const revenueWeek = weekRequests.reduce((sum, r) => sum + calcRevenue(r), 0);
        const revenueLastWeek = prevWeekRequests.reduce((sum, r) => sum + calcRevenue(r), 0);

        const todayStr = now.toDateString();
        const todayCount = requests.filter(r => { const d = getDate(r); return d && d.toDateString() === todayStr; }).length;
        const weekCount = weekRequests.length;
        const prevWeekCount = prevWeekRequests.length;

        const clinicalCount = requests.filter(r => r.clientType === 'Clínica').length;
        const industrialCount = total - clinicalCount;

        // Inventario real: bajo stock
        const inventoryAlerts = Array.isArray(inventory)
            ? inventory.filter(i => {
                const qty = parseInt(i.quantity || i.stock || 0);
                const min = parseInt(i.minStock || i.minimumStock || 5);
                return qty <= min;
            }).length
            : 0;

        // Volumen últimos 7 días (con comparativa anterior)
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const volumeData = Array(7).fill(0).map((_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() - (6 - i));
            const dPrev = new Date(d);
            dPrev.setDate(dPrev.getDate() - 7);
            const thisWeek = requests.filter(r => {
                const rd = getDate(r);
                return rd && rd.toDateString() === d.toDateString();
            }).length;
            const lastWeek = requests.filter(r => {
                const rd = getDate(r);
                return rd && rd.toDateString() === dPrev.toDateString();
            }).length;
            return { name: days[d.getDay()], 'Esta Semana': thisWeek, 'Semana Anterior': lastWeek };
        });

        // Sparklines (últimos 7 días)
        const weekSparkline = volumeData.map(d => d['Esta Semana']);
        const tatSparkline = Array(7).fill(0).map((_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() - (6 - i));
            const dayCompleted = completedWithTAT.filter(r => {
                const rd = getDate(r);
                return rd && rd.toDateString() === d.toDateString();
            });
            if (dayCompleted.length === 0) return 0;
            return dayCompleted.map(r => calcTAT(r)).reduce((a, b) => a + b, 0) / dayCompleted.length;
        });

        // Distribución por tipo
        const typeCounts = {};
        requests.forEach(r => {
            const t = r.sampleType || r.clientType || 'Otros';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        const typeData = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }));

        // TAT por día (gráfica de línea)
        const tatByDay = volumeData.map((d, i) => {
            const dayDate = new Date(now);
            dayDate.setDate(dayDate.getDate() - (6 - i));
            const dayCompleted = completedWithTAT.filter(r => {
                const rd = getDate(r);
                return rd && rd.toDateString() === dayDate.toDateString();
            });
            const tat = dayCompleted.length > 0
                ? dayCompleted.map(r => calcTAT(r)).reduce((a, b) => a + b, 0) / dayCompleted.length
                : null;
            return { name: d.name, 'TAT (h)': tat !== null ? parseFloat(tat.toFixed(1)) : null };
        });

        const recentRequests = [...requests]
            .sort((a, b) => {
                const da = getDate(a) || new Date(0);
                const db2 = getDate(b) || new Date(0);
                return db2 - da;
            })
            .slice(0, 8);

        return {
            inProgress, critical, completed, total, overdue, avgTatHours,
            avgTatClinical, avgTatIndustrial, revenueTotal, revenueWeek,
            revenueLastWeek, inventoryAlerts, volumeData, typeData,
            tatByDay, recentRequests, todayCount, weekCount, prevWeekCount,
            clinicalCount, industrialCount, weekSparkline, tatSparkline
        };
    }, [requests, inventory]);

    // Filtrado de solicitudes para la tabla inferior
    const filteredRequests = useMemo(() => {
        return metrics.recentRequests.filter(r => {
            const q = searchQuery.toLowerCase();
            const matchesQuery = !q ||
                (r.clientName || '').toLowerCase().includes(q) ||
                (r.analysisRequested || '').toLowerCase().includes(q) ||
                (r.id || '').toLowerCase().includes(q) ||
                (r.analysisCode || '').toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            const matchesMode = modeFilter === 'all' ||
                (modeFilter === 'clinical' && r.clientType === 'Clínica') ||
                (modeFilter === 'industrial' && r.clientType !== 'Clínica');
            return matchesQuery && matchesStatus && matchesMode;
        });
    }, [metrics.recentRequests, searchQuery, statusFilter, modeFilter]);

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    const revenueDelta = metrics.revenueLastWeek > 0
        ? ((metrics.revenueWeek - metrics.revenueLastWeek) / metrics.revenueLastWeek) * 100
        : 0;
    const volumeDelta = metrics.prevWeekCount > 0
        ? ((metrics.weekCount - metrics.prevWeekCount) / metrics.prevWeekCount) * 100
        : 0;

    const getDashboardHeader = () => {
        switch (userRole) {
            case 'director_tecnico': return { title: 'Dirección Técnica & Calidad', subtitle: 'Supervisión analítica, validación de informes y aseguramiento ISO 17025.', rolePill: 'Director Técnico (Regente)' };
            case 'analyst': return { title: 'Panel Analítico', subtitle: 'Hojas de trabajo, analizadores e ingreso de resultados.', rolePill: 'Analista de Laboratorio' };
            case 'billing_agent': return { title: 'Panel de Facturación', subtitle: 'Emisión de reportes, facturación electrónica y cotizaciones.', rolePill: 'Facturación & Cobros' };
            default: return { title: 'Panel General LIMS-PRO', subtitle: 'Resumen gerencial, auditoría 21 CFR Part 11 y métricas operativas.', rolePill: 'Administrador Global' };
        }
    };
    const header = getDashboardHeader();

    return (
        <div className="flex flex-col min-h-[80vh] w-full max-w-7xl mx-auto p-4 animate-fade-in pb-12 space-y-6">

            {/* ===== HEADER ===== */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">{header.rolePill}</span>
                        {metrics.overdue > 0 && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 animate-pulse flex items-center gap-1">
                                <AlertTriangle size={10} /> {metrics.overdue} muestra{metrics.overdue !== 1 ? 's' : ''} vencida{metrics.overdue !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-1 tracking-tight">{header.title}</h1>
                    <p className="text-slate-500 text-sm">{header.subtitle}</p>
                </div>
                <div className="hidden md:flex items-end gap-6">
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">TAT Promedio</span>
                        <span className="text-3xl font-black text-indigo-600">
                            {metrics.avgTatHours !== null ? formatTAT(metrics.avgTatHours) : '—'}
                        </span>
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5 justify-end">
                            {metrics.avgTatClinical !== null && <span>🏥 {formatTAT(metrics.avgTatClinical)}</span>}
                            {metrics.avgTatIndustrial !== null && <span>🏭 {formatTAT(metrics.avgTatIndustrial)}</span>}
                        </div>
                    </div>
                    <Sparkline data={metrics.tatSparkline} color="#4f46e5" />
                </div>
            </div>

            {/* ===== BANDA DE ALERTAS CRÍTICAS ===== */}
            {(metrics.overdue > 0 || metrics.critical > 0 || metrics.inventoryAlerts > 0) && (
                <div className="bg-red-950 text-white rounded-2xl px-5 py-3 flex flex-wrap gap-4 items-center shadow-lg border border-red-800">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-red-300">🚨 Alertas en Vivo</span>
                    {metrics.overdue > 0 && (
                        <span className="flex items-center gap-1.5 text-sm font-bold bg-red-800/60 px-3 py-1 rounded-lg">
                            <Clock size={13} className="text-red-300" />
                            {metrics.overdue} muestra{metrics.overdue !== 1 ? 's' : ''} &gt;48h sin resultado
                        </span>
                    )}
                    {metrics.critical > 0 && (
                        <span className="flex items-center gap-1.5 text-sm font-bold bg-amber-800/60 px-3 py-1 rounded-lg">
                            <AlertOctagon size={13} className="text-amber-300" />
                            {metrics.critical} pendiente{metrics.critical !== 1 ? 's' : ''} de revisión
                        </span>
                    )}
                    {metrics.inventoryAlerts > 0 && (
                        <span className="flex items-center gap-1.5 text-sm font-bold bg-orange-800/60 px-3 py-1 rounded-lg">
                            <Package size={13} className="text-orange-300" />
                            {metrics.inventoryAlerts} insumo{metrics.inventoryAlerts !== 1 ? 's' : ''} bajo stock
                        </span>
                    )}
                    <button onClick={() => navigateTo('dashboard')} className="ml-auto text-xs font-bold text-red-300 hover:text-white underline transition-colors">
                        Ver todas →
                    </button>
                </div>
            )}

            {/* ===== KPI CARDS — REALES ===== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Muestras en proceso */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Activity size={22} />
                        </div>
                        <Sparkline data={metrics.weekSparkline} color="#a5b4fc" />
                    </div>
                    <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-wider">En Proceso</p>
                    <h2 className="text-3xl font-black mt-0.5">{metrics.inProgress}</h2>
                    <p className="text-indigo-300 text-[11px] mt-1">
                        {metrics.todayCount} hoy · {metrics.weekCount} esta semana
                        {volumeDelta !== 0 && (
                            <span className={`ml-1 font-bold ${volumeDelta > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                {volumeDelta > 0 ? '↑' : '↓'}{Math.abs(Math.round(volumeDelta))}%
                            </span>
                        )}
                    </p>
                </div>

                {/* Críticas / Revisión */}
                <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-5 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <AlertOctagon size={22} />
                        </div>
                        {metrics.overdue > 0 && (
                            <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full animate-pulse">
                                {metrics.overdue} VENCIDAS
                            </span>
                        )}
                    </div>
                    <p className="text-rose-200 text-[11px] font-bold uppercase tracking-wider">
                        {userRole === 'director_tecnico' ? 'Pendientes Firma DT' : 'Críticas / Revisión'}
                    </p>
                    <h2 className="text-3xl font-black mt-0.5">{metrics.critical}</h2>
                    <p className="text-rose-300 text-[11px] mt-1">{metrics.completed} completadas · {metrics.total} total</p>
                </div>

                {/* Revenue real */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <TrendingUp size={22} />
                        </div>
                        {revenueDelta !== 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${revenueDelta > 0 ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-200'}`}>
                                {revenueDelta > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {Math.abs(Math.round(revenueDelta))}%
                            </span>
                        )}
                    </div>
                    <p className="text-emerald-200 text-[11px] font-bold uppercase tracking-wider">Revenue Semana</p>
                    <h2 className="text-2xl font-black mt-0.5">{formatCRC(metrics.revenueWeek)}</h2>
                    <p className="text-emerald-300 text-[11px] mt-1">Total acumulado: {formatCRC(metrics.revenueTotal)}</p>
                </div>

                {/* Inventario / Alertas */}
                <div className={`p-5 rounded-2xl shadow-lg text-white ${metrics.inventoryAlerts > 0 ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Bell size={22} />
                        </div>
                        <div className="text-right text-[11px] opacity-80">
                            <div>🏥 {metrics.clinicalCount}</div>
                            <div>🏭 {metrics.industrialCount}</div>
                        </div>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                        {metrics.inventoryAlerts > 0 ? 'Alertas Inventario' : 'Mix de Trabajo'}
                    </p>
                    <h2 className="text-3xl font-black mt-0.5">
                        {metrics.inventoryAlerts > 0 ? metrics.inventoryAlerts : `${metrics.total}`}
                    </h2>
                    <p className="text-[11px] mt-1 opacity-70">
                        {metrics.inventoryAlerts > 0 ? 'insumos bajo stock mínimo' : 'solicitudes totales'}
                    </p>
                </div>
            </div>

            {/* ===== ACCESOS RÁPIDOS ===== */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Solicitudes', icon: FileText, color: 'blue', route: 'dashboard' },
                    { label: 'CRM', icon: Users, color: 'indigo', route: 'crm' },
                    { label: 'Inventario', icon: Package, color: 'emerald', route: 'inventory' },
                    { label: 'Calidad QC', icon: Activity, color: 'purple', route: 'qc' },
                    { label: 'Auditoría', icon: History, color: 'amber', route: 'audit' },
                    { label: userRole === 'billing_agent' ? 'Facturación' : 'Cotizaciones', icon: userRole === 'billing_agent' ? Wallet : Calculator, color: 'rose', route: userRole === 'billing_agent' ? 'billing' : 'quotes' },
                ].map(({ label, icon: Icon, color, route }) => (
                    <button key={label} onClick={() => navigateTo(route)}
                        className={`group bg-white p-4 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-${color}-200 transition-all flex flex-col items-center text-center gap-2`}>
                        <div className={`w-10 h-10 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon size={20} />
                        </div>
                        <span className="font-bold text-slate-700 text-xs">{label}</span>
                    </button>
                ))}
            </div>

            {/* ===== GRÁFICAS ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Volumen con semana anterior */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-800">Volumen de Muestras — 7 Días</h3>
                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 font-medium">vs semana anterior</span>
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={metrics.volumeData} barGap={2}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="Esta Semana" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Semana Anterior" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribución por tipo */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Distribución por Tipo</h3>
                    <div className="h-52 flex items-center justify-center">
                        {metrics.typeData.length > 0 ? (
                            <ResponsiveContainer width="99%" height="100%">
                                <PieChart>
                                    <Pie data={metrics.typeData} cx="50%" cy="45%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                                        {metrics.typeData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 11 }} />
                                    <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-300 text-sm italic flex flex-col items-center gap-2">
                                <BarChart2 size={32} />
                                Sin datos aún
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TAT Tendencia */}
            {metrics.tatByDay.some(d => d['TAT (h)'] !== null) && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Tiempo de Respuesta (TAT) — Tendencia 7 Días</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Promedio diario de horas desde recepción hasta resultado</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-indigo-600">{metrics.avgTatHours !== null ? formatTAT(metrics.avgTatHours) : '—'}</div>
                            <div className="text-[10px] text-slate-400">TAT promedio global</div>
                        </div>
                    </div>
                    <div className="h-40">
                        <ResponsiveContainer width="99%" height="100%">
                            <AreaChart data={metrics.tatByDay}>
                                <defs>
                                    <linearGradient id="tatGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} unit="h" />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }} formatter={(v) => v !== null ? [`${v}h`, 'TAT'] : ['—', 'TAT']} />
                                <Area type="monotone" dataKey="TAT (h)" stroke="#4f46e5" strokeWidth={2} fill="url(#tatGrad)" connectNulls dot={{ r: 3, fill: '#4f46e5' }} activeDot={{ r: 5 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ===== TABLA DE SOLICITUDES CON BÚSQUEDA UNIVERSAL ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Solicitudes Recientes</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{filteredRequests.length} de {metrics.recentRequests.length} mostrando</p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {/* Búsqueda universal */}
                        <div className="relative flex-1 min-w-[180px]">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar orden, cliente, análisis..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400 outline-none font-medium"
                            />
                        </div>
                        {/* Filtro estado */}
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-indigo-400 outline-none font-bold text-slate-700">
                            <option value="all">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Pendiente Revisión">En Revisión</option>
                            <option value="Completado">Completado</option>
                        </select>
                        {/* Filtro modo */}
                        <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white focus:ring-2 focus:ring-indigo-400 outline-none font-bold text-slate-700">
                            <option value="all">Clínico + Industrial</option>
                            <option value="clinical">🏥 Solo Clínico</option>
                            <option value="industrial">🏭 Solo Industrial</option>
                        </select>
                        <button onClick={() => navigateTo('dashboard')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1">
                            Ver todas <ChevronRight size={12} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                                <th className="p-3 font-bold">Orden</th>
                                <th className="p-3 font-bold">Modo</th>
                                <th className="p-3 font-bold">Cliente</th>
                                <th className="p-3 font-bold">Análisis</th>
                                <th className="p-3 font-bold">Fecha</th>
                                <th className="p-3 font-bold">TAT</th>
                                <th className="p-3 font-bold">Estado</th>
                                <th className="p-3 font-bold text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRequests.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-400 text-sm italic">No hay solicitudes que coincidan con los filtros.</td></tr>
                            ) : filteredRequests.map((sample) => {
                                const dateObj = sample.requestDate?.seconds
                                    ? new Date(sample.requestDate.seconds * 1000)
                                    : sample.requestDate ? new Date(sample.requestDate) : null;
                                const tat = calcTAT(sample);
                                const isClinical = sample.clientType === 'Clínica';
                                const isOverdue = sample.status !== 'Completado' && dateObj && (new Date() - dateObj) > 48 * 60 * 60 * 1000;
                                return (
                                    <tr key={sample.id}
                                        onClick={() => navigateTo('request_details', sample.id)}
                                        className={`hover:bg-slate-50 cursor-pointer transition-colors group ${isOverdue ? 'bg-red-50/40' : ''}`}>
                                        <td className="p-3 font-mono text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                            {(sample.id || '').toString().substring(0, 8).toUpperCase()}
                                            {isOverdue && <span className="ml-1 text-red-500 text-[9px] font-black">⚠️ VENCIDA</span>}
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isClinical ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {isClinical ? '🏥' : '🏭'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm text-slate-700 font-semibold max-w-[140px] truncate">{sample.clientName || sample.patientName || sample.companyLegalName}</td>
                                        <td className="p-3 text-xs text-slate-500 max-w-[160px] truncate">{sample.analysisRequested}</td>
                                        <td className="p-3 text-xs text-slate-400 whitespace-nowrap">{dateObj ? dateObj.toLocaleDateString('es-CR') : '—'}</td>
                                        <td className="p-3 text-xs font-bold text-slate-500">
                                            {tat !== null ? <span className={tat > 48 ? 'text-red-600' : tat > 24 ? 'text-amber-600' : 'text-emerald-600'}>{formatTAT(tat)}</span> : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 w-fit ${getStatusColor(sample.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(sample.status)}`} />
                                                {sample.status || 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={(e) => handleDeleteRequest(e, sample.id)}
                                                className="text-slate-200 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
