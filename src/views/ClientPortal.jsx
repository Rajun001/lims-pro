import React, { useState, useMemo } from 'react';
import { FlaskConical, Search, Eye, Download, Lock, FileText, FileSpreadsheet, Check, Send, History, HelpCircle, ChevronDown, ChevronUp, Info, Activity, CreditCard, DollarSign, Smartphone, X, AlertTriangle, CheckCircle2, Sparkles, ShieldAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import html2pdf from 'html2pdf.js';
import { SampleTraceabilityRoute } from '../components/SampleTraceabilityRoute';
import SamplingPlanWizard from '../components/SamplingPlanWizard';

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

const INDUSTRIAL_STANDARDS = {
  rtca: {
    nameEs: 'Reglamento Técnico Centroamericano (RTCA 67.04.50:08)',
    nameEn: 'Central American Technical Regulation (RTCA)',
    limits: {
      'Coliformes': { limitText: '0 UFC/100mL', max: 0, type: 'max' },
      'Escherichia': { limitText: '10 UFC/g o Ausente', max: 10, type: 'max' },
      'Aerobios': { limitText: 'm = 10,000 | M = 100,000 UFC/g', m: 10000, M: 100000, type: 'three-class' },
      'Salmonella': { limitText: 'Ausencia/25g', expected: 'Ausencia', type: 'qualitative' }
    }
  },
  icmsf: {
    nameEs: 'Comisión Internacional de Especificaciones Microbiológicas (ICMSF)',
    nameEn: 'International Commission on Microbiological Specifications (ICMSF)',
    limits: {
      'Coliformes': { limitText: '0 UFC/100mL', max: 0, type: 'max' },
      'Escherichia': { limitText: 'm = 100 | M = 500 UFC/g', m: 100, M: 500, type: 'three-class' },
      'Aerobios': { limitText: 'm = 50,000 | M = 250,000 UFC/g', m: 50000, M: 250000, type: 'three-class' },
      'Salmonella': { limitText: 'Ausencia/25g', expected: 'Ausencia', type: 'qualitative' }
    }
  },
  interno: {
    nameEs: 'Límites Internos de Planta (Aseguramiento de Calidad)',
    nameEn: 'Internal Plant Limits (Quality Assurance)',
    limits: {
      'Coliformes': { limitText: '0 UFC/100mL', max: 0, type: 'max' },
      'Escherichia': { limitText: 'm = 0 | M = 10 UFC/g', m: 0, M: 10, type: 'three-class' },
      'Aerobios': { limitText: 'm = 5,000 | M = 20,000 UFC/g', m: 5000, M: 20000, type: 'three-class' },
      'Salmonella': { limitText: 'Ausencia/25g', expected: 'Ausencia', type: 'qualitative' }
    }
  }
};

const parseClinicalDetails = (details) => {
    const params = [];
    if (!details) return params;

    const glucoseMatch = details.match(/(?:Glucosa|Glucose):\s*(\d+(?:\.\d+)?)/i);
    if (glucoseMatch) {
        const value = parseFloat(glucoseMatch[1]);
        params.push({
            name: 'Glucosa (Glucose)',
            value,
            unit: 'mg/dL',
            ranges: [
                { min: 0, max: 99.9 },
                { min: 100, max: 125.9 },
                { min: 126, max: 250 }
            ],
            currentStatus: value < 100 ? 0 : value < 126 ? 1 : 2,
            explanationEs: value < 100 
                ? 'Nivel de glucosa normal en ayunas. Indica un metabolismo saludable de carbohidratos.' 
                : value < 126 
                    ? 'Nivel de prediabetes en ayunas. Se recomienda revisar su dieta, realizar actividad física y consultar a su médico.'
                    : 'Nivel elevado de glucosa. Indica posible diabetes. Se aconseja realizar una prueba de Hemoglobina Glicosilada (HbA1c) y acudir a un médico.',
            explanationEn: value < 100 
                ? 'Normal fasting glucose level. Indicates healthy carbohydrate metabolism.' 
                : value < 126 
                    ? 'Fasting prediabetes level. It is recommended to review your diet, increase activity, and consult your doctor.'
                    : 'Elevated glucose level. Suggests potential diabetes. A confirmatory HbA1c test and medical consultation are recommended.'
        });
    }

    const cholesterolMatch = details.match(/(?:Colesterol|Cholesterol):\s*(\d+(?:\.\d+)?)/i);
    if (cholesterolMatch) {
        const value = parseFloat(cholesterolMatch[1]);
        params.push({
            name: 'Colesterol Total (Total Cholesterol)',
            value,
            unit: 'mg/dL',
            ranges: [
                { min: 0, max: 199.9 },
                { min: 200, max: 239.9 },
                { min: 240, max: 350 }
            ],
            currentStatus: value < 200 ? 0 : value < 240 ? 1 : 2,
            explanationEs: value < 200 
                ? 'Nivel deseable de colesterol. Ayuda a reducir el riesgo de enfermedades cardiovasculares.' 
                : value < 240 
                    ? 'Colesterol limítrofe alto. Se recomienda moderar el consumo de grasas saturadas y hacer ejercicio.'
                    : 'Nivel de colesterol alto. Aumenta el riesgo de placas arteriales y eventos cardiovasculares. Consulte a su médico.',
            explanationEn: value < 200 
                ? 'Desirable cholesterol level. Helps reduce cardiovascular risk.' 
                : value < 240 
                    ? 'Borderline high cholesterol. Moderating saturated fat intake and exercising is advised.'
                    : 'High cholesterol level. Increases risk of arterial plaques and cardiovascular events. Consult your physician.'
        });
    }

    const hemoglobinMatch = details.match(/(?:Hemoglobina|Hemoglobin):\s*(\d+(?:\.\d+)?)/i);
    if (hemoglobinMatch) {
        const value = parseFloat(hemoglobinMatch[1]);
        params.push({
            name: 'Hemoglobina (Hemoglobin)',
            value,
            unit: 'g/dL',
            ranges: [
                { min: 0, max: 11.9 },
                { min: 12, max: 17.5 },
                { min: 17.6, max: 25 }
            ],
            currentStatus: value < 12 ? 0 : value <= 17.5 ? 1 : 2,
            explanationEs: value < 12 
                ? 'Nivel bajo de hemoglobina (Anemia). Puede deberse a deficiencia de hierro u otras causas. Consulte a su médico.' 
                : value <= 17.5 
                    ? 'Nivel de hemoglobina normal. Indica una adecuada capacidad de transporte de oxígeno en la sangre.'
                    : 'Nivel elevado de hemoglobina. Puede estar asociado a deshidratación o factores pulmonares.',
            explanationEn: value < 12 
                ? 'Low hemoglobin level (Anemia). Often caused by iron deficiency. Medical consultation is recommended.' 
                : value <= 17.5 
                    ? 'Normal hemoglobin level. Indicates adequate oxygen-carrying capacity in the blood.'
                    : 'Elevated hemoglobin level. Can be associated with dehydration or chronic pulmonary conditions.'
        });
    }

    const plateletsMatch = details.match(/(?:Plaquetas|Platelets):\s*(\d{1,3},?\d{3})/i);
    if (plateletsMatch) {
        const rawVal = plateletsMatch[1].replace(/,/g, '');
        const value = parseInt(rawVal);
        params.push({
            name: 'Plaquetas (Platelets)',
            value,
            unit: '/uL',
            ranges: [
                { min: 0, max: 149999 },
                { min: 150000, max: 450000 },
                { min: 450001, max: 1000000 }
            ],
            currentStatus: value < 150000 ? 0 : value <= 450000 ? 1 : 2,
            explanationEs: value < 150000 
                ? 'Recuento plaquetario bajo. Aumenta el riesgo de sangrados espontáneos. Requiere valoración médica.' 
                : value <= 450000 
                    ? 'Recuento plaquetario normal. La coagulación sanguínea funciona de manera estándar.'
                    : 'Recuento plaquetario elevado. Puede ser reactivo a inflamaciones o infecciones recientes.',
            explanationEn: value < 150000 
                ? 'Low platelet count. Increases bleeding risk. Requires medical consultation.' 
                : value <= 450000 
                    ? 'Platelet count within reference range. Standard blood clotting function is expected.'
                    : 'Elevated platelet count. May be reactive to recent inflammation or infections.'
        });
    }

    return params;
};

const parseIndustrialDetails = (details) => {
    const params = [];
    if (!details) return params;

    const lines = details.split('\n');
    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const name = parts[0].trim();
            const valueStr = parts[1].trim();

            const numericMatch = valueStr.match(/([\d,]+)/);
            let valueNumeric = null;
            if (numericMatch) {
                valueNumeric = parseFloat(numericMatch[1].replace(/,/g, ''));
            }

            let isQualitative = false;
            let qualitativeVal = '';
            if (valueStr.toLowerCase().includes('ausen') || valueStr.toLowerCase().includes('absent')) {
                isQualitative = true;
                qualitativeVal = 'Ausencia';
            } else if (valueStr.toLowerCase().includes('presen') || valueStr.toLowerCase().includes('present')) {
                isQualitative = true;
                qualitativeVal = 'Presencia';
            }

            params.push({
                name,
                valueStr,
                valueNumeric,
                isQualitative,
                qualitativeVal
            });
        }
    });

    return params;
};

