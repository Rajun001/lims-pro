import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, PlusCircle, FileText, Trash2, CheckCircle, Sparkles } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logAuditAction } from '../utils/audit';
import { LIMSSystemId } from '../services/firebase';

import cmqccrCatalog from '../data/cmqccr_catalog.json';

const BASE_ANALYSIS_CODES = [
    { code: 'RTA', name: 'Recuento Total Aeróbico' },
    { code: 'CT', name: 'Coliformes Totales' },
    { code: 'CF', name: 'Coliformes Fecales' },
    { code: 'EC', name: 'Escherichia coli' },
    { code: 'STA', name: 'Staphylococcus aureus' },
    { code: 'HL', name: 'Hongos y levaduras' },
    { code: 'SAL', name: 'Salmonella sp' },
    { code: 'LIS', name: 'Listeria sp' },
    { code: 'LMO', name: 'Listeria monocytogenes' },
    { code: 'EO', name: 'Escherichia coli O157' },
    { code: 'BC', name: 'Bacillus cereus' },
    { code: 'CP', name: 'Clostridium perfringens' },
    { code: 'CSR', name: 'Clostridium Sulfitos Reductores' },
    { code: 'CB', name: 'Clostridium botulinum' },
    { code: 'BAL', name: 'Bacterias Acido Lácticas' },
    { code: 'ENT', name: 'Enterobacterias' },
    { code: 'VI', name: 'Vibrio sp' },
    { code: 'CA', name: 'Campylobacter sp' },
    { code: 'CE', name: 'Confirmación de esterilidad' },
    { code: 'IB', name: 'Indicador Biológico' },
    { code: 'HIS', name: 'Histaminas' },
    { code: 'PSC', name: 'Psicrófilos' },
    { code: 'EMT', name: 'Esporulados Mesófilos Totales' },
    { code: 'ETT', name: 'Esporulados Termófilos Totales' },
    { code: 'VC', name: 'Vibrio cholerae' },
    { code: 'PS', name: 'Pseudomonas sp' },
    { code: 'PA', name: 'Pseudomonas aeroginosa' },
    { code: 'EN', name: 'Enterococcos' },
    { code: 'LE', name: 'Legionella sp' },
    { code: 'IB2', name: 'Identificación de bacterias' },
    { code: 'IH', name: 'Identificación de Hongos' },
    { code: 'TG', name: 'Tinción de Gram' },
    { code: 'EMA', name: 'Esporulados Mesófilos Aeróbicos' },
    { code: 'EMANA', name: 'Esporulados Mesófilos Anaeróbicos' },
    { code: 'ETA', name: 'Esporulados Termófilos Aeróbicos' },
    { code: 'ETANA', name: 'Esporulados Termófilos Anaeróbico' },
    { code: 'HTR', name: 'Hongos Termoresistentes' },
    { code: 'VU', name: 'Vida Útil' },
    { code: 'SET', name: 'Enterotoxina Staphylococcus SET' },
    { code: 'LEV', name: 'Levaduras' },
    { code: 'HM', name: 'Hongos miceliales' },
    { code: 'ME', name: 'Cuerpo o material extraño' },
    { code: 'IDI', name: 'Identificación de insectos' },
    { code: 'AFL', name: 'Aflatoxinas' },
    { code: 'CR', name: 'Cronobacter' },
    { code: 'TER', name: 'Termófilos' },
    { code: 'EMTR', name: 'Esporulados Mesófilos Termoresistentes' },
    { code: 'ETTR', name: 'Esporulados Termófilos Termoresistentes' }
];

const ANALYSIS_CODES = [
    ...BASE_ANALYSIS_CODES.map(item => ({ ...item, category: 'Microbiología (Alimentos y Aguas)' })),
    ...cmqccrCatalog.map(item => ({ code: item.code, name: item.name, isClinical: true, category: item.category || 'Clínica' })),
    { code: 'CUSTOM', name: 'Otro Análisis', category: 'Otros' }
];

const GROUPED_ANALYSIS = ANALYSIS_CODES.reduce((acc, current) => {
    if (!acc[current.category]) acc[current.category] = [];
    acc[current.category].push(current);
    return acc;
}, {});

