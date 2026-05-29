import React, { useState, useEffect, useMemo, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    signInWithCustomToken
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp,
    query,
    orderBy,
    limit
} from 'firebase/firestore';
import {
    Settings, PlusCircle, ArrowLeft, FileText, Edit, Save, FlaskConical,
    User, Building, Microscope, ShieldCheck, Printer, Trash2, Check,
    Search, Mail, Send, AlertTriangle, Users, ChevronRight, X,
    ClipboardList, Activity, Package, History, Lock, Download, Eye, Bell,
    DollarSign, Receipt, TrendingUp, Wallet, CreditCard,
    Calculator, FileSpreadsheet, Percent,
    PhoneCall, Megaphone, Clock, UserCheck, Briefcase, Calendar, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- 1. CONFIGURACIÓN DE FIREBASE ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA2UFIGB3qwyto_IIqMq3jh1ibAWx-8qSE",
    authDomain: "lims-microlabs.firebaseapp.com",
    projectId: "lims-microlabs",
    storageBucket: "lims-microlabs.firebasestorage.app",
    messagingSenderId: "244307478529",
    appId: "1:244307478529:web:61c4da911089adc8b39800",
    measurementId: "G-CVNQ87T4M6"
};
const appId = 'lims-final-v5';

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. UTILIDADES ---
const logAuditAction = async (db, userId, action, details, relatedId = null) => {
    if (!userId) return;
    try {
        await addDoc(collection(db, `artifacts/${appId}/public/data/audit_logs`), {
            action,
            details,
            relatedId,
            performedBy: userId,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Audit Error:", e);
    }
};

// --- 3. COMPONENTES UI (ATOMOS) ---

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    componentDidCatch(error, errorInfo) { console.error("UI Error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg m-4 border border-red-200">
                    <AlertTriangle className="mx-auto mb-2" size={48} />
                    <h2 className="text-xl font-bold">Algo salió mal en la interfaz.</h2>
                    <p>Por favor, recarga la página.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">Recargar</button>
                </div>
            );
        }
        return this.props.children;
    }
}

const Logo = ({ url, className = "h-10 w-10" }) => (
    <div className={`${className} flex-shrink-0 flex items-center justify-center bg-indigo-600 rounded-lg overflow-hidden shadow-md`}>
        {url ? (
            <img src={url} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
            <Microscope className="text-white w-2/3 h-2/3" />
        )}
    </div>
);

const LoadingSpinner = () => {
    const [showText, setShowText] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowText(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            {showText && <p className="text-slate-500 font-medium animate-pulse">Cargando sistema LIMS...</p>}
        </div>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, confirmText = 'Confirmar', confirmColor = 'bg-blue-600 hover:bg-blue-700' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-slate-800">{title}</h3>
                <div className="mb-6 text-slate-600">{children}</div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium">Cancelar</button>
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white font-medium ${confirmColor}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, name, type = 'text', value, onChange, required = false, className = '', placeholder = '' }) => (
    <div className={className}>
        <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <input
            type={type} id={name} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
        />
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'En Proceso': 'bg-blue-100 text-blue-800 border-blue-200',
        'Esperando Validación': 'bg-orange-100 text-orange-800 border-orange-200',
        'Completado': 'bg-green-100 text-green-800 border-green-200',
        'En Corrección': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
            {status}
        </span>
    );
};

const BarcodeDisplay = ({ value }) => (
    <div className="bg-white p-2 rounded border border-slate-200 inline-block text-center select-none">
        <div className="h-8 flex items-end justify-center gap-[2px] mb-1 px-1">
            {[...Array(24)].map((_, i) => (
                <div key={i} className="bg-slate-900" style={{ width: Math.random() > 0.5 ? '2px' : '1px', height: `${50 + Math.random() * 50}%` }}></div>
            ))}
        </div>
        <p className="font-mono text-[10px] tracking-widest text-slate-600">{value}</p>
    </div>
);

// --- 4. COMPONENTES ESTRUCTURALES ---

