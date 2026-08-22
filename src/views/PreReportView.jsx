import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Logo, BarcodeDisplay } from '../components/UI';
import versionData from '../version.json';

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

            <div className="bg-white p-8 print:p-0 rounded-2xl shadow-xl border border-slate-200 print:border-none print:shadow-none font-sans text-slate-800">
                <div className="flex justify-between items-start mb-6 border-b border-slate-200 print:border-slate-800 pb-4">
                    <div>
                        <Logo url={labInfo?.logoUrl} className="h-12 mb-2" />
                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">Informe Preliminar de Laboratorio</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase">Formulario Interno FOR-PRE-02 (Rev. 03)</p>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={request.customId || request.id} className="h-10" />
                        <p className="text-xs font-mono font-bold mt-1 text-slate-700">ORDEN #: {request.customId || request.id}</p>
                        <p className="text-xs text-slate-500 font-semibold">Fecha Recepción: {reqDate}</p>
                    </div>
                </div>

                <div className="bg-slate-50 print:bg-transparent p-4 rounded-xl border border-slate-200 print:border-slate-800 mb-6 grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p><strong className="text-slate-600">Cliente / Paciente:</strong> {request.clientName || request.patientName}</p>
                        <p><strong className="text-slate-600">Identificación:</strong> {request.clientId || request.patientId || 'N/D'}</p>
                        <p><strong className="text-slate-600">Sede:</strong> {request.branchName || 'Sede Central'}</p>
                    </div>
                    <div>
                        <p><strong className="text-slate-600">Matriz / Muestra:</strong> {request.sampleType || 'No especificada'}</p>
                        <p><strong className="text-slate-600">Estado Solicitud:</strong> <span className="font-bold uppercase text-amber-600">{request.status}</span></p>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 border-b pb-1">Ensayos Solicitados y Avance Preliminar</h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-300">
                        <thead className="bg-slate-100 print:bg-slate-200 text-slate-700 font-bold">
                            <tr>
                                <th className="p-2 border border-slate-300">Código</th>
                                <th className="p-2 border border-slate-300">Ensayo</th>
                                <th className="p-2 border border-slate-300 text-center">Estado</th>
                                <th className="p-2 border border-slate-300 text-center">Resultado Preliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(request.selectedAnalyses || []).map((code, idx) => (
                                <tr key={idx} className="border-b border-slate-200">
                                    <td className="p-2 border border-slate-300 font-mono font-bold">{code}</td>
                                    <td className="p-2 border border-slate-300 font-medium">{code}</td>
                                    <td className="p-2 border border-slate-300 text-center uppercase font-semibold text-slate-600">En Proceso</td>
                                    <td className="p-2 border border-slate-300 text-center italic text-slate-400">Pendiente de firma</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Observaciones / Notas del Analista:</h3>
                    <div className="border border-slate-300 print:border-slate-800 rounded-lg h-24 w-full"></div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-300 print:border-slate-800 grid grid-cols-2 gap-8 text-center">
                    <div>
                        <div className="border-b border-slate-400 print:border-slate-800 w-3/4 mx-auto mb-2 h-10"></div>
                        <p className="text-xs font-bold text-slate-700">Analizado por (Firma)</p>
                    </div>
                    <div>
                        <div className="border-b border-slate-400 print:border-slate-800 w-3/4 mx-auto mb-2 h-10"></div>
                        <p className="text-xs font-bold text-slate-700">Revisado por (Firma DT)</p>
                    </div>
                </div>

                <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between items-center text-[8.5px] text-slate-400 font-mono select-none">
                    <span>Documento Prereporte: FOR-PRE-02 (Rev. 03) — Sistema LIMS-PRO {versionData?.fullVersion || 'v2.5.0'}</span>
                    <span>Hash Trazabilidad: #{versionData?.gitCommit || 'dev'}</span>
                </div>
            </div>
        </div>
    );
};
