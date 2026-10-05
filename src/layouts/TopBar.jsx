import React, { useState, useEffect } from 'react';
import { 
    Bell, Users, FlaskConical, Settings, Sparkles, Activity, 
    ShieldCheck, Search, Command, Keyboard, PlusCircle 
} from 'lucide-react';
import { Logo } from '../components/UI';
import { systemWatchdog } from '../utils/systemWatchdog';

export const TopBar = ({ user, navigateTo, labInfo, userRole, onOpenCommandPalette, onOpenShortcuts }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [watchdogStatus, setWatchdogStatus] = useState({ api: 'ONLINE', analyzers: 'STANDBY' });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        systemWatchdog.startAutoCheck();
        const unsubscribe = systemWatchdog.subscribe((s) => setWatchdogStatus(s));

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
        };
    }, []);

    const notifications = [
        { id: 1, title: 'Inventario Bajo', message: 'Reactivo Ácido Sulfúrico por debajo del mínimo.', time: 'Hace 10 min', type: 'warning', read: false },
        { id: 2, title: 'Muestra Urgente', message: 'Muestra MC-2026-008 ingresada con prioridad alta.', time: 'Hace 1 hora', type: 'alert', read: false },
        { id: 3, title: 'Validación Pendiente', message: '3 resultados esperando revisión del Director Técnico.', time: 'Hace 2 horas', type: 'info', read: true }
    ];

    const unreadCount = notifications.filter(n => !n.read).length;



    return (
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0 print:hidden relative gap-2 sm:gap-4">
            <div className="flex items-center gap-3">
                <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
                    <Logo url={labInfo?.logoUrl} variant="icon" className="h-8 w-8" />
                    <h1 className="font-bold text-slate-800">LIMS</h1>
                </div>

                {/* Global Command Palette / Search Bar Trigger */}
                <button 
                    onClick={onOpenCommandPalette}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all text-xs font-medium w-36 sm:w-60 md:w-72 lg:w-80 shadow-2xs group cursor-pointer"
                    title="Buscar muestra o ejecutar comandos (Ctrl + K)"
                >
                    <Search size={15} className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <span className="flex-1 text-left truncate text-slate-400 group-hover:text-slate-600">
                        Buscar muestra...
                    </span>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-500 font-bold shadow-2xs shrink-0">
                        <Command size={10} className="inline mr-0.5" />K
                    </kbd>
                </button>

                {/* Quick Add Patient Button */}
                {['admin', 'director_tecnico', 'billing_agent', 'analyst'].includes(userRole) && (
                    <button
                        onClick={() => navigateTo('new_request', null, { mode: 'clinical' })}
                        className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200/70 transition-colors shadow-2xs cursor-pointer"
                        title="Ingreso Rápido de Paciente (Alt + N)"
                    >
                        <PlusCircle size={14} />
                        <span>+ Paciente</span>
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Keyboard Shortcuts Help Button */}
                <button
                    onClick={onOpenShortcuts}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Atajos de Teclado (?)"
                >
                    <Keyboard size={18} />
                </button>


                {/* Connectivity Status Indicator */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-300 ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? (watchdogStatus.api === 'ONLINE' ? 'bg-emerald-500' : 'bg-emerald-400 animate-pulse') : 'bg-amber-500 animate-pulse'}`}></span>
                    <span className="hidden md:inline">
                        {isOnline ? (watchdogStatus.api === 'ONLINE' ? 'En Línea (Local OK)' : 'En Línea (Cloud)') : 'Sin Conexión'}
                    </span>
                    <span className="md:hidden">
                        {isOnline ? 'OK' : 'Offline'}
                    </span>
                </div>

                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors relative cursor-pointer" title="Notificaciones">
                        <Bell size={19} />
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
                            <div className="p-2.5 text-center border-t border-slate-100 flex items-center justify-between bg-slate-50">
                                <button 
                                    onClick={() => { setShowNotifications(false); navigateTo('reminders'); }} 
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                    Ver Agenda & Alertas LIMS →
                                </button>
                                <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Cerrar</button>
                            </div>
                        </div>
                    )}
                </div>

                {userRole === 'admin' && (
                    <>
                        <button onClick={() => navigateTo('crm')} className="hidden sm:block p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer" title="Directorio CRM"><Users size={19} /></button>
                        <button onClick={() => navigateTo('analysis_settings')} className="hidden sm:block p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer" title="Análisis"><FlaskConical size={19} /></button>
                        <button onClick={() => navigateTo('lab_settings')} className="hidden sm:block p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer" title="Configuración"><Settings size={19} /></button>
                    </>
                )}
                {user && (
                    <div className="ml-1 sm:ml-2 pl-2 sm:pl-3 border-l flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs" title={`Operador: ${user.uid.substring(0, 6)}`}>
                            {user.uid.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
