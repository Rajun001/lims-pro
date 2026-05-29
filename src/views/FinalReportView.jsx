import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft, Printer } from 'lucide-react';
import { Logo, BarcodeDisplay } from '../components/UI';

const RangeIndicator = ({ value, min, max, reportLang }) => {
    const val = parseFloat(value);
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    
    if (isNaN(val) || isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) {
        return null;
    }

    const range = maxVal - minVal;
    const viewMin = minVal - range * 0.25;
    const viewMax = maxVal + range * 0.25;
    const totalViewRange = viewMax - viewMin;
    
    const normalStartPercent = ((minVal - viewMin) / totalViewRange) * 100;
    const normalEndPercent = ((maxVal - viewMin) / totalViewRange) * 100;
    
    let valPercent = ((val - viewMin) / totalViewRange) * 100;
    valPercent = Math.max(0, Math.min(100, valPercent));
    
    const isLow = val < minVal;
    const isHigh = val > maxVal;
    
    let statusText = reportLang === 'es' ? 'Normal' : 'Normal';
    let statusClass = 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (isLow) {
        statusText = reportLang === 'es' ? 'Bajo' : 'Low';
        statusClass = 'text-blue-600 bg-blue-50 border-blue-100';
    } else if (isHigh) {
        statusText = reportLang === 'es' ? 'Alto' : 'High';
        statusClass = 'text-red-600 bg-red-50 border-red-100';
    }
    
    return (
        <div className="w-full flex flex-col gap-1 mt-1.5 print:hidden select-none">
            <div className="relative h-1.5 bg-slate-100 rounded-full border border-slate-200/60 overflow-hidden">
                <div 
                    className="absolute h-full bg-emerald-500/20"
                    style={{
                        left: `${normalStartPercent}%`,
                        width: `${normalEndPercent - normalStartPercent}%`
                    }}
                />
                <div 
                    className={`absolute top-0 bottom-0 w-0.5 ${isLow ? 'bg-blue-500' : isHigh ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ left: `${valPercent}%` }}
                />
            </div>
            <div className="relative h-3.5 flex justify-between text-[9px] font-semibold text-slate-400 font-mono px-0.5">
                <span>Min: {minVal}</span>
                <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-extrabold uppercase border ${statusClass}`}>
                    {statusText} ({val})
                </span>
                <span>Max: {maxVal}</span>
            </div>
        </div>
    );
};

const getHemogramSection = (testCode) => {
    const code = testCode.toLowerCase();
    if (code.includes('wbc') || code.includes('neu') || code.includes('lym') || code.includes('mon') || code.includes('eos') || code.includes('bas')) {
        return 'white';
    }
    if (code.includes('rbc') || code.includes('hgb') || code.includes('hct') || code.includes('mcv') || code.includes('mch') || code.includes('mchc') || code.includes('rdw')) {
        return 'red';
    }
    if (code.includes('plt') || code.includes('mvp') || code.includes('mpv') || code.includes('pdw') || code.includes('pct') || code.includes('plaqueta')) {
        return 'platelets';
    }
    return 'other';
};

const getChemistrySection = (testCode) => {
    const code = testCode.toLowerCase();
    if (code.includes('glucosa') || code.includes('glicemia') || code.includes('glu') || code.includes('gli')) {
        return 'general';
    }
    if (code.includes('colesterol') || code.includes('hdl') || code.includes('ldl') || code.includes('vldl') || code.includes('triglic') || code.includes('lipido') || code.includes('lip') || code.includes('ct/hdl')) {
        return 'lipids';
    }
    if (code.includes('creatinina') || code.includes('urea') || code.includes('ureic') || code.includes('nu/') || code.includes('urom') || code.includes('úrico') || code.includes('urico') || code.includes('bun')) {
        return 'renal';
    }
    if (code.includes('protein') || code.includes('album') || code.includes('globul') || code.includes('a/g')) {
        return 'proteins';
    }
    if (code.includes('ast') || code.includes('alt') || code.includes('tgo') || code.includes('tgp') || code.includes('fosfata') || code.includes('alp') || code.includes('ggt') || code.includes('ldh') || code.includes('dhl') || code.includes('amilasa') || code.includes('lipasa')) {
        return 'hepatic';
    }
    if (code.includes('sodio') || code.includes('potasio') || code.includes('cloro') || code.includes('cloruro') || code.includes('calcio') || code.includes('fosfor') || code.includes('fósfor') || code.includes('magnesio') || code.includes('na/') || code.includes('electrol') || code.includes('na/k') || code.includes('k+') || code.includes('na+')) {
        return 'electrolytes';
    }
    return 'other';
};

const getUrinalysisSection = (testCode) => {
    const code = testCode.toLowerCase();
    if (code.includes('color') || code.includes('aspect') || code.includes('densidad') || code.includes('density')) {
        return 'physical';
    }
    if (code.includes('ph') || code.includes('nitrito') || code.includes('proteina') || code.includes('proteína') || code.includes('glucosa') || code.includes('cetona') || code.includes('urobili') || code.includes('bilirru') || code.includes('tira') || (code.includes('leucocito') && (code.includes('tira') || code.includes('reactiva'))) || (code.includes('sangre') && code.includes('oculta'))) {
        return 'biochemical';
    }
    return 'microscopic';
};

const getMicrobiologyData = (request) => {
    if (request.microbiologyAST) {
        return {
            pathogen: request.microbiologyAST.pathogen || request.microbiologyAST.bacteriaIdentified || '',
            concentration: request.microbiologyAST.concentration || '',
            antibiotics: request.microbiologyAST.antibiotics || (request.microbiologyAST.jsonResults ? JSON.parse(request.microbiologyAST.jsonResults) : [])
        };
    }
    if (request.antibiogram) {
        return {
            pathogen: request.antibiogram.pathogen || request.antibiogram.bacteriaIdentified || '',
            concentration: request.antibiogram.concentration || '',
            antibiotics: request.antibiogram.antibiotics || (request.antibiogram.jsonResults ? JSON.parse(request.antibiogram.jsonResults) : [])
        };
    }
    return null;
};

