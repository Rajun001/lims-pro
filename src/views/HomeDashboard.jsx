import React from 'react';
import { FileText, Package, Activity, History, Wallet, Calculator, TrendingUp, AlertOctagon, Bell, Trash2 } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const HomeDashboard = ({ navigateTo, requests = [] }) => {
    const { addNotification } = useNotification();
    
    const handleDeleteRequest = async (e, reqId) => {
        e.stopPropagation();
        if (window.confirm(`¿Está seguro de eliminar esta Orden de Laboratorio (${reqId.substring(0, 8).toUpperCase()})? Se perderán todos los resultados y el historial asociado a esta muestra. Esta acción es irreversible.`)) {
            try {
                await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, reqId));
                await logAuditAction(db, null, 'ELIMINAR_ORDEN', `Orden eliminada: ${reqId}`, reqId);
                if (addNotification) addNotification("Orden eliminada exitosamente.", "success");
            } catch (error) {
                console.error("Error al eliminar orden:", error);
                if (addNotification) addNotification("Ocurrió un error al eliminar la orden.", "error");
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

    const { volumeData, typeData, recentSamples, avgTat, projectedRevenue, criticalSamples, inventoryAlerts } = React.useMemo(() => {
        if (!requests || requests.length === 0) {
            return { volumeData: [], typeData: [], recentSamples: [], avgTat: '0h' };
        }

        // Tipo de Muestras
        const typeCounts = {};
        requests.forEach(r => {
            const t = r.sampleType || 'Otros';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

        // Volumen últimos 7 días
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const volCounts = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return { name: days[d.getDay()], dateStr: d.toDateString(), Muestras: 0 };
        });

        requests.forEach(r => {
            if (r.requestDate) {
                const date = r.requestDate.seconds ? new Date(r.requestDate.seconds * 1000) : new Date();
                const v = volCounts.find(vc => vc.dateStr === date.toDateString());
                if (v) v.Muestras++;
            }
        });

        const recentSamples = requests.slice(0, 5);

        // TAT Simulado para la vista empresarial (idealmente calculado con timestamps reales)
        const avgTat = '4.2h';

        // Nuevos KPIs Gerenciales
        const projectedRevenue = requests.length * 45; // Estimación: $45 USD promedio por muestra
        const criticalSamples = requests.filter(r => r.status === 'Pendiente Revisión').length;
        const inventoryAlerts = 3; // Simulación de insumos por vencer o sin stock

        return { volumeData: volCounts, typeData, recentSamples, avgTat, projectedRevenue, criticalSamples, inventoryAlerts };
    }, [requests]);

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    return (
        <div className="flex flex-col min-h-[80vh] w-full max-w-6xl mx-auto p-4 animate-fade-in pb-12">
            <div className="mb-8 text-center md:text-left flex justify-between items-end">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">Panel de Control LIMS</h1>
                    <p className="text-slate-500">Resumen general y accesos rápidos del laboratorio.</p>
                </div>
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-500 uppercase">TAT Promedio (24h)</span>
                    <span className="text-3xl font-black text-indigo-600">{avgTat}</span>
                </div>
            </div>

            {/* KPIs Gerenciales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl shadow-lg text-white flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider">Ingresos Proyectados</p>
                        <h2 className="text-3xl font-black">${projectedRevenue.toLocaleString()} <span className="text-sm font-medium">USD</span></h2>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-6 rounded-2xl shadow-lg text-white flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <AlertOctagon size={28} />
                    </div>
                    <div>
                        <p className="text-rose-100 text-sm font-bold uppercase tracking-wider">Muestras Críticas</p>
                        <h2 className="text-3xl font-black">{criticalSamples} <span className="text-sm font-medium">En Revisión</span></h2>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-2xl shadow-lg text-white flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Bell size={28} />
                    </div>
                    <div>
                        <p className="text-amber-100 text-sm font-bold uppercase tracking-wider">Alertas Inventario</p>
                        <h2 className="text-3xl font-black">{inventoryAlerts} <span className="text-sm font-medium">Insumos bajos</span></h2>
                    </div>
                </div>
            </div>

            {/* Accesos Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <button onClick={() => navigateTo('dashboard')} className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                    <h2 className="font-bold text-slate-800 text-sm md:text-base">Solicitudes</h2>
                </button>
                <button onClick={() => navigateTo('inventory')} className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Package size={24} /></div>
                    <h2 className="font-bold text-slate-800 text-sm md:text-base">Inventario</h2>
                </button>
                <button onClick={() => navigateTo('qc')} className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Activity size={24} /></div>
                    <h2 className="font-bold text-slate-800 text-sm md:text-base">Calidad (QC)</h2>
                </button>
                <button onClick={() => navigateTo('audit')} className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><History size={24} /></div>
                    <h2 className="font-bold text-slate-800 text-sm md:text-base">Auditoría</h2>
                </button>
                <button onClick={() => navigateTo('accounting')} className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
                    <h2 className="font-bold text-slate-800 text-sm md:text-base">Finanzas</h2>
                </button>
                <button onClick={() => navigateTo('quotes')} className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 hover:border-indigo-200 transition-all flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Calculator size={24} /></div>
                    <h2 className="font-bold text-slate-800 text-sm md:text-base">Cotizaciones</h2>
                </button>
            </div>

            {/* Dashboard Analytics (Recharts) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Volumen de Muestras (Últimos 7 días)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="Muestras" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Distribución por Tipo</h3>
                    <div className="h-64 flex items-center justify-center">
                        {typeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {typeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-400 italic">Sin datos disponibles</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Muestras Recientes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Muestras Recientes</h3>
                    <button onClick={() => navigateTo('dashboard')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Ver todas →</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                                <th className="p-4 font-bold">ID Muestra</th>
                                <th className="p-4 font-bold">Cliente</th>
                                <th className="p-4 font-bold">Análisis</th>
                                <th className="p-4 font-bold">Fecha</th>
                                <th className="p-4 font-bold">Estado</th>
                                <th className="p-4 font-bold text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentSamples.map((sample) => {
                                const dateObj = sample.requestDate?.seconds ? new Date(sample.requestDate.seconds * 1000) : new Date();
                                return (
                                    <tr
                                        key={sample.id}
                                        onClick={() => navigateTo('request_details', sample.id)}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-4 font-mono text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{sample.id.substring(0,8).toUpperCase()}</td>
                                        <td className="p-4 text-sm text-slate-600 font-medium">{sample.clientName}</td>
                                        <td className="p-4 text-sm text-slate-600">{sample.analysisRequested}</td>
                                        <td className="p-4 text-sm text-slate-500">{dateObj.toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(sample.status)}`}>
                                                {sample.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={(e) => handleDeleteRequest(e, sample.id)} 
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100" 
                                                title="Eliminar Orden"
                                            >
                                                <Trash2 size={16} />
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
