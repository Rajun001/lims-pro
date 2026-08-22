import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, PlusCircle, FileText, Trash2, CheckCircle, Sparkles, Search } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logAuditAction } from '../utils/audit';
import { lookupCivilRegistry } from '../utils/civilRegistry';
import { LIMSSystemId } from '../services/firebase';
import { extractOrderFromDocument } from '../services/aiService';

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

// Catalogo de Microbiologia y Quimica de Aguas y Alimentos (Industrial)
const INDUSTRIAL_ANALYSIS_CODES = [
    { code: 'RTA', name: 'Recuento Total Aeróbico', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CT', name: 'Coliformes Totales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CF', name: 'Coliformes Fecales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EC', name: 'Escherichia coli', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'STA', name: 'Staphylococcus aureus', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'HL', name: 'Hongos y levaduras', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'SAL', name: 'Salmonella sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'LIS', name: 'Listeria sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'LMO', name: 'Listeria monocytogenes', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EO', name: 'Escherichia coli O157', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'BC', name: 'Bacillus cereus', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CP', name: 'Clostridium perfringens', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CSR', name: 'Clostridium Sulfitos Reductores', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CB', name: 'Clostridium botulinum', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'BAL', name: 'Bacterias Acido Lácticas', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ENT', name: 'Enterobacterias', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'VI', name: 'Vibrio sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CA', name: 'Campylobacter sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CE', name: 'Confirmación de esterilidad', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'IB', name: 'Indicador Biológico', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'HIS', name: 'Histaminas', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'PSC', name: 'Psicrófilos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EMT', name: 'Esporulados Mesófilos Totales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ETT', name: 'Esporulados Termófilos Totales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'VC', name: 'Vibrio cholerae', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'PS', name: 'Pseudomonas sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'PA', name: 'Pseudomonas aeroginosa', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EN', name: 'Enterococcos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'LE', name: 'Legionella sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'IB2', name: 'Identificación de bacterias', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'IH', name: 'Identificación de Hongos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'TG', name: 'Tinción de Gram', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EMA', name: 'Esporulados Mesófilos Aeróbicos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EMANA', name: 'Esporulados Mesófilos Anaeróbicos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ETA', name: 'Esporulados Termófilos Aeróbicos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ETANA', name: 'Esporulados Termófilos Anaeróbico', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'HTR', name: 'Hongos Termoresistentes', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'VU', name: 'Vida Útil', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'SET', name: 'Enterotoxina Staphylococcus SET', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'LEV', name: 'Levaduras', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'HM', name: 'Hongos miceliales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ME', name: 'Cuerpo o material extraño', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'IDI', name: 'Identificación de insectos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'AFL', name: 'Aflatoxinas', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CR', name: 'Cronobacter', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'TER', name: 'Termófilos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EMTR', name: 'Esporulados Mesófilos Termoresistentes', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ETTR', name: 'Esporulados Termófilos Termoresistentes', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'FQ-PH', name: 'pH y Acidez Titulable', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'FQ-TURB', name: 'Turbidez', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'FQ-CL', name: 'Cloro Libre Residual', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'FQ-DBO', name: 'Demanda Bioquímica de Oxígeno (DBO5)', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'FQ-DQO', name: 'Demanda Química de Oxígeno (DQO)', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'CUSTOM', name: 'Otro Análisis Industrial', category: 'Otros Análisis' }
];

// Catalogo Clínico Oficial (CMQCCR)
const CLINICAL_ANALYSIS_CODES = [
    ...cmqccrCatalog.map(item => ({ 
        code: item.code, 
        name: item.name, 
        isClinical: true, 
        category: item.category || 'Química Clínica' 
    })),
    { code: 'CUSTOM', name: 'Otro Análisis Clínico', category: 'Otros Análisis' }
];

// Tipos de Muestra Predefinidos
const CLINICAL_SAMPLE_TYPES = [
    'Sangre Total (EDTA)',
    'Suero Sanguíneo',
    'Plasma Sanguíneo (Heparina / Citrato)',
    'Orina (Examen General / Sedimento)',
    'Orina (24 Horas)',
    'Heces / Materia Fecal',
    'Exudado Faríngeo / Hisopado Nasal',
    'Exudado Vaginal / Cervical',
    'Exudado Uretral',
    'Secreción / Absceso / Herida',
    'Esputo / Lavado Bronquial',
    'Líquido Cefalorraquídeo (LCR)',
    'Líquido Sinovial / Pleural / Ascítico',
    'Biopsia / Tejido',
    'Raspado de Uña / Piel / Pelo',
    'Muestra Biológica (Otro)'
];

const INDUSTRIAL_SAMPLE_TYPES = [
    'Alimento Procesado / Producto Terminado',
    'Lácteos y Derivados',
    'Cárnicos y Embutidos',
    'Agua Potable / Consumo Humano',
    'Agua Residual / Tratada',
    'Hielo para Consumo',
    'Materia Prima / Ingredientes',
    'Superficie Viva (Manipulador - Manos/Uñas)',
    'Superficie Inerte (Mesas / Equipos / Utensilios)',
    'Ambiente / Aire (Impactación)',
    'Ambiente / Aire (Sedimentación)',
    'Cosméticos y Farmacéuticos',
    'Muestra Industrial (Otro)'
];

// Métodos Clínicos
const CLINICAL_METHOD_CODES = [
    { code: 'CM1', name: 'Analizador Automatizado (Química / Hematología)', category: '🏥 Métodos Clínicos' },
    { code: 'CM2', name: 'Microscopía Óptica / Tinción Directa (Gram, Sedimento)', category: '🏥 Métodos Clínicos' },
    { code: 'CM3', name: 'Cultivo Microbiológico & Antibiograma (Sensidiscos / CMI)', category: '🏥 Métodos Clínicos' },
    { code: 'CM4', name: 'Inmunoensayo / ELISA / Quimioluminiscencia', category: '🏥 Métodos Clínicos' },
    { code: 'CM5', name: 'Prueba Rápida / Inmunocromatografía', category: '🏥 Métodos Clínicos' },
    { code: 'CM6', name: 'Biología Molecular / PCR Tiempo Real', category: '🏥 Métodos Clínicos' },
    { code: 'CM7', name: 'Aglutinación en Látex / Turbidimetría', category: '🏥 Métodos Clínicos' },
    { code: 'CM8', name: 'Método Manual / Químico Húmedo', category: '🏥 Métodos Clínicos' },
    { code: 'CM9', name: 'Otro Método Clínico', category: '🏥 Métodos Clínicos' }
];

// Métodos Industriales (Aguas, Alimentos, Superficies y FQ)
const INDUSTRIAL_METHOD_CODES = [
    // Métodos para Aguas e Hielo
    { code: 'M4', name: 'Filtración por Membrana (MF) [UFC/100mL - Agua Potable/Baja Turbidez]', category: '💧 Aguas e Hielo (Criterios Microbiológicos)' },
    { code: 'M3', name: 'Número Más Probable (NMP - Tubos Múltiples) [NMP/100mL - Aguas Residuales/Crudas]', category: '💧 Aguas e Hielo (Criterios Microbiológicos)' },
    { code: 'M8', name: 'Sustrato Definido Cromogénico/Fluorogénico (Colilert / Quanti-Tray) [NMP/100mL o P/A]', category: '💧 Aguas e Hielo (Criterios Microbiológicos)' },
    { code: 'M15', name: 'Presencia / Ausencia en 100 mL (P/A)', category: '💧 Aguas e Hielo (Criterios Microbiológicos)' },
    { code: 'M16', name: 'Recuento en Placa Heterótrofos / Mesófilos (UFC/mL)', category: '💧 Aguas e Hielo (Criterios Microbiológicos)' },

    // Métodos para Alimentos y Bebidas
    { code: 'M1', name: 'Recuento en Placa en Profundidad (UFC/g o mL)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M2', name: 'Siembra en Espiral (IUL Eddy Jet) (UFC/g)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M10', name: 'Placa Petrifilm (Neogen/3M) (UFC/g)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M11', name: 'Placa Petrifilm Express 24 hrs', category: '🥩 Alimentos y Bebidas' },
    { code: 'M17', name: 'Número Más Probable en Alimentos (NMP/g)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M18', name: 'Enriquecimiento Selectivo (Presencia/Ausencia en 25g - Salmonella/Listeria)', category: '🥩 Alimentos y Bebidas' },

    // Monitoreo de Superficies y Ambiente
    { code: 'M19', name: 'Hisopado de Superficies / Placa RODAC (UFC/cm² o UFC/hisopo)', category: '🧼 Superficies y Ambiente' },
    { code: 'M13', name: 'Impactación Ambiental (Muestreador de Aire / CAMTU) (UFC/m³)', category: '🧼 Superficies y Ambiente' },
    { code: 'M14', name: 'Sedimentación Pasiva en Placa (UFC/placa)', category: '🧼 Superficies y Ambiente' },

    // Ensayos Moleculares y Físico-Química
    { code: 'M5', name: 'ELISA / Inmunoensayo', category: '🔬 Métodos Moleculares y Físico-Química' },
    { code: 'M6', name: 'PCR Tiempo Real (48 hrs)', category: '🔬 Métodos Moleculares y Físico-Química' },
    { code: 'M7', name: 'PCR Tiempo Real Rápido (24 hrs)', category: '🔬 Métodos Moleculares y Físico-Química' },
    { code: 'M9', name: 'Método Enzimático / Colorimétrico', category: '🔬 Métodos Moleculares y Físico-Química' },
    { code: 'M12', name: 'Identificación Bioquímica API / Galerías', category: '🔬 Métodos Moleculares y Físico-Química' },
    { code: 'M20', name: 'Potenciometría / Turbidimetría / Titulación DBO-DQO', category: '🔬 Métodos Moleculares y Físico-Química' },
    { code: 'A', name: 'Otro Método / Criterio Específico', category: '🔬 Métodos Moleculares y Físico-Química' }
];

