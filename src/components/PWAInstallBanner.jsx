import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Wifi, WifiOff, RefreshCw, Smartphone, Monitor } from 'lucide-react';

// ─── Hook principal de PWA ────────────────────────────────────────────────────
export function usePWA() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [swVersion, setSwVersion] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [swRegistration, setSwRegistration] = useState(null);

    useEffect(() => {
        // Detectar si ya está instalada como PWA
        const mq = window.matchMedia('(display-mode: standalone)');
        setIsInstalled(mq.matches || window.navigator.standalone === true);
        const handleMq = (e) => setIsInstalled(e.matches);
        mq.addEventListener('change', handleMq);

        // Capturar evento de instalación
        const handlePrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
        window.addEventListener('beforeinstallprompt', handlePrompt);

        // Online / Offline
        const onOnline  = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online',  onOnline);
        window.addEventListener('offline', onOffline);

        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(reg => {
                    setSwRegistration(reg);
                    // Detectar actualización disponible
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    setUpdateAvailable(true);
                                }
                            });
                        }
                    });
                    // Consultar versión
                    if (reg.active) {
                        reg.active.postMessage({ type: 'GET_VERSION' });
                    }
                })
                .catch(err => console.warn('[PWA] SW registration failed:', err));

            // Escuchar mensajes del SW
            navigator.serviceWorker.addEventListener('message', (e) => {
                if (e.data?.type === 'VERSION') setSwVersion(e.data.version);
                if (e.data?.type === 'SYNC_COMPLETED') {
                    console.log('[PWA] Background sync completed at', new Date(e.data.ts).toLocaleTimeString());
                }
            });
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handlePrompt);
            window.removeEventListener('online',  onOnline);
            window.removeEventListener('offline', onOffline);
            mq.removeEventListener('change', handleMq);
        };
    }, []);

    const install = useCallback(async () => {
        if (!installPrompt) return false;
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') { setInstallPrompt(null); setIsInstalled(true); }
        return outcome === 'accepted';
    }, [installPrompt]);

    const applyUpdate = useCallback(() => {
        if (swRegistration?.waiting) {
            swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        setUpdateAvailable(false);
        window.location.reload();
    }, [swRegistration]);

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    return { installPrompt, isInstalled, isOnline, swVersion, updateAvailable, isIOS, install, applyUpdate };
}

// ─── Banner de instalación ────────────────────────────────────────────────────
export function PWAInstallBanner() {
    const { installPrompt, isInstalled, isOnline, updateAvailable, isIOS, install, applyUpdate } = usePWA();
    const [dismissed, setDismissed]         = useState(() => localStorage.getItem('pwa_install_dismissed') === '1');
    const [iosGuide, setIosGuide]           = useState(false);

    const dismiss = () => { localStorage.setItem('pwa_install_dismissed', '1'); setDismissed(true); };

    const showInstallBanner = !isInstalled && !dismissed && (!!installPrompt || isIOS);

    return (
        <>
            {/* ── Indicador Online/Offline ── */}
            <div
                title={isOnline ? 'Conectado' : 'Sin conexión — modo offline activo'}
                className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border transition-all duration-500 ${
                    isOnline
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border-red-300 text-red-700 animate-pulse'
                }`}
            >
                {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
                {isOnline ? 'En línea' : 'Offline'}
            </div>

            {/* ── Toast de actualización disponible ── */}
            {updateAvailable && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 animate-fade-in border border-indigo-700 min-w-[320px]">
                    <RefreshCw size={18} className="text-indigo-300 shrink-0 animate-spin" />
                    <div className="flex-1">
                        <div className="font-black text-sm">Nueva versión disponible</div>
                        <div className="text-indigo-300 text-[10px]">LIMS-PRO fue actualizado. Recarga para aplicar los cambios.</div>
                    </div>
                    <button
                        onClick={applyUpdate}
                        className="bg-white text-indigo-900 font-black text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors shrink-0"
                    >
                        Actualizar
                    </button>
                </div>
            )}

            {/* ── Banner de instalación (Android / Desktop) ── */}
            {showInstallBanner && !isIOS && (
                <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-fade-in">
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-2xl border border-indigo-700/50 p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                            <Monitor size={24} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-black text-sm">Instalar LIMS-PRO</div>
                            <div className="text-indigo-300 text-[10px] mt-0.5">Acceso offline · Acceso directo en escritorio · Más rápido</div>
                        </div>
                        <button
                            onClick={install}
                            className="bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            <Download size={14} /> Instalar
                        </button>
                        <button onClick={dismiss} className="text-indigo-400 hover:text-white p-1 rounded-lg shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Banner iOS (instrucciones Share + Add to Home) ── */}
            {showInstallBanner && isIOS && (
                <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-fade-in">
                    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 font-black text-sm">
                                <Smartphone size={16} className="text-blue-400" /> Instalar en iPhone / iPad
                            </div>
                            <button onClick={dismiss} className="text-slate-400 hover:text-white"><X size={16} /></button>
                        </div>
                        <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                            <li>Toca el botón <span className="font-black text-white">Compartir</span> ⬆️ en Safari</li>
                            <li>Selecciona <span className="font-black text-white">"Agregar a pantalla de inicio"</span></li>
                            <li>Toca <span className="font-black text-white">Agregar</span></li>
                        </ol>
                        <div className="mt-3 text-[10px] text-slate-500">Funciona sin conexión tras la primera visita.</div>
                    </div>
                </div>
            )}
        </>
    );
}
