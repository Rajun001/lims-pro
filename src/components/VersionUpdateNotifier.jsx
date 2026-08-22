import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export const VersionUpdateNotifier = () => {
    const [hasUpdate, setHasUpdate] = useState(false);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const checkVersion = async () => {
            try {
                // Fetch version.json with cache-busting timestamp query
                const res = await fetch(`/version.json?t=${Date.now()}`, {
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (!res.ok) return;
                const data = await res.json();
                
                if (!data || !data.version) return;

                if (!currentVersion) {
                    // First check on app load
                    setCurrentVersion(data.version);
                    const savedVersion = localStorage.getItem('LIMS_APP_VERSION');
                    if (!savedVersion) {
                        localStorage.setItem('LIMS_APP_VERSION', String(data.version));
                    }
                } else if (data.version !== currentVersion) {
                    if (isMounted) {
                        setHasUpdate(true);
                    }
                }
            } catch {
                // Silently ignore network or offline issues
            }
        };

        // Initial check
        checkVersion();

        // Check periodically every 3 minutes
        const interval = setInterval(checkVersion, 3 * 60 * 1000);

        // Check when user refocuses tab
        const handleFocus = () => checkVersion();
        window.addEventListener('focus', handleFocus);

        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [currentVersion]);

    const handleApplyUpdate = () => {
        if ('caches' in window) {
            // Clear cache storage to ensure latest assets are fetched
            caches.keys().then((names) => {
                names.forEach((name) => caches.delete(name));
            });
        }
        window.location.reload();
    };

    if (!hasUpdate || dismissed) return null;

    return (
        <div className="fixed bottom-5 right-5 z-[9999] animate-bounce-in">
            <div className="bg-slate-900/95 text-white border border-indigo-500/30 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-md">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white leading-tight">
                        Nueva mejora disponible
                    </p>
                    <p className="text-[11px] text-slate-300 truncate">
                        Hay una actualización lista para aplicarse.
                    </p>
                </div>
                <button
                    onClick={handleApplyUpdate}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Actualizar
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                    title="Cerrar"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