const evaluateIndustrialParameter = (param, standardKey) => {
    const std = INDUSTRIAL_STANDARDS[standardKey];
    if (!std) return { status: 'unknown', limitText: 'N/A' };

    const ruleKey = Object.keys(std.limits).find(k => param.name.toLowerCase().includes(k.toLowerCase()));
    if (!ruleKey) return { status: 'unknown', limitText: 'N/A' };

    const rule = std.limits[ruleKey];
    
    if (rule.type === 'qualitative') {
        if (param.isQualitative) {
            if (param.qualitativeVal === rule.expected) {
                return { status: 'compliant', limitText: rule.limitText, reasonEs: 'Cumple.', reasonEn: 'Complies.' };
            } else {
                return { status: 'critical', limitText: rule.limitText, reasonEs: '¡NO CUMPLE! Presencia.', reasonEn: 'NON-COMPLIANT! Presence.' };
            }
        } else {
            if (param.valueNumeric === 0) {
                return { status: 'compliant', limitText: rule.limitText, reasonEs: 'Cumple.', reasonEn: 'Complies.' };
            } else {
                return { status: 'critical', limitText: rule.limitText, reasonEs: '¡NO CUMPLE! Mayor a cero.', reasonEn: 'NON-COMPLIANT! Greater than zero.' };
            }
        }
    }

    if (rule.type === 'max') {
        if (param.valueNumeric !== null) {
            if (param.valueNumeric <= rule.max) {
                return { status: 'compliant', limitText: rule.limitText, reasonEs: `Cumple (<= ${rule.max}).`, reasonEn: `Complies (<= ${rule.max}).` };
            } else {
                return { status: 'critical', limitText: rule.limitText, reasonEs: `¡NO CUMPLE! Excede ${rule.max}.`, reasonEn: `NON-COMPLIANT! Exceeds ${rule.max}.` };
            }
        }
    }

    if (rule.type === 'three-class') {
        if (param.valueNumeric !== null) {
            if (param.valueNumeric <= rule.m) {
                return { status: 'compliant', limitText: rule.limitText, reasonEs: `Cumple (Aceptable).`, reasonEn: `Complies (Acceptable).` };
            } else if (param.valueNumeric <= rule.M) {
                return { status: 'borderline', limitText: rule.limitText, reasonEs: `Tolerable con desviación.`, reasonEn: `Borderline/Tolerable.` };
            } else {
                return { status: 'critical', limitText: rule.limitText, reasonEs: `¡RECHAZADO! Excede M.`, reasonEn: `REJECTED! Exceeds M.` };
            }
        }
    }

    if (param.isQualitative && param.qualitativeVal === 'Ausencia') {
        return { status: 'compliant', limitText: 'Ausencia', reasonEs: 'Cumple.', reasonEn: 'Complies.' };
    }

    return { status: 'unknown', limitText: 'N/A' };
};

