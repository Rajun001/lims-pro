import React, { useState } from 'react';
import { Download, X, Wifi, WifiOff, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

// ─── Banner de instalación ────────────────────────────────────────────────────
export function PWAInstallBanner() {
    const { installPrompt, isInstalled, isOnline, updateAvailable, isIOS, install, applyUpdate } = usePWA();
    const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa_install_dismissed') === '1');

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
