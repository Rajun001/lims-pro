import React, { useState } from 'react';
import { FlaskConical, Search, Eye, Download, Lock, FileText, FileSpreadsheet, Check, Send, History, HelpCircle, ChevronDown, ChevronUp, Info, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ClientHelpSection = ({ userRole, language }) => {
    const [openFaq, setOpenFaq] = useState(null);

    const isCompany = userRole === 'client_company';
    const isDoctor = userRole === 'client_doctor';
    const isEn = language === 'en';
    
    const faqs = isEn ? [
        {
            q: 'How do I download my results report in PDF format?',
            a: 'On the main results tab, locate the desired test. If the status is "Approved", the green "Download PDF" button will be active. Click it to generate and save the official digitally signed document.'
        },
        ...(isDoctor ? [
            {
                q: 'How can I search for a specific patient?',
                a: 'Go to the "Patient Search" tab. Enter the DNI, ID, or patient name in the search bar and press "Search". The system will list all referred patients under your medical supervision.'
            },
            {
                q: 'What does the "Pending Validation" status mean on the medical file?',
                a: 'It means the analytical tests have been completed by the laboratory equipment, but the final report is being reviewed and signed by the microbiologist/chemist before being officially released.'
            },
            {
                q: 'How can I export a patient\'s clinical progress history?',
                a: 'When you open a patient\'s details in the physician portal, you have the option to export the full results history in CSV/Excel format or graph the parameters over time to view trends.'
            }
        ] : isCompany ? [
            {
                q: 'How do I request a quote for mass analysis in my company?',
                a: 'Go to the "Plans & Quotes" tab. In the form, describe the type of analysis (e.g., occupational health, water monitoring, food tests) and the approximate number of samples. Your B2B account executive will respond with a formal corporate rate proposal.'
            },
            {
                q: 'How do I review pending invoices and the company\'s account statement?',
                a: 'Go to the "Account Statement" tab. You will find a table listing all issued invoices, due dates, amounts, and statuses (Paid or Pending). You can download each tax document directly.'
            },
            {
                q: 'How do I report that an invoice has already been paid?',
                a: 'To report a payment, you can contact the billing email provided at the bottom of the help section, attaching the invoice FAC-XX and the bank transfer receipt.'
            }
        ] : [
            {
                q: 'Why does my laboratory result appear "Locked" (with a padlock)?',
                a: 'For safety and compliance with health regulations, preliminary reports cannot be downloaded by the patient until the responsible microbiologist validates the readings, completes the internal quality control, and digitally signs the report (status changes to "Approved").'
            },
            {
                q: 'How long do the results take to be ready?',
                a: 'Most Clinical Chemistry and Hematology tests (e.g., Complete Blood Count, Glucose, Cholesterol) take between 2 to 4 hours. Microbiology tests (cultures) require biological incubation times and take 3 to 5 business days.'
            },
            {
                q: 'Is the electronic signature on the PDF valid for CCSS or government ministries?',
                a: 'Yes. The downloadable PDF report features a unique QR code and an authorized digital signature that complies with the standards required for legal procedures, airlines, embassies, and public health centers.'
            }
        ])
    ] : [
        {
            q: '¿Cómo descargo mi informe de resultados en formato PDF?',
            a: 'En la pestaña principal de resultados, localice el examen deseado. Si el estado es "Aprobado", el botón verde de "Descargar PDF" estará activo. Haga clic en él para generar y guardar el documento oficial firmado digitalmente.'
        },
        ...(isDoctor ? [
            {
                q: '¿Cómo puedo buscar a un paciente específico?',
                a: 'Ingrese a la pestaña "Buscador de Pacientes". Escriba el DNI, cédula o nombre del paciente en la barra de búsqueda y presione "Buscar". El sistema listará todos los pacientes referidos bajo su supervisión médica.'
            },
            {
                q: '¿Qué significa el estado "Pendiente de Validación" en la ficha médica?',
                a: 'Significa que las pruebas analíticas han sido completadas por el equipo de laboratorio, pero el reporte final está siendo revisado y firmado por el profesional de microbiología/química antes de liberarse oficialmente.'
            },
            {
                q: '¿Cómo exportar el historial de evolución clínica de un paciente?',
                a: 'Al abrir los detalles de un paciente en el portal médico, tiene la opción de exportar el histórico de resultados en formato CSV/Excel o graficar los parámetros en el tiempo para ver tendencias.'
            }
        ] : isCompany ? [
            {
                q: '¿Cómo solicitar una cotización para análisis masivos en mi empresa?',
                a: 'Diríjase a la pestaña "Planes y Cotizaciones". En el formulario, describa el tipo de análisis (ej. salud ocupacional, monitoreo de aguas, alimentos) y la cantidad aproximada de muestras. Su ejecutivo B2B responderá con la propuesta formal de tarifas corporativas.'
            },
            {
                q: '¿Cómo revisar las facturas pendientes y el estado de cuenta de la empresa?',
                a: 'Vaya a la pestaña "Estado de Cuenta". Encontrará una tabla con todas sus facturas emitidas, fechas de vencimiento, montos y estado (Pagada o Pendiente). Puede descargar cada documento tributario directamente.'
            },
            {
                q: '¿Cómo reportar que una factura ya fue cancelada?',
                a: 'Para reportar un pago, puede contactar al correo de facturación suministrado en la base del portal de ayuda, adjuntando la factura FAC-XX y el comprobante de transferencia bancaria.'
            }
        ] : [
            {
                q: '¿Por qué mi resultado de laboratorio aparece "Bloqueado" (con un candado)?',
                a: 'Por seguridad y apego a normativas sanitarias, los informes preliminares no pueden ser descargados por el paciente hasta que el microbiólogo responsable valide las lecturas, complete el control de calidad interno y firme digitalmente el informe (estatus cambia a "Aprobado").'
            },
            {
                q: '¿Cuánto tiempo tardan en estar listos los resultados?',
                a: 'La mayoría de los exámenes de Química Clínica y Hematología (ej. Hemograma, Glucosa, Colesterol) tardan entre 2 a 4 horas. Pruebas de Microbiología (cultivos) requieren tiempos de incubación biológica y toman de 3 a 5 días hábiles.'
            },
            {
                q: '¿La firma electrónica del PDF es válida para la Caja Costarricense de Seguro Social (CCSS) o ministerios?',
                a: 'Sí. El reporte PDF descargable cuenta con un código QR único y una firma digital autorizada que cumple con los estándares exigidos para trámites legales, aerolíneas, embajadas y centros médicos públicos.'
            }
        ])
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-bold">{isEn ? 'How can we help you today?' : '¿Cómo podemos ayudarte hoy?'}</h2>
                    <p className="text-blue-100 text-xs mt-1">
                        {isEn 
                            ? `Frequently asked questions and direct support for ${isDoctor ? 'physicians' : isCompany ? 'B2B clients' : 'patients'}.` 
                            : `Preguntas frecuentes y soporte directo para usuarios del portal ${isDoctor ? 'médico' : isCompany ? 'B2B' : 'de pacientes'}.`
                        }
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <HelpCircle className="text-blue-600" size={18} /> {isEn ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
                </h3>
                <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden transition-all hover:border-slate-200">
                                <button 
                                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                                    className="w-full flex justify-between items-center p-4 text-left font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                                </button>
                                {isOpen && (
                                    <div className="p-4 bg-slate-50 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 whitespace-pre-line">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                    <Info size={16} className="text-slate-600" /> {isEn ? 'Report Timeline and Statuses' : 'Línea de Tiempo y Estados del Reporte'}
                </h3>
                <p className="text-xs text-slate-500 mb-6">{isEn ? 'Understand what state your medical sample is in real-time:' : 'Comprenda en qué estado se encuentra su muestra médica en tiempo real:'}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                    <div className="flex flex-col items-center text-center p-3 bg-white border rounded-xl shadow-sm">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">1</span>
                        <p className="font-bold text-slate-700 text-xs mt-2">{isEn ? 'Registered' : 'Registrado'}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'The sample has entered the clinical laboratory.' : 'La muestra ingresó al laboratorio clínico.'}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 bg-white border rounded-xl shadow-sm">
                        <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">2</span>
                        <p className="font-bold text-blue-700 text-xs mt-2">{isEn ? 'In Process' : 'En Proceso'}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'Being analyzed by automated instruments.' : 'Analizándose en los equipos automáticos.'}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 bg-white border rounded-xl shadow-sm">
                        <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">3</span>
                        <p className="font-bold text-amber-700 text-xs mt-2">{isEn ? 'Validation' : 'Validation'}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'QC review and microbiologist signature.' : 'Revisión de QC y firma del microbiólogo.'}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 bg-green-50/50 border border-green-200 rounded-xl shadow-sm">
                        <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">✓</span>
                        <p className="font-bold text-green-700 text-xs mt-2">{isEn ? 'Approved' : 'Aprobado'}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{isEn ? 'PDF unlocked and ready for download!' : '¡PDF desbloqueado y listo para descarga!'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-xs text-slate-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h4 className="font-bold text-blue-800 text-sm">{isEn ? 'Still have questions or need support?' : '¿Aún tiene dudas o requiere soporte?'}</h4>
                    <p className="mt-1">{isEn ? 'Our clinical lab support team is here to help.' : 'Nuestro equipo de soporte del laboratorio clínico está disponible para ayudarle.'}</p>
                </div>
                <div className="flex gap-4 font-mono font-medium shrink-0">
                    <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold">{isEn ? 'Central Hotline' : 'Teléfono de Central'}</p>
                        <p className="text-slate-800 text-xs">+506 4000-8800</p>
                    </div>
                    <div className="border-l pl-4">
                        <p className="text-slate-500 text-[10px] uppercase font-bold">{isEn ? 'Help Email' : 'Correo de Ayuda'}</p>
                        <p className="text-slate-800 text-xs">pacientes@microlabs.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ClientPortal = ({ navigateTo, userRole }) => {
    const [previewId, setPreviewId] = useState(null);
    const [activeTab, setActiveTab] = useState('resultados');
    const [quoteDesc, setQuoteDesc] = useState('');
    const [quoteSubmitted, setQuoteSubmitted] = useState(false);
    const [language, setLanguage] = useState('es');

    const isCompany = userRole === 'client_company';
    const isDoctor = userRole === 'client_doctor';
    const isEn = language === 'en';

    const portalName = isCompany 
        ? (isEn ? 'B2B Corporate Portal' : 'Portal Corporativo B2B') 
        : isDoctor 
            ? (isEn ? 'Physician Portal' : 'Portal Médico') 
            : (isEn ? 'Patient Portal' : 'Portal Paciente');

    const welcomeName = isCompany ? 'Empresa S.A.' : isDoctor ? 'Dr. Roberto Vargas' : 'Juan Pérez';

    const mockResults = [
        { id: 'MC-2026-0506', date: '06/05/2026', analysis: 'Perfil Bioquímico', status: 'Aprobado', lab: 'Sede Central', details: 'Colesterol: 180 mg/dL\nGlucosa: 95 mg/dL', patientName: 'María Soto' },
        { id: 'MC-2026-0507', date: '07/05/2026', analysis: 'Cultivo Microbiológico', status: 'Pendiente', lab: 'Sede Central', details: 'Procesando en placa de Petri...', patientName: 'Carlos Ruiz' }
    ];

    const translations = {
        es: {
            welcome: 'Bienvenido',
            logout: 'Cerrar Sesión',
            tabResults: isCompany ? 'Resultados de Muestras' : 'Mis Resultados',
            tabSearch: 'Buscador de Pacientes',
            tabQuotes: 'Planes y Cotizaciones',
            tabBilling: 'Estado de Cuenta',
            tabHelp: 'Ayuda & FAQs',
            titleSearch: 'Búsqueda de Pacientes',
            descSearch: 'Busque los resultados analíticos de sus pacientes referidos ingresando el DNI o nombre.',
            placeholderSearch: 'Ingrese DNI o nombre del paciente...',
            btnSearch: 'Buscar',
            recentResults: 'Resultados Recientes (Sus pacientes)',
            btnViewPDF: 'Ver PDF',
            tabTrends: 'Gráficas y Tendencias',
            titleTrends: 'Tendencias Históricas',
            descTrends: 'Analice gráficamente la evolución de los parámetros clínicos.',
            selectParam: 'Seleccione un parámetro a graficar:',
            titleBilling: 'Estado de Cuenta',
            descBilling: 'Revise sus facturas pendientes y el historial de pagos.',
            pendingBalance: 'Saldo Pendiente',
            invoiceNumber: 'Nº Factura',
            invoiceDate: 'Fecha Emisión',
            invoiceAmount: 'Monto',
            invoiceStatus: 'Estado',
            statusPaid: 'Pagada',
            statusPending: 'Pendiente',
            titleResults: 'Mis Resultados',
            descResults: 'Consulte y descargue de forma segura sus informes de laboratorio.',
            hidePreview: 'Ocultar Previa',
            showPreview: 'Vista Previa',
            downloadPDF: 'Descargar PDF',
            locked: 'Bloqueada',
            underReview: 'En Revisión',
            summary: 'Resumen',
            client: 'Cliente',
            lab: 'Laboratorio',
            detail: 'Detalle',
            selectReport: 'Seleccione un informe',
            titleQuotes: 'Planes y Cotizaciones',
            descQuotes: 'Solicite programas analíticos o control de monitoreo en planta.',
            createQuoteReq: 'Crear Solicitud de Cotización',
            descQuoteReq: 'Describa el programa de monitoreo o los análisis requeridos:',
            placeholderQuoteReq: 'Ej. Requiero análisis microbiológico semanal en 4 puntos de la planta de lácteos, y análisis de agua bimensual...',
            btnSendQuote: 'Solicitar Cotización Formal',
            quoteSent: 'Solicitud Enviada',
            quoteSentDesc: 'Un asesor revisará sus requerimientos y preparará una cotización aplicando sus tarifas especiales si aplican.',
            historyQuotes: 'Historial de Cotizaciones',
            noQuotes: 'No tiene cotizaciones previas registradas en línea.',
        },
        en: {
            welcome: 'Welcome',
            logout: 'Log Out',
            tabResults: isCompany ? 'Sample Results' : 'My Results',
            tabSearch: 'Patient Search',
            tabQuotes: 'Plans & Quotes',
            tabBilling: 'Account Statement',
            tabHelp: 'Help & FAQs',
            titleSearch: 'Patient Search',
            descSearch: 'Search analytical results of your referred patients by entering DNI or name.',
            placeholderSearch: 'Enter patient DNI or name...',
            btnSearch: 'Search',
            recentResults: 'Recent Results (Your patients)',
            btnViewPDF: 'View PDF',
            tabTrends: 'Charts & Trends',
            titleTrends: 'Historical Trends',
            descTrends: 'Graphically analyze the evolution of clinical parameters.',
            selectParam: 'Select a parameter to graph:',
            titleBilling: 'Account Statement',
            descBilling: 'Review your pending invoices and payment history.',
            pendingBalance: 'Pending Balance',
            invoiceNumber: 'Invoice No.',
            invoiceDate: 'Issue Date',
            invoiceAmount: 'Amount',
            invoiceStatus: 'Status',
            statusPaid: 'Paid',
            statusPending: 'Pending',
            titleResults: 'My Results',
            descResults: 'Securely consult and download your laboratory reports.',
            hidePreview: 'Hide Preview',
            showPreview: 'Preview',
            downloadPDF: 'Download PDF',
            locked: 'Locked',
            underReview: 'Under Review',
            summary: 'Summary',
            client: 'Client',
            lab: 'Laboratory',
            detail: 'Detail',
            selectReport: 'Select a report',
            titleQuotes: 'Plans & Quotes',
            descQuotes: 'Request analytical programs or plant monitoring control.',
            createQuoteReq: 'Create Quote Request',
            descQuoteReq: 'Describe the monitoring program or required tests:',
            placeholderQuoteReq: 'E.g., I require weekly microbiological analysis in 4 points of the dairy plant, and bi-monthly water analysis...',
            btnSendQuote: 'Request Formal Quote',
            quoteSent: 'Request Sent',
            quoteSentDesc: 'An advisor will review your requirements and prepare a quote, applying your special rates if applicable.',
            historyQuotes: 'Quote History',
            noQuotes: 'You do not have previous online quote requests.',
        }
    };

    const t = translations[language];

    const downloadPDF = (req) => {
        const element = document.createElement('div');
        const analysisName = isEn 
            ? (req.analysis === 'Perfil Bioquímico' ? 'Biochemical Profile' : 'Microbiological Culture') 
            : req.analysis;
            
        const detailsText = isEn 
            ? req.details.replace('Colesterol', 'Cholesterol').replace('Glucosa', 'Glucose').replace('Procesando en placa de Petri', 'Processing in Petri dish')
            : req.details;

        element.innerHTML = `
            <div style="padding: 40px; font-family: sans-serif; color: #333;">
                <div style="border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between;">
                    <div>
                        <h1 style="margin: 0; color: #1e293b;">Microlabs LIMS</h1>
                        <p style="margin: 5px 0 0; color: #64748b;">${isEn ? 'Official Results Report' : 'Reporte Oficial de Resultados'}</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; color: #94a3b8;">${isEn ? 'REPORT' : 'INFORME'}</h2>
                        <p style="margin: 5px 0 0; font-family: monospace;">${req.id}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p><strong>${isEn ? 'Patient / Client' : 'Paciente / Cliente'}:</strong> ${req.patientName}</p>
                    <p><strong>${isEn ? 'Analysis' : 'Análisis'}:</strong> ${analysisName}</p>
                    <p><strong>${isEn ? 'Date' : 'Fecha'}:</strong> ${req.date}</p>
                    <p><strong>${isEn ? 'Laboratory' : 'Laboratorio'}:</strong> ${req.lab}</p>
                </div>
                
                <table style="width: 100%; text-align: left; border-collapse: collapse; margin-bottom: 40px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 10px 0;">${isEn ? 'Parameter / Detail' : 'Parámetro / Detalle'}</th>
                            <th style="padding: 10px 0;">${isEn ? 'Status' : 'Estado'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 15px 0; white-space: pre-wrap;">${detailsText}</td>
                            <td style="padding: 15px 0; font-weight: bold; color: #16a34a;">${isEn ? 'Approved & Validated' : 'Aprobado y Validado'}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="font-weight: bold; color: #1e293b; margin-bottom: 5px;">${isEn ? 'Authorized Digital Signature' : 'Firma Digital Autorizada'}</p>
                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">${isEn ? 'Document automatically generated by Microlabs LIMS. Valid without handwritten signature.' : 'Documento generado automáticamente por LIMS Microlabs. Válido sin firma manuscrita.'}</p>
                </div>
            </div>
        `;

        const opt = {
            margin: 0.5,
            filename: `Resultados_${req.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        if(window.html2pdf) {
            window.html2pdf().set(opt).from(element).save();
        } else {
            alert(isEn ? 'PDF service is not available. Please check your internet connection.' : 'El servicio de PDF no está disponible. Por favor, asegúrese de estar conectado a internet.');
        }
    };

    const [searchQuery, setSearchQuery] = useState('');

    const handleQuoteSubmit = (e) => {
        e.preventDefault();
        setQuoteSubmitted(true);
        setTimeout(() => {
            setQuoteSubmitted(false);
            setQuoteDesc('');
        }, 6000);
    };

    const filteredMockResults = mockResults.filter(req => 
        req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        req.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [selectedTrendParam, setSelectedTrendParam] = useState('Glucosa');
    
    // Mock data for trends
    const trendData = {
        'Glucosa': [
            { date: '01/01/2026', value: 110 },
            { date: '15/02/2026', value: 105 },
            { date: '10/03/2026', value: 98 },
            { date: '05/04/2026', value: 102 },
            { date: '06/05/2026', value: 95 },
        ],
        'Colesterol': [
            { date: '01/01/2026', value: 220 },
            { date: '15/02/2026', value: 210 },
            { date: '10/03/2026', value: 195 },
            { date: '05/04/2026', value: 185 },
            { date: '06/05/2026', value: 180 },
        ]
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {/* Topbar for client */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg"><FlaskConical size={20} className="text-white" /></div>
                    <span className="font-bold text-lg tracking-wide">Microlabs | {portalName}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-300 hidden md:inline">{t.welcome}, {welcomeName}</span>
                    
                    {/* Premium Language Selector Toggle */}
                    <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                        <button 
                            onClick={() => setLanguage('es')} 
                            className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all flex items-center gap-1 ${language === 'es' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            ESP 🇪🇸
                        </button>
                        <button 
                            onClick={() => setLanguage('en')} 
                            className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all flex items-center gap-1 ${language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            ENG 🇺🇸
                        </button>
                    </div>

                    <button onClick={() => navigateTo('login')} className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700">{t.logout}</button>
                </div>
            </div>

            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-10 flex gap-6 overflow-x-auto">
                    {isDoctor ? (
                        <button onClick={() => setActiveTab('buscador')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'buscador' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            {t.tabSearch}
                        </button>
                    ) : (
                        <button onClick={() => setActiveTab('resultados')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'resultados' || (!isDoctor && activeTab === 'buscador') ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            {t.tabResults}
                        </button>
                    )}

                    {isCompany && (
                        <>
                            <button onClick={() => setActiveTab('cotizaciones')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'cotizaciones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                {t.tabQuotes}
                            </button>
                            <button onClick={() => setActiveTab('facturas')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'facturas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                {t.tabBilling}
                            </button>
                        </>
                    )}
                    <button onClick={() => setActiveTab('tendencias')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'tendencias' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        {t.tabTrends}
                    </button>
                    <button onClick={() => setActiveTab('ayuda')} className={`py-4 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'ayuda' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        {t.tabHelp}
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                {isDoctor && (activeTab === 'buscador' || activeTab === 'resultados') && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{t.titleSearch}</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">{t.descSearch}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                            <div className="flex gap-4 mb-8 relative z-10">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input type="text" placeholder={t.placeholderSearch} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <button className="bg-blue-600 text-white font-bold px-6 rounded-xl hover:bg-blue-700 transition-colors">{t.btnSearch}</button>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-4">{t.recentResults}</h3>
                            <div className="space-y-3">
                                {filteredMockResults.map(req => {
                                    const analysisText = isEn ? (req.analysis === 'Perfil Bioquímico' ? 'Biochemical Profile' : 'Microbiological Culture') : req.analysis;
                                    return (
                                        <div key={req.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-blue-700">{req.patientName}</h4>
                                                <p className="text-sm text-slate-600">{analysisText} | {isEn ? 'Date' : 'Fecha'}: {req.date}</p>
                                            </div>
                                            <button onClick={() => downloadPDF(req)} className="bg-white border border-slate-200 text-blue-600 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50">{t.btnViewPDF}</button>
                                        </div>
                                    );
                                })}
                                {filteredMockResults.length === 0 && (
                                    <div className="text-center p-6 text-slate-500 italic">No se encontraron resultados para la búsqueda.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isCompany && activeTab === 'facturas' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{t.titleBilling}</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">{t.descBilling}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-slate-800">{t.pendingBalance}: <span className="text-red-500">¢125,000</span></h3>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-slate-500 border-b border-slate-100">
                                    <tr><th className="p-4">{t.invoiceNumber}</th><th className="p-4">{t.invoiceDate}</th><th className="p-4">{t.invoiceAmount}</th><th className="p-4">{t.invoiceStatus}</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td className="p-4 font-mono">FAC-26-008</td><td className="p-4">25/04/2026</td><td className="p-4 font-bold">¢125,000</td><td className="p-4"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">{t.statusPending}</span></td></tr>
                                    <tr className="bg-slate-50 border-t border-slate-100"><td className="p-4 font-mono">FAC-26-002</td><td className="p-4">15/03/2026</td><td className="p-4 font-bold">¢45,000</td><td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{t.statusPaid}</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!isDoctor && activeTab === 'resultados' && (
                    <>
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{t.titleResults}</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">{t.descResults}</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                {mockResults.map(req => {
                                    const isApproved = req.status === 'Aprobado';
                                    const isSelected = previewId === req.id;
                                    const statusText = isEn ? (isApproved ? 'Approved' : 'Pending') : req.status;
                                    const analysisText = isEn ? (req.analysis === 'Perfil Bioquímico' ? 'Biochemical Profile' : 'Microbiological Culture') : req.analysis;
                                    return (
                                        <div key={req.id} className={`bg-white rounded-2xl border ${isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 shadow-sm'} p-5 md:p-6 transition-all`}>
                                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-mono font-bold text-slate-800">{req.id}</span>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${isApproved ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {statusText}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-lg text-slate-700">{analysisText}</h3>
                                                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{req.date}</span>
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <button onClick={() => setPreviewId(isSelected ? null : req.id)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                                        <Eye size={16} /> {isSelected ? t.hidePreview : t.showPreview}
                                                    </button>
                                                    <button disabled={!isApproved} onClick={() => isApproved && downloadPDF(req)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isApproved ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                                        {isApproved ? <><Download size={16} /> {t.downloadPDF}</> : <><Lock size={16} /> {t.locked}</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="lg:col-span-1">
                                {previewId ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6 relative overflow-hidden min-h-[400px]">
                                        {mockResults.find(r => r.id === previewId)?.status !== 'Aprobado' && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
                                                <div className="text-3xl md:text-5xl font-extrabold text-slate-200/60 -rotate-45 whitespace-nowrap uppercase tracking-widest select-none">
                                                    {t.underReview}
                                                </div>
                                            </div>
                                        )}
                                        <div className="border-b border-slate-100 pb-4 mb-4 relative z-20 bg-white/80 backdrop-blur-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                        <FileText size={18} className="text-blue-600" /> {t.summary}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1">{previewId}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 relative z-20">
                                            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.client}</label><p className="font-medium text-slate-800">Cliente Test</p></div>
                                            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.lab}</label><p className="font-medium text-slate-800">Microlabs</p></div>
                                            <div className="pt-4 border-t border-slate-100">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t.detail}</label>
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-sm text-slate-700 whitespace-pre-wrap">
                                                    {isEn 
                                                        ? (mockResults.find(r => r.id === previewId)?.details.replace('Colesterol', 'Cholesterol').replace('Glucosa', 'Glucose').replace('Procesando en placa de Petri', 'Processing in Petri dish') || 'N/A')
                                                        : (mockResults.find(r => r.id === previewId)?.details || 'N/A')
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-10 h-full min-h-[400px]">
                                        <Eye size={48} className="text-slate-300 mb-4" />
                                        <h4 className="font-bold text-slate-500">{t.selectReport}</h4>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'tendencias' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{t.titleTrends}</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">{t.descTrends}</p>
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                                <label className="font-bold text-slate-700">{t.selectParam}</label>
                                <select 
                                    value={selectedTrendParam} 
                                    onChange={(e) => setSelectedTrendParam(e.target.value)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700"
                                >
                                    <option value="Glucosa">Glucosa (Glucose)</option>
                                    <option value="Colesterol">Colesterol (Cholesterol)</option>
                                </select>
                            </div>

                            <div className="h-[400px] w-full mt-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData[selectedTrendParam]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="value" 
                                            name={selectedTrendParam}
                                            stroke="#2563eb" 
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8, fill: '#1d4ed8' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cotizaciones' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{t.titleQuotes}</h1>
                            <p className="text-slate-500 mt-2 text-sm md:text-base">{t.descQuotes}</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <FileSpreadsheet size={120} />
                            </div>
                            {quoteSubmitted ? (
                                <div className="text-center py-10 animate-fade-in relative z-10">
                                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
                                        <Check size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{t.quoteSent}</h3>
                                    <p className="text-slate-500 max-w-md mx-auto">{t.quoteSentDesc}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleQuoteSubmit} className="space-y-6 relative z-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <FileSpreadsheet className="text-indigo-600" /> {t.createQuoteReq}
                                        </h3>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">{t.descQuoteReq}</label>
                                        <textarea
                                            required
                                            value={quoteDesc}
                                            onChange={(e) => setQuoteDesc(e.target.value)}
                                            rows="5"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                                            placeholder={t.placeholderQuoteReq}
                                        />
                                    </div>
                                    <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm">
                                        <Send size={18} /> {t.btnSendQuote}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <History className="text-slate-600" /> {t.historyQuotes}
                            </h3>
                            <div className="text-center py-8 text-slate-500 italic">{t.noQuotes}</div>
                        </div>
                    </div>
                )}

                {activeTab === 'ayuda' && (
                    <ClientHelpSection userRole={userRole} language={language} />
                )}
            </div>
        </div>
    );
};
