import React, { useState, useEffect } from 'react';
import {
    Snowflake, Thermometer, AlertTriangle, CheckCircle2, Clock,
    Activity, Download, RefreshCw, Info, Zap, X
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ReferenceLine, ResponsiveContainer, Legend
} from 'recharts';
import {
    DEVICES, startSimulation, stopAllSimulations,
    getHistory, getIncidents, seedDemoHistory
} from '../services/ColdChainService';

// ── Gauge SVG circular ────────────────────────────────────────────────────────
function TempGauge({ device, temp, status }) {
    const min = device.warnMin - 2;
    const max = device.warnMax + 2;
    const range = max - min;
    const pct = Math.max(0, Math.min(1, (temp - min) / range));

    const R = 52;
    const cx = 64, cy = 64;
    const startAngle = 215;
    const endAngle = -35;
    const totalArc = startAngle - endAngle; // 250deg

    const polarToCartesian = (angle) => {
        const rad = (angle - 90) * Math.PI / 180;
        return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
    };

    const describeArc = (start, end) => {
        const s = polarToCartesian(start);
        const e = polarToCartesian(end);
        const large = Math.abs(end - start) > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 0 ${e.x} ${e.y}`;
    };

    const needleAngle = startAngle - pct * totalArc;
    const needleRad   = (needleAngle - 90) * Math.PI / 180;
    const needleX = cx + 40 * Math.cos(needleRad);
    const needleY = cy + 40 * Math.sin(needleRad);

    const statusColors = { NORMAL: '#10b981', ADVERTENCIA: '#f59e0b', RUPTURA: '#ef4444' };
    const trackColor = '#e2e8f0';
    const fillColor = statusColors[status] || '#10b981';

    const okStartPct = Math.max(0, Math.min(1, (device.minOk - min) / range));
    const okEndPct   = Math.max(0, Math.min(1, (device.maxOk - min) / range));
    const okStartAngle = startAngle - okStartPct * totalArc;
    const okEndAngle   = startAngle - okEndPct * totalArc;

    return (
        <svg width="128" height="100" viewBox="0 0 128 100">
            {/* Track */}
            <path d={describeArc(startAngle, endAngle)} fill="none" stroke={trackColor} strokeWidth="10" strokeLinecap="round" />
            {/* OK zone */}
            <path d={describeArc(okStartAngle, okEndAngle)} fill="none" stroke="#bbf7d0" strokeWidth="10" strokeLinecap="round" />
            {/* Current arc */}
            <path d={describeArc(startAngle, startAngle - pct * totalArc)} fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round" />
            {/* Needle */}
            <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="5" fill="#334155" />
            {/* Value */}
            <text x={cx} y={cy + 22} textAnchor="middle" fontSize="15" fontWeight="900" fill={fillColor}>
                {temp > 0 ? '+' : ''}{temp}°
            </text>
        </svg>
    );
}

// ── Tarjeta de dispositivo ────────────────────────────────────────────────────
function DeviceCard({ device, reading, onSelect, selected }) {
    const temp = reading ? reading.temp : device.targetTemp;
    const status = reading ? reading.status : 'NORMAL';

    const statusCfg = {
        NORMAL:      { bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: '✓ Normal', dot: 'bg-emerald-500' },
        ADVERTENCIA: { bg: 'bg-amber-50 border-amber-300',    badge: 'bg-amber-100 text-amber-800 border-amber-300',    label: '⚠ Advertencia', dot: 'bg-amber-400 animate-pulse' },
        RUPTURA:     { bg: 'bg-red-50 border-red-400',        badge: 'bg-red-100 text-red-800 border-red-300',          label: '🚨 Ruptura', dot: 'bg-red-500 animate-ping' },
    };
    const s = statusCfg[status] || statusCfg.NORMAL;

    return (
        <button
            onClick={() => onSelect(device.id)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${s.bg} ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:shadow-md'}`}
        >
            <div className="flex items-start justify-between mb-2">
                <div>
                    <div className="text-xl mb-0.5">{device.emoji}</div>
                    <div className="font-black text-slate-800 text-sm">{device.name}</div>
                    <div className="text-[10px] text-slate-500">{device.location}</div>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-full border ${s.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                    {s.label}
                </span>
            </div>

            <div className="flex items-center justify-center">
                <TempGauge device={device} temp={temp} status={status} />
            </div>

            <div className="mt-1 text-center">
                <div className="text-[10px] text-slate-500">Rango OK: <span className="font-bold text-slate-700">{device.minOk}° a {device.maxOk}°C</span></div>
                <div className="text-[10px] text-slate-400 mt-0.5">Cal. {device.lastCalibration}</div>
            </div>
        </button>
    );
}

// ── Tooltip del gráfico ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const temp = payload[0]?.value;
    return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl">
            <div className="text-slate-400 mb-1">{new Date(label).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="font-black text-lg">{temp > 0 ? '+' : ''}{temp}°C</div>
        </div>
    );
}

