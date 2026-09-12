/**
 * ColdChainService.js
 * Motor de simulación IoT para monitoreo de cadena de frío.
 * Gestiona sensores de temperatura, alertas CLSI, e historial de lecturas.
 */

export const DEVICES = [
    {
        id: 'freezer_1',
        name: 'Freezer Ultra-Bajo',
        location: 'Sala de Almacenamiento A',
        emoji: '🧊',
        targetTemp: -20,
        minOk: -25, maxOk: -15,
        warnMin: -27, warnMax: -13,
        color: '#3b82f6',
        colorClass: 'blue',
        clsiRef: 'CLSI EP7-A2 — Almacenamiento -20°C',
        lastCalibration: '2026-08-15',
        nextCalibration: '2026-11-15',
        contents: ['Sueros archivados', 'Reactivos PCR', 'Controles QC'],
    },
    {
        id: 'refrigerator_1',
        name: 'Refrigerador de Reactivos',
        location: 'Área de Preparación',
        emoji: '❄️',
        targetTemp: 4,
        minOk: 2, maxOk: 8,
        warnMin: 1, warnMax: 10,
        color: '#06b6d4',
        colorClass: 'cyan',
        clsiRef: 'CLSI MM13-A — 2°C a 8°C',
        lastCalibration: '2026-09-01',
        nextCalibration: '2026-12-01',
        contents: ['Reactivos inmunológicos', 'Tiras reactivas', 'Muestras activas'],
    },
    {
        id: 'incubator_1',
        name: 'Incubadora Microbiológica',
        location: 'Sala de Microbiología',
        emoji: '🔬',
        targetTemp: 36,
        minOk: 35, maxOk: 37,
        warnMin: 34.5, warnMax: 37.5,
        color: '#f97316',
        colorClass: 'orange',
        clsiRef: 'CLSI M2-A11 — 35°C ± 1°C',
        lastCalibration: '2026-09-05',
        nextCalibration: '2026-10-05',
        contents: ['Placas bacteriología', 'Cultivos sensibilidad', 'Caldo TSB'],
    },
    {
        id: 'ambient_1',
        name: 'Cámara de Temperatura Ambiente',
        location: 'Sala de Triage',
        emoji: '🌡️',
        targetTemp: 22,
        minOk: 15, maxOk: 25,
        warnMin: 13, warnMax: 28,
        color: '#10b981',
        colorClass: 'emerald',
        clsiRef: 'CLSI GP18-A — 15°C a 25°C',
        lastCalibration: '2026-08-20',
        nextCalibration: '2026-11-20',
        contents: ['Orina fresca', 'Heces (proceso inmediato)', 'Tiras diagnóstico'],
    },
];

const HISTORY_KEY   = 'lims_cold_chain_history';
const INCIDENTS_KEY = 'lims_cold_chain_incidents';
const MAX_READINGS  = 288; // 24h a 5-min por lectura

const _intervals = {};
const _callbacks = {};

function gaussianRandom(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function getDeviceStatus(device, temp) {
    if (temp < device.minOk || temp > device.maxOk) return 'RUPTURA';
    if (temp < device.warnMin || temp > device.warnMax) return 'ADVERTENCIA';
    return 'NORMAL';
}

export function getHistory(deviceId) {
    try {
        const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
        return all[deviceId] || [];
    } catch { return []; }
}

function saveReading(deviceId, reading) {
    try {
        const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
        if (!all[deviceId]) all[deviceId] = [];
        all[deviceId].unshift(reading);
        if (all[deviceId].length > MAX_READINGS) all[deviceId] = all[deviceId].slice(0, MAX_READINGS);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
    } catch (e) { console.warn('[ColdChain]', e); }
}

export function getIncidents() {
    try { return JSON.parse(localStorage.getItem(INCIDENTS_KEY) || '[]'); } catch { return []; }
}

export function recordIncident(device, reading, type) {
    const incident = {
        id: 'INC-' + Date.now(),
        deviceId: device.id,
        deviceName: device.name,
        type,
        temperature: reading.temp,
        timestamp: reading.ts,
        resolvedAt: null,
        affectedContents: device.contents,
        action: type === 'RUPTURA' ? 'Revisar muestras y notificar al Regente' : 'Monitorear evolución',
    };
    try {
        const list = getIncidents();
        list.unshift(incident);
        localStorage.setItem(INCIDENTS_KEY, JSON.stringify(list.slice(0, 200)));
    } catch (e) { console.warn('[ColdChain]', e); }
    return incident;
}

export function startSimulation(deviceId, onReading, intervalMs) {
    if (intervalMs === undefined) intervalMs = 3000;
    const device = DEVICES.find(function(d) { return d.id === deviceId; });
    if (!device) return;
    _callbacks[deviceId] = onReading;

    const history = getHistory(deviceId);
    let lastTemp = history.length > 0 ? history[0].temp : device.targetTemp;

    function tick() {
        const drift = gaussianRandom(0, 0.2);
        const pullBack = (device.targetTemp - lastTemp) * 0.05;
        lastTemp = parseFloat((lastTemp + drift + pullBack).toFixed(2));

        const status = getDeviceStatus(device, lastTemp);
        const reading = { temp: lastTemp, ts: new Date().toISOString(), status: status };

        saveReading(deviceId, reading);

        if (status !== 'NORMAL') {
            const prevIncidents = getIncidents();
            const recent = prevIncidents.find(function(i) {
                return i.deviceId === deviceId && !i.resolvedAt &&
                    Date.now() - new Date(i.timestamp).getTime() < 60000;
            });
            if (!recent) recordIncident(device, reading, status);
        }

        if (_callbacks[deviceId]) _callbacks[deviceId](reading, device);
    }

    tick();
    _intervals[deviceId] = setInterval(tick, intervalMs);
}

export function stopSimulation(deviceId) {
    if (_intervals[deviceId]) {
        clearInterval(_intervals[deviceId]);
        delete _intervals[deviceId];
        delete _callbacks[deviceId];
    }
}

export function stopAllSimulations() {
    Object.keys(_intervals).forEach(stopSimulation);
}

export function seedDemoHistory() {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    DEVICES.forEach(function(device) {
        if (existing[device.id] && existing[device.id].length > 10) return;
        var readings = [];
        var temp = device.targetTemp;
        var now = Date.now();
        for (var i = 287; i >= 0; i--) {
            var drift = gaussianRandom(0, 0.3);
            var pullBack = (device.targetTemp - temp) * 0.08;
            temp = parseFloat((temp + drift + pullBack).toFixed(2));
            readings.unshift({
                temp: temp,
                ts: new Date(now - i * 5 * 60 * 1000).toISOString(),
                status: getDeviceStatus(device, temp),
            });
        }
        existing[device.id] = readings;
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
}
