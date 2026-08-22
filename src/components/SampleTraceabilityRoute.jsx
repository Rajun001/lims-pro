import React, { useState } from 'react';
import { 
    CheckCircle2, Clock, PlayCircle, ShieldCheck, Send, 
    Microscope, FlaskConical, Inbox, ChevronRight, User, 
    Calendar, MapPin, AlertCircle, Info, Sparkles, FileText
} from 'lucide-react';

export const SampleTraceabilityRoute = ({ request, compact = false, _onNavigateAction }) => {
    const [selectedStepIndex, setSelectedStepIndex] = useState(null);

    if (!request) return null;

    // Determinar la etapa actual de acuerdo al estado y datos de la solicitud
    const getActiveStepIndex = () => {
        const status = request.status || 'Pendiente';
        if (status === 'Completado') return 4; // Emisión y Envío
        if (status === 'Pendiente Aprobación' || status === 'Pendiente Revisión') return 3; // Validación Técnica
        if (status === 'Pendiente Lectura' || status === 'En Proceso') {
            const hasResults = request.analyzerResults && request.analyzerResults.some(r => r.value && r.value.trim() !== '');
            return hasResults ? 2 : 1; // 2: Ensayo/Lectura, 1: Siembra/Preparación
        }
        return 0; // Recepción e Ingreso
    };

    const activeIndex = getActiveStepIndex();

    // Fechas calculadas o reales
    const reqDate = request.requestDate ? new Date(request.requestDate) : new Date();
    const formattedReqDate = reqDate.toLocaleDateString() + ' ' + reqDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const platingDate = request.platingDate || request.setupDate;
    const formattedPlatingDate = platingDate ? new Date(platingDate).toLocaleDateString() : 'Procesado en turno';

    const completionDate = request.completedDate || (request.status === 'Completado' ? formattedReqDate : null);

    const isIndustrial = request.clientType?.toLowerCase().includes('industria') || 
                         request.sampleType?.toLowerCase().includes('alimento') || 
                         request.sampleType?.toLowerCase().includes('agua');

    const steps = [
        {
            id: 'reception',
            number: '1',
            title: 'Recepción & Registro',
            subtitle: 'Custodia Inicial',
            icon: Inbox,
            description: 'Muestra ingresada, rotulada con código único y registrada en el sistema LIMS.',
            responsible: request.registeredBy || 'Recepción de Muestras',
            location: request.currentLocation || 'Ventanilla Principal',
            timestamp: formattedReqDate,
            details: [
                `ID Muestra: #${request.id?.substring(0, 8).toUpperCase()}`,
                `Matriz: ${request.sampleType || request.clientType || 'General'}`,
                `Temperatura Recepción: ${request.receptionTemp ? `${request.receptionTemp} °C` : 'Conforme (4-8°C)'}`
            ]
        },
        {
            id: 'setup',
            number: '2',
            title: isIndustrial ? 'Siembra & Montaje' : 'Preparación de Muestra',
            subtitle: 'Inoculación / Alícuota',
            icon: FlaskConical,
            description: isIndustrial 
                ? 'Siembra en medios de cultivo específicos según método normalizado (SMEWW / BAM FDA).'
                : 'Centrifugación, separación de suero o preparación de alícuotas para ensayos.',
            responsible: request.analystName || request.currentCustodian || 'Analista de Turno',
            location: 'Laboratorio de Microbiología / Química',
            timestamp: formattedPlatingDate,
            details: [
                `Análisis: ${request.analysisRequested || 'Perfil Solicitado'}`,
                `Método: ${request.methodName || (isIndustrial ? 'Filtración de Membrana / NMP' : 'Automatizado / Manual')}`,
                `Custodio actual: ${request.currentCustodian || 'Área Analítica'}`
            ]
        },
        {
            id: 'testing',
            number: '3',
            title: 'Incubación & Ensayos',
            subtitle: 'Lectura Analítica',
            icon: Microscope,
            description: isIndustrial
                ? 'Incubación en termostato y recuento de UFC / confirmación de tubos positivos.'
                : 'Lectura en analizadores automatizados o microscopía de sedimentos.',
            responsible: 'Área Microbiológica / Bioquímica',
            location: 'Incubadoras (35°C / 44.5°C) & Equipos',
            timestamp: activeIndex >= 2 ? 'En curso / Finalizado' : 'Pendiente de turno',
            details: [
                `Parámetros evaluados: ${request.analyzerResults?.length || 1} prueba(s)`,
                `Estado de lectura: ${request.status === 'Pendiente Lectura' ? 'Incubándose' : (activeIndex >= 2 ? 'Resultados capturados' : 'En cola')}`,
                `Equipos vinculados: ${request.analyzerInboxId ? 'Analizador Conectado' : 'Procesamiento Manual'}`
            ]
        },
        {
            id: 'validation',
            number: '4',
            title: 'Validación Técnica',
            subtitle: 'Revisión Facultativa',
            icon: ShieldCheck,
            description: 'Verificación de controles de calidad (QC), correlación analítica y firma por el Microbiólogo Regente.',
            responsible: request.signedByName || 'Dr. Roldan Ajún Chaverri (Reg. 802)',
            location: 'Dirección Técnica & Calidad',
            timestamp: request.status === 'Completado' ? (completionDate || 'Validado') : (activeIndex === 3 ? 'En revisión' : 'Pendiente'),
            details: [
                `Criterio Microbiológico: ${isIndustrial ? 'Normativa RTCR / APHA' : 'Rangos de Referencia Clínicos'}`,
                `Firma Digital: ${request.signedByName ? 'Firmado Electrónicamente' : 'Pendiente de Liberación'}`,
                `Control de Calidad: Conforme`
            ]
        },
        {
            id: 'issuance',
            number: '5',
            title: 'Emisión & Entrega',
            subtitle: 'Informe Final QR',
            icon: Send,
            description: 'Certificado oficial generado con código QR de verificación, disponible en portal y enviado por correo/WhatsApp.',
            responsible: 'Sistema de Notificaciones LIMS',
            location: 'Portal Web / Correo / WhatsApp',
            timestamp: request.status === 'Completado' ? (completionDate || 'Disponible') : 'Al completar validación',
            details: [
                `Vía de Entrega: ${request.deliveryMethod || 'Correo Electrónico & Portal'}`,
                `Destinatario: ${request.clientName}`,
                `Código de Reporte: OFICIAL`
            ]
        }
    ];

    // Vista compacta para tablas / listas (Dashboard)
    if (compact) {
        const currentStep = steps[activeIndex] || steps[0];
        const percent = ((activeIndex + 1) / steps.length) * 100;
        return (
            <div className="flex flex-col gap-1 min-w-[170px]">
                <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                        {currentStep.title}
                    </span>
                    <span className="text-indigo-600 font-mono font-extrabold">{percent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                            activeIndex === 4 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <span className="text-[9px] text-slate-600 truncate">
                    📍 {currentStep.location}
                </span>
            </div>
        );
    }

    // Vista detallada interactiva completa (RequestDetails / ClientPortal)
    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-750 animate-fade-in space-y-6">
            {/* Cabecera del Tracker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} className="text-amber-400" /> Trazabilidad en Tiempo Real
                        </span>
                        <span className="text-xs font-mono text-slate-300">
                            Orden: <strong className="text-white">#{request.id?.substring(0, 8).toUpperCase()}</strong>
                        </span>
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        <span>Ruta de la Muestra:</span>
                        <span className="text-indigo-300 font-bold">{request.analysisRequested || 'Análisis Microbiológico'}</span>
                    </h3>
                </div>

                <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Etapa Actual</span>
                        <span className="text-xs font-black text-emerald-400">
                            Paso {activeIndex + 1} de 5: {steps[activeIndex]?.title}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-indigo-600/40">
                        {Math.round(((activeIndex + 1) / steps.length) * 100)}%
                    </div>
                </div>
            </div>

            {/* Pipeline / Stepper Horizontal */}
            <div className="relative">
                {/* Línea conectora base */}
                <div className="hidden md:block absolute top-6 left-8 right-8 h-1 bg-slate-700 -z-0">
                    <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-indigo-400 transition-all duration-700"
                        style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Pasos */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                    {steps.map((step, idx) => {
                        const isCompleted = idx < activeIndex;
                        const isCurrent = idx === activeIndex;
                        const _isPending = idx > activeIndex;
                        const isSelected = selectedStepIndex === idx;
                        const Icon = step.icon;

                        return (
                            <div 
                                key={step.id}
                                onClick={() => setSelectedStepIndex(isSelected ? null : idx)}
                                className={`cursor-pointer transition-all duration-200 rounded-xl p-3.5 flex flex-col items-center text-center border ${
                                    isSelected 
                                        ? 'bg-indigo-900/60 border-indigo-400 shadow-lg shadow-indigo-500/20 scale-[1.02]' 
                                        : isCurrent
                                            ? 'bg-slate-800 border-indigo-500/80 shadow-md ring-2 ring-indigo-500/30'
                                            : isCompleted
                                                ? 'bg-slate-800/60 border-emerald-500/40 hover:bg-slate-800'
                                                : 'bg-slate-850/40 border-slate-750 opacity-65 hover:opacity-100 hover:bg-slate-800/40'
                                }`}
                            >
                                {/* Nodo circular */}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 mb-2 shadow-md ${
                                    isCompleted 
                                        ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                                        : isCurrent 
                                            ? 'bg-indigo-600 text-white shadow-indigo-600/40 animate-pulse' 
                                            : 'bg-slate-750 text-slate-400'
                                }`}>
                                    {isCompleted ? (
                                        <CheckCircle2 size={22} className="stroke-[2.5]" />
                                    ) : (
                                        <Icon size={22} className={isCurrent ? 'text-white' : 'text-slate-400'} />
                                    )}
                                </div>

                                {/* Texto de estado */}
                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded mb-1 ${
                                    isCompleted 
                                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40' 
                                        : isCurrent 
                                            ? 'text-indigo-300 bg-indigo-950/80 border border-indigo-700/50' 
                                            : 'text-slate-400 bg-slate-800'
                                }`}>
                                    {isCompleted ? '✓ Completado' : isCurrent ? '⚡ En Proceso' : '⏳ Pendiente'}
                                </span>

                                <h4 className="font-extrabold text-xs text-white leading-tight mt-0.5">
                                    {step.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {step.subtitle}
                                </span>

                                <div className="mt-2 text-[10px] text-indigo-300/80 font-bold flex items-center gap-1">
                                    <span>{isSelected ? 'Ocultar info ▲' : 'Ver detalle ▼'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tarjeta Expandida con Detalle de la Etapa Seleccionada */}
            {selectedStepIndex !== null && (
                <div className="bg-slate-800/90 border border-indigo-500/40 rounded-xl p-5 animate-fade-in shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                                {steps[selectedStepIndex].number}
                            </span>
                            <h4 className="font-extrabold text-sm text-white">
                                Detalle de Trazabilidad: {steps[selectedStepIndex].title} ({steps[selectedStepIndex].subtitle})
                            </h4>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setSelectedStepIndex(null)}
                            className="text-xs text-slate-400 hover:text-white font-bold px-2 py-1 bg-slate-700 rounded-lg cursor-pointer border-0"
                        >
                            ✕ Cerrar
                        </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                        {steps[selectedStepIndex].description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <User size={11} className="text-indigo-400" /> Responsable / Custodio
                            </span>
                            <p className="text-xs font-bold text-slate-200">
                                {steps[selectedStepIndex].responsible}
                            </p>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <MapPin size={11} className="text-emerald-400" /> Estación / Ubicación
                            </span>
                            <p className="text-xs font-bold text-slate-200">
                                {steps[selectedStepIndex].location}
                            </p>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Calendar size={11} className="text-amber-400" /> Registro Cronológico
                            </span>
                            <p className="text-xs font-bold text-slate-200 font-mono">
                                {steps[selectedStepIndex].timestamp}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2">
                        {steps[selectedStepIndex].details.map((item, dIdx) => (
                            <span key={dIdx} className="text-[11px] font-medium bg-slate-900/80 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                                🔹 {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
