import React, { useState } from 'react';
import { X, Send, Mail, Copy, Check, ExternalLink, Share2, Smartphone } from 'lucide-react';

export const ShareReportModal = ({ isOpen, onClose, request, labInfo, reportLang = 'es' }) => {
    const [phoneNumber, setPhoneNumber] = useState(request?.clientPhone || request?.phone || '');
    const [countryCode, setCountryCode] = useState('+506');
    const [email, setEmail] = useState(request?.clientEmail || request?.email || '');
    const [copied, setCopied] = useState(false);

    // URL oficial de verificación pública
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lims-microlabs.web.app';
    const reqId = request?.id || '';
    const verifyUrl = `${origin}/verify/${reqId}`;

    // Redacción del mensaje para WhatsApp
    const isEn = reportLang === 'en';
    const patientName = request?.clientName || request?.patientName || (isEn ? 'Valued Patient' : 'Estimado(a) Paciente');
    const testName = request?.analysisRequested || (isEn ? 'Laboratory Test' : 'Análisis Clínico');
    const labName = labInfo?.name || 'Laboratorio Microlabs';

    const defaultWhatsappMessage = isEn
        ? `🧪 *${labName}* - Official Laboratory Results\n\n` +
          `Hello *${patientName}*,\n\n` +
          `Your results for sample *#${reqId}* (${testName}) have been approved and validated by our medical team.\n\n` +
          `📄 *Verify & View Results:* \n${verifyUrl}\n\n` +
          `Thank you for trusting ${labName}.\n` +
          `📞 Phone: ${labInfo?.telephones || '2234-8837'}`
        : `🧪 *${labName}* - Resultados Oficiales de Laboratorio\n\n` +
          `Estimado(a) *${patientName}*,\n\n` +
          `Le informamos que los resultados de su muestra *#${reqId}* (${testName}) han sido procesados y validados por nuestro equipo de microbiología.\n\n` +
          `📄 *Ver y Descargar Informe Oficial:* \n${verifyUrl}\n\n` +
          `Gracias por confiar en ${labName}.\n` +
          `📞 Consultas: ${labInfo?.telephones || '2234-8837'}`;

    const [customMessage, setCustomMessage] = useState(defaultWhatsappMessage);

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

    const handleSendEmail = () => {
        const subject = encodeURIComponent(`Resultados de Laboratorio #${request.id} - ${labName}`);
        const body = encodeURIComponent(customMessage);
        const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
        window.location.href = mailtoUrl;
        onClose();
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
                        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                            <Mail size={18} className="text-blue-600" />
                            <span>Enviar por Correo Electrónico</span>
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
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSendEmail}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <Mail size={16} /> Enviar Email
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
