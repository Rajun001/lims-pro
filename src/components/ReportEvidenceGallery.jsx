import React, { useState } from 'react';
import { Camera, Plus, ZoomIn, X, Trash2, CheckCircle2, Image as ImageIcon } from 'lucide-react';

import { defaultMicrobiologyEvidence } from '../constants/evidenceData.js';


export const ReportEvidenceGallery = ({ 
    evidenceList = [], 
    onUpdateEvidence, 
    reportLang = 'es',
    readOnly = false,
    reportId = null
}) => {
    const [evidences, setEvidences] = useState(() => {
        if (evidenceList && evidenceList.length > 0) return evidenceList;
        return defaultMicrobiologyEvidence;
    });
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Nuevo elemento probatorio form state
    const [newTitle, setNewTitle] = useState('');
    const [newStage, setNewStage] = useState('CULTURE_PLATE');
    const [newDesc, setNewDesc] = useState('');
    const [newMedium, setNewMedium] = useState('');
    const [newDilution, setNewDilution] = useState('');
    const [newResult, setNewResult] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');

    const handleSaveNewEvidence = async (e) => {
        e.preventDefault();
        const newItem = {
            id: `ev-custom-${Date.now()}`,
            stage: newStage,
            title: newTitle || (reportLang === 'es' ? 'Evidencia Fotográfica de Ensayo' : 'Test Photographic Evidence'),
            description: newDesc || 'Registro probatorio de ensayo microbiológico.',
            medium: newMedium || 'Medio Estándar',
            dilution: newDilution || '10⁻¹',
            incubation: '35°C / 48 hrs',
            resultObservation: newResult || 'Verificado en Laboratorio',
            analyst: 'Microbiólogo Analista LIMS',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            imageUrl: newImageUrl || defaultMicrobiologyEvidence[0].imageUrl
        };

        const updated = [...evidences, newItem];
        setEvidences(updated);
        if (onUpdateEvidence) onUpdateEvidence(updated);

        // Guardar en backend si hay reportId numérico
        if (reportId) {
            setSaving(true);
            try {
                await fetch(`/api/reports/${reportId}/evidence`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ evidencePhotos: updated })
                });
            } catch (err) {
                console.error("Error guardando evidencias en el servidor:", err);
            } finally {
                setSaving(false);
            }
        }

        setIsAddModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewMedium('');
        setNewDilution('');
        setNewResult('');
        setNewImageUrl('');
    };

    const handleRemoveEvidence = async (id) => {
        if (!window.confirm(reportLang === 'es' ? '¿Desea remover este elemento probatorio del informe?' : 'Remove this evidentiary item from report?')) return;
        const updated = evidences.filter(ev => ev.id !== id);
        setEvidences(updated);
        if (onUpdateEvidence) onUpdateEvidence(updated);

        if (reportId) {
            try {
                await fetch(`/api/reports/${reportId}/evidence`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ evidencePhotos: updated })
                });
            } catch (err) {
                console.error("Error al remover evidencia:", err);
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewImageUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const getStageBadge = (stage) => {
        switch (stage) {
            case 'CULTURE_PLATE':
                return { label: reportLang === 'es' ? 'Placa de Cultivo' : 'Culture Plate', color: 'bg-amber-100 text-amber-800 border-amber-300' };
            case 'INTAKE_COLD_CHAIN':
                return { label: reportLang === 'es' ? 'Cadena de Frío' : 'Cold Chain Intake', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
            case 'SAMPLING_POINT':
                return { label: reportLang === 'es' ? 'Punto de Muestreo' : 'Sampling Site', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
            case 'MICROSCOPY':
                return { label: reportLang === 'es' ? 'Microscopía / Gram' : 'Microscopy / Gram', color: 'bg-purple-100 text-purple-800 border-purple-300' };
            default:
                return { label: reportLang === 'es' ? 'Probatorio' : 'Evidence', color: 'bg-slate-100 text-slate-800 border-slate-300' };
        }
    };

    return (
        <div className="w-full mt-6 mb-8 select-none print-card-break">
            {/* Header del Anexo Probatorio ISO 17025 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-700 pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-800 text-amber-400 rounded-lg">
                        <Camera size={18} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>{reportLang === 'es' ? 'ANEXO FOTOGRÁFICO Y ELEMENTOS PROBATORIOS' : 'PHOTOGRAPHIC EVIDENCE & EVIDENTIARY ANNEX'}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-300">
                                ISO/IEC 17025:2017 § 7.8
                            </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                            {reportLang === 'es'
                                ? 'Registro de placas de cultivo microbiológico, recuento de colonias y trazabilidad de muestreo'
                                : 'Microbiological culture plate records, colony count enumeration, and sampling chain custody'}
                        </p>
                    </div>
                </div>

                {!readOnly && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 print:hidden">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>{reportLang === 'es' ? 'Adjuntar Fotografía / Placa' : 'Attach Photo / Plate'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Cuadrícula de Evidencias (Optimizado para Impresión y Pantalla) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {evidences.map((ev) => {
                    const badge = getStageBadge(ev.stage);
                    return (
                        <div 
                            key={ev.id}
                            className="bg-slate-50 border border-slate-300 rounded-xl overflow-hidden shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between"
                        >
                            {/* Imagen / Placa con hover de zoom */}
                            <div className="relative group bg-slate-900 flex items-center justify-center h-48 overflow-hidden cursor-pointer" onClick={() => setSelectedEvidence(ev)}>
                                <img 
                                    src={ev.imageUrl} 
                                    alt={ev.title} 
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs print:hidden">
                                    <ZoomIn size={18} />
                                    <span>{reportLang === 'es' ? 'Ampliar e Inspeccionar' : 'Enlarge & Inspect'}</span>
                                </div>
                                <span className={`absolute top-2 left-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border shadow-xs ${badge.color}`}>
                                    {badge.label}
                                </span>
                            </div>

                            {/* Ficha descriptiva y trazabilidad técnica */}
                            <div className="p-3 bg-white border-t border-slate-200 flex-1 flex flex-col justify-between text-left">
                                <div>
                                    <h5 className="text-[11px] font-black text-slate-900 leading-tight mb-1">
                                        {ev.title}
                                    </h5>
                                    <p className="text-[9.5px] text-slate-600 leading-relaxed line-clamp-2 mb-2">
                                        {ev.description}
                                    </p>
                                </div>

                                <div className="space-y-1 text-[9px] font-medium border-t border-slate-100 pt-2 text-slate-700">
                                    {ev.medium && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-bold">{reportLang === 'es' ? 'Medio / Método:' : 'Medium / Method:'}</span>
                                            <span className="font-semibold text-slate-800 font-mono">{ev.medium}</span>
                                        </div>
                                    )}
                                    {ev.dilution && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-bold">{reportLang === 'es' ? 'Alícuota / Dilución:' : 'Aliquot / Dilution:'}</span>
                                            <span className="font-semibold text-slate-800 font-mono">{ev.dilution}</span>
                                        </div>
                                    )}
                                    {ev.resultObservation && (
                                        <div className="flex justify-between bg-emerald-50 text-emerald-900 p-1 rounded font-bold">
                                            <span>{reportLang === 'es' ? 'Dictamen Placa:' : 'Plate Reading:'}</span>
                                            <span className="text-right truncate max-w-[180px]">{ev.resultObservation}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[8px] text-slate-400 pt-0.5 font-mono">
                                        <span>{ev.timestamp || 'N/A'}</span>
                                        <span className="truncate">{ev.analyst}</span>
                                    </div>
                                </div>

                                {!readOnly && (
                                    <div className="mt-2 pt-1 border-t border-slate-100 flex justify-end print:hidden">
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveEvidence(ev.id); }}
                                            className="text-red-500 hover:text-red-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            <Trash2 size={12} />
                                            <span>{reportLang === 'es' ? 'Quitar' : 'Remove'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Inspección / Amplificación en Alta Resolución */}
            {selectedEvidence && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 print:hidden animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col text-slate-100">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                            <div>
                                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                                    {selectedEvidence.stage} · INSPECCIÓN ÓPTICA DE CULTIVO
                                </span>
                                <h3 className="text-base font-bold text-white leading-snug">
                                    {selectedEvidence.title}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setSelectedEvidence(null)}
                                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body: Imagen Ampliada */}
                        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center max-h-[60vh] overflow-auto">
                            <img 
                                src={selectedEvidence.imageUrl} 
                                alt={selectedEvidence.title} 
                                className="max-h-[50vh] max-w-full object-contain rounded-xl border border-slate-800 shadow-xl"
                            />
                        </div>

                        {/* Modal Footer: Detalle y Dictamen */}
                        <div className="p-5 bg-slate-900/90 border-t border-slate-800 space-y-2 text-xs">
                            <p className="text-slate-300 leading-relaxed">{selectedEvidence.description}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10.5px]">
                                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Medio / Soporte</span>
                                    <span className="font-semibold text-white">{selectedEvidence.medium || 'N/A'}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Alícuota / Dilución</span>
                                    <span className="font-semibold text-white">{selectedEvidence.dilution || 'N/A'}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Incubación</span>
                                    <span className="font-semibold text-white">{selectedEvidence.incubation || 'N/A'}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-300">
                                    <span className="text-emerald-400 block text-[9px] uppercase font-bold">Dictamen Analítico</span>
                                    <span className="font-bold truncate">{selectedEvidence.resultObservation || 'Conforme'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Agregar Nueva Fotografía o Evidencia */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 print:hidden animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-slate-800">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="text-blue-600" size={20} />
                                <h3 className="text-sm font-black uppercase text-slate-800">
                                    {reportLang === 'es' ? 'Adjuntar Nuevo Elemento Probatorio' : 'Attach New Evidentiary Item'}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewEvidence} className="p-5 space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {reportLang === 'es' ? 'Categoría de Evidencia:' : 'Evidence Category:'}
                                </label>
                                <select 
                                    value={newStage} 
                                    onChange={(e) => setNewStage(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg font-medium bg-white text-slate-800"
                                >
                                    <option value="CULTURE_PLATE">Placa de Cultivo Microbiológico (Agar / Petrifilm)</option>
                                    <option value="INTAKE_COLD_CHAIN">Recepción & Cadena de Frío (Hielera / Termómetro)</option>
                                    <option value="SAMPLING_POINT">Punto de Muestreo en Sitio (Grifo / Tanque / Superficie)</option>
                                    <option value="MICROSCOPY">Microscopía / Frotis / Confirmación Bioquímica</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {reportLang === 'es' ? 'Título o Parámetro Probatorio:' : 'Title / Evidentiary Parameter:'}
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Ej: Placa PCA Recuento Heterotrófico 10⁻¹"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        {reportLang === 'es' ? 'Medio / Método:' : 'Medium / Method:'}
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Agar PCA / SMEWW 9215B"
                                        value={newMedium}
                                        onChange={(e) => setNewMedium(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">
                                        {reportLang === 'es' ? 'Alícuota / Dilución:' : 'Aliquot / Dilution:'}
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: 10⁻¹ / 1 mL"
                                        value={newDilution}
                                        onChange={(e) => setNewDilution(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {reportLang === 'es' ? 'Lectura / Resultado del Ensayo:' : 'Reading / Test Result:'}
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: 45 UFC/mL (Conforme con norma)"
                                    value={newResult}
                                    onChange={(e) => setNewResult(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {reportLang === 'es' ? 'Descripción u Observación Microscópica:' : 'Description / Microscopic Observation:'}
                                </label>
                                <textarea 
                                    rows={2}
                                    placeholder="Detalles morfológicos de colonias, halo de hemólisis/lecitinasa o notas de muestreo..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {reportLang === 'es' ? 'Seleccionar Fotografía o Placa (JPG/PNG):' : 'Select Photo or Plate (JPG/PNG):'}
                                </label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="w-full p-1.5 border border-slate-300 rounded-lg bg-slate-50 cursor-pointer"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                                >
                                    {reportLang === 'es' ? 'Cancelar' : 'Cancel'}
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={16} />
                                    <span>{reportLang === 'es' ? (saving ? 'Guardando...' : 'Incorporar al Informe') : (saving ? 'Saving...' : 'Attach to Report')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
