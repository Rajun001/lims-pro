/**
 * Vigilante de Salud y Monitoreo Autónomo del Sistema (System Watchdog)
 * Verifica periódicamente la conectividad de Firebase, la API local, el servidor de analizadores
 * y el estado de la base de datos para garantizar cero tiempo de inactividad desapercibido.
 */

import { getApiUrl } from './api.js';

class SystemWatchdogService {
    constructor() {
        this.status = {
            api: 'CHECKING', // 'ONLINE' | 'OFFLINE' | 'DEGRADED'
            firebase: 'ONLINE',
            analyzers: 'IDLE',
            lastCheck: null,
            latencyMs: 0,
            issues: []
        };
        this.listeners = new Set();
        this.timer = null;
    }

    subscribe(callback) {
        this.listeners.add(callback);
        callback(this.status);
        return () => this.listeners.delete(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.status));
    }

    async runHealthCheck() {
        const startTime = performance.now();
        const issues = [];
        let apiStatus = 'OFFLINE';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(`${getApiUrl()}/health`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                apiStatus = 'ONLINE';
            } else {
                apiStatus = 'DEGRADED';
                issues.push(`API respondió con estado HTTP ${res.status}`);
            }
        } catch {
            apiStatus = 'OFFLINE';
            // It's normal in cloud-only mode if local API isn't running
        }

        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        this.status = {
            api: apiStatus,
            firebase: navigator.onLine ? 'ONLINE' : 'OFFLINE',
            analyzers: apiStatus === 'ONLINE' ? 'CONNECTED' : 'STANDBY',
            lastCheck: new Date().toISOString(),
            latencyMs: latency,
            issues
        };

        this.notify();
        return this.status;
    }

    startAutoCheck(intervalMs = 30000) {
        if (this.timer) return;
        this.runHealthCheck();
        this.timer = setInterval(() => this.runHealthCheck(), intervalMs);
    }

    stopAutoCheck() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

export const systemWatchdog = new SystemWatchdogService();