export const RequestForm = ({ db, user, navigateTo, clients, requests, labInfo }) => {
    const location = useLocation();
    
    // Form Mode: 'clinical' | 'industrial'
    const [formMode, setFormMode] = useState(location.state?.mode || 'industrial');

    // Sedes y Sucursales
    const branchesList = useMemo(() => {
        return labInfo?.branches?.filter(b => b.active !== false) || [
            {
                id: 'suc-guadalupe',
                code: 'GUA-01',
                name: 'Sede Central Guadalupe',
                address: 'Guadalupe, del correo 75 mts Norte. Zip: 10801, San José',
                telephones: '22348837, 22345862, 22246541',
                directorName: 'Dr. Roldán Ajún Chaverri',
                directorCode: '802'
            }
        ];
    }, [labInfo]);

    const [selectedBranchId, setSelectedBranchId] = useState(() => {
        const mainB = branchesList.find(b => b.isMain) || branchesList[0];
        return mainB ? mainB.id : 'suc-guadalupe';
    });

    const [clientName, setClientName] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [searchClientQuery, setSearchClientQuery] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 16));
    const [deliveryMethod, setDeliveryMethod] = useState('Email');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // CRM Contact State
    const [_selectedContact, _setSelectedContact] = useState(null);
    const [newClientEmail, setNewClientEmail] = useState('');
    
    // AI State
    const [isExtracting, setIsExtracting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('LIMS_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '');

    // --- CAMPOS CLÍNICOS ESTRUCTURADOS (PACIENTE) ---
    const [patientDNI, setPatientDNI] = useState('');
    const [isSearchingRegistry, setIsSearchingRegistry] = useState(false);
    const [patientFirstName, setPatientFirstName] = useState('');
    const [patientSecondName, setPatientSecondName] = useState('');
    const [patientFirstLastName, setPatientFirstLastName] = useState('');
    const [patientSecondLastName, setPatientSecondLastName] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientDOB, setPatientDOB] = useState('');
    const [patientGender, setPatientGender] = useState('Masculino');
    const [patientAddress, setPatientAddress] = useState('');

    // Teléfonos Clínicos
    const [patientPhoneMobile, setPatientPhoneMobile] = useState('');
    const [patientPhoneLandline, setPatientPhoneLandline] = useState('');
    const [patientPhoneEmergency, setPatientPhoneEmergency] = useState('');

    // Correos Electrónicos Clínicos y Enrutamiento
    const [patientEmailResults, setPatientEmailResults] = useState('');
    const [patientEmailBilling, setPatientEmailBilling] = useState('');

    // Médico Tratante / Clínica
    const [requesterName, setRequesterName] = useState('');
    const [doctorSpecialty, setDoctorSpecialty] = useState('');
    const [doctorEmail, setDoctorEmail] = useState('');
    const [doctorPhone, setDoctorPhone] = useState('');

    const [collectionDate, setCollectionDate] = useState('');
    const [collectionLocation, setCollectionLocation] = useState('');
    const [clinicalInfo, setClinicalInfo] = useState('');

    // --- CAMPOS INDUSTRIALES ESTRUCTURADOS (EMPRESAS / ALIMENTOS / AGUAS) ---
    const [companyLegalName, setCompanyLegalName] = useState('');
    const [companyCommercialName, setCompanyCommercialName] = useState('');
    const [companyTaxId, setCompanyTaxId] = useState('');
    const [receptionTemp, setReceptionTemp] = useState('');
    const [samplerName, setSamplerName] = useState('');

    // Departamento de Calidad & Inocuidad (Destino de Informes Técnicos y COA)
    const [qualityContactFirstName, setQualityContactFirstName] = useState('');
    const [qualityContactSecondName, _setQualityContactSecondName] = useState('');
    const [qualityContactFirstLastName, setQualityContactFirstLastName] = useState('');
    const [qualityContactSecondLastName, _setQualityContactSecondLastName] = useState('');
    const [qualityContactRole, setQualityContactRole] = useState('Jefe de Calidad e Inocuidad');
    const [qualityContactEmail, setQualityContactEmail] = useState('');
    const [qualityContactPhoneMobile, setQualityContactPhoneMobile] = useState('');
    const [qualityContactPhoneOffice, setQualityContactPhoneOffice] = useState('');

    // Departamento de Contabilidad & Facturación (Destino de Facturas y Cobros)
    const [accountingContactName, setAccountingContactName] = useState('');
    const [accountingContactEmail, setAccountingContactEmail] = useState('');
    const [accountingContactPhone, setAccountingContactPhone] = useState('');

    // Departamento de Compras & Cotizaciones (Destino de Cotizaciones)
    const [procurementContactEmail, setProcurementContactEmail] = useState('');

    // --- CAMPOS DE MUESTRAS REFERIDAS POR OTROS LABORATORIOS (INBOUND REFERRAL) ---
    const [_isReferredInbound, _setIsReferredInbound] = useState(location.state?.mode === 'referral');
    const [_referringLabName, _setReferringLabName] = useState(location.state?.referringLabName || '');
    const [_referringLabCode, _setReferringLabCode] = useState('');
    const [_referringLabOrderId, _setReferringLabOrderId] = useState('');
    const [_referringMicrobiologist, _setReferringMicrobiologist] = useState('');
    const [_referringLabEmail, _setReferringLabEmail] = useState('');
    const [_referringLabPhone, _setReferringLabPhone] = useState('');
    const [_referralColdChainCondition, _setReferralColdChainCondition] = useState('Refrigerada (2°C - 8°C)');
    const [_referralAcceptanceStatus, _setReferralAcceptanceStatus] = useState('Aceptada Conforme');
    const [_referralMatrixCategory, _setReferralMatrixCategory] = useState('clinical'); // 'clinical' | 'industrial'

    // --- MOTOR DE MEMORIA Y AUTOCOMPLETADO INTELIGENTE (HISTORIAL + CRM) ---
    const [autoFilledInfo, setAutoFilledInfo] = useState(null);
    const [dniSuggestions, setDniSuggestions] = useState([]);
    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [companySuggestions, setCompanySuggestions] = useState([]);
    const [doctorSuggestions, setDoctorSuggestions] = useState([]);

    // Banco de memoria unificado (CRM + Solicitudes previas)
    const memoryBank = useMemo(() => {
        const list = [];
        const seenKeys = new Set();

        // 1. Escanear Clientes de CRM
        (clients || []).forEach(c => {
            if (!c.name) return;
            const isClin = c.type?.includes('Paciente') || c.type?.includes('Clínic') || c.type === 'paciente';
            const item = {
                id: c.id,
                source: 'CRM Registrado',
                type: isClin ? 'clinical' : 'industrial',
                name: c.name,
                document: c.document || '',
                firstName: c.firstName || '',
                secondName: c.secondName || '',
                firstLastName: c.firstLastName || '',
                secondLastName: c.secondLastName || '',
                birthDate: c.birthDate || '',
                gender: c.gender || 'Masculino',
                address: c.address || '',
                phoneMobile: c.contacts?.find(ct => ct.role?.includes('Resultados') || ct.phone)?.phone || c.phone || '',
                phoneLandline: c.contacts?.find(ct => ct.phoneLandline)?.phoneLandline || '',
                phoneEmergency: c.contacts?.find(ct => ct.phoneEmergency)?.phoneEmergency || '',
                emailResults: c.contacts?.find(ct => ct.role?.includes('Resultados') || ct.department === 'Paciente')?.email || c.email || '',
                emailBilling: c.contacts?.find(ct => ct.role?.includes('Facturación') || ct.department === 'Contabilidad')?.email || '',
                // Médico
                requesterName: c.contacts?.find(ct => ct.role?.includes('Médico'))?.name || '',
                doctorSpecialty: c.contacts?.find(ct => ct.role?.includes('Médico'))?.department || '',
                doctorEmail: c.contacts?.find(ct => ct.role?.includes('Médico'))?.email || '',
                doctorPhone: c.contacts?.find(ct => ct.role?.includes('Médico'))?.phone || '',
                // Empresa
                companyLegalName: c.name,
                companyCommercialName: c.commercialName || '',
                companyTaxId: c.document || '',
                qualityContactFirstName: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.name || '',
                qualityContactRole: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.department || 'Aseguramiento de Calidad',
                qualityContactEmail: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.email || c.email || '',
                qualityContactPhoneMobile: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.phone || '',
                qualityContactPhoneOffice: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.phoneOffice || '',
                accountingContactName: c.contacts?.find(ct => ct.role?.includes('Facturación'))?.name || '',
                accountingContactEmail: c.contacts?.find(ct => ct.role?.includes('Facturación'))?.email || '',
                accountingContactPhone: c.contacts?.find(ct => ct.role?.includes('Facturación'))?.phone || '',
                procurementContactEmail: c.contacts?.find(ct => ct.role?.includes('Compras'))?.email || '',
                lastDate: c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'Directorio'
            };
            const key = `${item.type}-${(item.name || '').toLowerCase()}-${item.document}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                list.push(item);
            }
        });

        // 2. Escanear Solicitudes Históricas del LIMS
        (requests || []).forEach(r => {
            const clientN = r.clientName || r.patientName || r.companyLegalName;
            if (!clientN) return;
            const isClin = r.clientType === 'Clínica' || r.patientName || r.patientDNI;
            const item = {
                id: r.id,
                source: 'Historial de Órdenes',
                type: isClin ? 'clinical' : 'industrial',
                name: clientN,
                document: r.patientDNI || r.companyTaxId || '',
                firstName: r.patientFirstName || '',
                secondName: r.patientSecondName || '',
                firstLastName: r.patientFirstLastName || '',
                secondLastName: r.patientSecondLastName || '',
                birthDate: r.patientDOB || '',
                gender: r.patientGender || 'Masculino',
                address: r.patientAddress || '',
                phoneMobile: r.patientPhoneMobile || r.patientPhone || '',
                phoneLandline: r.patientPhoneLandline || '',
                phoneEmergency: r.patientPhoneEmergency || '',
                emailResults: r.patientEmailResults || r.email || '',
                emailBilling: r.patientEmailBilling || '',
                requesterName: r.requesterName || '',
                doctorSpecialty: r.doctorSpecialty || '',
                doctorEmail: r.doctorEmail || '',
                doctorPhone: r.doctorPhone || '',
                companyLegalName: r.companyLegalName || clientN,
                companyCommercialName: r.companyCommercialName || '',
                companyTaxId: r.companyTaxId || '',
                qualityContactFirstName: r.qualityContactFirstName || r.qualityContactName || '',
                qualityContactRole: r.qualityContactRole || '',
                qualityContactEmail: r.qualityContactEmail || r.email || '',
                qualityContactPhoneMobile: r.qualityContactPhoneMobile || r.qualityContactPhone || '',
                qualityContactPhoneOffice: r.qualityContactPhoneOffice || '',
                accountingContactName: r.accountingContactName || '',
                accountingContactEmail: r.accountingContactEmail || '',
                accountingContactPhone: r.accountingContactPhone || '',
                procurementContactEmail: r.procurementContactEmail || '',
                lastDate: r.requestDate ? new Date(r.requestDate).toLocaleDateString() : 'Órden Previa'
            };
            const key = `${item.type}-${(item.name || '').toLowerCase()}-${item.document}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                list.push(item);
            }
        });

        return list;
    }, [clients, requests]);

    // Lista única de médicos y especialistas conocidos en memoria
    const doctorMemoryList = useMemo(() => {
        const docMap = new Map();
        memoryBank.forEach(m => {
            if (m.requesterName && m.requesterName.trim().length > 2) {
                const key = m.requesterName.toLowerCase().trim();
                if (!docMap.has(key)) {
                    docMap.set(key, {
                        name: m.requesterName,
                        specialty: m.doctorSpecialty || '',
                        email: m.doctorEmail || '',
                        phone: m.doctorPhone || ''
                    });
                }
            }
        });
        return Array.from(docMap.values());
    }, [memoryBank]);

    // Aplicar perfil completo desde la memoria en un solo clic
    const applyMemoryProfile = (profile) => {
        if (!profile) return;
        if (profile.type === 'clinical' || formMode === 'clinical') {
            let fn = profile.firstName;
            let sn = profile.secondName;
            let fln = profile.firstLastName;
            let sln = profile.secondLastName;

            if (!fn && profile.name) {
                const parts = profile.name.trim().split(' ');
                fn = parts[0] || '';
                if (parts.length === 2) {
                    fln = parts[1] || '';
                } else if (parts.length === 3) {
                    fln = parts[1] || '';
                    sln = parts[2] || '';
                } else if (parts.length >= 4) {
                    sn = parts[1] || '';
                    fln = parts[2] || '';
                    sln = parts.slice(3).join(' ') || '';
                }
            }

            setPatientFirstName(fn || '');
            setPatientSecondName(sn || '');
            setPatientFirstLastName(fln || '');
            setPatientSecondLastName(sln || '');
            setPatientName(profile.name);
            setPatientDNI(profile.document || '');
            setPatientDOB(profile.birthDate || '');
            setPatientGender(profile.gender || 'Masculino');
            setPatientAddress(profile.address || '');

            setPatientPhoneMobile(profile.phoneMobile || '');
            setPatientPhoneLandline(profile.phoneLandline || '');
            setPatientPhoneEmergency(profile.phoneEmergency || '');

            setPatientEmailResults(profile.emailResults || '');
            setPatientEmailBilling(profile.emailBilling || '');

            if (profile.requesterName) setRequesterName(profile.requesterName);
            if (profile.doctorSpecialty) setDoctorSpecialty(profile.doctorSpecialty);
            if (profile.doctorEmail) setDoctorEmail(profile.doctorEmail);
            if (profile.doctorPhone) setDoctorPhone(profile.doctorPhone);

            setClientName(profile.name);
            setSearchClientQuery(profile.name);
            setSelectedClientId(profile.id || '');
        } else {
            setCompanyLegalName(profile.companyLegalName || profile.name);
            setCompanyCommercialName(profile.companyCommercialName || '');
            setCompanyTaxId(profile.companyTaxId || profile.document || '');

            setQualityContactFirstName(profile.qualityContactFirstName || '');
            setQualityContactRole(profile.qualityContactRole || 'Jefe de Calidad');
            setQualityContactEmail(profile.qualityContactEmail || '');
            setQualityContactPhoneMobile(profile.qualityContactPhoneMobile || '');
            setQualityContactPhoneOffice(profile.qualityContactPhoneOffice || '');

            setAccountingContactName(profile.accountingContactName || '');
            setAccountingContactEmail(profile.accountingContactEmail || '');
            setAccountingContactPhone(profile.accountingContactPhone || '');

            setProcurementContactEmail(profile.procurementContactEmail || '');

            setClientName(profile.companyLegalName || profile.name);
            setSearchClientQuery(profile.companyLegalName || profile.name);
            setSelectedClientId(profile.id || '');
        }

        setAutoFilledInfo({
            name: profile.name,
            source: profile.source || 'Historial LIMS',
            date: profile.lastDate || 'Previo'
        });

        // Limpiar sugerencias
        setDniSuggestions([]);
        setNameSuggestions([]);
        setCompanySuggestions([]);
    };

    // Auto-completar médico
    const applyDoctorProfile = (doc) => {
        if (!doc) return;
        setRequesterName(doc.name);
        if (doc.specialty) setDoctorSpecialty(doc.specialty);
        if (doc.email) setDoctorEmail(doc.email);
        if (doc.phone) setDoctorPhone(doc.phone);
        setDoctorSuggestions([]);
    };

    // Helpers de digitación con búsqueda viva en memoria
    const handleDniInputChange = (val) => {
        setPatientDNI(val);
        const query = val.replace(/\D/g, '');
        if (query.length >= 3) {
            const matches = memoryBank.filter(m => m.type === 'clinical' && (m.document || '').replace(/\D/g, '').includes(query));
            setDniSuggestions(matches.slice(0, 4));
        } else {
            setDniSuggestions([]);
        }
    };

    const handlePatientNameInputChange = (field, val) => {
        let fn = field === 'fn' ? val : patientFirstName;
        let sn = field === 'sn' ? val : patientSecondName;
        let fln = field === 'fln' ? val : patientFirstLastName;
        let sln = field === 'sln' ? val : patientSecondLastName;
        if (field === 'fn') setPatientFirstName(val);
        if (field === 'sn') setPatientSecondName(val);
        if (field === 'fln') setPatientFirstLastName(val);
        if (field === 'sln') setPatientSecondLastName(val);

        const fullName = [fn, sn, fln, sln].filter(Boolean).join(' ');
        setPatientName(fullName);
        if (formMode === 'clinical') {
            setClientName(fullName);
            setSearchClientQuery(fullName);
        }

        // Búsqueda en memoria
        const searchTerms = val.toLowerCase().trim();
        if (searchTerms.length >= 2) {
            const matches = memoryBank.filter(m => 
                m.type === 'clinical' && 
                (m.name.toLowerCase().includes(searchTerms) || (m.firstName && m.firstName.toLowerCase().includes(searchTerms)) || (m.firstLastName && m.firstLastName.toLowerCase().includes(searchTerms)))
            );
            setNameSuggestions(matches.slice(0, 5));
        } else {
            setNameSuggestions([]);
        }
    };

    const handleCompanyInputChange = (field, val) => {
        if (field === 'legal') {
            setCompanyLegalName(val);
            if (formMode === 'industrial') {
                setClientName(val);
                setSearchClientQuery(val);
            }
            if (val.trim().length >= 2) {
                const matches = memoryBank.filter(m => m.type === 'industrial' && (m.name.toLowerCase().includes(val.toLowerCase()) || (m.companyTaxId && m.companyTaxId.includes(val))));
                setCompanySuggestions(matches.slice(0, 5));
            } else {
                setCompanySuggestions([]);
            }
        }
        if (field === 'commercial') setCompanyCommercialName(val);
        if (field === 'taxId') {
            setCompanyTaxId(val);
            if (val.trim().length >= 3) {
                const matches = memoryBank.filter(m => m.type === 'industrial' && (m.companyTaxId && m.companyTaxId.includes(val)));
                setCompanySuggestions(matches.slice(0, 5));
            } else {
                setCompanySuggestions([]);
            }
        }
    };

    const handleDoctorInputChange = (val) => {
        setRequesterName(val);
        if (val.trim().length >= 2) {
            const matches = doctorMemoryList.filter(d => d.name.toLowerCase().includes(val.toLowerCase()) || d.specialty.toLowerCase().includes(val.toLowerCase()));
            setDoctorSuggestions(matches.slice(0, 4));
        } else {
            setDoctorSuggestions([]);
        }
    };

    const defaultAnalysisCode = formMode === 'clinical' 
        ? (CLINICAL_ANALYSIS_CODES[0]?.code || '1020') 
        : 'RTA';
    const defaultMethodCode = formMode === 'clinical' ? 'CM1' : 'M4';

    const [samples, setSamples] = useState([
        { 
            id: Date.now(), 
            description: '', 
            lot: '', 
            other: '', 
            analysisCode: defaultAnalysisCode, 
            methodCode: defaultMethodCode 
        }
    ]);

    // Switch mode logic
    const handleSwitchMode = (newMode) => {
        if (newMode === formMode) return;
        setFormMode(newMode);
        const newDefaultAnalysis = newMode === 'clinical' 
            ? (CLINICAL_ANALYSIS_CODES[0]?.code || '1020') 
            : 'RTA';
        const newDefaultMethod = newMode === 'clinical' ? 'CM1' : 'M4';
        
        // Reset or adjust sample codes for the selected mode
        setSamples(prev => prev.map(s => ({
            ...s,
            analysisCode: newDefaultAnalysis,
            methodCode: newDefaultMethod
        })));
    };

    useEffect(() => {
        if (location.state?.mode && location.state.mode !== formMode) {
            handleSwitchMode(location.state.mode);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state?.mode]);

    // Active catalogs strictly separated by formMode
    const activeAnalysisCatalog = useMemo(() => {
        return formMode === 'clinical' ? CLINICAL_ANALYSIS_CODES : INDUSTRIAL_ANALYSIS_CODES;
    }, [formMode]);

    const activeGroupedAnalysis = useMemo(() => {
        return activeAnalysisCatalog.reduce((acc, current) => {
            if (!acc[current.category]) acc[current.category] = [];
            acc[current.category].push(current);
            return acc;
        }, {});
    }, [activeAnalysisCatalog]);

    const activeMethodCodes = useMemo(() => {
        return formMode === 'clinical' ? CLINICAL_METHOD_CODES : INDUSTRIAL_METHOD_CODES;
    }, [formMode]);

    const activeGroupedMethods = useMemo(() => {
        return activeMethodCodes.reduce((acc, current) => {
            const cat = current.category || (formMode === 'clinical' ? '🏥 Métodos Clínicos' : '🔬 Métodos Generales');
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(current);
            return acc;
        }, {});
    }, [activeMethodCodes, formMode]);

    const activeSampleTypeSuggestions = useMemo(() => {
        return formMode === 'clinical' ? CLINICAL_SAMPLE_TYPES : INDUSTRIAL_SAMPLE_TYPES;
    }, [formMode]);

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        const query = searchClientQuery.toLowerCase();
        return clients.filter(c => {
            const matchesQuery = (c.name || '').toLowerCase().includes(query) || 
                                 (c.email || '').toLowerCase().includes(query) ||
                                 (c.document || '').toLowerCase().includes(query);
            if (!matchesQuery) return false;
            
            // Prioritize/filter depending on mode if query is empty
            if (!query) {
                if (formMode === 'clinical') {
                    return c.type === 'Paciente (Clínico)' || c.type === 'paciente' || c.type === 'Médico / Clínica';
                } else {
                    return c.type !== 'Paciente (Clínico)' && c.type !== 'paciente';
                }
            }
            return true;
        });
    }, [clients, searchClientQuery, formMode]);

    const addRow = () => {
        if (samples.length >= 20) {
            alert("El formulario permite un máximo de 20 muestras por registro.");
            return;
        }
        setSamples([
            ...samples, 
            { 
                id: Date.now(), 
                description: '', 
                lot: '', 
                other: '', 
                analysisCode: defaultAnalysisCode, 
                methodCode: defaultMethodCode 
            }
        ]);
    };

    const removeRow = (id) => {
        if (samples.length === 1) return;
        if (window.confirm("¿Está seguro de remover esta muestra de la solicitud?")) {
            setSamples(samples.filter(s => s.id !== id));
        }
    };

    const updateSample = (id, field, value) => {
        setSamples(samples.map(s => {
            if (s.id !== id) return s;
            const updated = { ...s, [field]: value };
            
            // Smart auto-suggestion of method for water samples in industrial mode
            if (formMode === 'industrial') {
                if (field === 'description') {
                    const descLower = (value || '').toLowerCase();
                    if (descLower.includes('agua potable') || descLower.includes('agua consumo') || descLower.includes('hielo')) {
                        if (updated.methodCode === 'M1') updated.methodCode = 'M4'; // Default to Membrane Filtration
                    } else if (descLower.includes('agua residual') || descLower.includes('agua cruda') || descLower.includes('efluente')) {
                        if (updated.methodCode === 'M1') updated.methodCode = 'M3'; // Default to NMP
                    }
                } else if (field === 'analysisCode') {
                    if (value.startsWith('FQ-')) {
                        updated.methodCode = 'M20';
                    }
                }
            }
            return updated;
        }));
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
        setUploadProgress('Leyendo documento con Inteligencia Artificial (Gemini Multi-Modelo)...');

        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            const result = await extractOrderFromDocument(dataUrl, formMode);
            setUploadProgress('Aplicando datos al formulario...');
            
            if (result.tipoFormulario === 'clinico' || result.datosClinicos?.medicoSolicitante) {
                setFormMode('clinical');
                setPatientName(result.paciente_o_cliente?.nombre || '');
                setPatientDNI(result.paciente_o_cliente?.identificacion !== 'vacio' ? (result.paciente_o_cliente?.identificacion || '') : '');
                setRequesterName(result.datosClinicos?.medicoSolicitante || '');
                setPatientDOB(result.paciente_o_cliente?.fechaNacimiento !== 'vacio' ? (result.paciente_o_cliente?.fechaNacimiento || '') : '');
                
                let gender = result.paciente_o_cliente?.sexo || 'Masculino';
                if (gender === 'vacio') gender = 'Masculino';
                setPatientGender(gender);
                
                setPatientPhoneMobile(result.paciente_o_cliente?.telefono !== 'vacio' ? (result.paciente_o_cliente?.telefono || '') : '');
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
                        setPatientPhoneMobile(result.paciente_o_cliente.telefono);
                    }
                }
            }

            if (result.muestras && result.muestras.length > 0) {
                const newSamples = [];
                const isClin = result.tipoFormulario === 'clinico' || result.datosClinicos?.medicoSolicitante;
                const catalogToSearch = isClin ? CLINICAL_ANALYSIS_CODES : INDUSTRIAL_ANALYSIS_CODES;
                const defaultMethod = isClin ? 'CM1' : 'M1';

                result.muestras.forEach((m, idx) => {
                    const desc = (m.descripcion && m.descripcion !== 'vacio') ? m.descripcion : (isClin ? 'Muestra biológica (Sangre/Suero)' : 'Producto / Alimento');
                    const pruebas = m.pruebasSolicitadas || [];
                    
                    if (pruebas.length === 0) {
                        newSamples.push({ 
                            id: Date.now() + idx, 
                            description: desc, 
                            lot: (m.lote && m.lote !== 'vacio') ? m.lote : '', 
                            other: (m.otrosDatos && m.otrosDatos !== 'vacio') ? m.otrosDatos : '', 
                            analysisCode: 'CUSTOM', 
                            methodCode: defaultMethod 
                        });
                    } else {
                        pruebas.forEach((p, pIdx) => {
                            const match = catalogToSearch.find(ac => ac.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(ac.name.toLowerCase()));
                            const aCode = match ? match.code : 'CUSTOM';
                            newSamples.push({ 
                                id: Date.now() + idx + pIdx, 
                                description: desc + (aCode === 'CUSTOM' ? ` (${p})` : ''), 
                                lot: (m.lote && m.lote !== 'vacio') ? m.lote : '', 
                                other: (m.otrosDatos && m.otrosDatos !== 'vacio') ? m.otrosDatos : '', 
                                analysisCode: aCode, 
                                methodCode: defaultMethod 
                            });
                        });
                    }
                });
                if (newSamples.length > 0) setSamples(newSamples);
            }

            setUploadProgress('¡Datos cargados con éxito!');
        } catch (error) {
            console.error("AI Error:", error);
        }
    };

    const handleRegistryLookup = async () => {
        if (!patientDNI.trim()) {
            alert("Por favor ingrese una cédula o número de identificación para consultar.");
            return;
        }
        setIsSearchingRegistry(true);
        try {
            const result = await lookupCivilRegistry(patientDNI);
            setPatientFirstName(result.firstName || '');
            setPatientSecondName(result.secondName || '');
            setPatientFirstLastName(result.firstLastName || '');
            setPatientSecondLastName(result.secondLastName || '');
            setPatientName(result.name);
            setPatientDOB(result.birthDate);
            setPatientGender(result.gender);
            setPatientDNI(result.document);
            setClientName(result.name);
            setSearchClientQuery(result.name);
        } catch (error) {
            alert("❌ Error de consulta: " + error.message);
        } finally {
            setIsSearchingRegistry(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalClientName = formMode === 'clinical' 
            ? (patientName || [patientFirstName, patientSecondName, patientFirstLastName, patientSecondLastName].filter(Boolean).join(' ') || clientName || searchClientQuery)
            : (companyLegalName || clientName || searchClientQuery);
        
        if (!finalClientName.trim()) {
            alert(formMode === 'clinical' ? "Por favor ingrese el nombre del paciente." : "Por favor seleccione o ingrese el nombre / razón social de la empresa.");
            return;
        }

        // --- VALIDACIONES DE FORMULARIO ---
        // 1. Validar que no haya descripciones de muestras vacías
        const emptySample = samples.find(s => !s.description.trim());
        if (emptySample) {
            alert("Por favor complete la descripción o tipo de todas las muestras agregadas.");
            return;
        }

        // 2. Validaciones Clínicas
        if (formMode === 'clinical') {
            if (!patientFirstName || !patientFirstLastName) {
                alert("Por favor complete al menos el Primer Nombre y Primer Apellido del paciente.");
                return;
            }
            if (!requesterName || !collectionDate) {
                alert("Por favor complete el Médico/Clínica solicitante y la Fecha/Hora de toma de muestra.");
                return;
            }

            // Validar fecha de nacimiento no futura
            if (patientDOB) {
                const dobDate = new Date(patientDOB);
                const today = new Date();
                if (dobDate > today) {
                    alert("La fecha de nacimiento no puede ser una fecha futura.");
                    return;
                }
            }

            // Validar correos si se ingresaron
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (patientEmailResults && !emailRegex.test(patientEmailResults)) {
                alert("El correo para envío de resultados tiene un formato inválido.");
                return;
            }
            if (patientEmailBilling && !emailRegex.test(patientEmailBilling)) {
                alert("El correo de facturación electrónica tiene un formato inválido.");
                return;
            }
            if (doctorEmail && !emailRegex.test(doctorEmail)) {
                alert("El correo del médico tratante tiene un formato inválido.");
                return;
            }
        } else {
            // 3. Validaciones Industriales
            if (!companyLegalName.trim() && !finalClientName.trim()) {
                alert("Por favor ingrese la Razón Social o Empresa.");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (qualityContactEmail && !emailRegex.test(qualityContactEmail)) {
                alert("El correo del departamento de calidad tiene un formato inválido.");
                return;
            }
            if (accountingContactEmail && !emailRegex.test(accountingContactEmail)) {
                alert("El correo de contabilidad/facturación tiene un formato inválido.");
                return;
            }
            if (procurementContactEmail && !emailRegex.test(procurementContactEmail)) {
                alert("El correo de compras/cotizaciones tiene un formato inválido.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            let actualClientId = selectedClientId;
            
            // Si es un cliente nuevo o modificado, crearlo/actualizarlo en el CRM con todos sus contactos categorizados
            if (selectedClientId === 'NEW_CLIENT' || !selectedClientId) {
                const clientData = {
                    name: finalClientName,
                    type: formMode === 'clinical' ? 'Paciente (Clínico)' : 'Industria',
                    email: formMode === 'clinical' ? (patientEmailResults || patientEmailBilling || newClientEmail) : (qualityContactEmail || accountingContactEmail || newClientEmail),
                    contacts: [],
                    status: 'Activo',
                    createdAt: user?.uid === 'offline-user' ? { seconds: Math.floor(Date.now() / 1000) } : serverTimestamp()
                };

                if (formMode === 'clinical') {
                    clientData.birthDate = patientDOB;
                    clientData.gender = patientGender;
                    clientData.document = patientDNI;
                    clientData.firstName = patientFirstName;
                    clientData.secondName = patientSecondName;
                    clientData.firstLastName = patientFirstLastName;
                    clientData.secondLastName = patientSecondLastName;
                    clientData.address = patientAddress;
                    clientData.contacts = [
                        ...(patientEmailResults || patientPhoneMobile ? [{
                            name: finalClientName,
                            role: 'Resultados / Consultas',
                            email: patientEmailResults || '',
                            phone: patientPhoneMobile || '',
                            phoneLandline: patientPhoneLandline || '',
                            phoneEmergency: patientPhoneEmergency || '',
                            department: 'Paciente'
                        }] : []),
                        ...(patientEmailBilling ? [{
                            name: finalClientName,
                            role: 'Facturación Electrónica',
                            email: patientEmailBilling,
                            phone: patientPhoneMobile || patientPhoneLandline || '',
                            department: 'Contabilidad'
                        }] : []),
                        ...(requesterName || doctorEmail ? [{
                            name: requesterName,
                            role: 'Médico Tratante',
                            email: doctorEmail || '',
                            phone: doctorPhone || '',
                            department: doctorSpecialty || 'Médico'
                        }] : [])
                    ];
                } else {
                    clientData.document = companyTaxId;
                    clientData.commercialName = companyCommercialName;
                    clientData.contacts = [
                        ...(qualityContactEmail || qualityContactFirstName ? [{
                            name: [qualityContactFirstName, qualityContactSecondName, qualityContactFirstLastName, qualityContactSecondLastName].filter(Boolean).join(' ') || 'Encargado de Calidad',
                            role: 'Calidad / Informes Técnicos',
                            email: qualityContactEmail || '',
                            phone: qualityContactPhoneMobile || qualityContactPhoneOffice || '',
                            phoneOffice: qualityContactPhoneOffice || '',
                            department: qualityContactRole || 'Aseguramiento de Calidad'
                        }] : []),
                        ...(accountingContactEmail || accountingContactName ? [{
                            name: accountingContactName || 'Contabilidad / Cuentas por Pagar',
                            role: 'Facturación / Contabilidad',
                            email: accountingContactEmail || '',
                            phone: accountingContactPhone || '',
                            department: 'Finanzas'
                        }] : []),
                        ...(procurementContactEmail ? [{
                            name: 'Compras / Cotizaciones',
                            role: 'Compras / Cotizaciones',
                            email: procurementContactEmail,
                            phone: '',
                            department: 'Adquisiciones'
                        }] : [])
                    ];
                }

                if (user?.uid === 'offline-user') {
                    const localClients = JSON.parse(localStorage.getItem('lims_local_clients') || '[]');
                    clientData.id = `client-local-${Date.now()}`;
                    localClients.unshift(clientData);
                    localStorage.setItem('lims_local_clients', JSON.stringify(localClients));
                    actualClientId = clientData.id;
                } else {
                    const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/clients`), clientData);
                    actualClientId = docRef.id;
                }
            }

            if (user?.uid === 'offline-user') {
                // --- GUARDADO MODO OFFLINE (LOCALSTORAGE) ---
                const localRequests = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                
                samples.forEach((sample, idx) => {
                    const catalog = formMode === 'clinical' ? CLINICAL_ANALYSIS_CODES : INDUSTRIAL_ANALYSIS_CODES;
                    const analysisName = catalog.find(a => a.code === sample.analysisCode)?.name || 'Análisis no especificado';
                    
                    let sampleCategory = 'Alimentos';
                    if (formMode === 'clinical') {
                        sampleCategory = 'Clínica';
                    } else {
                        const desc = sample.description.toLowerCase();
                        if (sample.methodCode === 'M3' || sample.methodCode === 'M4' || desc.includes('agua') || desc.includes('hielo')) sampleCategory = 'Agua / Hielo';
                        else if (sample.methodCode === 'M13' || sample.methodCode === 'M14' || desc.includes('superficie') || desc.includes('aire') || desc.includes('ambiente')) sampleCategory = 'Aire / Ambiental';
                        else sampleCategory = 'Alimentos';
                    }

                    const methodObj = (formMode === 'clinical' ? CLINICAL_METHOD_CODES : INDUSTRIAL_METHOD_CODES).find(m => m.code === sample.methodCode);
                    const platingMethodStr = methodObj ? methodObj.name : sample.methodCode;

                    const activeBranch = branchesList.find(b => b.id === selectedBranchId) || branchesList[0];

                    const newRequest = {
                        id: `MC-LOCAL-${Date.now()}-${idx}`,
                        clientName: finalClientName,
                        clientId: actualClientId,
                        clientType: formMode === 'clinical' ? 'Clínica' : 'Industria',
                        sampleType: formMode === 'clinical' ? 'Clínica' : sampleCategory,
                        sampleDescription: sample.description,
                        sampleLot: formMode === 'clinical' ? null : sample.lot,
                        sampleOther: sample.other,
                        requestDate: new Date(entryDate).toISOString(),
                        analysisRequested: analysisName,
                        analysisCode: sample.analysisCode,
                        methodCode: sample.methodCode,
                        expectedPlatingMethod: platingMethodStr,
                        deliveryMethod,
                        // --- SUCURSAL / SEDE ---
                        branchId: activeBranch.id,
                        branchName: activeBranch.name,
                        branchCode: activeBranch.code,
                        branchAddress: activeBranch.address,
                        branchPhones: activeBranch.telephones || activeBranch.whatsapp || '',
                        branchDirectorName: activeBranch.directorName || '',
                        branchDirectorCode: activeBranch.directorCode || '',
                        // --- ENRUTAMIENTO Y DATOS ESTRUCTURADOS ---
                        ...(formMode === 'clinical' ? {
                            patientFirstName,
                            patientSecondName,
                            patientFirstLastName,
                            patientSecondLastName,
                            patientName: finalClientName,
                            patientDNI,
                            patientDOB,
                            patientGender,
                            patientAddress,
                            // Teléfonos
                            patientPhoneMobile,
                            patientPhoneLandline,
                            patientPhoneEmergency,
                            patientPhone: patientPhoneMobile || patientPhoneLandline || patientPhoneEmergency,
                            // Correos
                            patientEmailResults,
                            patientEmailBilling,
                            email: patientEmailResults || patientEmailBilling || newClientEmail,
                            // Médico
                            requesterName,
                            doctorSpecialty,
                            doctorEmail,
                            doctorPhone,
                            collectionDate: collectionDate ? new Date(collectionDate).toISOString() : null,
                            collectionLocation,
                            clinicalInfo
                        } : {
                            companyLegalName: finalClientName,
                            companyCommercialName,
                            companyTaxId,
                            receptionTemp,
                            samplerName,
                            // Contacto Calidad / COA
                            qualityContactFirstName,
                            qualityContactSecondName,
                            qualityContactFirstLastName,
                            qualityContactSecondLastName,
                            qualityContactName: [qualityContactFirstName, qualityContactSecondName, qualityContactFirstLastName, qualityContactSecondLastName].filter(Boolean).join(' '),
                            qualityContactRole,
                            qualityContactEmail,
                            qualityContactPhoneMobile,
                            qualityContactPhoneOffice,
                            qualityContactPhone: qualityContactPhoneMobile || qualityContactPhoneOffice,
                            // Contacto Contabilidad
                            accountingContactName,
                            accountingContactEmail,
                            accountingContactPhone,
                            // Compras
                            procurementContactEmail,
                            email: qualityContactEmail || accountingContactEmail || newClientEmail
                        }),
                        analysisIds: [],
                        results: {},
                        status: 'Pendiente',
                        createdAt: { seconds: Math.floor(Date.now() / 1000) },
                        createdBy: 'offline-user'
                    };
                    localRequests.unshift(newRequest);
                });

                localStorage.setItem('lims_local_requests', JSON.stringify(localRequests));
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else {
                // --- GUARDADO MODO ONLINE (FIREBASE FIRESTORE) ---
                const batchPromises = samples.map(async (sample) => {
                    const catalog = formMode === 'clinical' ? CLINICAL_ANALYSIS_CODES : INDUSTRIAL_ANALYSIS_CODES;
                    const analysisName = catalog.find(a => a.code === sample.analysisCode)?.name || 'Análisis no especificado';
                    
                    let sampleCategory = 'Alimentos';
                    if (formMode === 'clinical') {
                        sampleCategory = 'Clínica';
                    } else {
                        const desc = sample.description.toLowerCase();
                        if (sample.methodCode === 'M3' || sample.methodCode === 'M4' || desc.includes('agua') || desc.includes('hielo')) sampleCategory = 'Agua / Hielo';
                        else if (sample.methodCode === 'M13' || sample.methodCode === 'M14' || desc.includes('superficie') || desc.includes('aire') || desc.includes('ambiente')) sampleCategory = 'Aire / Ambiental';
                        else sampleCategory = 'Alimentos';
                    }

                    const methodObj = (formMode === 'clinical' ? CLINICAL_METHOD_CODES : INDUSTRIAL_METHOD_CODES).find(m => m.code === sample.methodCode);
                    const platingMethodStr = methodObj ? methodObj.name : sample.methodCode;

                    const activeBranch = branchesList.find(b => b.id === selectedBranchId) || branchesList[0] || {};

                    const docData = {
                        clientName: finalClientName,
                        clientId: actualClientId,
                        clientType: formMode === 'clinical' ? 'Clínica' : 'Industria',
                        sampleType: formMode === 'clinical' ? 'Clínica' : sampleCategory,
                        sampleDescription: sample.description,
                        sampleLot: formMode === 'clinical' ? null : sample.lot,
                        sampleOther: sample.other,
                        requestDate: serverTimestamp(),
                        analysisRequested: analysisName,
                        analysisCode: sample.analysisCode,
                        methodCode: sample.methodCode,
                        expectedPlatingMethod: platingMethodStr,
                        deliveryMethod,
                        // --- SUCURSAL / SEDE ---
                        branchId: activeBranch.id,
                        branchName: activeBranch.name,
                        branchCode: activeBranch.code,
                        branchAddress: activeBranch.address,
                        branchPhones: activeBranch.telephones || activeBranch.whatsapp || '',
                        branchDirectorName: activeBranch.directorName || '',
                        branchDirectorCode: activeBranch.directorCode || '',
                        // --- ENRUTAMIENTO Y DATOS ESTRUCTURADOS ---
                        ...(formMode === 'clinical' ? {
                            patientFirstName,
                            patientSecondName,
                            patientFirstLastName,
                            patientSecondLastName,
                            patientName: finalClientName,
                            patientDNI,
                            patientDOB,
                            patientGender,
                            patientAddress,
                            // Teléfonos
                            patientPhoneMobile,
                            patientPhoneLandline,
                            patientPhoneEmergency,
                            patientPhone: patientPhoneMobile || patientPhoneLandline || patientPhoneEmergency,
                            // Correos
                            patientEmailResults,
                            patientEmailBilling,
                            email: patientEmailResults || patientEmailBilling || newClientEmail,
                            // Médico
                            requesterName,
                            doctorSpecialty,
                            doctorEmail,
                            doctorPhone,
                            collectionDate: collectionDate ? new Date(collectionDate).toISOString() : null,
                            collectionLocation,
                            clinicalInfo
                        } : {
                            companyLegalName: finalClientName,
                            companyCommercialName,
                            companyTaxId,
                            receptionTemp,
                            samplerName,
                            // Contacto Calidad / COA
                            qualityContactFirstName,
                            qualityContactSecondName,
                            qualityContactFirstLastName,
                            qualityContactSecondLastName,
                            qualityContactName: [qualityContactFirstName, qualityContactSecondName, qualityContactFirstLastName, qualityContactSecondLastName].filter(Boolean).join(' '),
                            qualityContactRole,
                            qualityContactEmail,
                            qualityContactPhoneMobile,
                            qualityContactPhoneOffice,
                            qualityContactPhone: qualityContactPhoneMobile || qualityContactPhoneOffice,
                            // Contacto Contabilidad
                            accountingContactName,
                            accountingContactEmail,
                            accountingContactPhone,
                            // Compras
                            procurementContactEmail,
                            email: qualityContactEmail || accountingContactEmail || newClientEmail
                        }),
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
                await logAuditAction(db, user?.uid, 'CREAR_SOLICITUD_LOTE', `Se registraron ${samples.length} muestras en bloque para ${finalClientName} (${formMode === 'clinical' ? 'Clínico' : 'Industrial'})`);
            }

            alert(`✅ Se registraron con éxito ${samples.length} muestras bajo la solicitud para ${finalClientName}.`);
            navigateTo('dashboard');
        } catch {
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
                {/* Selector de Modo (Clínico vs Industrial) */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => handleSwitchMode('clinical')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-sm ${
                                formMode === 'clinical'
                                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            🏥 Módulo Clínico (Pacientes)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchMode('industrial')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-sm ${
                                formMode === 'industrial'
                                    ? 'bg-slate-900 text-white shadow-slate-300'
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            🏭 Módulo Industrial (Alimentos y Aguas)
                        </button>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-600 self-end sm:self-auto">
                        {formMode === 'clinical' ? 'Modo: Muestras de Pacientes' : 'Modo: Alimentos, Aguas y Monitoreo'}
                    </span>
                </div>

                <div className="mb-8 border-b border-slate-100 pb-6 flex justify-between items-end">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formMode === 'clinical' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-800'
                        }`}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                                {formMode === 'clinical' ? 'Ingreso de Solicitud Clínica' : 'Ingreso de Muestras (Industria / Alimentos)'}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {formMode === 'clinical' 
                                    ? 'Registro de pacientes, médicos solicitantes y pruebas clínicas.' 
                                    : 'Registro de muestras de alimentos, aguas, hisopados y control microbiológico.'}
                            </p>
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
                    {/* ENCABEZADO Y SELECTOR DE CLIENTE / PACIENTE Y SUCURSAL */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2 relative col-span-1">
                                <label className="block text-xs font-bold text-slate-600 uppercase">
                                    {formMode === 'clinical' ? 'Buscar Paciente / Historial (CRM)' : 'Buscar Empresa / Cliente (CRM)'}
                                </label>
                                <input 
                                    type="text" 
                                    placeholder={formMode === 'clinical' ? "🔍 Buscar paciente por nombre o cédula..." : "🔍 Buscar empresa o cédula jurídica..."} 
                                    value={searchClientQuery}
                                    onChange={e => {
                                        setSearchClientQuery(e.target.value);
                                        setIsClientDropdownOpen(true);
                                        if (selectedClientId !== 'NEW_CLIENT') setSelectedClientId('');
                                    }}
                                    onFocus={() => setIsClientDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsClientDropdownOpen(false), 250)}
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
                                                    
                                                    // Auto-fill clinical fields if client is a patient
                                                    if (client.type === 'Paciente (Clínico)' || client.type === 'paciente') {
                                                        const parts = (client.name || '').split(' ');
                                                        if (client.firstName) {
                                                            setPatientFirstName(client.firstName || '');
                                                            setPatientSecondName(client.secondName || '');
                                                            setPatientFirstLastName(client.firstLastName || '');
                                                            setPatientSecondLastName(client.secondLastName || '');
                                                        } else if (parts.length >= 2) {
                                                            setPatientFirstName(parts[0] || '');
                                                            setPatientFirstLastName(parts[1] || '');
                                                            if (parts.length >= 3) setPatientSecondLastName(parts[2] || '');
                                                        }
                                                        setPatientName(client.name);
                                                        setPatientDNI(client.document || '');
                                                        setPatientDOB(client.birthDate || '');
                                                        setPatientGender(client.gender || 'Masculino');
                                                        setPatientAddress(client.address || '');

                                                        // Fill phones and emails from contacts
                                                        const resultsContact = client.contacts?.find(c => c.role?.includes('Resultados') || c.department === 'Paciente') || client.contacts?.[0];
                                                        const billingContact = client.contacts?.find(c => c.role?.includes('Facturación') || c.department === 'Contabilidad');
                                                        const doctorContact = client.contacts?.find(c => c.role?.includes('Médico') || c.department?.includes('Médico'));

                                                        if (resultsContact) {
                                                            setPatientEmailResults(resultsContact.email || client.email || '');
                                                            setPatientPhoneMobile(resultsContact.phone || '');
                                                            setPatientPhoneLandline(resultsContact.phoneLandline || '');
                                                            setPatientPhoneEmergency(resultsContact.phoneEmergency || '');
                                                        } else {
                                                            setPatientEmailResults(client.email || '');
                                                        }
                                                        if (billingContact) {
                                                            setPatientEmailBilling(billingContact.email || '');
                                                        }
                                                        if (doctorContact) {
                                                            setRequesterName(doctorContact.name || '');
                                                            setDoctorEmail(doctorContact.email || '');
                                                            setDoctorPhone(doctorContact.phone || '');
                                                            setDoctorSpecialty(doctorContact.department || '');
                                                        }
                                                    } else {
                                                        // Company autofill
                                                        setCompanyLegalName(client.name || '');
                                                        setCompanyCommercialName(client.commercialName || '');
                                                        setCompanyTaxId(client.document || '');

                                                        const qualityC = client.contacts?.find(c => c.role?.includes('Calidad') || c.department?.includes('Calidad')) || client.contacts?.[0];
                                                        const billingC = client.contacts?.find(c => c.role?.includes('Facturación') || c.department?.includes('Finanzas') || c.department?.includes('Contabilidad'));
                                                        const procC = client.contacts?.find(c => c.role?.includes('Compras'));

                                                        if (qualityC) {
                                                            setQualityContactFirstName(qualityC.name || '');
                                                            setQualityContactRole(qualityC.department || 'Jefe de Calidad');
                                                            setQualityContactEmail(qualityC.email || client.email || '');
                                                            setQualityContactPhoneMobile(qualityC.phone || '');
                                                            setQualityContactPhoneOffice(qualityC.phoneOffice || '');
                                                        } else {
                                                            setQualityContactEmail(client.email || '');
                                                        }
                                                        if (billingC) {
                                                            setAccountingContactName(billingC.name || '');
                                                            setAccountingContactEmail(billingC.email || '');
                                                            setAccountingContactPhone(billingC.phone || '');
                                                        }
                                                        if (procC) {
                                                            setProcurementContactEmail(procC.email || '');
                                                        }
                                                    }
                                                }}
                                                className="px-4 py-3 hover:bg-indigo-50 text-slate-700 text-sm cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{client.name}</span>
                                                    <span className="text-[11px] text-slate-400">{client.type || 'Cliente'} {client.document ? `• ${client.document}` : ''}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div 
                                            onClick={() => {
                                                setSelectedClientId('NEW_CLIENT');
                                                setClientName('');
                                                setNewClientEmail('');
                                                setSearchClientQuery('Nuevo Registro');
                                                setIsClientDropdownOpen(false);
                                            }}
                                            className="px-4 py-3 hover:bg-slate-100 text-indigo-600 text-sm cursor-pointer italic font-bold border-t border-slate-100"
                                        >
                                            ➕ Registrar Nuevo {formMode === 'clinical' ? 'Paciente' : 'Cliente Industrial'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Selector de Sucursal / Sede */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase flex items-center justify-between">
                                    <span>🏥 Sucursal / Sede</span>
                                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                        Multi-Sede
                                    </span>
                                </label>
                                <select 
                                    value={selectedBranchId} 
                                    onChange={e => setSelectedBranchId(e.target.value)} 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-slate-800"
                                >
                                    {branchesList.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.code}) {b.isMain ? '★ Matriz' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase">Fecha de Recepción <span className="text-red-500">*</span></label>
                                <input type="datetime-local" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase">Vía Principal de Entrega</label>
                                <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-slate-800">
                                    <option value="Email">Correo Electrónico (E-Mail)</option>
                                    <option value="WhatsApp">WhatsApp / Móvil</option>
                                    <option value="Físico">Físico / Impreso en Laboratorio</option>
                                    <option value="Portal">Portal Web del Cliente</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* AVISO DE MEMORIA / AUTOCOMPLETADO INTELIGENTE */}
                    {autoFilledInfo && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between animate-fade-in text-xs font-bold text-emerald-900 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-extrabold tracking-wide">
                                    ✨ MEMORIA LIMS
                                </span>
                                <span>
                                    Datos recuperados automáticamente de <strong>{autoFilledInfo.name}</strong> ({autoFilledInfo.source} • Última actividad: {autoFilledInfo.date})
                                </span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setAutoFilledInfo(null)}
                                className="text-emerald-700 hover:text-emerald-950 underline font-semibold cursor-pointer border-0 bg-transparent"
                            >
                                Descartar aviso
                            </button>
                        </div>
                    )}

                    {/* MODO CLÍNICO: PACIENTE, CONTACTOS, CORREOS Y MÉDICO */}
                    {formMode === 'clinical' && (
                        <div className="space-y-6">
                            {/* Tarjeta 1: Identificación y Nombres Desglosados */}
                            <div className="bg-indigo-50/40 p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                                    <h3 className="font-extrabold text-indigo-950 text-base flex items-center gap-2">
                                        <span className="p-1.5 bg-indigo-600 text-white rounded-lg text-xs">👤</span>
                                        Identificación y Nombre Completo del Paciente
                                    </h3>
                                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                                        Consulta Oficial TSE / Registro Civil & Memoria
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5 md:col-span-1 relative">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Cédula / DNI / Pasaporte</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Ej. 1-1234-1234" 
                                                value={patientDNI} 
                                                onChange={e => handleDniInputChange(e.target.value)} 
                                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={handleRegistryLookup}
                                                disabled={isSearchingRegistry}
                                                title="Consultar padrón nacional TSE"
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition-colors disabled:opacity-50 border-0"
                                            >
                                                {isSearchingRegistry ? (
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Search size={13} />
                                                )}
                                                <span>TSE</span>
                                            </button>
                                        </div>

                                        {/* Dropdown flotante de coincidencias de cédula en memoria */}
                                        {dniSuggestions.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-indigo-200 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto animate-fade-in">
                                                <div className="text-[10px] font-extrabold text-indigo-700 uppercase px-2 py-1">
                                                    💡 Coincidencias en memoria LIMS:
                                                </div>
                                                {dniSuggestions.map((m, idx) => (
                                                    <div 
                                                        key={`dni-sug-${m.id}-${idx}`}
                                                        onClick={() => applyMemoryProfile(m)}
                                                        className="p-2 hover:bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-xs">{m.name}</span>
                                                            <span className="text-[10px] text-slate-500">{m.document} {m.phoneMobile ? `• 📱 ${m.phoneMobile}` : ''}</span>
                                                        </div>
                                                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                                                            ⚡ Cargar Todo
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        <div className="relative">
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Primer Nombre <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={patientFirstName} 
                                                onChange={e => handlePatientNameInputChange('fn', e.target.value)} 
                                                placeholder="Ej. Juan"
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                                            />

                                            {/* Dropdown flotante de nombres en memoria */}
                                            {nameSuggestions.length > 0 && (
                                                <div className="absolute z-50 left-0 w-80 mt-1 bg-white border border-indigo-200 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto animate-fade-in">
                                                    <div className="text-[10px] font-extrabold text-indigo-700 uppercase px-2 py-1">
                                                        💡 Pacientes en memoria:
                                                    </div>
                                                    {nameSuggestions.map((m, idx) => (
                                                        <div 
                                                            key={`name-sug-${m.id}-${idx}`}
                                                            onClick={() => applyMemoryProfile(m)}
                                                            className="p-2 hover:bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 text-xs">{m.name}</span>
                                                                <span className="text-[10px] text-slate-500">{m.document ? `Céd: ${m.document}` : ''} {m.phoneMobile ? `• 📱 ${m.phoneMobile}` : ''}</span>
                                                            </div>
                                                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                                                                ⚡ Cargar
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Segundo Nombre</label>
                                            <input 
                                                type="text" 
                                                value={patientSecondName} 
                                                onChange={e => handlePatientNameInputChange('sn', e.target.value)} 
                                                placeholder="Ej. Carlos"
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Primer Apellido <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={patientFirstLastName} 
                                                onChange={e => handlePatientNameInputChange('fln', e.target.value)} 
                                                placeholder="Ej. Pérez"
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Segundo Apellido</label>
                                            <input 
                                                type="text" 
                                                value={patientSecondLastName} 
                                                onChange={e => handlePatientNameInputChange('sln', e.target.value)} 
                                                placeholder="Ej. Gómez"
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Fecha de Nacimiento</label>
                                        <input type="date" value={patientDOB} onChange={e => setPatientDOB(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Sexo Biológico</label>
                                        <select value={patientGender} onChange={e => setPatientGender(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold">
                                            <option>Masculino</option>
                                            <option>Femenino</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Dirección de Residencia</label>
                                        <input type="text" value={patientAddress} onChange={e => setPatientAddress(e.target.value)} placeholder="Provincia, Cantón, Distrito o señas..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta 2: Teléfonos y Múltiples Correos con Enrutamiento */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Teléfonos */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <span>📞</span> Teléfonos del Paciente / Contactos
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                                📱 Celular / WhatsApp <span className="text-emerald-600 text-[10px] font-normal">(Avisos Inmediatos)</span>
                                            </label>
                                            <input 
                                                type="tel" 
                                                value={patientPhoneMobile} 
                                                onChange={e => setPatientPhoneMobile(e.target.value)} 
                                                placeholder="Ej. +506 8888-8888" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                                ☎️ Teléfono Fijo / Habitación <span className="text-slate-400 text-[10px] font-normal">(Casa / Trabajo)</span>
                                            </label>
                                            <input 
                                                type="tel" 
                                                value={patientPhoneLandline} 
                                                onChange={e => setPatientPhoneLandline(e.target.value)} 
                                                placeholder="Ej. 2222-2222" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                                🆘 Teléfono de Emergencia / Familiar
                                            </label>
                                            <input 
                                                type="tel" 
                                                value={patientPhoneEmergency} 
                                                onChange={e => setPatientPhoneEmergency(e.target.value)} 
                                                placeholder="Ej. 8999-9999 (Nombre y parentesco)" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Correos Electrónicos Especializados */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <span>📧</span> Enrutamiento de Correos Electrónicos
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-900 uppercase flex items-center gap-1">
                                                📩 Correo para Resultados / Informes <span className="text-indigo-600 text-[10px] font-normal">(Destino Técnico)</span>
                                            </label>
                                            <input 
                                                type="email" 
                                                value={patientEmailResults} 
                                                onChange={e => setPatientEmailResults(e.target.value)} 
                                                placeholder="paciente@correo.com" 
                                                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-indigo-950"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-900 uppercase flex items-center gap-1">
                                                💳 Correo de Facturación Electrónica <span className="text-emerald-600 text-[10px] font-normal">(XML / Comprobantes)</span>
                                            </label>
                                            <input 
                                                type="email" 
                                                value={patientEmailBilling} 
                                                onChange={e => setPatientEmailBilling(e.target.value)} 
                                                placeholder="facturacion@correo.com (o el mismo del paciente)" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta 3: Médico Tratante & Datos de Muestreo */}
                            <div className="bg-blue-50/40 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                                <h3 className="font-extrabold text-blue-950 text-base flex items-center gap-2 border-b border-blue-100 pb-3">
                                    <span className="p-1.5 bg-blue-600 text-white rounded-lg text-xs">🩺</span>
                                    Médico Tratante / Clínica y Datos de Muestra
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5 relative">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Médico Solicitante / Clínica <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={requesterName} 
                                            onChange={e => handleDoctorInputChange(e.target.value)} 
                                            placeholder="Dr. / Dra. Nombre Completo" 
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                        />

                                        {/* Dropdown flotante de médicos en memoria */}
                                        {doctorSuggestions.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-blue-200 rounded-xl shadow-2xl p-2 max-h-52 overflow-y-auto animate-fade-in">
                                                <div className="text-[10px] font-extrabold text-blue-700 uppercase px-2 py-1">
                                                    🩺 Médicos en memoria:
                                                </div>
                                                {doctorSuggestions.map((doc, idx) => (
                                                    <div 
                                                        key={`doc-sug-${idx}`}
                                                        onClick={() => applyDoctorProfile(doc)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-xs">{doc.name}</span>
                                                            <span className="text-[10px] text-slate-500">{doc.specialty || 'Médico'} {doc.email ? `• 📧 ${doc.email}` : ''}</span>
                                                        </div>
                                                        <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                                                            ⚡ Usar
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Especialidad / Código Médico</label>
                                        <input 
                                            type="text" 
                                            value={doctorSpecialty} 
                                            onChange={e => setDoctorSpecialty(e.target.value)} 
                                            placeholder="Ej. Medicina Interna / Cod. 1234" 
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-blue-900 uppercase">📧 Correo del Médico (Copia & Alertas)</label>
                                        <input 
                                            type="email" 
                                            value={doctorEmail} 
                                            onChange={e => setDoctorEmail(e.target.value)} 
                                            placeholder="medico@clinica.com" 
                                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">📞 Teléfono del Médico / Consultorio</label>
                                        <input 
                                            type="tel" 
                                            value={doctorPhone} 
                                            onChange={e => setDoctorPhone(e.target.value)} 
                                            placeholder="Ej. 2500-0000" 
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Fecha y Hora de Toma de Muestra <span className="text-red-500">*</span></label>
                                        <input type="datetime-local" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-semibold" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Lugar de Extracción</label>
                                        <input type="text" value={collectionLocation} onChange={e => setCollectionLocation(e.target.value)} placeholder="Ej. Laboratorio Central, Domicilio..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Diagnóstico Presuntivo / Tratamiento</label>
                                        <input type="text" value={clinicalInfo} onChange={e => setClinicalInfo(e.target.value)} placeholder="Ej. Antibioticoterapia previa, ayuno 12h..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODO INDUSTRIAL: EMPRESA, CALIDAD, FACTURACIÓN Y COTIZACIONES */}
                    {formMode === 'industrial' && (
                        <div className="space-y-6">
                            {/* Tarjeta 1: Identificación de la Empresa */}
                            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                                        <span className="p-1.5 bg-indigo-500 text-white rounded-lg text-xs">🏢</span>
                                        Datos de la Empresa / Razón Social
                                    </h3>
                                    <span className="text-xs text-indigo-300 font-semibold bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                                        Módulo Corporativo B2B & Memoria
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5 relative">
                                        <label className="block text-xs font-bold text-slate-300 uppercase">Razón Social / Empresa <span className="text-red-400">*</span></label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={companyLegalName} 
                                            onChange={e => handleCompanyInputChange('legal', e.target.value)} 
                                            placeholder="Ej. Distribuidora de Alimentos del Norte S.A." 
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-bold text-white placeholder-slate-500"
                                        />

                                        {/* Dropdown flotante de empresas en memoria */}
                                        {companySuggestions.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-indigo-500 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto animate-fade-in text-white">
                                                <div className="text-[10px] font-extrabold text-indigo-300 uppercase px-2 py-1">
                                                    🏢 Empresas en memoria LIMS:
                                                </div>
                                                {companySuggestions.map((m, idx) => (
                                                    <div 
                                                        key={`comp-sug-${m.id}-${idx}`}
                                                        onClick={() => applyMemoryProfile(m)}
                                                        className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-slate-800 last:border-0"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white text-xs">{m.name}</span>
                                                            <span className="text-[10px] text-slate-400">ID: {m.companyTaxId || m.document || 'N/A'} {m.qualityContactEmail ? `• 🧪 ${m.qualityContactEmail}` : ''}</span>
                                                        </div>
                                                        <span className="text-[10px] bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-full">
                                                            ⚡ Cargar Todo
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-300 uppercase">Nombre Comercial / Planta</label>
                                        <input 
                                            type="text" 
                                            value={companyCommercialName} 
                                            onChange={e => handleCompanyInputChange('commercial', e.target.value)} 
                                            placeholder="Ej. Planta Láctea San Isidro" 
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-semibold text-white placeholder-slate-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-300 uppercase">Cédula Jurídica / Tax ID</label>
                                        <input 
                                            type="text" 
                                            value={companyTaxId} 
                                            onChange={e => handleCompanyInputChange('taxId', e.target.value)} 
                                            placeholder="Ej. 3-101-123456" 
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-bold text-white placeholder-slate-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta 2 & 3: Calidad & Inocuidad (Técnico) vs Contabilidad & Facturación */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Departamento de Calidad & Inocuidad */}
                                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                                        <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                                            <span>🧪</span> Dpto. Calidad & Inocuidad (Destino de Informes Técnicos y COA)
                                        </h4>
                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                            Informes / Alertas
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Primer Nombre Responsable</label>
                                            <input 
                                                type="text" 
                                                value={qualityContactFirstName} 
                                                onChange={e => setQualityContactFirstName(e.target.value)} 
                                                placeholder="Ej. Laura" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Apellidos Responsable</label>
                                            <input 
                                                type="text" 
                                                value={qualityContactFirstLastName} 
                                                onChange={e => setQualityContactFirstLastName(e.target.value)} 
                                                placeholder="Ej. Gómez Chaves" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Cargo o Área</label>
                                            <input 
                                                type="text" 
                                                value={qualityContactRole} 
                                                onChange={e => setQualityContactRole(e.target.value)} 
                                                placeholder="Ej. Jefa de Aseguramiento de Calidad / Inocuidad" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-950 uppercase flex items-center gap-1">
                                                📧 Correo de Calidad (Para Reportes y Certificados COA) <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                type="email" 
                                                value={qualityContactEmail} 
                                                onChange={e => setQualityContactEmail(e.target.value)} 
                                                placeholder="calidad@empresa.com" 
                                                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-950"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase">📱 Celular / WhatsApp Calidad</label>
                                                <input 
                                                    type="tel" 
                                                    value={qualityContactPhoneMobile} 
                                                    onChange={e => setQualityContactPhoneMobile(e.target.value)} 
                                                    placeholder="Ej. 8888-0000" 
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase">☎️ Tel. Planta / Extensión</label>
                                                <input 
                                                    type="tel" 
                                                    value={qualityContactPhoneOffice} 
                                                    onChange={e => setQualityContactPhoneOffice(e.target.value)} 
                                                    placeholder="Ej. 2222-0000 Ext. 104" 
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Departamento de Contabilidad & Compras */}
                                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                                        <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                                            <span>💳</span> Dpto. Contabilidad & Facturación (Destino de Cobros y Facturas)
                                        </h4>
                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                            Facturas / XML
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Contacto de Cuentas por Pagar / Contabilidad</label>
                                            <input 
                                                type="text" 
                                                value={accountingContactName} 
                                                onChange={e => setAccountingContactName(e.target.value)} 
                                                placeholder="Ej. Lic. Carlos Morales (Tesorería)" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-amber-950 uppercase flex items-center gap-1">
                                                📧 Correo para Facturación Electrónica (XML y Comprobantes)
                                            </label>
                                            <input 
                                                type="email" 
                                                value={accountingContactEmail} 
                                                onChange={e => setAccountingContactEmail(e.target.value)} 
                                                placeholder="facturas@empresa.com / contabilidad@empresa.com" 
                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm font-bold text-amber-950"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">☎️ Teléfono Directo de Contabilidad</label>
                                            <input 
                                                type="tel" 
                                                value={accountingContactPhone} 
                                                onChange={e => setAccountingContactPhone(e.target.value)} 
                                                placeholder="Ej. 2222-0000 Ext. 201" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                                            />
                                        </div>

                                        <div className="pt-2 border-t border-amber-200">
                                            <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                                                📑 Correo de Compras / Cotizaciones <span className="text-slate-400 text-[10px] font-normal">(Para propuestas comerciales)</span>
                                            </label>
                                            <input 
                                                type="email" 
                                                value={procurementContactEmail} 
                                                onChange={e => setProcurementContactEmail(e.target.value)} 
                                                placeholder="compras@empresa.com / adquisiciones@empresa.com" 
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta 4: Condiciones de Muestreo / Recepción */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase">🌡️ Temperatura de Recepción de Muestras (°C)</label>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        value={receptionTemp} 
                                        onChange={e => setReceptionTemp(e.target.value)} 
                                        placeholder="Ej. 4.2" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase">📦 Responsable de Muestreo / Muestreador</label>
                                    <input 
                                        type="text" 
                                        value={samplerName} 
                                        onChange={e => setSamplerName(e.target.value)} 
                                        placeholder="Ej. Muestreador Oficial LIMS / Personal de Planta" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TARJETA DINÁMICA DE ENRUTAMIENTO DE INFORMACIÓN */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                ⚡ Enrutamiento Inteligente de Información del Laboratorio
                            </span>
                            <span className="text-[11px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                                Despacho Automático
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                <div className="font-bold text-emerald-400 flex items-center gap-1">📊 Informes Técnicos & COA</div>
                                <div className="text-slate-300 mt-1 truncate">
                                    ➡️ {formMode === 'clinical' 
                                        ? (patientEmailResults || 'Email del Paciente') 
                                        : (qualityContactEmail || 'Email Dpto. Calidad')}
                                </div>
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                <div className="font-bold text-amber-400 flex items-center gap-1">💳 Facturación & Cobros</div>
                                <div className="text-slate-300 mt-1 truncate">
                                    ➡️ {formMode === 'clinical' 
                                        ? (patientEmailBilling || patientEmailResults || 'Email Facturación') 
                                        : (accountingContactEmail || 'Email Contabilidad')}
                                </div>
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                <div className="font-bold text-sky-400 flex items-center gap-1">💬 Notificaciones WhatsApp / SMS</div>
                                <div className="text-slate-300 mt-1 truncate">
                                    ➡️ {formMode === 'clinical' 
                                        ? (patientPhoneMobile || 'Móvil Paciente') 
                                        : (qualityContactPhoneMobile || 'Móvil Planta')}
                                </div>
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                <div className="font-bold text-rose-400 flex items-center gap-1">🚨 Alertas Críticas / No Conformidad</div>
                                <div className="text-slate-300 mt-1 truncate">
                                    ➡️ {formMode === 'clinical' 
                                        ? (doctorEmail || 'Médico Tratante') 
                                        : (qualityContactEmail || 'Jefe de Calidad')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Datalist con opciones específicas de muestra */}
                    <datalist id="sample-type-options">
                        {activeSampleTypeSuggestions.map(st => (
                            <option key={st} value={st} />
                        ))}
                    </datalist>

                    {/* TABLA DE MUESTRAS */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">
                                {formMode === 'clinical' ? 'Muestras Biológicas y Exámenes Solicitados' : 'Muestras Industriales / Aguas / Alimentos'}
                            </h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{samples.length} / 20</span>
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className={formMode === 'clinical' ? 'bg-indigo-900 text-white' : 'bg-slate-800 text-white'}>
                                    <tr>
                                        <th className="p-3 w-10 text-center font-bold">#</th>
                                        <th className="p-3 font-bold">
                                            {formMode === 'clinical' ? 'TIPO DE MUESTRA BIOLÓGICA' : 'PRODUCTO / MUESTRA INDUSTRIAL'} <span className="text-red-400">*</span>
                                        </th>
                                        {formMode !== 'clinical' && <th className="p-3 font-bold w-32">LOTE (S)</th>}
                                        {formMode !== 'clinical' && <th className="p-3 font-bold w-32">OTROS / CONDICIONES</th>}
                                        <th className="p-3 font-bold w-72">
                                            {formMode === 'clinical' ? 'PRUEBA CLÍNICA' : 'ANÁLISIS MICROBIOLÓGICO / FQ'}
                                        </th>
                                        <th className="p-3 font-bold w-56">MÉTODO / TÉCNICA</th>
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
                                                    list="sample-type-options"
                                                    placeholder={formMode === 'clinical' ? 'Ej. Sangre Total, Suero, Orina...' : 'Ej. Carne Molida, Leche, Agua Potable...'}
                                                    value={sample.description}
                                                    onChange={(e) => updateSample(sample.id, 'description', e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                                />
                                            </td>
                                            {formMode !== 'clinical' && (
                                                <td className="p-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Lote..."
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
                                                        placeholder="Temp, condiciones..."
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
                                                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 max-w-[280px]"
                                                >
                                                    {Object.entries(activeGroupedAnalysis).map(([category, items]) => (
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
                                                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-indigo-950 bg-indigo-50/70 max-w-[280px]"
                                                    title="Seleccione el método analítico / criterio microbiológico"
                                                >
                                                    {Object.entries(activeGroupedMethods).map(([category, items]) => (
                                                        <optgroup key={category} label={category}>
                                                            {items.map(mc => (
                                                                <option key={mc.code} value={mc.code}>{mc.code} - {mc.name}</option>
                                                            ))}
                                                        </optgroup>
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
                                <PlusCircle size={16} /> Añadir {formMode === 'clinical' ? 'Prueba / Muestra' : 'Muestra Industrial'}
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2">
                            <CheckCircle size={20} />
                            {isSubmitting ? 'Procesando Lote...' : `Registrar Solicitud ${formMode === 'clinical' ? 'Clínica' : 'Industrial'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