const checkValueBounds = (value, min, max) => {
    const val = parseFloat(value);
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    if (isNaN(val) || isNaN(minVal) || isNaN(maxVal)) return 'normal';
    if (val < minVal) return 'low';
    if (val > maxVal) return 'high';
    return 'normal';
};

const groupResults = (results, type, reportLang) => {
    const sections = {};
    const isHemogram = type.toLowerCase().includes('hemograma');
    const isChemistry = type.toLowerCase().includes('química') || type.toLowerCase().includes('quimica') || type.toLowerCase().includes('bioquímico') || type.toLowerCase().includes('bioquimico');
    const isUrinalysis = type.toLowerCase().includes('orina') || type.toLowerCase().includes('ego');
    
    results.forEach(res => {
        let sectionKey = 'general';
        let sectionName = reportLang === 'es' ? 'Resultados Generales' : 'General Results';
        
        if (isHemogram) {
            const sec = getHemogramSection(res.testCode);
            if (sec === 'white') {
                sectionKey = 'white';
                sectionName = reportLang === 'es' ? 'Fórmula Blanca (BC-5000)' : 'White Blood Cells (BC-5000)';
            } else if (sec === 'red') {
                sectionKey = 'red';
                sectionName = reportLang === 'es' ? 'Fórmula Roja' : 'Red Blood Cells';
            } else if (sec === 'platelets') {
                sectionKey = 'platelets';
                sectionName = reportLang === 'es' ? 'Análisis de Plaquetas' : 'Platelet Analysis';
            } else {
                sectionKey = 'other';
                sectionName = reportLang === 'es' ? 'Otros Parámetros' : 'Other Parameters';
            }
        } else if (isChemistry) {
            const sec = getChemistrySection(res.testCode);
            if (sec === 'general') {
                sectionKey = 'general';
                sectionName = reportLang === 'es' ? 'Química Sanguínea (NX600)' : 'Blood Chemistry (NX600)';
            } else if (sec === 'lipids') {
                sectionKey = 'lipids';
                sectionName = reportLang === 'es' ? 'Perfil de Lípidos (NX600)' : 'Lipid Profile (NX600)';
            } else if (sec === 'renal') {
                sectionKey = 'renal';
                sectionName = reportLang === 'es' ? 'Perfil Renal (NX600)' : 'Renal Profile (NX600)';
            } else if (sec === 'proteins') {
                sectionKey = 'proteins';
                sectionName = reportLang === 'es' ? 'Proteínas en Sangre (NX600)' : 'Blood Proteins (NX600)';
            } else if (sec === 'hepatic') {
                sectionKey = 'hepatic';
                sectionName = reportLang === 'es' ? 'Perfil Hepático (NX600)' : 'Hepatic Profile (NX600)';
            } else if (sec === 'electrolytes') {
                sectionKey = 'electrolytes';
                sectionName = reportLang === 'es' ? 'Electrólitos (NX600)' : 'Electrolytes (NX600)';
            } else {
                sectionKey = 'other';
                sectionName = reportLang === 'es' ? 'Otros Parámetros' : 'Other Parameters';
            }
        } else if (isUrinalysis) {
            const sec = getUrinalysisSection(res.testCode);
            if (sec === 'physical') {
                sectionKey = 'physical';
                sectionName = reportLang === 'es' ? 'Análisis Físico' : 'Physical Analysis';
            } else if (sec === 'biochemical') {
                sectionKey = 'biochemical';
                sectionName = reportLang === 'es' ? 'Análisis Químico / Bioquímico' : 'Chemical / Biochemical Analysis';
            } else if (sec === 'microscopic') {
                sectionKey = 'microscopic';
                sectionName = reportLang === 'es' ? 'Análisis Microscópico del Sedimento' : 'Microscopic Sediment Analysis';
            } else {
                sectionKey = 'other';
                sectionName = reportLang === 'es' ? 'Otros Parámetros' : 'Other Parameters';
            }
        }
        
        if (!sections[sectionKey]) {
            sections[sectionKey] = {
                name: sectionName,
                items: []
            };
        }
        sections[sectionKey].items.push(res);
    });
    
    return sections;
};

