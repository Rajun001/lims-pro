import React, { useMemo } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, CheckCircle2, TrendingUp, Activity } from 'lucide-react';

// ─── Estadísticas ─────────────────────────────────────────────────────────────
function calcStats(values) {
    const nums = values.map(Number).filter(v => !isNaN(v));
    if (nums.length === 0) return { mean: 0, sd: 0, cv: 0, n: 0 };
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
    const sd = Math.sqrt(variance);
    const cv = mean !== 0 ? ((sd / mean) * 100).toFixed(2) : 0;
    return { mean: parseFloat(mean.toFixed(4)), sd: parseFloat(sd.toFixed(4)), cv: parseFloat(cv), n: nums.length };
}

// ─── Reglas de Westgard ───────────────────────────────────────────────────────
function evaluateWestgard(points, mean, sd) {
    const violations = [];
    const n = points.length;
    if (n === 0 || sd === 0) return { status: 'IN_CONTROL', violations: [] };
    const z = points.map(p => (p.value - mean) / sd);

    // 1:3s
    z.forEach((zi, i) => {
        if (Math.abs(zi) > 3) violations.push({ rule: '1:3s', idx: i, severity: 'REJECT', msg: `Punto ${i + 1}: z=${zi.toFixed(2)} — fuera de ±3SD` });
    });
    // 2:2s
    for (let i = 1; i < n; i++) {
        if (z[i] > 2 && z[i-1] > 2) violations.push({ rule: '2:2s', idx: i, severity: 'REJECT', msg: `Puntos ${i}-${i+1}: 2 consecutivos >+2SD` });
        if (z[i] < -2 && z[i-1] < -2) violations.push({ rule: '2:2s', idx: i, severity: 'REJECT', msg: `Puntos ${i}-${i+1}: 2 consecutivos <-2SD` });
    }
    // R:4s
    for (let i = 1; i < n; i++) {
        if (Math.abs(z[i] - z[i-1]) > 4) violations.push({ rule: 'R:4s', idx: i, severity: 'REJECT', msg: `Puntos ${i}-${i+1}: rango >4SD` });
    }
    // 4:1s
    for (let i = 3; i < n; i++) {
        const s = z.slice(i - 3, i + 1);
        if (s.every(zi => zi > 1)) violations.push({ rule: '4:1s', idx: i, severity: 'WARNING', msg: `Puntos ${i-2}-${i+1}: 4 consecutivos >+1SD` });
        if (s.every(zi => zi < -1)) violations.push({ rule: '4:1s', idx: i, severity: 'WARNING', msg: `Puntos ${i-2}-${i+1}: 4 consecutivos <-1SD` });
    }
    // 10:x
    for (let i = 9; i < n; i++) {
        const s = z.slice(i - 9, i + 1);
        if (s.every(zi => zi > 0)) violations.push({ rule: '10:x', idx: i, severity: 'WARNING', msg: `Puntos ${i-8}-${i+1}: 10 consecutivos sobre la media` });
        if (s.every(zi => zi < 0)) violations.push({ rule: '10:x', idx: i, severity: 'WARNING', msg: `Puntos ${i-8}-${i+1}: 10 consecutivos bajo la media` });
    }
    // 1:2s advertencia
    z.forEach((zi, i) => {
        if (Math.abs(zi) > 2 && Math.abs(zi) <= 3) violations.push({ rule: '1:2s', idx: i, severity: 'WARNING', msg: `Punto ${i+1}: z=${zi.toFixed(2)} — advertencia ±2SD` });
    });

    const unique = violations.filter((v, i, arr) => arr.findIndex(x => x.rule === v.rule && x.idx === v.idx) === i);
    const hasReject = unique.some(v => v.severity === 'REJECT');
    const hasWarn = unique.some(v => v.severity === 'WARNING');
    return { status: hasReject ? 'OUT_OF_CONTROL' : hasWarn ? 'WARNING' : 'IN_CONTROL', violations: unique };
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, mean, sd }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    const z = sd > 0 ? ((d.value - mean) / sd).toFixed(2) : 'N/A';
    const isAlert = Math.abs(parseFloat(z)) > 2;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[180px]">
            <div className="font-black text-slate-800 mb-1">{d.label} — Punto #{d.idx}</div>
            <div className={`font-mono font-black text-xl ${isAlert ? 'text-red-600' : 'text-indigo-700'}`}>{d.value}</div>
            <div className="text-slate-500 mt-1">z-score: <span className={`font-bold ${isAlert ? 'text-red-600' : 'text-slate-700'}`}>{z}</span></div>
            {d.violationRule && <div className="mt-1.5 text-red-600 font-bold border-t border-red-100 pt-1">⚠ Regla {d.violationRule}</div>}
        </div>
    );
};

