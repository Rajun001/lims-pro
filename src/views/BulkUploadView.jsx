import React, { useState } from 'react';
import { ArrowLeft, FileSpreadsheet, Save, Check } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId as appId } from '../services/firebase';
import { generateAnalysisCode } from '../utils/generators';

export const BulkUploadView = ({ db, user, navigateTo }) => {
    const [uploadType, setUploadType] = useState('clinical'); // 'clinical' | 'industrial'
    const [parsedData, setParsedData] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            parseCSV(text);
        };
        reader.readAsText(file);
    };

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length <= 1) return;

        const data = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
                nombre: values[0]?.trim() || '',
                identificacion: values[1]?.trim() || '',
                email: values[2]?.trim() || '',
                telefono: values[3]?.trim() || '',
                tipo_muestra: values[4]?.trim() || (uploadType === 'clinical' ? 'Sangre Total' : 'Alimentos'),
                analisis: values[5]?.trim() || (uploadType === 'clinical' ? 'Hemograma Completo' : 'Recuento Total Aeróbico')
            };
        });
        setParsedData(data.filter(d => d.nombre));
    };

    const processBatch = async () => {
        if (parsedData.length === 0) return;
        setIsProcessing(true);
        let successCount = 0;
        let failCount = 0;

        for (const item of parsedData) {
            try {
                const isClinical = uploadType === 'clinical';
                const analysisCode = generateAnalysisCode(item.analisis);

                if (user?.uid === 'offline-user') {
                    const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                    const newReq = {
                        id: `MC-BULK-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                        clientName: item.nombre,
                        clientType: isClinical ? 'Clínica' : 'Industria',
                        sampleType: isClinical ? 'Clínica' : item.tipo_muestra,
                        sampleDescription: item.tipo_muestra,
                        identificacion: item.identificacion,
                        email: item.email,
                        telefono: item.telefono,
                        ...(isClinical ? {
                            patientName: item.nombre,
                            patientDNI: item.identificacion,
                            patientPhone: item.telefono,
                            requesterName: 'Médico Tratante / Consulta Externa'
                        } : {}),
                        requestDate: new Date().toISOString(),
                        analysisRequested: item.analisis,
                        analysisCode,
                        deliveryMethod: 'Email',
                        analysisIds: [],
                        results: {},
                        status: 'Pendiente',
                        createdAt: { seconds: Math.floor(Date.now() / 1000) },
                        createdBy: 'offline-user'
                    };
                    localReqs.unshift(newReq);
                    localStorage.setItem('lims_local_requests', JSON.stringify(localReqs));
                } else {
                    await addDoc(collection(db, `artifacts/${appId}/public/data/requests`), {
                        clientName: item.nombre,
                        clientType: isClinical ? 'Clínica' : 'Industria',
                        sampleType: isClinical ? 'Clínica' : item.tipo_muestra,
                        sampleDescription: item.tipo_muestra,
                        identificacion: item.identificacion,
                        email: item.email,
                        telefono: item.telefono,
                        ...(isClinical ? {
                            patientName: item.nombre,
                            patientDNI: item.identificacion,
                            patientPhone: item.telefono,
                            requesterName: 'Médico Tratante / Consulta Externa'
                        } : {}),
                        requestDate: serverTimestamp(),
                        analysisRequested: item.analisis,
                        analysisCode,
                        deliveryMethod: 'Email',
                        analysisIds: [],
                        results: {},
                        status: 'Pendiente',
                        createdAt: serverTimestamp(),
                        createdBy: user?.uid || 'anon'
                    });
                }
                successCount++;
            } catch (e) {
                console.error("Error creating request from batch:", e);
                failCount++;
            }
        }

        if (user?.uid === 'offline-user') {
            window.dispatchEvent(new Event('lims_local_data_updated'));
        }

        setIsProcessing(false);
        setResults({ success: successCount, failed: failCount });
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-12">
            <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
                <ArrowLeft size={18} className="mr-2" /> Volver a Solicitudes
            </button>

            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Carga Masiva de Solicitudes</h2>
                            <p className="text-slate-500 text-sm mt-1">Sube un archivo CSV para generar múltiples órdenes en bloque.</p>
                        </div>
                    </div>

                    {/* Selector de Tipo de Carga */}
                    <div className="flex bg-slate-200 p-1 rounded-xl">
                        <button 
                            onClick={() => { setUploadType('clinical'); setParsedData([]); }} 
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                                uploadType === 'clinical' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            🏥 Pacientes (Clínico)
                        </button>
                        <button 
                            onClick={() => { setUploadType('industrial'); setParsedData([]); }} 
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                                uploadType === 'industrial' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            🏭 Industria (Alimentos/Aguas)
                        </button>
                    </div>
                </div>

                {!results ? (
                    <div className="space-y-8">
                        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-10 text-center">
                            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center">
                                <FileSpreadsheet size={40} className="text-slate-400 mb-4" />
                                <span className="text-lg font-bold text-slate-700">Seleccionar Archivo CSV ({uploadType === 'clinical' ? 'Pacientes' : 'Alimentos/Aguas'})</span>
                                <span className="text-sm text-slate-500 mt-2">
                                    Formato esperado (separado por comas):<br />
                                    {uploadType === 'clinical' ? (
                                        <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-slate-200 mt-1 inline-block">
                                            Nombre Paciente, Cédula, Email, Teléfono, Tipo Muestra Biológica, Prueba Clínica
                                        </span>
                                    ) : (
                                        <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-slate-200 mt-1 inline-block">
                                            Nombre Empresa, Cédula Jurídica, Email, Teléfono, Tipo Muestra (Alimento/Agua), Análisis Requerido
                                        </span>
                                    )}
                                </span>
                            </label>
                        </div>

                        {parsedData.length > 0 && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                                    <span>Vista Previa ({parsedData.length} registros - Modo {uploadType === 'clinical' ? 'Clínico' : 'Industrial'})</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                            <tr>
                                                <th className="p-3">{uploadType === 'clinical' ? 'Paciente' : 'Empresa'}</th>
                                                <th className="p-3">Identificación</th>
                                                <th className="p-3">Tipo Muestra</th>
                                                <th className="p-3">Análisis</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.map((d, i) => (
                                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                    <td className="p-3 font-medium">{d.nombre}</td>
                                                    <td className="p-3">{d.identificacion}</td>
                                                    <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{d.tipo_muestra}</span></td>
                                                    <td className="p-3 font-mono text-xs text-indigo-700">{d.analisis}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-200">
                                    <button onClick={processBatch} disabled={isProcessing} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                        {isProcessing ? 'Procesando...' : <><Save size={18} /> Crear {parsedData.length} Solicitudes en Lote</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Carga Completada!</h3>
                        <p className="text-slate-600 mb-8">Se procesaron los registros exitosamente.</p>
                        <div className="flex justify-center gap-4 mb-8">
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center w-32">
                                <p className="text-3xl font-bold text-green-600">{results.success}</p>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Éxitos</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center w-32">
                                <p className="text-3xl font-bold text-red-600">{results.failed}</p>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Errores</p>
                            </div>
                        </div>
                        <button onClick={() => navigateTo('dashboard')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                            Volver al Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
