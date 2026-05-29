import React, { useState, useEffect } from 'react';
import { X, Save, User, FlaskConical, Calendar, Stethoscope } from 'lucide-react';
import { ASTMatrix } from './ASTMatrix';
import { FormInput, StatusBadge } from './UI';

export const WorkcardDetail = ({ isOpen, onClose, request, onSave }) => {
    // Parse media state safely
    const initialMedia = request?.media ? (typeof request.media === 'string' ? JSON.parse(request.media) : request.media) : {
        agarSangre: false,
        macConkey: false,
        sabouraud: false,
        caldoBHI: false
    };

    const [media, setMedia] = useState(initialMedia);
    
    const [readings, setReadings] = useState({
        day1: request?.readDay1 || '',
        day2: request?.readDay2 || '',
        day3: request?.readDay3 || ''
    });

    const [astData, setAstData] = useState({ 
        pathogen: request?.antibiogram?.bacteriaIdentified || '', 
        antibiotics: request?.antibiogram?.jsonResults ? JSON.parse(request.antibiogram.jsonResults) : [] 
    });

    // Reset state when request changes
    useEffect(() => {
        if (request) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMedia(request.media ? (typeof request.media === 'string' ? JSON.parse(request.media) : request.media) : {
                agarSangre: false, macConkey: false, sabouraud: false, caldoBHI: false
            });
             
            setReadings({
                day1: request.readDay1 || '',
                day2: request.readDay2 || '',
                day3: request.readDay3 || ''
            });
             
            setAstData({
                pathogen: request.antibiogram?.bacteriaIdentified || '',
                antibiotics: request.antibiogram?.jsonResults ? JSON.parse(request.antibiogram.jsonResults) : []
            });
        }
    }, [request]);

    if (!isOpen || !request) return null;

    const handleSave = () => {
        if (onSave) onSave({ media, readings, antibiogram: astData });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-extrabold text-slate-800">
                                Workcard: {request.id.substring(0,8).toUpperCase()}
                            </h2>
                            <StatusBadge status={request.status || 'En Proceso'} />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{request.analysisRequested}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-white text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors shadow-sm border border-slate-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                    
                    {/* Resumen Clínico */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User size={20} /></div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Paciente</p>
                                <p className="font-semibold text-slate-800">{request.clientName}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><FlaskConical size={20} /></div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tipo Muestra</p>
                                <p className="font-semibold text-slate-800">{request.sampleType || 'No especificado'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Calendar size={20} /></div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Fecha Recepción</p>
                                <p className="font-semibold text-slate-800">{request.date ? new Date(request.date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Stethoscope size={20} /></div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Médico</p>
                                <p className="font-semibold text-slate-800">Dr. Asignado</p>
                            </div>
                        </div>
                    </div>

                    {/* Medios de Cultivo */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Medios Inoculados</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(media).map((m) => (
                                <label key={m} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={media[m]} 
                                        onChange={() => setMedia({...media, [m]: !media[m]})}
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                                    />
                                    <span className="font-medium text-slate-700 capitalize">{m.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Lecturas Diarias */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Lecturas de Incubación</h3>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Día 1 (24h)</label>
                            <textarea 
                                value={readings.day1} onChange={e => setReadings({...readings, day1: e.target.value})}
                                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
                                rows="2" placeholder="Observaciones de crecimiento..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Día 2 (48h)</label>
                            <textarea 
                                value={readings.day2} onChange={e => setReadings({...readings, day2: e.target.value})}
                                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
                                rows="2" placeholder="Morfología de colonias, recuentos..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Día 3 (72h) - Opcional</label>
                            <textarea 
                                value={readings.day3} onChange={e => setReadings({...readings, day3: e.target.value})}
                                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
                                rows="2" placeholder="Desarrollo tardío, hongos..."
                            />
                        </div>
                    </div>

                    {/* Antibiograma (AST) Component */}
                    <ASTMatrix 
                        savedResults={request.antibiogram || {}} 
                        onChange={(newAstData) => setAstData(newAstData)}
                    />

                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                    >
                        <Save size={18} /> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};
