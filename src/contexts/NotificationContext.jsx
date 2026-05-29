/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now().toString() + Math.random().toString();
        setNotifications(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, [removeNotification]);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
            case 'error': return <AlertTriangle className="text-red-500" size={20} />;
            case 'info': default: return <Info className="text-blue-500" size={20} />;
        }
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            
            {/* Overlay de Toasts */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                {notifications.map(n => (
                    <div 
                        key={n.id} 
                        className="pointer-events-auto bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-start gap-3 w-80 animate-slide-in-right transition-all"
                    >
                        <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                        <div className="flex-1 text-sm font-medium text-slate-700">{n.message}</div>
                        <button 
                            onClick={() => removeNotification(n.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
