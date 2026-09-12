import React from 'react';
import { Keyboard, X, Command, Sparkles } from 'lucide-react';

export const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcutCategories = [
        {
            title: 'Búsqueda & Navegación Global',
            items: [
                { keys: ['Ctrl', 'K'], altKeys: ['Cmd', 'K'], desc: 'Abrir Paleta de Comandos y buscador instantáneo de muestras' },
                { keys: ['Alt', 'H'], desc: 'Ir al Panel General (Inicio)' },
                { keys: ['Alt', 'D'], desc: 'Ir al Listado de Órdenes (Dashboard)' },
                { keys: ['?'], desc: 'Mostrar esta ventana de atajos de teclado' },
                { keys: ['Esc'], desc: 'Cerrar ventanas modales o paneles abiertos' }
            ]
        },
        {
            title: 'Ingreso & Recepción de Muestras',
            items: [
                { keys: ['Alt', 'N'], desc: 'Crear nuevo paciente clínico' },
                { keys: ['Alt', 'I'], desc: 'Crear nueva muestra industrial (Aguas / Alimentos)' },
                { keys: ['Alt', 'M'], desc: 'Carga masiva de muestras (Excel / CSV)' }
            ]
        },
        {
            title: 'Laboratorio & Resultados',
            items: [
                { keys: ['Alt', 'R'], desc: 'Ir a Hojas de Trabajo e Ingreso de Resultados' },
                { keys: ['Alt', 'Q'], desc: 'Ir a Control de Calidad (QC) y Aprobación' },
                { keys: ['Enter'], desc: 'En ingreso de analitos: avanzar inmediatamente al siguiente ensayo' },
                { keys: ['↑', '↓'], desc: 'Navegar entre filas de resultados o muestras' }
            ]
        },
        {
            title: 'Gestión & Facturación',
            items: [
                { keys: ['Alt', 'B'], desc: 'Ir a Envíos por WhatsApp, Reportes & Facturación' },
                { keys: ['Alt', 'C'], desc: 'Ir a Cotizaciones y Tarifas' }
            ]
        }
    ];

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                            <Keyboard size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-base">Atajos de Teclado del Sistema</h3>
                            <p className="text-xs text-slate-500">Agiliza tu operación diaria sin depender del ratón</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {shortcutCategories.map((cat, idx) => (
                        <div key={idx} className="space-y-2.5">
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                {cat.title}
                            </h4>
                            <div className="space-y-2 bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                                {cat.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center justify-between text-xs py-1">
                                        <span className="text-slate-600 font-medium pr-4">{item.desc}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {item.keys.map((k, kIdx) => (
                                                <React.Fragment key={kIdx}>
                                                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-md font-mono text-[11px] font-bold text-slate-700 shadow-2xs">
                                                        {k}
                                                    </kbd>
                                                    {kIdx < item.keys.length - 1 && <span className="text-slate-400 text-[10px]">+</span>}
                                                </React.Fragment>
                                            ))}
                                            {item.altKeys && (
                                                <span className="text-[10px] text-slate-400 ml-1">/ ⌘K</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                        <Sparkles size={14} /> Tip: Presiona '?' en cualquier pantalla para abrir esta guía
                    </span>
                    <button 
                        onClick={onClose}
                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