// ─── Dot personalizado ────────────────────────────────────────────────────────
const QCDot = (props) => {
    const { cx, cy, payload, mean, sd } = props;
    if (!cx || !cy || payload?.value === undefined) return null;
    const z = sd > 0 ? Math.abs((payload.value - mean) / sd) : 0;
    const fill = z > 3 ? '#dc2626' : z > 2 ? '#f59e0b' : '#4f46e5';
    const r = z > 2 ? 8 : 5;
    return (
        <g>
            {z > 2 && <circle cx={cx} cy={cy} r={r + 6} fill={fill} opacity={0.15} />}
            <circle cx={cx} cy={cy} r={r} fill={fill} stroke="white" strokeWidth={2.5} />
        </g>
    );
};

// ─── Componente Levey-Jennings ────────────────────────────────────────────────
export const LeveyJenningsChart = ({ qcSamples = [], selectedParam = null }) => {
    const filtered = useMemo(() => {
        return qcSamples
            .filter(s => {
                const num = parseFloat(s.value ?? s.result ?? '');
                if (isNaN(num)) return false;
                if (selectedParam && s.parameter !== selectedParam) return false;
                return true;
            })
            .map(s => ({
                ...s,
                value: parseFloat(s.value ?? s.result ?? 0),
                label: s.createdAt?.seconds
                    ? new Date(s.createdAt.seconds * 1000).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit' })
                    : s.date || 'N/A',
            }))
            .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    }, [qcSamples, selectedParam]);

    const stats = useMemo(() => calcStats(filtered.map(d => d.value)), [filtered]);
    const { mean, sd } = stats;

    const westgard = useMemo(() => evaluateWestgard(filtered, mean, sd), [filtered, mean, sd]);

    const chartData = useMemo(() => filtered.map((d, i) => {
        const violation = westgard.violations.find(v => v.idx === i);
        return { ...d, idx: i + 1, violationRule: violation?.rule || null };
    }), [filtered, westgard]);

    const yDomain = sd > 0
        ? [parseFloat((mean - 3.6 * sd).toFixed(4)), parseFloat((mean + 3.6 * sd).toFixed(4))]
        : ['auto', 'auto'];

    const STATUS = {
        IN_CONTROL:     { label: 'EN CONTROL', icon: <CheckCircle2 size={16}/>, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
        WARNING:        { label: 'ADVERTENCIA', icon: <AlertTriangle size={16}/>, cls: 'bg-amber-50 border-amber-200 text-amber-800' },
        OUT_OF_CONTROL: { label: 'FUERA DE CONTROL', icon: <AlertTriangle size={16}/>, cls: 'bg-red-50 border-red-300 text-red-800' },
    };
    const s = STATUS[westgard.status];

    if (filtered.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Activity size={44} className="text-slate-300" />
                <p className="text-sm font-semibold">Mínimo 2 lecturas numéricas para el gráfico Levey-Jennings.</p>
                <p className="text-xs text-slate-300">Registra lecturas con valores numéricos en el modal "Registrar Lectura".</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Media (x̄)', value: mean.toFixed(3), sub: 'Valor de referencia central', color: 'indigo' },
                    { label: 'SD (σ)', value: sd.toFixed(3), sub: '±1 Desviación Estándar', color: 'blue' },
                    { label: 'CV (%)', value: `${stats.cv}%`, sub: stats.cv <= 5 ? '✓ Aceptable (≤5%)' : '⚠ Revisar (>5%)', color: stats.cv <= 5 ? 'emerald' : 'amber' },
                    { label: 'N Lecturas', value: stats.n, sub: selectedParam || 'Todos los parámetros', color: 'slate' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                        <div className={`text-[10px] font-black uppercase tracking-wider text-${kpi.color}-600 mb-1`}>{kpi.label}</div>
                        <div className={`text-2xl font-black font-mono text-${kpi.color}-800`}>{kpi.value}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.sub}</div>
                    </div>
                ))}
            </div>

            {/* Banner Westgard */}
            <div className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold ${s.cls}`}>
                <div className="flex items-center gap-2">{s.icon} Estado Westgard: <strong>{s.label}</strong></div>
                {westgard.violations.length > 0 && (
                    <span className="text-xs opacity-80 font-bold">
                        {westgard.violations.length} regla(s): {[...new Set(westgard.violations.map(v => v.rule))].join(', ')}
                    </span>
                )}
            </div>

            {/* Gráfico */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-600" />
                        Gráfico de Levey-Jennings
                        {selectedParam && (
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{selectedParam}</span>
                        )}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">ISO 15189 · CLSI EP15-A3</span>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                        <YAxis domain={yDomain} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(1)} width={52} />
                        <Tooltip content={<CustomTooltip mean={mean} sd={sd} />} />

                        {/* Bandas de color de fondo via SVG rect — simuladas con ReferenceLine */}
                        {sd > 0 && [
                            { y: mean + 3 * sd, color: '#dc2626', width: 2, dash: '5 3', lbl: '+3SD' },
                            { y: mean + 2 * sd, color: '#f59e0b', width: 1.5, dash: '4 3', lbl: '+2SD' },
                            { y: mean + sd,     color: '#22c55e', width: 1,   dash: '4 3', lbl: '+1SD' },
                            { y: mean,          color: '#3b82f6', width: 2.5, dash: '0',   lbl: 'x̄' },
                            { y: mean - sd,     color: '#22c55e', width: 1,   dash: '4 3', lbl: '-1SD' },
                            { y: mean - 2 * sd, color: '#f59e0b', width: 1.5, dash: '4 3', lbl: '-2SD' },
                            { y: mean - 3 * sd, color: '#dc2626', width: 2,   dash: '5 3', lbl: '-3SD' },
                        ].map(ref => (
                            <ReferenceLine
                                key={ref.lbl}
                                y={ref.y}
                                stroke={ref.color}
                                strokeWidth={ref.width}
                                strokeDasharray={ref.dash}
                                label={{ value: ref.lbl, position: 'insideLeft', fontSize: 9, fill: ref.color, fontWeight: 'bold', dy: -4 }}
                            />
                        ))}

                        <Line
                            name="Valor QC"
                            type="monotone"
                            dataKey="value"
                            stroke="#4f46e5"
                            strokeWidth={2.5}
                            dot={<QCDot mean={mean} sd={sd} />}
                            activeDot={{ r: 10, fill: '#4f46e5', stroke: 'white', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>

                {/* Leyenda zonas */}
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100 justify-center text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-blue-500 rounded"></span> x̄ Media</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-green-400 rounded border-dashed"></span> ±1SD (Normal)</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-amber-400 rounded border-dashed"></span> ±2SD (Advertencia)</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-red-500 rounded border-dashed"></span> ±3SD (Rechazo)</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-indigo-600"></span> Normal</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span> &gt;2SD</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-600"></span> &gt;3SD</span>
                </div>
            </div>

            {/* Tabla de violaciones */}
            {westgard.violations.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-800 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-400" />
                        Violaciones Westgard Detectadas ({westgard.violations.length})
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {westgard.violations.map((v, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                                <div className="flex items-center gap-3">
                                    <span className={`font-black font-mono px-2 py-0.5 rounded text-[10px] border ${v.severity === 'REJECT' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                        {v.rule}
                                    </span>
                                    <span className="text-slate-600">{v.msg}</span>
                                </div>
                                <span className={`font-black text-[10px] ${v.severity === 'REJECT' ? 'text-red-600' : 'text-amber-600'}`}>
                                    {v.severity === 'REJECT' ? 'RECHAZO' : 'ADVERTENCIA'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
