import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Logo, BarcodeDisplay } from '../components/UI';

const uniqueFormIdStatic = (() => {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    return `FRM-${dateStr}-${randomStr}`;
})();

export const ManualFormView = ({ navigateTo, labInfo }) => {
    const handlePrint = () => window.print();
    const uniqueFormId = uniqueFormIdStatic;

    const commonAnalyses = [
        { name: "Hemograma Completo", code: "HEM-01" },
        { name: "Perfil Lipídico", code: "LIP-02" },
        { name: "Glucosa en Ayunas", code: "GLU-03" },
        { name: "Examen General de Orina", code: "URI-04" },
        { name: "Coprocultivo", code: "COP-05" },
        { name: "Análisis Físico-Químico (Agua)", code: "AGU-06" },
        { name: "Microbiológico (Alimentos)", code: "ALI-07" },
        { name: "Hisopado de Superficies", code: "SUP-08" },
    ];

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="print:hidden flex justify-between items-center mb-6">
                <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Volver
                </button>
                <button onClick={handlePrint} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm">
                    <Printer size={18} className="mr-2" /> Imprimir Formulario Vacío
                </button>
            </div>

            <div className="bg-white p-8 sm:p-10 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="flex justify-between items-center border-b-2 border-slate-800 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Logo url={labInfo?.logoUrl} className="h-16 w-16" />
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{labInfo?.name || 'Sistema LIMS'}</h1>
                            <p className="text-slate-600 font-medium">Formulario de Ingreso de Muestras</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={uniqueFormId} />
                        <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Nº Formulario</p>
                    </div>
                </div>

                <div className="space-y-6 mb-8 text-sm">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                            <span className="font-bold text-slate-700 w-1/3">Cliente/Paciente:</span>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                            <span className="font-bold text-slate-700 w-1/4">Fecha:</span>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                            <span className="font-bold text-slate-700 w-1/3">Atención a:</span>
                            <div className="flex-1"></div>
                        </div>
                        <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                            <span className="font-bold text-slate-700 w-1/3">Tipo de Muestra:</span>
                            <div className="flex-1"></div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 bg-slate-100 print:bg-slate-200 p-2 border border-slate-300 print:border-slate-800">Análisis Requeridos</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {commonAnalyses.map((ana, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 border border-slate-200 rounded print:border-slate-400">
                                <div className="w-5 h-5 border-2 border-slate-400 rounded-sm"></div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 text-sm">{ana.name}</p>
                                    <p className="font-mono text-xs text-slate-500">{ana.code}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border border-slate-300 print:border-slate-400 p-4 rounded-lg">
                        <p className="font-bold text-slate-700 text-sm mb-2">Otros Análisis (Especifique):</p>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-6 mt-4"></div>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-6"></div>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-2"></div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Observaciones Generales:</h3>
                    <div className="border border-slate-300 print:border-slate-800 rounded-lg h-24 w-full"></div>
                </div>

                <div className="mb-6 bg-slate-50 border border-slate-300 print:border-slate-800 p-4 rounded-lg">
                    <p className="text-sm font-bold text-slate-800 mb-3">Preferencia de Entrega del Informe Final (Marque una):</p>
                    <div className="flex gap-6 items-center">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div><span className="text-sm text-slate-700 font-bold">Correo Electrónico</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div><span className="text-sm text-slate-700 font-bold">WhatsApp</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div><span className="text-sm text-slate-700 font-bold">Portal Web</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-500 rounded-sm"></div><span className="text-sm text-slate-700 font-bold">Impreso Físico</span></div>
                    </div>
                </div>

                <div className="mt-16 pt-8 grid grid-cols-2 gap-12 text-center">
                    <div>
                        <div className="border-b-2 border-slate-800 w-full mx-auto mb-2"></div>
                        <p className="text-sm font-bold text-slate-700">Entregado por (Cliente/Remitente)</p>
                        <p className="text-xs text-slate-500 mt-1">Firma y Cédula</p>
                    </div>
                    <div>
                        <div className="border-b-2 border-slate-800 w-full mx-auto mb-2"></div>
                        <p className="text-sm font-bold text-slate-700">Recibido por (Personal LIMS)</p>
                        <p className="text-xs text-slate-500 mt-1">Firma y Fecha/Hora de Recepción</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
