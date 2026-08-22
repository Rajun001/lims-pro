import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export default function ElectronicSignatureModal({ isOpen, onClose, reportData, onConfirmSign }) {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('APROBACIÓN_Y_EMISION_FINAL_DE_INFORME');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !reportData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) {
      setError('Debe ingresar su PIN de firma electrónica (2º Factor 21 CFR Part 11).');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await onConfirmSign({
        reportId: reportData.id,
        pin,
        meaning: reason,
        technicalObservations: comments
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Fallo en la firma electrónica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden transform transition-all">
        {/* Encabezado Normativo */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Firma Electrónica Regulada</h3>
              <p className="text-xs text-slate-400">Cumplimiento 21 CFR Part 11 & ISO 17025 / 15189</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tarjeta de Resumen del Informe */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Nº Informe / CoA:</span>
              <span className="font-mono font-bold text-emerald-400">{reportData.reportNumber}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Tipo de Documento:</span>
              <span className="font-medium text-slate-200">
                {reportData.reportType === 'INDUSTRIAL_COA' ? 'Certificado de Análisis (CoA Matrix)' : 'Informe Clínico Humano'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Estado Previo:</span>
              <span className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                REVISIÓN TÉCNICA
              </span>
            </div>
          </div>

          {/* Motivo de Firma Regulada */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Declaración Legal de Intención (Sign Meaning)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="APROBACIÓN_Y_EMISION_FINAL_DE_INFORME">
                Certifico que he revisado y aprobado formalmente la validez técnica de estos resultados.
              </option>
              <option value="VALIDACION_TECNICA_PRELIMINAR">
                Validación técnica analítica parcial autorizada por Director Técnico.
              </option>
            </select>
          </div>

          {/* Observaciones Técnicas Dictamen */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Observaciones Técnicas / Hallazgos Microscópicos (Dictamen)
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ej. Se confirman estructuras cristalinas en sedimento / Se aprueba lote según especificación ISO 6888-1."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          {/* 2º Factor de Autenticación - PIN de Firma */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Re-autenticación con PIN de Director Técnico
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ingrese su PIN de 6 dígitos"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-center text-lg font-mono text-emerald-400 tracking-widest focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Firmando Criptográficamente...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Firmar y Emitir PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
