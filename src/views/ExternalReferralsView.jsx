import React, { useState, useMemo } from 'react';
import { Send, Search, CheckCircle2, Clock, Truck, FileText, ArrowLeft, Paperclip, Download, Sparkles } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { StatusBadge } from '../components/UI';

export const ExternalReferralsView = ({ requests, db, user, navigateTo }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [targetLab, setTargetLab] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal para registrar resultados
    const [showResultModal, setShowResultModal] = useState(false);
    const [activeReferral, setActiveReferral] = useState(null);
    const [resultNotes, setResultNotes] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState('');
    const [extractedPatient, setExtractedPatient] = useState(null);

    const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('LIMS_GEMINI_API_KEY') || '');
    const [isExtracting, setIsExtracting] = useState(false);

    const referredRequests = useMemo(() => {
        return requests.filter(r => r.isReferred).sort((a, b) => {
            const dateA = a.referralDate?.seconds || 0;
            const dateB = b.referralDate?.seconds || 0;
            return dateB - dateA;
        });
    }, [requests]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        if (!e.target.value) setSelectedRequest(null);
    };

    const searchResults = useMemo(() => {
        if (!searchQuery || searchQuery.length < 3) return [];
        const query = searchQuery.toLowerCase();
        return requests.filter(r => 
            !r.isReferred &&
            (
                r.id.toLowerCase().includes(query) ||
                (r.clientName && r.clientName.toLowerCase().includes(query)) ||
                (r.patientName && r.patientName.toLowerCase().includes(query)) ||
                (r.analysisRequested && r.analysisRequested.toLowerCase().includes(query))
            )
        ).slice(0, 5);
    }, [searchQuery, requests]);

    const handleCreateReferral = async () => {
        if (!selectedRequest || !targetLab) {
            alert("Seleccione una muestra y especifique el laboratorio destino.");
            return;
        }

        setIsSubmitting(true);
        try {
            const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, selectedRequest.id);
            await updateDoc(reqRef, {
                isReferred: true,
                referralLab: targetLab,
                referralDate: serverTimestamp(),
                referralStatus: 'Enviado',
                referralResults: '',
                status: 'Derivado'
            });

            await logAuditAction(
                db, 
                user?.uid || 'anon', 
                'DERIVAR_MUESTRA', 
                `Muestra derivada a laboratorio externo: ${targetLab}`, 
                selectedRequest.id
            );

            alert("Muestra marcada como derivada exitosamente.");
            setSearchQuery('');
            setSelectedRequest(null);
            setTargetLab('');
        } catch (error) {
            console.error("Error creating referral:", error);
            alert("Error al derivar la muestra.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExtractWithAI = async () => {
        let base64String = '';
        let mimeType = 'application/pdf'; // fallback

        if (attachmentFile) {
            base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result;
                    resolve(result.substring(result.indexOf(',') + 1));
                };
                reader.onerror = error => reject(error);
                reader.readAsDataURL(attachmentFile);
            });
            mimeType = attachmentFile.type;
        } else if (activeReferral && activeReferral.referralAttachmentData) {
            const dataUrl = activeReferral.referralAttachmentData;
            const commaIndex = dataUrl.indexOf(',');
            if (commaIndex !== -1) {
                base64String = dataUrl.substring(commaIndex + 1);
                const match = dataUrl.match(/^data:([^;]+);/);
                if (match) {
                    mimeType = match[1];
                }
            } else {
                alert("El archivo guardado no tiene un formato válido para extracción.");
                return;
            }
        } else {
            alert("Por favor adjunte un archivo PDF o imagen primero.");
            return;
        }
        
        let currentKey = geminiApiKey;
        if (!currentKey) {
            currentKey = prompt("✨ Extraer con IA: Por favor, pegue su API Key gratuita de Gemini (Google AI Studio):");
            if (currentKey) {
                currentKey = currentKey.trim();
                localStorage.setItem('LIMS_GEMINI_API_KEY', currentKey);
                setGeminiApiKey(currentKey);
            } else {
                return;
            }
        }

        setIsExtracting(true);
        setUploadProgress('Leyendo documento con Inteligencia Artificial...');
        
        try {

            const promptText = `Eres un experto analista de laboratorio clínico. Tu tarea es extraer la información analítica de este reporte de resultados y devolverla en un formato ultra limpio.
            
Reglas estrictas:
1. Ignora por completo membretes, firmas, fechas, direcciones y textos irrelevantes del laboratorio externo.
2. EXTRAE LOS DATOS DEL PACIENTE: Al principio de todo tu texto, crea un bloque oculto exactamente con este formato:
<DATOS_PACIENTE>
Nombre: [Nombre del paciente]
ID: [Cédula o dejar vacío]
Nacimiento: [Fecha en formato YYYY-MM-DD o dejar vacío]
Sexo: [Masculino o Femenino u Otro o dejar vacío]
</DATOS_PACIENTE>
3. Devuelve los resultados EXCLUSIVAMENTE en formato de Tabla Markdown con las siguientes columnas: Prueba | Resultado | Unidad | Rango de Referencia | Bandera.
4. Analiza el "Resultado" numérico frente al "Rango de Referencia". Si el resultado está claramente por fuera del rango normal (alto o bajo), en la columna Bandera escribe "🔴 ANORMAL". Si está dentro del rango o es "Negativo/No detectado", escribe "🟢 NORMAL".
4. ¡ATENCIÓN! Para hormonas (ej. Estradiol, FSH, LH) o pruebas que tienen múltiples rangos de referencia dependiendo de la fase del ciclo menstrual o la edad cronológica: Si el PDF NO ESPECIFICA explícitamente la fase del paciente, NO ASUMAS NADA. En su lugar, escribe "⚠️ REQUIERE CORRELACIÓN" en la columna Bandera en lugar de NORMAL o ANORMAL.
5. Si el PDF incluye múltiples perfiles (ej. Hemograma, Perfil Lipídico), usa subtítulos Markdown (## Nombre del Perfil) para separar las tablas.
6. Al final del documento, agrega un subtítulo "### Resumen de Hallazgos" donde listes brevemente ÚNICAMENTE las pruebas que salieron anormales o requirieron correlación clínica. No des consejos médicos, solo resume los hallazgos técnicos.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType, data: base64String } }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                let errorData = '';
                try {
                    const errJson = await response.json();
                    errorData = errJson?.error?.message || response.statusText || 'Error desconocido';
                } catch {
                    errorData = response.statusText || response.status;
                }
                
                if (response.status === 400 && errorData.toLowerCase().includes('api key')) {
                    localStorage.removeItem('LIMS_GEMINI_API_KEY');
                    setGeminiApiKey('');
                    throw new Error("API Key inválida. Verifique su llave de Google AI Studio.");
                }
                throw new Error(`Error del servidor de IA (${response.status}): ${errorData}`);
            }

            const data = await response.json();
            const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (extractedText) {
                const match = extractedText.match(/<DATOS_PACIENTE>([\s\S]*?)<\/DATOS_PACIENTE>/);
                let cleanText = extractedText;
                
                if (match) {
                    const lines = match[1].split('\n');
                    const pt = {};
                    lines.forEach(l => {
                        if (l.includes('Nombre:')) pt.name = l.split('Nombre:')[1].trim();
                        if (l.includes('ID:')) pt.document = l.split('ID:')[1].trim();
                        if (l.includes('Nacimiento:')) pt.birthDate = l.split('Nacimiento:')[1].trim();
                        if (l.includes('Sexo:')) pt.gender = l.split('Sexo:')[1].trim();
                    });
                    setExtractedPatient(pt);
                    cleanText = extractedText.replace(match[0], '').trim();
                } else {
                    setExtractedPatient(null);
                }

                setResultNotes(prev => prev ? prev + '\n\n---\n' + cleanText : cleanText);
                setUploadProgress('¡Extracción completada con éxito!');
            } else {
                setUploadProgress('No se encontró información estructurada en el documento.');
            }
        } catch (error) {
            console.error("AI Extraction Error:", error);
            alert(error.message);
            setUploadProgress('Error en la extracción.');
        } finally {
            setIsExtracting(false);
            setTimeout(() => { 
                setUploadProgress(prev => prev.includes('Extracción') || prev.includes('Error') ? '' : prev);
            }, 5000);
        }
    };

    const handleOpenResultModal = (req) => {
        setActiveReferral(req);
        setResultNotes(req.referralResults || '');
        setAttachmentFile(null);
        setUploadProgress('');
        setExtractedPatient(null);
        setShowResultModal(true);
    };

    const handleSaveResult = async () => {
        if (!activeReferral) return;

        // Validar tamaño para no exceder límite de Firestore (1MB)
        if (attachmentFile && attachmentFile.size > 800000) {
            alert("El archivo es demasiado grande (máximo 800 KB). Por favor comprima el PDF o use una captura de pantalla más ligera.");
            return;
        }

        setIsSubmitting(true);
        setUploadProgress('Iniciando guardado...');
        try {
            let fileDataUrl = activeReferral.referralAttachmentData || null;
            let fileName = activeReferral.referralAttachmentName || null;

            if (attachmentFile) {
                setUploadProgress('Procesando archivo adjunto...');
                fileDataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(attachmentFile);
                });
                fileName = attachmentFile.name;
                setUploadProgress('Archivo procesado.');
            }

            setUploadProgress('Actualizando base de datos...');
            const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, activeReferral.id);
            await updateDoc(reqRef, {
                referralStatus: 'Completado',
                referralResults: resultNotes,
                status: 'Pendiente Revisión',
                referralAttachmentData: fileDataUrl,
                referralAttachmentName: fileName
            });

            if (extractedPatient && extractedPatient.name && extractedPatient.name !== 'vacío' && !extractedPatient.name.includes('[')) {
                try {
                    const clientsRef = collection(db, `artifacts/${LIMSSystemId}/public/data/clients`);
                    const nameToSearch = extractedPatient.name;
                    const snapshot = await getDocs(clientsRef);
                    let patientExists = false;
                    snapshot.forEach(d => {
                        const c = d.data();
                        if (c.name && c.name.trim().toLowerCase() === nameToSearch.trim().toLowerCase()) {
                            patientExists = true;
                        }
                    });

                    if (!patientExists) {
                        setUploadProgress('Creando nuevo paciente en el CRM...');
                        let gender = extractedPatient.gender;
                        if (!gender || gender === 'vacío' || gender.includes('[')) gender = 'Otro';
                        
                        await addDoc(clientsRef, {
                            name: nameToSearch,
                            document: extractedPatient.document !== 'vacío' && !extractedPatient.document.includes('[') ? extractedPatient.document : '',
                            birthDate: extractedPatient.birthDate !== 'vacío' && !extractedPatient.birthDate.includes('[') ? extractedPatient.birthDate : '',
                            gender: gender,
                            type: 'Paciente (Clínico)',
                            contacts: [],
                            status: 'Activo',
                            ltv: 0,
                            lastContact: 'Justo ahora',
                            createdAt: serverTimestamp()
                        });
                        setUploadProgress('Paciente creado en CRM.');
                    }
                } catch (err) {
                    console.error("Error creating patient in CRM:", err);
                }
            }

            await logAuditAction(
                db, 
                user?.uid || 'anon', 
                'RESULTADO_DERIVACION', 
                `Resultados externos recibidos de ${activeReferral.referralLab}${fileName ? ' (con adjunto)' : ''}`, 
                activeReferral.id
            );

            alert("Resultados registrados exitosamente.");
            setShowResultModal(false);
            setActiveReferral(null);
            setResultNotes('');
            setAttachmentFile(null);
        } catch (error) {
            console.error("Error saving referral result:", error);
            alert("Error al guardar el resultado. Verifique permisos o tamaño del archivo.");
        } finally {
            setIsSubmitting(false);
            setUploadProgress('');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Truck size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Envíos Externos</h2>
                    <p className="text-slate-500 text-sm mt-1">Control de muestras enviadas a laboratorios de referencia.</p>
                </div>
            </div>

            {/* Panel de Nueva Derivación */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Send size={18} className="text-indigo-500" /> Nuevo Envío
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                    <div className="relative lg:col-span-1">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Buscar Muestra (ID, Paciente, Análisis)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Escriba para buscar..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                            />
                        </div>

                        {searchQuery.length >= 3 && !selectedRequest && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                {searchResults.map(req => (
                                    <div 
                                        key={req.id} 
                                        onClick={() => {
                                            setSelectedRequest(req);
                                            setSearchQuery('');
                                        }}
                                        className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-slate-800 text-sm truncate pr-2">{req.patientName || req.clientName}</span>
                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{req.id.substring(0, 8).toUpperCase()}</span>
                                        </div>
                                        <div className="text-xs text-indigo-600 font-medium truncate">{req.analysisRequested}</div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && (
                                    <div className="p-4 text-center text-slate-500 text-sm">No se encontraron muestras pendientes de enviar.</div>
                                )}
                            </div>
                        )}

                        {selectedRequest && (
                            <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                                <div>
                                    <span className="block text-[10px] font-bold text-indigo-400 uppercase">Muestra Seleccionada</span>
                                    <span className="font-bold text-indigo-900 text-sm truncate block">{selectedRequest.patientName || selectedRequest.clientName}</span>
                                    <span className="text-xs text-indigo-600">{selectedRequest.analysisRequested}</span>
                                </div>
                                <button onClick={() => setSelectedRequest(null)} className="text-indigo-400 hover:text-indigo-700 p-1">✕</button>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Laboratorio Destino <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            placeholder="Ej. Laboratorio Nacional..."
                            value={targetLab}
                            onChange={(e) => setTargetLab(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <button 
                            onClick={handleCreateReferral}
                            disabled={!selectedRequest || !targetLab || isSubmitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Send size={18} />
                            {isSubmitting ? 'Procesando...' : 'Registrar Envío'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Listado de Derivaciones */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={18} className="text-slate-500" /> Registro de Muestras Enviadas
                    </h3>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        {referredRequests.length} Total
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="p-4 font-bold w-24">ID Muestra</th>
                                <th className="p-4 font-bold">Paciente / Cliente</th>
                                <th className="p-4 font-bold">Análisis Requerido</th>
                                <th className="p-4 font-bold">Lab. Destino</th>
                                <th className="p-4 font-bold">Fecha Envío</th>
                                <th className="p-4 font-bold">Estado Envío</th>
                                <th className="p-4 font-bold text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {referredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        No hay registros de envíos externos.
                                    </td>
                                </tr>
                            ) : (
                                referredRequests.map(req => {
                                    const refDate = req.referralDate?.seconds ? new Date(req.referralDate.seconds * 1000).toLocaleDateString() : 'N/A';
                                    const isCompleted = req.referralStatus === 'Completado';

                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-indigo-600 font-bold">
                                                <span 
                                                    onClick={() => navigateTo('request_details', req.id)}
                                                    className="cursor-pointer hover:underline"
                                                >
                                                    {req.id.substring(0, 8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">{req.patientName || req.clientName}</td>
                                            <td className="p-4 text-slate-600 font-medium">{req.analysisRequested}</td>
                                            <td className="p-4">
                                                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200">
                                                    {req.referralLab}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500 font-medium">{refDate}</td>
                                            <td className="p-4">
                                                {isCompleted ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full w-max border border-emerald-100">
                                                        <CheckCircle2 size={14} /> Recibido
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded-full w-max border border-amber-100">
                                                        <Clock size={14} /> Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {!isCompleted ? (
                                                    <button 
                                                        onClick={() => handleOpenResultModal(req)}
                                                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded shadow-sm transition-colors"
                                                    >
                                                        Registrar Resultado
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleOpenResultModal(req)}
                                                        className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors flex items-center justify-center gap-1 mx-auto"
                                                    >
                                                        <FileText size={14} /> Ver Notas
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Resultados */}
            {showResultModal && activeReferral && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
                        <h3 className="text-xl font-extrabold text-slate-800 mb-2">
                            {activeReferral.referralStatus === 'Completado' ? 'Resultados Externos' : 'Registrar Resultados'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6 pb-4 border-b border-slate-100">
                            Muestra: <strong className="text-slate-800">{activeReferral.id.substring(0, 8).toUpperCase()}</strong> - {activeReferral.analysisRequested}
                            <br/>
                            Laboratorio: <strong>{activeReferral.referralLab}</strong>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Comentarios / Notas (Opcional)</label>
                                <textarea
                                    value={resultNotes}
                                    onChange={(e) => setResultNotes(e.target.value)}
                                    rows="5"
                                    placeholder="Escriba notas adicionales o use el botón de IA para extraer..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                                ></textarea>
                            </div>

                            {activeReferral.referralStatus !== 'Completado' ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Adjuntar Reporte Original (PDF o Imagen)</label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors relative">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Paperclip className="w-8 h-8 mb-3 text-slate-400" />
                                                <p className="mb-2 text-sm text-slate-500 font-medium">
                                                    {attachmentFile ? <span className="text-indigo-600">{attachmentFile.name}</span> : <><span className="font-bold">Haga clic</span> o arrastre el archivo aquí</>}
                                                </p>
                                                <p className="text-xs text-slate-400">PDF, JPG, PNG (Max 800KB)</p>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => setAttachmentFile(e.target.files[0])}
                                            />
                                        </label>
                                    </div>
                                    {attachmentFile && (
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handleExtractWithAI}
                                                disabled={isExtracting}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg shadow-sm font-bold text-xs transition-all disabled:opacity-50"
                                            >
                                                <Sparkles size={14} className={isExtracting ? "animate-pulse" : ""} />
                                                {isExtracting ? 'Analizando documento...' : '✨ Extraer Resultados con IA'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : activeReferral.referralAttachmentData ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Documento Adjunto Guardado</label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <a 
                                            href={activeReferral.referralAttachmentData} 
                                            download={activeReferral.referralAttachmentName || 'Reporte_Externo'}
                                            className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors font-bold text-sm w-max"
                                        >
                                            <Download size={18} /> Descargar Documento Original
                                        </a>
                                        <button
                                            type="button"
                                            onClick={handleExtractWithAI}
                                            disabled={isExtracting}
                                            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl shadow-sm font-bold text-sm transition-all disabled:opacity-50"
                                        >
                                            <Sparkles size={16} className={isExtracting ? "animate-pulse" : ""} />
                                            {isExtracting ? 'Analizando documento...' : '✨ Extraer Resultados con IA'}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {uploadProgress && (
                                <p className="text-xs font-bold text-indigo-600 animate-pulse text-center mt-2">{uploadProgress}</p>
                            )}

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => {
                                        setShowResultModal(false);
                                        setActiveReferral(null);
                                    }}
                                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button 
                                    onClick={handleSaveResult}
                                    disabled={isSubmitting || isExtracting}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> {activeReferral.referralStatus === 'Completado' ? 'Actualizar Resultados' : 'Guardar Resultados'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
