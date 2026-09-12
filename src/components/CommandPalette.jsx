import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Search, PlusCircle, FileText, UserPlus, Building2, Microscope, 
    Activity, Send, CheckCircle2, ShieldAlert, Package, Calculator, 
    SlidersHorizontal, ArrowRight, CornerDownLeft, X, Clock, AlertCircle,
    FileSpreadsheet, HelpCircle, Layers, FlaskConical, Hash
} from 'lucide-react';

export const CommandPalette = ({ isOpen, onClose, navigateTo, requests = [] }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Fast static actions
    const quickActions = useMemo(() => [
        {
            id: 'action-new-clinical',
            title: 'Nuevo Paciente (Clínico)',
            subtitle: 'Ingreso rápido de orden ambulatoria o particular',
            category: 'Acciones Rápidas',
            icon: UserPlus,
            color: 'text-sky-500 bg-sky-50',
            action: () => navigateTo('new_request', null, { mode: 'clinical' })
        },
        {
            id: 'action-new-industrial',
            title: 'Nueva Muestra (Industrial / Aguas / Alimentos)',
            subtitle: 'Registro de matriz, lote y planta',
            category: 'Acciones Rápidas',
            icon: Building2,
            color: 'text-amber-500 bg-amber-50',
            action: () => navigateTo('new_request', null, { mode: 'industrial' })
        },
        {
            id: 'action-bulk-upload',
            title: 'Carga Masiva de Muestras (Excel / CSV)',
            subtitle: 'Importar múltiples órdenes desde archivo',
            category: 'Acciones Rápidas',
            icon: FileSpreadsheet,
            color: 'text-emerald-500 bg-emerald-50',
            action: () => navigateTo('bulk_upload')
        },
        {
            id: 'action-workcards',
            title: 'Hojas de Trabajo & Ensayos',
            subtitle: 'Ingreso de resultados y lecturas de cultivo',
            category: 'Laboratorio',
            icon: Microscope,
            color: 'text-indigo-500 bg-indigo-50',
            action: () => navigateTo('results_review')
        },
        {
            id: 'action-qc',
            title: 'Control de Calidad (QC) & Validación',
            subtitle: 'Aprobación técnica y firma de informes',
            category: 'Laboratorio',
            icon: CheckCircle2,
            color: 'text-purple-500 bg-purple-50',
            action: () => navigateTo('qc')
        },
        {
            id: 'action-billing',
            title: 'Envíos & Facturación',
            subtitle: 'Entrega por WhatsApp, correo y cobros',
            category: 'Gestión',
            icon: Send,
            color: 'text-rose-500 bg-rose-50',
            action: () => navigateTo('billing')
        },
        {
            id: 'action-quotes',
            title: 'Cotizaciones & Tarifas',
            subtitle: 'Generación de proformas y descuentos',
            category: 'Gestión',
            icon: Calculator,
            color: 'text-teal-500 bg-teal-50',
            action: () => navigateTo('quotes')
        },
        {
            id: 'action-help',
            title: 'Guías del Sistema y Soporte',
            subtitle: 'Manual operativo y procedimientos',
            category: 'Sistema',
            icon: HelpCircle,
            color: 'text-slate-500 bg-slate-100',
            action: () => navigateTo('help')
        }
    ], [navigateTo]);

    // Matching samples from requests
    const matchingRequests = useMemo(() => {
        if (!query.trim()) {
            // Show the 4 most recent requests
            return (requests || []).slice(0, 4).map(req => ({
                id: `req-${req.id}`,
                title: req.id,
                subtitle: `${req.clientName || 'Sin Nombre'} • ${req.analysisRequested || 'Análisis general'}`,
                category: 'Muestras Recientes',
                status: req.status || 'Pendiente',
                isStat: req.priority === 'Urgente' || req.isUrgente,
                icon: FlaskConical,
                color: 'text-blue-600 bg-blue-50',
                action: () => navigateTo('request_details', req.id)
            }));
        }

        const q = query.toLowerCase().trim();
        return (requests || [])
            .filter(r => {
                const id = (r.id || '').toLowerCase();
                const client = (r.clientName || '').toLowerCase();
                const analysis = (r.analysisRequested || '').toLowerCase();
                const sampleType = (r.sampleType || '').toLowerCase();
                return id.includes(q) || client.includes(q) || analysis.includes(q) || sampleType.includes(q);
            })
            .slice(0, 8)
            .map(req => ({
                id: `req-${req.id}`,
                title: req.id,
                subtitle: `${req.clientName || 'Sin Nombre'} • ${req.analysisRequested || 'Análisis general'}`,
                category: 'Muestras Encontradas',
                status: req.status || 'Pendiente',
                isStat: req.priority === 'Urgente' || req.isUrgente,
                icon: FlaskConical,
                color: 'text-blue-600 bg-blue-50',
                action: () => navigateTo('request_details', req.id)
            }));
    }, [requests, query, navigateTo]);

    // Matching actions
    const matchingActions = useMemo(() => {
        if (!query.trim()) return quickActions;
        const q = query.toLowerCase().trim();
        return quickActions.filter(a => 
            a.title.toLowerCase().includes(q) || 
            a.subtitle.toLowerCase().includes(q) || 
            a.category.toLowerCase().includes(q)
        );
    }, [quickActions, query]);

    // Combined results
    const allResults = useMemo(() => {
        return [...matchingRequests, ...matchingActions];
    }, [matchingRequests, matchingActions]);

    // Keep selected index within bounds
    useEffect(() => {
        const timer = setTimeout(() => setSelectedIndex(0), 0);
        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation within palette
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResults.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (allResults[selectedIndex]) {
                allResults[selectedIndex].action();
                onClose();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input Bar */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
                    <Search className="text-slate-400 shrink-0" size={20} />
                    <input 
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar muestra (ej. MC-2026-001), paciente, ensayo o comando..."
                        className="w-full bg-transparent border-0 text-slate-800 placeholder-slate-400 text-sm sm:text-base focus:ring-0 focus:outline-none"
                    />
                    {query ? (
                        <button 
                            onClick={() => setQuery('')}
                            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    ) : (
                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded border border-slate-300">
                            <span>ESC para salir</span>
                        </div>
                    )}
                </div>

                {/* Results List */}
                <div 
                    ref={listRef} 
                    className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-slate-100 custom-scrollbar"
                >
                    {allResults.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <AlertCircle className="mx-auto mb-2 text-slate-300" size={32} />
                            <p className="text-sm font-medium text-slate-600">No se encontraron coincidencias para "{query}"</p>
                            <p className="text-xs text-slate-400 mt-1">Verifica el número de orden o prueba buscando por nombre de cliente.</p>
                        </div>
                    ) : (
                        <>
                            {/* Group matching samples */}
                            {matchingRequests.length > 0 && (
                                <div className="pt-1 pb-2">
                                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                        {query.trim() ? 'Muestras Coincidentes' : 'Muestras Recientes'}
                                    </div>
                                    {matchingRequests.map((item, idx) => {
                                        const globalIdx = idx;
                                        const isSelected = selectedIndex === globalIdx;
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => { item.action(); onClose(); }}
                                                onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                                                    isSelected ? 'bg-indigo-50 border border-indigo-200/80 shadow-xs' : 'hover:bg-slate-50 border border-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2 rounded-lg ${item.color} shrink-0`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div className="truncate">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-xs sm:text-sm text-slate-800 font-mono">
                                                                {item.title}
                                                            </span>
                                                            {item.isStat && (
                                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                                                    URGENTE
                                                                </span>
                                                            )}
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                                item.status === 'Completado' ? 'bg-emerald-100 text-emerald-700' :
                                                                item.status === 'En Proceso' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pl-2 shrink-0">
                                                    <span className="text-xs text-indigo-600 font-semibold hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Abrir
                                                    </span>
                                                    <ArrowRight size={14} className={isSelected ? 'text-indigo-600 translate-x-0.5 transition-transform' : 'text-slate-300'} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Group matching actions */}
                            {matchingActions.length > 0 && (
                                <div className="pt-2 pb-1">
                                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                        Acciones & Módulos
                                    </div>
                                    {matchingActions.map((item, idx) => {
                                        const globalIdx = matchingRequests.length + idx;
                                        const isSelected = selectedIndex === globalIdx;
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => { item.action(); onClose(); }}
                                                onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                                                    isSelected ? 'bg-indigo-50 border border-indigo-200/80 shadow-xs' : 'hover:bg-slate-50 border border-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2 rounded-lg ${item.color} shrink-0`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="font-bold text-xs sm:text-sm text-slate-800 block">
                                                            {item.title}
                                                        </span>
                                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <CornerDownLeft size={13} className={isSelected ? 'text-indigo-600' : 'text-slate-300'} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer hints */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">↓</kbd>
                            Navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">↵</kbd>
                            Seleccionar
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">ESC</kbd>
                            Cerrar
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        LIMS Agilidad 3.8
                    </span>
                </div>
            </div>
        </div>
    );
};
