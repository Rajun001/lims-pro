import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para gestión del estado de la PWA, Service Worker y conectividad
 */
export function usePWA() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(() => {
        if (typeof window !== 'undefined') {
            const mq = window.matchMedia('(display-mode: standalone)');
            return mq.matches || window.navigator.standalone === true;
        }
        return false;
    });
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [swVersion, setSwVersion] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [swRegistration, setSwRegistration] = useState(null);

    useEffect(() => {
        // Monitorear cambios en modo de visualización
        const mq = window.matchMedia('(display-mode: standalone)');
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

    const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    return { installPrompt, isInstalled, isOnline, swVersion, updateAvailable, isIOS, install, applyUpdate };
}

export default usePWA;
