import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, FileText, ShieldCheck, Check, Package, Microscope, Activity, CheckCircle2, FlaskConical, Trash2, Edit, Users, User, MapPin, Lock, Share2 } from 'lucide-react';
import { StatusBadge } from '../components/UI';
import { ASTMatrix } from '../components/ASTMatrix';
import { UFCCalculator } from '../components/UFCCalculator';
import { AirSamplerCalculator } from '../components/AirSamplerCalculator';
import { CAMTUCalculator } from '../components/CAMTUCalculator';
import { NMPCalculator } from '../components/NMPCalculator';
import { BarcodePrinter } from '../components/BarcodePrinter';
import { ShareReportModal } from '../components/ShareReportModal';
import { SampleTraceabilityRoute } from '../components/SampleTraceabilityRoute';
import { evaluateCriticalPanicValue, calculateDeltaCheck } from '../utils/criticalAlerts';
import { deductInventoryForRequest } from '../utils/inventoryDeduction';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { generateAnalysisCode } from '../utils/generators';
import { useNotification } from '../contexts/NotificationContext';
import { runClinicalCalculations } from '../utils/clinicalCalcs';
import cmqccrCatalog from '../data/cmqccr_catalog.json';

export const RequestDetails = ({ request, navigateTo, db, availableAnalyses, user, labInfo }) => {
    const [activeTab, setActiveTab] = useState('custody');
    const [auditLogs, setAuditLogs] = useState([]);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const { addNotification } = useNotification();

    const updateRequestOfflineOrOnline = async (payload, auditAction = null, auditDetails = null) => {
        try {
            if (user?.uid === 'offline-user') {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const idx = localReqs.findIndex(r => r.id === request.id);
                if (idx > -1) {
                    localReqs[idx] = { ...localReqs[idx], ...payload };
                }
                localStorage.setItem('lims_local_requests', JSON.stringify(localReqs));
                window.dispatchEvent(new Event('lims_local_data_updated'));
                if (auditAction) {
                    await logAuditAction(db, user?.uid, auditAction, auditDetails, request.id);
                }
            } else {
                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, request.id);
                await updateDoc(reqRef, payload);
                if (auditAction) {
                    await logAuditAction(db, user?.uid, auditAction, auditDetails, request.id);
                }
            }
        } catch (err) {
            console.error("Error updating request:", err);
            throw err;
        }
    };
    
    const handleDeleteRequest = async () => {
        if (window.confirm(`¿Está seguro de eliminar esta Orden de Laboratorio (${request.id.substring(0, 8).toUpperCase()})? Se perderán todos los resultados y el historial asociado a esta muestra. Esta acción es irreversible.`)) {
            try {
                if (user?.uid === 'offline-user') {
                    const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                    const filtered = localReqs.filter(r => r.id !== request.id);
                    localStorage.setItem('lims_local_requests', JSON.stringify(filtered));
                    window.dispatchEvent(new Event('lims_local_data_updated'));
                    await logAuditAction(db, user?.uid, 'ELIMINAR_ORDEN', `Orden eliminada desde detalles: ${request.id}`, request.id);
                } else {
                    await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, request.id));
                    await logAuditAction(db, user?.uid, 'ELIMINAR_ORDEN', `Orden eliminada desde detalles: ${request.id}`, request.id);
                }
                if (addNotification) addNotification("Orden eliminada exitosamente.", "success");
                navigateTo('dashboard');
            } catch (error) {
                console.error("Error al eliminar orden:", error);
                if (addNotification) addNotification("Ocurrió un error al eliminar la orden.", "error");
            }
        }
    };
    
    // IA States
    const isIndustrial = request?.clientType?.toLowerCase().includes('industria') || 
                         request?.sampleType?.toLowerCase().includes('alimento') || 
                         request?.sampleType?.toLowerCase().includes('superficie') || 
                         request?.sampleType?.toLowerCase().includes('agua') || 
                         request?.sampleType?.toLowerCase().includes('hielo') || 
                         request?.sampleType?.toLowerCase().includes('aire') || 
                         request?.analysisRequested?.toLowerCase().includes('camtu') || 
                         request?.analysisRequested?.toLowerCase().includes('nmp') || 
                         !!request?.foodUFCResult;

    const defaultClinicalEs = "Los resultados presentados están dentro de los límites de detección del método utilizado. Correlacionar con la clínica del paciente.";
    const defaultIndustrialEs = "Los resultados presentados están dentro de los límites de detección del método utilizado.";
    const defaultInterpretation = isIndustrial ? defaultIndustrialEs : defaultClinicalEs;

    const [interpretationText, setInterpretationText] = useState(request?.clinicalInterpretation || defaultInterpretation);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [selectedMicrobiologist, setSelectedMicrobiologist] = useState('director');

    // Manual Results Entry States
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualTestCode, setManualTestCode] = useState('');
    const [customTestCode, setCustomTestCode] = useState('');
    const [manualValue, setManualValue] = useState('');
    const [isSavingManual, setIsSavingManual] = useState(false);

    // Search and Autocomplete States
    const [searchParamQuery, setSearchParamQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Edit Analysis States
    const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
    const [editSearchQuery, setEditSearchQuery] = useState('');
    const [editSelectedCode, setEditSelectedCode] = useState('');
    const [editCustomName, setEditCustomName] = useState('');
    const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
    const [isUpdatingAnalysis, setIsUpdatingAnalysis] = useState(false);

    // Physical Custody States
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [recipientCustodian, setRecipientCustodian] = useState('Lic. María Delgado (Hematología)');
    const [recipientLocation, setRecipientLocation] = useState('Mesón de Trabajo B (Hematología)');
    const [transferReason, setTransferReason] = useState('Procesamiento / Análisis');
    const [senderPin, setSenderPin] = useState('');
    const [receiverPin, setReceiverPin] = useState('');
    const [isSavingTransfer, setIsSavingTransfer] = useState(false);

    // Filter available analyses strictly by request domain (Clinical vs Industrial/Food/Water)
    const combinedAnalyses = useMemo(() => {
        if (isIndustrial) {
            // Only industrial/food & water analyses
            return (availableAnalyses || []).filter(a => 
                (a.category && a.category.includes('Microbiología (Alimentos')) || 
                (a.category && a.category.includes('Físico-Químico')) || 
                !a.isClinical
            );
        } else {
            // Clinical catalog
            const clinicalFromCmq = cmqccrCatalog.map(item => ({
                id: `cmq-${item.code}`,
                code: item.code,
                name: item.name,
                category: item.category || 'Química Clínica',
                isClinical: true,
                minRange: item.minRange || '',
                maxRange: item.maxRange || '',
                unit: item.unit || ''
            }));
            const existing = (availableAnalyses || []).filter(a => a.isClinical || a.category !== 'Microbiología (Alimentos y Aguas)');
            const merged = [...existing];
            clinicalFromCmq.forEach(c => {
                if (!merged.some(m => m.code === c.code)) merged.push(c);
            });
            return merged;
        }
    }, [availableAnalyses, isIndustrial]);

    // Filter available analyses by query
    const filteredAnalyses = useMemo(() => {
        if (!combinedAnalyses) return [];
        const query = searchParamQuery.toLowerCase();
        return combinedAnalyses.filter(ana => 
            (ana.name || '').toLowerCase().includes(query) || 
            (ana.code || '').toLowerCase().includes(query)
        );
    }, [combinedAnalyses, searchParamQuery]);

    // Filter available analyses by edit search query
    const filteredEditAnalyses = useMemo(() => {
        if (!combinedAnalyses) return [];
        const query = editSearchQuery.toLowerCase();
        return combinedAnalyses.filter(ana => 
            (ana.name || '').toLowerCase().includes(query) || 
            (ana.code || '').toLowerCase().includes(query)
        );
    }, [combinedAnalyses, editSearchQuery]);

    // Find selected analysis for ranges preview
    const selectedAnalysis = useMemo(() => {
        if (!manualTestCode || manualTestCode === 'CUSTOM') return null;
        return combinedAnalyses?.find(a => a.code === manualTestCode);
    }, [manualTestCode, combinedAnalyses]);

    const handleSaveEditedAnalysis = async () => {
        if (!db || !request?.id) return;

        const finalAnalysisName = editSelectedCode === 'CUSTOM' ? editCustomName : editSearchQuery.split(' (')[0];
        if (!finalAnalysisName) {
            alert("Por favor seleccione o ingrese un análisis válido.");
            return;
        }

        setIsUpdatingAnalysis(true);
        try {
            const finalAnalysisCode = editSelectedCode === 'CUSTOM' || !editSelectedCode
                ? generateAnalysisCode(finalAnalysisName)
                : editSelectedCode;

            await updateRequestOfflineOrOnline({
                analysisRequested: finalAnalysisName,
                analysisCode: finalAnalysisCode
            }, 'MODIFICAR_ANALISIS', `Modificó el análisis solicitado a: ${finalAnalysisName} (${finalAnalysisCode})`);

            setIsEditingAnalysis(false);
            setEditSearchQuery('');
            setEditSelectedCode('');
            setEditCustomName('');
            alert("Análisis modificado exitosamente.");
        } catch (error) {
            console.error("Error updating analysis:", error);
            alert("Ocurrió un error al guardar la modificación.");
        } finally {
            setIsUpdatingAnalysis(false);
        }
    };

    const handleSaveManualResult = async (e) => {
        e.preventDefault();
        if (!request?.id) return;

        const finalCode = manualTestCode === 'CUSTOM' ? customTestCode : manualTestCode;
        if (!finalCode) {
            alert("Por favor seleccione o ingrese un código de prueba.");
            return;
        }

        setIsSavingManual(true);
        try {
            const currentResults = request.analyzerResults || [];
            
            const existsIdx = currentResults.findIndex(r => r.testCode === finalCode);
            let updatedResults = [...currentResults];
            
            const isPendingResult = !manualValue.trim();
            const newResItem = {
                testCode: finalCode,
                value: manualValue.trim(),
                origin: 'Manual (Operador)',
                status: 'pending_review'
            };

            if (existsIdx > -1) {
                updatedResults[existsIdx] = newResItem;
            } else {
                updatedResults.push(newResItem);
            }

            // Run automated clinical calculations
            updatedResults = runClinicalCalculations(updatedResults);


            let newStatus = request.status;
            if (request.status !== 'Completado') {
                newStatus = updatedResults.some(r => r.value && r.value.trim() !== '') ? 'Pendiente Revisión' : 'En Proceso';
            }

            const actionText = isPendingResult 
                ? `Registró parámetro de examen pendiente: ${finalCode} (pendiente)` 
                : `Registró resultado manual para ${finalCode}: ${manualValue.trim()}`;

            await updateRequestOfflineOrOnline({
                analyzerResults: updatedResults,
                status: newStatus
            }, 'REGISTRAR_RESULTADO', actionText);

            // Clean up
            setManualValue('');
            setManualTestCode('');
            setCustomTestCode('');
            setSearchParamQuery('');
            setShowManualForm(false);
        } catch (error) {
            console.error("Error saving manual result:", error);
            alert("Error al guardar el resultado.");
        } finally {
            setIsSavingManual(false);
        }
    };

    const handleDeleteResult = async (testCodeToDelete) => {
        if (!request?.id) return;
        if (!confirm(`¿Está seguro de eliminar el resultado para la prueba ${testCodeToDelete}?`)) return;

        try {
            const currentResults = request.analyzerResults || [];
            let updatedResults = currentResults.filter(r => r.testCode !== testCodeToDelete);

            // Run automated clinical calculations to recalculate or clear derived parameters
            updatedResults = runClinicalCalculations(updatedResults);


            let newStatus = request.status;
            if (request.status !== 'Completado') {
                newStatus = updatedResults.length === 0 ? 'Pendiente' : (updatedResults.some(r => r.value && r.value.trim() !== '') ? 'Pendiente Revisión' : 'En Proceso');
            }

            await updateRequestOfflineOrOnline({
                analyzerResults: updatedResults,
                status: newStatus
            }, 'ELIMINAR_RESULTADO', `Eliminó el resultado/parámetro para la prueba: ${testCodeToDelete}`);
        } catch (error) {
            console.error("Error deleting result:", error);
            alert("Error al eliminar el resultado.");
        }
    };

    const handleInitiateManualValueEntry = (res) => {
        const isCustom = !availableAnalyses?.some(a => a.code === res.testCode);
        if (isCustom) {
            setManualTestCode('CUSTOM');
            setCustomTestCode(res.testCode);
            setSearchParamQuery('Otro (Ingresar Código Manual)');
        } else {
            const a = availableAnalyses.find(x => x.code === res.testCode);
            setManualTestCode(res.testCode);
            setSearchParamQuery(a ? `${a.name} (${a.code})` : res.testCode);
        }
        setManualValue('');
        setShowManualForm(true);
        
        setTimeout(() => {
            const valInput = document.getElementById('manual-value-input');
            if (valInput) {
                valInput.focus();
            }
        }, 150);
    };

    useEffect(() => {
        if (!request?.id) return;

        if (user?.uid === 'offline-user') {
            const loadLocalAudit = () => {
                const localLogs = JSON.parse(localStorage.getItem('lims_local_audit_logs') || '[]');
                const filtered = localLogs.filter(log => log.relatedId === request.id);
                // Sort by timestamp ascending
                filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                setAuditLogs(filtered);
            };
            loadLocalAudit();
            window.addEventListener('lims_local_data_updated', loadLocalAudit);
            return () => window.removeEventListener('lims_local_data_updated', loadLocalAudit);
        }

        if (!db) return;
        const q = query(collection(db, `artifacts/${LIMSSystemId}/public/data/audit_logs`), where('relatedId', '==', request.id));
        const unsub = onSnapshot(q, (snap) => {
            const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            logs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
            setAuditLogs(logs);
        });
        return () => unsub();
    }, [db, request?.id, user]);

    if (!request) return null;

    const reqDate = request.requestDate?.seconds ? new Date(request.requestDate.seconds * 1000) : (request.requestDate instanceof Date ? request.requestDate : new Date());

    const handleSaveAST = async (astData) => {
        try {
            await updateRequestOfflineOrOnline({
                microbiologyAST: astData,
                status: 'Pendiente Revisión'
            }, 'REGISTRAR_RESULTADO', `Antibiograma registrado para patógeno: ${astData.pathogen}`);
            alert("Antibiograma guardado exitosamente.");
        } catch (error) {
            console.error("Error saving AST:", error);
            alert("Error al guardar el antibiograma.");
        }
    };

    const isMicrobiology = request.analysisRequested?.toLowerCase().includes('cultivo') || request.sampleType?.toLowerCase() === 'cultivo microbiológico';
    
    const isCAMTU = request.sampleType?.toLowerCase().includes('aire') || request.analysisRequested?.toLowerCase().includes('camtu');
    
    const isNMP = request.sampleType?.toLowerCase().includes('agua') || request.sampleType?.toLowerCase().includes('hielo') || request.analysisRequested?.toLowerCase().includes('nmp');
    
    // If it's CAMTU or NMP, we don't show the regular UFC calculator
    const isFoodOrIndustrial = !isCAMTU && !isNMP && (request.clientType?.toLowerCase().includes('industria') || request.sampleType?.toLowerCase().includes('alimento') || request.sampleType?.toLowerCase().includes('superficie'));

    const handleSaveUFC = async (ufcData) => {
        try {
            await updateRequestOfflineOrOnline({
                foodUFCResult: ufcData,
                status: 'Pendiente Revisión'
            }, 'REGISTRAR_RESULTADO', `Cálculo UFC registrado: ${ufcData.resultUFC} UFC/g/mL`);
            alert("Recuento UFC guardado exitosamente.");
        } catch (error) {
            console.error("Error saving UFC:", error);
            alert("Error al guardar el cálculo.");
        }
    };

    const handleSaveCAMTU = async (camtuData) => {
        try {
            await updateRequestOfflineOrOnline({
                camtuResult: camtuData,
                status: 'Pendiente Revisión'
            }, 'REGISTRAR_RESULTADO', `Análisis CAMTU registrado: ${camtuData.resultUFC} UFC/m3`);
            alert("Reporte CAMTU guardado exitosamente.");
        } catch (error) {
            console.error("Error saving CAMTU:", error);
            alert("Error al guardar el análisis CAMTU.");
        }
    };

    const handleSaveNMP = async (nmpData) => {
        try {
            await updateRequestOfflineOrOnline({
                nmpResult: nmpData,
                status: 'Pendiente Revisión'
            }, 'REGISTRAR_RESULTADO', `Análisis NMP registrado: ${nmpData.resultNMP} NMP/100mL`);
            alert("Análisis NMP guardado exitosamente.");
        } catch (error) {
            console.error("Error saving NMP:", error);
            alert("Error al guardar el análisis NMP.");
        }
    };

    const handleReleaseResults = async (microType = 'director') => {
        try {
            const updatedResults = request.analyzerResults?.map(r => ({...r, status: 'released'})) || [];
            const name = microType === 'director' 
                ? (labInfo?.directorName || 'Dr. Roldán Ajún Chaverri')
                : (labInfo?.professional2Name || 'Dr. José Guillermo Ajún Jiménez');
            const code = microType === 'director'
                ? (labInfo?.directorCode || '802')
                : (labInfo?.professional2Code || 'Reg. Trámite');

            const isAlreadyCompleted = request.status === 'Completado';
            let newVersion = request.reportVersion || 1;
            let amendments = request.amendmentHistory || [];
            let amendmentNote = request.amendmentNote || '';

            if (isAlreadyCompleted) {
                const reason = window.prompt("Esta orden ya fue liberada previamente.\n\nIndique el motivo de la ENMIENDA / CORRECCIÓN DEL INFORME (ISO 15189):", "Corrección de parámetro por verificación analítica");
                if (reason === null) return; // Cancelado por el usuario
                newVersion += 1;
                amendments.push({
                    version: newVersion,
                    timestamp: new Date().toISOString(),
                    reason: reason || 'Enmienda de resultados',
                    authorizedBy: name,
                    code: code
                });
                amendmentNote = reason || 'Informe enmendado';
            }

            const payload = {
                analyzerResults: updatedResults,
                status: 'Completado',
                signedByName: name,
                signedByCode: code,
                validatedAt: new Date().toISOString(),
                reportVersion: newVersion,
                isAmended: isAlreadyCompleted,
                amendmentHistory: amendments,
                amendmentNote: amendmentNote
            };

            await updateRequestOfflineOrOnline(
                payload, 
                isAlreadyCompleted ? 'ENMIENDA_INFORME' : 'LIBERAR_RESULTADOS', 
                `Resultados ${isAlreadyCompleted ? `enmendados a v${newVersion}` : 'liberados y firmados'} por: ${name} (${code})`
            );

            // Descuento automático de inventario
            const invResult = await deductInventoryForRequest(db, request, user);
            if (invResult.success && invResult.deductedItems?.length > 0) {
                console.log(`📦 Inventario actualizado: se descontaron ${invResult.deductedItems.length} reactivo(s).`);
            }
            
            alert(isAlreadyCompleted 
                ? `Informe enmendado exitosamente (Versión ${newVersion}). Quedó registrado el motivo de corrección.`
                : "Resultados firmados y liberados exitosamente.");
        } catch(e) {
            console.error(e);
            alert("Error al liberar resultados: " + e.message);
        }
    };

    const generateAIInterpretation = () => {
        if (!request.analyzerResults || request.analyzerResults.length === 0) {
            alert("No hay resultados registrados en esta solicitud para realizar una interpretación.");
            return;
        }

        const registeredResults = request.analyzerResults.filter(r => r.value && r.value.trim() !== '');
        if (registeredResults.length === 0) {
            alert("Todos los resultados están pendientes. Registre al menos un resultado antes de generar la interpretación.");
            return;
        }

        setIsGeneratingAI(true);
        // Simular llamada a API de IA con un delay
        setTimeout(() => {
            let alerts = [];
            request.analyzerResults?.forEach(res => {
                const a = availableAnalyses?.find(x => x.code === res.testCode);
                if (a && a.minRange && a.maxRange) {
                    const v = parseFloat(res.value);
                    if (v < parseFloat(a.minRange)) alerts.push(`${res.testCode} (Bajo)`);
                    if (v > parseFloat(a.maxRange)) alerts.push(`${res.testCode} (Alto)`);
                }
            });

            let text = "";
            if (isIndustrial) {
                if (alerts.length === 0) {
                    text = "Basado en el análisis de las muestras y considerando los límites microbiológicos establecidos, no se detecta presencia de microorganismos patógenos ni recuentos fuera del rango de aceptación. Los parámetros analizados cumplen con los criterios de inocuidad establecidos en la normativa vigente.";
                } else {
                    text = `ALERTA MICROBIOLÓGICA: Se han detectado recuentos fuera de límite en los siguientes parámetros: ${alerts.join(', ')}. \n\nSe recomienda revisar de inmediato los puntos críticos de control en planta, verificar las condiciones higiénico-sanitarias en el proceso, llevar a cabo una limpieza y desinfección exhaustiva y programar un muestreo de verificación.`;
                }
            } else {
                if (alerts.length === 0) {
                    text = "Basado en la evaluación de los resultados numéricos actuales y considerando los rangos de referencia metodológicos, no se observan alteraciones biológicas significativas. Los parámetros se encuentran dentro de la normalidad clínica esperada. Se sugiere continuar con los controles habituales.";
                } else {
                    text = `ATENCIÓN CLÍNICA: Se han detectado alteraciones en los siguientes parámetros: ${alerts.join(', ')}. \n\nEstos valores fuera de rango de referencia requieren correlación con el cuadro clínico del paciente por parte del médico tratante para descartar procesos patológicos y determinar el abordaje diagnóstico/terapéutico correspondiente.`;
                }
            }

            setInterpretationText(text);
            setIsGeneratingAI(false);
        }, 2000);
    };

    const saveInterpretation = async () => {
        try {
            await updateRequestOfflineOrOnline({ clinicalInterpretation: interpretationText });
            alert("Interpretación clínica guardada.");
        } catch(e) {
            console.error("Error saving interpretation", e);
        }
    };

    const handleTransferCustody = async (e) => {
        e.preventDefault();
        const isOffline = user?.uid === 'offline-user';
        if (!db && !isOffline) return;
        if (!senderPin || senderPin.length !== 4 || isNaN(senderPin)) {
            alert("El PIN del entregador debe ser de 4 dígitos numéricos.");
            return;
        }
        if (senderPin !== "1234") {
            alert("El PIN del entregador es incorrecto. Para la simulación demo, use '1234'.");
            return;
        }
        if (!receiverPin || receiverPin.length !== 4 || isNaN(receiverPin)) {
            alert("El PIN del receptor debe ser de 4 dígitos numéricos.");
            return;
        }
        if (receiverPin !== "5678") {
            alert("El PIN del receptor es incorrecto. Para la simulación demo, use '5678'.");
            return;
        }

        setIsSavingTransfer(true);
        try {
            const sender = request.currentCustodian || 'Recepción (Ingreso)';
            const detailText = `Muestra transferida físicamente de [${sender}] a [${recipientCustodian}] en [${recipientLocation}]. Motivo: ${transferReason}. Firmado digitalmente con PINs electrónicos de conformidad.`;
            
            await updateRequestOfflineOrOnline({
                currentCustodian: recipientCustodian,
                currentLocation: recipientLocation
            }, 'TRANSFERENCIA_CUSTODIA', detailText);

            alert("Transferencia de custodia registrada exitosamente.");
            setShowTransferForm(false);
            setSenderPin('');
            setReceiverPin('');
        } catch (error) {
            console.error("Error al registrar transferencia de custodia:", error);
            alert("Error al guardar la transferencia.");
        } finally {
            setIsSavingTransfer(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                    <ArrowLeft size={18} className="mr-2" /> Volver a Solicitudes
                </button>
                <div className="flex gap-2">
                    <button onClick={handleDeleteRequest} className="flex items-center text-red-500 bg-white border border-red-200 hover:bg-red-50 px-3.5 py-2 rounded-lg transition-colors font-medium shadow-sm cursor-pointer" title="Eliminar Orden">
                        <Trash2 size={16} className="mr-1.5" /> Eliminar
                    </button>
                    <button onClick={() => navigateTo('pre_report', request.id)} className="flex items-center text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-2 rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
                        <FileText size={16} className="mr-1.5 text-slate-500" /> Hoja de Trabajo
                    </button>
                    <button onClick={() => setIsShareModalOpen(true)} className="flex items-center text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-lg transition-colors font-bold shadow-sm cursor-pointer text-xs gap-1.5" title="Enviar por WhatsApp o Email">
                        <Share2 size={16} /> WhatsApp
                    </button>
                    <button onClick={() => navigateTo('final_report', request.id)} className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
                        <ShieldCheck size={18} className="mr-2" /> Reporte Final (QR)
                    </button>
                </div>
            </div>

            {/* Tarjeta de Información General */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Muestra #{request.id.substring(0, 8).toUpperCase()}</span>
                            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold">{request.sampleType || request.clientType || 'Clínica'}</span>
                            <StatusBadge status={request.status} />
                            {request.reportVersion && request.reportVersion > 1 && (
                                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1" title={request.amendmentNote || 'Informe corregido'}>
                                    📋 Enmienda v{request.reportVersion}
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{request.clientName}</h2>
                        <p className="text-slate-500 text-xs font-medium">Registrado: {reqDate.toLocaleString()}</p>
                    </div>

                    {/* Caja de Análisis Solicitado / Edición */}
                    <div className="w-full md:w-auto min-w-[320px] bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                        {!isEditingAnalysis ? (
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Análisis Solicitado</span>
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className="font-extrabold text-slate-800 text-sm">{request.analysisRequested}</span>
                                        {request.analysisCode && (
                                            <span className="bg-blue-50 text-blue-700 font-mono text-xs px-2.5 py-0.5 rounded-md font-bold border border-blue-100">{request.analysisCode}</span>
                                        )}
                                    </div>
                                </div>
                                {request.status !== 'Completado' && (
                                    <button 
                                        onClick={() => {
                                            setIsEditingAnalysis(true);
                                            setEditSearchQuery(request.analysisRequested || '');
                                            setEditSelectedCode(request.analysisCode || '');
                                            setEditCustomName('');
                                        }} 
                                        className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100 bg-white shadow-sm flex items-center justify-center shrink-0"
                                        title="Editar Análisis"
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modificar Análisis</div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="🔍 Buscar nuevo análisis..." 
                                        value={editSearchQuery}
                                        onChange={e => {
                                            setEditSearchQuery(e.target.value);
                                            setIsEditDropdownOpen(true);
                                            if (editSelectedCode !== 'CUSTOM') {
                                                setEditSelectedCode('');
                                            }
                                        }}
                                        onFocus={() => setIsEditDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsEditDropdownOpen(false), 250)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-700" 
                                    />
                                    
                                    {isEditDropdownOpen && (
                                        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {filteredEditAnalyses.map((ana) => (
                                                <div 
                                                    key={ana.id || ana.code}
                                                    onClick={() => {
                                                        setEditSelectedCode(ana.code);
                                                        setEditSearchQuery(ana.name);
                                                        setIsEditDropdownOpen(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-blue-50 text-slate-700 text-xs cursor-pointer flex justify-between items-center transition-colors"
                                                >
                                                    <span className="font-semibold text-slate-800">{ana.name}</span>
                                                    <span className="text-[10px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded font-bold">{ana.code}</span>
                                                </div>
                                            ))}
                                            <div 
                                                onClick={() => {
                                                    setEditSelectedCode('CUSTOM');
                                                    setEditSearchQuery('Otro Análisis (Especificar abajo)');
                                                    setIsEditDropdownOpen(false);
                                                }}
                                                className="px-3 py-2 hover:bg-slate-100 text-slate-600 text-xs cursor-pointer italic font-bold border-t border-slate-100 flex justify-between items-center transition-colors"
                                            >
                                                <span>➕ Otro Análisis / Prueba</span>
                                            </div>
                                            {filteredEditAnalyses.length === 0 && (
                                                <div className="px-3 py-2 text-slate-400 text-[10px] italic bg-slate-50 text-center">
                                                    No se encontraron coincidencias.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {editSelectedCode === 'CUSTOM' && (
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase">Nombre de Prueba Personalizada</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej. Urocultivo"
                                            required
                                            value={editCustomName}
                                            onChange={e => setEditCustomName(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-800"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsEditingAnalysis(false);
                                            setEditSearchQuery('');
                                            setEditSelectedCode('');
                                            setEditCustomName('');
                                        }}
                                        className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs font-bold hover:bg-slate-200 rounded transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleSaveEditedAnalysis}
                                        disabled={isUpdatingAnalysis}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isUpdatingAnalysis ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detalles Clínicos */}
                {request.clientType === 'Clínica' && request.patientName && (
                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paciente</span>
                            <span className="text-sm font-extrabold text-slate-800">{request.patientName}</span>
                            <p className="text-xs text-slate-500">{request.patientGender} {request.patientDOB ? `- Nac: ${request.patientDOB}` : ''}</p>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Solicitante</span>
                            <span className="text-sm font-bold text-slate-700">{request.requesterName || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Toma de Muestra</span>
                            <span className="text-sm font-bold text-slate-700">{request.collectionDate?.seconds ? new Date(request.collectionDate.seconds * 1000).toLocaleString() : 'N/A'}</span>
                            <p className="text-xs text-slate-500">{request.collectionLocation || 'Laboratorio'}</p>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contacto</span>
                            <span className="text-xs font-medium text-slate-700 block">{request.patientPhone || 'Sin teléfono'}</span>
                            <span className="text-xs font-medium text-slate-700 block truncate" title={request.patientAddress}>{request.patientAddress || 'Sin dirección'}</span>
                        </div>
                        {request.clinicalInfo && (
                            <div className="col-span-1 md:col-span-2 lg:grid-cols-4 lg:col-span-4 mt-2">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Información Clínica</span>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">{request.clinicalInfo}</p>
                            </div>
                        )}
                    </div>
                )}

                {request.isReferred && (request.referralAttachmentData || request.referralResults) && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Información de Envío Externo</span>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <span className="block text-sm font-bold text-indigo-900">Lab: {request.referralLab}</span>
                                {request.referralResults && (
                                    <span className="text-xs text-indigo-700 italic block mt-1">Notas: "{request.referralResults}"</span>
                                )}
                            </div>
                            {request.referralAttachmentData && (
                                <a 
                                    href={request.referralAttachmentData} 
                                    download={request.referralAttachmentName || 'Reporte_Externo'}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-bold text-sm transition-colors whitespace-nowrap"
                                >
                                    📄 Descargar Reporte Original
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* RUTA DE TRAZABILIDAD EN TIEMPO REAL */}
            <div className="mb-6">
                <SampleTraceabilityRoute request={request} onNavigateAction={navigateTo} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <button 
                        onClick={() => setActiveTab('custody')}
                        className={`flex-1 py-4 font-bold text-center border-b-2 transition-colors ${activeTab === 'custody' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        Cadena de Custodia
                    </button>
                    <button 
                        onClick={() => setActiveTab('results')}
                        className={`flex-1 py-4 font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'results' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        Resultados Clínicos 
                        {request.hasAutomatedResults && request.status === 'Pendiente Revisión' && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">Nuevo</span>}
                    </button>
                </div>

                <div className="p-8 sm:p-10">
                    {activeTab === 'custody' && (
                        <div>
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                                    Historial de Custodia - Muestra #{request.id.substring(0, 8).toUpperCase()}
                                </h2>
                                <p className="text-slate-500 mt-2">Seguimiento de trazabilidad y cadena de custodia.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="md:col-span-2">
                                    {/* Banner de Posesión Física */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 h-full flex flex-col justify-center gap-4 shadow-sm animate-fade-in">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                                    <Package size={22} />
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custodio Físico Actual</span>
                                                    <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                                                        <User size={16} className="text-indigo-500" />
                                                        {request.currentCustodian || 'Recepción (Ingreso)'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center text-sky-600 shrink-0">
                                                    <MapPin size={22} />
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ubicación Física</span>
                                                    <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                                                        {request.currentLocation || 'Mesa de Recepción de Muestras'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {request.status !== 'Completado' && (
                                            <button 
                                                onClick={() => setShowTransferForm(true)}
                                                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
                                            >
                                                🤝 Registrar Transferencia
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <BarcodePrinter 
                                        requestId={request.id} 
                                        patientName={request.patientName || request.clientName} 
                                        testName={request.analysisRequested} 
                                    />
                                </div>
                            </div>

                            {/* Formulario Modal de Transferencia de Custodia */}
                            {showTransferForm && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800">Transferencia Física de Muestra</h3>
                                                    <p className="text-slate-500 text-xs mt-0.5">Registrar cambio de custodio y firma digital.</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setShowTransferForm(false);
                                                    setSenderPin('');
                                                    setReceiverPin('');
                                                }}
                                                className="text-slate-400 hover:text-slate-600 font-bold p-2 text-lg hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <form onSubmit={handleTransferCustody} className="space-y-4">
                                            {/* Custodio actual (Entregador) */}
                                            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Custodio Entregador (Actual)</span>
                                                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                                                    <User size={14} className="text-slate-400" />
                                                    {request.currentCustodian || 'Recepción (Ingreso)'}
                                                </span>
                                            </div>

                                            {/* Selección de receptor */}
                                            <div className="space-y-1">
                                                <label className="block text-xs font-bold text-slate-600 uppercase">Custodio Receptor</label>
                                                <select 
                                                    value={recipientCustodian} 
                                                    onChange={e => setRecipientCustodian(e.target.value)} 
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                                                >
                                                    <option value="Lic. María Delgado (Hematología)">Lic. María Delgado (Hematología)</option>
                                                    <option value="Dr. Felipe Soto (Microbiología)">Dr. Felipe Soto (Microbiología)</option>
                                                    <option value="Lic. Carlos Gomez (Química)">Lic. Carlos Gomez (Química)</option>
                                                    <option value="Auxiliar Andrés Paz (Recepción)">Auxiliar Andrés Paz (Recepción)</option>
                                                    <option value="Courier Externo (Transporte)">Courier Externo (Transporte)</option>
                                                </select>
                                            </div>

                                            {/* Nueva ubicación */}
                                            <div className="space-y-1">
                                                <label className="block text-xs font-bold text-slate-600 uppercase">Nueva Ubicación Física</label>
                                                <select 
                                                    value={recipientLocation} 
                                                    onChange={e => setRecipientLocation(e.target.value)} 
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                                                >
                                                    <option value="Mesón de Trabajo B (Hematología)">Mesón de Trabajo B (Hematología)</option>
                                                    <option value="Mesón de Trabajo A (Química)">Mesón de Trabajo A (Química)</option>
                                                    <option value="Área de Incubación (Microbiología)">Área de Incubación (Microbiología)</option>
                                                    <option value="Freezer 1 (Congelación -80°C)">Freezer 1 (Congelación -80°C)</option>
                                                    <option value="Cámara de Frío 2 (Refrigeración 2-8°C)">Cámara de Frío 2 (Refrigeración 2-8°C)</option>
                                                    <option value="Mesa de Recepción de Muestras">Mesa de Recepción de Muestras</option>
                                                    <option value="Área de Desecho Biológico">Área de Desecho Biológico</option>
                                                </select>
                                            </div>

                                            {/* Motivo */}
                                            <div className="space-y-1">
                                                <label className="block text-xs font-bold text-slate-600 uppercase">Motivo de Transferencia</label>
                                                <select 
                                                    value={transferReason} 
                                                    onChange={e => setTransferReason(e.target.value)} 
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                                                >
                                                    <option value="Procesamiento / Análisis">Procesamiento / Análisis</option>
                                                    <option value="Almacenamiento en Frío">Almacenamiento en Frío</option>
                                                    <option value="Centrifugación / Alícuotas">Centrifugación / Alícuotas</option>
                                                    <option value="Control de Calidad (QC)">Control de Calidad (QC)</option>
                                                    <option value="Desecho Final / Eliminación">Desecho Final / Eliminación</option>
                                                </select>
                                            </div>

                                            {/* Sección de Doble PIN de Firma */}
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Lock size={14} className="text-indigo-500" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Firma Electrónica CoC (Dual Verification)</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 bg-indigo-50 border border-indigo-100 rounded p-2">
                                                    💡 <strong>Demo Info:</strong> Para simular la conformidad mutua, ingresa PINs de 4 dígitos. (Ej. Entregador: <span className="font-mono font-bold text-slate-700">1234</span>, Receptor: <span className="font-mono font-bold text-slate-700">5678</span>).
                                                </p>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-slate-600 uppercase">PIN Entregador</label>
                                                        <input 
                                                            type="password" 
                                                            maxLength={4}
                                                            required
                                                            placeholder="••••"
                                                            value={senderPin}
                                                            onChange={e => setSenderPin(e.target.value.replace(/\D/g, ''))}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-[10px] font-bold text-slate-600 uppercase">PIN Receptor</label>
                                                        <input 
                                                            type="password" 
                                                            maxLength={4}
                                                            required
                                                            placeholder="••••"
                                                            value={receiverPin}
                                                            onChange={e => setReceiverPin(e.target.value.replace(/\D/g, ''))}
                                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setShowTransferForm(false);
                                                        setSenderPin('');
                                                        setReceiverPin('');
                                                    }}
                                                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition-colors text-xs"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    disabled={isSavingTransfer}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50 text-xs"
                                                >
                                                    {isSavingTransfer ? 'Procesando...' : 'Confirmar Transferencia'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                <div className="relative pl-6 md:pl-0 space-y-10 md:space-y-0 before:absolute before:inset-0 before:ml-11 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-blue-400 before:to-slate-200">
                    
                    {auditLogs.length === 0 && (
                        <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500 text-sm">No hay registros de auditoría para esta muestra.</p>
                        </div>
                    )}

                    {auditLogs.map((log, index) => {
                        const isEven = index % 2 === 0;
                        const dateObj = log.timestamp?.seconds 
                            ? new Date(log.timestamp.seconds * 1000) 
                            : (typeof log.timestamp === 'string' ? new Date(log.timestamp) : new Date());
                        const isTransfer = log.action === 'TRANSFERENCIA_CUSTODIA';
                        return (
                            <div key={log.id} className={`relative flex items-center justify-between md:justify-center ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} group md:mb-12`}>
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white text-white shadow-md z-10 relative md:absolute md:left-1/2 md:-ml-6 shrink-0 ${isTransfer ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                    {isTransfer ? <Users size={20} /> : <Check size={20} strokeWidth={3} />}
                                </div>
                                <div className={`w-full pl-8 md:pl-0 md:w-1/2 ${isEven ? 'md:pr-14 md:text-right' : 'md:pl-14 md:text-left'}`}>
                                    <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isTransfer ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                        <h4 className={`font-bold text-lg mb-1 ${isTransfer ? 'text-emerald-700' : 'text-indigo-700'}`}>{log.action.replace(/_/g, ' ')}</h4>
                                        <div className={`flex flex-col gap-1 text-sm text-slate-600 mt-3 ${isEven ? 'items-end' : 'items-start'}`}>
                                            <span><strong className="text-slate-800">Detalles:</strong> {log.details}</span>
                                            <span><strong className="text-slate-800">Fecha y Hora:</strong> {dateObj.toLocaleString()}</span>
                                            <span><strong className="text-slate-800">Usuario (Firma Electrónica):</strong> {log.performedBy}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block w-1/2"></div>
                            </div>
                        );
                    })}
                </div>
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div className="animate-fade-in space-y-8">
                            <div>
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                                            <FlaskConical className="text-blue-600" /> Resultados Analíticos
                                        </h2>
                                        <p className="text-slate-500 text-sm mt-1">Revisión y validación de resultados para esta solicitud.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {request.status !== 'Completado' && (
                                            <button 
                                                onClick={() => setShowManualForm(!showManualForm)} 
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm"
                                            >
                                                📝 {showManualForm ? 'Cerrar Ingreso' : 'Ingreso Manual'}
                                            </button>
                                        )}
                                        {request.status === 'Pendiente Revisión' && (
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl shadow-xs">
                                                <div className="flex flex-col text-left">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1 mb-0.5">Microbiólogo Firmante</span>
                                                    <select
                                                        value={selectedMicrobiologist}
                                                        onChange={(e) => setSelectedMicrobiologist(e.target.value)}
                                                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 w-56 cursor-pointer"
                                                    >
                                                        <option value="director">{labInfo?.directorName || 'Dr. Roldán Ajún Chaverri'} (Reg. {labInfo?.directorCode || '802'})</option>
                                                        {labInfo?.professional2Name && (
                                                            <option value="professional2">{labInfo.professional2Name} ({labInfo.professional2Code || 'Reg. Trámite'})</option>
                                                        )}
                                                    </select>
                                                </div>
                                                <button 
                                                    onClick={() => handleReleaseResults(selectedMicrobiologist)} 
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-sm self-end h-[34px]"
                                                >
                                                    <CheckCircle2 size={18} /> Firmar y Liberar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {showManualForm && (
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 animate-fade-in space-y-4">
                                        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Registrar Resultado Manualmente</h3>
                                        <form onSubmit={handleSaveManualResult} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end relative">
                                            <div className="space-y-1 relative sm:col-span-2">
                                                <label className="block text-xs font-bold text-slate-600 uppercase">Prueba / Parámetro (Buscar)</label>
                                                <input 
                                                    type="text"
                                                    placeholder="🔍 Buscar por nombre o código..."
                                                    value={searchParamQuery}
                                                    onChange={e => {
                                                        setSearchParamQuery(e.target.value);
                                                        setIsDropdownOpen(true);
                                                        if (manualTestCode !== 'CUSTOM') {
                                                            setManualTestCode('');
                                                        }
                                                    }}
                                                    onFocus={() => setIsDropdownOpen(true)}
                                                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 250)}
                                                    required
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                                                />
                                                
                                                {isDropdownOpen && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {filteredAnalyses.map((ana) => (
                                                            <div 
                                                                key={ana.id || ana.code}
                                                                onClick={() => {
                                                                    setManualTestCode(ana.code);
                                                                    setSearchParamQuery(`${ana.name} (${ana.code})`);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className="px-4 py-2.5 hover:bg-indigo-50 text-slate-700 text-sm cursor-pointer flex justify-between items-center transition-colors"
                                                            >
                                                                <span className="font-semibold text-slate-800">{ana.name}</span>
                                                                <span className="text-xs text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded font-bold">{ana.code}</span>
                                                            </div>
                                                        ))}
                                                        <div 
                                                            onClick={() => {
                                                                    setManualTestCode('CUSTOM');
                                                                    setSearchParamQuery('Otro (Ingresar Código Manual)');
                                                                    setIsDropdownOpen(false);
                                                            }}
                                                            className="px-4 py-2.5 hover:bg-slate-100 text-slate-600 text-sm cursor-pointer italic font-bold border-t border-slate-100 flex justify-between items-center transition-colors"
                                                        >
                                                            <span>➕ Otro (Código Personalizado)</span>
                                                        </div>
                                                        {filteredAnalyses.length === 0 && (
                                                            <div className="px-4 py-3 text-slate-400 text-xs italic bg-slate-50 text-center">
                                                                No se encontraron coincidencias. Puedes ingresar uno manual.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {manualTestCode === 'CUSTOM' && (
                                                <div className="space-y-1">
                                                    <label className="block text-xs font-bold text-slate-600 uppercase">Código de Prueba</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Ej. GLU-001" 
                                                        required 
                                                        value={customTestCode}
                                                        onChange={e => setCustomTestCode(e.target.value.toUpperCase())}
                                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <label className="block text-xs font-bold text-slate-600 uppercase">Valor de Resultado (Opcional)</label>
                                                <input 
                                                    id="manual-value-input"
                                                    type="text" 
                                                    value={manualValue} 
                                                    onChange={e => setManualValue(e.target.value)}
                                                    placeholder="Ej. 95 o Negativo" 
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                />
                                                <span className="block text-[10px] text-slate-400 mt-0.5">Dejar vacío para registrar como examen pendiente</span>
                                            </div>

                                            <button 
                                                type="submit" 
                                                disabled={isSavingManual}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-sm transition-all disabled:opacity-50 h-[38px] w-full"
                                            >
                                                {isSavingManual ? 'Guardando...' : 'Guardar Resultado'}
                                            </button>

                                            {selectedAnalysis && (
                                                <div className="col-span-full bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-sm text-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 animate-fade-in mt-2">
                                                    <div>
                                                        <span className="font-bold text-slate-800">Parámetro: </span>
                                                        <span className="text-slate-600">{selectedAnalysis.name}</span>
                                                        <span className="mx-2 text-slate-300">|</span>
                                                        <span className="font-bold text-slate-800">Rango de Referencia: </span>
                                                        {selectedAnalysis.minRange && selectedAnalysis.maxRange ? (
                                                            <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded font-mono font-bold text-xs">
                                                                {selectedAnalysis.minRange} - {selectedAnalysis.maxRange}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-xs">Cualitativo / No definido</span>
                                                        )}
                                                    </div>
                                                    {manualValue && selectedAnalysis.minRange && selectedAnalysis.maxRange && (
                                                        <div className="text-xs font-bold">
                                                            {(() => {
                                                                const val = parseFloat(manualValue);
                                                                if (isNaN(val)) {
                                                                    return (
                                                                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                                                            ⚠️ El valor ingresado no es numérico
                                                                        </span>
                                                                    );
                                                                } else if (val < parseFloat(selectedAnalysis.minRange) || val > parseFloat(selectedAnalysis.maxRange)) {
                                                                    return (
                                                                        <span className="text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                                                            ⚠️ Fuera de rango de referencia
                                                                        </span>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                                                            ✓ Dentro del rango de referencia
                                                                        </span>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                )}

                                {!request.analyzerResults || request.analyzerResults.length === 0 ? (
                                    <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-600">Aún no hay resultados</h3>
                                        <p className="text-slate-500 text-sm mt-2">Los resultados aparecerán aquí automáticamente cuando los equipos finalicen el análisis, o puede ingresarlos manualmente.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                                <tr>
                                                    <th className="p-4 font-bold">Parámetro / Prueba</th>
                                                    <th className="p-4 font-bold">Resultado</th>
                                                    <th className="p-4 font-bold">Origen de Datos</th>
                                                    <th className="p-4 font-bold">Estado</th>
                                                    {request.status !== 'Completado' && <th className="p-4 font-bold text-right">Acciones</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {request.analyzerResults.map((res, i) => {
                                                    let isAlert = false;
                                                    const panic = evaluateCriticalPanicValue(res.testCode, res.value);
                                                    const delta = res.previousValue ? calculateDeltaCheck(res.value, res.previousValue) : { isDeltaAlert: false };
                                                    const a = availableAnalyses?.find(x => x.code === res.testCode);
                                                    if (a) {
                                                        if (a.minRange && a.maxRange) {
                                                            const v = parseFloat(res.value);
                                                            if (!isNaN(v) && (v < parseFloat(a.minRange) || v > parseFloat(a.maxRange))) {
                                                                isAlert = true;
                                                            }
                                                        }
                                                    }
                                                    return (
                                                    <tr key={i} className={`hover:bg-slate-50 ${panic.isPanic ? 'bg-red-100/50' : isAlert ? 'bg-red-50/30' : ''}`}>
                                                        <td className="p-4 font-bold text-slate-800">
                                                            <span>{a?.name || res.testCode}</span>
                                                            {panic.isPanic ? (
                                                                <span className="ml-2 bg-red-600 text-white text-[10px] px-2.5 py-0.5 rounded-full uppercase font-black animate-pulse inline-flex items-center gap-1 shadow-xs" title={panic.message}>
                                                                    🚨 Valor de Pánico ({panic.type === 'CRITICAL_LOW' ? 'Bajo' : 'Alto'})
                                                                </span>
                                                            ) : isAlert ? (
                                                                <span className="ml-2 bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                                                                    Fuera de Rango
                                                                </span>
                                                            ) : null}
                                                            {delta.isDeltaAlert && (
                                                                <span className="ml-2 bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded uppercase font-bold" title={delta.message}>
                                                                    ⚠️ Delta ({delta.deltaPercent}%)
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            {!res.value ? (
                                                                <span className="text-slate-400 italic font-medium">Pendiente</span>
                                                            ) : (
                                                                <span className={`font-mono text-lg font-black ${panic.isPanic ? 'text-red-700' : isAlert ? 'text-red-600' : 'text-blue-700'}`}>
                                                                    {res.value}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            {res.origin.includes('Automatizado') ? (
                                                                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-100">
                                                                    🤖 {res.origin}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-500 text-xs font-medium bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                                                                    📝 {res.origin}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            {!res.value ? (
                                                                <span className="text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">Pendiente Registro</span>
                                                            ) : res.status === 'pending_review' ? (
                                                                <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold border border-amber-200">Pendiente Revisión</span>
                                                            ) : (
                                                                <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold border border-emerald-200 flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Liberado</span>
                                                            )}
                                                        </td>
                                                        {request.status !== 'Completado' && (
                                                            <td className="p-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {!res.value && (
                                                                        <button 
                                                                            onClick={() => handleInitiateManualValueEntry(res)}
                                                                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1"
                                                                            title="Ingresar resultado"
                                                                        >
                                                                            📝 Ingresar Valor
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => handleDeleteResult(res.testCode)}
                                                                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                                                                        title="Eliminar resultado"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Módulo CAMTU para Aire Comprimido */}
                            {isCAMTU && (
                                <div className="mt-8 mb-8 animate-fade-in">
                                    <CAMTUCalculator 
                                        savedResults={request.camtuResult}
                                        onSave={handleSaveCAMTU}
                                        onCalculate={(data) => {
                                            if (showManualForm && !manualValue) {
                                                setManualValue(data.resultUFC.toString());
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-slate-500 mt-2 italic">* El resultado calculado se copiará automáticamente al campo de ingreso manual si está abierto.</p>
                                </div>
                            )}

                            {/* Módulo para Muestreo de Aire (Impactador) */}
                            {request.sampleType?.toLowerCase().includes('aire') && !request.sampleType?.toLowerCase().includes('comprimido') && (
                                <div className="mt-8 mb-8 animate-fade-in">
                                    <AirSamplerCalculator 
                                        onCalculate={(data) => {
                                            // Optional: automatically populate manual value if a test is selected
                                            if (showManualForm && !manualValue) {
                                                setManualValue(data.value.toString());
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-slate-500 mt-2 italic">* El resultado calculado se copiará automáticamente al campo de ingreso manual si está abierto.</p>
                                </div>
                            )}

                            {/* Módulo NMP para Agua y Hielo */}
                            {isNMP && (
                                <div className="mt-8 mb-8 animate-fade-in">
                                    <NMPCalculator 
                                        savedResults={request.nmpResult}
                                        onSave={handleSaveNMP}
                                        onCalculate={(data) => {
                                            if (showManualForm && !manualValue) {
                                                setManualValue(data.resultNMP.toString());
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-slate-500 mt-2 italic">* El resultado calculado se copiará automáticamente al campo de ingreso manual si está abierto.</p>
                                </div>
                            )}

                            {/* Módulo UFC para Industria de Alimentos */}
                            {isFoodOrIndustrial && (
                                <div className="mt-8 mb-8 animate-fade-in">
                                    <UFCCalculator 
                                        savedResults={request.foodUFCResult}
                                        onSave={handleSaveUFC}
                                        onCalculate={(data) => {
                                            if (showManualForm && !manualValue) {
                                                setManualValue(data.resultUFC.toString());
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-slate-500 mt-2 italic">* El resultado calculado se copiará automáticamente al campo de ingreso manual si está abierto.</p>
                                </div>
                            )}

                            {/* Módulo AST para Cultivos Microbiológicos */}
                            {isMicrobiology && (
                                <div className="mt-8 mb-8 animate-fade-in">
                                    <ASTMatrix 
                                        savedResults={request.microbiologyAST} 
                                        onSave={handleSaveAST} 
                                    />
                                </div>
                            )}

                            {/* Módulo de Interpretación Clínica Asistida por IA */}
                            {request.analyzerResults?.length > 0 && (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 shadow-inner">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                                <span>✨</span> Interpretación Clínica Asistida (IA)
                                            </h3>
                                            <p className="text-indigo-700/70 text-sm mt-1">Generación automática de sugerencias médicas basadas en resultados fuera de rango.</p>
                                        </div>
                                        <button 
                                            onClick={generateAIInterpretation} 
                                            disabled={isGeneratingAI}
                                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
                                        >
                                            {isGeneratingAI ? 'Analizando...' : 'Generar Análisis IA'}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            value={interpretationText}
                                            onChange={(e) => setInterpretationText(e.target.value)}
                                            placeholder="La interpretación clínica aparecerá aquí. Puedes editarla antes de guardarla..."
                                            className="w-full h-32 p-4 rounded-xl border border-indigo-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none text-slate-700 leading-relaxed placeholder:text-slate-400"
                                        ></textarea>
                                        
                                        {interpretationText !== (request.clinicalInterpretation || defaultInterpretation) && (
                                            <div className="absolute bottom-4 right-4 animate-fade-in">
                                                <button 
                                                    onClick={saveInterpretation}
                                                    className="bg-indigo-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-black transition-colors shadow-md"
                                                >
                                                    Guardar Cambios
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-indigo-400 mt-3 font-medium uppercase tracking-wider text-center">
                                        Este texto aparecerá en el reporte final. El Director Médico debe avalar la información.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para enviar resultados por WhatsApp / Email */}
            <ShareReportModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                request={request} 
                labInfo={labInfo} 
                reportLang="es" 
            />
        </div>
    );
};
