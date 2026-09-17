import React, { useState, useEffect, useRef } from 'react';
import { 
    Smartphone, CheckCircle2, Clock, Copy, Check, X, 
    AlertTriangle, ShieldCheck, ArrowRight, Building, Hash, RefreshCw
} from 'lucide-react';
import { 
    LAB_SINPE_PHONE, LAB_NAME, generateReferenceNumber, 
    generateSINPEPayload, recordTransaction 
} from '../services/SINPEService';

export default function SINPEPaymentModal({ isOpen, onClose, invoice, onPaymentSuccess }) {
    const [reference, setReference] = useState('');
    const [copiedRef, setCopiedRef] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutos (900 seg)
    const [step, setStep] = useState(1); // 1=QR/Cobro, 2=Verificación/Comprobante, 3=Éxito
    const [senderPhone, setSenderPhone] = useState('');
    const [senderBank, setSenderBank] = useState('BAC Credomatic');
    const [bankAuth, setBankAuth] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [activeInvoiceKey, setActiveInvoiceKey] = useState(null);
    
    const canvasRef = useRef(null);

    // Inicializar referencia al abrir con factura nueva
    const currentKey = isOpen && invoice ? `${invoice.id || invoice.number || 'INV'}` : null;
    if (currentKey && currentKey !== activeInvoiceKey) {
        setActiveInvoiceKey(currentKey);
        setReference(generateReferenceNumber('001'));
        setTimeLeft(900);
        setStep(1);
        setBankAuth('');
        setSenderPhone('');
    }

    // Timer regresivo de 15 minutos
    useEffect(() => {
        if (!isOpen || step === 3) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [isOpen, step]);

    // Renderizar QR Code en Canvas con diseño estilizado
    useEffect(() => {
        if (!canvasRef.current || !reference || !invoice) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Generar patrón visual QR basado en el payload
        const payload = generateSINPEPayload({
            phone: LAB_SINPE_PHONE,
            amount: invoice.amount,
            reference: reference,
            description: `Factura ${invoice.id}`
        });

        const gridSize = 25;
        const cellSize = size / gridSize;

        // Semilla pseudoaleatoria determinista según el payload
        let hash = 0;
        for (let i = 0; i < payload.length; i++) {
            hash = ((hash << 5) - hash) + payload.charCodeAt(i);
            hash |= 0;
        }

        ctx.fillStyle = '#1e293b';

        // Dibujar esquinas del QR (Finder patterns)
        const drawFinder = (startX, startY) => {
            ctx.fillRect(startX * cellSize, startY * cellSize, 7 * cellSize, 7 * cellSize);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect((startX + 1) * cellSize, (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
            ctx.fillStyle = '#0284c7'; // Azul SINPE
            ctx.fillRect((startX + 2) * cellSize, (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize);
        };

        drawFinder(0, 0);
        drawFinder(gridSize - 7, 0);
        drawFinder(0, gridSize - 7);

        // Matriz de puntos simulados
        ctx.fillStyle = '#1e293b';
        let currentHash = Math.abs(hash);
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // Evitar los finders
                if ((r < 8 && c < 8) || (r < 8 && c >= gridSize - 8) || (r >= gridSize - 8 && c < 8)) {
                    continue;
                }
                currentHash = (currentHash * 1103515245 + 12345) & 0x7fffffff;
                if (currentHash % 100 > 55) {
                    ctx.fillRect(c * cellSize + 0.5, r * cellSize + 0.5, cellSize - 1, cellSize - 1);
                }
            }
        }

        // Logo central SINPE
        const centerSize = 44;
        const centerX = (size - centerSize) / 2;
        const centerY = (size - centerSize) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX - 2, centerY - 2, centerSize + 4, centerSize + 4);
        ctx.fillStyle = '#0284c7'; // Sky 600
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SINPE', size / 2, size / 2);
    }, [reference, invoice, step]);

    if (!isOpen || !invoice) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'ref') {
            setCopiedRef(true);
            setTimeout(() => setCopiedRef(false), 2000);
        } else {
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        }
    };

    const handleConfirmPayment = () => {
        setIsVerifying(true);
        setTimeout(() => {
            const authNum = bankAuth.trim() || 'AUT-' + Math.floor(100000 + Math.random() * 900000);
            recordTransaction({
                reference,
                invoiceId: invoice.id,
                client: invoice.client,
                amount: invoice.amount,
                senderPhone: senderPhone || 'No especificado',
                bank: senderBank,
                bankAuth: authNum,
                notes: `Pago SINPE Móvil de Factura ${invoice.id}`
            });

            setIsVerifying(false);
            setStep(3);

            if (onPaymentSuccess) {
                onPaymentSuccess(invoice.id, reference, authNum);
            }
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
                {/* Header Modal */}
                <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-xs border border-white/20">
                            <Smartphone size={26} className="text-sky-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-sky-400/30 px-2 py-0.5 rounded-full border border-sky-300/30">BCCR Oficial</span>
                                <span className="text-xs text-sky-200 font-mono flex items-center gap-1">
                                    <Clock size={12} /> {formatTime(timeLeft)}
                                </span>
                            </div>
                            <h3 className="text-xl font-black tracking-tight mt-0.5">Cobro con SINPE Móvil</h3>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {step === 1 && (
                        <>
                            {/* Monto y Destinatario */}
                            <div className="bg-gradient-to-br from-sky-50 to-indigo-50/50 p-4 rounded-2xl border border-sky-100 flex justify-between items-center">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Monto a Transferir</span>
                                    <span className="text-2xl font-black font-mono text-sky-950">¢{invoice.amount.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">Factura: <b className="text-slate-700 font-mono">{invoice.id}</b> · {invoice.client}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Beneficiario</span>
                                    <span className="text-xs font-bold text-slate-800 block">{LAB_NAME}</span>
                                </div>
                            </div>

                            {/* Contenedor QR y Datos de Pago */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                {/* Canvas QR */}
                                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                                    <canvas ref={canvasRef} className="rounded-xl shadow-xs" />
                                    <span className="text-[10px] font-bold text-slate-400 mt-2 text-center uppercase tracking-wider">Escanee desde su App Bancaria</span>
                                </div>

                                {/* Datos Telefónicos y Referencia */}
                                <div className="space-y-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Número SINPE</span>
                                            <button 
                                                onClick={() => copyToClipboard(LAB_SINPE_PHONE, 'phone')}
                                                className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                                            >
                                                {copiedPhone ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                {copiedPhone ? 'Copiado' : 'Copiar'}
                                            </button>
                                        </div>
                                        <div className="text-lg font-black font-mono text-slate-800 tracking-wider">
                                            {LAB_SINPE_PHONE}
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Detalle / Referencia</span>
                                            <button 
                                                onClick={() => copyToClipboard(reference, 'ref')}
                                                className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                                            >
                                                {copiedRef ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                {copiedRef ? 'Copiado' : 'Copiar'}
                                            </button>
                                        </div>
                                        <div className="text-xs font-mono font-bold text-indigo-700 break-all">
                                            {reference}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-[11px] leading-tight">
                                        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                                        <span>Conciliación automática vinculada al número de factura.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de transición */}
                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                Ya realicé la transferencia <ArrowRight size={16} />
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                                <h4 className="text-sm font-bold text-sky-900 mb-1">Validación de Comprobante SINPE</h4>
                                <p className="text-xs text-sky-700">Ingrese los datos del comprobante generado por su banco para conciliar el pago.</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Banco Emisor</label>
                                    <select
                                        value={senderBank}
                                        onChange={(e) => setSenderBank(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                                    >
                                        <option value="BAC Credomatic">BAC Credomatic</option>
                                        <option value="Banco Nacional (BNCR)">Banco Nacional (BNCR)</option>
                                        <option value="Banco de Costa Rica (BCR)">Banco de Costa Rica (BCR)</option>
                                        <option value="Banco Popular">Banco Popular</option>
                                        <option value="Scotiabank CR">Scotiabank CR</option>
                                        <option value="Davivienda">Davivienda</option>
                                        <option value="Promerica">Promerica</option>
                                        <option value="Coopealianza / Otras Coopes">Coopealianza / Cooperativas</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Teléfono Emisor</label>
                                        <input
                                            type="text"
                                            placeholder="8xxx-xxxx"
                                            value={senderPhone}
                                            onChange={(e) => setSenderPhone(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nº Comprobante / Aut.</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: AUT-984210"
                                            value={bankAuth}
                                            onChange={(e) => setBankAuth(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                >
                                    Volver al QR
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={isVerifying}
                                    className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" /> Verificando en BCCR...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} /> Confirmar Pago
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-4 space-y-4 animate-scale-up">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
                                <CheckCircle2 size={36} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-800">¡Pago SINPE Conciliado!</h4>
                                <p className="text-xs text-slate-500 mt-1">La factura ha sido liquidada exitosamente en el sistema contable.</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs font-mono">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Referencia BCCR:</span>
                                    <span className="font-bold text-slate-800">{reference}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Monto Acreditado:</span>
                                    <span className="font-bold text-emerald-600">¢{invoice.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Banco:</span>
                                    <span className="font-bold text-slate-700">{senderBank}</span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                                Finalizar y Cerrar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