export const FinalReportView = ({ request, navigateTo, labInfo, availableAnalyses = [], db }) => {
    const [reportLang, setReportLang] = useState('es');
    const [historicalData, setHistoricalData] = useState([]);
    const [chartTestName, setChartTestName] = useState('');

    const isIndustrial = request?.clientType?.toLowerCase().includes('industria') || 
                         request?.sampleType?.toLowerCase().includes('alimento') || 
                         request?.sampleType?.toLowerCase().includes('superficie') || 
                         request?.sampleType?.toLowerCase().includes('agua') || 
                         request?.sampleType?.toLowerCase().includes('hielo') || 
                         request?.sampleType?.toLowerCase().includes('aire') || 
                         request?.analysisRequested?.toLowerCase().includes('camtu') || 
                         request?.analysisRequested?.toLowerCase().includes('nmp') || 
                         !!request?.foodUFCResult;

    useEffect(() => {
        if (!request || !isIndustrial || !db || !request.clientName || !request.sampleDescription) return;

        const fetchHistory = async () => {
            try {
                const requestsRef = collection(db, `artifacts/${LIMSSystemId}/public/data/requests`);
                const q = query(
                    requestsRef,
                    where("clientName", "==", request.clientName),
                    where("sampleDescription", "==", request.sampleDescription)
                );
                
                const querySnapshot = await getDocs(q);
                const points = [];
                let testName = '';
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const dateSec = data.requestDate?.seconds || data.createdAt?.seconds || 0;
                    if (!dateSec) return;

                    let ufcVal = null;
                    let ufcLimit = null;

                    if (data.foodUFCResult && data.foodUFCResult.resultUFC !== undefined) {
                        ufcVal = parseFloat(data.foodUFCResult.resultUFC);
                        ufcLimit = parseFloat(data.foodUFCResult.limit);
                        testName = data.foodUFCResult.testName || testName;
                    } 
                    else if (data.nmpResult && data.nmpResult.resultNMP !== undefined) {
                        ufcVal = parseFloat(data.nmpResult.resultNMP);
                        ufcLimit = parseFloat(data.nmpResult.limit);
                        testName = data.nmpResult.testName || testName;
                    }
                    else if (data.camtuResult && data.camtuResult.resultUFC !== undefined) {
                        ufcVal = parseFloat(data.camtuResult.resultUFC);
                        ufcLimit = parseFloat(data.camtuResult.limit);
                        testName = 'Monitoreo CAMTU (UFC/m³)';
                    }
                    else if (data.analyzerResults && data.analyzerResults.length > 0) {
                        const numericRes = data.analyzerResults.find(r => !isNaN(parseFloat(r.value)));
                        if (numericRes) {
                            ufcVal = parseFloat(numericRes.value);
                            testName = numericRes.testCode || testName;
                        }
                    }

                    if (ufcVal !== null && !isNaN(ufcVal)) {
                        points.push({
                            id: doc.id,
                            timestamp: dateSec,
                            dateStr: new Date(dateSec * 1000).toLocaleDateString(reportLang === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: '2-digit' }),
                            ufc: ufcVal,
                            limit: ufcLimit && !isNaN(ufcLimit) ? ufcLimit : null
                        });
                    }
                });

                points.sort((a, b) => a.timestamp - b.timestamp);
                setHistoricalData(points);
                if (testName) {
                    setChartTestName(testName);
                }
            } catch (err) {
                console.error("Error fetching historical data:", err);
            }
        };

        fetchHistory();
    }, [db, isIndustrial, request, reportLang]);

    if (!request) return null;
    const reportDate = new Date().toLocaleDateString(reportLang === 'es' ? 'es-ES' : 'en-US');
    const handlePrint = () => window.print();

    const isCulture = request.analysisRequested?.toLowerCase().includes('cultivo') || request.analysisRequested?.toLowerCase().includes('antibiograma') || request.microbiologyAST || request.antibiogram;
    const microData = getMicrobiologyData(request);
    const hasFoodUFC = !!request.foodUFCResult;

    // Utilizamos una API pública y gratuita para generar el QR on-the-fly
    const verificationUrl = `https://lims-microlabs.com/verify/${request.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

    const translateAnalysisName = (name) => {
        if (reportLang === 'es') return name;
        const map = {
            'Perfil Bioquímico': 'Biochemical Profile',
            'Cultivo Microbiológico': 'Microbiological Culture',
            'Hemograma Completo': 'Complete Blood Count',
            'Examen General de Orina': 'Urinalysis'
        };
        return map[name] || name;
    };

    const translateSampleType = (type) => {
        if (!type || reportLang === 'es') return type;
        const map = {
            'Sangre': 'Blood',
            'Orina': 'Urine',
            'Heces': 'Stool',
            'Saliva': 'Saliva',
            'Frotis': 'Swab',
            'Físico-Químico': 'Physicochemical',
            'Bacteriológico': 'Bacteriological'
        };
        return map[type] || type;
    };

    const translateResultValue = (val) => {
        if (!val || reportLang === 'es') return val;
        const map = {
            'Normal': 'Normal',
            'Negativo': 'Negative',
            'Positivo': 'Positive',
            'Fuera de Rango': 'Out of Range',
            'Ausencia': 'Absence',
            'Presencia': 'Presence'
        };
        return map[val] || val;
    };

    const getClinicalInterpretation = () => {
        const defaultEs = "Los resultados presentados están dentro de los límites de detección del método utilizado. Correlacionar con la clínica del paciente.";
        const defaultEn = "The results presented are within the detection limits of the method used. Correlate with the patient's clinical picture.";
        
        if (request.clinicalInterpretation) {
            if (request.clinicalInterpretation === defaultEs && reportLang === 'en') {
                return defaultEn;
            }
            return request.clinicalInterpretation;
        }
        return reportLang === 'es' ? defaultEs : defaultEn;
    };

    const renderExternalResults = (mdText) => {
        if (!mdText) return null;
        const lines = mdText.split('\n');
        let inTable = false;
        let headers = [];
        const elements = [];
        let tableRows = [];
        
        const flushTable = (idx) => {
            if (inTable && tableRows.length > 0) {
                elements.push(
                    <table key={`ext-table-${idx}`} className="w-full text-left border-collapse mt-4 mb-6">
                        <thead className="bg-slate-100 print:bg-slate-200">
                            <tr>
                                {headers.map((h, i) => <th key={i} className="p-3 text-sm font-bold text-slate-700 border border-slate-300">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, rIdx) => (
                                <tr key={rIdx} className={`border-b border-slate-200 ${rIdx % 2 !== 0 ? 'bg-slate-50' : ''}`}>
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className={`p-3 text-sm font-medium ${cell.includes('🔴') ? 'text-red-600 font-bold print:text-red-700' : (cell.includes('🟢') ? 'text-emerald-600 font-bold print:text-emerald-700' : 'text-slate-700')} ${cIdx === 1 ? 'font-black text-center text-lg' : ''}`}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            }
            inTable = false;
            headers = [];
            tableRows = [];
        };

        lines.forEach((line, idx) => {
            if (line.trim().startsWith('|')) {
                const cells = line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
                if (!inTable) {
                    if (cells[0].includes('---')) return; // ignore if it somehow parsed the separator first
                    inTable = true;
                    headers = cells;
                } else if (line.includes('---')) {
                    // separator
                } else {
                    tableRows.push(cells);
                }
            } else {
                flushTable(idx);
                if (line.trim().startsWith('##')) {
                    elements.push(<h4 key={`ext-h-${idx}`} className="font-bold text-slate-800 mt-6 mb-2 text-lg border-b border-slate-200 pb-2">{line.replace(/#/g, '').trim()}</h4>);
                } else if (line.trim().startsWith('---')) {
                    // ignore md rule
                } else if (line.trim() !== '') {
                    elements.push(<p key={`ext-p-${idx}`} className="text-sm text-slate-600 mb-1">{line}</p>);
                }
            }
        });
        
        flushTable('end');
        return <div className="mt-4">{elements}</div>;
    };

    const renderMicrobiologyResults = (microData) => {
        if (!microData) return null;
        
        const getSIRBadge = (sirValue) => {
            const val = (sirValue || '').trim().toUpperCase();
            const isSens = val === 'S' || val.startsWith('SEN');
            const isRes = val === 'R' || val.startsWith('RES');
            const isInt = val === 'I' || val.startsWith('INT');
            
            if (isSens) {
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                        {reportLang === 'es' ? 'Sensible' : 'Sensitive'} (S)
                    </span>
                );
            }
            if (isRes) {
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200 animate-pulse print:animate-none">
                        {reportLang === 'es' ? 'Resistente' : 'Resistant'} (R)
                    </span>
                );
            }
            if (isInt) {
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
                        {reportLang === 'es' ? 'Intermedio' : 'Intermediate'} (I)
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border bg-slate-50 text-slate-600 border-slate-200">
                    {sirValue || 'N/A'}
                </span>
            );
        };

        const pathogenName = microData.pathogen || (reportLang === 'es' ? 'No se observó crecimiento' : 'No growth observed');
        const hasPathogen = !!microData.pathogen;

        return (
            <div className="space-y-6 print-card-break">
                {/* pathogen / sample overview card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 print:border-slate-300">
                    <h4 className="text-xs font-black tracking-wider uppercase text-blue-900 mb-4 pb-2 border-b border-slate-100">
                        {reportLang === 'es' ? 'Resumen del Cultivo Microbiológico' : 'Microbiological Culture Summary'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                                {reportLang === 'es' ? 'Muestra Analizada' : 'Sample Analyzed'}
                            </span>
                            <span className="text-sm font-bold text-slate-700">
                                {translateSampleType(request.sampleType || request.clientType || (reportLang === 'es' ? 'Orina' : 'Urine'))}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                                {reportLang === 'es' ? 'Microorganismo Aislado' : 'Microorganism Isolated'}
                            </span>
                            <span className={`text-base font-black ${hasPathogen ? 'text-indigo-950 italic' : 'text-slate-500'}`}>
                                {pathogenName}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                                {reportLang === 'es' ? 'Concentración Bacteriana' : 'Bacterial Concentration'}
                            </span>
                            <span className="text-sm font-mono font-bold text-slate-800">
                                {microData.concentration || (hasPathogen ? 'N/A' : (reportLang === 'es' ? 'Ausencia' : 'Absence'))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* antibiogram susceptibility table */}
                {hasPathogen && microData.antibiotics && microData.antibiotics.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-300">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex justify-between items-center print:bg-slate-100 print:border-slate-300">
                            <h4 className="font-black text-xs tracking-wider uppercase text-slate-700">
                                {reportLang === 'es' ? 'Prueba de Susceptibilidad Antibiótica (Antibiograma)' : 'Antibiotic Susceptibility Test (Antibiogram)'}
                            </h4>
                            <span className="text-[9px] text-indigo-700 font-bold font-mono uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                CLSI M100
                            </span>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-200 print:bg-slate-100 print:border-slate-300">
                                <tr>
                                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-2/4">
                                        {reportLang === 'es' ? 'Antibiótico' : 'Antibiotic'}
                                    </th>
                                    {microData.antibiotics.some(a => a.halo) && (
                                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/4 text-center">
                                            {reportLang === 'es' ? 'Halo / Diámetro (mm)' : 'Halo / Diameter (mm)'}
                                        </th>
                                    )}
                                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/4 text-center">
                                        {reportLang === 'es' ? 'Interpretación' : 'Interpretation'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                                {microData.antibiotics.map((abx, idx) => (
                                    <tr key={idx} className={`hover:bg-slate-50/40 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/20' : ''}`}>
                                        <td className="p-3 text-sm font-bold text-slate-700">
                                            {abx.name}
                                        </td>
                                        {microData.antibiotics.some(a => a.halo) && (
                                            <td className="p-3 text-sm text-center font-mono text-slate-600 font-bold">
                                                {abx.halo || '-'}
                                            </td>
                                        )}
                                        <td className="p-3 text-sm text-center">
                                            {getSIRBadge(abx.sir)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderFoodUFCResults = (ufcResult) => {
        if (!ufcResult) return null;

        const isRejected = ufcResult.isRejected;
        const norm = ufcResult.referenceNorm || 'BAM FDA';
        
        return (
            <div className="space-y-6 print-card-break">
                {/* UFC Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-300">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex justify-between items-center print:bg-slate-100 print:border-slate-300">
                        <h4 className="font-black text-xs tracking-wider uppercase text-slate-700">
                            {reportLang === 'es' ? 'Ensayo de Recuento Microbiológico' : 'Microbiological Plate Count Assay'}
                        </h4>
                        <span className="text-[9px] text-indigo-700 font-bold font-mono uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {norm}
                        </span>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                                    {reportLang === 'es' ? 'Análisis Realizado' : 'Analysis Conducted'}
                                </span>
                                <span className="text-base font-black text-slate-800">
                                    {ufcResult.testName || (reportLang === 'es' ? 'Recuento de Aerobios Mesófilos' : 'Aerobic Plate Count')}
                                </span>

                                <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
                                    <div>
                                        <span className="text-[9px] text-slate-400 uppercase block font-bold mb-0.5">{reportLang === 'es' ? 'Método Siembra' : 'Plating Method'}</span>
                                        <span>{ufcResult.platingMethod || (reportLang === 'es' ? 'Siembra en Profundidad' : 'Pour Plate Method')}</span>
                                    </div>
                                    {ufcResult.colonies && (
                                        <div>
                                            <span className="text-[9px] text-slate-400 uppercase block font-bold mb-0.5">{reportLang === 'es' ? 'Placa / Dilución' : 'Plate / Dilution'}</span>
                                            <span>{ufcResult.colonies} UFC en 10^{ufcResult.dilution || '0'} ({ufcResult.volume || '1'} mL)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 print:bg-transparent">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                    {reportLang === 'es' ? 'Resultado Oficial' : 'Official Result'}
                                </span>
                                <div className="text-3xl font-black font-mono tracking-tight text-blue-900">
                                    {ufcResult.resultUFC?.toLocaleString() || '0'} <span className="text-sm font-bold">UFC/g</span>
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono mt-1">
                                    {reportLang === 'es' ? 'Notación' : 'Notation'}: {ufcResult.resultUFC ? ufcResult.resultUFC.toExponential(2).replace('e+', ' x 10^') : '0'}
                                </div>

                                <div className="mt-3">
                                    {isRejected ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200 animate-pulse print:animate-none">
                                            {reportLang === 'es' ? 'FUERA DE ESPECIFICACIÓN' : 'OUT OF SPECIFICATION'} (Límite: {ufcResult.limit} max)
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                                            {reportLang === 'es' ? 'CUMPLE ESPECIFICACIÓN' : 'MEETS SPECIFICATION'} {ufcResult.limit ? `(< ${ufcResult.limit} max)` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <style>{`
                @media print {
                    .print-card-break {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-bottom: 1.5rem !important;
                    }
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                }
            `}</style>
            <div className="print:hidden flex justify-between items-center mb-6">
                <button onClick={() => navigateTo('request_details', request.id)} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> {reportLang === 'es' ? 'Volver a Detalles' : 'Back to Details'}
                </button>
                <div className="flex items-center gap-4">
                    {/* Premium Language Selector Toggle */}
                    <div className="flex bg-slate-200 rounded-lg p-0.5 border border-slate-300">
                        <button 
                            onClick={() => setReportLang('es')} 
                            className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all flex items-center gap-1 ${reportLang === 'es' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            ESP 🇪🇸
                        </button>
                        <button 
                            onClick={() => setReportLang('en')} 
                            className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all flex items-center gap-1 ${reportLang === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            ENG 🇺🇸
                        </button>
                    </div>
                    <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm">
                        <Printer size={18} className="mr-2" /> {reportLang === 'es' ? 'Imprimir / PDF' : 'Print / PDF'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-10 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="flex justify-between items-center border-b-4 border-blue-800 pb-6 mb-8">
                    <div className="flex items-center gap-6">
                        <Logo url={labInfo?.logoUrl} className="h-20 w-20" />
                        <div>
                            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">{labInfo?.name || 'Sistema LIMS'}</h1>
                            <p className="text-slate-600 font-bold tracking-widest text-sm mt-1 uppercase">
                                {reportLang === 'es' ? 'Reporte de Resultados Analíticos' : 'Analytical Results Report'}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                                {reportLang === 'es' ? 'Licencia de Salud: #445-A | ISO 9001:2015' : 'Health License: #445-A | ISO 9001:2015'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={request.id.substring(0, 10).toUpperCase()} />
                        <p className="text-xs font-bold text-slate-500 mt-2">
                            {reportLang === 'es' ? 'Emisión' : 'Issued'}: {reportDate}
                        </p>
                    </div>
                </div>

                {isIndustrial ? (
                    <div className="space-y-4 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 print:bg-slate-100 p-6 rounded-xl border border-slate-200 print:border-slate-300">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                    {reportLang === 'es' ? 'Empresa / Solicitante' : 'Requesting Company / Client'}
                                </p>
                                <p className="font-black text-slate-800 text-lg">{request.clientName}</p>
                                {request.clientContactName && (
                                    <p className="text-sm text-slate-600 font-medium mt-1">
                                        <span className="font-semibold">{reportLang === 'es' ? 'Contacto' : 'Contact'}:</span> {request.clientContactName}
                                    </p>
                                )}
                                {request.clientContactPhone && (
                                    <p className="text-xs text-slate-500 font-medium">
                                        Tel: {request.clientContactPhone}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                    {reportLang === 'es' ? 'Control de Ensayo' : 'Test Control Information'}
                                </p>
                                <p className="text-sm text-slate-800"><span className="font-semibold">{reportLang === 'es' ? 'Muestra' : 'Sample'}:</span> {request.sampleDescription || (reportLang === 'es' ? 'No especificada' : 'Not specified')}</p>
                                <p className="text-sm text-slate-800 mt-0.5"><span className="font-semibold">{reportLang === 'es' ? 'Muestreado por' : 'Sampled by'}:</span> {request.sampledBy || (reportLang === 'es' ? 'SOLICITANTE' : 'CLIENT')}</p>
                                <p className="text-sm text-slate-800 mt-0.5"><span className="font-semibold">{reportLang === 'es' ? 'Fecha Recepción' : 'Reception Date'}:</span> {request.requestDate?.seconds ? new Date(request.requestDate.seconds * 1000).toLocaleDateString(reportLang === 'es' ? 'es-ES' : 'en-US') : 'N/A'}</p>
                                <p className="text-sm text-slate-800 mt-0.5"><span className="font-semibold">{reportLang === 'es' ? 'Fecha Montaje' : 'Plating/Setup Date'}:</span> {request.requestDate?.seconds ? new Date(request.requestDate.seconds * 1000).toLocaleDateString(reportLang === 'es' ? 'es-ES' : 'en-US') : 'N/A'}</p>
                            </div>
                        </div>

                        {/* Tarjeta de Información de Producto y Lote si existe lot o si es alimentos */}
                        {(request.sampleLot || request.sampleOther) && (
                            <div className="bg-indigo-50/40 print:bg-transparent p-4 rounded-xl border border-indigo-100/60 print:border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {request.sampleLot && (
                                    <div>
                                        <span className="text-[9px] text-indigo-400 font-bold uppercase block mb-0.5">
                                            {reportLang === 'es' ? 'Identificación de Lote' : 'Lot Identification'}
                                        </span>
                                        <span className="text-sm font-mono font-bold text-slate-800">
                                            LOTE: {request.sampleLot}
                                        </span>
                                    </div>
                                )}
                                {request.sampleOther && (
                                    <div>
                                        <span className="text-[9px] text-indigo-400 font-bold uppercase block mb-0.5">
                                            {reportLang === 'es' ? 'Detalles de Muestra / Especificaciones' : 'Sample Details / Specifications'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 block whitespace-pre-wrap">
                                            {request.sampleOther}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 bg-slate-50 print:bg-slate-100 p-6 rounded-xl border border-slate-200 print:border-slate-300">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">{reportLang === 'es' ? 'Paciente / Cliente' : 'Patient / Client'}</p>
                            <p className="font-bold text-slate-800 text-lg">{request.clientName}</p>
                            {request.identificacion && <p className="text-sm text-slate-600 mt-1">ID: {request.identificacion}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">{reportLang === 'es' ? 'Información de Muestra' : 'Sample Information'}</p>
                            <p className="text-sm text-slate-800 mt-1"><span className="font-semibold">{reportLang === 'es' ? 'ID LIMS' : 'LIMS ID'}:</span> {request.id.substring(0, 8).toUpperCase()}</p>
                            <p className="text-sm text-slate-800 mt-1"><span className="font-semibold">{reportLang === 'es' ? 'Tipo' : 'Type'}:</span> {translateSampleType(request.sampleType || request.clientType)}</p>
                            <p className="text-sm text-slate-800 mt-1"><span className="font-semibold">{reportLang === 'es' ? 'Recibido' : 'Received'}:</span> {request.requestDate?.seconds ? new Date(request.requestDate.seconds * 1000).toLocaleDateString(reportLang === 'es' ? 'es-ES' : 'en-US') : 'N/A'}</p>
                        </div>
                    </div>
                )}

                <div className="mb-12">
                    <div className="flex justify-between items-end border-b-2 border-slate-300 pb-2 mb-4">
                        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                            {reportLang === 'es' ? 'Resultados' : 'Results'}: {translateAnalysisName(request.analysisRequested)}
                        </h3>
                        <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            {reportLang === 'es' ? 'Cód' : 'Code'}: {request.analysisCode || 'N/A'}
                        </span>
                    </div>

                    {request.isReferred && request.referralResults ? (
                        renderExternalResults(request.referralResults)
                    ) : isCulture && microData ? (
                        renderMicrobiologyResults(microData)
                    ) : hasFoodUFC ? (
                        renderFoodUFCResults(request.foodUFCResult)
                    ) : (
                        <div>
                            {request.analyzerResults && request.analyzerResults.filter(r => r.status === 'released').length > 0 ? (
                                (() => {
                                    const grouped = groupResults(
                                        request.analyzerResults.filter(r => r.status === 'released'),
                                        request.analysisRequested || '',
                                        reportLang
                                    );
                                    
                                    return Object.keys(grouped).map((sectionKey) => {
                                        const section = grouped[sectionKey];
                                        return (
                                            <div 
                                                key={sectionKey} 
                                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 print-card-break print:border-slate-300 print:shadow-none"
                                            >
                                                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex justify-between items-center print:bg-slate-100 print:border-slate-300">
                                                    <h4 className="font-black text-xs tracking-wider uppercase text-slate-700">
                                                        {section.name}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-400 font-bold print:hidden font-mono uppercase bg-slate-200/50 px-2 py-0.5 rounded">
                                                        {reportLang === 'es' ? 'Sección' : 'Section'}
                                                    </span>
                                                </div>
                                                
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-slate-50/50 border-b border-slate-200 print:bg-slate-100 print:border-slate-300">
                                                        <tr>
                                                            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-2/5">
                                                                {isIndustrial ? (reportLang === 'es' ? 'Ensayo / Descripción' : 'Assay / Description') : (reportLang === 'es' ? 'Parámetro' : 'Parameter')}
                                                            </th>
                                                            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/5 text-center">
                                                                {reportLang === 'es' ? 'Resultado' : 'Result'}
                                                            </th>
                                                            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/5 text-center">
                                                                {reportLang === 'es' ? 'Unidad' : 'Unit'}
                                                            </th>
                                                            <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/5 text-center">
                                                                {isIndustrial ? (reportLang === 'es' ? 'Límite / Normativa' : 'Limit / Specification') : (reportLang === 'es' ? 'Ref. / Normal' : 'Ref. / Normal')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                                                        {section.items.map((res, idx) => {
                                                            const analysisInfo = availableAnalyses?.find(a => a.code === res.testCode);
                                                            const rangeText = analysisInfo?.minRange && analysisInfo?.maxRange 
                                                                ? `${analysisInfo.minRange} - ${analysisInfo.maxRange}` 
                                                                : 'N/A';
                                                            const unitText = analysisInfo?.unit || 'N/A';
                                                            
                                                            const valStatus = checkValueBounds(res.value, analysisInfo?.minRange, analysisInfo?.maxRange);
                                                            let valueClass = 'text-slate-800 font-extrabold';
                                                            let printBadge = '';
                                                            let screenBadge = null;
                                                            
                                                            if (valStatus === 'low') {
                                                                valueClass = 'text-blue-600 font-black';
                                                                printBadge = ' * (Bajo)';
                                                                screenBadge = (
                                                                    <span className="text-[8px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-extrabold print:hidden uppercase tracking-wider">
                                                                        {reportLang === 'es' ? 'Bajo' : 'Low'}
                                                                    </span>
                                                                );
                                                            } else if (valStatus === 'high') {
                                                                valueClass = 'text-red-600 font-black';
                                                                printBadge = ' * (Alto)';
                                                                screenBadge = (
                                                                    <span className="text-[8px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-extrabold print:hidden uppercase tracking-wider">
                                                                        {reportLang === 'es' ? 'Alto' : 'High'}
                                                                    </span>
                                                                );
                                                            }
                                                            
                                                            return (
                                                                <tr key={idx} className={`hover:bg-slate-50/40 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/20' : ''}`}>
                                                                    <td className="p-3 text-sm font-bold text-slate-700">
                                                                        <div className="flex items-center gap-2">
                                                                            <span>{res.testCode}</span>
                                                                            {res.origin?.includes('Automatizado') && (
                                                                                <span title={res.origin} className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-extrabold border border-indigo-200 print:hidden">
                                                                                    🤖 Auto
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {!isIndustrial && analysisInfo?.minRange && analysisInfo?.maxRange && (
                                                                            <RangeIndicator 
                                                                                value={res.value} 
                                                                                min={analysisInfo.minRange} 
                                                                                max={analysisInfo.maxRange} 
                                                                                reportLang={reportLang} 
                                                                            />
                                                                        )}
                                                                    </td>
                                                                    <td className="p-3 text-sm text-center">
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <span className={`${valueClass} text-base`}>
                                                                                {translateResultValue(res.value)}
                                                                                <span className="hidden print:inline text-xs font-bold">{printBadge}</span>
                                                                            </span>
                                                                            {screenBadge}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-sm text-center text-slate-600 font-medium">
                                                                        {unitText}
                                                                    </td>
                                                                    <td className="p-3 text-sm text-center text-slate-500 font-mono">
                                                                        {isIndustrial ? (analysisInfo?.limit || rangeText) : rangeText}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 print:border-slate-300">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-100 print:bg-slate-200">
                                            <tr>
                                                <th className="p-3 text-sm font-bold text-slate-700 border border-slate-300 w-2/5">{reportLang === 'es' ? 'Parámetro' : 'Parameter'}</th>
                                                <th className="p-3 text-sm font-bold text-slate-700 border border-slate-300 w-1/5 text-center">{reportLang === 'es' ? 'Resultado' : 'Result'}</th>
                                                <th className="p-3 text-sm font-bold text-slate-700 border border-slate-300 w-1/5 text-center">{reportLang === 'es' ? 'Unidad' : 'Unit'}</th>
                                                <th className="p-3 text-sm font-bold text-slate-700 border border-slate-300 w-1/5 text-center">{reportLang === 'es' ? 'Ref. / Normal' : 'Ref. / Normal'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-slate-200">
                                                <td className="p-3 text-sm font-medium">{reportLang === 'es' ? 'Parámetro Principal Analizado' : 'Primary Parameter Analyzed'}</td>
                                                <td className="p-3 text-sm font-bold text-center text-slate-800">{reportLang === 'es' ? 'Normal' : 'Normal'}</td>
                                                <td className="p-3 text-sm text-center text-slate-600">mg/dL</td>
                                                <td className="p-3 text-sm text-center text-slate-500">0.0 - 5.0</td>
                                            </tr>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <td className="p-3 text-sm font-medium">{reportLang === 'es' ? 'Conteo General' : 'General Count'}</td>
                                                <td className="p-3 text-sm font-bold text-center text-emerald-600">{reportLang === 'es' ? 'Negativo' : 'Negative'}</td>
                                                <td className="p-3 text-sm text-center text-slate-600">UFC</td>
                                                <td className="p-3 text-sm text-center text-slate-500">{reportLang === 'es' ? 'Ausencia' : 'Absence'}</td>
                                            </tr>
                                            <tr className="border-b border-slate-200">
                                                <td className="p-3 text-sm font-medium">{reportLang === 'es' ? 'Análisis Secundario' : 'Secondary Analysis'}</td>
                                                <td className="p-3 text-sm font-bold text-center text-red-600">{reportLang === 'es' ? 'Fuera de Rango*' : 'Out of Range*'}</td>
                                                <td className="p-3 text-sm text-center text-slate-600">%</td>
                                                <td className="p-3 text-sm text-center text-slate-500">20 - 40</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {request.camtuResult && (
                    <div className="mb-12 border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
                        <div className={`text-white p-3 border-b print:border-slate-400 ${request.camtuResult.equipmentType === 'Impactador Portátil (Aire Ambiental)' ? 'bg-indigo-800 print:bg-slate-200 print:text-slate-900 border-indigo-700' : 'bg-slate-800 print:bg-slate-200 print:text-slate-900 border-slate-700'}`}>
                            <h4 className="font-bold uppercase text-sm">
                                {request.camtuResult.equipmentType === 'Impactador Portátil (Aire Ambiental)' 
                                    ? (reportLang === 'es' ? 'Reporte Técnico: Monitoreo de Aire Ambiental' : 'Technical Report: Ambient Air Monitoring')
                                    : (reportLang === 'es' ? 'Reporte Técnico CAMTU (ISO 8573-7)' : 'CAMTU Technical Report (ISO 8573-7)')}
                            </h4>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold w-1/4">{reportLang === 'es' ? 'Equipo / Método' : 'Equipment / Method'}</td>
                                        <td className="p-3 w-1/4">{request.camtuResult.equipmentType || 'CAMTU (Impacto de Aire)'}</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold w-1/4">{reportLang === 'es' ? 'Flujo de Muestreo' : 'Sampling Flow'}</td>
                                        <td className="p-3 w-1/4">{request.camtuResult.flowRate} L/min</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Tiempo de Muestreo' : 'Sampling Time'}</td>
                                        <td className="p-3">{request.camtuResult.samplingTime} min</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Volumen Total' : 'Total Volume'}</td>
                                        <td className="p-3">{request.camtuResult.totalVolumeLiters} L</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Punto de Muestreo' : 'Sampling Point'}</td>
                                        <td className="p-3">{request.camtuResult.location || 'N/A'}</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Presión' : 'Pressure'}</td>
                                        <td className="p-3">{request.camtuResult.equipmentType === 'Impactador Portátil (Aire Ambiental)' ? 'N/A (Ambiental)' : `${request.camtuResult.pressure || 'N/A'} Bar`}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Conteo Directo' : 'Direct Count'}</td>
                                        <td className="p-3">{request.camtuResult.colonies} UFC</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold text-blue-900">{reportLang === 'es' ? 'Resultado Extrapolado' : 'Extrapolated Result'}</td>
                                        <td className="p-3 font-black text-blue-700 text-lg">{request.camtuResult.resultUFC?.toLocaleString(undefined, { maximumFractionDigits: 2 })} UFC/m³</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Límite Permitido' : 'Allowed Limit'}</td>
                                        <td className="p-3">{request.camtuResult.limit} UFC/m³</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Conclusión' : 'Conclusion'}</td>
                                        <td className={`p-3 font-bold ${request.camtuResult.isRejected ? 'text-red-600 print:text-red-800' : 'text-emerald-600 print:text-emerald-800'}`}>
                                            {request.camtuResult.isRejected 
                                                ? (reportLang === 'es' ? 'RECHAZADO (Fuera de Especificación)' : 'REJECTED (Out of Specification)')
                                                : (reportLang === 'es' ? 'CUMPLE ESPECIFICACIÓN' : 'MEETS SPECIFICATION')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {request.nmpResult && (
                    <div className="mb-12 border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
                        <div className="bg-cyan-800 print:bg-slate-200 text-white print:text-slate-900 p-3 border-b border-cyan-700 print:border-slate-400">
                            <h4 className="font-bold uppercase text-sm">{reportLang === 'es' ? 'Análisis Estadístico NMP (Agua y Hielo)' : 'MPN Statistical Analysis (Water & Ice)'}</h4>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold w-1/4">{reportLang === 'es' ? 'Método' : 'Method'}</td>
                                        <td className="p-3 w-1/4">Técnica NMP (Serie {request.nmpResult.tubeSeries} Tubos)</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold w-1/4">{reportLang === 'es' ? 'Parámetro' : 'Parameter'}</td>
                                        <td className="p-3 w-1/4">{request.nmpResult.testName}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Tubos Positivos (10 mL)' : 'Positive Tubes (10 mL)'}</td>
                                        <td className="p-3">{request.nmpResult.pos10} / {request.nmpResult.tubeSeries}</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Límite Normativo' : 'Regulatory Limit'}</td>
                                        <td className="p-3 font-bold text-slate-700">{request.nmpResult.limit}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Tubos Positivos (1 mL)' : 'Positive Tubes (1 mL)'}</td>
                                        <td className="p-3">{request.nmpResult.pos1} / {request.nmpResult.tubeSeries}</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold text-cyan-900">{reportLang === 'es' ? 'Índice NMP' : 'MPN Index'}</td>
                                        <td className="p-3 font-black text-cyan-700 text-lg">{request.nmpResult.resultNMP} <span className="text-sm font-bold text-cyan-600">/ 100 mL</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Tubos Positivos (0.1 mL)' : 'Positive Tubes (0.1 mL)'}</td>
                                        <td className="p-3">{request.nmpResult.pos01} / {request.nmpResult.tubeSeries}</td>
                                        <td className="p-3 bg-slate-50 print:bg-slate-100 font-bold">{reportLang === 'es' ? 'Conclusión' : 'Conclusion'}</td>
                                        <td className={`p-3 font-bold uppercase ${request.nmpResult.isRejected ? 'text-red-600 print:text-red-800' : 'text-emerald-600 print:text-emerald-800'}`}>
                                            {request.nmpResult.isRejected 
                                                ? (reportLang === 'es' ? 'NO APTA PARA CONSUMO (Fuera de Norma)' : 'NOT FIT FOR CONSUMPTION (Out of Spec)')
                                                : (reportLang === 'es' ? 'APTA / POTABLE (Dentro de Norma)' : 'FIT / POTABLE (Within Spec)')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Gráfico de Evolución Temporal (Vida Útil / Seguimiento) */}
                {historicalData && historicalData.length > 1 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 mb-8 print-card-break print:border-slate-300">
                        <h4 className="text-xs font-black tracking-wider uppercase text-blue-900 mb-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                            <span>{reportLang === 'es' ? 'Evolución Temporal del Ensayo' : 'Test Temporal Evolution'}</span>
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-normal border border-blue-100">
                                {chartTestName || (reportLang === 'es' ? 'Parámetro Microbiológico' : 'Microbiological Parameter')}
                            </span>
                        </h4>
                        
                        <p className="text-xs text-slate-500 mb-6 font-medium">
                            {reportLang === 'es' 
                                ? 'Gráfico de seguimiento histórico para muestras idénticas de este lote/producto. Muestra la tendencia de crecimiento frente al límite legal.' 
                                : 'Historical monitoring chart for identical samples of this lot/product. Shows the growth trend against the legal limit.'}
                        </p>

                        <div className="h-64 w-full text-slate-700 font-sans text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={historicalData}
                                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="dateStr" 
                                        stroke="#94a3b8" 
                                        tickLine={false}
                                        style={{ fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8" 
                                        tickLine={false}
                                        style={{ fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} 
                                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Line 
                                        name={reportLang === 'es' ? 'Resultado' : 'Result'}
                                        type="monotone" 
                                        dataKey="ufc" 
                                        stroke="#4f46e5" 
                                        strokeWidth={3}
                                        activeDot={{ r: 8 }} 
                                    />
                                    {historicalData.some(d => d.limit !== null) && (
                                        <Line 
                                            name={reportLang === 'es' ? 'Límite Máximo Permitido' : 'Maximum Allowed Limit'}
                                            type="step" 
                                            dataKey="limit" 
                                            stroke="#ef4444" 
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="mb-8 p-4 bg-yellow-50/50 print:bg-transparent border border-yellow-200 print:border-slate-300 rounded-lg">
                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-1">
                        {reportLang === 'es' ? 'Interpretación / Observaciones' : 'Interpretation / Observations'}:
                    </h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {getClinicalInterpretation()}
                    </p>
                </div>

                <div className="mt-16 pt-8 border-t-2 border-slate-800 grid grid-cols-12 gap-6 items-end">
                    <div className="col-span-5 text-center">
                        <div className="border-b border-slate-400 w-3/4 mx-auto mb-2 relative h-16">
                            <div className="absolute bottom-0 w-full text-center pb-1">
                                <span className="font-signature text-3xl text-blue-900 opacity-80" style={{ fontFamily: 'cursive' }}>Dra. E. Ramírez</span>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-800">Dra. E. Ramírez</p>
                        <p className="text-xs text-slate-500">
                            {reportLang === 'es' ? 'Directora Técnica - Reg. 55432' : 'Technical Director - Reg. 55432'}
                        </p>
                    </div>

                    <div className="col-span-4 text-center">
                        <div className="border-b border-slate-400 w-3/4 mx-auto mb-2 relative h-16"></div>
                        <p className="text-sm font-bold text-slate-800">{reportLang === 'es' ? 'Técnico Analista' : 'Technician Analyst'}</p>
                        <p className="text-xs text-slate-500">{reportLang === 'es' ? 'Sección Análisis' : 'Analysis Section'}</p>
                    </div>

                    <div className="col-span-3 flex flex-col items-end justify-end">
                        <div className="bg-white p-2 border-2 border-slate-800 rounded shadow-sm">
                            <img src={qrUrl} alt="Validación QR" className="w-24 h-24" crossOrigin="anonymous" />
                        </div>
                        <p className="text-[10px] text-slate-500 text-right font-bold mt-2 leading-tight uppercase w-32">
                            {reportLang === 'es' ? 'Escanee para verificar autenticidad en LIMS' : 'Scan to verify authenticity in LIMS'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
