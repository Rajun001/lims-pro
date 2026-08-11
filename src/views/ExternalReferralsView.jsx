import React, { useState, useMemo } from 'react';
import { 
    Send, Search, CheckCircle2, Clock, Truck, FileText, ArrowLeft, 
    Paperclip, Download, Sparkles, Plus, Edit, Trash2, Users, Coins, 
    ChevronRight, FileCode, Check, Inbox, Phone, Mail, Building2, 
    Thermometer, ShieldCheck, UserCheck, AlertTriangle 
} from 'lucide-react';
import { collection, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import cmqccrCatalog from '../data/cmqccr_catalog.json';
import { extractExternalLabReport } from '../services/aiService';

export const ExternalReferralsView = ({ requests = [], db, user, navigateTo, referenceLabs = [], referenceLabTests = [] }) => {
    const [activeTab, setActiveTab] = useState('outbound'); // 'outbound' | 'inbound' | 'labs' | 'catalog'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedLabId, setSelectedLabId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Outbound dispatch options
    const [dispatchCourier, setDispatchCourier] = useState('Mensajería Propia / Interna');
    const [dispatchTrackingNo, setDispatchTrackingNo] = useState('');
    const [dispatchColdChain, setDispatchColdChain] = useState('Refrigerada (2°C - 8°C)');
    const [dispatchNotes, setDispatchNotes] = useState('');

    // Referral manual pricing overrides
    const [manualCost, setManualCost] = useState('');
    const [manualPatientPrice, setManualPatientPrice] = useState('');

    // Modal para registrar resultados
    const [showResultModal, setShowResultModal] = useState(false);
    const [activeReferral, setActiveReferral] = useState(null);
    const [resultNotes, setResultNotes] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState('');
    const [extractedPatient, setExtractedPatient] = useState(null); // used in reset on modal open

    // geminiApiKey is read from env/storage and forwarded to aiService internally
    const [_geminiApiKey, _setGeminiApiKey] = useState(localStorage.getItem('LIMS_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '');
    const [isExtracting, setIsExtracting] = useState(false);

    // Labs directory state
    const [showLabForm, setShowLabForm] = useState(false);
    const [editingLab, setEditingLab] = useState(null);
    const [labName, setLabName] = useState('');
    const [labType, setLabType] = useState('Destino (Subcontratado)'); // 'Destino (Subcontratado)' | 'Remitente (Cliente)' | 'Bilateral'
    const [labDirector, setLabDirector] = useState('');
    const [labDirectorCode, setLabDirectorCode] = useState('');
    const [labEmail, setLabEmail] = useState('');
    const [labReportsEmail, setLabReportsEmail] = useState('');
    const [labBillingEmail, setLabBillingEmail] = useState('');
    const [labPhone, setLabPhone] = useState('');
    const [labAddress, setLabAddress] = useState('');
    const [labDiscount, setLabDiscount] = useState('0');
    const [labStatus, setLabStatus] = useState('Activo');

    // Catalog tab state — reserved for future catalog management UI
    const [catalogSelectedLabId, setCatalogSelectedLabId] = useState('');
    const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
    const [catalogSelectedTest, setCatalogSelectedTest] = useState(null);
    const [catalogCostPrice, setCatalogCostPrice] = useState('');
    const [catalogPatientPrice, setCatalogPatientPrice] = useState('');
    const [isCatalogDropdownOpen, setIsCatalogDropdownOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);

    // Bulk import state — reserved for future bulk import UI
    const [importFile, setImportFile] = useState(null);
    const [importText, setImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState('');
    const [previewTests, setPreviewTests] = useState([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    /* eslint-disable no-unused-vars */
    // These state vars are ready for the Catalog & BulkImport tabs (UI in progress)
    void [catalogSelectedLabId, setCatalogSelectedLabId, catalogSearchQuery, setCatalogSearchQuery,
          catalogSelectedTest, setCatalogSelectedTest, catalogCostPrice, setCatalogCostPrice,
          catalogPatientPrice, setCatalogPatientPrice, isCatalogDropdownOpen, setIsCatalogDropdownOpen,
          editingTest, setEditingTest, importFile, setImportFile, importText, setImportText,
          isImporting, setIsImporting, importProgress, setImportProgress, previewTests, setPreviewTests,
          showPreviewModal, setShowPreviewModal];
    /* eslint-enable no-unused-vars */

    // Filter Outbound (Muestras enviadas a laboratorios externos)
    const outboundReferrals = useMemo(() => {
        return (requests || []).filter(r => r.isReferred).sort((a, b) => {
            const dateA = a.referralDate?.seconds || (typeof a.referralDate === 'string' ? new Date(a.referralDate).getTime() / 1000 : 0);
            const dateB = b.referralDate?.seconds || (typeof b.referralDate === 'string' ? new Date(b.referralDate).getTime() / 1000 : 0);
            return dateB - dateA;
        });
    }, [requests]);

    // Filter Inbound (Muestras recibidas de otros laboratorios donde Microlabs es el Laboratorio de Referencia)
    const inboundReferrals = useMemo(() => {
        return (requests || []).filter(r => r.isReferredInbound || r.referringLabName || r.clientType === 'Laboratorio de Referencia' || r.sampleOther?.includes('Ref:')).sort((a, b) => {
            const dateA = a.requestDate?.seconds || (typeof a.requestDate === 'string' ? new Date(a.requestDate).getTime() / 1000 : 0);
            const dateB = b.requestDate?.seconds || (typeof b.requestDate === 'string' ? new Date(b.requestDate).getTime() / 1000 : 0);
            return dateB - dateA;
        });
    }, [requests]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        if (!e.target.value) setSelectedRequest(null);
    };

    const searchResults = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        const query = searchQuery.toLowerCase();
        return (requests || []).filter(r => 
            !r.isReferred &&
            (
                r.id.toLowerCase().includes(query) ||
                (r.clientName && r.clientName.toLowerCase().includes(query)) ||
                (r.patientName && r.patientName.toLowerCase().includes(query)) ||
                (r.analysisRequested && r.analysisRequested.toLowerCase().includes(query))
            )
        ).slice(0, 6);
    }, [searchQuery, requests]);

    // Pricing estimation based on selected lab and request
    const pricingEstimate = useMemo(() => {
        if (!selectedRequest || !selectedLabId) return { cost: 0, patientPrice: 0, isFound: false };
        
        const matchingTest = referenceLabTests.find(t => 
            t.labId === selectedLabId && 
            (t.testCode === selectedRequest.analysisCode || 
             t.testName?.toLowerCase() === selectedRequest.analysisRequested?.toLowerCase())
        );

        if (matchingTest) {
            return {
                cost: parseFloat(matchingTest.costPrice) || 0,
                patientPrice: parseFloat(matchingTest.patientPrice) || 0,
                isFound: true
            };
        }

        const officialTest = cmqccrCatalog.find(t => t.code === selectedRequest.analysisCode || t.name.toLowerCase() === selectedRequest.analysisRequested?.toLowerCase());
        const defaultPatientPrice = officialTest ? parseFloat(officialTest.price) : 0;

        return {
            cost: 0,
            patientPrice: defaultPatientPrice,
            isFound: false
        };
    }, [selectedRequest, selectedLabId, referenceLabTests]);

    // Profit margin calculation
    const profitMargin = useMemo(() => {
        const cost = manualCost !== '' ? parseFloat(manualCost) : pricingEstimate.cost;
        const patientPrice = manualPatientPrice !== '' ? parseFloat(manualPatientPrice) : pricingEstimate.patientPrice;
        if (!patientPrice) return null;
        const margin = patientPrice - cost;
        const pct = (margin / patientPrice) * 100;
        return { margin, pct };
    }, [manualCost, manualPatientPrice, pricingEstimate]);

    // Create Outbound Referral
    const handleCreateReferral = async () => {
        if (!selectedRequest || !selectedLabId) {
            alert("Seleccione una muestra y especifique el laboratorio destino.");
            return;
        }

        const selectedLab = referenceLabs.find(l => l.id === selectedLabId);
        if (!selectedLab) {
            alert("El laboratorio seleccionado no es válido.");
            return;
        }

        setIsSubmitting(true);
        try {
            const costValue = manualCost !== '' ? parseFloat(manualCost) : pricingEstimate.cost;
            const patientPriceValue = manualPatientPrice !== '' ? parseFloat(manualPatientPrice) : pricingEstimate.patientPrice;

            const payload = {
                isReferred: true,
                referralLabId: selectedLabId,
                referralLab: selectedLab.name,
                referralCost: costValue,
                referralPatientPrice: patientPriceValue,
                referralDate: serverTimestamp(),
                referralStatus: 'Enviado',
                referralCourier: dispatchCourier,
                referralTrackingNo: dispatchTrackingNo,
                referralColdChain: dispatchColdChain,
                referralNotes: dispatchNotes,
                status: 'Derivado'
            };

            if (user?.uid === 'offline-user') {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const updated = localReqs.map(r => r.id === selectedRequest.id ? { ...r, ...payload, referralDate: new Date().toISOString() } : r);
                localStorage.setItem('lims_local_requests', JSON.stringify(updated));
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else {
                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, selectedRequest.id);
                await updateDoc(reqRef, payload);
            }

            await logAuditAction(
                db, 
                user?.uid || 'anon', 
                'DERIVAR_MUESTRA', 
                `Muestra derivada a ${selectedLab.name}. Courier: ${dispatchCourier}. Costo LIMS: ¢${costValue.toLocaleString()}, Paciente: ¢${patientPriceValue.toLocaleString()}`, 
                selectedRequest.id
            );

            setSelectedRequest(null);
            setSelectedLabId('');
            setSearchQuery('');
            setManualCost('');
            setManualPatientPrice('');
            setDispatchTrackingNo('');
            setDispatchNotes('');
            alert("✅ Muestra derivada y despachada con éxito.");
        } catch (error) {
            console.error("Error creating referral:", error);
            alert("Error al derivar la muestra.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open result upload modal
    const handleOpenResultModal = (req) => {
        setActiveReferral(req);
        setResultNotes(req.referralResults || '');
        setAttachmentFile(null);
        setUploadProgress('');
        setExtractedPatient(null);
        setShowResultModal(true);
    };

    // AI Extraction from Result PDF
    const handleExtractWithAI = async () => {
        let fileToProcess = attachmentFile;
        let fileDataUrl = null;

        if (fileToProcess) {
            fileDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(fileToProcess);
            });
        } else if (activeReferral && activeReferral.referralAttachmentData) {
            fileDataUrl = activeReferral.referralAttachmentData;
        } else {
            alert("Seleccione un archivo o asegúrese de tener un documento guardado para extraer.");
            return;
        }

        setIsExtracting(true);
        setUploadProgress('Extrayendo resultados con Inteligencia Artificial (Gemini Multi-Modelo)...');

        try {
            const extractedText = await extractExternalLabReport(fileDataUrl, activeReferral || {});
            setResultNotes((prev) => prev ? `${prev}\n\n### 🤖 Resultados Extraídos por IA:\n${extractedText}` : `### 🤖 Resultados Extraídos por IA:\n${extractedText}`);
            setUploadProgress('¡Extracción completada con éxito!');
        } catch (error) {
            console.error("Error AI extraction:", error);
            setUploadProgress('Error al procesar el archivo con IA.');
        } finally {
            setIsExtracting(false);
        }
    };

    // Save Results for Outbound Referral
    const handleSaveResult = async () => {
        if (!activeReferral) return;
        setIsSubmitting(true);
        try {
            let fileDataUrl = activeReferral.referralAttachmentData || null;
            let fileName = activeReferral.referralAttachmentName || null;

            if (attachmentFile) {
                fileDataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(attachmentFile);
                });
                fileName = attachmentFile.name;
            }

            const payload = {
                referralStatus: 'Completado',
                referralResults: resultNotes,
                referralAttachmentData: fileDataUrl,
                referralAttachmentName: fileName,
                status: 'Pendiente Revisión',
                resultsReceivedDate: serverTimestamp()
            };

            if (user?.uid === 'offline-user') {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const updated = localReqs.map(r => r.id === activeReferral.id ? { ...r, ...payload, resultsReceivedDate: new Date().toISOString() } : r);
                localStorage.setItem('lims_local_requests', JSON.stringify(updated));
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else {
                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, activeReferral.id);
                await updateDoc(reqRef, payload);
            }

            await logAuditAction(
                db, 
                user?.uid || 'anon', 
                'GUARDAR_RESULTADO_EXTERNO', 
                `Resultados externos recibidos y vinculados de ${activeReferral.referralLab}${fileName ? ' (con adjunto)' : ''}`, 
                activeReferral.id
            );

            setShowResultModal(false);
            setActiveReferral(null);
            alert("✅ Resultados externos guardados exitosamente.");
        } catch (error) {
            console.error("Error saving referral result:", error);
            alert("Error al guardar resultados externos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Save Lab in Directory
    const handleSaveLab = async (e) => {
        e.preventDefault();
        if (!labName.trim()) return;

        try {
            const labData = {
                name: labName,
                type: labType,
                directorName: labDirector,
                directorCode: labDirectorCode,
                email: labEmail,
                emailReports: labReportsEmail,
                emailBilling: labBillingEmail,
                phone: labPhone,
                address: labAddress,
                discountPercentage: parseFloat(labDiscount) || 0,
                status: labStatus,
                updatedAt: serverTimestamp()
            };

            if (editingLab) {
                if (user?.uid === 'offline-user') {
                    const localLabs = JSON.parse(localStorage.getItem('lims_local_reference_labs') || '[]');
                    const updated = localLabs.map(l => l.id === editingLab.id ? { ...l, ...labData } : l);
                    localStorage.setItem('lims_local_reference_labs', JSON.stringify(updated));
                    window.dispatchEvent(new Event('lims_local_data_updated'));
                } else {
                    await updateDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/reference_labs`, editingLab.id), labData);
                }
            } else {
                if (user?.uid === 'offline-user') {
                    const localLabs = JSON.parse(localStorage.getItem('lims_local_reference_labs') || '[]');
                    localLabs.push({ id: `ref-lab-${Date.now()}`, ...labData });
                    localStorage.setItem('lims_local_reference_labs', JSON.stringify(localLabs));
                    window.dispatchEvent(new Event('lims_local_data_updated'));
                } else {
                    await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/reference_labs`), {
                        ...labData,
                        createdAt: serverTimestamp()
                    });
                }
            }

            setShowLabForm(false);
            setEditingLab(null);
            setLabName('');
            setLabDirector('');
            setLabDirectorCode('');
            setLabEmail('');
            setLabReportsEmail('');
            setLabBillingEmail('');
            setLabPhone('');
            setLabAddress('');
            setLabDiscount('0');
            alert("✅ Laboratorio guardado en el directorio.");
        } catch (error) {
            console.error("Error saving lab:", error);
            alert("Error al guardar laboratorio.");
        }
    };

    const handleEditLab = (lab) => {
        setEditingLab(lab);
        setLabName(lab.name || '');
        setLabType(lab.type || 'Destino (Subcontratado)');
        setLabDirector(lab.directorName || '');
        setLabDirectorCode(lab.directorCode || '');
        setLabEmail(lab.email || '');
        setLabReportsEmail(lab.emailReports || '');
        setLabBillingEmail(lab.emailBilling || '');
        setLabPhone(lab.phone || '');
        setLabAddress(lab.address || '');
        setLabDiscount((lab.discountPercentage || 0).toString());
        setLabStatus(lab.status || 'Activo');
        setShowLabForm(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laboratorios de Referencia & Terceros</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Gestión bidireccional: Envíos a laboratorios externos y recepción de muestras referidas de otros laboratorios.
                        </p>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('outbound')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs transition-all whitespace-nowrap ${
                            activeTab === 'outbound' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-600 hover:text-indigo-600'
                        }`}
                    >
                        <Send size={14} /> 📤 Muestras Enviadas ({outboundReferrals.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('inbound')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs transition-all whitespace-nowrap ${
                            activeTab === 'inbound' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-600 hover:text-indigo-600'
                        }`}
                    >
                        <Inbox size={14} /> 📥 Muestras Recibidas ({inboundReferrals.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('labs')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs transition-all whitespace-nowrap ${
                            activeTab === 'labs' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-600 hover:text-indigo-600'
                        }`}
                    >
                        <Building2 size={14} /> 🏢 Directorio Labs ({referenceLabs.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('catalog')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs transition-all whitespace-nowrap ${
                            activeTab === 'catalog' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-600 hover:text-indigo-600'
                        }`}
                    >
                        <Coins size={14} /> 📋 Tarifario B2B
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: OUTBOUND REFERRALS (MUESTRAS ENVIADAS A TERCEROS) */}
            {/* ========================================================================= */}
            {activeTab === 'outbound' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Panel de Nueva Derivación */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-base font-extrabold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <Send size={18} className="text-indigo-600" /> Despachar Muestra a Laboratorio Externo (Subcontratación)
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                            <div className="relative col-span-1">
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Buscar Muestra Local</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="text"
                                        placeholder="Buscar por ID, paciente o análisis..."
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-xs"
                                    />
                                </div>

                                {searchQuery.length >= 2 && !selectedRequest && (
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
                                                    <span className="font-bold text-slate-800 text-xs truncate pr-2">{req.patientName || req.clientName}</span>
                                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{req.id.substring(0, 8).toUpperCase()}</span>
                                                </div>
                                                <div className="text-[11px] text-indigo-600 font-medium truncate">{req.analysisRequested}</div>
                                            </div>
                                        ))}
                                        {searchResults.length === 0 && (
                                            <div className="p-4 text-center text-slate-500 text-xs">No se encontraron muestras pendientes de enviar.</div>
                                        )}
                                    </div>
                                )}

                                {selectedRequest && (
                                    <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                                        <div>
                                            <span className="block text-[9px] font-bold text-indigo-400 uppercase">Muestra Seleccionada</span>
                                            <span className="font-bold text-indigo-900 text-xs truncate block">{selectedRequest.patientName || selectedRequest.clientName}</span>
                                            <span className="text-[11px] text-indigo-600">{selectedRequest.analysisRequested}</span>
                                        </div>
                                        <button onClick={() => setSelectedRequest(null)} className="text-indigo-400 hover:text-indigo-700 p-1 font-bold">✕</button>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Laboratorio Destino <span className="text-red-500">*</span></label>
                                <select 
                                    value={selectedLabId}
                                    onChange={(e) => {
                                        setSelectedLabId(e.target.value);
                                        setManualCost('');
                                        setManualPatientPrice('');
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 text-xs"
                                >
                                    <option value="">-- Seleccionar Laboratorio --</option>
                                    {referenceLabs.filter(l => l.status === 'Activo').map(l => (
                                        <option key={l.id} value={l.id}>{l.name} {l.type ? `(${l.type})` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Transporte / Courier</label>
                                <select 
                                    value={dispatchCourier} 
                                    onChange={e => setDispatchCourier(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                                >
                                    <option>Mensajería Propia / Interna</option>
                                    <option>Mensajero Externo / Moto</option>
                                    <option>DHL Express / Fedex (Internacional)</option>
                                    <option>Correos de Costa Rica EMS</option>
                                    <option>Entregado por el Cliente</option>
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cadena de Frío al Despachar</label>
                                <select 
                                    value={dispatchColdChain} 
                                    onChange={e => setDispatchColdChain(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                                >
                                    <option>Refrigerada (2°C - 8°C)</option>
                                    <option>Congelada (-20°C)</option>
                                    <option>Con Hielo Seco (-78°C)</option>
                                    <option>Temperatura Ambiente Controlada</option>
                                </select>
                            </div>

                            {/* Cost and Patient pricing details */}
                            {selectedRequest && selectedLabId && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Costo Interno que cobra el Lab (¢)</label>
                                        <input
                                            type="number"
                                            placeholder={pricingEstimate.isFound ? pricingEstimate.cost.toString() : "Fijar costo..."}
                                            value={manualCost}
                                            onChange={e => setManualCost(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Precio Cobrado al Paciente / Cliente (¢)</label>
                                        <input
                                            type="number"
                                            placeholder={pricingEstimate.patientPrice.toString()}
                                            value={manualPatientPrice}
                                            onChange={e => setManualPatientPrice(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold font-mono"
                                        />
                                    </div>
                                    <div className="pt-3 sm:pt-0">
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Margen Comercial</span>
                                        {profitMargin ? (
                                            <span className={`font-mono text-sm font-extrabold ${profitMargin.margin >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                ¢{profitMargin.margin.toLocaleString()} ({profitMargin.pct.toFixed(1)}%)
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">Calculando...</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end">
                                <button 
                                    type="button"
                                    onClick={handleCreateReferral}
                                    disabled={!selectedRequest || !selectedLabId || isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 text-xs cursor-pointer"
                                >
                                    <Send size={15} />
                                    {isSubmitting ? 'Despachando...' : 'Confirmar Envío y Despacho'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Listado de Muestras Enviadas */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                <Clock size={16} className="text-slate-500" /> Historial de Muestras Despachadas a Labs Externos
                            </h3>
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                                {outboundReferrals.length} Muestras
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="p-3.5 font-bold">ID Muestra</th>
                                        <th className="p-3.5 font-bold">Paciente / Cliente</th>
                                        <th className="p-3.5 font-bold">Análisis Solicitado</th>
                                        <th className="p-3.5 font-bold">Lab. Destino</th>
                                        <th className="p-3.5 font-bold">Transporte / Frío</th>
                                        <th className="p-3.5 font-bold text-right">Costo Lab</th>
                                        <th className="p-3.5 font-bold text-right">Precio Paciente</th>
                                        <th className="p-3.5 font-bold">Estado Envío</th>
                                        <th className="p-3.5 font-bold text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {outboundReferrals.map(req => {
                                        const isCompleted = req.referralStatus === 'Completado';
                                        const refDateStr = req.referralDate?.seconds ? new Date(req.referralDate.seconds * 1000).toLocaleDateString() : (typeof req.referralDate === 'string' ? new Date(req.referralDate).toLocaleDateString() : 'N/A');
                                        // refDateStr is used in the row cells below
                                        void refDateStr; // placeholder until date column is rendered
                                        return (
                                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3.5 font-mono font-bold text-slate-700">{req.id.substring(0, 8).toUpperCase()}</td>
                                                <td className="p-3.5">
                                                    <span className="font-bold text-slate-900 block">{req.patientName || req.clientName}</span>
                                                    <span className="text-[10px] text-slate-400">{req.clientType}</span>
                                                </td>
                                                <td className="p-3.5 font-semibold text-slate-700">{req.analysisRequested}</td>
                                                <td className="p-3.5">
                                                    <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 block w-max">
                                                        {req.referralLab}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-[11px] text-slate-500">
                                                    <span>{req.referralCourier || 'Interno'}</span>
                                                    <span className="block text-[10px] text-slate-400">{req.referralColdChain || 'Refrigerada'}</span>
                                                </td>
                                                <td className="p-3.5 text-right font-mono font-semibold">¢{(req.referralCost || 0).toLocaleString()}</td>
                                                <td className="p-3.5 text-right font-mono font-semibold">¢{(req.referralPatientPrice || 0).toLocaleString()}</td>
                                                <td className="p-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                                                    }`}>
                                                        {isCompleted ? 'Resultados Listos' : (req.referralStatus || 'Enviado')}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleOpenResultModal(req)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                                                isCompleted 
                                                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                                            }`}
                                                        >
                                                            {isCompleted ? <><FileText size={13} /> Ver Resultados</> : <><Plus size={13} /> Cargar Resultados</>}
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => navigateTo('request_details', req.id)}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                                                            title="Ver Detalle Muestra"
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {outboundReferrals.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="text-center py-10 text-slate-400 italic">No hay muestras derivadas actualmente a laboratorios externos.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: INBOUND REFERRALS (MICRLABS COMO LABORATORIO DE REFERENCIA) */}
            {/* ========================================================================= */}
            {activeTab === 'inbound' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Banner de Microlabs como Laboratorio de Referencia */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                                    Servicio de Referencia Nacional
                                </span>
                            </div>
                            <h2 className="text-xl font-black tracking-tight">Muestras Recibidas de Otros Laboratorios</h2>
                            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                                Microlabs procesa ensayos microbiológicos de alta complejidad, análisis de aguas, alimentos y cultivos para clínicas y laboratorios del país.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigateTo('new_request', null, { mode: 'referral' })}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all shrink-0 cursor-pointer"
                        >
                            <Plus size={16} /> ➕ Recepcionar Muestra de Otro Lab
                        </button>
                    </div>

                    {/* Stats rápidas */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Muestras Recibidas</span>
                            <span className="text-2xl font-black text-slate-800">{inboundReferrals.length}</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-amber-500 uppercase block">En Análisis / Siembra</span>
                            <span className="text-2xl font-black text-amber-600">
                                {inboundReferrals.filter(r => r.status !== 'Completado').length}
                            </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase block">Completadas / Reportadas</span>
                            <span className="text-2xl font-black text-emerald-600">
                                {inboundReferrals.filter(r => r.status === 'Completado').length}
                            </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase block">Labs Remitentes Activos</span>
                            <span className="text-2xl font-black text-indigo-600">
                                {new Set(inboundReferrals.map(r => r.referringLabName || r.clientName)).size}
                            </span>
                        </div>
                    </div>

                    {/* Tabla de Muestras Recibidas */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                <Inbox size={16} className="text-slate-500" /> Bandeja de Entrada de Laboratorios Remitentes
                            </h3>
                            <span className="text-xs font-bold text-slate-500">
                                {inboundReferrals.length} Registradas
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="p-3.5 font-bold">ID LIMS</th>
                                        <th className="p-3.5 font-bold">Lab Remitente</th>
                                        <th className="p-3.5 font-bold">Paciente / Matriz</th>
                                        <th className="p-3.5 font-bold">Análisis Solicitado</th>
                                        <th className="p-3.5 font-bold">Cadena de Frío al Recibir</th>
                                        <th className="p-3.5 font-bold">Fecha Ingreso</th>
                                        <th className="p-3.5 font-bold">Estado Ensayo</th>
                                        <th className="p-3.5 font-bold text-center">Informe & Envío</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inboundReferrals.map(req => {
                                        const reqDate = req.requestDate?.seconds ? new Date(req.requestDate.seconds * 1000).toLocaleDateString() : (typeof req.requestDate === 'string' ? new Date(req.requestDate).toLocaleDateString() : 'N/A');
                                        const isReady = req.status === 'Completado';
                                        return (
                                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3.5 font-mono font-bold text-slate-700">{req.id.substring(0, 8).toUpperCase()}</td>
                                                <td className="p-3.5">
                                                    <span className="font-black text-indigo-900 block">{req.referringLabName || req.clientName}</span>
                                                    {req.referringLabOrderId && (
                                                        <span className="text-[10px] text-slate-400 font-mono">Orden Externa: #{req.referringLabOrderId}</span>
                                                    )}
                                                </td>
                                                <td className="p-3.5">
                                                    <span className="font-bold text-slate-800 block">{req.patientName || req.sampleDescription || 'Muestra'}</span>
                                                    <span className="text-[10px] text-slate-400 capitalize">{req.sampleType || req.clientType}</span>
                                                </td>
                                                <td className="p-3.5 font-semibold text-slate-700">{req.analysisRequested}</td>
                                                <td className="p-3.5 text-[11px] text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Thermometer size={12} className="text-slate-400" />
                                                        {req.referralColdChainCondition || 'Refrigerada 2-8°C'}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-slate-600">{reqDate}</td>
                                                <td className="p-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button 
                                                            type="button"
                                                            onClick={() => navigateTo('final_report', req.id)}
                                                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                        >
                                                            <FileText size={12} /> Ver Informe
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => navigateTo('request_details', req.id)}
                                                            className="p-1 text-slate-400 hover:text-indigo-600"
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {inboundReferrals.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="text-center py-12 text-slate-400 italic">
                                                No hay muestras referidas registradas actualmente. Presione "Recepcionar Muestra de Otro Lab" para ingresar una.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: LABS DIRECTORY (DIRECTORIO DE LABORATORIOS ALIADOS) */}
            {/* ========================================================================= */}
            {activeTab === 'labs' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-sm">Directorio de Laboratorios de la Red</h3>
                            <p className="text-xs text-slate-400">Laboratorios a los que enviamos o que nos remiten muestras analíticas.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingLab(null);
                                setLabName('');
                                setLabType('Destino (Subcontratado)');
                                setLabDirector('');
                                setLabDirectorCode('');
                                setLabEmail('');
                                setLabReportsEmail('');
                                setLabBillingEmail('');
                                setLabPhone('');
                                setLabAddress('');
                                setLabDiscount('0');
                                setShowLabForm(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                            <Plus size={14} /> Registrar Nuevo Laboratorio
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {referenceLabs.map(lab => (
                            <div key={lab.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative hover:border-indigo-300 transition-all">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {lab.type || 'Laboratorio Aliado'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => handleEditLab(lab)}
                                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                            title="Editar"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-base">{lab.name}</h4>
                                    {lab.directorName && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <UserCheck size={13} className="text-indigo-500" /> Regente: {lab.directorName} ({lab.directorCode || 'MQC'})
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                                    {lab.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400 shrink-0" />
                                            <span>{lab.phone}</span>
                                        </div>
                                    )}
                                    {lab.email && (
                                        <div className="flex items-center gap-1.5">
                                            <Mail size={13} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{lab.email}</span>
                                        </div>
                                    )}
                                    {lab.emailReports && (
                                        <div className="flex items-center gap-1.5 text-indigo-700 font-medium">
                                            <FileText size={13} className="shrink-0" />
                                            <span className="truncate">Reportes: {lab.emailReports}</span>
                                        </div>
                                    )}
                                </div>

                                {lab.discountPercentage > 0 && (
                                    <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold p-2 rounded-xl border border-emerald-200 flex justify-between items-center">
                                        <span>Convenio Descuento:</span>
                                        <span className="font-mono">{lab.discountPercentage}% Off</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: CATALOG (TARIFARIO INTER-LABORATORIO) */}
            {/* ========================================================================= */}
            {activeTab === 'catalog' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-sm">Tarifario B2B Inter-Laboratorios</h3>
                                <p className="text-xs text-slate-400">Convenios de precios especiales entre laboratorios para derivaciones.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="p-3.5 font-bold">Código Ensayo</th>
                                        <th className="p-3.5 font-bold">Nombre del Ensayo</th>
                                        <th className="p-3.5 font-bold">Laboratorio Asociado</th>
                                        <th className="p-3.5 font-bold text-right">Precio de Costo B2B</th>
                                        <th className="p-3.5 font-bold text-right">Precio Sugerido Paciente</th>
                                        <th className="p-3.5 font-bold text-right">Margen Bruto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {referenceLabTests.map(test => {
                                        const cost = parseFloat(test.costPrice) || 0;
                                        const price = parseFloat(test.patientPrice) || 0;
                                        const margin = price - cost;
                                        return (
                                            <tr key={test.id} className="hover:bg-slate-50">
                                                <td className="p-3.5 font-mono font-bold text-slate-700">{test.testCode || 'N/A'}</td>
                                                <td className="p-3.5 font-bold text-slate-900">{test.testName}</td>
                                                <td className="p-3.5 text-indigo-700 font-semibold">{test.labName || 'Varios'}</td>
                                                <td className="p-3.5 text-right font-mono font-bold">¢{cost.toLocaleString()}</td>
                                                <td className="p-3.5 text-right font-mono font-bold">¢{price.toLocaleString()}</td>
                                                <td className="p-3.5 text-right font-mono font-bold text-emerald-600">¢{margin.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                    {referenceLabTests.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-10 text-slate-400 italic">No hay tarifas inter-laboratorio registradas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR / EDITAR LABORATORIO ALIADO */}
            {showLabForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-base text-slate-800">
                                {editingLab ? 'Editar Laboratorio Aliado' : 'Registrar Nuevo Laboratorio Aliado'}
                            </h3>
                            <button type="button" onClick={() => setShowLabForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>
                        <form onSubmit={handleSaveLab} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Nombre del Laboratorio <span className="text-red-500">*</span></label>
                                <input type="text" required value={labName} onChange={e => setLabName(e.target.value)} placeholder="Ej. Laboratorio Clínico San José" className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Tipo de Relación</label>
                                    <select value={labType} onChange={e => setLabType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                        <option>Destino (Subcontratado)</option>
                                        <option>Remitente (Cliente de Referencia)</option>
                                        <option>Bilateral (Envío y Recepción)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Descuento B2B (%)</label>
                                    <input type="number" value={labDiscount} onChange={e => setLabDiscount(e.target.value)} placeholder="Ej. 15" className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Microbiólogo Regente</label>
                                    <input type="text" value={labDirector} onChange={e => setLabDirector(e.target.value)} placeholder="Dr. / Dra." className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Código MQC Regente</label>
                                    <input type="text" value={labDirectorCode} onChange={e => setLabDirectorCode(e.target.value)} placeholder="Ej. 1234" className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono Directo</label>
                                    <input type="tel" value={labPhone} onChange={e => setLabPhone(e.target.value)} placeholder="2222-3333" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Correo General</label>
                                    <input type="email" value={labEmail} onChange={e => setLabEmail(e.target.value)} placeholder="info@laboratorio.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Correo para Envío de Reportes / Resultados</label>
                                <input type="email" value={labReportsEmail} onChange={e => setLabReportsEmail(e.target.value)} placeholder="reportes@laboratorio.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowLabForm(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl">Guardar Laboratorio</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE RESULTADOS EXTERNOS */}
            {showResultModal && activeReferral && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-800">
                                    {activeReferral.referralStatus === 'Completado' ? 'Resultados Externos Vinculados' : 'Registrar Resultados Externos'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Muestra: <strong className="text-slate-700">{activeReferral.id.substring(0, 8).toUpperCase()}</strong> • Lab: <strong>{activeReferral.referralLab}</strong>
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Notas / Conclusiones del Resultado</label>
                                <textarea
                                    value={resultNotes}
                                    onChange={(e) => setResultNotes(e.target.value)}
                                    rows="5"
                                    placeholder="Ingrese los resultados emitidos por el laboratorio externo..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-xs"
                                ></textarea>
                            </div>

                            {activeReferral.referralStatus !== 'Completado' ? (
                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1">Adjuntar Reporte Original (PDF o Imagen)</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setAttachmentFile(e.target.files[0])}
                                        className="w-full text-xs font-semibold text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {attachmentFile && (
                                        <button
                                            type="button"
                                            onClick={handleExtractWithAI}
                                            disabled={isExtracting}
                                            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-xs font-bold"
                                        >
                                            <Sparkles size={13} className={isExtracting ? "animate-pulse" : ""} />
                                            {isExtracting ? 'Analizando...' : '✨ Extraer Resultados con IA'}
                                        </button>
                                    )}
                                </div>
                            ) : activeReferral.referralAttachmentData ? (
                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1">Documento Adjunto Guardado</label>
                                    <a 
                                        href={activeReferral.referralAttachmentData} 
                                        download={activeReferral.referralAttachmentName || 'Reporte_Externo'}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-bold text-xs w-max hover:bg-indigo-100"
                                    >
                                        <Download size={14} /> Descargar Reporte Original
                                    </a>
                                </div>
                            ) : null}

                            {uploadProgress && (
                                <p className="text-xs font-bold text-indigo-600 animate-pulse text-center">{uploadProgress}</p>
                            )}

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowResultModal(false)} className="px-4 py-2 font-bold text-slate-500">Cerrar</button>
                                <button 
                                    type="button"
                                    onClick={handleSaveResult}
                                    disabled={isSubmitting || isExtracting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl"
                                >
                                    {activeReferral.referralStatus === 'Completado' ? 'Actualizar Resultados' : 'Guardar y Validar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
