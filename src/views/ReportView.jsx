import React, { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { LoadingSpinner, Logo } from '../components/UI';

export const ReportView = ({ request, navigateTo, availableAnalyses, labInfo }) => {
    const [reportLang, setReportLang] = useState('es');

    if (!request) return <LoadingSpinner />;
    const requestAnalyses = (request.analysisIds || []).map(id => availableAnalyses.find(a => a.id === id)).filter(Boolean);

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

    const translateReferenceRange = (range) => {
        if (!range || reportLang === 'es') return range;
        const map = {
            'Ausencia': 'Absence',
            'Normal': 'Normal'
        };
        return map[range] || range;
    };

    return (
        <div className="bg-slate-100 min-h-screen p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl mb-6 flex justify-between print:hidden">
                <button onClick={() => navigateTo('request_details', request.id)} className="flex items-center text-slate-600">
                    <ArrowLeft className="mr-2" size={20} /> {reportLang === 'es' ? 'Volver' : 'Back'}
                </button>
                <div className="flex items-center gap-4">
                    {/* Premium Language Selector Toggle */}
                    <div className="flex bg-slate-200 rounded-lg p-0.5 border border-slate-300">
                        <button 
                            onClick={() => setReportLang('es')} 
                            className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all flex items-center gap-1 ${reportLang === 'es' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            ESP 🇪🇸
                        </button>
                        <button 
                            onClick={() => setReportLang('en')} 
                            className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all flex items-center gap-1 ${reportLang === 'en' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            ENG 🇺🇸
                        </button>
                    </div>
                    <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <Printer size={18} /> {reportLang === 'es' ? 'Imprimir' : 'Print'}
                    </button>
                </div>
            </div>
            <div className="bg-white w-full max-w-4xl p-12 shadow-lg" id="print-area">
                <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between">
                    <div className="flex gap-4 items-center">
                        <Logo url={labInfo?.logoUrl} className="h-16 w-16" />
                        <div>
                            <h1 className="text-2xl font-bold">{labInfo?.name}</h1>
                            <p className="text-slate-500">{labInfo?.address}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-400">
                            {reportLang === 'es' ? 'INFORME' : 'REPORT'}
                        </h2>
                        <p className="font-mono">{request.id.substring(0, 8)}</p>
                    </div>
                </div>
                <div className="mb-8">
                    <p><strong>{reportLang === 'es' ? 'Cliente' : 'Client'}:</strong> {request.clientName}</p>
                    <p><strong>{reportLang === 'es' ? 'Fecha' : 'Date'}:</strong> {new Date().toLocaleDateString(reportLang === 'es' ? 'es-ES' : 'en-US')}</p>
                </div>
                <table className="w-full text-left mb-12">
                    <thead className="border-b-2 border-slate-200">
                        <tr>
                            <th className="py-2">{reportLang === 'es' ? 'Análisis' : 'Analysis'}</th>
                            <th className="py-2">{reportLang === 'es' ? 'Resultado' : 'Result'}</th>
                            <th className="py-2">{reportLang === 'es' ? 'Ref.' : 'Ref.'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requestAnalyses.map(a => (
                            <tr key={a.id} className="border-b border-slate-100">
                                <td className="py-3">{translateAnalysisName(a.name)}</td>
                                <td className="py-3 font-bold">
                                    {translateResultValue(request.results?.[a.id]?.value) || '-'} {a.units}
                                </td>
                                <td className="py-3 text-sm text-slate-500">{translateReferenceRange(a.referenceRanges)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-12 pt-8 border-t text-center">
                    <p className="font-bold">
                        {reportLang === 'es' ? 'Firma Autorizada' : 'Authorized Signature'}
                    </p>
                </div>
            </div>
        </div>
    );
};