// ── Vista principal ───────────────────────────────────────────────────────────
export const ColdChainView = () => {
    const [readings, setReadings]         = useState({});
    const [selectedDevice, setSelectedDevice] = useState(DEVICES[0].id);
    const [incidents, setIncidents]       = useState(() => {
        seedDemoHistory();
        return getIncidents();
    });
    const [activeTab, setActiveTab]       = useState('monitor');

    const device = DEVICES.find(d => d.id === selectedDevice);

    const getFormattedHistory = (devId, minOk, maxOk) => {
        const history = getHistory(devId);
        return [...history].reverse().slice(-96).map(r => ({
            ts: r.ts,
            temp: r.temp,
            minOk,
            maxOk,
        }));
    };

    const [chartData, setChartData]       = useState(() => {
        const d0 = DEVICES[0];
        return getFormattedHistory(d0.id, d0.minOk, d0.maxOk);
    });
    const [prevDevId, setPrevDevId]       = useState(DEVICES[0].id);

    // Sincronizar historial al cambiar de dispositivo seleccionado
    if (selectedDevice !== prevDevId && device) {
        setPrevDevId(selectedDevice);
        setChartData(getFormattedHistory(selectedDevice, device.minOk, device.maxOk));
    }

    // Iniciar simulaciones para todos los dispositivos
    useEffect(() => {
        DEVICES.forEach(dev => {
            startSimulation(dev.id, (reading) => {
                setReadings(prev => ({ ...prev, [dev.id]: reading }));
                if (dev.id === selectedDevice && device) {
                    setChartData(prev => {
                        const updated = [...prev, { ts: reading.ts, temp: reading.temp, minOk: device.minOk, maxOk: device.maxOk }];
                        return updated.slice(-96);
                    });
                }
                if (reading.status !== 'NORMAL') {
                    setIncidents(getIncidents());
                }
            }, 3000);
        });
        return () => stopAllSimulations();
    }, [selectedDevice, device]);

    const currentReading = readings[selectedDevice];
    const currentTemp = currentReading ? currentReading.temp : device.targetTemp;
    const currentStatus = currentReading ? currentReading.status : 'NORMAL';

    const statusColors = { NORMAL: '#10b981', ADVERTENCIA: '#f59e0b', RUPTURA: '#ef4444' };
    const chartColor = statusColors[currentStatus];

    const openIncidents = incidents.filter(i => !i.resolvedAt);

    return (
        <div className="space-y-6 animate-fade-in">

            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Snowflake size={24} className="text-blue-300" />
                        <h2 className="font-black text-2xl">Trazabilidad — Cadena de Frío</h2>
                    </div>
                    <p className="text-blue-200 text-xs">Monitoreo IoT en tiempo real · Alertas CLSI automáticas · ISO 15189:2022 §6.6</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center">
                        <div className="text-[10px] text-blue-200 font-bold uppercase">Sensores Activos</div>
                        <div className="text-2xl font-black">{DEVICES.length}</div>
                    </div>
                    {openIncidents.length > 0 && (
                        <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-2 text-center animate-pulse">
                            <div className="text-[10px] text-red-200 font-bold uppercase">Incidencias Activas</div>
                            <div className="text-2xl font-black text-red-300">{openIncidents.length}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
                {[
                    { id: 'monitor', label: 'Monitor en Vivo', icon: Activity },
                    { id: 'chart', label: 'Histórico 24h', icon: Thermometer },
                    { id: 'incidents', label: `Incidencias ${openIncidents.length > 0 ? '🔴 ' + openIncidents.length : ''}`, icon: AlertTriangle },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-blue-600'}`}
                    >
                        <t.icon size={14} /> {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: Monitor en Vivo ── */}
            {activeTab === 'monitor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {DEVICES.map(dev => (
                        <DeviceCard
                            key={dev.id}
                            device={dev}
                            reading={readings[dev.id]}
                            onSelect={setSelectedDevice}
                            selected={selectedDevice === dev.id}
                        />
                    ))}

                    {/* Panel de detalle */}
                    <div className="sm:col-span-2 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{device.emoji}</span>
                                <span className="font-black text-sm">{device.name} — Detalle</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400">{device.clsiRef}</span>
                                <div className={`flex items-center gap-1.5 text-xs font-black px-2 py-1 rounded-full ${
                                    currentStatus === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-300' :
                                    currentStatus === 'ADVERTENCIA' ? 'bg-amber-500/20 text-amber-300' :
                                    'bg-red-500/20 text-red-300 animate-pulse'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${
                                        currentStatus === 'NORMAL' ? 'bg-emerald-400' :
                                        currentStatus === 'ADVERTENCIA' ? 'bg-amber-400 animate-pulse' :
                                        'bg-red-400 animate-ping'
                                    }`}></span>
                                    {currentStatus}
                                </div>
                            </div>
                        </div>
                        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-100">
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Temperatura Actual</div>
                                <div className="text-3xl font-black" style={{ color: chartColor }}>
                                    {currentTemp > 0 ? '+' : ''}{currentTemp}°C
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Rango Aceptable</div>
                                <div className="text-lg font-black text-slate-700">{device.minOk}° a {device.maxOk}°C</div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Última Calibración</div>
                                <div className="text-sm font-black text-slate-700">{device.lastCalibration}</div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Próxima Calibración</div>
                                <div className="text-sm font-black text-slate-700">{device.nextCalibration}</div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="text-[10px] font-bold uppercase text-slate-500 mb-2">Contenido Almacenado</div>
                            <div className="flex flex-wrap gap-2">
                                {device.contents.map((c, i) => (
                                    <span key={i} className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded-lg font-semibold">{c}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: Histórico ── */}
            {activeTab === 'chart' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Thermometer size={16} className="text-blue-300" />
                            <span className="font-black text-sm">Histórico de Temperatura — {device.name} (últimas 8h)</span>
                        </div>
                        <div className="flex gap-2">
                            {DEVICES.map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => setSelectedDevice(d.id)}
                                    className={`text-xs px-2 py-1 rounded-lg font-bold transition-all ${selectedDevice === d.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {d.emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-5">
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={device.color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={device.color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="ts"
                                    tickFormatter={ts => new Date(ts).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    interval={11}
                                />
                                <YAxis
                                    domain={[device.warnMin - 3, device.warnMax + 3]}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    tickFormatter={v => `${v}°`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                {/* Banda de rango OK */}
                                <ReferenceLine y={device.maxOk} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: `Max ${device.maxOk}°C`, position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }} />
                                <ReferenceLine y={device.minOk} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: `Min ${device.minOk}°C`, position: 'insideBottomRight', fontSize: 10, fill: '#ef4444' }} />
                                <ReferenceLine y={device.targetTemp} stroke="#94a3b8" strokeDasharray="2 4" strokeWidth={1} label={{ value: `Target ${device.targetTemp}°C`, position: 'insideTopLeft', fontSize: 9, fill: '#94a3b8' }} />
                                <Area
                                    type="monotone"
                                    dataKey="temp"
                                    stroke={device.color}
                                    strokeWidth={2.5}
                                    fill="url(#tempGrad)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: device.color }}
                                    name="Temperatura"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="px-5 pb-4 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block border-t border-dashed border-red-400"></span> Límite CLSI</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-400 inline-block"></span> Target {device.targetTemp}°C</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: device.color + '50' }}></span> Temperatura registrada</span>
                    </div>
                </div>
            )}

            {/* ── TAB: Incidencias ── */}
            {activeTab === 'incidents' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-500" /> Historial de Incidencias de Cadena de Frío
                        </h4>
                        <button
                            onClick={() => setIncidents(getIncidents())}
                            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-bold"
                        >
                            <RefreshCw size={12} /> Actualizar
                        </button>
                    </div>
                    {incidents.length === 0 ? (
                        <div className="p-12 text-center">
                            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
                            <div className="font-black text-slate-700">Sin incidencias registradas</div>
                            <div className="text-slate-500 text-sm mt-1">Todas las temperaturas dentro de los rangos CLSI aceptables.</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="p-3">ID</th>
                                        <th className="p-3">Dispositivo</th>
                                        <th className="p-3 text-center">Tipo</th>
                                        <th className="p-3 text-center">Temp. Registrada</th>
                                        <th className="p-3">Fecha / Hora</th>
                                        <th className="p-3">Contenido Afectado</th>
                                        <th className="p-3">Acción Requerida</th>
                                        <th className="p-3 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {incidents.slice(0, 50).map((inc, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-mono text-blue-700 font-bold">{inc.id.slice(-8)}</td>
                                            <td className="p-3 font-semibold text-slate-700">{inc.deviceName}</td>
                                            <td className="p-3 text-center">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                                    inc.type === 'RUPTURA'
                                                        ? 'bg-red-100 text-red-700 border-red-200'
                                                        : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                    {inc.type}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center font-mono font-black" style={{ color: inc.type === 'RUPTURA' ? '#ef4444' : '#f59e0b' }}>
                                                {inc.temperature > 0 ? '+' : ''}{inc.temperature}°C
                                            </td>
                                            <td className="p-3 text-slate-500">{new Date(inc.timestamp).toLocaleString('es-CR')}</td>
                                            <td className="p-3 text-slate-600">{(inc.affectedContents || []).join(', ')}</td>
                                            <td className="p-3 text-slate-700 font-semibold max-w-[180px]">{inc.action}</td>
                                            <td className="p-3 text-center">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                                    inc.resolvedAt
                                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                        : 'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                    {inc.resolvedAt ? 'Resuelto' : 'Activo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ColdChainView;
