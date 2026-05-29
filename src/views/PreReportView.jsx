import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Logo, BarcodeDisplay } from '../components/UI';

export const PreReportView = ({ request, navigateTo, labInfo }) => {
    if (!request) return null;
    const reqDate = request.requestDate?.seconds ? new Date(request.requestDate.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString();
    const handlePrint = () => window.print();

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="print:hidden flex justify-between items-center mb-6">
                <button onClick={() => navigateTo('request_details', request.id)} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Volver a Detalles
                </button>
                <button onClick={handlePrint} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm">
                    <Printer size={18} className="mr-2" /> Imprimir Prereporte
                </button>
            </div>

            <div className="bg-white p-8 sm:p-10 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <Logo url={labInfo?.logoUrl} className="h-16 w-16" />
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{labInfo?.name || 'Sistema LIMS'}</h1>
                            <p className="text-slate-600 font-medium">Hoja de Trabajo Analítico (Prereporte)</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={request.id.substring(0, 10).toUpperCase()} />
                        <p className="text-sm font-bold text-slate-500 mt-2">Fecha: {reqDate}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl print:border-slate-800 print:bg-transparent">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Cliente</h3>
                        <p className="font-bold text-slate-800 text-lg">{request.clientName || 'N/A'}</p>
                        <p className="text-sm text-slate-600">Tipo: {request.clientType || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl print:border-slate-800 print:bg-transparent">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Análisis Solicitado</h3>
                        <p className="font-bold text-slate-800 text-lg">{request.analysisRequested || 'N/A'}</p>
                        <p className="text-sm text-indigo-600 font-mono font-bold">Cód: {request.analysisCode || 'S/N'}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Resultados Preliminares</h3>
                    <table className="w-full text-left border-collapse border border-slate-300 print:border-slate-800">
                        <thead className="bg-slate-100 print:bg-slate-200">
                            <tr>
                                <th className="border border-slate-300 print:border-slate-800 p-3 text-sm font-bold w-1/4">Parámetro</th>
                                <th className="border border-slate-300 print:border-slate-800 p-3 text-sm font-bold w-1/4">Resultado Obtenido</th>
                                <th className="border border-slate-300 print:border-slate-800 p-3 text-sm font-bold w-1/6">Unidades</th>
                                <th className="border border-slate-300 print:border-slate-800 p-3 text-sm font-bold w-1/3">Técnico Analista / Firma</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i}>
                                    <td className="border border-slate-300 print:border-slate-800 p-6"></td>
                                    <td className="border border-slate-300 print:border-slate-800 p-6"></td>
                                    <td className="border border-slate-300 print:border-slate-800 p-6"></td>
                                    <td className="border border-slate-300 print:border-slate-800 p-6"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Observaciones / Notas del Analista:</h3>
                    <div className="border border-slate-300 print:border-slate-800 rounded-lg h-32 w-full"></div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-300 print:border-slate-800 grid grid-cols-2 gap-8 text-center">
                    <div>
                        <div className="border-b border-slate-400 print:border-slate-800 w-3/4 mx-auto mb-2 h-12"></div>
                        <p className="text-sm font-bold text-slate-700">Analizado por (Firma)</p>
                    </div>
                    <div>
                        <div className="border-b border-slate-400 print:border-slate-800 w-3/4 mx-auto mb-2 h-12"></div>
                        <p className="text-sm font-bold text-slate-700">Revisado por (Firma DT)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
