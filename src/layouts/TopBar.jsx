import React, { useState, useEffect } from 'react';
import { Bell, Users, FlaskConical, Settings, Play, Sparkles } from 'lucide-react';
import { Logo } from '../components/UI';

export const TopBar = ({ user, navigateTo, labInfo, userRole }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const notifications = [
        { id: 1, title: 'Inventario Bajo', message: 'Reactivo Ácido Sulfúrico por debajo del mínimo.', time: 'Hace 10 min', type: 'warning', read: false },
        { id: 2, title: 'Muestra Urgente', message: 'Muestra MC-2026-008 ingresada con prioridad alta.', time: 'Hace 1 hora', type: 'alert', read: false },
        { id: 3, title: 'Validación Pendiente', message: '3 resultados esperando revisión del Director Técnico.', time: 'Hace 2 horas', type: 'info', read: true }
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    const triggerDemo = () => {
        window.dispatchEvent(new CustomEvent('start-lims-demo'));
    };

    return (
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 z-10 shrink-0 print:hidden relative">
            <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
                <Logo url={labInfo?.logoUrl} className="h-8 w-8" />
                <h1 className="font-bold text-slate-800">LIMS</h1>
            </div>
            <div className="hidden md:block"></div> {/* Spacer for desktop */}
            <div className="flex items-center gap-3">
                {/* E2E Demo Trigger Button */}
                <button
                    onClick={triggerDemo}
                    className="hover:scale-105 active:scale-95 transition-all bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                    title="Iniciar Demo Automático del Sistema"
                >
                    <Play size={12} className="fill-white" />
                    <span>Demo Automático</span>
                </button>

                {/* Connectivity Status Indicator */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-300 ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span>
                        {isOnline ? 'En Línea' : 'Sin Conexión (Autoguardado)'}
                    </span>
                </div>

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

                {userRole === 'admin' && (
                    <>
                        <button onClick={() => navigateTo('crm')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Directorio CRM"><Users size={20} /></button>
                        <button onClick={() => navigateTo('analysis_settings')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Análisis"><FlaskConical size={20} /></button>
                        <button onClick={() => navigateTo('lab_settings')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Configuración"><Settings size={20} /></button>
                    </>
                )}
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
