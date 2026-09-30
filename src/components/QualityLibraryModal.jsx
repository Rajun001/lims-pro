import React, { useState } from 'react';
import { X, Award, ShieldCheck, FileText, CheckCircle2, Building, Scale, BookOpen, ExternalLink, Copy, Check } from 'lucide-react';

export const QualityLibraryModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('legal');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const complianceSummaryText = `LABORATORIO MICROLABS QUÍMICOS S.A. (Cédula Jurídica: 3-101-144450)
Sede Central: 75m Norte del Correo de Guadalupe, San José, Costa Rica.
Central Telefónica: (506) 2234-8837 | 2234-5862 | 2224-6541 | WhatsApp: +506 7138-2750
Correo de Resultados: resultados@microlabscr.com | Web: www.microlabscr.com

MARCO LEGAL, HABILITACIÓN Y SISTEMA DE CALIDAD:
• Permiso Sanitario de Funcionamiento del Ministerio de Salud (Dirección de Regulación de la Salud)
• Certificado Veterinario de Operación (CVO) MAG / SENASA para análisis de inocuidad microbiológica
• Registro Oficial del Colegio de Microbiólogos y Químicos Clínicos de Costa Rica
• Gestión de la Calidad y Competencia Técnica conforme a las Normas ISO/IEC 17025:2017 e ISO 15189:2022
• Participación en Programas Internacionales y Nacionales de Ensayos de Aptitud: AOAC LPTP (USA), INCIENSA y SAEC
• Métodos Analíticos Normalizados: SMEWW (Standard Methods), FDA BAM, AOAC International y RTCA.`;

    const handleCopySummary = () => {
        navigator.clipboard.writeText(complianceSummaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Award className="text-amber-400" size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-base tracking-wide flex items-center gap-2">
                                Sistema de Gestión de Calidad & Acreditaciones
                                <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40">Oficial</span>
                            </h3>
                            <p className="text-xs text-blue-200/90 font-medium">Microlabs Químicos S.A. • Cédula Jurídica: 3-101-144450</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
                    <button
                        onClick={() => setActiveTab('legal')}
                        className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'legal'
                                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Building size={14} /> Habilitación Legal & Registros
                    </button>
                    <button
                        onClick={() => setActiveTab('proficiency')}
                        className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'proficiency'
                                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <ShieldCheck size={14} /> Ensayos de Aptitud (AOAC / INCIENSA)
                    </button>
                    <button
                        onClick={() => setActiveTab('methods')}
                        className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'methods'
                                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Scale size={14} /> Normativa & Criterios RTCA
                    </button>
                    <button
                        onClick={() => setActiveTab('poes')}
                        className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'poes'
                                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <BookOpen size={14} /> Procedimientos POE
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-700 text-xs">
                    {activeTab === 'legal' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-sm">
                                        <Building size={16} /> Personería Jurídica
                                    </div>
                                    <div className="space-y-1 text-slate-600">
                                        <p><strong className="text-slate-800">Razón Social:</strong> Microlabs Químicos S.A.</p>
                                        <p><strong className="text-slate-800">Cédula Jurídica:</strong> 3-101-144450</p>
                                        <p><strong className="text-slate-800">Dirección Sede:</strong> 75m Norte del Correo de Guadalupe, Goicoechea, San José, Costa Rica</p>
                                        <p><strong className="text-slate-800">Regente Responsable:</strong> Dr. Roldán Ajún Jiménez (Código Profesional MQC 1121)</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                                        <CheckCircle2 size={16} /> Licencias & Permisos Estatales
                                    </div>
                                    <div className="space-y-1 text-slate-600">
                                        <p><strong className="text-slate-800">Ministerio de Salud:</strong> Permiso Sanitario de Funcionamiento Vigente (Área de Salud Goicoechea)</p>
                                        <p><strong className="text-slate-800">MAG / SENASA:</strong> CVO (Certificado Veterinario de Operación) para Ensayos Microbiológicos en Alimentos y Aguas</p>
                                        <p><strong className="text-slate-800">Colegio Profesional:</strong> Incorporación Oficial Colegio de Microbiólogos y Químicos Clínicos de Costa Rica</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                                <h4 className="font-extrabold text-blue-900 mb-1 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-blue-700" />
                                    Alcance de los Servicios Analíticos
                                </h4>
                                <p className="text-blue-800 leading-relaxed">
                                    Microlabs Químicos S.A. opera con doble competencia técnica: laboratorio clínico bioanalítico para diagnóstico de salud humana (ISO 15189) y laboratorio de microbiología y fisicoquímica industrial para aseguramiento de calidad de alimentos procesados, aguas de consumo, hielo, superficies y ambientes de manufactura (ISO/IEC 17025).
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'proficiency' && (
                        <div className="space-y-4">
                            <p className="text-slate-600">
                                Conforme a los requisitos de aseguramiento de la validez de los resultados (cláusula 7.7 de ISO/IEC 17025:2017), el laboratorio participa activamente en rondas de evaluación externa de la calidad:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="font-extrabold text-slate-900 mb-1 flex items-center gap-1.5">
                                        <Award size={15} className="text-amber-500" /> AOAC LPTP
                                    </div>
                                    <p className="text-[11px] text-slate-600">
                                        <em>AOAC International Proficiency Testing Program</em> (EE.UU.). Evaluación periódica interlaboratorial para matrices de alimentos cárnicos, lácteos, aguas y detección de patógenos (Salmonella, Listeria).
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="font-extrabold text-slate-900 mb-1 flex items-center gap-1.5">
                                        <Award size={15} className="text-indigo-500" /> INCIENSA
                                    </div>
                                    <p className="text-[11px] text-slate-600">
                                        Instituto Costarricense de Investigación y Enseñanza en Nutrición y Salud. Control de calidad externo en microbiología de aguas y alimentos conforme a directrices del Ministerio de Salud.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="font-extrabold text-slate-900 mb-1 flex items-center gap-1.5">
                                        <Award size={15} className="text-emerald-500" /> SAEC
                                    </div>
                                    <p className="text-[11px] text-slate-600">
                                        Sistema de Aseguramiento Externo de la Calidad del Colegio de Microbiólogos y Químicos Clínicos de Costa Rica. Ensayos de aptitud en hematología, química clínica y bioanálisis.
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                                <strong>Trazabilidad Metrológica:</strong> Los patrones de masa (pesas clase F1/M1), termómetros digitales y patrones buffer de pH cuentan con certificados de calibración emitidos por laboratorios acreditados ante ECA o signatarios del acuerdo ILAC-MRA.
                            </div>
                        </div>
                    )}

                    {activeTab === 'methods' && (
                        <div className="space-y-4">
                            <p className="text-slate-600">
                                Normativa centroamericana, reglamentos técnicos y compendios internacionales aplicados en los informes de análisis:
                            </p>

                            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                                <div className="p-3 bg-slate-50 flex items-start justify-between">
                                    <div>
                                        <div className="font-extrabold text-slate-900">RTCA 67.04.50:08</div>
                                        <div className="text-[11px] text-slate-600">Reglamento Técnico Centroamericano: Alimentos Criterios Microbiológicos de Inocuidad para su Comercialización.</div>
                                    </div>
                                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">Oficial Centroamérica</span>
                                </div>

                                <div className="p-3 bg-white flex items-start justify-between">
                                    <div>
                                        <div className="font-extrabold text-slate-900">Decreto Ejecutivo N° 38924-S</div>
                                        <div className="text-[11px] text-slate-600">Reglamento para la Calidad del Agua Potable de Costa Rica (Límites Máximos Admisibles Nivel 1 y Nivel 2).</div>
                                    </div>
                                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Decreto Nacional CR</span>
                                </div>

                                <div className="p-3 bg-slate-50 flex items-start justify-between">
                                    <div>
                                        <div className="font-extrabold text-slate-900">Standard Methods (SMEWW 23rd / 24th Ed.)</div>
                                        <div className="text-[11px] text-slate-600">APHA-AWWA-WEF: Métodos estándar para recuento heterotrófico (9215), coliformes (9221/9223) y pseudomonas.</div>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded">APHA Standard</span>
                                </div>

                                <div className="p-3 bg-white flex items-start justify-between">
                                    <div>
                                        <div className="font-extrabold text-slate-900">FDA BAM (Bacteriological Analytical Manual)</div>
                                        <div className="text-[11px] text-slate-600">Métodos oficiales de referencia para patógenos en alimentos (Salmonella, Listeria monocytogenes, E. coli).</div>
                                    </div>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">FDA USA</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'poes' && (
                        <div className="space-y-4">
                            <p className="text-slate-600">
                                Procedimientos Operativos Estandarizados (POEs) institucionales del Manual de Calidad de Microlabs Químicos S.A.:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="font-bold text-slate-900 mb-0.5">POE-MIC-01</div>
                                    <div className="text-[11px] text-slate-600">Preparación de muestras para análisis microbiológico, pesada analítica estéril y homogenización Stomacher (dilución 10⁻¹).</div>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="font-bold text-slate-900 mb-0.5">POE-MIC-02</div>
                                    <div className="text-[11px] text-slate-600">Recuento de bacterias aerobias mesófilas viables en placa de agar Standard Methods a 35°C ± 1°C durante 48 horas.</div>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="font-bold text-slate-900 mb-0.5">POE-MIC-03</div>
                                    <div className="text-[11px] text-slate-600">Detección molecular y confirmación rápida de patógenos por tecnología 3M Molecular Detection System (MDS).</div>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="font-bold text-slate-900 mb-0.5">POE-CAL-01</div>
                                    <div className="text-[11px] text-slate-600">Calibración metrológica y verificación diaria de temperatura en incubadoras Memmert, refrigeradores y baños termostáticos.</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                    <button
                        onClick={handleCopySummary}
                        className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copied ? '¡Copiado al Portapapeles!' : 'Copiar Texto Institucional'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
                    >
                        Cerrar Biblioteca
                    </button>
                </div>
            </div>
        </div>
    );
};