const METHOD_CODES = [
    { code: 'M1', name: 'Método tradicional (UFC/g o mL)' },
    { code: 'M2', name: 'Método en espiral' },
    { code: 'M3', name: 'Número Más Probable (NMP)' },
    { code: 'M4', name: 'Filtración de membrana' },
    { code: 'M5', name: 'ELISA' },
    { code: 'M6', name: 'PCR 48 hrs' },
    { code: 'M7', name: 'PCR 24 hrs' },
    { code: 'M8', name: 'Cromogénico - flurogénico' },
    { code: 'M9', name: 'Enzimático' },
    { code: 'M10', name: 'Petrifilm normal' },
    { code: 'M11', name: 'Petrifilm Express 24 hrs' },
    { code: 'M12', name: 'Bioquímica miniatura API' },
    { code: 'M13', name: 'Impactación' },
    { code: 'M14', name: 'Sedimentación' },
    { code: 'A', name: 'Otros / NA' }
];

export const RequestForm = ({ db, user, navigateTo, clients }) => {
    const [clientName, setClientName] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [searchClientQuery, setSearchClientQuery] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 16));
    const [deliveryMethod, setDeliveryMethod] = useState('Email');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // CRM Contact State
    const [selectedContact, setSelectedContact] = useState(null);
    const [newClientEmail, setNewClientEmail] = useState('');
    
    // AI State
    const [isExtracting, setIsExtracting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('LIMS_GEMINI_API_KEY') || '');
    
    const location = useLocation();
    
    // Clinical Fields
    const [formMode, setFormMode] = useState(location.state?.mode || 'industrial'); // 'industrial' | 'clinical'
    
    useEffect(() => {
        if (location.state?.mode) {
            setFormMode(location.state.mode);
        }
    }, [location.state?.mode]);

    const [patientName, setPatientName] = useState('');
    const [patientDOB, setPatientDOB] = useState('');
    const [patientGender, setPatientGender] = useState('Masculino');
    const [patientPhone, setPatientPhone] = useState('');
    const [patientAddress, setPatientAddress] = useState('');
    const [requesterName, setRequesterName] = useState('');
    const [collectionDate, setCollectionDate] = useState('');
    const [collectionLocation, setCollectionLocation] = useState('');
    const [clinicalInfo, setClinicalInfo] = useState('');

    const [samples, setSamples] = useState([
        { id: Date.now(), description: '', lot: '', other: '', analysisCode: 'RTA', methodCode: 'M1' }
    ]);

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        const query = searchClientQuery.toLowerCase();
        return clients.filter(c => 
            (c.name || '').toLowerCase().includes(query) || 
            (c.email || '').toLowerCase().includes(query)
        );
    }, [clients, searchClientQuery]);

    const addRow = () => {
        if (samples.length >= 20) {
            alert("El formulario permite un máximo de 20 muestras por registro.");
            return;
        }
        setSamples([...samples, { id: Date.now(), description: '', lot: '', other: '', analysisCode: 'RTA', methodCode: 'M1' }]);
    };

    const removeRow = (id) => {
        if (samples.length === 1) return;
        if (window.confirm("¿Está seguro de remover esta muestra de la solicitud?")) {
            setSamples(samples.filter(s => s.id !== id));
        }
    };

    const updateSample = (id, field, value) => {
        setSamples(samples.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleExtractWithAI = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
            const base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result;
                    resolve(result.substring(result.indexOf(',') + 1));
                };
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            const promptText = `Eres un experto asistente de laboratorio LIMS. Tu tarea es extraer la información de esta orden médica o solicitud de análisis y devolverla ESTRICTAMENTE en formato JSON válido. No devuelvas texto adicional ni markdown como \`\`\`json. Solo el objeto JSON plano.
            
Estructura requerida:
{
  "tipoFormulario": "clinico" o "industrial",
  "paciente_o_cliente": {
    "nombre": "Nombre completo de la persona o empresa",
    "identificacion": "Cédula o ID si aparece",
    "telefono": "Teléfono si aparece",
    "fechaNacimiento": "YYYY-MM-DD o vacio",
    "sexo": "Masculino, Femenino u Otro o vacio",
    "direccion": "Dirección si aparece"
  },
  "datosClinicos": {
    "medicoSolicitante": "Nombre del médico o clínica si es clinico",
    "informacionClinica": "Diagnóstico, notas o historial si aparece",
    "fechaTomaMuestra": "YYYY-MM-DDTHH:MM o vacio"
  },
  "muestras": [
    {
      "descripcion": "Ej. Sangre, Orina, Carne, Superficie",
      "lote": "Lote si es alimento o industrial",
      "otrosDatos": "Temperatura, condiciones",
      "pruebasSolicitadas": ["Nombre de prueba 1", "Nombre de prueba 2"]
    }
  ]
}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType: file.type, data: base64String } }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                if (response.status === 400) {
                    localStorage.removeItem('LIMS_GEMINI_API_KEY');
                    setGeminiApiKey('');
                    throw new Error("API Key inválida.");
                }
                throw new Error("Error del servidor de IA");
            }

            const data = await response.json();
            let extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            extractedText = extractedText.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(extractedText);

            setUploadProgress('Aplicando datos al formulario...');
            
            if (result.tipoFormulario === 'clinico' || result.datosClinicos?.medicoSolicitante) {
                setFormMode('clinical');
                setPatientName(result.paciente_o_cliente?.nombre || '');
                setRequesterName(result.datosClinicos?.medicoSolicitante || '');
                setPatientDOB(result.paciente_o_cliente?.fechaNacimiento !== 'vacio' ? (result.paciente_o_cliente?.fechaNacimiento || '') : '');
                
                let gender = result.paciente_o_cliente?.sexo || 'Masculino';
                if (gender === 'vacio') gender = 'Masculino';
                setPatientGender(gender);
                
                setPatientPhone(result.paciente_o_cliente?.telefono !== 'vacio' ? (result.paciente_o_cliente?.telefono || '') : '');
                setPatientAddress(result.paciente_o_cliente?.direccion !== 'vacio' ? (result.paciente_o_cliente?.direccion || '') : '');
                setClinicalInfo(result.datosClinicos?.informacionClinica !== 'vacio' ? (result.datosClinicos?.informacionClinica || '') : '');
                if (result.datosClinicos?.fechaTomaMuestra && result.datosClinicos.fechaTomaMuestra !== 'vacio') {
                    setCollectionDate(result.datosClinicos.fechaTomaMuestra);
                }
            } else {
                setFormMode('industrial');
            }

            if (result.paciente_o_cliente?.nombre) {
                const nameToSearch = result.paciente_o_cliente.nombre;
                const foundClient = clients?.find(c => c.name.toLowerCase() === nameToSearch.toLowerCase());
                if (foundClient) {
                    setSelectedClientId(foundClient.id);
                    setClientName(foundClient.name);
                    setSearchClientQuery(foundClient.name);
                } else {
                    setSelectedClientId('NEW_CLIENT');
                    setClientName(nameToSearch);
                    setSearchClientQuery(nameToSearch);
                    if (result.paciente_o_cliente?.telefono && result.paciente_o_cliente.telefono !== 'vacio') {
                        setPatientPhone(result.paciente_o_cliente.telefono);
                    }
                }
            }

            if (result.muestras && result.muestras.length > 0) {
                const newSamples = [];
                result.muestras.forEach((m, idx) => {
                    const isClin = result.tipoFormulario === 'clinico' || result.datosClinicos?.medicoSolicitante;
                    const desc = (m.descripcion && m.descripcion !== 'vacio') ? m.descripcion : (isClin ? 'Muestra biológica' : 'Producto');
                    const pruebas = m.pruebasSolicitadas || [];
                    
                    if (pruebas.length === 0) {
                        newSamples.push({ id: Date.now() + idx, description: desc, lot: (m.lote && m.lote !== 'vacio') ? m.lote : '', other: (m.otrosDatos && m.otrosDatos !== 'vacio') ? m.otrosDatos : '', analysisCode: 'CUSTOM', methodCode: 'M1' });
                    } else {
                        pruebas.forEach((p, pIdx) => {
                            const match = ANALYSIS_CODES.find(ac => ac.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(ac.name.toLowerCase()));
                            const aCode = match ? match.code : 'CUSTOM';
                            newSamples.push({ 
                                id: Date.now() + idx + pIdx, 
                                description: desc + (aCode === 'CUSTOM' ? ` (${p})` : ''), 
                                lot: (m.lote && m.lote !== 'vacio') ? m.lote : '', 
                                other: (m.otrosDatos && m.otrosDatos !== 'vacio') ? m.otrosDatos : '', 
                                analysisCode: aCode, 
                                methodCode: 'M1' 
                            });
                        });
                    }
                });
                if (newSamples.length > 0) setSamples(newSamples);
            }

            setUploadProgress('¡Datos cargados con éxito!');
        } catch (error) {
            console.error("AI Error:", error);
            alert("Error al extraer con IA: " + error.message);
            setUploadProgress('Error en extracción.');
        } finally {
            setIsExtracting(false);
            setTimeout(() => setUploadProgress(prev => prev.includes('éxito') || prev.includes('Error') ? '' : prev), 5000);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalClientName = selectedClientId === 'NEW_CLIENT' ? clientName : searchClientQuery;
        
        if (!finalClientName) {
            alert("Por favor seleccione o ingrese un cliente.");
            return;
        }

        const validSamples = samples.filter(s => s.description.trim() !== '');
        if (validSamples.length === 0) {
            alert("Por favor ingrese al menos una muestra.");
            return;
        }
        
        if (formMode === 'clinical') {
            if (!patientName || !requesterName || !collectionDate) {
                alert("Por favor complete todos los campos obligatorios clínicos (Nombre, Solicitante, Fecha de toma).");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            let actualClientId = selectedClientId;
            
            // Si es un cliente nuevo, crearlo en el CRM automáticamente
            if (selectedClientId === 'NEW_CLIENT') {
                try {
                    const clientData = {
                        name: clientName,
                        type: formMode === 'clinical' ? 'Paciente (Clínico)' : 'Industria',
                        email: newClientEmail,
                        contacts: [],
                        status: 'Activo',
                        createdAt: serverTimestamp()
                    };

                    if (formMode === 'clinical') {
                        clientData.birthDate = patientDOB;
                        clientData.gender = patientGender;
                        clientData.document = '';
                        if (patientPhone || newClientEmail) {
                            clientData.contacts.push({ name: patientName, role: 'Paciente', phone: patientPhone, email: newClientEmail });
                        }
                    } else if (newClientEmail) {
                        clientData.contacts.push({ name: 'Contacto Principal', role: 'Principal', email: newClientEmail });
                    }

                    const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/clients`), clientData);
                    actualClientId = docRef.id;
                } catch (err) {
                    console.error("Error creating new client in CRM:", err);
                }
            }

            const batchPromises = validSamples.map(async (sample) => {
                const analysisName = ANALYSIS_CODES.find(a => a.code === sample.analysisCode)?.name || 'Análisis no especificado';
                
                // Determine sample category loosely based on method or typical words
                let sampleCategory = 'Alimentos';
                if (sample.methodCode === 'M3') sampleCategory = 'Agua / Hielo';
                else if (sample.methodCode === 'M13' || sample.methodCode === 'M14') sampleCategory = 'Aire / Ambiental';
                else if (sample.description.toLowerCase().includes('orina') || sample.description.toLowerCase().includes('sangre')) sampleCategory = 'Clínica';

                // Map method codes to platingMethod logic for the UI to pick up automatically
                let platingMethodStr = '';
                if (sample.methodCode === 'M1') platingMethodStr = 'Siembra en Profundidad';
                if (sample.methodCode === 'M2') platingMethodStr = 'Siembra Espiral - IUL Eddy Jet 2';
                if (sample.methodCode === 'M4') platingMethodStr = 'Filtración por Membrana';
                if (sample.methodCode === 'M10') platingMethodStr = 'Placa Petrifilm (Neogen/3M)';

                const docData = {
                    clientName: finalClientName,
                    clientId: actualClientId === 'NEW_CLIENT' ? '' : actualClientId,
                    clientType: formMode === 'clinical' ? 'Clínica' : 'Industria',
                    
                    // CRM Contact Info
                    clientContactName: selectedClientId === 'NEW_CLIENT' ? '' : (selectedContact?.name || ''),
                    clientContactEmail: selectedClientId === 'NEW_CLIENT' ? newClientEmail.trim() : (selectedContact?.email || ''),
                    clientContactPhone: selectedClientId === 'NEW_CLIENT' ? '' : (selectedContact?.phone || ''),

                    sampleType: formMode === 'clinical' ? 'Clínica' : sampleCategory,
                    sampleDescription: sample.description,
                    sampleLot: formMode === 'clinical' ? null : sample.lot,
                    sampleOther: sample.other,
                    requestDate: new Date(entryDate),
                    analysisRequested: analysisName,
                    analysisCode: sample.analysisCode,
                    methodCode: sample.methodCode,
                    expectedPlatingMethod: platingMethodStr,
                    deliveryMethod,
                    
                    ...(formMode === 'clinical' ? {
                        patientName,
                        patientDOB,
                        patientGender,
                        patientPhone,
                        patientAddress,
                        requesterName,
                        collectionDate: collectionDate ? new Date(collectionDate) : null,
                        collectionLocation,
                        clinicalInfo
                    } : {}),

                    analysisIds: [],
                    results: {},
                    status: 'Pendiente',
                    createdAt: serverTimestamp(),
                    createdBy: user?.uid || 'anon'
                };
                
                const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/requests`), docData);
                return docRef.id;
            });

            await Promise.all(batchPromises);
            
            await logAuditAction(db, user?.uid, 'CREAR_SOLICITUD_LOTE', `Se registraron ${validSamples.length} muestras en bloque para ${finalClientName}`);
            navigateTo('dashboard');
        } catch (error) {
            console.error("Error creando solicitudes en lote:", error);
            alert("Ocurrió un error al guardar las solicitudes.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-12">
            <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
                <ArrowLeft size={18} className="mr-2" /> Volver a Solicitudes
            </button>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-8 border-b border-slate-100 pb-6 flex justify-between items-end">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                                {formMode === 'clinical' ? 'Ingreso de Solicitud Clínica' : 'Ingreso de Muestras (Industrial)'}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Límite: 20 por formulario.</p>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <img src="https://www.microlabscr.com/s/misc/logo.jpg" alt="Logo" className="h-12 opacity-80 mix-blend-multiply" onError={(e) => e.target.style.display='none'} />
                    </div>
                </div>

                <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2"><Sparkles size={16} className="text-violet-600" /> Autocompletar con IA</h3>
                        <p className="text-xs text-indigo-700 mt-1">Sube una orden médica o solicitud para extraer los datos automáticamente.</p>
                    </div>
                    <div className="relative">
                        <label className={`flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer shadow-sm transition-colors ${isExtracting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isExtracting ? <Sparkles size={16} className="animate-pulse" /> : <PlusCircle size={16} />} 
                            {isExtracting ? 'Procesando...' : 'Subir Documento'}
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleExtractWithAI} disabled={isExtracting} />
                        </label>
                    </div>
                </div>
                
                {uploadProgress && (
                    <div className="mb-6 p-3 bg-indigo-600 text-white text-center text-sm font-bold rounded-lg animate-pulse shadow-sm">
                        {uploadProgress}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* ENCABEZADO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="space-y-2 relative col-span-1 md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 uppercase">Compañía / Contacto <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar..." 
                                value={searchClientQuery}
                                onChange={e => {
                                    setSearchClientQuery(e.target.value);
                                    setIsClientDropdownOpen(true);
                                    if (selectedClientId !== 'NEW_CLIENT') setSelectedClientId('');
                                }}
                                onFocus={() => setIsClientDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setIsClientDropdownOpen(false), 250)}
                                required
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-slate-800" 
                            />
                            
                            {isClientDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredClients.map((client) => (
                                        <div 
                                            key={client.id}
                                            onClick={() => {
                                                setSelectedClientId(client.id);
                                                setClientName(client.name);
                                                setSearchClientQuery(client.name);
                                                setIsClientDropdownOpen(false);
                                                
                                                // Auto-select a 'Reportes' contact if possible
                                                if (client.contacts && client.contacts.length > 0) {
                                                    const reportsContact = client.contacts.find(c => c.role === 'Reportes') || client.contacts[0];
                                                    setSelectedContact(reportsContact);
                                                } else {
                                                    setSelectedContact(null);
                                                }

                                                // Auto-fill clinical fields if client is a patient
                                                if (client.type === 'Paciente (Clínico)' || client.type === 'paciente') {
                                                    setFormMode('clinical');
                                                    setPatientName(client.name);
                                                    setPatientDOB(client.birthDate || '');
                                                    setPatientGender(client.gender || 'Masculino');
                                                    if (client.contacts && client.contacts.length > 0 && client.contacts[0].phones && client.contacts[0].phones.length > 0) {
                                                        setPatientPhone(client.contacts[0].phones[0].number);
                                                    } else if (client.contacts && client.contacts.length > 0 && client.contacts[0].phone) {
                                                        setPatientPhone(client.contacts[0].phone);
                                                    } else {
                                                        setPatientPhone('');
                                                    }
                                                }
                                            }}
                                            className="px-4 py-3 hover:bg-indigo-50 text-slate-700 text-sm cursor-pointer flex justify-between items-center transition-colors"
                                        >
                                            <span className="font-bold text-slate-800">{client.name}</span>
                                        </div>
                                    ))}
                                    <div 
                                        onClick={() => {
                                            setSelectedClientId('NEW_CLIENT');
                                            setClientName('');
                                            setNewClientEmail('');
                                            setSearchClientQuery('Nuevo (Escribir nombre abajo)');
                                            setIsClientDropdownOpen(false);
                                            setSelectedContact(null);
                                        }}
                                        className="px-4 py-3 hover:bg-slate-100 text-slate-600 text-sm cursor-pointer italic font-bold border-t border-slate-100"
                                    >
                                        ➕ Registrar Nuevo
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {selectedClientId && selectedClientId !== 'NEW_CLIENT' && (
                            <div className="space-y-2 animate-fade-in">
                                <label className="block text-xs font-bold text-slate-600 uppercase">Contacto para Reporte <span className="text-indigo-500">*</span></label>
                                {clients.find(c => c.id === selectedClientId)?.contacts?.length > 0 ? (
                                    <select 
                                        value={selectedContact?.email || ''} 
                                        onChange={e => {
                                            const client = clients.find(c => c.id === selectedClientId);
                                            const contact = client.contacts.find(c => c.email === e.target.value);
                                            setSelectedContact(contact);
                                        }}
                                        className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-indigo-900 cursor-pointer"
                                    >
                                        <option value="">Seleccione un contacto...</option>
                                        {clients.find(c => c.id === selectedClientId).contacts.map((contact, idx) => (
                                            <option key={`${contact.email}-${idx}`} value={contact.email}>
                                                {contact.name || 'Sin nombre'} ({contact.role}) - {contact.email || 'Sin correo'}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100 flex items-center h-full">
                                        Este cliente no tiene contactos en su libreta de CRM.
                                    </p>
                                )}
                            </div>
                        )}

                        {selectedClientId === 'NEW_CLIENT' && (
                            <>
                                <div className="space-y-2 animate-fade-in">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Nombre Nuevo <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={clientName} 
                                        onChange={e => setClientName(e.target.value)} 
                                        placeholder="Nombre" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold" 
                                    />
                                </div>
                                <div className="space-y-2 animate-fade-in">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Correo (Opcional)</label>
                                    <input 
                                        type="email" 
                                        value={newClientEmail} 
                                        onChange={e => setNewClientEmail(e.target.value)} 
                                        placeholder="ejemplo@correo.com" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold" 
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-600 uppercase">Fecha de Recepción <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-600 uppercase">Entrega Reporte</label>
                            <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-slate-800">
                                <option value="Email">E-Mail</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Físico">Impreso</option>
                            </select>
                        </div>
                    </div>

                    {formMode === 'clinical' && (
                        <div className="space-y-6 bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                            <h3 className="font-bold text-indigo-900 border-b border-indigo-200 pb-2">Información Clínica y Paciente</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Nombre del Paciente <span className="text-red-500">*</span></label>
                                    <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} required={formMode === 'clinical'} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Médico Solicitante / Clínica <span className="text-red-500">*</span></label>
                                    <input type="text" value={requesterName} onChange={e => setRequesterName(e.target.value)} required={formMode === 'clinical'} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Fecha de Nacimiento</label>
                                    <input type="date" value={patientDOB} onChange={e => setPatientDOB(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Sexo</label>
                                    <select value={patientGender} onChange={e => setPatientGender(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                        <option>Masculino</option>
                                        <option>Femenino</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Teléfono</label>
                                    <input type="text" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Dirección</label>
                                    <input type="text" value={patientAddress} onChange={e => setPatientAddress(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Fecha y Hora de Toma de Muestra <span className="text-red-500">*</span></label>
                                    <input type="datetime-local" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} required={formMode === 'clinical'} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Lugar de Extracción</label>
                                    <input type="text" value={collectionLocation} onChange={e => setCollectionLocation(e.target.value)} placeholder="Ej. Domicilio, Laboratorio central..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Información Clínica Importante (Diagnóstico, Tratamiento, etc.)</label>
                                    <textarea value={clinicalInfo} onChange={e => setClinicalInfo(e.target.value)} rows="2" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TABLA DE MUESTRAS */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">{formMode === 'clinical' ? 'Análisis Requeridos (Muestras)' : 'Identificación de Muestras (Características)'}</h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{samples.length} / 20</span>
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="p-3 w-10 text-center font-bold">#</th>
                                        <th className="p-3 font-bold">{formMode === 'clinical' ? 'TIPO MUESTRA (Ej. Sangre)' : 'MUESTRA (S)'} <span className="text-red-400">*</span></th>
                                        {formMode !== 'clinical' && <th className="p-3 font-bold w-32">LOTE (S)</th>}
                                        {formMode !== 'clinical' && <th className="p-3 font-bold w-32">OTROS</th>}
                                        <th className="p-3 font-bold w-64">ANÁLISIS (COD)</th>
                                        <th className="p-3 font-bold w-48">MÉTODO (COD)</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {samples.map((sample, index) => (
                                        <tr key={sample.id} className="hover:bg-slate-50">
                                            <td className="p-2 text-center font-bold text-slate-400">{index + 1}</td>
                                            <td className="p-2">
                                                <input 
                                                    type="text" 
                                                    required
                                                    placeholder="Ej. Carne Molida"
                                                    value={sample.description}
                                                    onChange={(e) => updateSample(sample.id, 'description', e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                                />
                                            </td>
                                            {formMode !== 'clinical' && (
                                                <td className="p-2">
                                                    <input 
                                                        type="text" 
                                                        value={sample.lot}
                                                        onChange={(e) => updateSample(sample.id, 'lot', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    />
                                                </td>
                                            )}
                                            {formMode !== 'clinical' && (
                                                <td className="p-2">
                                                    <input 
                                                        type="text" 
                                                        value={sample.other}
                                                        onChange={(e) => updateSample(sample.id, 'other', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    />
                                                </td>
                                            )}
                                            <td className="p-2">
                                                <select 
                                                    value={sample.analysisCode}
                                                    onChange={(e) => updateSample(sample.id, 'analysisCode', e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700"
                                                >
                                                    {Object.entries(GROUPED_ANALYSIS).map(([category, items]) => (
                                                        <optgroup key={category} label={category}>
                                                            {items.map(ac => (
                                                                <option key={ac.code} value={ac.code}>{ac.code} - {ac.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <select 
                                                    value={sample.methodCode}
                                                    onChange={(e) => updateSample(sample.id, 'methodCode', e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-900 bg-indigo-50"
                                                >
                                                    {METHOD_CODES.map(mc => (
                                                        <option key={mc.code} value={mc.code}>{mc.code} - {mc.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2 text-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeRow(sample.id)}
                                                    disabled={samples.length === 1}
                                                    className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3">
                            <button 
                                type="button" 
                                onClick={addRow}
                                className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <PlusCircle size={16} /> Añadir Muestra
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2">
                            <CheckCircle size={20} />
                            {isSubmitting ? 'Procesando Lote...' : 'Registrar Muestras'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
