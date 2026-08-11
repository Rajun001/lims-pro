import React, { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { BarcodeDisplay } from '../components/UI';

const uniqueFormIdStatic = (() => {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    return `FRM-${dateStr}-${randomStr}`;
})();

export const ManualFormView = ({ navigateTo, labInfo }) => {
    const [formType, setFormType] = useState('clinical'); // 'clinical' | 'industrial'
    const handlePrint = () => window.print();
    const uniqueFormId = uniqueFormIdStatic;

    const clinicalAnalyses = [
        { name: "Hemograma Completo", code: "HEM-01" },
        { name: "Perfil Lipídico (Colest, Trig, HDL, LDL)", code: "LIP-02" },
        { name: "Glucosa en Ayunas", code: "GLU-03" },
        { name: "Examen General de Orina (EGO)", code: "URI-04" },
        { name: "Coprológico / Coprocultivo", code: "COP-05" },
        { name: "Perfil Renal (BUN, Creatinina, Ac. Úrico)", code: "REN-06" },
        { name: "Perfil Hepático (AST, ALT, Bilirrubinas)", code: "HEP-07" },
        { name: "Pruebas Tiroideas (TSH, T4 Libre)", code: "TIR-08" },
    ];

    const industrialAnalyses = [
        { name: "Recuento Total Aeróbico (RTA)", code: "RTA" },
        { name: "Coliformes Totales / Fecales", code: "CT/CF" },
        { name: "Escherichia coli", code: "EC" },
        { name: "Staphylococcus aureus", code: "STA" },
        { name: "Hongos y Levaduras (HL)", code: "HL" },
        { name: "Salmonella sp. (Presencia/Ausencia)", code: "SAL" },
        { name: "Listeria monocytogenes", code: "LMO" },
        { name: "Análisis Físico-Químico de Agua", code: "FQ-AGUA" },
    ];

    const activeAnalyses = formType === 'clinical' ? clinicalAnalyses : industrialAnalyses;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Volver
                </button>

                <div className="flex bg-slate-200 p-1 rounded-xl">
                    <button 
                        onClick={() => setFormType('clinical')} 
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                            formType === 'clinical' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        🏥 Formulario Clínico (Pacientes)
                    </button>
                    <button 
                        onClick={() => setFormType('industrial')} 
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                            formType === 'industrial' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        🏭 Formulario Industrial (Aguas y Alimentos)
                    </button>
                </div>

                <button onClick={handlePrint} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm">
                    <Printer size={18} className="mr-2" /> Imprimir Formulario
                </button>
            </div>

            <div className="bg-white p-8 sm:p-10 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="flex justify-between items-center border-b-2 border-slate-800 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-40 flex-shrink-0 flex items-center justify-center bg-transparent">
                            <img src={labInfo?.logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div>
                            <p className="text-slate-800 font-extrabold uppercase tracking-wider text-sm">
                                {formType === 'clinical' 
                                    ? 'Formulario de Ingreso de Muestras Clínicas (Pacientes)' 
                                    : 'Formulario de Ingreso de Muestras (Industria, Aguas y Alimentos)'}
                            </p>
                            <p className="text-xs text-slate-500 font-semibold">
                                {formType === 'clinical' ? 'Laboratorio Clínico y Microbiológico' : 'Control de Calidad e Inocuidad Alimentaria'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <BarcodeDisplay value={uniqueFormId} />
                        <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Nº Formulario</p>
                    </div>
                </div>

                <div className="space-y-6 mb-8 text-sm">
                    {formType === 'clinical' ? (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Nombre Paciente:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Cédula / DNI:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Fecha de Nacimiento:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Sexo (M / F / O):</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Médico / Clínica:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Fecha / Hora Toma:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="col-span-2 flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/4">Tipo Muestra Biológica:</span>
                                <span className="text-xs text-slate-500 italic mr-2">(Sangre Total, Suero, Orina, Heces, Exudado, etc.)</span>
                                <div className="flex-1"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Empresa / Cliente:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Contacto / Cargo:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Lote(s) / Código:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Temp. Recepción (°C):</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Fecha / Hora Recepción:</span>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-end border-b border-slate-400 print:border-slate-800 pb-1">
                                <span className="font-bold text-slate-700 w-1/3">Tipo de Matriz:</span>
                                <span className="text-xs text-slate-500 italic mr-2">(Alimento, Agua, Superficie, Aire)</span>
                                <div className="flex-1"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 bg-slate-100 print:bg-slate-200 p-2 border border-slate-300 print:border-slate-800">
                        {formType === 'clinical' ? 'Pruebas Clínicas Solicitadas' : 'Análisis Industriales Solicitados'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {activeAnalyses.map((ana, idx) => (
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
                        <p className="font-bold text-slate-700 text-sm mb-2">Otros Análisis Específicos (Indique nombre o parámetro):</p>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-6 mt-4"></div>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-6"></div>
                        <div className="border-b border-slate-300 print:border-slate-400 mb-2"></div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Observaciones Generales / Diagnóstico / Condiciones:</h3>
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
                        <p className="text-sm font-bold text-slate-700">Entregado por (Cliente / Paciente / Muestreador)</p>
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
