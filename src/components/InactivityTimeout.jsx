import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';

/**
 * COMPONENTE DE SEGURIDAD REGULATORIA (ISO 15189 / ISO 17025 / 21 CFR PART 11)
 * Cierre automático de sesión por inactividad para prevenir acceso no autorizado
 * a expedientes médicos e informes industriales en terminales desatendidas.
 */
export const InactivityTimeout = ({ 
    user, 
    userRole, 
    onLogout, 
    staffTimeoutMinutes = 15,
    clientTimeoutMinutes = 10,
    warningSeconds = 45 
}) => {
    // Si no hay usuario autenticado o está en login, no corre el temporizador
    const isAuthenticated = Boolean(user && user.uid !== 'guest' && user.email);
    
    // Determinar tiempo de inactividad según rol
    const isStaff = userRole && userRole !== 'client_patient' && userRole !== 'client_company' && userRole !== 'client_doctor';
    const timeoutMs = (isStaff ? staffTimeoutMinutes : clientTimeoutMinutes) * 60 * 1000;
    const warningMs = warningSeconds * 1000;

    const [isWarningVisible, setIsWarningVisible] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);
    const lastActivityRef = useRef(0);
    const checkIntervalRef = useRef(null);

    // Inicializar timestamp al montar
    useEffect(() => {
        lastActivityRef.current = Date.now();
    }, []);

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
        if (isWarningVisible) {
            setIsWarningVisible(false);
            setSecondsRemaining(warningSeconds);
        }
    }, [isWarningVisible, warningSeconds]);

    // Escuchar eventos de interacción del usuario con throttling
    useEffect(() => {
        if (!isAuthenticated) return;

        let lastThrottledCall = 0;
        const handleUserActivity = () => {
            const now = Date.now();
            if (now - lastThrottledCall > 1000) { // Throttle a 1 seg para eficiencia
                lastThrottledCall = now;
                lastActivityRef.current = now;
            }
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

        return () => {
            events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
        };
    }, [isAuthenticated]);

    // Intervalo de chequeo de inactividad cada 1 segundo
    useEffect(() => {
        if (!isAuthenticated) return;

        checkIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastActivityRef.current;
            const remaining = timeoutMs - elapsed;

            if (remaining <= 0) {
                // Tiempo agotado: Cerrar sesión inmediatamente
                clearInterval(checkIntervalRef.current);
                setIsWarningVisible(false);
                if (typeof onLogout === 'function') {
                    onLogout('inactivity');
                }
            } else if (remaining <= warningMs) {
                // Entrar en periodo de advertencia
                setIsWarningVisible(true);
                setSecondsRemaining(Math.ceil(remaining / 1000));
            } else {
                if (isWarningVisible) {
                    setIsWarningVisible(false);
                }
            }
        }, 1000);

        return () => {
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        };
    }, [isAuthenticated, timeoutMs, warningMs, onLogout, isWarningVisible]);

    if (!isAuthenticated || !isWarningVisible) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in text-left select-none">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5 animate-bounce-subtle">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                    <Clock size={32} className="animate-spin-slow" />
                </div>

                <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                        <ShieldAlert size={12} /> Seguridad y Privacidad ISO 15189 / 21 CFR Part 11
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                        ¿Sigue trabajando en el LIMS?
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                        Para proteger los datos clínicos y de inocuidad en terminales desatendidas, su sesión se cerrará automáticamente en:
                    </p>
                </div>

                <div className="py-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500 text-amber-600 font-mono text-3xl font-black">
                        {secondsRemaining}s
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => onLogout('manual')}
                        className="w-full sm:w-1/2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                        <LogOut size={14} /> Cerrar Ahora
                    </button>
                    <button
                        type="button"
                        onClick={resetTimer}
                        className="w-full sm:w-1/2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                        <CheckCircle2 size={14} /> Continuar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};
