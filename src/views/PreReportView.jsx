import React, { useMemo } from 'react';
import { ArrowLeft, Printer, FlaskConical } from 'lucide-react';
import { Logo, BarcodeDisplay } from '../components/UI';
import versionData from '../version.json';

export const PreReportView = ({ request, analyses = [], navigateTo, labInfo }) => {
    const handlePrint = () => window.print();

    // Determinar la lista de ensayos solicitados sin saturar
    const testList = useMemo(() => {
        if (!request) return [];
        const rows = [];
        const catalog = analyses || [];

        // 1. Si vienen resultados de autoanalizador o ensayos SQL (Clínicos o Industriales)
        if (Array.isArray(request.analyzerResults) && request.analyzerResults.length > 0) {
            request.analyzerResults.forEach((t, idx) => {
                rows.push({
                    id: t.id || idx,
                    code: t.testCode || `ENS-0${idx + 1}`,
                    name: t.testName || t.testCode,
                    method: t.isoStandardRef || t.method || request.expectedPlatingMethod || 'Método Normalizado',
                    unit: t.unit || '',
                    ref: t.specificationLimit || t.referenceRange || t.appliedReferenceRange || '—',
                    preliminaryValue: t.value || ''
                });
            });
            return rows;
        }

        // 2. Si vienen ensayos crudos vinculados a la muestra
        if (Array.isArray(request.tests) && request.tests.length > 0) {
            request.tests.forEach((t, idx) => {
                rows.push({
                    id: t.id || idx,
                    code: t.parameterName ? t.parameterName.substring(0, 8).toUpperCase() : `ENS-0${idx + 1}`,
                    name: t.parameterName || t.testName || 'Ensayo',
                    method: t.isoStandardRef || 'Método Normalizado',
                    unit: t.unit || (t.quantitativeResult !== null ? 'UFC/g' : ''),
                    ref: t.specificationLimit || 'Norma Sanitaria',
                    preliminaryValue: t.qualitativeResult || (t.quantitativeResult !== null ? String(t.quantitativeResult) : '')
                });
            });
            return rows;
        }

        // 3. Si vienen seleccionados múltiples análisis
        if (Array.isArray(request.selectedAnalyses) && request.selectedAnalyses.length > 0) {
            request.selectedAnalyses.forEach((item, idx) => {
                const code = typeof item === 'string' ? item : item.code;
                const match = catalog.find(c => c.code === code || c.name === code);
                const currentRes = request.results?.[code] || request.results?.[match?.name] || '';
                rows.push({
                    id: idx,
                    code: match?.code || code,
                    name: match?.name || (typeof item === 'string' ? item : item.name) || code,
                    method: match?.method || request.expectedPlatingMethod || request.methodCode || 'Método Estándar',
                    unit: match?.unit || '',
                    ref: match?.refRange || (match?.minRange && match?.maxRange ? `${match.minRange} - ${match.maxRange} ${match.unit || ''}` : '—'),
                    preliminaryValue: typeof currentRes === 'object' ? (currentRes.value || '') : currentRes
                });
            });
            return rows;
        }

        // 4. Si viene un análisis solicitado principal
        if (request.analysisRequested) {
            const match = catalog.find(c => c.code === request.analysisCode || c.name === request.analysisRequested);
            const currentRes = request.results?.[request.analysisCode] || request.results?.[request.analysisRequested] || '';
            rows.push({
                id: 0,
                code: request.analysisCode || match?.code || 'ENS-01',
                name: request.analysisRequested || match?.name || 'Análisis Solicitado',
                method: request.expectedPlatingMethod || match?.method || request.methodCode || 'Método Estándar',
                unit: match?.unit || '',
                ref: match?.refRange || (match?.minRange && match?.maxRange ? `${match.minRange} - ${match.maxRange} ${match.unit || ''}` : '—'),
                preliminaryValue: typeof currentRes === 'object' ? (currentRes.value || '') : currentRes
            });
            return rows;
        }

        return rows;
    }, [request, analyses]);

    if (!request) return null;

    const reqDate = request.requestDate?.seconds 
        ? new Date(request.requestDate.seconds * 1000).toLocaleString() 
        : (typeof request.requestDate === 'string' ? new Date(request.requestDate).toLocaleString() : new Date().toLocaleString());

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12 font-sans">
            {/* Barra de control superior (Oculta al imprimir) */}
            <div className="print:hidden flex justify-between items-center mb-6">
                <button 
                    onClick={() => navigateTo('request_details', request.id)} 
                    className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors font-medium text-sm"
                >
                    <ArrowLeft size={18} className="mr-2" /> Volver a Detalles
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrint} 
                        className="flex items-center bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-md cursor-pointer gap-2"
                    >
                        <Printer size={18} /> Imprimir Hoja de Trabajo
                    </button>
                </div>
            </div>

            {/* Hoja física para mesa de trabajo (Optimizada para papel carta) */}
            <div className="bg-white p-8 print:p-4 rounded-2xl shadow-xl border border-slate-200 print:border-none print:shadow-none text-slate-800 text-xs">
                
                {/* Cabecera oficial Microlabs */}
                <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800 mb-4">
                    <div>
                        <Logo url={labInfo?.logoUrl} variant="full" className="h-12 w-44 mb-1.5 justify-start" />
                        <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                            <FlaskConical size={18} className="text-indigo-700 print:text-black inline" />
                            Hoja de Trabajo y Pre-reporte de Mesa
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Bitácora Interna de Análisis • FOR-PRE-02 (Rev. 04)
                        </p>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={request.customId || request.id} className="h-9 mb-1" />
                        <p className="text-xs font-mono font-black text-slate-900 tracking-wide">
                            ORDEN #: {request.customId || request.id.substring(0, 10).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                            Ingreso: {reqDate}
                        </p>
                    </div>
                </div>

                {/* Datos esenciales del paciente/cliente y muestra (Limpios y no saturados) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 print:bg-transparent rounded-xl border border-slate-300 print:border-slate-800 mb-5 leading-relaxed">
                    <div className="col-span-2">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Cliente / Paciente</span>
                        <span className="text-sm font-bold text-slate-900">{request.clientName || request.patientName || 'No indicado'}</span>
                        <span className="block text-[11px] text-slate-600 font-mono mt-0.5">
                            ID/Céd: {request.clientId || request.patientId || request.patientDNI || request.companyTaxId || 'N/D'}
                        </span>
                    </div>

                    <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Matriz / Muestra</span>
                        <span className="font-bold text-slate-800">{request.sampleType || request.sampleDescription || 'Muestra de Laboratorio'}</span>
                        {request.sampleLot && (
                            <span className="block text-[10px] text-slate-600 font-mono">Lote: {request.sampleLot}</span>
                        )}
                    </div>

                    <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Temp. Recepción / Sede</span>
                        <span className="font-bold text-slate-800">
                            {request.receptionTemp ? `${request.receptionTemp} °C` : '____ °C'}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                            {request.branchName || 'Sede Central'}
                        </span>
                    </div>
                </div>

                {/* Tabla de Trabajo: Ensayos Solicitados y espacio para anotación manual */}
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-1.5">
                        <h2 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                            Ensayos Solicitados & Registro de Lectura en Mesa
                        </h2>
                        <span className="text-[10px] text-slate-400 italic print:text-slate-600">
                            Anotar lecturas directas, dilución y unidades a mano
                        </span>
                    </div>

                    <table className="w-full text-left border-collapse border border-slate-400">
                        <thead className="bg-slate-100 print:bg-slate-200 text-slate-800 font-bold text-[11px]">
                            <tr>
                                <th className="p-2 border border-slate-400 w-16 text-center">Código</th>
                                <th className="p-2 border border-slate-400">Ensayo / Parámetro</th>
                                <th className="p-2 border border-slate-400 w-36">Método / Medio</th>
                                <th className="p-2 border border-slate-400 w-48 text-center bg-slate-200/60 print:bg-slate-300">
                                    Resultado / Lectura Manual
                                </th>
                                <th className="p-2 border border-slate-400 w-28 text-center">Referencia / Normativa</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px]">
                            {testList.length > 0 ? (
                                testList.map((test) => (
                                    <tr key={test.id} className="border-b border-slate-400 h-12">
                                        <td className="p-2 border border-slate-400 font-mono font-bold text-center text-slate-700">
                                            {test.code}
                                        </td>
                                        <td className="p-2 border border-slate-400 font-semibold text-slate-900">
                                            {test.name}
                                        </td>
                                        <td className="p-2 border border-slate-400 text-slate-600 text-[10px]">
                                            {test.method}
                                        </td>
                                        <td className="p-2 border border-slate-400 bg-white font-mono text-center">
                                            {test.preliminaryValue ? (
                                                <span className="font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                    {test.preliminaryValue} {test.unit}
                                                </span>
                                            ) : (
                                                <div className="h-8 flex items-end justify-center pb-1 text-slate-300 print:text-slate-400">
                                                    <span className="border-b border-dashed border-slate-400 w-full inline-block">&nbsp;</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-2 border border-slate-400 text-center text-[10px] text-slate-600">
                                            {test.ref}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-b border-slate-400 h-14">
                                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                                        No hay ensayos desglosados. Anotar análisis y lecturas manualmente en el recuadro inferior.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Recuadro amplio y limpio para Observaciones, Lote de Reactivos o Cálculos */}
                <div className="mb-5">
                    <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                        Observaciones / Bitácora del Analista (Incubación, Medios, Diluciones):
                    </h3>
                    <div className="border border-slate-400 rounded-lg p-2.5 h-24 w-full relative bg-slate-50/40 print:bg-transparent">
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 border-b border-slate-200 pb-1 mb-2">
                            <span>Siembra / Montaje: ___/___/___  ___:___</span>
                            <span>Lectura Final: ___/___/___  ___:___</span>
                        </div>
                    </div>
                </div>

                {/* Firmas de responsabilidad técnica */}
                <div className="pt-4 border-t-2 border-slate-400 grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                        <div className="border-b border-slate-600 w-3/4 mx-auto mb-2 h-8"></div>
                        <p className="font-bold text-slate-800">Analista Responsable</p>
                        <p className="text-[10px] text-slate-500">Firma / Sello de Mesa</p>
                    </div>
                    <div>
                        <div className="border-b border-slate-600 w-3/4 mx-auto mb-2 h-8"></div>
                        <p className="font-bold text-slate-800">Revisión y Aprobación</p>
                        <p className="text-[10px] text-slate-500">Director Técnico / Microbiólogo</p>
                    </div>
                </div>

                {/* Pie de página de trazabilidad */}
                <div className="mt-5 pt-2 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-mono select-none">
                    <span>Laboratorio Microlabs Químicos S.A. • FOR-PRE-02 (Rev. 04)</span>
                    <span>Trazabilidad LIMS-PRO {versionData?.fullVersion || 'v2.5.0'}</span>
                </div>
            </div>
        </div>
    );
};
