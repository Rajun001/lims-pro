import React, { useState } from 'react';
import { Activity, RefreshCcw, Cpu, Link as LinkIcon, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { LoadingSpinner, StatusBadge } from '../components/UI';
import { FlashAndGoImporter } from '../components/FlashAndGoImporter';
import HardwareLink from '../services/HardwareLink';

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';

export const AnalyzerInboxView = ({ db }) => {
    const [isPolling, setIsPolling] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showImporter, setShowImporter] = useState(false);
    
    // Mock data representing JSON payloads received from the local HL7 middleware
    const [incomingResults, setIncomingResults] = useState([
        { id: 'msg-001', equipment: 'Fuji NX6000', barcode: 'MC-2026-0506', tests: ['GLU-03', 'LIP-02'], timestamp: 'Hace 5 min', status: 'pending', rawData: { 'GLU-03': 95, 'LIP-02': 'Ver detalle' } },
        { id: 'msg-002', equipment: 'Snibe Maglumi 800', barcode: 'MC-2026-0507', tests: ['TSH', 'T4L'], timestamp: 'Hace 12 min', status: 'matched', rawData: { 'TSH': 2.4, 'T4L': 1.1 } },
        { id: 'msg-003', equipment: 'Fuji NX6000', barcode: 'UNKNOWN-889', tests: ['HEM-01'], timestamp: 'Hace 1 hora', status: 'error', rawData: { 'HEM-01': 'Error lectura' } },
    ]);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIncomingResults(prev => [
                { id: `msg-${Date.now()}`, equipment: 'Snibe Maglumi 800', barcode: 'MC-2026-0508', tests: ['PSA'], timestamp: 'Justo ahora', status: 'pending', rawData: { 'PSA': 1.2 } },
                ...prev
            ]);
            setIsSyncing(false);
        }, 1500);
    };

    const handleConnectHardware = async () => {
        try {
            await HardwareLink.connect();
            setIsPolling(true);
            alert("Dispositivo conectado. Escuchando flujo de datos por puerto serie...");
            
            // Comenzar a escuchar
            HardwareLink.startListening((dataStr) => {
                console.log("[Hardware Raw Data]: ", dataStr);
                // Aquí en producción un parser (HL7/ASTM) decodificaría el dataStr
                // y lo añadiría a incomingResults
            });
        } catch (e) {
            console.error(e);
            alert("Error al conectar: " + e.message);
        }
    };

    const processResult = async (id) => {
        const res = incomingResults.find(r => r.id === id);
        if (!res) return;

        try {
            // Attempt to update the request document with these results
            const requestRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, res.barcode);
            
            // Fetch existing results to prevent data overwrites
            const requestSnap = await getDoc(requestRef);
            let currentResults = [];
            if (requestSnap.exists()) {
                currentResults = requestSnap.data().analyzerResults || [];
            }

            if (res.equipment === 'IUL Flash & Go') {
                const limit = requestSnap.exists() && requestSnap.data().foodUFCResult?.limit ? requestSnap.data().foodUFCResult.limit : '10000';
                const count = res.rawData['Count'] || 0;
                const resultUfc = res.rawData['UFC'] || 0;
                const isRejected = resultUfc > parseFloat(limit);
                
                await updateDoc(requestRef, {
                    foodUFCResult: {
                        testName: 'Recuento Automatizado (Flash&Go)',
                        platingMethod: 'Siembra Automatizada',
                        colonies: count.toString(),
                        dilution: res.rawData['Dilution'] || '0',
                        volume: '1',
                        limit: limit,
                        resultUFC: resultUfc,
                        isRejected: isRejected
                    },
                    hasAutomatedResults: true,
                    status: 'Pendiente Revisión'
                });
            } else {
                // Format the results to append to the request
                const mappedResults = Object.keys(res.rawData).map(testCode => ({
                    testCode,
                    value: res.rawData[testCode].toString(),
                    origin: `Automatizado (${res.equipment})`,
                    timestamp: new Date().toISOString(),
                    status: 'pending_review' // Needs review before final release
                }));

                // Merge results: if a testCode already exists, update it; otherwise append
                let updatedResults = [...currentResults];
                mappedResults.forEach(newRes => {
                    const idx = updatedResults.findIndex(r => r.testCode === newRes.testCode);
                    if (idx > -1) {
                        updatedResults[idx] = newRes;
                    } else {
                        updatedResults.push(newRes);
                    }
                });

                await updateDoc(requestRef, {
                    analyzerResults: updatedResults,
                    hasAutomatedResults: true,
                    status: 'Pendiente Revisión' // Auto move to review state
                });
            }

            setIncomingResults(prev => prev.map(r => r.id === id ? { ...r, status: 'matched' } : r));
        } catch (error) {
            console.error("Error linking result to request:", error);
            alert("Error al vincular: Es posible que el código de barras no exista en la base de datos de solicitudes.");
            setIncomingResults(prev => prev.map(r => r.id === id ? { ...r, status: 'error' } : r));
        }
    };

    const handleImportFlashAndGo = (parsedData) => {
        setIncomingResults(prev => [...parsedData, ...prev]);
        setShowImporter(false);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Cpu className="text-blue-600" /> Buzón de Analizadores</h2>
                    <p className="text-slate-500 text-sm mt-1">Recepción automática de resultados desde equipos clínicos (HL7/ASTM middleware).</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleConnectHardware} 
                        className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${isPolling ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                    >
                        <Activity size={18} className={isPolling ? 'animate-pulse' : ''} />
                        {isPolling ? 'Escuchando Puerto...' : 'Conectar Analizador (USB)'}
                    </button>
                    <button 
                        onClick={() => setShowImporter(!showImporter)}
                        className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${showImporter ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Database size={18} /> Importar CSV
                    </button>
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} /> Sincronizar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <Database size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase text-xs">Total Recibidos (Hoy)</p>
                        <h3 className="text-2xl font-black text-slate-800">{incomingResults.length + 14}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <LinkIcon size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase text-xs">Pendientes de Vinculación</p>
                        <h3 className="text-2xl font-black text-slate-800">{incomingResults.filter(r => r.status === 'pending').length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase text-xs">Procesados Exitosamente</p>
                        <h3 className="text-2xl font-black text-slate-800">{incomingResults.filter(r => r.status === 'matched').length + 13}</h3>
                    </div>
                </div>
            </div>

            {showImporter && (
                <FlashAndGoImporter onImport={handleImportFlashAndGo} />
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">Resultados Entrantes en Cola</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-bold">Hora</th>
                                <th className="p-4 font-bold">Equipo Origen</th>
                                <th className="p-4 font-bold">Código de Barras LIMS</th>
                                <th className="p-4 font-bold">Análisis Detectados</th>
                                <th className="p-4 font-bold">Estado LIMS</th>
                                <th className="p-4 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {incomingResults.map((res) => (
                                <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 font-medium">{res.timestamp}</td>
                                    <td className="p-4 font-bold text-slate-800">{res.equipment}</td>
                                    <td className="p-4 font-mono font-bold text-blue-600 bg-blue-50/50 px-2 rounded">{res.barcode}</td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex gap-1">
                                            {res.tests.map(t => <span key={t} className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{t}</span>)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {res.status === 'pending' && <StatusBadge status="En Proceso" />}
                                        {res.status === 'matched' && <StatusBadge status="Completado" />}
                                        {res.status === 'error' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 flex items-center gap-1 w-max"><AlertCircle size={12}/> Error ID</span>}
                                    </td>
                                    <td className="p-4">
                                        {res.status === 'pending' ? (
                                            <button onClick={() => processResult(res.id)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                Validar y Guardar
                                            </button>
                                        ) : res.status === 'matched' ? (
                                            <button disabled className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                                                <CheckCircle2 size={14} /> Vinculado
                                            </button>
                                        ) : (
                                            <button className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                Reasignar ID Manual
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {incomingResults.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No hay resultados en la cola. El middleware HL7 está a la espera de transmisiones.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