const ResultsInterpreter = ({ report, language }) => {
    const [standard, setStandard] = useState('rtca');
    const [mode, setMode] = useState('patient');

    if (!report || report.status !== 'Aprobado') return null;

    const isEn = language === 'en';
    const analysisStr = (report?.analysis || '').toLowerCase();
    const isIndustrial = analysisStr.includes('agua') || analysisStr.includes('alimento') || analysisStr.includes('water') || analysisStr.includes('food') || report.sampleType === 'Alimentos' || report.sampleType === 'Agua / Hielo' || report.sampleType === 'Superficie' || report.sampleType === 'Agua Residual';

    if (isIndustrial) {
        const params = parseIndustrialDetails(report.details);
        const evaluatedParams = params.map(p => ({
            ...p,
            evaluation: evaluateIndustrialParameter(p, standard)
        }));

        const hasCritical = evaluatedParams.some(p => p.evaluation.status === 'critical');
        const hasBorderline = evaluatedParams.some(p => p.evaluation.status === 'borderline');
        const overallStatus = hasCritical ? 'critical' : hasBorderline ? 'borderline' : 'compliant';

        const standardName = isEn ? INDUSTRIAL_STANDARDS[standard].nameEn : INDUSTRIAL_STANDARDS[standard].nameEs;

        return (
            <div className="mt-6 border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-white shadow-xs relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center opacity-30 pointer-events-none">
                    <ShieldAlert size={48} className="text-slate-400" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4 relative z-10">
                    <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs md:text-sm">
                            <ShieldAlert className="text-indigo-600 shrink-0" size={18} />
                            {isEn ? 'Microbiological Quality Assurance (QA)' : 'Aseguramiento de Calidad Microbiológica'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            {isEn ? 'Automatic validation of safety and regulatory compliance parameters.' : 'Validación automatizada de inocuidad y cumplimiento normativo.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isEn ? 'Regulation:' : 'Normativa:'}</label>
                        <select 
                            value={standard} 
                            onChange={e => setStandard(e.target.value)}
                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-[10px] text-indigo-700 outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs cursor-pointer"
                        >
                            <option value="rtca">RTCA (Centroamérica)</option>
                            <option value="icmsf">ICMSF (Internacional)</option>
                            <option value="interno">Límites Internos Planta</option>
                        </select>
                    </div>
                </div>

                <div className={`p-4 rounded-xl border mb-5 flex items-start gap-3 relative z-10 ${
                    overallStatus === 'critical' 
                        ? 'bg-rose-50 border-rose-200 text-rose-800' 
                        : overallStatus === 'borderline'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                    <div className="shrink-0 mt-0.5">
                        {overallStatus === 'critical' ? <AlertTriangle size={20} className="text-rose-600" /> : overallStatus === 'borderline' ? <AlertTriangle size={20} className="text-amber-600" /> : <CheckCircle2 size={20} className="text-emerald-600" />}
                    </div>
                    <div>
                        <h5 className="font-extrabold text-xs">
                            {overallStatus === 'critical' 
                                ? (isEn ? 'CRITICAL DEV - LACK OF COMPLIANCE' : 'DESVIACIÓN CRÍTICA - PRODUCTO NO CONFORME')
                                : overallStatus === 'borderline'
                                    ? (isEn ? 'TOLERABLE DEVIATION - REVIEW PROCEDURES' : 'DESVIACIÓN TOLERABLE - BAJO OBSERVACIÓN')
                                    : (isEn ? 'FULL COMPLIANCE APPROVED' : 'CUMPLIMIENTO TOTAL APROBADO')
                            }
                        </h5>
                        <p className="text-[10px] mt-1 leading-relaxed opacity-90">
                            {isEn 
                                ? `Evaluated under ${standardName}.` 
                                : `Evaluado bajo la referencia del ${standardName}.`
                            }
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto border border-slate-150 rounded-xl mb-4 relative z-10">
                    <table className="w-full text-left text-[11px] whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 font-bold">
                            <tr>
                                <th className="p-3">{isEn ? 'Parameter' : 'Parámetro'}</th>
                                <th className="p-3">{isEn ? 'Result' : 'Resultado'}</th>
                                <th className="p-3">{isEn ? 'Limit' : 'Límite'}</th>
                                <th className="p-3">{isEn ? 'Compliance' : 'Evaluación'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {evaluatedParams.map((p, idx) => {
                                const status = p.evaluation.status;
                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-semibold text-slate-700">{p.name}</td>
                                        <td className="p-3 font-mono font-bold text-slate-800">{p.valueStr}</td>
                                        <td className="p-3 text-slate-500 font-mono">{p.evaluation.limitText}</td>
                                        <td className="p-3">
                                            {status === 'compliant' && (
                                                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[9px] border border-emerald-200">
                                                    {isEn ? 'COMPLIANT' : 'CUMPLE'}
                                                </span>
                                            )}
                                            {status === 'borderline' && (
                                                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[9px] border border-amber-200">
                                                    {isEn ? 'TOLERABLE' : 'TOLERABLE'}
                                                </span>
                                            )}
                                            {status === 'critical' && (
                                                <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[9px] border border-rose-200">
                                                    {isEn ? 'CRITICAL' : 'NO CUMPLE'}
                                                </span>
                                            )}
                                            {status === 'unknown' && (
                                                <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[9px] border border-slate-200">
                                                    {isEn ? 'N/A' : 'N/A'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-600 relative z-10">
                    <h5 className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-indigo-600" />
                        {isEn ? 'Quality Control Recommendations:' : 'Recomendaciones de Control de Inocuidad:'}
                    </h5>
                    <p className="leading-relaxed">
                        {overallStatus === 'critical' 
                            ? (isEn 
                                ? 'ATTENTION! Critical safety deviations detected. It is recommended to halt release of the affected lot, execute a sanitation shock on the production lines, and review Critical Control Points (HACCP).' 
                                : '¡ATENCIÓN! Se han detectado desviaciones críticas de inocuidad según los límites de la norma. Se recomienda detener la liberación del lote afectado, realizar un saneamiento de choque en las líneas de producción, y revisar los puntos críticos de control (APPCC/HACCP).')
                            : overallStatus === 'borderline'
                                ? (isEn 
                                    ? 'Result in marginal tolerance zone. It is suggested to review operational hygiene, monitor the cold chain, and schedule follow-up sampling.' 
                                    : 'Resultado en zona de tolerancia marginal. Se sugiere revisar la higiene operacional, monitorear la cadena de frío y programar un muestreo microbiológico de seguimiento.')
                                : (isEn 
                                    ? 'Excellent. All microbiological parameters are within the acceptable limits of the standard. Continue with the standard food safety plan.' 
                                    : 'Excelente. Todos los parámetros microbiológicos están dentro de los límites aceptables de la norma. Se recomienda continuar con el plan estándar de inocuidad.')
                        }
                    </p>
                </div>
            </div>
        );
    } else {
        const params = parseClinicalDetails(report.details);
        if (params.length === 0) return null;

        return (
            <div className="mt-6 border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-white shadow-xs relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center opacity-30 pointer-events-none">
                    <Sparkles size={48} className="text-slate-400" />
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 relative z-10">
                    <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs md:text-sm">
                            <Sparkles className="text-blue-600 shrink-0" size={18} />
                            {isEn ? 'Clinical Interpretation Module' : 'Módulo de Interpretación Clínica'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            {isEn ? 'Patient-friendly translations and reference ranges.' : 'Explicaciones sencillas y visualización gráfica de rangos.'}
                        </p>
                    </div>

                    <div className="flex bg-slate-200/80 rounded-lg p-0.5 border border-slate-300 shrink-0">
                        <button 
                            type="button"
                            onClick={() => setMode('patient')} 
                            className={`px-2 py-1 rounded text-[9px] font-extrabold transition-all border-0 ${mode === 'patient' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 bg-transparent'}`}
                        >
                            {isEn ? 'Patient' : 'Paciente'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setMode('clinical')} 
                            className={`px-2 py-1 rounded text-[9px] font-extrabold transition-all border-0 ${mode === 'clinical' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 bg-transparent'}`}
                        >
                            {isEn ? 'Medical' : 'Médico'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    {params.map((p, idx) => {
                        const status = p.currentStatus;
                        const r0 = p.ranges[0];
                        const r1 = p.ranges[1];
                        const r2 = p.ranges[2];

                        let percent = 50;
                        if (status === 0) {
                            const rangeSpan = r0.max - r0.min;
                            percent = rangeSpan > 0 ? ((p.value - r0.min) / rangeSpan) * 33.3 : 16.6;
                        } else if (status === 1) {
                            const rangeSpan = r1.max - r1.min;
                            percent = rangeSpan > 0 ? 33.3 + ((p.value - r1.min) / rangeSpan) * 33.3 : 50;
                        } else {
                            const rangeSpan = r2.max - r2.min;
                            const cappedVal = Math.min(p.value, r2.max);
                            percent = rangeSpan > 0 ? 66.6 + ((cappedVal - r2.min) / rangeSpan) * 33.3 : 83.3;
                        }
                        percent = Math.max(2, Math.min(98, percent));

                        return (
                            <div key={idx} className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="font-bold text-xs text-slate-700">{p.name}</span>
                                    <span className="font-mono text-sm font-extrabold text-slate-800">
                                        {p.value.toLocaleString()} <span className="text-xs text-slate-500 font-medium">{p.unit}</span>
                                    </span>
                                </div>

                                <div className="relative h-6 mt-4 mb-2">
                                    <div className="absolute inset-0 flex rounded-lg overflow-hidden border border-slate-250 shadow-inner">
                                        <div className="w-1/3 bg-emerald-500/80 flex items-center justify-center text-[8px] font-black text-emerald-950 border-r border-slate-200">
                                            {isEn ? 'NORMAL' : 'NORMAL'}
                                        </div>
                                        <div className="w-1/3 bg-amber-400/80 flex items-center justify-center text-[8px] font-black text-amber-950 border-r border-slate-200">
                                            {isEn ? 'BORDERLINE' : 'LIMÍTROFE'}
                                        </div>
                                        <div className="w-1/3 bg-rose-500/80 flex items-center justify-center text-[8px] font-black text-rose-950">
                                            {isEn ? 'HIGH' : 'ALTO'}
                                        </div>
                                    </div>

                                    <div 
                                        className="absolute -top-1.5 h-9 w-1 bg-slate-900 shadow-sm transition-all duration-500 ease-out"
                                        style={{ left: `${percent}%` }}
                                    >
                                        <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-slate-900 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <span>{isEn ? 'Low' : 'Bajo'}</span>
                                    <span>{isEn ? 'Optimal' : 'Óptimo'}</span>
                                    <span>{isEn ? 'High' : 'Alto'}</span>
                                </div>

                                <div className={`p-3 rounded-xl border text-[10px] leading-relaxed ${
                                    status === 0 ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : status === 1 ? 'bg-amber-50/50 border-amber-100 text-amber-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'
                                }`}>
                                    {mode === 'patient' ? (
                                        <>
                                            <span className="font-extrabold block mb-0.5">
                                                {isEn ? 'Summary for Patient:' : 'Resumen para Paciente:'}
                                            </span>
                                            {isEn ? p.explanationEn : p.explanationEs}
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-extrabold block mb-0.5">
                                                {isEn ? 'Clinical Reference Notes:' : 'Notas de Referencia Clínica:'}
                                            </span>
                                            {isEn 
                                                ? `Parameter verified against clinical reference intervals. Observed value: ${p.value} ${p.unit}. Clinical correlation recommended.`
                                                : `Parámetro analítico validado contra intervalos clínicos de referencia. Valor observado: ${p.value} ${p.unit}. Se sugiere correlación clínica con antecedentes del paciente.`
                                            }
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
};

const COMPANY_RESULTS_MOCK = [
    { 
        id: 'MC-2026-0509', 
        date: '09/05/2026', 
        analysis: 'Análisis Microbiológico de Agua Potable', 
        status: 'Aprobado', 
        lab: 'Laboratorio de Aguas', 
        details: 'Coliformes Totales: 0 UFC/100mL\nEscherichia coli: Ausente/100mL\nAerobios Mesófilos: 45 UFC/mL', 
        patientName: 'Planta Lácteos S.A.', 
        paymentStatus: 'Pagado',
        sampleType: 'Agua / Hielo'
    },
    { 
        id: 'MC-2026-0510', 
        date: '10/05/2026', 
        analysis: 'Control Microbiológico de Alimento (Queso Fresco)', 
        status: 'Aprobado', 
        lab: 'Laboratorio de Alimentos', 
        details: 'Aerobios Mesófilos: 25,000 UFC/g\nEscherichia coli: 15 UFC/g\nSalmonella spp.: Ausencia/25g\nListeria monocytogenes: Ausencia/25g', 
        patientName: 'Quesera del Norte R.L.', 
        paymentStatus: 'Pagado',
        sampleType: 'Alimentos'
    },
    { 
        id: 'MC-2026-0511', 
        date: '11/05/2026', 
        analysis: 'Monitoreo de Higiene de Superficies y Fajas', 
        status: 'Aprobado', 
        lab: 'Laboratorio de Microbiología Industrial', 
        details: 'Aerobios Mesófilos: 12 UFC/cm²\nStaphylococcus aureus: Ausente/cm²\nEnterobacterias: 0 UFC/cm²', 
        patientName: 'Industrias Cárnicas del Valle', 
        paymentStatus: 'Pagado',
        sampleType: 'Superficie'
    },
    { 
        id: 'MC-2026-0512', 
        date: '12/05/2026', 
        analysis: 'Control Físico-Químico de Aguas Residuales', 
        status: 'Pendiente', 
        lab: 'Laboratorio de Aguas', 
        details: 'Procesando DBO5 y DQO en incubadora analítica...', 
        patientName: 'Corporación Bebidas S.A.', 
        paymentStatus: 'Pagado',
        sampleType: 'Agua Residual'
    },
    { 
        id: 'MC-2026-0513', 
        date: '13/05/2026', 
        analysis: 'Ensayo de Estabilidad y Vida Útil en Alimento', 
        status: 'Aprobado', 
        lab: 'Laboratorio de Alimentos', 
        details: 'Aerobios Mesófilos: 8,500 UFC/g\nHongos y Levaduras: <10 UFC/g\npH: 4.5', 
        patientName: 'Consorcio Alimenticio Central', 
        paymentStatus: 'Pagado',
        sampleType: 'Alimentos'
    }
];

const CLINICAL_RESULTS_MOCK = [
    { id: 'MC-2026-0506', date: '06/05/2026', analysis: 'Perfil Bioquímico', status: 'Aprobado', lab: 'Sede Central', details: 'Colesterol: 180 mg/dL\nGlucosa: 95 mg/dL', patientName: 'María Soto', paymentStatus: 'Pagado', sampleType: 'Clínica' },
    { id: 'MC-2026-0507', date: '07/05/2026', analysis: 'Cultivo Microbiológico', status: 'Pendiente', lab: 'Sede Central', details: 'Procesando en placa de Petri...', patientName: 'Carlos Ruiz', paymentStatus: 'Pagado', sampleType: 'Clínica' },
    { id: 'MC-2026-0508', date: '08/05/2026', analysis: 'Hemograma Completo', status: 'Aprobado', lab: 'Sede Central', details: 'Hemoglobina: 14 g/dL\nPlaquetas: 250,000 /uL', patientName: 'Luis Rojas', paymentStatus: 'Pendiente', sampleType: 'Clínica' }
];

export const ClientPortal = ({ navigateTo, userRole, requests }) => {
    const [previewId, setPreviewId] = useState(null);
    const [activeTab, setActiveTab] = useState('resultados');
    const [quoteDesc, setQuoteDesc] = useState('');
    const [quoteSubmitted, setQuoteSubmitted] = useState(false);
    const [language, setLanguage] = useState('es');

    const isCompany = userRole === 'client_company';
    const isDoctor = userRole === 'client_doctor';
    const isEn = language === 'en';

    const portalName = isCompany 
        ? (isEn ? 'B2B Corporate Portal (Food, Water & Industry)' : 'Portal Corporativo B2B (Aguas, Alimentos e Industria)') 
        : isDoctor 
            ? (isEn ? 'Physician Portal' : 'Portal Médico') 
            : (isEn ? 'Patient Portal' : 'Portal Paciente');

    const welcomeName = isCompany ? 'Distribuidora Alimenticia S.A.' : isDoctor ? 'Dr. Roberto Vargas' : 'Juan Pérez';

    const [paidSampleIds, setPaidSampleIds] = useState([]);

    const resultsList = useMemo(() => {
        let baseList = [];
        if (requests && requests.length > 0) {
            const filteredReqs = requests.filter(r => {
                if (isCompany) {
                    return r.clientType === 'Industria' || r.sampleType === 'Alimentos' || r.sampleType === 'Agua / Hielo' || r.sampleType === 'Superficie' || r.sampleType === 'Agua Residual' || r.sampleType === 'Aire / Ambiental';
                } else {
                    return r.clientType === 'Clínica' || r.sampleType === 'Clínica' || (!r.clientType && !r.sampleType);
                }
            });
            if (filteredReqs.length > 0) {
                baseList = filteredReqs.map(r => ({
                    id: r.id,
                    date: r.requestDate ? (r.requestDate.toDate ? r.requestDate.toDate().toLocaleDateString() : new Date(r.requestDate).toLocaleDateString()) : 'N/A',
                    analysis: r.analysisRequested || 'Análisis',
                    status: r.status || 'Pendiente',
                    lab: isCompany ? 'Laboratorio Industrial / Aguas y Alimentos' : 'Sede Central Clínica',
                    details: r.results && Object.keys(r.results).length > 0 
                        ? Object.entries(r.results).map(([k, v]) => `${k}: ${v.value !== undefined ? v.value : v} ${v.unit || ''}`).join('\n') 
                        : (r.analysisCode ? `Código: ${r.analysisCode}` : 'En procesamiento analítico...'),
                    patientName: isCompany ? (r.clientName || 'Empresa Cliente') : (r.patientName || r.clientName || 'Paciente'),
                    paymentStatus: r.paymentStatus || 'Pagado',
                    sampleType: r.sampleType
                }));
            }
        }
        if (baseList.length === 0) {
            baseList = isCompany ? COMPANY_RESULTS_MOCK : CLINICAL_RESULTS_MOCK;
        }
        return baseList.map(r => paidSampleIds.includes(r.id) ? { ...r, paymentStatus: 'Pagado' } : r);
    }, [requests, isCompany, paidSampleIds]);

    // Payment and Checkout States
    const [checkoutSample, setCheckoutSample] = useState(null);
    const [selectedCurrency, setSelectedCurrency] = useState('CRC');
    const [payMethod, setPayMethod] = useState('sinpe');
    const [paymentForm, setPaymentForm] = useState({ cardName: '', cardNumber: '', cardExp: '', cardCvv: '', referenceNumber: '', voucherNumber: '' });
    const [isPaying, setIsPaying] = useState(false);
    const [paidSuccess, setPaidSuccess] = useState(false);

    const getSamplePrice = (analysisName = '') => {
        const name = String(analysisName || '');
        if (name.includes('Bioquímico') || name.includes('Biochemical')) return 25000;
        if (name.includes('Cultivo') || name.includes('Culture')) return 35000;
        return 15000;
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        setIsPaying(true);
        setTimeout(() => {
            setIsPaying(false);
            setPaidSuccess(true);
            if (checkoutSample?.id) {
                setPaidSampleIds(prev => [...prev, checkoutSample.id]);
            }
            setPaymentForm({ cardName: '', cardNumber: '', cardExp: '', cardCvv: '', referenceNumber: '', voucherNumber: '' });
        }, 2000);
    };

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
            titleTrends: isCompany ? 'Tendencias de Inocuidad y Calidad Microbiológica' : 'Tendencias de Parámetros Clínicos',
            descTrends: isCompany 
                ? 'Monitoreo histórico de recuentos bacterianos, agua de planta y fajas de producción por lote.' 
                : 'Evolución histórica de sus análisis clínicos a través del tiempo.',
            selectParam: isCompany ? 'Seleccione parámetro industrial a graficar:' : 'Seleccione examen clínico a graficar:',
            titleBilling: 'Estado de Cuenta',
            descBilling: 'Revise sus facturas pendientes y el historial de pagos.',
            pendingBalance: 'Saldo Pendiente',
            invoiceNumber: 'Nº Factura',
            invoiceDate: 'Fecha Emisión',
            invoiceAmount: 'Monto',
            invoiceStatus: 'Estado',
            statusPaid: 'Pagada',
            statusPending: 'Pendiente',
            titleResults: isCompany ? 'Resultados de Muestras e Inocuidad' : 'Mis Resultados',
            descResults: isCompany 
                ? 'Consulte y descargue de forma segura los certificados de análisis microbiológicos y fisicoquímicos.' 
                : 'Consulte y descargue de forma segura sus informes de laboratorio.',
            hidePreview: 'Ocultar Previa',
            showPreview: 'Vista Previa',
            downloadPDF: 'Descargar PDF',
            locked: 'Bloqueada',
            underReview: 'En Revisión',
            summary: 'Resumen',
            client: isCompany ? 'Empresa / Planta' : 'Paciente',
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
            paymentPending: 'Pendiente de Pago',
            paymentRequiredTitle: 'Pago Requerido',
            friendlyWarning: 'Estimado cliente, para visualizar el detalle y descargar el reporte oficial de este análisis, es necesario estar al día con los pagos correspondientes. Si ya realizó la transferencia, puede reportarla a facturacion@microlabs.com para habilitar su descarga de forma inmediata. ¡Agradecemos su comprensión!',
            checkoutTitle: 'Pasarela de Pago Segura',
            amountToPay: 'Monto a Pagar',
            payMethodTitle: 'Método de Pago',
            btnPayNow: 'Proceder al Pago',
            btnPaying: 'Procesando pago seguro...',
            paymentSuccessTitle: '¡Pago Realizado con Éxito!',
            paymentSuccessDesc: 'El pago ha sido acreditado en el sistema. Los resultados analíticos y el reporte oficial PDF han sido desbloqueados.',
            btnClose: 'Cerrar',
            currencyLabel: 'Moneda:',
            sinpeMovil: 'SINPE Móvil',
            creditCard: 'Tarjeta de Crédito',
            bankTransfer: 'Transferencia Bancaria',
            sinpeInstructions: 'Envíe el SINPE Móvil al número del laboratorio:',
            sinpePhone: '+506 7138-2750',
            sinpeRecipient: 'Destinatario: Laboratorio Microlabs S.A.',
            voucherPlaceholder: 'Número de comprobante (6 dígitos)',
            cardNameLabel: 'Nombre en la Tarjeta',
            cardNumberLabel: 'Número de Tarjeta',
            cardExpLabel: 'Vencimiento (MM/AA)',
            cardCvvLabel: 'CVV',
            bankInstructions: 'Realice la transferencia a cualquiera de nuestras cuentas IBAN:',
            bankColonAccount: 'Cuenta Colones (BAC Credomatic):',
            bankDollarAccount: 'Cuenta Dólares (BAC Credomatic):',
            referencePlaceholder: 'Número de referencia bancaria'
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
            titleTrends: isCompany ? 'Microbiological & Quality Trends' : 'Health & Clinical Trends',
            descTrends: isCompany 
                ? 'Historical tracking of bacterial counts, plant water, and production lines.' 
                : 'Historical evolution of clinical parameters over time.',
            selectParam: isCompany ? 'Select industrial parameter to chart:' : 'Select clinical test to chart:',
            titleBilling: 'Account Statement',
            descBilling: 'Review your pending invoices and payment history.',
            pendingBalance: 'Pending Balance',
            invoiceNumber: 'Invoice No.',
            invoiceDate: 'Issue Date',
            invoiceAmount: 'Amount',
            invoiceStatus: 'Status',
            statusPaid: 'Paid',
            statusPending: 'Pending',
            titleResults: isCompany ? 'Sample Results & Food Safety' : 'My Results',
            descResults: isCompany 
                ? 'Securely consult and download your microbiological and physicochemical certificates of analysis.' 
                : 'Securely consult and download your laboratory reports.',
            hidePreview: 'Hide Preview',
            showPreview: 'Preview',
            downloadPDF: 'Download PDF',
            locked: 'Locked',
            underReview: 'Under Review',
            summary: 'Summary',
            client: isCompany ? 'Company / Plant' : 'Patient',
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
            paymentPending: 'Payment Pending',
            paymentRequiredTitle: 'Payment Required',
            friendlyWarning: 'Dear client, to view the details and download the official report for this analysis, it is necessary to be up to date with the corresponding payments. If you have already made the bank transfer, you can report it to billing@microlabs.com to enable download immediately. Thank you for your understanding!',
            checkoutTitle: 'Secure Payment Gateway',
            amountToPay: 'Amount to Pay',
            payMethodTitle: 'Payment Method',
            btnPayNow: 'Pay Now',
            btnPaying: 'Processing secure payment...',
            paymentSuccessTitle: 'Payment Successful!',
            paymentSuccessDesc: 'The payment has been credited to the system. The analytical results and the official PDF report have been unlocked.',
            btnClose: 'Close',
            currencyLabel: 'Currency:',
            sinpeMovil: 'SINPE Mobile',
            creditCard: 'Credit Card',
            bankTransfer: 'Bank Transfer',
            sinpeInstructions: 'Send the SINPE Mobile to the laboratory phone number:',
            sinpePhone: '+506 7138-2750',
            sinpeRecipient: 'Recipient: Laboratorio Microlabs S.A.',
            voucherPlaceholder: 'Voucher number (6 digits)',
            cardNameLabel: 'Cardholder Name',
            cardNumberLabel: 'Card Number',
            cardExpLabel: 'Expiration (MM/YY)',
            cardCvvLabel: 'CVV',
            bankInstructions: 'Transfer the amount to any of our IBAN accounts:',
            bankColonAccount: 'Colones Account (BAC Credomatic):',
            bankDollarAccount: 'Dollars Account (BAC Credomatic):',
            referencePlaceholder: 'Bank reference number'
        }
    };

    const t = translations[language];

    const INDUSTRIAL_TREND_DATA = {
        'Aerobios Mesófilos (UFC/g)': [
            { date: '01/01/2026', value: 45000 },
            { date: '15/02/2026', value: 38000 },
            { date: '10/03/2026', value: 29000 },
            { date: '05/04/2026', value: 31000 },
            { date: '06/05/2026', value: 25000 },
        ],
        'Coliformes Totales (UFC/100mL)': [
            { date: '01/01/2026', value: 8 },
            { date: '15/02/2026', value: 4 },
            { date: '10/03/2026', value: 2 },
            { date: '05/04/2026', value: 0 },
            { date: '06/05/2026', value: 0 },
        ],
        'Escherichia coli (UFC/g)': [
            { date: '01/01/2026', value: 35 },
            { date: '15/02/2026', value: 22 },
            { date: '10/03/2026', value: 18 },
            { date: '05/04/2026', value: 12 },
            { date: '06/05/2026', value: 15 },
        ],
        'Monitoreo de Superficies (UFC/cm²)': [
            { date: '01/01/2026', value: 25 },
            { date: '15/02/2026', value: 18 },
            { date: '10/03/2026', value: 14 },
            { date: '05/04/2026', value: 10 },
            { date: '06/05/2026', value: 12 },
        ],
        'Turbidez de Agua (NTU)': [
            { date: '01/01/2026', value: 1.8 },
            { date: '15/02/2026', value: 1.4 },
            { date: '10/03/2026', value: 0.9 },
            { date: '05/04/2026', value: 0.6 },
            { date: '06/05/2026', value: 0.5 },
        ]
    };

    const CLINICAL_TREND_DATA = {
        'Glucosa (mg/dL)': [
            { date: '01/01/2026', value: 110 },
            { date: '15/02/2026', value: 105 },
            { date: '10/03/2026', value: 98 },
            { date: '05/04/2026', value: 102 },
            { date: '06/05/2026', value: 95 },
        ],
        'Colesterol Total (mg/dL)': [
            { date: '01/01/2026', value: 220 },
            { date: '15/02/2026', value: 210 },
            { date: '10/03/2026', value: 195 },
            { date: '05/04/2026', value: 185 },
            { date: '06/05/2026', value: 180 },
        ],
        'Hemoglobina (g/dL)': [
            { date: '01/01/2026', value: 12.8 },
            { date: '15/02/2026', value: 13.2 },
            { date: '10/03/2026', value: 13.8 },
            { date: '05/04/2026', value: 14.1 },
            { date: '06/05/2026', value: 14.0 },
        ],
        'Triglicéridos (mg/dL)': [
            { date: '01/01/2026', value: 180 },
            { date: '15/02/2026', value: 165 },
            { date: '10/03/2026', value: 150 },
            { date: '05/04/2026', value: 142 },
            { date: '06/05/2026', value: 135 },
        ]
    };

    const activeTrendData = isCompany ? INDUSTRIAL_TREND_DATA : CLINICAL_TREND_DATA;
    // Derive the initial selected param from isCompany to avoid setState-in-effect cascade
    const defaultTrendParam = Object.keys(activeTrendData)[0];
    const [selectedTrendParam, setSelectedTrendParam] = useState(defaultTrendParam);
    // Reset trend param when company mode switches — useMemo keeps it stable
    const safeTrendParam = Object.keys(activeTrendData).includes(selectedTrendParam)
        ? selectedTrendParam
        : defaultTrendParam;

    const downloadPDF = (req) => {
        const element = document.createElement('div');
        const isApproved = req?.status === 'Aprobado';
        const analysisName = isEn 
            ? (req?.analysis === 'Perfil Bioquímico' ? 'Biochemical Profile' : req?.analysis || 'Analysis') 
            : req?.analysis || 'Análisis';
            
        const rawDetails = String(req?.details || '');
        const detailsText = isEn 
            ? rawDetails.replace('Colesterol', 'Cholesterol').replace('Glucosa', 'Glucose').replace('Procesando en placa de Petri', 'Processing in Petri dish')
            : rawDetails;

        const statusTextPDF = isApproved 
            ? (isEn ? 'Approved & Validated' : 'Aprobado y Validado')
            : (isEn ? 'Preliminary / Pending Validation' : 'Reporte Preliminar / Pendiente');
        const statusColorPDF = isApproved ? '#16a34a' : '#d97706';

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
                    <p><strong>${isCompany ? (isEn ? 'Company / Plant' : 'Empresa / Planta') : (isEn ? 'Patient' : 'Paciente')}:</strong> ${req.patientName}</p>
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
                            <td style="padding: 15px 0; font-weight: bold; color: ${statusColorPDF};">${statusTextPDF}</td>
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

        try {
            const html2pdfFn = html2pdf.default || html2pdf;
            html2pdfFn().set(opt).from(element).save();
        } catch (error) {
            console.error("PDF generation error:", error);
            alert(isEn ? 'PDF service is not available.' : 'El servicio de PDF no está disponible.');
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

    const filteredMockResults = resultsList.filter(req => 
        (req.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (req.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.analysis || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                    const isUnpaid = req.paymentStatus === 'Pendiente';
                                    const analysisText = isEn ? (req.analysis === 'Perfil Bioquímico' ? 'Biochemical Profile' : 'Microbiological Culture') : req.analysis;
                                    return (
                                        <div key={req.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-blue-700">{req.patientName}</h4>
                                                <p className="text-sm text-slate-600">{analysisText} | {isEn ? 'Date' : 'Fecha'}: {req.date}</p>
                                            </div>
                                            {isUnpaid ? (
                                                <button onClick={() => setCheckoutSample(req)} className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-amber-100 flex items-center gap-1.5 transition-all cursor-pointer">
                                                    <Lock size={14} /> {t.paymentPending}
                                                </button>
                                            ) : (
                                                <button onClick={() => downloadPDF(req)} className="bg-white border border-slate-200 text-blue-600 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50 cursor-pointer">{t.btnViewPDF}</button>
                                            )}
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
                                {resultsList.map(req => {
                                    const isApproved = req.status === 'Aprobado';
                                    const isSelected = previewId === req.id;
                                    const isUnpaid = req.paymentStatus === 'Pendiente';
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
                                                        {isUnpaid && (
                                                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                                                                <Lock size={10} /> {t.paymentPending}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-lg text-slate-700">{analysisText}</h3>
                                                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{req.date}</span>
                                                    </p>
                                                    <div className="mt-3 pt-2.5 border-t border-slate-100 max-w-sm">
                                                        <SampleTraceabilityRoute 
                                                            request={{
                                                                id: req.id,
                                                                analysisRequested: req.analysis,
                                                                status: req.status === 'Aprobado' ? 'Completado' : 'En Proceso',
                                                                requestDate: req.date,
                                                                clientType: isCompany ? 'Industria' : 'Clínica',
                                                                clientName: req.patientName
                                                            }} 
                                                            compact={true} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <button onClick={() => setPreviewId(isSelected ? null : req.id)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                                        <Eye size={16} /> {isSelected ? t.hidePreview : t.showPreview}
                                                    </button>
                                                    {isUnpaid ? (
                                                        <button onClick={() => setCheckoutSample(req)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all cursor-pointer">
                                                            <Lock size={16} /> {t.paymentPending}
                                                        </button>
                                                    ) : (
                                                        <button disabled={!isApproved} onClick={() => isApproved && downloadPDF(req)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isApproved ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                                            {isApproved ? <><Download size={16} /> {t.downloadPDF}</> : <><Lock size={16} /> {t.locked}</>}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="lg:col-span-1">
                                {previewId ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6 relative overflow-hidden min-h-[400px]">
                                        {resultsList.find(r => r.id === previewId)?.status !== 'Aprobado' && (
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
                                        {resultsList.find(r => r.id === previewId)?.paymentStatus === 'Pendiente' ? (
                                            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 text-center mt-6 animate-fade-in relative z-20 space-y-4">
                                                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                    <Lock size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-amber-800 text-sm mb-2">{t.paymentRequiredTitle}</h4>
                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        {t.friendlyWarning}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => setCheckoutSample(resultsList.find(r => r.id === previewId))}
                                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-0"
                                                >
                                                    <Lock size={14} /> {isEn ? 'Pay Online to Unlock' : 'Pagar en Línea para Desbloquear'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 relative z-20">
                                                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.client}</label><p className="font-medium text-slate-800">{resultsList.find(r => r.id === previewId)?.patientName || 'Cliente Test'}</p></div>
                                                <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.lab}</label><p className="font-medium text-slate-800">Microlabs</p></div>
                                                <div className="pt-4 border-t border-slate-100">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t.detail}</label>
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-sm text-slate-700 whitespace-pre-wrap">
                                                        {isEn 
                                                            ? (String(resultsList.find(r => r.id === previewId)?.details || '').replace('Colesterol', 'Cholesterol').replace('Glucosa', 'Glucose').replace('Procesando en placa de Petri', 'Processing in Petri dish') || 'N/A')
                                                            : (resultsList.find(r => r.id === previewId)?.details || 'N/A')
                                                        }
                                                    </div>
                                                </div>
                                                <ResultsInterpreter report={resultsList.find(r => r.id === previewId)} language={language} />
                                            </div>
                                        )}
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
                                    value={safeTrendParam} 
                                    onChange={(e) => setSelectedTrendParam(e.target.value)}
                                    className={`px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 outline-none font-bold ${
                                        isCompany ? 'focus:ring-emerald-500 text-emerald-800' : 'focus:ring-blue-500 text-blue-700'
                                    }`}
                                >
                                    {Object.keys(activeTrendData).map((paramKey) => (
                                        <option key={paramKey} value={paramKey}>{paramKey}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="h-[400px] w-full mt-8">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <LineChart data={activeTrendData[safeTrendParam] || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                                            name={safeTrendParam}
                                            stroke={isCompany ? '#059669' : '#2563eb'} 
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: isCompany ? '#059669' : '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8, fill: isCompany ? '#047857' : '#1d4ed8' }}
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
                            <p className="text-slate-500 mt-2 text-sm md:text-base">Configure su plan de muestreo microbiológico a la medida y obtenga una proforma estimada al instante.</p>
                        </div>

                        {/* Diseñador Asistido de Planes de Muestreo e Inocuidad para Clientes B2B / Hoteles */}
                        <SamplingPlanWizard />

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
                                            <FileSpreadsheet className="text-indigo-600" /> Solicitud Personalizada Adicional
                                        </h3>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">{t.descQuoteReq}</label>
                                        <textarea
                                            required
                                            value={quoteDesc}
                                            onChange={(e) => setQuoteDesc(e.target.value)}
                                            rows="4"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                                            placeholder={t.placeholderQuoteReq}
                                        />
                                    </div>
                                    <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm cursor-pointer">
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

                            {/* Secure Checkout Modal */}
                            {checkoutSample && (
                                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative max-h-[90vh]">
                                        {/* Header */}
                                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <Lock size={16} className="text-blue-600" />
                                                <h3 className="font-bold text-slate-800 text-sm">{t.checkoutTitle}</h3>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setCheckoutSample(null);
                                                    setPaidSuccess(false);
                                                }} 
                                                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-0 bg-transparent"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {paidSuccess ? (
                                            /* Payment Success Screen */
                                            <div className="p-8 text-center animate-fade-in flex flex-col items-center justify-center space-y-4 flex-1">
                                                <div className="w-14 h-14 bg-green-50 border border-green-100 text-green-500 rounded-full flex items-center justify-center shadow-xs">
                                                    <Check size={28} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800">{t.paymentSuccessTitle}</h3>
                                                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{t.paymentSuccessDesc}</p>
                                                <button 
                                                    onClick={() => {
                                                        setCheckoutSample(null);
                                                        setPaidSuccess(false);
                                                    }}
                                                    className="mt-6 px-6 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer border-0"
                                                >
                                                    {t.btnClose}
                                                </button>
                                            </div>
                                        ) : (
                                            /* Payment Methods & Checkout Forms */
                                            <form onSubmit={handlePaymentSubmit} className="flex-1 flex flex-col min-h-0">
                                                {/* Price & Currency Bar */}
                                                <div className="p-4 flex justify-between items-center bg-blue-50/50 border-b border-slate-100 shrink-0">
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.amountToPay}</div>
                                                        <div className="text-[11px] text-slate-600 font-semibold truncate max-w-[200px]" title={checkoutSample.analysis}>
                                                            {isEn && checkoutSample.analysis === 'Perfil Bioquímico' ? 'Biochemical Profile' : isEn && checkoutSample.analysis === 'Cultivo Microbiológico' ? 'Microbiological Culture' : checkoutSample.analysis}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 items-center">
                                                        <div className="font-mono font-extrabold text-sm text-blue-700">
                                                            {selectedCurrency === 'CRC' 
                                                                ? `₡${getSamplePrice(checkoutSample.analysis).toLocaleString()}` 
                                                                : `$${Math.round(getSamplePrice(checkoutSample.analysis) / 515)}`
                                                            }
                                                        </div>
                                                        <div className="flex bg-slate-200/80 rounded-lg p-0.5 border border-slate-350 shrink-0">
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSelectedCurrency('CRC')} 
                                                                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-all border-0 ${selectedCurrency === 'CRC' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 bg-transparent'}`}
                                                            >
                                                                CRC
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSelectedCurrency('USD')} 
                                                                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-all border-0 ${selectedCurrency === 'USD' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 bg-transparent'}`}
                                                            >
                                                                USD
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tabs Selector */}
                                                <div className="flex border-b border-slate-100 shrink-0 bg-slate-50/50">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setPayMethod('sinpe')}
                                                        className={`flex-1 py-2.5 text-[10px] font-extrabold border-0 border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer bg-transparent ${payMethod === 'sinpe' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        <Smartphone size={12} /> {t.sinpeMovil}
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setPayMethod('card')}
                                                        className={`flex-1 py-2.5 text-[10px] font-extrabold border-0 border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer bg-transparent ${payMethod === 'card' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        <CreditCard size={12} /> {t.creditCard}
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setPayMethod('transfer')}
                                                        className={`flex-1 py-2.5 text-[10px] font-extrabold border-0 border-b-2 flex items-center justify-center gap-1 transition-colors cursor-pointer bg-transparent ${payMethod === 'transfer' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        <DollarSign size={12} /> {t.bankTransfer}
                                                    </button>
                                                </div>

                                                {/* Form Fields container */}
                                                <div className="p-5 flex-1 overflow-y-auto min-h-0 bg-white">
                                                    {payMethod === 'sinpe' && (
                                                        <div className="space-y-4 animate-fade-in">
                                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                                                                <p className="font-bold text-slate-700 mb-1">{t.sinpeInstructions}</p>
                                                                <p className="font-mono font-bold text-sm text-blue-700">{t.sinpePhone}</p>
                                                                <p className="mt-0.5">{t.sinpeRecipient}</p>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{isEn ? 'Voucher Reference (6 digits)' : 'Número de Comprobante (6 dígitos)'}</label>
                                                                <input 
                                                                    type="text" 
                                                                    required 
                                                                    maxLength="6"
                                                                    placeholder={t.voucherPlaceholder}
                                                                    value={paymentForm.voucherNumber} 
                                                                    onChange={e => setPaymentForm({ ...paymentForm, voucherNumber: e.target.value.replace(/\D/g, '') })} 
                                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {payMethod === 'card' && (
                                                        <div className="space-y-3 animate-fade-in">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t.cardNameLabel}</label>
                                                                <input 
                                                                    type="text" 
                                                                    required 
                                                                    placeholder="Ej. Juan Pérez"
                                                                    value={paymentForm.cardName} 
                                                                    onChange={e => setPaymentForm({ ...paymentForm, cardName: e.target.value })} 
                                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t.cardNumberLabel}</label>
                                                                <input 
                                                                    type="text" 
                                                                    required 
                                                                    placeholder="0000 0000 0000 0000"
                                                                    maxLength="19"
                                                                    value={paymentForm.cardNumber} 
                                                                    onChange={e => {
                                                                        let v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                                                        setPaymentForm({ ...paymentForm, cardNumber: v });
                                                                    }} 
                                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t.cardExpLabel}</label>
                                                                    <input 
                                                                        type="text" 
                                                                        required 
                                                                        placeholder="MM/AA"
                                                                        maxLength="5"
                                                                        value={paymentForm.cardExp} 
                                                                        onChange={e => {
                                                                            let v = e.target.value.replace(/\D/g, '');
                                                                            if (v.length > 2) v = v.substring(0,2) + '/' + v.substring(2,4);
                                                                            setPaymentForm({ ...paymentForm, cardExp: v });
                                                                        }} 
                                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{t.cardCvvLabel}</label>
                                                                    <input 
                                                                        type="password" 
                                                                        required 
                                                                        placeholder="123"
                                                                        maxLength="3"
                                                                        value={paymentForm.cardCvv} 
                                                                        onChange={e => setPaymentForm({ ...paymentForm, cardCvv: e.target.value.replace(/\D/g, '') })} 
                                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {payMethod === 'transfer' && (
                                                        <div className="space-y-4 animate-fade-in">
                                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-600 space-y-2 leading-relaxed">
                                                                <p className="font-bold text-slate-700 text-[11px]">{t.bankInstructions}</p>
                                                                <div>
                                                                    <p className="font-bold text-slate-600">{t.bankColonAccount}</p>
                                                                    <p className="font-mono text-blue-700 bg-white p-1 rounded border text-[9px] mt-0.5 select-all">CR68010200009384728103</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-600">{t.bankDollarAccount}</p>
                                                                    <p className="font-mono text-blue-700 bg-white p-1 rounded border text-[9px] mt-0.5 select-all">CR12010200009847291048</p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{isEn ? 'Reference Number' : 'Número de Referencia'}</label>
                                                                <input 
                                                                    type="text" 
                                                                    required 
                                                                    placeholder={t.referencePlaceholder}
                                                                    value={paymentForm.referenceNumber} 
                                                                    onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} 
                                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Submit Button */}
                                                <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                                                    <button 
                                                        type="submit" 
                                                        disabled={isPaying}
                                                        className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-0"
                                                    >
                                                        {isPaying ? (
                                                            <>
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                {t.btnPaying}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Lock size={12} /> {t.btnPayNow}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                };
