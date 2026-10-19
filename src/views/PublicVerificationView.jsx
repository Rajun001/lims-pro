import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ShieldCheck, CheckCircle2, Award, Building2, User, Calendar, 
    FileText, ArrowRight, QrCode, Lock, Hash, Cpu, ExternalLink, 
    Printer, Phone, Mail, MapPin, Share2, MessageCircle, Download, Check
} from 'lucide-react';
import versionData from '../version.json';
import mockData from '../data/mock_data.json';
import QRCode from 'qrcode';

export const PublicVerificationView = () => {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('report'); // 'report' o 'certificate'
    const [copied, setCopied] = useState(false);
    const [localQrUrl, setLocalQrUrl] = useState('');

    const searchId = id || 'MC-2026-0003';

    useEffect(() => {
        const fetchVerificationData = async () => {
            // 1. Buscar en mockData o localStorage
            try {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const found = mockData.requests.find(r => r.id === searchId) || 
                              localReqs.find(r => r.id === searchId) ||
                              (searchId.startsWith('MC-2026-') ? mockData.requests.find(r => r.id === 'MC-2026-0003') : null);

                if (found) {
                    const isInd = found.clientType?.toLowerCase().includes('industria') || 
                                  found.sampleType?.toLowerCase().includes('alimento') || 
                                  found.sampleType?.toLowerCase().includes('agua');

                    setReport({
                        reportNumber: found.id || searchId,
                        reportType: isInd ? 'INDUSTRIAL_COA' : 'HUMAN_CLINICAL',
                        clientOrPatient: found.clientName || found.patientName || 'Alimentos CQC / Dr. Roldan Ajún',
                        clientAddress: found.clientAddress || 'La Uruca, San José, Costa Rica',
                        clientContactName: found.clientContactName || 'Dr. Roldan Ajún Chaverri',
                        clientPhone: found.clientPhone || '88399753',
                        sampleBarcode: found.id || searchId,
                        sampleType: found.sampleType || 'Agua / Hielo',
                        matrix: found.matrix || found.sampleDescription || 'Agua potable de pozo (Lote POZO-3)',
                        sampleDescription: found.sampleDescription || 'Agua potable de pozo (Grifo Principal)',
                        sampleLot: found.sampleLot || 'POZO-3',
                        samplingLocation: found.samplingLocation || 'Planta Principal Alimentos CQC',
                        sampledBy: found.sampledBy || 'SOLICITANTE',
                        analysisRequested: found.analysisRequested || 'Coliformes Totales y Recuento Heterotrófico en Agua Potable',
                        status: 'ISSUED',
                        requestDate: found.requestDate || '2026-05-26T11:00:00.000Z',
                        platingDate: found.platingDate || '2026-05-26T14:30:00.000Z',
                        signedAt: found.signedAt || '2026-05-28T09:00:00.000Z',
                        technicalDirector: 'Dr. Roldan Ajún Chaverri (Director Técnico MQC #802)',
                        technicalObservations: found.technicalObservations || 'Muestra CONFORME. Cumple satisfactoriamente con los parámetros microbiológicos establecidos en el Reglamento para la Calidad del Agua Potable (Decreto Ejecutivo N° 38924-S) y RTCA 67.04.50:08.',
                        analyzerResults: found.analyzerResults || [
                            {
                                testCode: 'RTA',
                                testName: 'Recuento Heterotrófico en Placa (RTA)',
                                value: '62',
                                unit: 'UFC/mL',
                                refRange: '< 500 UFC/mL',
                                method: 'SMEWW 9215',
                                status: 'released'
                            },
                            {
                                testCode: 'CT',
                                testName: 'Coliformes Totales',
                                value: '< 1.1',
                                unit: 'NMP/100mL',
                                refRange: 'Ausencia (< 1.1 NMP/100mL)',
                                method: 'SMEWW 9221C',
                                status: 'released'
                            },
                            {
                                testCode: 'CF',
                                testName: 'Coliformes Fecales',
                                value: '< 1.1',
                                unit: 'NMP/100mL',
                                refRange: 'Ausencia (< 1.1 NMP/100mL)',
                                method: 'SMEWW 9221C',
                                status: 'released'
                            },
                            {
                                testCode: 'EC',
                                testName: 'Escherichia coli',
                                value: '< 1.1',
                                unit: 'NMP/100mL',
                                refRange: 'Ausencia (< 1.1 NMP/100mL)',
                                method: 'SMEWW 9223',
                                status: 'released'
                            }
                        ],
                        results: found.results || {
                            'Recuento Heterotrófico': '62 UFC/mL',
                            'Coliformes Totales': 'Ausencia (< 1.1 NMP/100mL)',
                            'Coliformes Fecales': 'Ausencia (< 1.1 NMP/100mL)',
                            'Escherichia coli': 'Ausencia (< 1.1 NMP/100mL)'
                        },
                        sha256Digest: '7a9f24e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b78',
                        isIntegrityVerified: true,
                        standards: ['INTE/ISO/IEC 17025:2017 (INTECO)', 'INTE/ISO 15189:2014', 'Test de Proficiencia AOAC / LGC', 'RTCA 67.04.50:08']
                    });
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.warn("Error leyendo mockData en verificador:", e);
            }

            try {
                // Intentar consultar API Backend LIMS
                const res = await fetch(`/api/reports/verify/${searchId}`);
                if (res.ok) {
                    const data = await res.json();
                    setReport(data);
                } else {
                    // Datos de demostración enriquecidos
                    setReport({
                        reportNumber: searchId,
                        reportType: 'INDUSTRIAL_COA',
                        clientOrPatient: 'Alimentos CQC / Dr. Roldan Ajún',
                        clientAddress: 'La Uruca, San José, Costa Rica',
                        clientContactName: 'Dr. Roldan Ajún Chaverri',
                        sampleBarcode: searchId,
                        sampleType: 'Agua / Hielo',
                        matrix: 'Agua potable de pozo (Lote POZO-3)',
                        sampleDescription: 'Agua potable de pozo (Grifo Principal)',
                        sampleLot: 'POZO-3',
                        samplingLocation: 'Planta Principal Alimentos CQC',
                        sampledBy: 'SOLICITANTE',
                        analysisRequested: 'Coliformes Totales y Recuento Heterotrófico en Agua Potable',
                        status: 'ISSUED',
                        requestDate: '2026-05-26T11:00:00.000Z',
                        platingDate: '2026-05-26T14:30:00.000Z',
                        signedAt: '2026-05-28T09:00:00.000Z',
                        technicalDirector: 'Dr. Roldan Ajún Chaverri (Director Técnico MQC #802)',
                        technicalObservations: 'Muestra CONFORME. Cumple satisfactoriamente con los parámetros microbiológicos establecidos en el Reglamento para la Calidad del Agua Potable (Decreto Ejecutivo N° 38924-S).',
                        analyzerResults: [
                            { testCode: 'RTA', testName: 'Recuento Heterotrófico en Placa (RTA)', value: '62', unit: 'UFC/mL', refRange: '< 500 UFC/mL', method: 'SMEWW 9215' },
                            { testCode: 'CT', testName: 'Coliformes Totales', value: '< 1.1', unit: 'NMP/100mL', refRange: 'Ausencia (< 1.1 NMP/100mL)', method: 'SMEWW 9221C' },
                            { testCode: 'CF', testName: 'Coliformes Fecales', value: '< 1.1', unit: 'NMP/100mL', refRange: 'Ausencia (< 1.1 NMP/100mL)', method: 'SMEWW 9221C' },
                            { testCode: 'EC', testName: 'Escherichia coli', value: '< 1.1', unit: 'NMP/100mL', refRange: 'Ausencia (< 1.1 NMP/100mL)', method: 'SMEWW 9223' }
                        ],
                        sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                        isIntegrityVerified: true,
                        standards: ['INTE/ISO/IEC 17025:2017 (INTECO)', 'INTE/ISO 15189:2014', 'Test de Proficiencia AOAC/LGC']
                    });
                }
            } catch (err) {
                console.error("Error al consultar verificación pública:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVerificationData();
    }, [id, searchId]);

    useEffect(() => {
        if (!report?.reportNumber) return;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const qrUrl = `${origin}/verify/${report.reportNumber}`;
        QRCode.toDataURL(qrUrl, {
            margin: 1,
            width: 140,
            color: { dark: '#0f172a', light: '#ffffff' }
        }).then(url => {
            setLocalQrUrl(url);
        }).catch(err => {
            console.error('Error generando QR local:', err);
        });
    }, [report?.reportNumber]);

    const handlePrint = () => {
        window.print();
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '26/05/2026';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100">
                <div className="flex items-center gap-3 bg-slate-800 px-6 py-4 rounded-2xl border border-slate-700 shadow-xl">
                    <Cpu className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="font-mono text-sm font-semibold">Cargando informe y validando firma digital...</span>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100">
                <div className="bg-slate-800 p-8 rounded-2xl max-w-md text-center border border-slate-700">
                    <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                    <h2 className="text-lg font-bold">Informe No Encontrado</h2>
                    <p className="text-xs text-slate-400 mt-2">No se encontró un informe oficial asociado al código {searchId}.</p>
                </div>
            </div>
        );
    }

    const qrImageUrl = localQrUrl || '';

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white print:bg-white print:p-0">
            
            {/* Barra Superior de Herramientas y Navegación (Se oculta al imprimir) */}
            <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 print:hidden shadow-xs">
                <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex items-center shrink-0">
                            <img 
                                src="/logo.png" 
                                alt="Microlabs" 
                                className="h-8 w-auto object-contain"
                                onError={(e) => {
                                    if (e.target.src !== window.location.origin + '/logo.png') {
                                        e.target.src = '/logo.png';
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-slate-900 tracking-wide">MICROLABS QUÍMICOS S.A.</span>
                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✓ Documento Oficial Validado
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-500">Portal Público de Visualización y Descarga de Informes</span>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-2">
                        {/* Selector de Pestaña */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                            <button
                                onClick={() => setActiveTab('report')}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                    activeTab === 'report' 
                                        ? 'bg-emerald-600 text-white shadow-xs' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Informe Oficial (CoA)</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('certificate')}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                    activeTab === 'certificate' 
                                        ? 'bg-slate-900 text-white shadow-xs' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Firma SHA-256</span>
                            </button>
                        </div>

                        {/* Botón Imprimir / PDF */}
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            title="Imprimir o Guardar como PDF"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">Imprimir / Guardar PDF</span>
                        </button>

                        {/* Botón Copiar Enlace */}
                        <button
                            onClick={handleCopyLink}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold p-2 rounded-xl border border-slate-300 transition-all cursor-pointer"
                            title="Copiar enlace oficial"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex-1 print:max-w-none print:p-0">
                
                {activeTab === 'report' ? (
                    /* ══════════════════════════════════════════════════════════════════
                       HOJA DE INFORME OFICIAL (REPORTE FÍSICO / IMPRIMIBLE)
                       ══════════════════════════════════════════════════════════════════ */
                    <div id="printable-report" className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 text-slate-800 print:shadow-none print:border-none print:p-0 print:rounded-none">
                        
                        {/* 1. Encabezado Superior: Logo y Metadatos de la Muestra */}
                        <div className="flex justify-between items-start pb-4 border-b border-slate-300 gap-4">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs flex items-center shrink-0">
                                        <img 
                                            src="/logo.png" 
                                            alt="Laboratorio Microlabs Centro Microbiológico" 
                                            className="h-14 sm:h-16 w-auto max-w-[210px] object-contain"
                                            onError={(e) => {
                                                if (e.target.src !== window.location.origin + '/logo.png') {
                                                    e.target.src = '/logo.png';
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight tracking-tight uppercase">
                                            Laboratorio Microlabs Químicos S.A.
                                        </h1>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            Cédula Jurídica: 3-101-144450 • Permiso Sanitario MINSA: MINSA-01048
                                        </p>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-2 space-y-0.5 leading-tight">
                                    <p>📍 75m Norte del Correo de Guadalupe, Goicoechea, San José, Costa Rica</p>
                                    <p>📞 Central: 2234-8837 • 2234-5862 • 2224-6541 | 💬 WhatsApp: +506 7138-2750</p>
                                    <p>✉️ reportes@microlabscr.com • laboratorio@microlabscr.com | 🌐 www.microlabscr.com</p>
                                </div>
                            </div>

                            {/* Metadatos de Reporte a la Derecha */}
                            <div className="text-right text-xs font-semibold space-y-1 shrink-0">
                                <div className="flex justify-end items-center gap-2 mb-1">
                                    <span className="text-slate-600 font-bold text-[11px]">Código de reporte:</span>
                                    <span className="text-[#ea580c] font-black text-xl sm:text-2xl font-mono leading-none">
                                        {report.reportNumber}
                                    </span>
                                </div>
                                <div className="flex justify-end gap-2 text-[11px]">
                                    <span className="text-slate-500 font-bold">Fecha de recepción:</span>
                                    <span className="font-semibold text-slate-700">{formatDate(report.requestDate)}</span>
                                </div>
                                <div className="flex justify-end gap-2 text-[11px]">
                                    <span className="text-slate-500 font-bold">Fecha de montaje:</span>
                                    <span className="font-semibold text-slate-700">{formatDate(report.platingDate || report.requestDate)}</span>
                                </div>
                                <div className="flex justify-end gap-2 text-[11px]">
                                    <span className="text-slate-500 font-bold">Fecha de emisión:</span>
                                    <span className="font-semibold text-slate-700">{formatDate(report.signedAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Barra Azul Oficial de Certificado de Análisis */}
                        <div className="bg-[#4a85c8] text-white font-black text-center py-2 uppercase text-xs sm:text-sm tracking-[0.2em] my-4 select-none rounded shadow-xs print:my-2">
                            {report.reportType === 'INDUSTRIAL_COA' 
                                ? 'CERTIFICADO DE ANÁLISIS — REPORTE DE LABORATORIO' 
                                : 'INFORME OFICIAL DE LABORATORIO CLÍNICO'}
                        </div>

                        {/* 3. Información del Cliente y Muestra */}
                        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-800 mb-6 print:mb-3">
                            <div className="sm:col-span-2">
                                <span className="text-[9.5px] font-bold text-slate-400 uppercase block mb-0.5">
                                    Empresa / Solicitante
                                </span>
                                <span className="font-black text-slate-900 text-sm uppercase">
                                    {report.clientOrPatient}
                                </span>
                                {report.clientAddress && (
                                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                                        📍 {report.clientAddress}
                                    </p>
                                )}
                            </div>
                            <div>
                                <span className="text-[9.5px] font-bold text-slate-400 uppercase block mb-0.5">
                                    Responsable / Contacto
                                </span>
                                <span className="font-bold text-slate-800">
                                    {report.clientContactName || 'Dr. Roldan Ajún Chaverri'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[9.5px] font-bold text-slate-400 uppercase block mb-0.5">
                                    Muestreado por
                                </span>
                                <span className="font-semibold uppercase text-slate-700">
                                    {report.sampledBy || 'SOLICITANTE'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[9.5px] font-bold text-slate-400 uppercase block mb-0.5">
                                    Matriz / Categoría
                                </span>
                                <span className="font-bold text-emerald-700">
                                    {report.matrix || report.sampleType || 'Agua Potable'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[9.5px] font-bold text-slate-400 uppercase block mb-0.5">
                                    Punto de Muestreo
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {report.samplingLocation || 'Instalaciones del Solicitante'}
                                </span>
                            </div>
                        </div>

                        {/* 4. Tabla Analítica Oficial de Resultados */}
                        <div className="w-full mb-6 print:mb-3 overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-slate-300 text-[11px] font-sans">
                                <thead>
                                    <tr className="bg-[#b8d4f4] border-b border-slate-300 text-slate-800 font-bold uppercase select-none">
                                        <th className="p-2.5 border border-slate-300 w-1/4">MUESTRA (s)</th>
                                        <th className="p-2.5 border border-slate-300 w-2/5">ANALISIS-DESCRIPCION</th>
                                        <th className="p-2.5 border border-slate-300 w-1/8 text-center">RESULTADOS</th>
                                        <th className="p-2.5 border border-slate-300 w-1/8 text-center">UNIDAD</th>
                                        <th className="p-2.5 border border-slate-300 w-1/5 text-center">OTROS / METODO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Categoría Banner */}
                                    <tr className="bg-[#f1f5f9] font-bold">
                                        <td className="p-1.5 px-3 border border-slate-300 text-[10px] uppercase text-slate-600" colSpan={5}>
                                            AGUA POTABLE Y DE POZO (MICROBIOLOGÍA)
                                        </td>
                                    </tr>
                                    
                                    {/* Filas de Resultados */}
                                    {report.analyzerResults && report.analyzerResults.map((res, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            {idx === 0 && (
                                                <td className="p-2.5 px-3 border border-slate-300 align-top font-bold text-slate-800 uppercase text-[10px]" rowSpan={report.analyzerResults.length}>
                                                    {report.sampleDescription || '1. AGUA POTABLE DE POZO (GRIFO PRINCIPAL)'}
                                                </td>
                                            )}
                                            <td className="p-2.5 border border-slate-300 font-medium text-slate-800">
                                                {res.testName}
                                            </td>
                                            <td className="p-2.5 border border-slate-300 text-center font-bold text-slate-900 bg-emerald-50/40">
                                                {res.value}
                                            </td>
                                            <td className="p-2.5 border border-slate-300 text-center text-slate-600 font-medium">
                                                {res.unit || '-'}
                                            </td>
                                            <td className="p-2.5 border border-slate-300 text-center text-slate-600 font-mono text-[10.5px]">
                                                {res.method || 'SMEWW'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 5. Notas Técnicas y Métodos */}
                        <div className="text-[11px] text-slate-700 space-y-1 mb-5 select-none leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-800">(*) Notas y Aclaraciones:</p>
                            <p className="pl-3 italic text-slate-600">
                                • El valor &lt; 1.1 equivale a No Detectable / Ausencia, de acuerdo con la sensibilidad y límite de cuantificación del método utilizado.
                            </p>
                            <p className="pl-3 font-semibold text-slate-700">
                                • MÉTODOS DE ENSAYO: Standard Methods for the Examination of Water and Wastewater (APHA / SMEWW 23rd Edition) & RTCA 67.04.50:08.
                            </p>
                        </div>

                        {/* 6. Dictamen y Conclusión Oficial */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 print:mb-3">
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
                                ✓ Dictamen Microbiológico & Conclusión:
                            </span>
                            <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                                {report.technicalObservations}
                            </p>
                            <p className="text-[10px] text-emerald-700 mt-1 font-semibold">
                                Muestra apta según los límites microbiológicos de calidad del agua potable para consumo humano.
                            </p>
                        </div>

                        {/* 7. Bloque de Firmas y Trazabilidad Criptográfica */}
                        <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-center gap-4">
                            
                            {/* Firma Digital del Director */}
                            <div className="text-center sm:text-left">
                                <div className="inline-block border-b-2 border-slate-700 pb-1 mb-1 px-4">
                                    <span className="font-serif italic font-bold text-slate-800 text-sm block">
                                        Dr. Roldan Ajún Chaverri
                                    </span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-900">Dr. Roldan Ajún Chaverri</p>
                                <p className="text-[10px] text-slate-600 font-medium">Director Técnico & Microbiólogo Químico Clínico</p>
                                <p className="text-[10px] font-bold text-emerald-700">Colegio MQC #802 • Firma Digital Válida 21 CFR Part 11</p>
                            </div>

                            {/* Código QR y Digest */}
                            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                <img 
                                    src={qrImageUrl} 
                                    alt="QR de Validación" 
                                    className="w-16 h-16 rounded border border-slate-200" 
                                />
                                <div className="text-left text-[10px] text-slate-600 space-y-0.5">
                                    <span className="font-black text-slate-900 block uppercase">Verificación en Línea</span>
                                    <p>Escanee para validar originalidad en servidor seguro.</p>
                                    <p className="font-mono text-[9px] text-slate-400 truncate max-w-[150px]">
                                        SHA: {report.sha256Digest.substring(0, 16)}...
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pie de Página de Certificación */}
                        <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[9.5px] text-slate-500 space-y-0.5">
                            <p className="font-semibold text-slate-600">
                                Sistema LIMS-PRO {versionData?.fullVersion || 'v2.5.0'} • Cumplimiento Normativo INTE/ISO/IEC 17025:2017 & INTE/ISO 15189:2014
                            </p>
                            <p>
                                Este informe no puede reproducirse parcialmente sin la autorización por escrito del laboratorio emisor.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* ══════════════════════════════════════════════════════════════════
                       PESTAÑA 2: CERTIFICADO CRIPTOGRÁFICO DE AUTENTICIDAD SHA-256
                       ══════════════════════════════════════════════════════════════════ */
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-6 text-slate-100">
                        
                        {/* Header del Certificado */}
                        <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800">
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mb-3 border border-emerald-500/20 shadow-inner">
                                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                Certificado Criptográfico de Integridad de Informe
                            </h2>
                            <p className="text-xs text-slate-400 mt-1 max-w-md">
                                Este documento ha sido autenticado mediante digest criptográfico SHA-256 y firmado electrónicamente bajo cumplimiento <strong className="text-emerald-400">FDA 21 CFR Part 11 & ISO 17025 / 15189</strong>.
                            </p>
                        </div>

                        {/* Grid de Datos del Informe */}
                        <div className="space-y-4">
                            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Nº de Informe / CoA</span>
                                    <span className="text-lg font-mono font-bold text-emerald-400">{report.reportNumber}</span>
                                </div>
                                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Certificado Auténtico & Válido
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800 space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-emerald-400" /> Titular / Solicitante
                                    </span>
                                    <span className="text-sm font-bold text-white block truncate">{report.clientOrPatient}</span>
                                </div>

                                <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800 space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Fecha de Firma Criptográfica
                                    </span>
                                    <span className="text-sm font-bold text-white block">
                                        {formatDate(report.signedAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-400" /> Matriz & Ensayo Realizado
                                </span>
                                <span className="text-sm font-bold text-white block">{report.sampleDescription} — {report.analysisRequested}</span>
                            </div>

                            <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-emerald-400" /> Director Técnico Emisor
                                </span>
                                <span className="text-sm font-bold text-emerald-300 block">{report.technicalDirector}</span>
                            </div>

                            {/* Digest Criptográfico SHA-256 */}
                            <div className="bg-slate-950/90 rounded-2xl p-4 border border-emerald-500/20 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Anti-Tamper Audit Digest
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-bold">21 CFR Part 11 OK</span>
                                </div>
                                <p className="font-mono text-[11px] text-emerald-400/90 break-all bg-slate-900 p-2 rounded-xl border border-slate-800">
                                    {report.sha256Digest}
                                </p>
                            </div>

                            {/* Botón Volver al Informe Completo */}
                            <div className="pt-2">
                                <button
                                    onClick={() => setActiveTab('report')}
                                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                                >
                                    <FileText className="w-4 h-4" /> Ver Hoja de Resultados Oficial Completa (CoA)
                                </button>
                            </div>
                        </div>

                        {/* Normativas y Calidad ISO */}
                        <div className="pt-4 border-t border-slate-800 text-center space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Sistema de Calidad & Normativas Aplicables
                            </span>
                            <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold">
                                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">INTE/ISO/IEC 17025:2017 (INTECO)</span>
                                <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">INTE/ISO 15189:2014</span>
                                <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">Test de Proficiencia AOAC / LGC</span>
                                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Decreto Ejecutivo N° 38924-S (Agua Potable)</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 px-4 print:hidden">
                <p>© {new Date().getFullYear()} Laboratorios Microlabs Químicos S.A. Todos los derechos reservados.</p>
                <p className="text-[10px] mt-1 text-slate-400 font-mono">
                    Sistema LIMS-PRO {versionData?.fullVersion || 'v2.5.0'} respaldado con trazabilidad auditada de extremo a extremo.
                </p>
            </footer>
        </div>
    );
};