const Sidebar = ({ navigateTo, view, labInfo }) => (
    <div className="w-64 bg-slate-900 text-white flex-col h-full shadow-xl z-20 print:hidden hidden md:flex shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 cursor-pointer" onClick={() => navigateTo('home')}>
            <Logo url={labInfo?.logoUrl} className="h-8 w-8" />
            <h1 className="font-bold text-lg tracking-wide">{labInfo?.name || 'LIMS Microlabs'}</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button onClick={() => navigateTo('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'home' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><ClipboardList size={20} /> <span className="font-medium">Inicio</span></button>
            <button onClick={() => navigateTo('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><FileText size={20} /> <span className="font-medium">Solicitudes</span></button>
            <button onClick={() => navigateTo('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'inventory' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Package size={20} /> <span className="font-medium">Inventario</span></button>
            <button onClick={() => navigateTo('qc')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'qc' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Activity size={20} /> <span className="font-medium">Calidad</span></button>
            <button onClick={() => navigateTo('audit')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'audit' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><History size={20} /> <span className="font-medium">Auditoría</span></button>
            <button onClick={() => navigateTo('accounting')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'accounting' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Wallet size={20} /> <span className="font-medium">Contabilidad</span></button>
            <button onClick={() => navigateTo('billing')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'billing' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Receipt size={20} /> <span className="font-medium">Cobros y Fac.</span></button>
            <button onClick={() => navigateTo('quotes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'quotes' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Calculator size={20} /> <span className="font-medium">Cotizaciones</span></button>
            <button onClick={() => navigateTo('crm')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'crm' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><UserCheck size={20} /> <span className="font-medium">CRM</span></button>
        </nav>
        <div className="p-4 border-t border-slate-800">
            <button onClick={() => navigateTo('login')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors">
                <Lock size={20} /> <span className="font-medium">Cerrar Sesión</span>
            </button>
        </div>
    </div>
);

const MobileNav = ({ navigateTo, view }) => (
    <div className="md:hidden border-t flex justify-around p-2 bg-slate-900 text-white text-xs z-20 print:hidden mt-auto shrink-0">
        <button onClick={() => navigateTo('home')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'home' ? 'text-indigo-400' : 'text-slate-400'}`}><ClipboardList size={18} /><span>Inicio</span></button>
        <button onClick={() => navigateTo('dashboard')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`}><FileText size={18} /><span>Solicitudes</span></button>
        <button onClick={() => navigateTo('inventory')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'inventory' ? 'text-indigo-400' : 'text-slate-400'}`}><Package size={18} /><span>Stock</span></button>
        <button onClick={() => navigateTo('qc')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'qc' ? 'text-indigo-400' : 'text-slate-400'}`}><Activity size={18} /><span>QC</span></button>
        <button onClick={() => navigateTo('accounting')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'accounting' ? 'text-indigo-400' : 'text-slate-400'}`}><Wallet size={18} /><span>Finanzas</span></button>
        <button onClick={() => navigateTo('billing')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'billing' ? 'text-indigo-400' : 'text-slate-400'}`}><Receipt size={18} /><span>Cobros</span></button>
        <button onClick={() => navigateTo('quotes')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'quotes' ? 'text-indigo-400' : 'text-slate-400'}`}><Calculator size={18} /><span>Ventas</span></button>
        <button onClick={() => navigateTo('crm')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'crm' ? 'text-indigo-400' : 'text-slate-400'}`}><UserCheck size={18} /><span>CRM</span></button>
    </div>
);

const TopBar = ({ user, navigateTo, labInfo }) => {
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock notifications
    const notifications = [
        { id: 1, title: 'Inventario Bajo', message: 'Reactivo Ácido Sulfúrico por debajo del mínimo.', time: 'Hace 10 min', type: 'warning', read: false },
        { id: 2, title: 'Muestra Urgente', message: 'Muestra MC-2026-008 ingresada con prioridad alta.', time: 'Hace 1 hora', type: 'alert', read: false },
        { id: 3, title: 'Validación Pendiente', message: '3 resultados esperando revisión del Director Técnico.', time: 'Hace 2 horas', type: 'info', read: true }
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 z-10 shrink-0 print:hidden relative">
            <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
                <Logo url={labInfo?.logoUrl} className="h-8 w-8" />
                <h1 className="font-bold text-slate-800">LIMS</h1>
            </div>
            <div className="hidden md:block"></div> {/* Spacer for desktop */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors relative" title="Notificaciones">
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800">Notificaciones</h3>
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">{unreadCount} nuevas</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map(n => (
                                    <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}>
                                        <h4 className={`text-sm font-bold ${n.type === 'alert' ? 'text-red-600' : n.type === 'warning' ? 'text-orange-600' : 'text-blue-600'}`}>{n.title}</h4>
                                        <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-2">{n.time}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 text-center border-t border-slate-100">
                                <button onClick={() => setShowNotifications(false)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Cerrar</button>
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={() => navigateTo('client_settings')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Clientes"><Users size={20} /></button>
                <button onClick={() => navigateTo('analysis_settings')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Análisis"><FlaskConical size={20} /></button>
                <button onClick={() => navigateTo('lab_settings')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Configuración"><Settings size={20} /></button>
                {user && (
                    <div className="ml-3 pl-3 border-l flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm" title={`Operador: ${user.uid.substring(0, 6)}`}>
                            {user.uid.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

const HomeDashboard = ({ navigateTo }) => {
    const MOCK_SAMPLES = [
        { id: 'MC-2026-001', client: 'Empresa Soya S.A.', analysis: 'Salmonella spp', date: '06/05/2026', status: 'Recibido' },
        { id: 'MC-2026-002', client: 'Lácteos del Sur', analysis: 'Coliformes Totales', date: '05/05/2026', status: 'En Análisis' },
        { id: 'MC-2026-003', client: 'Clínica San Juan', analysis: 'Hemograma Completo', date: '04/05/2026', status: 'Pendiente de Revisión' },
        { id: 'MC-2026-004', client: 'Aguas Claras E.I.R.L.', analysis: 'Metales Pesados', date: '03/05/2026', status: 'Aprobado' },
        { id: 'MC-2026-005', client: 'Agroindustrias Export', analysis: 'Residuos de Pesticidas', date: '02/05/2026', status: 'Aprobado' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Aprobado': return 'bg-green-100 text-green-700 border-green-200';
            case 'En Análisis': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Pendiente de Revisión': return 'bg-red-100 text-red-700 border-red-200';
            case 'Recibido': default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    // Data for charts
    const volumeData = [
        { name: 'Lun', Muestras: 12 },
        { name: 'Mar', Muestras: 19 },
        { name: 'Mié', Muestras: 15 },
        { name: 'Jue', Muestras: 22 },
        { name: 'Vie', Muestras: 28 },
        { name: 'Sáb', Muestras: 10 },
        { name: 'Dom', Muestras: 5 },
    ];

    const typeData = [
        { name: 'Clínica', value: 45 },
        { name: 'Alimentos', value: 30 },
        { name: 'Aguas', value: 25 },
    ];
    const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

    return (
        <div className="flex flex-col min-h-[80vh] w-full max-w-6xl mx-auto p-4 animate-fade-in pb-12">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">Panel de Control LIMS</h1>
                <p className="text-slate-500">Resumen general y accesos rápidos del laboratorio.</p>
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
                    <div className="h-64">
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
                    </div>
                </div>
            </div>

            {/* Muestras Recientes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_SAMPLES.map((sample) => (
                                <tr
                                    key={sample.id}
                                    onClick={() => navigateTo('request_details', sample.id)}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                >
                                    <td className="p-4 font-mono text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{sample.id}</td>
                                    <td className="p-4 text-sm text-slate-600 font-medium">{sample.client}</td>
                                    <td className="p-4 text-sm text-slate-600">{sample.analysis}</td>
                                    <td className="p-4 text-sm text-slate-500">{sample.date}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(sample.status)}`}>
                                            {sample.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- 5. VISTAS (DEFINIDAS EXPLÍCITAMENTE) ---

const Dashboard = ({ requests, navigateTo, clients }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const getClientName = (req) => {
        if (!req) return 'N/A';
        if (req.clientName) return req.clientName;
        const client = clients.find(c => c.id === req.clientId);
        return client ? client.name : 'Cliente Desconocido';
    };

    const filteredRequests = requests.filter(req => {
        const term = searchTerm.toLowerCase();
        const clientName = getClientName(req).toLowerCase();
        const id = (req.id || '').toLowerCase();
        return clientName.includes(term) || id.includes(term);
    });

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
                    <button onClick={() => navigateTo('new_request')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm">
                        <PlusCircle size={18} /> Nueva Solicitud
                    </button>
                </div>
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
                                <th className="px-6 py-4">Cliente / Paciente</th>
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
                                    <td className="px-6 py-4 text-sm text-slate-600">{req.requestDate?.toDate ? req.requestDate.toDate().toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => navigateTo('request_details', req.id)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center justify-end gap-1 ml-auto">
                                            Ver <ChevronRight size={16} />
                                        </button>
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

const generateAnalysisCode = (name) => {
    if (!name) return 'ANA-' + Math.floor(100 + Math.random() * 900);
    const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'ANA';
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randomNum}`;
};

const RequestForm = ({ db, user, navigateTo }) => {
    const [clientName, setClientName] = useState('');
    const [sampleType, setSampleType] = useState('Clínica');
    const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 16));
    const [analysisRequested, setAnalysisRequested] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState('Email');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clientName || !analysisRequested) return;
        setIsSubmitting(true);
        try {
            const analysisCode = generateAnalysisCode(analysisRequested);
            const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/requests`), {
                clientName,
                clientType: sampleType,
                sampleType,
                requestDate: new Date(entryDate),
                analysisRequested,
                analysisCode,
                deliveryMethod,
                analysisIds: [],
                results: {},
                status: 'Pendiente',
                createdAt: serverTimestamp(),
                createdBy: user?.uid || 'anon'
            });
            await logAuditAction(db, user?.uid, 'CREAR_SOLICITUD', `Solicitud creada para ${clientName}`, docRef.id);
            navigateTo('dashboard');
        } catch (error) {
            console.error("Error creando solicitud:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in pb-12">
            <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
                <ArrowLeft size={18} className="mr-2" /> Volver a Solicitudes
            </button>

            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-8 border-b border-slate-100 pb-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Registro de Muestra</h2>
                        <p className="text-slate-500 text-sm mt-1">Ingrese los datos para registrar una nueva solicitud en el sistema.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Nombre del Cliente <span className="text-red-500">*</span></label>
                            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Ej. Hospital Central" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Tipo de Muestra <span className="text-red-500">*</span></label>
                            <select value={sampleType} onChange={e => setSampleType(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700">
                                <option value="Clínica">Clínica</option>
                                <option value="Alimentos">Alimentos</option>
                                <option value="Aguas">Aguas</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Fecha de Ingreso <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Análisis Solicitado <span className="text-red-500">*</span></label>
                            <input type="text" value={analysisRequested} onChange={e => setAnalysisRequested(e.target.value)} required placeholder="Ej. Hemograma completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">Medio de Entrega del Reporte</label>
                            <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700">
                                <option value="Email">Correo Electrónico</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Portal">Portal del Cliente</option>
                                <option value="Físico">Físico (Impreso)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-slate-100">
                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                            <PlusCircle size={22} />
                            {isSubmitting ? 'Registrando...' : 'Registrar Muestra'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RequestDetails = ({ request, navigateTo }) => {
    if (!request) return null;

    const reqDate = request.requestDate?.seconds ? new Date(request.requestDate.seconds * 1000) : new Date();
    const receiveDate = reqDate.toLocaleString();
    const storageDate = new Date(reqDate.getTime() + 15 * 60000).toLocaleString(); // +15 mins

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Volver a Solicitudes
                </button>
                <div className="flex gap-2">
                    <button onClick={() => navigateTo('pre_report', request.id)} className="flex items-center text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm">
                        <FileText size={18} className="mr-2" /> Hoja de Trabajo
                    </button>
                    <button onClick={() => navigateTo('final_report', request.id)} className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm">
                        <ShieldCheck size={18} className="mr-2" /> Reporte Final (QR)
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                        Historial de Custodia - Muestra #{request.id.substring(0, 8).toUpperCase()}
                    </h2>
                    <p className="text-slate-500 mt-2">Seguimiento de trazabilidad y cadena de custodia.</p>
                </div>

                <div className="relative pl-6 md:pl-0 space-y-10 md:space-y-0 before:absolute before:inset-0 before:ml-11 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-green-500 before:via-orange-400 before:to-slate-200">

                    {/* Paso 1: Recepción */}
                    <div className="relative flex items-center justify-between md:justify-center md:flex-row-reverse group md:mb-12">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-green-500 text-white shadow-md z-10 relative md:absolute md:left-1/2 md:-ml-6 shrink-0">
                            <Check size={20} strokeWidth={3} />
                        </div>
                        <div className="w-full pl-8 md:pl-0 md:w-1/2 md:pr-14 md:text-right">
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-green-700 text-lg mb-1">Muestra Recibida y Etiquetada</h4>
                                <div className="flex flex-col gap-1 text-sm text-slate-600 mt-3">
                                    <span><strong className="text-slate-800">Fecha y Hora:</strong> {receiveDate}</span>
                                    <span><strong className="text-slate-800">Usuario Receptor:</strong> Admin LIMS</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block w-1/2"></div>
                    </div>

                    {/* Paso 2: Almacenamiento */}
                    <div className="relative flex items-center justify-between md:justify-center md:flex-row group md:mb-12">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-blue-500 text-white shadow-md z-10 relative md:absolute md:left-1/2 md:-ml-6 shrink-0">
                            <Package size={20} strokeWidth={2.5} />
                        </div>
                        <div className="w-full pl-8 md:pl-0 md:w-1/2 md:pl-14 md:text-left">
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-blue-700 text-lg mb-1">Traslado a Cámara de Frío 2 (2-8°C)</h4>
                                <div className="flex flex-col gap-1 text-sm text-slate-600 mt-3">
                                    <span><strong className="text-slate-800">Fecha y Hora:</strong> {storageDate}</span>
                                    <span><strong className="text-slate-800">Firma Digital:</strong> Carlos Mendoza (Logística)</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block w-1/2"></div>
                    </div>

                    {/* Paso 3: Análisis */}
                    <div className="relative flex items-center justify-between md:justify-center md:flex-row-reverse group md:mb-12">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.6)] z-10 relative md:absolute md:left-1/2 md:-ml-6 shrink-0 animate-pulse">
                            <Microscope size={20} strokeWidth={2.5} />
                        </div>
                        <div className="w-full pl-8 md:pl-0 md:w-1/2 md:pr-14 md:text-right">
                            <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500 opacity-5 rounded-bl-full"></div>
                                <h4 className="font-bold text-orange-700 text-lg mb-1">Análisis Microbiológico en Curso</h4>
                                <div className="flex flex-col gap-1 text-sm text-orange-900/80 mt-3 bg-white/60 p-3 rounded-lg border border-orange-100">
                                    <span><strong className="font-bold text-orange-900">Técnico asignado:</strong> Procesando...</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block w-1/2"></div>
                    </div>

                    {/* Paso 4: Revisión */}
                    <div className="relative flex items-center justify-between md:justify-center md:flex-row group">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-300 bg-white text-slate-400 shadow-sm z-10 relative md:absolute md:left-1/2 md:-ml-6 shrink-0">
                            <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                        </div>
                        <div className="w-full pl-8 md:pl-0 md:w-1/2 md:pl-14 md:text-left">
                            <div className="bg-white p-5 rounded-xl border border-dashed border-slate-300 opacity-70">
                                <h4 className="font-bold text-slate-500 text-lg mb-1">Validación por Director Técnico</h4>
                                <p className="text-sm text-slate-400 mt-2 italic">Pendiente de resultados analíticos.</p>
                            </div>
                        </div>
                        <div className="hidden md:block w-1/2"></div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const AuditView = ({ db, navigateTo }) => {
    const [logs, setLogs] = useState([]);
    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/audit_logs`), orderBy('timestamp', 'desc'), limit(50));
        const unsub = onSnapshot(q, (snapshot) => { setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
        return () => unsub();
    }, [db]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Audit Trail (Trazabilidad)</h2>
                <button onClick={() => navigateTo('dashboard')} className="text-slate-500 hover:text-indigo-600">Volver</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Fecha</th><th className="p-4">Acción</th><th className="p-4">Detalles</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-4 font-mono text-slate-500">{log.timestamp?.toDate().toLocaleString()}</td>
                                <td className="p-4 font-bold text-blue-700">{log.action}</td>
                                <td className="p-4 text-slate-600">{log.details}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-400">Sin registros.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InventoryView = ({ db, navigateTo }) => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', lot: '' });

    useEffect(() => {
        const unsub = onSnapshot(collection(db, `artifacts/${appId}/public/data/inventory`), (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [db]);

    const mockItems = items.length > 0 ? items : [
        { id: '1', name: 'Ácido Sulfúrico', lot: 'LT-2026-001', status: 'Activo', expiration: '12/12/2026' },
        { id: '2', name: 'Medio de Cultivo Agar', lot: 'LT-2026-045', status: 'Por Vencer', expiration: '15/05/2026' },
        { id: '3', name: 'Reactivo Cloro Libre', lot: 'LT-2026-089', status: 'Activo', expiration: '01/10/2026' }
    ];

    const addItem = async (e) => {
        e.preventDefault();
        if (!newItem.name) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/inventory`), { ...newItem, status: 'Active', createdAt: serverTimestamp() });
        setNewItem({ name: '', lot: '' });
    };

    const handleCreateCampaign = (itemName) => {
        alert(`Iniciando Campaña Promocional (20% OFF) en CRM para análisis que usan: ${itemName}`);
        navigateTo('crm');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Package className="text-emerald-600" /> Inventario de Reactivos</h2>
                    <p className="text-slate-500 text-sm mt-1">Control de lotes, existencias y alertas de vencimiento.</p>
                </div>
                <button onClick={() => navigateTo('dashboard')} className="text-slate-500 hover:text-indigo-600 font-medium">Volver</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={18} /> Registrar Reactivo</h3>
                    <form onSubmit={addItem} className="space-y-4">
                        <FormInput label="Reactivo" name="name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required placeholder="Ej. Ácido Sulfúrico" />
                        <FormInput label="Lote" name="lot" value={newItem.lot} onChange={e => setNewItem({ ...newItem, lot: e.target.value })} placeholder="Ej. LT-2026-001" />
                        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-sm">Agregar al Inventario</button>
                    </form>
                </div>
                <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Existencias Actuales</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="p-4 font-medium">Reactivo / Insumo</th>
                                    <th className="p-4 font-medium">Lote</th>
                                    <th className="p-4 font-medium">Vencimiento</th>
                                    <th className="p-4 font-medium">Estado</th>
                                    <th className="p-4 font-medium">Acciones de Mercadeo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mockItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                        <td className="p-4 font-mono text-slate-600">{item.lot}</td>
                                        <td className="p-4 text-slate-600">{item.expiration || 'N/A'}</td>
                                        <td className="p-4">
                                            {item.status === 'Por Vencer' ? (
                                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center w-fit gap-1">
                                                    <AlertTriangle size={12} /> Por Vencer
                                                </span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                                                    Activo
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {item.status === 'Por Vencer' && (
                                                <button
                                                    onClick={() => handleCreateCampaign(item.name)}
                                                    className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-indigo-200 hover:border-transparent shadow-sm"
                                                >
                                                    <Megaphone size={14} /> Campaña de Descuento
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QCView = ({ navigateTo }) => {
    const [activeTab, setActiveTab] = useState('equipos');

    const equipos = [
        { id: 'EQ-001', name: 'Microscopio Óptico', status: 'Operativo', lastCal: '01/05/2026', nextCal: '01/11/2026' },
        { id: 'EQ-002', name: 'Centrífuga Refrigerada', status: 'Mantenimiento', lastCal: '15/04/2026', nextCal: '15/10/2026' },
        { id: 'EQ-003', name: 'Incubadora CO2', status: 'Operativo', lastCal: '20/04/2026', nextCal: '20/10/2026' }
    ];

    const muestrasControl = [
        { id: 'QC-26-101', tipo: 'Blanco', parametro: 'Glucosa', resultado: '0.02', limite: '<0.05', status: 'Aprobado' },
        { id: 'QC-26-102', tipo: 'Estándar', parametro: 'Colesterol', resultado: '205', limite: '190-210', status: 'Aprobado' },
        { id: 'QC-26-103', tipo: 'Duplicado', parametro: 'Hemoglobina', resultado: '14.5 / 14.8', limite: 'CV < 5%', status: 'OOS' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Activity className="text-indigo-600" /> Control de Calidad (QC)</h2>
                    <p className="text-slate-500 text-sm">Gestión de equipos y muestras de control interno.</p>
                </div>
                <button onClick={() => navigateTo('dashboard')} className="text-slate-500 hover:text-indigo-600 font-medium">Volver al Dashboard</button>
            </div>

            <div className="flex bg-white rounded-lg shadow-sm p-1 gap-2 border border-slate-200">
                <button onClick={() => setActiveTab('equipos')} className={`flex-1 py-2 font-medium rounded-md transition-colors ${activeTab === 'equipos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Equipos y Calibración</button>
                <button onClick={() => setActiveTab('control')} className={`flex-1 py-2 font-medium rounded-md transition-colors ${activeTab === 'control' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Muestras de Control</button>
            </div>

            {activeTab === 'equipos' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">Estado de Equipos</h3>
                        <button className="text-sm bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50">Registrar Calibración</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="p-4 font-medium">ID Equipo</th>
                                    <th className="p-4 font-medium">Nombre</th>
                                    <th className="p-4 font-medium">Última Cal.</th>
                                    <th className="p-4 font-medium">Próxima Cal.</th>
                                    <th className="p-4 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {equipos.map(eq => (
                                    <tr key={eq.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-mono text-slate-600">{eq.id}</td>
                                        <td className="p-4 font-medium text-slate-800">{eq.name}</td>
                                        <td className="p-4 text-slate-500">{eq.lastCal}</td>
                                        <td className="p-4 text-slate-500">{eq.nextCal}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${eq.status === 'Operativo' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {eq.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'control' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">Muestras de Control Interno</h3>
                        <button className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Nueva Lectura</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="p-4 font-medium">ID Control</th>
                                    <th className="p-4 font-medium">Tipo</th>
                                    <th className="p-4 font-medium">Parámetro</th>
                                    <th className="p-4 font-medium">Resultado</th>
                                    <th className="p-4 font-medium">Límite Ref.</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {muestrasControl.map(mc => (
                                    <tr key={mc.id} className={`hover:bg-slate-50 ${mc.status === 'OOS' ? 'bg-red-50/30' : ''}`}>
                                        <td className="p-4 font-mono text-slate-600">{mc.id}</td>
                                        <td className="p-4 text-slate-600">{mc.tipo}</td>
                                        <td className="p-4 font-medium text-slate-800">{mc.parametro}</td>
                                        <td className="p-4 font-mono">{mc.resultado}</td>
                                        <td className="p-4 text-slate-500">{mc.limite}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${mc.status === 'Aprobado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                {mc.status === 'OOS' ? 'OOS (Alerta)' : mc.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const ClientSettings = ({ db, clients, navigateTo }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [client, setClient] = useState({ name: '', clientType: 'paciente' });

    const handleSave = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, `artifacts/${appId}/public/data/clients`), client);
        setIsEditing(false);
        setClient({ name: '', clientType: 'paciente' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
                <div className="flex gap-2">
                    <button onClick={() => navigateTo('dashboard')} className="text-slate-500 hover:text-indigo-600 mr-2">Volver</button>
                    <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2"><PlusCircle size={18} /> Nuevo</button>
                </div>
            </div>
            {isEditing && (
                <div className="bg-white p-6 rounded-xl shadow-sm border mb-4">
                    <form onSubmit={handleSave} className="space-y-4">
                        <FormInput label="Nombre" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} required placeholder="Ej. Juan Pérez / Empresa S.A." />
                        <select value={client.clientType} onChange={e => setClient({ ...client, clientType: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="paciente">Paciente</option><option value="empresa">Empresa</option></select>
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button></div>
                    </form>
                </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Nombre</th><th className="p-4">Tipo</th></tr></thead>
                    <tbody className="divide-y">{clients.map(c => <tr key={c.id}><td className="p-4">{c.name}</td><td className="p-4 capitalize">{c.clientType}</td></tr>)}</tbody>
                </table>
            </div>
        </div>
    );
};

const AnalysisSettings = ({ db, analyses, navigateTo }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [analysis, setAnalysis] = useState({ name: '', code: '', type: 'clinical' });

    const handleSave = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, `artifacts/${appId}/public/data/analyses`), analysis);
        setIsEditing(false);
        setAnalysis({ name: '', code: '', type: 'clinical' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Análisis</h2>
                <div className="flex gap-2"><button onClick={() => navigateTo('dashboard')} className="text-slate-500 hover:text-indigo-600 mr-2">Volver</button><button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2"><PlusCircle size={18} /> Nuevo</button></div></div>
            {isEditing && (
                <div className="bg-white p-6 rounded-xl shadow-sm border mb-4">
                    <form onSubmit={handleSave} className="space-y-4">
                        <FormInput label="Nombre" value={analysis.name} onChange={e => setAnalysis({ ...analysis, name: e.target.value })} required placeholder="Ej. Perfil Lipídico" />
                        <FormInput label="Código" value={analysis.code} onChange={e => setAnalysis({ ...analysis, code: e.target.value })} required placeholder="Ej. PL-001" />
                        <select value={analysis.type} onChange={e => setAnalysis({ ...analysis, type: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="clinical">Clínico</option><option value="industrial">Industrial</option></select>
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button></div>
                    </form>
                </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Nombre</th><th className="p-4">Código</th></tr></thead>
                    <tbody className="divide-y">{analyses.map(a => <tr key={a.id}><td className="p-4">{a.name}</td><td className="p-4 font-mono">{a.code}</td></tr>)}</tbody>
                </table>
            </div>
        </div>
    );
};

const LabSettings = ({ db, labInfo, navigateTo }) => {
    const [info, setInfo] = useState(labInfo || {});
    const handleSave = async (e) => {
        e.preventDefault();
        await setDoc(doc(db, `artifacts/${appId}/public/data/lab_settings`, "main"), info, { merge: true });
        alert("Guardado");
    };
    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
            <div className="flex justify-between mb-6"><h2 className="text-2xl font-bold">Configuración</h2><button onClick={() => navigateTo('dashboard')} className="text-slate-500">Volver</button></div>
            <form onSubmit={handleSave} className="space-y-4">
                <FormInput label="Nombre Laboratorio" value={info.name || ''} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder="Ej. Microlabs Central" />
                <FormInput label="Dirección" value={info.address || ''} onChange={e => setInfo({ ...info, address: e.target.value })} placeholder="Ej. Av. Principal 123, Ciudad" />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full">Guardar</button>
            </form>
        </div>
    );
};

const ReportView = ({ request, navigateTo, availableAnalyses, labInfo }) => {
    if (!request) return <LoadingSpinner />;
    const requestAnalyses = (request.analysisIds || []).map(id => availableAnalyses.find(a => a.id === id)).filter(Boolean);
    return (
        <div className="bg-slate-100 min-h-screen p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl mb-6 flex justify-between print:hidden">
                <button onClick={() => navigateTo('request_details', request.id)} className="flex items-center text-slate-600"><ArrowLeft className="mr-2" size={20} /> Volver</button>
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Printer size={18} /> Imprimir</button>
            </div>
            <div className="bg-white w-full max-w-4xl p-12 shadow-lg" id="print-area">
                <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between">
                    <div className="flex gap-4 items-center"><Logo url={labInfo?.logoUrl} className="h-16 w-16" /><div><h1 className="text-2xl font-bold">{labInfo?.name}</h1><p className="text-slate-500">{labInfo?.address}</p></div></div>
                    <div className="text-right"><h2 className="text-xl font-bold text-slate-400">INFORME</h2><p className="font-mono">{request.id.substring(0, 8)}</p></div>
                </div>
                <div className="mb-8"><p><strong>Cliente:</strong> {request.clientName}</p><p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p></div>
                <table className="w-full text-left mb-12"><thead className="border-b-2 border-slate-200"><tr><th className="py-2">Análisis</th><th className="py-2">Resultado</th><th className="py-2">Ref.</th></tr></thead>
                    <tbody>{requestAnalyses.map(a => (<tr key={a.id} className="border-b border-slate-100"><td className="py-3">{a.name}</td><td className="py-3 font-bold">{request.results?.[a.id]?.value || '-'} {a.units}</td><td className="py-3 text-sm text-slate-500">{a.referenceRanges}</td></tr>))}</tbody>
                </table>
                <div className="mt-12 pt-8 border-t text-center"><p className="font-bold">Firma Autorizada</p></div>
            </div>
        </div>
    );
};

const LoginView = ({ navigateTo, setUserRole }) => {
    const [loginType, setLoginType] = useState('staff'); // 'staff' or 'client'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [clientProfile, setClientProfile] = useState('patient');

    const handleLogin = (e) => {
        e.preventDefault();
        if (email && password) {
            if (loginType === 'staff') {
                if (email.toLowerCase().includes('admin')) {
                    setUserRole('admin');
                } else {
                    setUserRole('staff');
                }
                navigateTo('home');
            } else {
                setUserRole(`client_${clientProfile}`);
                navigateTo('client_portal');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 sm:p-10 transform transition-all animate-fade-in">
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                        <FlaskConical size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight text-center">
                        {loginType === 'staff' ? 'Acceso Administrativo' : 'Portal Externo'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 text-center">
                        {loginType === 'staff' ? 'Gestión interna del laboratorio LIMS' : 'Acceso seguro para empresas, pacientes y médicos'}
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                        type="button"
                        onClick={() => setLoginType('staff')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'staff' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Personal LIMS
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginType('client')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'client' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Acceso Externo
                    </button>
                </div>

                {loginType === 'client' && (
                    <div className="flex gap-2 mb-6">
                        <button type="button" onClick={() => setClientProfile('patient')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border ${clientProfile === 'patient' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Paciente</button>
                        <button type="button" onClick={() => setClientProfile('company')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border ${clientProfile === 'company' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Empresa</button>
                        <button type="button" onClick={() => setClientProfile('doctor')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border ${clientProfile === 'doctor' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Médico</button>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                            placeholder={loginType === 'staff' ? "admin@microlabs.com" : "contacto@correo.com"}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 mt-2">
                        {loginType === 'staff' ? 'Ingresar al Sistema' : 'Ver mis resultados'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-center">Conexión cifrada de punto a punto<br />Cumplimiento normativa de privacidad</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClientPortal = ({ navigateTo, userRole }) => {
    const [previewId, setPreviewId] = useState(null);
    const [activeTab, setActiveTab] = useState('resultados');
    const [quoteDesc, setQuoteDesc] = useState('');
    const [quoteSubmitted, setQuoteSubmitted] = useState(false);

    const isCompany = userRole === 'client_company';
    const isDoctor = userRole === 'client_doctor';
    const isPatient = userRole === 'client_patient';

    const portalName = isCompany ? 'Portal Corporativo B2B' : isDoctor ? 'Portal Médico' : 'Portal Paciente';
    const welcomeName = isCompany ? 'Empresa S.A.' : isDoctor ? 'Dr. Roberto Vargas' : 'Juan Pérez';

    const mockResults = [
        { id: 'MC-2026-0506', date: '06/05/2026', analysis: 'Perfil Bioquímico', status: 'Aprobado', lab: 'Sede Central', details: 'Colesterol: 180 mg/dL\nGlucosa: 95 mg/dL', patientName: 'María Soto' },
        { id: 'MC-2026-0507', date: '07/05/2026', analysis: 'Cultivo Microbiológico', status: 'Pendiente', lab: 'Sede Central', details: 'Procesando en placa de Petri...', patientName: 'Carlos Ruiz' }
    ];

    const downloadPDF = (req) => {
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="padding: 40px; font-family: sans-serif; color: #333;">
                <div style="border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between;">
                    <div>
                        <h1 style="margin: 0; color: #1e293b;">Microlabs LIMS</h1>
                        <p style="margin: 5px 0 0; color: #64748b;">Reporte Oficial de Resultados</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; color: #94a3b8;">INFORME</h2>
                        <p style="margin: 5px 0 0; font-family: monospace;">${req.id}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p><strong>Paciente / Cliente:</strong> Cliente Test</p>
                    <p><strong>Análisis:</strong> ${req.analysis}</p>
                    <p><strong>Fecha:</strong> ${req.date}</p>
                    <p><strong>Laboratorio:</strong> ${req.lab}</p>
                </div>
                
                <table style="width: 100%; text-align: left; border-collapse: collapse; margin-bottom: 40px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 10px 0;">Parámetro / Detalle</th>
                            <th style="padding: 10px 0;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 15px 0; white-space: pre-wrap;">${req.details}</td>
                            <td style="padding: 15px 0; font-weight: bold; color: #16a34a;">Aprobado y Validado</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="font-weight: bold; color: #1e293b; margin-bottom: 5px;">Firma Digital Autorizada</p>
                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">Documento generado automáticamente por LIMS Microlabs. Válido sin firma manuscrita.</p>
                </div>
            </div>
        `;

        const opt = {
            margin: 0.5,
            filename: `Resultados_${req.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    const handleQuoteSubmit = (e) => {
        e.preventDefault();
        setQuoteSubmitted(true);
        setTimeout(() => {
            setQuoteSubmitted(false);
            setQuoteDesc('');
        }, 6000);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Topbar for client */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg"><FlaskConical size={20} className="text-white" /></div>
                    <span className="font-bold text-lg tracking-wide">Microlabs | {portalName}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-300 hidden md:inline">Bienvenido, {welcomeName}</span>
                    <button onClick={() => navigateTo('login')} className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700">Cerrar Sesión</button>
                </div>
            </div>

            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-10 flex gap-6 overflow-x-auto">
                    {isDoctor ? (
                        <button onClick={() => setActiveTab('buscador')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'buscador' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            Buscador de Pacientes
                        </button>
                    ) : (
                        <button onClick={() => setActiveTab('resultados')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'resultados' || (!isDoctor && activeTab === 'buscador') ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            {isCompany ? 'Resultados de Muestras' : 'Mis Resultados'}
                        </button>
                    )}

                    {isCompany && (
                        <>
                            <button onClick={() => setActiveTab('cotizaciones')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'cotizaciones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                Planes y Cotizaciones
                            </button>
                            <button onClick={() => setActiveTab('facturas')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'facturas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                Estado de Cuenta
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                {isDoctor && (activeTab === 'buscador' || activeTab === 'resultados') && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Búsqueda de Pacientes</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">Busque los resultados analíticos de sus pacientes referidos ingresando el DNI o nombre.</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                            <div className="flex gap-4 mb-8 relative z-10">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input type="text" placeholder="Ingrese DNI o nombre del paciente..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <button className="bg-blue-600 text-white font-bold px-6 rounded-xl hover:bg-blue-700 transition-colors">Buscar</button>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-4">Resultados Recientes (Sus pacientes)</h3>
                            <div className="space-y-3">
                                {mockResults.map(req => (
                                    <div key={req.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50">
                                        <div>
                                            <h4 className="font-bold text-blue-700">{req.patientName}</h4>
                                            <p className="text-sm text-slate-600">{req.analysis} | Fecha: {req.date}</p>
                                        </div>
                                        <button onClick={() => downloadPDF(req)} className="bg-white border border-slate-200 text-blue-600 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50">Ver PDF</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isCompany && activeTab === 'facturas' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Estado de Cuenta</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">Revise sus facturas pendientes y el historial de pagos.</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-slate-800">Saldo Pendiente: <span className="text-red-500">¢125,000</span></h3>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-slate-500 border-b border-slate-100">
                                    <tr><th className="p-4">Nº Factura</th><th className="p-4">Fecha Emisión</th><th className="p-4">Monto</th><th className="p-4">Estado</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td className="p-4 font-mono">FAC-26-008</td><td className="p-4">25/04/2026</td><td className="p-4 font-bold">¢125,000</td><td className="p-4"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Pendiente</span></td></tr>
                                    <tr className="bg-slate-50 border-t border-slate-100"><td className="p-4 font-mono">FAC-26-002</td><td className="p-4">15/03/2026</td><td className="p-4 font-bold">¢45,000</td><td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Pagada</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!isDoctor && activeTab === 'resultados' && (
                    <>
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Mis Resultados</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">Consulte y descargue de forma segura sus informes de laboratorio.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                {mockResults.map(req => {
                                    const isApproved = req.status === 'Aprobado';
                                    const isSelected = previewId === req.id;
                                    return (
                                        <div key={req.id} className={`bg-white rounded-2xl border ${isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 shadow-sm'} p-5 md:p-6 transition-all`}>
                                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-mono font-bold text-slate-800">{req.id}</span>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${isApproved ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-lg text-slate-700">{req.analysis}</h3>
                                                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{req.date}</span>
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <button onClick={() => setPreviewId(isSelected ? null : req.id)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                                        <Eye size={16} /> {isSelected ? 'Ocultar Previa' : 'Vista Previa'}
                                                    </button>
                                                    <button disabled={!isApproved} onClick={() => isApproved && downloadPDF(req)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isApproved ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                                        {isApproved ? <><Download size={16} /> Descargar PDF</> : <><Lock size={16} /> Bloqueada</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="lg:col-span-1">
                                {previewId ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6 relative overflow-hidden min-h-[400px]">
                                        {mockResults.find(r => r.id === previewId)?.status !== 'Aprobado' && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
                                                <div className="text-3xl md:text-5xl font-extrabold text-slate-200/60 -rotate-45 whitespace-nowrap uppercase tracking-widest select-none">
                                                    En Revisión
                                                </div>
                                            </div>
                                        )}
                                        <div className="border-b border-slate-100 pb-4 mb-4 relative z-20 bg-white/80 backdrop-blur-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                        <FileText size={18} className="text-blue-600" /> Resumen
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1">{previewId}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 relative z-20">
                                            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</label><p className="font-medium text-slate-800">Cliente Test</p></div>
                                            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Laboratorio</label><p className="font-medium text-slate-800">Microlabs</p></div>
                                            <div className="pt-4 border-t border-slate-100">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Detalle</label>
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-sm text-slate-700 whitespace-pre-wrap">
                                                    {mockResults.find(r => r.id === previewId)?.details || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-10 h-full min-h-[400px]">
                                        <Eye size={48} className="text-slate-300 mb-4" />
                                        <h4 className="font-bold text-slate-500">Seleccione un informe</h4>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'cotizaciones' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Planes y Cotizaciones</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">Solicite programas analíticos o control de monitoreo en planta.</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <FileSpreadsheet size={120} />
                            </div>
                            {quoteSubmitted ? (
                                <div className="text-center py-10 animate-fade-in relative z-10">
                                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
                                        <Check size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Solicitud Enviada</h3>
                                    <p className="text-slate-500 max-w-md mx-auto">Un asesor revisará sus requerimientos y preparará una cotización aplicando sus tarifas especiales si aplican.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleQuoteSubmit} className="space-y-6 relative z-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <FileSpreadsheet className="text-indigo-600" /> Crear Solicitud de Cotización
                                        </h3>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Describa el programa de monitoreo o los análisis requeridos:</label>
                                        <textarea
                                            required
                                            value={quoteDesc}
                                            onChange={(e) => setQuoteDesc(e.target.value)}
                                            rows="5"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                                            placeholder="Ej. Requiero análisis microbiológico semanal en 4 puntos de la planta de lácteos, y análisis de agua bimensual..."
                                        />
                                    </div>
                                    <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm">
                                        <Send size={18} /> Solicitar Cotización Formal
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <History className="text-slate-600" /> Historial de Cotizaciones
                            </h3>
                            <div className="text-center py-8 text-slate-500 italic">No tiene cotizaciones previas registradas en línea.</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AccountingView = ({ userRole, navigateTo }) => {
    const [activeTab, setActiveTab] = useState('resumen');
    const [activeCurrency, setActiveCurrency] = useState('CRC');

    if (userRole !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Lock size={48} />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Acceso Restringido</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">El módulo contable contiene información financiera confidencial. Necesitas privilegios de Administrador para acceder.</p>
                <button onClick={() => navigateTo('home')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md">
                    Volver al Inicio
                </button>
            </div>
        );
    }

    const globalRates = {
        USD: 1,
        CRC: 510,
        EUR: 0.92
    };

    const formatCurrency = (baseAmountUSD, manualRate = null, targetCurrency = activeCurrency) => {
        let rate = manualRate ? manualRate : globalRates[targetCurrency];
        let converted = Math.abs(baseAmountUSD) * rate; // Format handles absolute value, sign is prepended later if needed

        let formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: targetCurrency,
            minimumFractionDigits: 2
        }).format(converted);

        // Custom symbol correction for CRC if needed, though Intl usually handles it well (CRC -> CRC 100.00, we might want ¢)
        if (targetCurrency === 'CRC') {
            formatted = formatted.replace('CRC', '¢').replace(/\s/g, '');
        }

        return baseAmountUSD < 0 ? `-${formatted}` : formatted;
    };

    // rawAmount is internally stored in USD (base currency)
    const mockInvoices = [
        { id: 'FAC-26-001', client: 'Hospital Central', rawAmount: 1250.00, date: '01/05/2026', status: 'Pagada', manualRate: null },
        { id: 'FAC-26-002', client: 'Empresa Soya S.A.', rawAmount: 3400.00, date: '03/05/2026', status: 'Pendiente', manualRate: null },
        { id: 'FAC-26-003', client: 'Lácteos del Sur', rawAmount: 850.00, date: '10/04/2026', status: 'Vencida', manualRate: { CRC: 550 } }, // Caso especial: tasa manual para CRC
    ];

    const mockTransactions = [
        { id: 'TRX-101', date: '05/05/2026', desc: 'Reactivos Sigma Aldrich', category: 'Insumos', type: 'Egreso', rawAmount: -450.00 },
        { id: 'TRX-102', date: '06/05/2026', desc: 'Pago Factura FAC-26-001', category: 'Servicios', type: 'Ingreso', rawAmount: 1250.00 },
        { id: 'TRX-103', date: '07/05/2026', desc: 'Mantenimiento Equipos', category: 'Operativa', type: 'Egreso', rawAmount: -200.00 },
    ];

    const totalsUSD = {
        ingresos: 12450.00,
        egresos: -4230.00,
        porCobrar: 5300.00
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Wallet className="text-indigo-600" /> Contabilidad y Finanzas</h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de ingresos, egresos y facturación del laboratorio.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto items-center">
                    <select
                        value={activeCurrency}
                        onChange={(e) => setActiveCurrency(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold shadow-sm transition-all"
                        title="Seleccionar Moneda"
                    >
                        <option value="CRC">CRC (¢)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                    </select>
                    <button className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium shadow-sm flex items-center gap-2 transition-colors">
                        <Download size={18} /> Exportar
                    </button>
                    <button className="flex-1 sm:flex-none justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-2 transition-colors">
                        <PlusCircle size={18} /> Transacción
                    </button>
                </div>
            </div>

            <div className="flex bg-white rounded-lg shadow-sm p-1 gap-2 border border-slate-200 w-full sm:w-fit">
                <button onClick={() => setActiveTab('resumen')} className={`flex-1 sm:px-6 py-2 font-medium rounded-md transition-colors ${activeTab === 'resumen' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Resumen</button>
                <button onClick={() => setActiveTab('facturas')} className={`flex-1 sm:px-6 py-2 font-medium rounded-md transition-colors ${activeTab === 'facturas' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Facturas</button>
                <button onClick={() => setActiveTab('caja')} className={`flex-1 sm:px-6 py-2 font-medium rounded-md transition-colors ${activeTab === 'caja' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Caja</button>
            </div>

            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24} /></div>
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full border border-green-200">+12% vs mes ant.</span>
                            </div>
                            <p className="text-slate-500 font-medium">Ingresos Totales (Mes)</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalsUSD.ingresos)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={24} className="rotate-180" /></div>
                            </div>
                            <p className="text-slate-500 font-medium">Egresos Operativos</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(Math.abs(totalsUSD.egresos))}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><CreditCard size={24} /></div>
                            </div>
                            <p className="text-slate-500 font-medium">Cuentas por Cobrar</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalsUSD.porCobrar)}</h3>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'facturas' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800">Cuentas por Cobrar y Facturas</h3>
                        <button className="text-sm bg-white border border-slate-200 font-bold text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm w-full sm:w-auto">Generar Factura</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 font-bold">Nº Factura</th>
                                    <th className="p-4 font-bold">Cliente</th>
                                    <th className="p-4 font-bold">Fecha</th>
                                    <th className="p-4 font-bold text-right">Monto</th>
                                    <th className="p-4 font-bold">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mockInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-mono font-bold text-indigo-600 cursor-pointer">{inv.id}</td>
                                        <td className="p-4 font-bold text-slate-800">{inv.client}</td>
                                        <td className="p-4 text-slate-500">{inv.date}</td>
                                        <td className="p-4 font-medium text-slate-800 text-right">
                                            {formatCurrency(inv.rawAmount, inv.manualRate?.[activeCurrency])}
                                            {inv.manualRate?.[activeCurrency] && <span className="ml-1 text-[10px] text-orange-500 font-bold" title="Tasa de cambio manual aplicada">*</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === 'Pagada' ? 'bg-green-100 text-green-700 border border-green-200' : inv.status === 'Pendiente' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'caja' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800">Historial de Transacciones</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 font-bold">ID TRX</th>
                                    <th className="p-4 font-bold">Fecha</th>
                                    <th className="p-4 font-bold">Descripción</th>
                                    <th className="p-4 font-bold">Categoría</th>
                                    <th className="p-4 font-bold text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mockTransactions.map(trx => (
                                    <tr key={trx.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-mono text-slate-500">{trx.id}</td>
                                        <td className="p-4 text-slate-500">{trx.date}</td>
                                        <td className="p-4 font-medium text-slate-800">{trx.desc}</td>
                                        <td className="p-4 text-slate-600">{trx.category}</td>
                                        <td className={`p-4 font-bold text-right ${trx.type === 'Ingreso' ? 'text-green-600' : 'text-slate-800'}`}>{trx.amount > 0 ? '+' : ''}{formatCurrency(trx.rawAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const QuotesView = ({ navigateTo }) => {
    const [clients] = useState([
        { id: 'C-001', name: 'Hospital Central', type: 'Antiguo', discount: 15 },
        { id: 'C-002', name: 'Empresa Soya S.A.', type: 'Nuevo', discount: 0 },
        { id: 'C-003', name: 'Lácteos del Sur', type: 'Antiguo', discount: 10 }
    ]);

    const [selectedClient, setSelectedClient] = useState('');
    const basePrice = 50000;

    const selectedClientData = clients.find(c => c.id === selectedClient);
    const finalPrice = selectedClientData ? basePrice * (1 - selectedClientData.discount / 100) : basePrice;

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Calculator className="text-indigo-600" /> Creador de Cotizaciones</h2>
                    <p className="text-slate-500 text-sm mt-1">Gestione cotizaciones y aplique precios especiales por cliente.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Nueva Cotización</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Cliente / Empresa</label>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                <option value="">-- Seleccionar Cliente --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Paquete de Análisis</label>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                                <span className="font-bold">Plan Básico de Monitoreo</span> (Microbiología x4)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Percent size={18} className="text-green-500" /> Motor de Precios</h3>

                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Precio Base (Catálogo):</span>
                            <span className="font-mono">¢{basePrice.toLocaleString()}</span>
                        </div>

                        {selectedClientData && selectedClientData.discount > 0 && (
                            <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                                <span>Descuento Especial ({selectedClientData.type}):</span>
                                <span className="font-mono font-bold">-{selectedClientData.discount}%</span>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-800">Precio Final:</span>
                            <span className="font-extrabold text-2xl text-indigo-600 font-mono">¢{finalPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    <button disabled={!selectedClient} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Generar y Enviar Cotización
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Cotizaciones Solicitadas por Clientes</h3>
                    <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-full text-xs">1 Pendiente</span>
                </div>
                <div className="p-0">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="p-4 font-bold">ID</th>
                                <th className="p-4 font-bold">Cliente</th>
                                <th className="p-4 font-bold">Descripción</th>
                                <th className="p-4 font-bold">Estado</th>
                                <th className="p-4 font-bold">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                <td className="p-4 font-mono font-bold text-indigo-600">COT-26-042</td>
                                <td className="p-4 font-bold text-slate-800">Cliente Test</td>
                                <td className="p-4 text-slate-600 max-w-xs truncate">Plan control microbiológico y aguas</td>
                                <td className="p-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                        Solicitada
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button className="text-indigo-600 font-bold hover:underline">Revisar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const BillingView = ({ navigateTo }) => {
    const mockInvoices = [
        { id: 'FAC-26-001', client: 'Hospital Central', amount: 450000, date: '10/04/2026', dueDate: '10/05/2026', status: 'Vencida', daysOverdue: 27 },
        { id: 'FAC-26-008', client: 'Lácteos del Sur', amount: 125000, date: '25/04/2026', dueDate: '25/05/2026', status: 'Pendiente', daysOverdue: 0 },
        { id: 'FAC-26-015', client: 'Empresa Soya S.A.', amount: 80000, date: '01/05/2026', dueDate: '01/06/2026', status: 'Pagada', daysOverdue: 0 }
    ];

    const generateStatement = (invoice) => {
        alert(`Generando Estado de Cuenta PDF para ${invoice.client}...`);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Receipt className="text-orange-600" /> Cuentas por Cobrar</h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de facturación, cobros y antigüedad de saldos.</p>
                </div>
                <button className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 shadow-sm flex items-center gap-2">
                    <PlusCircle size={18} /> Nueva Factura
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-bold uppercase mb-1">Total por Cobrar</div>
                    <div className="text-2xl font-extrabold text-slate-800">¢575,000</div>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
                    <div className="text-red-500 text-sm font-bold uppercase mb-1">1-30 Días Vencido</div>
                    <div className="text-2xl font-extrabold text-red-700">¢450,000</div>
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                    <div className="text-orange-500 text-sm font-bold uppercase mb-1">31-60 Días Vencido</div>
                    <div className="text-2xl font-extrabold text-orange-700">¢0</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-bold uppercase mb-1">&gt; 60 Días Vencido</div>
                    <div className="text-2xl font-extrabold text-slate-700">¢0</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Directorio de Facturas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-bold">Nº Factura</th>
                                <th className="p-4 font-bold">Cliente</th>
                                <th className="p-4 font-bold">Monto</th>
                                <th className="p-4 font-bold">Vencimiento</th>
                                <th className="p-4 font-bold">Estado</th>
                                <th className="p-4 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {mockInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono font-bold text-indigo-600">{inv.id}</td>
                                    <td className="p-4 font-bold text-slate-800">{inv.client}</td>
                                    <td className="p-4 font-mono text-slate-600">¢{inv.amount.toLocaleString()}</td>
                                    <td className="p-4 text-slate-600">{inv.dueDate}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${inv.status === 'Vencida' ? 'bg-red-100 text-red-700 border-red-200' : inv.status === 'Pagada' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                            {inv.status} {inv.daysOverdue > 0 && `(${inv.daysOverdue} días)`}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center gap-2">
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Registrar Pago"><DollarSign size={16} /></button>
                                        <button onClick={() => generateStatement(inv)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Estado de Cuenta"><FileText size={16} /></button>
                                        <button className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Enviar Recordatorio"><Mail size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const CRMView = ({ navigateTo }) => {
    const [selectedClient, setSelectedClient] = useState(null);
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [newClientType, setNewClientType] = useState('company');

    const mockClients = [
        { id: 'C-001', name: 'Hospital Central', email: 'compras@hospitalcentral.com', phone: '2233-4455', status: 'Activo', ltv: 2500000, lastContact: 'Hace 2 días' },
        { id: 'C-002', name: 'Empresa Soya S.A.', email: 'logistica@soya.com', phone: '8899-7766', status: 'Inactivo', ltv: 150000, lastContact: 'Hace 4 meses' },
        { id: 'C-003', name: 'Lácteos del Sur', email: 'calidad@lacteos.com', phone: '2211-0099', status: 'Activo', ltv: 800000, lastContact: 'Hace 1 semana' }
    ];

    const mockActivities = [
        { id: 1, type: 'email', title: 'Campaña: Nuevos Análisis de Agua', date: '05/05/2026', user: 'Ana M.' },
        { id: 2, type: 'call', title: 'Llamada de seguimiento por deuda', date: '01/05/2026', user: 'Carlos V.' },
        { id: 3, type: 'meeting', title: 'Visita técnica a planta', date: '15/04/2026', user: 'Dr. Roberto' },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-12 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><UserCheck className="text-indigo-600" /> CRM & Mercadeo</h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de relaciones, recordatorios e historial 360° de clientes.</p>
                </div>
                <button onClick={() => setShowNewClientModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                    <PlusCircle size={18} /> Nuevo Perfil
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Directorio */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Buscar empresa o contacto..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {mockClients.map(c => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedClient(c)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedClient?.id === c.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                                    <span className={`w-2 h-2 rounded-full mt-1.5 ${c.status === 'Activo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2 truncate">{c.email}</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 flex items-center gap-1"><Clock size={12} /> {c.lastContact}</span>
                                    <span className="font-mono font-bold text-indigo-600">¢{c.ltv.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Perfil 360 */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {selectedClient ? (
                        <>
                            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-800">{selectedClient.name}</h3>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                                        <span className="flex items-center gap-1"><Mail size={14} /> {selectedClient.email}</span>
                                        <span className="flex items-center gap-1"><PhoneCall size={14} /> {selectedClient.phone}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors" title="Llamar"><PhoneCall size={18} /></button>
                                    <button className="bg-white border border-slate-200 text-slate-700 p-2 rounded-lg hover:bg-slate-50 transition-colors" title="Enviar Email"><Mail size={18} /></button>
                                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                                        <Calendar size={16} /> Agendar Tarea
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={18} className="text-slate-500" /> Historial de Actividades</h4>
                                <div className="space-y-4">
                                    {mockActivities.map(act => (
                                        <div key={act.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${act.type === 'email' ? 'bg-blue-500' : act.type === 'call' ? 'bg-emerald-500' : 'bg-purple-500'}`}>
                                                    {act.type === 'email' ? <Mail size={14} /> : act.type === 'call' ? <PhoneCall size={14} /> : <UserCheck size={14} />}
                                                </div>
                                                <div className="w-px h-full bg-slate-200 my-1"></div>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 mb-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h5 className="font-bold text-slate-800 text-sm">{act.title}</h5>
                                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{act.date}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">Registrado por: <span className="font-medium text-slate-700">{act.user}</span></p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex gap-4 opacity-50">
                                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                                            <ArrowUpRight size={14} />
                                        </div>
                                        <div className="flex-1 flex items-center text-sm font-medium text-slate-400">Fin del historial</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 h-full">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-4">
                                <Users size={40} />
                            </div>
                            <h4 className="font-bold text-slate-500 text-lg">Seleccione un cliente</h4>
                            <p className="text-sm text-slate-400 mt-2 max-w-sm">Haga clic en un cliente del directorio para visualizar su perfil completo, estado de cartera y agendar nuevos seguimientos.</p>
                        </div>
                    )}
                </div>
            </div>

            {showNewClientModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">Registrar Nuevo Perfil</h3>
                            <button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Perfil</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setNewClientType('company')} className={`flex-1 py-2 font-bold rounded-lg transition-colors border ${newClientType === 'company' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Empresa</button>
                                    <button onClick={() => setNewClientType('patient')} className={`flex-1 py-2 font-bold rounded-lg transition-colors border ${newClientType === 'patient' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Paciente</button>
                                    <button onClick={() => setNewClientType('doctor')} className={`flex-1 py-2 font-bold rounded-lg transition-colors border ${newClientType === 'doctor' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Médico / Clínica</button>
                                </div>
                            </div>

                            <form className="space-y-4">
                                {newClientType === 'company' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Razón Social</label><input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" placeholder="Ej. Lácteos S.A." /></div>
                                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Cédula Jurídica</label><input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" /></div>
                                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Email Facturación</label><input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" /></div>
                                        </div>
                                    </>
                                )}
                                {newClientType === 'patient' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label><input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" /></div>
                                            <div><label className="block text-sm font-bold text-slate-700 mb-1">DNI / Pasaporte</label><input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" /></div>
                                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Médico Tratante</label><input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" /></div>
                                        </div>
                                    </>
                                )}
                                {newClientType === 'doctor' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Especialista</label><input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" /></div>
                                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Código Médico</label><input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" /></div>
                                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Especialidad</label><input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" /></div>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setShowNewClientModal(false)} className="px-6 py-2 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100">Cancelar</button>
                            <button onClick={() => { alert('Perfil registrado'); setShowNewClientModal(false); }} className="px-6 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700">Guardar Perfil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 6. COMPONENTE PRINCIPAL (APP) ---

const PreReportView = ({ request, navigateTo, labInfo }) => {
    if (!request) return null;
    const reqDate = request.requestDate?.seconds ? new Date(request.requestDate.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString();
    const handlePrint = () => window.print();

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="print:hidden flex justify-between items-center mb-6">
                <button onClick={() => navigateTo('request_details', request.id)} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Volver a Detalles
                </button>
                <button onClick={handlePrint} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm">
                    <Printer size={18} className="mr-2" /> Imprimir Prereporte
                </button>
            </div>

            <div className="bg-white p-8 sm:p-10 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <Logo url={labInfo?.logoUrl} className="h-16 w-16" />
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{labInfo?.name || 'Sistema LIMS'}</h1>
                            <p className="text-slate-600 font-medium">Hoja de Trabajo Analítico (Prereporte)</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={request.id.substring(0, 10).toUpperCase()} />
                        <p className="text-sm font-bold text-slate-500 mt-2">Fecha: {reqDate}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl print:border-slate-800 print:bg-transparent">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Cliente</h3>
                        <p className="font-bold text-slate-800 text-lg">{request.clientName || 'N/A'}</p>
                        <p className="text-sm text-slate-600">Tipo: {request.clientType || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl print:border-slate-800 print:bg-transparent">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Análisis Solicitado</h3>
                        <p className="font-bold text-slate-800 text-lg">{request.analysisRequested || 'N/A'}</p>
                        <p className="text-sm text-indigo-600 font-mono font-bold">Cód: {request.analysisCode || 'S/N'}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Resultados Preliminares</h3>
                    <table className="w-full text-left border-collapse border border-slate-300 print:border-slate-800">
                        <thead className="bg-slate-100 print:bg-slate-200">
                            <tr>
                                <th className="border border-slate-300 print:border-slate-800 p-3 text-sm font-bold w-1/4">Parámetro</th>
                                <th className="border border-slate-300 print:border-slate-800 p-3 text-sm font-bold w-1/4">Resultado Obtenido</th>
                                <th className="border border-slate-300 print:border-slate-800 p-3 text-sm font-bold w-1/6">Unidades</th>
                                <th className="border border-slate-300 print:border-slate-800 p-3 text-sm font-bold w-1/3">Técnico Analista / Firma</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i}>
                                    <td className="border border-slate-300 print:border-slate-800 p-6"></td>
                                    <td className="border border-slate-300 print:border-slate-800 p-6"></td>
                                    <td className="border border-slate-300 print:border-slate-800 p-6"></td>
                                    <td className="border border-slate-300 print:border-slate-800 p-6"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Observaciones / Notas del Analista:</h3>
                    <div className="border border-slate-300 print:border-slate-800 rounded-lg h-32 w-full"></div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-300 print:border-slate-800 grid grid-cols-2 gap-8 text-center">
                    <div>
                        <div className="border-b border-slate-400 print:border-slate-800 w-3/4 mx-auto mb-2 h-12"></div>
                        <p className="text-sm font-bold text-slate-700">Analizado por (Firma)</p>
                    </div>
                    <div>
                        <div className="border-b border-slate-400 print:border-slate-800 w-3/4 mx-auto mb-2 h-12"></div>
                        <p className="text-sm font-bold text-slate-700">Revisado por (Firma DT)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ManualFormView = ({ navigateTo, labInfo }) => {
    const handlePrint = () => window.print();
    const uniqueFormId = useMemo(() => {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomStr = Math.floor(1000 + Math.random() * 9000);
        return `FRM-${dateStr}-${randomStr}`;
    }, []);

    const commonAnalyses = [
        { name: "Hemograma Completo", code: "HEM-01" },
        { name: "Perfil Lipídico", code: "LIP-02" },
        { name: "Glucosa en Ayunas", code: "GLU-03" },
        { name: "Examen General de Orina", code: "URI-04" },
        { name: "Coprocultivo", code: "COP-05" },
        { name: "Análisis Físico-Químico (Agua)", code: "AGU-06" },
        { name: "Microbiológico (Alimentos)", code: "ALI-07" },
        { name: "Hisopado de Superficies", code: "SUP-08" },
    ];

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="print:hidden flex justify-between items-center mb-6">
                <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Volver
                </button>
                <button onClick={handlePrint} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm">
                    <Printer size={18} className="mr-2" /> Imprimir Formulario Vacío
                </button>
            </div>

            <div className="bg-white p-8 sm:p-10 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="flex justify-between items-center border-b-2 border-slate-800 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Logo url={labInfo?.logoUrl} className="h-16 w-16" />
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{labInfo?.name || 'Sistema LIMS'}</h1>
                            <p className="text-slate-600 font-medium">Formulario de Ingreso de Muestras</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={uniqueFormId} />
                        <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Nº Formulario</p>
                    </div>
                </div>

                <div className="space-y-6 mb-8 text-sm">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                            <span className="font-bold text-slate-700 w-1/3">Cliente/Paciente:</span>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                            <span className="font-bold text-slate-700 w-1/4">Fecha:</span>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                            <span className="font-bold text-slate-700 w-1/3">Atención a:</span>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                            <span className="font-bold text-slate-700 w-1/3">Tipo de Muestra:</span>
                            <div className="flex-1"></div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 bg-slate-100 print:bg-slate-200 p-2 border border-slate-300 print:border-slate-800">Análisis Requeridos</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {commonAnalyses.map((ana, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 border border-slate-200 rounded print:border-slate-400">
                                <div className="w-5 h-5 border-2 border-slate-400 rounded-sm"></div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 text-sm">{ana.name}</p>
                                    <p className="font-mono text-xs text-slate-500">{ana.code}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border border-slate-300 print:border-slate-400 p-4 rounded-lg">
                        <p className="font-bold text-slate-700 text-sm mb-2">Otros Análisis (Especifique):</p>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-6 mt-4"></div>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-6"></div>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-2"></div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Observaciones Generales:</h3>
                    <div className="border border-slate-300 print:border-slate-800 rounded-lg h-24 w-full"></div>
                </div>

                <div className="mb-6 bg-slate-50 border border-slate-300 print:border-slate-800 p-4 rounded-lg">
                    <p className="text-sm font-bold text-slate-800 mb-3">Preferencia de Entrega del Informe Final (Marque una):</p>
                    <div className="flex gap-6 items-center">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div><span className="text-sm text-slate-700 font-bold">Correo Electrónico</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div><span className="text-sm text-slate-700 font-bold">WhatsApp</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div><span className="text-sm text-slate-700 font-bold">Portal Web</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div><span className="text-sm text-slate-700 font-bold">Impreso Físico</span></div>
                    </div>
                </div>

                <div className="mt-16 pt-8 grid grid-cols-2 gap-12 text-center">
                    <div>
                        <div className="border-b-2 border-slate-800 w-full mx-auto mb-2"></div>
                        <p className="text-sm font-bold text-slate-700">Entregado por (Cliente/Remitente)</p>
                        <p className="text-xs text-slate-500 mt-1">Firma y Cédula</p>
                    </div>
                    <div>
                        <div className="border-b-2 border-slate-800 w-full mx-auto mb-2"></div>
                        <p className="text-sm font-bold text-slate-700">Recibido por (Personal LIMS)</p>
                        <p className="text-xs text-slate-500 mt-1">Firma y Fecha/Hora de Recepción</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BulkUploadView = ({ db, user, navigateTo }) => {
    const [csvData, setCsvData] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            setCsvData(text);
            parseCSV(text);
        };
        reader.readAsText(file);
    };

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length <= 1) return;
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const data = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
                nombre: values[0]?.trim() || '',
                identificacion: values[1]?.trim() || '',
                email: values[2]?.trim() || '',
                telefono: values[3]?.trim() || '',
                tipo_muestra: values[4]?.trim() || 'Clínica',
                analisis: values[5]?.trim() || 'General'
            };
        });
        setParsedData(data.filter(d => d.nombre));
    };

    const processBatch = async () => {
        if (parsedData.length === 0) return;
        setIsProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const item of parsedData) {
            try {
                const analysisCode = generateAnalysisCode(item.analisis);
                await addDoc(collection(db, `artifacts/${appId}/public/data/requests`), {
                    clientName: item.nombre,
                    clientType: item.tipo_muestra,
                    sampleType: item.tipo_muestra,
                    identificacion: item.identificacion,
                    email: item.email,
                    telefono: item.telefono,
                    requestDate: serverTimestamp(),
                    analysisRequested: item.analisis,
                    analysisCode,
                    deliveryMethod: 'Email',
                    analysisIds: [],
                    results: {},
                    status: 'Pendiente',
                    createdAt: serverTimestamp(),
                    createdBy: user?.uid || 'anon'
                });
                successCount++;
            } catch (e) {
                console.error("Error creating request from batch:", e);
                failCount++;
            }
        }

        setIsProcessing(false);
        setResults({ success: successCount, failed: failCount });
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-12">
            <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
                <ArrowLeft size={18} className="mr-2" /> Volver a Solicitudes
            </button>

            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-8 border-b border-slate-100 pb-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Carga Masiva de Solicitudes</h2>
                        <p className="text-slate-500 text-sm mt-1">Sube un archivo CSV para generar múltiples solicitudes automáticamente.</p>
                    </div>
                </div>

                {!results ? (
                    <div className="space-y-8">
                        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-10 text-center">
                            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center">
                                <FileSpreadsheet size={40} className="text-slate-400 mb-4" />
                                <span className="text-lg font-bold text-slate-700">Seleccionar Archivo CSV</span>
                                <span className="text-sm text-slate-500 mt-2">Formato esperado (separado por comas):<br />Nombre, Identificación, Email, Teléfono, Tipo_Muestra, Análisis</span>
                            </label>
                        </div>

                        {parsedData.length > 0 && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                                    <span>Vista Previa ({parsedData.length} registros)</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                            <tr>
                                                <th className="p-3">Nombre</th>
                                                <th className="p-3">Identificación</th>
                                                <th className="p-3">Análisis</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.map((d, i) => (
                                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                    <td className="p-3 font-medium">{d.nombre}</td>
                                                    <td className="p-3">{d.identificacion}</td>
                                                    <td className="p-3 font-mono text-xs">{d.analisis}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-200">
                                    <button onClick={processBatch} disabled={isProcessing} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                        {isProcessing ? 'Procesando...' : <><Save size={18} /> Crear {parsedData.length} Solicitudes en Lote</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Carga Completada!</h3>
                        <p className="text-slate-600 mb-8">Se procesaron los registros exitosamente.</p>
                        <div className="flex justify-center gap-4 mb-8">
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center w-32">
                                <p className="text-3xl font-bold text-green-600">{results.success}</p>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Éxitos</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center w-32">
                                <p className="text-3xl font-bold text-red-600">{results.failed}</p>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Errores</p>
                            </div>
                        </div>
                        <button onClick={() => navigateTo('dashboard')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                            Volver al Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const FinalReportView = ({ request, navigateTo, labInfo }) => {
    if (!request) return null;
    const reportDate = new Date().toLocaleDateString();
    const handlePrint = () => window.print();

    // Utilizamos una API pública y gratuita para generar el QR on-the-fly
    const verificationUrl = `https://lims-microlabs.com/verify/${request.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="print:hidden flex justify-between items-center mb-6">
                <button onClick={() => navigateTo('request_details', request.id)} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Volver a Detalles
                </button>
                <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm">
                    <Printer size={18} className="mr-2" /> Imprimir / PDF
                </button>
            </div>

            <div className="bg-white p-10 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="flex justify-between items-center border-b-4 border-blue-800 pb-6 mb-8">
                    <div className="flex items-center gap-6">
                        <Logo url={labInfo?.logoUrl} className="h-20 w-20" />
                        <div>
                            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">{labInfo?.name || 'Sistema LIMS'}</h1>
                            <p className="text-slate-600 font-bold tracking-widest text-sm mt-1 uppercase">Reporte de Resultados Analíticos</p>
                            <p className="text-slate-500 text-xs mt-1">Licencia de Salud: #445-A | ISO 9001:2015</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={request.id.substring(0, 10).toUpperCase()} />
                        <p className="text-xs font-bold text-slate-500 mt-2">Emisión: {reportDate}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 bg-slate-50 print:bg-slate-100 p-6 rounded-xl border border-slate-200 print:border-slate-300">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Paciente / Cliente</p>
                        <p className="font-bold text-slate-800 text-lg">{request.clientName}</p>
                        {request.identificacion && <p className="text-sm text-slate-600 mt-1">ID: {request.identificacion}</p>}
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Información de Muestra</p>
                        <p className="text-sm text-slate-800 mt-1"><span className="font-semibold">ID LIMS:</span> {request.id.substring(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-slate-800 mt-1"><span className="font-semibold">Tipo:</span> {request.sampleType || request.clientType}</p>
                        <p className="text-sm text-slate-800 mt-1"><span className="font-semibold">Recibido:</span> {request.requestDate?.seconds ? new Date(request.requestDate.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>

                <div className="mb-12">
                    <div className="flex justify-between items-end border-b-2 border-slate-300 pb-2 mb-4">
                        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Resultados: {request.analysisRequested}</h3>
                        <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">Cód: {request.analysisCode || 'N/A'}</span>
                    </div>

                    <table className="w-full text-left border-collapse mt-4">
                        <thead className="bg-slate-100 print:bg-slate-200">
                            <tr>
                                <th className="p-3 text-sm font-bold text-slate-700 border border-slate-300 w-2/5">Parámetro</th>
                                <th className="p-3 text-sm font-bold text-slate-700 border border-slate-300 w-1/5 text-center">Resultado</th>
                                <th className="p-3 text-sm font-bold text-slate-700 border border-slate-300 w-1/5 text-center">Unidad</th>
                                <th className="p-3 text-sm font-bold text-slate-700 border border-slate-300 w-1/5 text-center">Ref. / Normal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-200">
                                <td className="p-3 text-sm font-medium">Parámetro Principal Analizado</td>
                                <td className="p-3 text-sm font-bold text-center text-slate-800">Normal</td>
                                <td className="p-3 text-sm text-center text-slate-600">mg/dL</td>
                                <td className="p-3 text-sm text-center text-slate-500">0.0 - 5.0</td>
                            </tr>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <td className="p-3 text-sm font-medium">Conteo General</td>
                                <td className="p-3 text-sm font-bold text-center text-emerald-600">Negativo</td>
                                <td className="p-3 text-sm text-center text-slate-600">UFC</td>
                                <td className="p-3 text-sm text-center text-slate-500">Ausencia</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                                <td className="p-3 text-sm font-medium">Análisis Secundario</td>
                                <td className="p-3 text-sm font-bold text-center text-red-600">Fuera de Rango*</td>
                                <td className="p-3 text-sm text-center text-slate-600">%</td>
                                <td className="p-3 text-sm text-center text-slate-500">20 - 40</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mb-8 p-4 bg-yellow-50/50 print:bg-transparent border border-yellow-200 print:border-slate-300 rounded-lg">
                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-1">Interpretación / Observaciones:</h4>
                    <p className="text-sm text-slate-700">Los resultados presentados están dentro de los límites de detección del método utilizado. El parámetro secundario requiere correlación clínica.</p>
                </div>

                <div className="mt-16 pt-8 border-t-2 border-slate-800 grid grid-cols-12 gap-6 items-end">
                    <div className="col-span-5 text-center">
                        <div className="border-b border-slate-400 w-3/4 mx-auto mb-2 relative h-16">
                            <div className="absolute bottom-0 w-full text-center pb-1">
                                <span className="font-signature text-3xl text-blue-900 opacity-80" style={{ fontFamily: 'cursive' }}>Dra. E. Ramírez</span>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-800">Dra. E. Ramírez</p>
                        <p className="text-xs text-slate-500">Directora Técnica - Reg. 55432</p>
                    </div>

                    <div className="col-span-4 text-center">
                        <div className="border-b border-slate-400 w-3/4 mx-auto mb-2 relative h-16"></div>
                        <p className="text-sm font-bold text-slate-800">Técnico Analista</p>
                        <p className="text-xs text-slate-500">Sección Análisis</p>
                    </div>

                    <div className="col-span-3 flex flex-col items-end justify-end">
                        <div className="bg-white p-2 border-2 border-slate-800 rounded shadow-sm">
                            <img src={qrUrl} alt="Validación QR" className="w-24 h-24" crossOrigin="anonymous" />
                        </div>
                        <p className="text-[10px] text-slate-500 text-right font-bold mt-2 leading-tight uppercase w-32">
                            Escanee para verificar autenticidad en LIMS
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('admin'); // 'admin', 'staff', 'client'
    const [view, setView] = useState('login');
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    const [requests, setRequests] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [clients, setClients] = useState([]);
    const [labInfo, setLabInfo] = useState({ name: 'Sistema LIMS - Microlabs' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Auth Error", error);
                // Si falla la auth, forzamos un estado para que no se quede cargando
                setUser({ uid: 'offline-user' });
                setIsAuthReady(true);
            }
        };
        initAuth();
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) setUser(u);
            setIsAuthReady(true);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!isAuthReady) return;
        setLoading(true);

        try {
            const unsubRequests = onSnapshot(collection(db, `artifacts/${appId}/public/data/requests`), (s) => {
                const d = s.docs.map(x => ({ id: x.id, ...x.data() }));
                d.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setRequests(d);
                setLoading(false);
            }, (error) => {
                console.error("Firestore Error (Requests):", error);
                setLoading(false); // Para no bloquear la UI si falla
            });
            const unsubClients = onSnapshot(collection(db, `artifacts/${appId}/public/data/clients`), (s) => setClients(s.docs.map(x => ({ id: x.id, ...x.data() }))), (e) => console.error(e));
            const unsubAnalyses = onSnapshot(collection(db, `artifacts/${appId}/public/data/analyses`), (s) => setAnalyses(s.docs.map(x => ({ id: x.id, ...x.data() }))), (e) => console.error(e));
            const unsubLab = onSnapshot(doc(db, `artifacts/${appId}/public/data/lab_settings`, "main"), (d) => { if (d.exists()) setLabInfo(d.data()); }, (e) => console.error(e));

            return () => { unsubRequests(); unsubClients(); unsubAnalyses(); unsubLab(); };
        } catch (e) {
            console.error("Firestore Init Error:", e);
            setLoading(false);
        }
    }, [isAuthReady, user]);

    const navigateTo = (viewName, id = null) => {
        setSelectedRequestId(id);
        setView(viewName);
        window.scrollTo(0, 0);
    };

    const selectedRequest = useMemo(() => {
        const found = requests.find(r => r.id === selectedRequestId);
        if (found) return found;

        // Retorno de Mock data para poder probar la UI
        if (selectedRequestId && selectedRequestId.startsWith('MC-2026-')) {
            return {
                id: selectedRequestId,
                clientName: 'Cliente Mock (Simulación)',
                analysisRequested: 'Análisis Demostrativo',
                requestDate: { seconds: Date.now() / 1000 },
                status: 'En Proceso'
            };
        }
        return null;
    }, [requests, selectedRequestId]);

    const renderContent = () => {
        if (!isAuthReady || loading) return <LoadingSpinner />;

        switch (view) {
            case 'client_settings': return <ClientSettings db={db} clients={clients} navigateTo={navigateTo} />;
            case 'analysis_settings': return <AnalysisSettings db={db} analyses={analyses} navigateTo={navigateTo} />;
            case 'lab_settings': return <LabSettings db={db} labInfo={labInfo} navigateTo={navigateTo} />;
            case 'new_request': return <RequestForm db={db} user={user} navigateTo={navigateTo} availableAnalyses={analyses} clients={clients} />;
            case 'request_details': return <RequestDetails db={db} request={selectedRequest} user={user} navigateTo={navigateTo} availableAnalyses={analyses} />;
            case 'report': return <ReportView request={selectedRequest} navigateTo={navigateTo} availableAnalyses={analyses} labInfo={labInfo} />;
            case 'audit': return <AuditView db={db} navigateTo={navigateTo} />;
            case 'inventory': return <InventoryView db={db} navigateTo={navigateTo} />;
            case 'qc': return <QCView navigateTo={navigateTo} />;
            case 'accounting': return <AccountingView navigateTo={navigateTo} userRole={userRole} />;
            case 'billing': return <BillingView navigateTo={navigateTo} />;
            case 'crm': return <CRMView navigateTo={navigateTo} />;
            case 'quotes': return <QuotesView navigateTo={navigateTo} />;
            case 'bulk_upload': return <BulkUploadView db={db} user={user} navigateTo={navigateTo} />;
            case 'pre_report': return <PreReportView request={selectedRequest} navigateTo={navigateTo} labInfo={labInfo} />;
            case 'final_report': return <FinalReportView request={selectedRequest} navigateTo={navigateTo} labInfo={labInfo} />;
            case 'manual_form': return <ManualFormView navigateTo={navigateTo} labInfo={labInfo} />;
            case 'dashboard': return <Dashboard requests={requests} navigateTo={navigateTo} clients={clients} />;
            case 'home':
            default: return <HomeDashboard navigateTo={navigateTo} />;
        }
    };

    return (
        <ErrorBoundary>
            {view === 'login' ? (
                <LoginView navigateTo={navigateTo} setUserRole={setUserRole} />
            ) : view === 'client_portal' ? (
                <ClientPortal navigateTo={navigateTo} userRole={userRole} />
            ) : (
                <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
                    <Sidebar user={user} navigateTo={navigateTo} view={view} labInfo={labInfo} />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <TopBar user={user} labInfo={labInfo} navigateTo={navigateTo} />
                        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
                            <div className="w-full max-w-7xl mx-auto">
                                {renderContent()}
                            </div>
                        </main>
                        <MobileNav navigateTo={navigateTo} view={view} />
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
}