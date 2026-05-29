import React, { useState } from 'react';
import { Map, MapPin, AlertTriangle, CheckCircle2, Factory, Search, Filter, Calculator as CalcIcon } from 'lucide-react';
import { AirSamplerCalculator } from '../components/AirSamplerCalculator';

const MOCK_POINTS = [
    { id: 'P01', x: 200, y: 150, name: 'Mesa de Corte (Acero)', zone: 'Zona 1 (Contacto Directo)', status: 'clean', lastTest: 'Aprobado (<10 UFC)', date: '2026-05-23', pathogen: 'Ausencia Listeria' },
    { id: 'P02', x: 350, y: 180, name: 'Banda Transportadora A', zone: 'Zona 1 (Contacto Directo)', status: 'alert', lastTest: 'Positivo (Sospechoso)', date: '2026-05-23', pathogen: 'Presencia Listeria spp.' },
    { id: 'P03', x: 150, y: 350, name: 'Lavamanos Operarios', zone: 'Zona 3 (No Contacto)', status: 'clean', lastTest: 'Aprobado', date: '2026-05-20', pathogen: 'Coliformes Totales' },
    { id: 'P04', x: 500, y: 200, name: 'Empacadora al Vacío', zone: 'Zona 1 (Contacto Directo)', status: 'clean', lastTest: 'Aprobado', date: '2026-05-22', pathogen: 'Salmonella' },
    { id: 'P05', x: 650, y: 400, name: 'Drenaje Principal Almacén', zone: 'Zona 4 (Área Externa)', status: 'alert', lastTest: 'Fuera de Límite', date: '2026-05-21', pathogen: 'Listeria monocytogenes' },
    { id: 'P06', x: 400, y: 450, name: 'Pared Zona Fría', zone: 'Zona 2 (Proximidad)', status: 'clean', lastTest: 'Aprobado', date: '2026-05-21', pathogen: 'Mohos y Levaduras' }
];

export const EnvironmentalMonitoring = () => {
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [filterZone, setFilterZone] = useState('all');

    const filteredPoints = MOCK_POINTS.filter(p => filterZone === 'all' || p.zone.includes(filterZone));

    return (
        <div className="flex flex-col h-[85vh] animate-fade-in pb-8">
            <div className="mb-6 flex justify-between items-end shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Factory className="text-emerald-600" /> Monitoreo Ambiental (EMP)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Mapeo interactivo de patógenos en planta y análisis de tendencias espaciales.</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        value={filterZone} 
                        onChange={(e) => setFilterZone(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                        <option value="all">Todas las Zonas</option>
                        <option value="Zona 1">Zona 1 (Contacto Directo)</option>
                        <option value="Zona 2">Zona 2 (Proximidad)</option>
                        <option value="Zona 3">Zona 3 (No Contacto)</option>
                        <option value="Zona 4">Zona 4 (Áreas Externas)</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Mapa Interactivo */}
                <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <Map size={16} /> Plano de Producción (Demo)
                        </h3>
                        <div className="flex gap-4 text-[10px] font-bold uppercase">
                            <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Limpio</span>
                            <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500"></span> Alerta / Positivo</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative bg-slate-100 overflow-auto flex items-center justify-center p-4">
                        <div className="relative w-[800px] h-[600px] bg-white border border-slate-300 rounded-xl shadow-inner shrink-0 overflow-hidden">
                            {/* SVG de Planta (Fondo) */}
                            <svg width="100%" height="100%" viewBox="0 0 800 600" className="absolute inset-0">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                                
                                {/* Habitaciones de la Planta */}
                                <rect x="50" y="50" width="350" height="250" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" rx="4" />
                                <text x="60" y="70" className="text-xs font-bold fill-slate-400">Área de Procesamiento Primario</text>
                                
                                <rect x="420" y="50" width="330" height="250" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" rx="4" />
                                <text x="430" y="70" className="text-xs font-bold fill-slate-400">Zona de Empaque al Vacío</text>
                                
                                <rect x="50" y="320" width="400" height="230" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" rx="4" />
                                <text x="60" y="340" className="text-xs font-bold fill-slate-400">Pasillos y Vestidores (Gris)</text>
                                
                                <rect x="470" y="320" width="280" height="230" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" rx="4" />
                                <text x="480" y="340" className="text-xs font-bold fill-slate-400">Almacén de Producto Terminado</text>
                            </svg>

                            {/* Pines Interactivos */}
                            {filteredPoints.map((point) => (
                                <button
                                    key={point.id}
                                    onClick={() => setSelectedPoint(point)}
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${selectedPoint?.id === point.id ? 'scale-125 z-10' : 'hover:scale-110 z-0'}`}
                                    style={{ left: point.x, top: point.y }}
                                >
                                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-md border-2 ${
                                        point.status === 'alert' ? 'bg-red-500 border-red-200 text-white animate-pulse' : 'bg-emerald-500 border-emerald-200 text-white'
                                    }`}>
                                        <MapPin size={16} />
                                        {/* Tooltip Hover */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">
                                            {point.id}: {point.name}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Panel Lateral de Detalles */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[300px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Search size={18} className="text-slate-400" /> Detalles del Punto de Muestreo
                        </h3>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto">
                        {!selectedPoint ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                <MapPin size={48} className="mb-4 text-slate-200" />
                                <p className="font-medium text-sm">Seleccione un pin en el mapa para ver el historial epidemiológico de esa zona.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-1 rounded text-xs border border-slate-200">
                                            {selectedPoint.id}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                                            selectedPoint.status === 'alert' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {selectedPoint.status === 'alert' ? <AlertTriangle size={12}/> : <CheckCircle2 size={12}/>}
                                            {selectedPoint.status === 'alert' ? 'ALERTA ACTIVA' : 'ZONA LIMPIA'}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 leading-tight mt-2">{selectedPoint.name}</h2>
                                    <p className="text-sm font-bold text-slate-500 mt-1">{selectedPoint.zone}</p>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Último Hisopado</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-600">Fecha:</span>
                                            <span className="text-sm font-bold text-slate-800">{selectedPoint.date}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-600">Target Analítico:</span>
                                            <span className="text-sm font-bold text-slate-800 italic">{selectedPoint.pathogen}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                            <span className="text-sm font-medium text-slate-600">Resultado:</span>
                                            <span className={`text-sm font-black ${selectedPoint.status === 'alert' ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {selectedPoint.lastTest}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedPoint.status === 'alert' && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1">
                                            <AlertTriangle size={14} /> Protocolo de Acción Requerido
                                        </h4>
                                        <p className="text-xs text-red-700 font-medium">
                                            Se requiere higienización profunda inmediata de esta superficie y programación de un re-hisopado confirmatorio (Re-Swab) antes de reanudar producción.
                                        </p>
                                        <button className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm">
                                            Generar Orden de Higienización (CAPA)
                                        </button>
                                    </div>
                                )}
                                
                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <CalcIcon size={16} className="text-sky-600" />
                                        Calcular UFC/m³ (Muestreo Activo de Aire)
                                    </h4>
                                    <AirSamplerCalculator />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
