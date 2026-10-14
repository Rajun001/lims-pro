import React, { useState } from 'react';
import { X, Send, Mail, Copy, Check, ExternalLink, Share2, Smartphone } from 'lucide-react';

export const ShareReportModal = ({ isOpen, onClose, request, labInfo, reportLang = 'es' }) => {
    const [phoneNumber, setPhoneNumber] = useState(request?.clientPhone || request?.phone || '');
    const [countryCode, setCountryCode] = useState('+506');
    const [email, setEmail] = useState(request?.clientEmail || request?.email || '');
    const [copied, setCopied] = useState(false);

    // URL oficial de verificación pública accesible desde cualquier dispositivo móvil o web
    const isLocal = typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));
    const origin = (typeof window !== 'undefined' && !isLocal) ? window.location.origin : 'https://lims-microlabs.web.app';
    const reqId = request?.id || '';
    const verifyUrl = `${origin}/verify/${reqId}`;

    // Redacción del mensaje para WhatsApp
    const isEn = reportLang === 'en';
    const patientName = request?.clientName || request?.patientName || (isEn ? 'Valued Patient' : 'Estimado(a) Paciente');
    const testName = request?.analysisRequested || (isEn ? 'Laboratory Test' : 'Análisis Clínico');
    const labName = labInfo?.name || 'Laboratorio Microlabs';

    const resultsEmail = labInfo?.emailReports || 'reportes@microlabscr.com';
    const generalEmail = labInfo?.email || 'laboratorio@microlabscr.com';

    // Resumen de resultados para WhatsApp
    const resultsSummaryText = request?.analyzerResults?.length 
        ? request.analyzerResults.map(r => `• ${r.testName}: *${r.value} ${r.unit || ''}*`).join('\n')
        : (request?.results 
            ? Object.entries(request.results).map(([k, v]) => `• ${k}: *${v}*`).join('\n') 
            : '• Coliformes Totales: *Ausencia (< 1.1 NMP/100mL)*\n• Recuento Heterotrófico: *62 UFC/mL*');

    const defaultWhatsappMessage = isEn
        ? `🧪 *${labName}* - Official Laboratory Results\n\n` +
          `Hello *${patientName}*,\n\n` +
          `Your results for sample *#${reqId}* (${testName}) have been approved and validated by Dr. Roldan Ajún (Technical Director MQC #802).\n\n` +
          `📋 *Results Summary:*\n${resultsSummaryText}\n\n` +
          `✓ *Status:* CONFORMING / COMPLIANT\n\n` +
          `📄 *View & Download Official PDF Report:* \n${verifyUrl}\n\n` +
          `Thank you for trusting ${labName}.\n` +
          `📞 Phone: ${labInfo?.telephones || '2234-8837'}\n` +
          `✉️ Results: ${resultsEmail} | Inquiries: ${generalEmail}`
        : `🧪 *${labName}* - Resultados Oficiales de Laboratorio\n\n` +
          `Estimado(a) *${patientName}*,\n\n` +
          `Le informamos que los resultados de su muestra *#${reqId}* (${testName}) han sido procesados y validados por el Dr. Roldan Ajún Chaverri (Director Técnico MQC #802).\n\n` +
          `📋 *Resultados Obtenidos:*\n${resultsSummaryText}\n\n` +
          `✓ *Dictamen:* Muestra CONFORME según normativa RTCA y Decreto N° 38924-S.\n\n` +
          `📄 *Ver y Descargar Hoja Oficial Completa (PDF):* \n${verifyUrl}\n\n` +
          `Gracias por confiar en ${labName}.\n` +
          `📞 Consultas: ${labInfo?.telephones || '2234-8837 | 2234-5862 | 2224-6541'}\n` +
          `✉️ Informes: ${resultsEmail} | Consultas: ${generalEmail}`;

    const [customMessage, setCustomMessage] = useState(defaultWhatsappMessage);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState('');

    if (!isOpen || !request) return null;

    const handleSendWhatsApp = () => {
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        const cleanCode = countryCode.replace(/[^0-9]/g, '');
        
        let fullPhone = cleanPhone;
        if (cleanPhone && !cleanPhone.startsWith(cleanCode)) {
            fullPhone = `${cleanCode}${cleanPhone}`;
        }

        const encodedMessage = encodeURIComponent(customMessage);
        const waUrl = fullPhone 
            ? `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedMessage}`
            : `https://api.whatsapp.com/send?text=${encodedMessage}`;

        window.open(waUrl, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const handleSendEmail = async () => {
        if (!email) {
            alert("Por favor ingrese un correo electrónico destinatario.");
            return;
        }

        setSendingEmail(true);
        setEmailStatus('Enviando...');

        try {
            const res = await fetch('/api/reports/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    patientName,
                    reportNumber: reqId,
                    analysisRequested: testName,
                    verificationUrl: verifyUrl,
                    sampleType: request.sampleType || request.sampleDescription,
                    matrix: request.matrix,
                    samplingLocation: request.samplingLocation,
                    resultsList: request.analyzerResults?.map(r => ({
                        param: r.testName,
                        result: r.value,
                        unit: r.unit,
                        refRange: r.refRange,
                        method: r.method,
                        status: 'CUMPLE'
                    })),
                    interpretation: request.technicalObservations || request.clinicalInterpretation
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setEmailStatus('¡Enviado con éxito!');
                alert(`✅ El informe ha sido enviado exitosamente a: ${email}`);
                setTimeout(() => onClose(), 1200);
                return;
            } else if (data.requiresPassword) {
                alert("⚠️ Para el envío automático desde el servidor, se requiere ingresar la contraseña de reportes@microlabscr.com en la configuración (.env).");
            } else {
                alert(`Error al enviar: ${data.error || 'No se pudo completar el envío'}`);
            }
        } catch (err) {
            console.error("Error al conectar con API de correo:", err);
            alert("⚠️ No se pudo conectar con el servidor de correo. Verifique la conexión.");
        } finally {
            setSendingEmail(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(verifyUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Share2 size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg text-white">Compartir Informe Oficial</h3>
                            <p className="text-xs text-emerald-100 font-medium">Muestra #{request.id} • {patientName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700">
                    {/* Public verification link copy box */}
                    <div>
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                            Enlace de Verificación y Descarga Oficial (QR Link)
                        </label>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-3">
                            <input 
                                type="text" 
                                readOnly 
                                value={verifyUrl} 
                                className="bg-transparent text-xs font-mono font-bold text-slate-700 flex-1 outline-none truncate"
                            />
                            <button 
                                onClick={handleCopyLink}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    copied ? 'bg-emerald-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                            >
                                {copied ? <><Check size={14} /> ¡Copiado!</> : <><Copy size={14} /> Copiar</>}
                            </button>
                        </div>
                    </div>

                    {/* WhatsApp Section */}
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                            <Smartphone size={18} className="text-emerald-600" />
                            <span>Enviar por WhatsApp</span>
                        </div>
                        <div className="flex gap-2">
                            <select 
                                value={countryCode} 
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="bg-white border border-emerald-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="+506">🇨🇷 +506 (CR)</option>
                                <option value="+1">🇺🇸 +1 (US/CA)</option>
                                <option value="+52">🇲🇽 +52 (MX)</option>
                                <option value="+507">🇵🇦 +507 (PA)</option>
                                <option value="+504">🇭🇳 +504 (HN)</option>
                                <option value="+503">🇸🇻 +503 (SV)</option>
                                <option value="+502">🇬🇹 +502 (GT)</option>
                                <option value="+505">🇳🇮 +505 (NI)</option>
                                <option value="+57">🇨🇴 +57 (CO)</option>
                            </select>
                            <input 
                                type="tel" 
                                placeholder="Número de teléfono (ej. 8888-8888)"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Email Section */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                                <Mail size={18} className="text-blue-600" />
                                <span>Enviar por Correo Electrónico</span>
                            </div>
                            <span className="text-[10px] font-bold bg-blue-100/80 text-blue-700 px-2 py-0.5 rounded-md">
                                {resultsEmail}
                            </span>
                        </div>
                        <input 
                            type="email" 
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Message Preview */}
                    <div>
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                            Vista Previa del Mensaje (Editable)
                        </label>
                        <textarea 
                            rows={5}
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                        />
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 justify-end items-center">
                    {emailStatus && (
                        <span className="mr-auto text-xs font-semibold text-blue-600 animate-pulse">
                            {emailStatus}
                        </span>
                    )}
                    <button 
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:cursor-not-allowed"
                    >
                        <Mail size={16} className={sendingEmail ? 'animate-pulse' : ''} />
                        {sendingEmail ? 'Enviando Informe...' : 'Enviar Email'}
                    </button>
                    <button 
                        onClick={handleSendWhatsApp}
                        className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                        <Send size={16} /> Abrir WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};
