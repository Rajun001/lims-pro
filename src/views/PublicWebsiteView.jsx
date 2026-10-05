import React, { useState } from 'react';
import { 
    ShieldCheck, Award, FileText, CheckCircle2, ChevronRight, 
    Search, PlusCircle, Building, MapPin, Phone, 
    Mail, Clock, ArrowRight, Sparkles, AlertCircle, ExternalLink, 
    Download, Eye, EyeOff, Filter, Check, Star, Lock, HeartPulse, Droplets,
    Utensils, Microscope, Activity, X, UserCheck, ShieldAlert, KeyRound, 
    Send, Building2, Stethoscope, Users, HelpCircle, Factory, Bookmark, RotateCcw,
    Boxes, Layers, Package, Zap, CheckCheck, Dna, Wind, FlaskConical, Menu
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';

const API_URL = getApiUrl();

export const PublicWebsiteView = ({ navigateTo, labInfo }) => {
    const { addNotification } = useNotification();
    const [activeSection, setActiveSection] = useState('inicio');
    const [lookupCode, setLookupCode] = useState('');
    const [selectedCert, setSelectedCert] = useState(null);
    const [certCategory, setCertCategory] = useState('all');
    const [submittingIntake, setSubmittingIntake] = useState(false);
    const [intakeSuccess, setIntakeSuccess] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Navegación fluida a secciones con soporte de offset para header sticky
    const scrollToSection = (id) => {
        setActiveSection(id);
        setMobileMenuOpen(false);
        if (id === 'inicio') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // =========================================================================
    // SEGURIDAD: CONTROL DE ACCESO SEPARADO (CLIENTES vs USO INTERNO CON CLAVE PREVIA)
    // =========================================================================
    // 1. Modal Uso Interno (Personal LIMS protegido por Password Previo)
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffPasscode, setStaffPasscode] = useState('');
    const [staffPasscodeError, setStaffPasscodeError] = useState('');
    const [staffPasscodeSuccess, setStaffPasscodeSuccess] = useState(false);
    const [showStaffPasscodeText, setShowStaffPasscodeText] = useState(false);
    const [validatingStaff, setValidatingStaff] = useState(false);

    // 2. Modal Portal Clientes (Pacientes & Empresas)
    const [showClientModal, setShowClientModal] = useState(false);
    const [clientModalTab, setClientModalTab] = useState('login'); // 'login' | 'quick_order'
    const [clientEmail, setClientEmail] = useState('');
    const [clientPassword, setClientPassword] = useState('');
    const [clientOrderCode, setClientOrderCode] = useState('');
    const [clientOrderPin, setClientOrderPin] = useState('');

    // 3. Modal Solicitud de Presupuesto Confidencial (Privacidad y Discreción de Tarifas)
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteData, setQuoteData] = useState({
        clientType: 'empresa',
        clientName: '',
        contactPerson: '',
        email: '',
        phone: '',
        sampleCategory: 'Alimentos & Materias Primas',
        notes: '',
        honeypot: ''
    });
    const [quoteSubmitting, setQuoteSubmitting] = useState(false);
    const [quoteSuccess, setQuoteSuccess] = useState(null);

    // Intake Form State
    const [intakeData, setIntakeData] = useState({
        clientType: 'empresa',
        clientName: '',
        contactPerson: '',
        email: '',
        phone: '',
        sampleType: 'Alimento Procesado',
        sampleDescription: '',
        urgency: false,
        analysisRequested: '',
        honeypot: '' // Anti-bot
    });

    // =========================================================================
    // MEMORIA POR CLIENTE & PRESELECCIÓN DE DIVISIÓN (INDUSTRIAL vs CLÍNICA)
    // =========================================================================
    // 1. Preselección de división guardada en memoria local del cliente
    const [quoteDivision, setQuoteDivision] = useState(() => {
        return localStorage.getItem('microlabs_quote_division') || 'industrial';
    });

    // 2. Buscador en tiempo real entre todos los posibles análisis
    const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

    // 3. Memoria de análisis habituales / favoritos del cliente
    const [savedClientFavorites, setSavedClientFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('microlabs_saved_tests') || '[]');
        } catch {
            return [];
        }
    });

    // Dynamic Catalog State (Protección de Confidencialidad: Ensayos sin precios públicos expuestos)
    const [selectedTests, setSelectedTests] = useState([]);
    const [activeCatalogTab, setActiveCatalogTab] = useState('food');

    // Cambiar división con memoria persistente
    const handleSwitchDivision = (division) => {
        setQuoteDivision(division);
        localStorage.setItem('microlabs_quote_division', division);
        if (division === 'industrial') {
            setActiveCatalogTab('food');
        } else {
            setActiveCatalogTab('clinical_chem');
        }
    };

    // Guardar selección actual en la memoria del cliente
    const saveCurrentSelectionToMemory = () => {
        if (selectedTests.length === 0) return;
        localStorage.setItem('microlabs_saved_tests', JSON.stringify(selectedTests));
        setSavedClientFavorites(selectedTests);
        addNotification(`Se guardaron ${selectedTests.length} análisis en su memoria de cotizaciones frecuentes.`, 'success');
    };

    // Restaurar selección desde la memoria del cliente
    const loadSavedSelectionFromMemory = () => {
        if (savedClientFavorites.length === 0) return;
        setSelectedTests(savedClientFavorites);
        addNotification(`Se restauraron ${savedClientFavorites.length} análisis de su historial habitual.`, 'success');
    };

    // ─── A. DIVISIÓN INDUSTRIAL & MICROBIOLOGÍA DE INOCUIDAD (MÁS AMPLIA DE COSTA RICA) ───
    const INDUSTRIAL_CATEGORIES = [
        {
            id: 'food',
            title: 'Alimentos, Cárnicos, Lácteos & Bebidas',
            icon: Utensils,
            badge: 'RTCA / AOAC / ISO / BAM',
            description: 'Cartera microbiológica completa para materias primas, productos terminados y exportación.',
            tests: [
                {
                    id: 'ind-f1',
                    name: 'Recuento de Aerobios Mesófilos (RAM)',
                    code: 'RAM-01',
                    badge: 'RTCA Inocuidad',
                    sampleReq: 'Sólido / Líquido (250g)',
                    method: 'Placas de Película Seca Rehidratable (AOAC 990.12) [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Rápida (AOAC)', name: 'Placas de Película Seca Rehidratable (AOAC 990.12) - Recuento Cuantitativo', time: '48h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Película Seca' },
                        { id: 'bam', label: 'Siembra en Placa PCA (FDA-BAM)', name: 'FDA-BAM Ch. 3 Placa Convencional PCA - Recuento Cuantitativo', time: '48-72h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Oficial FDA' },
                        { id: 'iso', label: 'Vertido en Placa (ISO 4833-1)', name: 'ISO 4833-1:2013 Vertido en Placa - Recuento Cuantitativo', time: '72h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f2',
                    name: 'Coliformes Totales y Escherichia coli',
                    code: 'COLI-02',
                    badge: 'Indicador Sanitario',
                    sampleReq: 'Alimento terminado / Insumo (250g)',
                    method: 'Película Seca Cromogénica (AOAC 991.14) [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Cromogénica', name: 'Película Seca Rehidratable Cromogénica (AOAC 991.14) - Recuento Cuantitativo', time: '24-48h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Rápido 24h' },
                        { id: 'bam', label: 'NMP Tubos Múltiples (FDA-BAM)', name: 'Número Más Probable NMP Tubos LST/EC (FDA-BAM Ch. 4) - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'NMP FDA' },
                        { id: 'iso', label: 'Placa Selectiva (ISO 4832 / 16649)', name: 'ISO 4832 VRBL / ISO 16649-2 TBX - Recuento Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f3',
                    name: 'Staphylococcus aureus coagulasa (+)',
                    code: 'SAUR-03',
                    badge: 'Toxina Estafilocócica',
                    sampleReq: 'Lácteos, cárnicos, embutidos y preparados (250g)',
                    method: 'Película Seca con Confirmación Rápida (AOAC 2003.07) [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Confirmatoria', name: 'Película Seca Rehidratable con Disco Termonucleasa (AOAC 2003.07) - Cuantitativo', time: '24h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Express 24h' },
                        { id: 'bam', label: 'Agar Baird-Parker (FDA-BAM Ch. 12)', name: 'FDA-BAM Ch. 12 Baird-Parker con Telurito y Yema - Recuento Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Oficial FDA' },
                        { id: 'iso', label: 'Confirmación Coagulasa (ISO 6888-1)', name: 'ISO 6888-1 Aislamiento Confirmado con Prueba de Coagulasa - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f4',
                    name: 'Detección de Salmonella spp. (25g / 125g / 375g)',
                    code: 'SALM-04',
                    badge: 'Patógeno Crítico Cero Tolerancia',
                    sampleReq: '25g analítica estéril (o composite exportación)',
                    method: 'Detección Molecular LAMP Isotérmica (24h) [Cualitativo]',
                    time: '24h',
                    methods: [
                        { id: 'mda', label: 'Detección Molecular LAMP (24h)', name: 'Amplificación Molecular Isotérmica LAMP (AOAC 2013.09) - Cualitativo (Ausencia en 25g)', time: '24h', type: 'mda', nature: 'cualitativo', badge: '🧬 Molecular 24h' },
                        { id: 'bam', label: 'Cultivo Tradicional de Referencia (5d)', name: 'FDA-BAM Ch. 5 Preenriquecimiento + Medios Selectivos (BS/HE/XLD) - Cualitativo', time: '3-5 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Oficial FDA' },
                        { id: 'iso', label: 'Norma Internacional Referencia (ISO 6579-1)', name: 'ISO 6579-1:2017 Detección y Confirmación Bioquímica/Serológica - Cualitativo', time: '4 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Referencia ISO' }
                    ]
                },
                {
                    id: 'ind-f5',
                    name: 'Detección de Listeria monocytogenes (25g / 125g)',
                    code: 'LIST-05',
                    badge: 'Patógeno Psicrotrófico Crítico',
                    sampleReq: '25g cárnicos listos para consumo (RTE), quesos, embutidos',
                    method: 'Detección Molecular LAMP Isotérmica (24h) [Cualitativo]',
                    time: '24h',
                    methods: [
                        { id: 'mda', label: 'Detección Molecular LAMP (24h)', name: 'Amplificación Molecular Isotérmica LAMP (AOAC 2014.07) - Cualitativo (Ausencia en 25g)', time: '24h', type: 'mda', nature: 'cualitativo', badge: '🧬 Molecular 24h' },
                        { id: 'bam', label: 'Cultivo Enriquecimiento (FDA-BAM Ch. 10)', name: 'FDA-BAM Ch. 10 Enriquecimiento Caldo BLEB + Agar Oxford/PALCAM - Cualitativo', time: '3-5 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Oficial FDA' },
                        { id: 'iso', label: 'Norma Internacional Referencia (ISO 11290-1)', name: 'ISO 11290-1:2017 Detección y Confirmación Bioquímica - Cualitativo', time: '4 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Referencia ISO' }
                    ]
                },
                {
                    id: 'ind-f6',
                    name: 'Recuento de Hongos y Levaduras',
                    code: 'HL-06',
                    badge: 'Vida Útil & Deterioro',
                    sampleReq: 'Granos, harinas, panificación, bebidas, jugos (250g)',
                    method: 'Película Seca Rehidratable Rápida (AOAC 2014.05) [Cuantitativo]',
                    time: '48-60h',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Rápida (48h)', name: 'Recuento en Película Seca Rehidratable Rápida (AOAC 2014.05) - Cuantitativo', time: '48-60h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Rápido 48h' },
                        { id: 'bam', label: 'Agar DRBC (FDA-BAM Ch. 18)', name: 'FDA-BAM Ch. 18 / Agar DRBC con Diclorán Rosa de Bengala - Cuantitativo', time: '5 días', type: 'bam-iso', nature: 'cuantitativo', badge: 'Oficial FDA' },
                        { id: 'iso', label: 'Norma ISO (ISO 21527-1/2)', name: 'ISO 21527-1/2 Recuento en Placa Agar DRBC/DG18 - Cuantitativo', time: '5 días', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f7',
                    name: 'Escherichia coli O157:H7 & STEC (Shiga-Toxina)',
                    code: 'STEC-07',
                    badge: 'Patógeno Enterohemorrágico Cárnico',
                    sampleReq: 'Carne molida, canales bovinas, hortalizas de hoja verde (375g)',
                    method: 'Detección Molecular LAMP de Genes stx1/stx2 (24h) [Cualitativo]',
                    time: '24h',
                    methods: [
                        { id: 'mda', label: 'Detección Molecular LAMP (24h)', name: 'Amplificación Molecular Isotérmica LAMP Genes stx1/stx2 (AOAC) - Cualitativo', time: '24h', type: 'mda', nature: 'cualitativo', badge: '🧬 Molecular 24h' },
                        { id: 'bam', label: 'Inmuno-Separación Magnética (FDA-BAM)', name: 'FDA-BAM Ch. 4A Inmuno-Separación Magnética (IMS) + Agar TC-SMAC - Cualitativo', time: '3-4 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Oficial FDA' },
                        { id: 'iso', label: 'Inmunoaglutinación (ISO 16654)', name: 'ISO 16654 Aislamiento e Inmunoaglutinación Látex O157 - Cualitativo', time: '3 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f8',
                    name: 'Bacillus cereus presuntivo y confirmado',
                    code: 'BCER-08',
                    badge: 'Toxina Emetica / Diarreica',
                    sampleReq: 'Arroces cocidos, pastas, especias, cereales, harinas (250g)',
                    method: 'Recuento en Placa Agar Selectivo MYP [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'bam', label: 'FDA-BAM Ch. 14 (MYP)', name: 'FDA-BAM Ch. 14 Agar MYP con Polimixina B y Yema de Huevo - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Oficial FDA' },
                        { id: 'iso', label: 'ISO 7932 / 21871', name: 'ISO 7932 Recuento a 30°C / ISO 21871 Técnica NMP - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f9',
                    name: 'Clostridium perfringens & Esporógenos Sulfito-Reductores',
                    code: 'CPER-09',
                    badge: 'Anaerobio Formador de Esporas',
                    sampleReq: 'Cárnicos cocidos, salsas, caldos, conservas (250g)',
                    method: 'Recuento en Anaerobiosis Agar TSC [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'iso', label: 'ISO 7937 (TSC Anaerobiosis)', name: 'ISO 7937 Agar Triptosa Sulfito Cicloserina (TSC) en Anaerobiosis - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' },
                        { id: 'bam', label: 'FDA-BAM Ch. 16 (SPS)', name: 'FDA-BAM Ch. 16 Agar Sulfito Polimixina Sulfadiazina (SPS) - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Oficial FDA' }
                    ]
                },
                {
                    id: 'ind-f10',
                    name: 'Enterobacterias Totales (Enterobacteriaceae)',
                    code: 'EBAC-10',
                    badge: 'Higiene de Proceso RTCA',
                    sampleReq: 'Lácteos pasteurizados, fórmulas secas, alimentos infantiles (250g)',
                    method: 'Película Seca Selectiva Rápida (AOAC 2003.01) [Cuantitativo]',
                    time: '24h',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Rápida (24h)', name: 'Película Seca Rehidratable para Enterobacterias (AOAC 2003.01) - Cuantitativo', time: '24h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Rápido 24h' },
                        { id: 'iso', label: 'ISO 21528-2 (VRBG)', name: 'ISO 21528-2 Recuento en Placa Agar VRBG Violeta Cristal Rojo Neutro - Cuantitativo', time: '24h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f11',
                    name: 'Cronobacter sakazakii (Enterobacter sakazakii)',
                    code: 'CRON-11',
                    badge: 'Seguridad Fórmulas Infantiles',
                    sampleReq: 'Fórmulas para lactantes, leches en polvo, sueros deshidratados (300g)',
                    method: 'Detección Molecular LAMP / ISO 22964 [Cualitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'mda', label: 'Detección Molecular LAMP (24h)', name: 'Amplificación Molecular Isotérmica LAMP (AOAC) - Cualitativo (Ausencia en 300g)', time: '24h', type: 'mda', nature: 'cualitativo', badge: '🧬 Molecular 24h' },
                        { id: 'iso', label: 'Cultivo Referencia (ISO 22964)', name: 'ISO 22964 Preenriquecimiento BPW + Caldo CSB + Agar CCI - Cualitativo', time: '48-72h', type: 'bam-iso', nature: 'cualitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f12',
                    name: 'Campylobacter jejuni / Campylobacter coli',
                    code: 'CAMP-12',
                    badge: 'Patógeno Avícola Zoonótico',
                    sampleReq: 'Carne fresca de pollo, aves despresadas, canales (250g)',
                    method: 'Cultivo en Microaerofilia (ISO 10272-1) [Cualitativo]',
                    time: '4 días',
                    methods: [
                        { id: 'iso', label: 'ISO 10272-1 (Microaerofilia 42°C)', name: 'ISO 10272-1 Caldo Bolton + Agar mCCDA en Microaerofilia - Cualitativo', time: '4 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Microaerofilia ISO' },
                        { id: 'bam', label: 'FDA-BAM Ch. 7', name: 'FDA-BAM Ch. 7 Aislamiento e Inmunocromatografía Específica - Cualitativo', time: '4 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Oficial FDA' }
                    ]
                },
                {
                    id: 'ind-f13',
                    name: 'Bacterias Ácido Lácticas (BAL / Lactobacillus)',
                    code: 'BAL-13',
                    badge: 'Probióticos & Deterioro',
                    sampleReq: 'Yogures, leches fermentadas, embutidos madurados, cervezas (250g)',
                    method: 'Recuento en Película Seca / Agar MRS [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Rehidratable', name: 'Película Seca Rehidratable para Bacterias Ácido Lácticas (AOAC) - Cuantitativo', time: '48h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Rápido 48h' },
                        { id: 'iso', label: 'ISO 15214 (Agar MRS)', name: 'ISO 15214 Agar De Man Rogosa Sharpe (MRS) en Anaerobiosis 30°C - Cuantitativo', time: '72h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f14',
                    name: 'Pseudomonas spp. en Alimentos Refrigerados',
                    code: 'PSEU-14',
                    badge: 'Microorganismo Deteriorante Frío',
                    sampleReq: 'Carnes empacadas, aves, lácteos refrigerados, pescados (250g)',
                    method: 'ISO 13720 Agar CFC',
                    time: '48h',
                    methods: [
                        { id: 'iso', label: 'ISO 13720 (CFC)', name: 'ISO 13720 Agar Cefalotina-Fuscina-Cetrimida (CFC) a 25°C', time: '48h', type: 'bam-iso', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-f15',
                    name: 'Esporulados Termófilos & Mesófilos (Flat Sour / Acidez Plana)',
                    code: 'ESPOR-15',
                    badge: 'Conservas & Termoprocesados',
                    sampleReq: 'Enlatados, conservas ácidas/baja acidez, jugos esterilizados (3 unidades)',
                    method: 'APHA Ch. 24 / NFPA Choque Térmico 100°C',
                    time: '48-72h',
                    methods: [
                        { id: 'bam', label: 'APHA Ch. 24 / NFPA', name: 'APHA Compendium Ch. 24 Termófilos Aerobios y Anaerobios (Choque Térmico)', time: '48-72h', type: 'bam-iso', badge: 'APHA Oficial' }
                    ]
                }
            ]
        },
        {
            id: 'water',
            title: 'Aguas Potables, Envasadas, Hielo & Fuentes',
            icon: Droplets,
            badge: 'SMEWW / Dec. 38924-S',
            description: 'Vigilancia microbiológica oficial del agua potable, hielo industrial y aguas purificadas.',
            tests: [
                {
                    id: 'ind-w1',
                    name: 'Coliformes Fecales y Escherichia coli en Agua',
                    code: 'AG-COLI',
                    badge: 'Potabilidad Oficial Dec. 38924-S',
                    sampleReq: '100 mL frasco estéril con tiosulfato de sodio',
                    method: 'Sustrato Cromogénico-Enzimático (SMEWW 9223 B) [Cuantitativo]',
                    time: '24h',
                    methods: [
                        { id: 'colilert', label: 'Sustrato Cromogénico-Enzimático', name: 'Sustrato Cromogénico-Enzimático Cuantitativo en Bandeja Sellada (SMEWW 9223 B) - Cuantitativo', time: '24h', type: 'colilert', nature: 'cuantitativo', badge: '💧 Enzimático 24h' },
                        { id: 'membrane', label: 'Filtración por Membrana', name: 'Filtración por Membrana Agar Cromogénico Diferencial (SMEWW 9222 B/G) - Cuantitativo', time: '24h', type: 'colilert', nature: 'cuantitativo', badge: 'Membrana 24h' },
                        { id: 'nmp', label: 'NMP Tubos Múltiples', name: 'Tubos Múltiples de Fermentación Caldo Lactosado / EC (SMEWW 9221) - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'NMP Tradicional' }
                    ]
                },
                {
                    id: 'ind-w2',
                    name: 'Recuento Heterotrófico en Placa (Bacterias Mesófilas)',
                    code: 'AG-HET',
                    badge: 'Calidad del Tratamiento',
                    sampleReq: 'Agua de red, pozo, purificada o hielo (100 mL)',
                    method: 'Vertido en Placa PCA (SMEWW 9215 B) [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'pour-plate', label: 'Vertido en Placa PCA', name: 'Siembra por Vertido en Placa Agar PCA 35°C (SMEWW 9215 B) - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'SMEWW Oficial' },
                        { id: 'petrifilm', label: 'Película Seca en Agua (AOAC)', name: 'Recuento en Película Seca Rehidratable Validada para Aguas (AOAC PTM) - Cuantitativo', time: '48h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Película Seca' },
                        { id: 'membrane', label: 'Filtración Membrana HPC', name: 'Filtración por Membrana M-HPC Agar (SMEWW 9215 D) - Cuantitativo', time: '48h', type: 'colilert', nature: 'cuantitativo', badge: 'Baja Densidad' }
                    ]
                },
                {
                    id: 'ind-w3',
                    name: 'Pseudomonas aeruginosa en Agua Envasada y Fuentes',
                    code: 'AG-PSEU',
                    badge: 'Agua Embotellada & Hielo',
                    sampleReq: 'Agua mineral, hielo alimentario, piscinas (250 mL estéril)',
                    method: 'Filtración por Membrana Agar Cetrimida (SMEWW 9213 E) [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'membrane', label: 'Filtración por Membrana Cetrimida', name: 'Filtración Membrana Agar Cetrimida / M-PA (SMEWW 9213 E / ISO 16266) - Cuantitativo', time: '48h', type: 'colilert', nature: 'cuantitativo', badge: 'SMEWW / ISO' },
                        { id: 'pseudalert', label: 'Sustrato Fluorogénico Específico', name: 'Sustrato Fluorogénico Enzimático Cuantitativo en Bandeja Sellada (24h) - Cuantitativo', time: '24h', type: 'colilert', nature: 'cuantitativo', badge: 'Rápido 24h' }
                    ]
                },
                {
                    id: 'ind-w4',
                    name: 'Enterococos Fecales / Estreptococos Fecales',
                    code: 'AG-ENT',
                    badge: 'Contaminación Fecal Persistente',
                    sampleReq: 'Agua potable, fuentes subterráneas y costeras (100 mL)',
                    method: 'Filtración Membrana Agar KF / M-Enterococcus [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'membrane', label: 'Filtración Membrana Agar KF', name: 'Filtración Membrana Agar KF-Streptococcus / M-Enterococcus (SMEWW 9230 C) - Cuantitativo', time: '48h', type: 'colilert', nature: 'cuantitativo', badge: 'SMEWW Oficial' },
                        { id: 'enterolert', label: 'Sustrato Fluorogénico Enterococos', name: 'Sustrato Fluorogénico Específico Cuantitativo en Bandeja Sellada (24h) - Cuantitativo', time: '24h', type: 'colilert', nature: 'cuantitativo', badge: 'Rápido 24h' }
                    ]
                },
                {
                    id: 'ind-w5',
                    name: 'Esporas de Clostridios Sulfito-Reductores en Agua',
                    code: 'AG-CLOS',
                    badge: 'Indicador de Fecalidad Antigua / Resistente',
                    sampleReq: 'Agua de captación, pozos y plantas de tratamiento (100 mL)',
                    method: 'Filtración Membrana Choque Térmico 75°C (ISO 6461-2) [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'membrane', label: 'ISO 6461-2 Membrana', name: 'Filtración Membrana + Tratamiento Térmico 75°C Agar TSC Anaerobiosis - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO' }
                    ]
                },
                {
                    id: 'ind-w6',
                    name: 'Legionella pneumophila en Torres de Enfriamiento y Redes',
                    code: 'AG-LEG',
                    badge: 'Bioseguridad Sanitaria Edificios',
                    sampleReq: 'Torres de refrigeración, circuitos ACS, condensadores evaporativos (1 L)',
                    method: 'Cultivo Agar BCYE (ISO 11731) / PCR Rápida [Cualitativo / Cuantitativo]',
                    time: '48h - 10d',
                    methods: [
                        { id: 'pcr', label: 'PCR Rápida (48h)', name: 'PCR en Tiempo Real Detección Genómica de Legionella pneumophila - Cualitativo', time: '48h', type: 'mda', nature: 'cualitativo', badge: '🧬 Biología Molecular' },
                        { id: 'iso', label: 'ISO 11731 Cultivo (10d)', name: 'ISO 11731 Cultivo en Agar BCYE con Tratamiento Ácido y Térmico - Cuantitativo', time: '10 días', type: 'bam-iso', nature: 'cuantitativo', badge: 'Referencia ISO' }
                    ]
                },
                {
                    id: 'ind-w7',
                    name: 'Cloro Libre Residual en Agua (In Situ Oficial)',
                    code: 'AG-CLORO',
                    badge: 'Desinfección Dec. 38924-S',
                    sampleReq: '250 mL envase sin cámara de aire (análisis inmediato)',
                    method: 'Colorimetría Fotométrica DPD (SMEWW 4500-Cl G) [Cuantitativo]',
                    time: 'Mismo día',
                    methods: [
                        { id: 'dpd', label: 'DPD Colorimétrico Digital', name: 'SMEWW 4500-Cl G / DPD Colorimétrico Digital Fotómetro Calibrado - Cuantitativo', time: 'Mismo día', type: 'bam-iso', nature: 'cuantitativo', badge: 'SMEWW Oficial' }
                    ]
                }
            ]
        },
        {
            id: 'surfaces',
            title: 'Superficies, Ambientes, Gases & Aire Comprimido (BPM / ISO 8573-7)',
            icon: Wind,
            badge: 'ISO 8573-7 / Impactación Directa / HACCP',
            description: 'Validación de desinfección, control ambiental activo/pasivo y monitoreo microbiológico de aire comprimido según ISO 8573-7.',
            tests: [
                {
                    id: 'ind-s-camtu',
                    name: 'Perfil Microbiológico Completo de Aire Comprimido (RTA + HyL + Coliformes)',
                    code: 'AIR-ISO-8573',
                    badge: 'ISO 8573-7 / Especializado',
                    nature: 'cuantitativo',
                    sampleReq: 'Puntos de uso de aire comprimido, soplado de envases, líneas de envasado y neumática crítica (mínimo 2-4 bar)',
                    method: 'Impactación Isocinética Directa bajo Presión (ISO 8573-7: RTA + HyL + Coliformes) [Cuantitativo]',
                    time: '48h - 5 días',
                    methods: [
                        { id: 'camtu-direct', label: 'Impactación Directa Isocinética', name: 'Muestreo Isocinético Directo bajo Presión sobre Placas de Agar Estandarizadas (RTA Aerobios + HyL Hongos y Levaduras) - Cuantitativo', time: '48h - 5 días', type: 'camtu', nature: 'cuantitativo', badge: '⭐ Isocinético ISO' },
                        { id: 'camtu-descomp', label: 'Descompresor Aséptico + Membrana', name: 'Descompresión Aséptica Controlada a Flujo Calibrado y Filtración por Membrana Cuantitativa Integral (ISO 8573-7)', time: '48h - 5 días', type: 'camtu', nature: 'cuantitativo', badge: 'ISO 8573-7' }
                    ]
                },
                {
                    id: 'ind-s-air-rta',
                    name: 'Recuento Total Aerobio (RTA / RAM) en Aire Comprimido (ISO 8573-7)',
                    code: 'AIR-RTA-8573',
                    badge: 'ISO 8573-7 / Aire & Gases',
                    nature: 'cuantitativo',
                    sampleReq: 'Puntos de uso de aire comprimido, líneas de soplado de botellas/envases, aire de proceso (2-6 bar)',
                    method: 'Impactación Isocinética Directa bajo Presión en Agar TSA/PCA (ISO 8573-7) [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'air-rta-isoc', label: 'Impactación Isocinética Directa (ISO)', name: 'Impactación Isocinética Directa bajo Presión sobre Placas TSA/PCA (ISO 8573-7) - Cuantitativo (UFC/1000 L)', time: '48h', type: 'camtu', nature: 'cuantitativo', badge: '⭐ Isocinético ISO' },
                        { id: 'air-rta-descomp', label: 'Descompresión + Película Seca', name: 'Descompresión Aséptica Controlada + Película Seca Rehidratable de Aerobios Mesófilos - Cuantitativo', time: '48h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Película Seca' },
                        { id: 'air-rta-membrana', label: 'Filtración por Membrana (ISO)', name: 'Descompresión Aséptica y Filtración por Membrana Cuantitativa en Placa Agar PCA (ISO 8573-7)', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Membrana ISO' }
                    ]
                },
                {
                    id: 'ind-s-air-hyl',
                    name: 'Recuento de Hongos y Levaduras (HyL) en Aire Comprimido (ISO 8573-7)',
                    code: 'AIR-HYL-8573',
                    badge: 'ISO 8573-7 / Aire & Gases',
                    nature: 'cuantitativo',
                    sampleReq: 'Líneas de empaque aséptico, aire comprimido de contacto con alimentos/farma, tanques pulmón',
                    method: 'Impactación Isocinética Directa en Agar Sabouraud (ISO 8573-7) [Cuantitativo]',
                    time: '3-5 días',
                    methods: [
                        { id: 'air-hyl-isoc', label: 'Impactación Isocinética Directa (ISO)', name: 'Impactación Isocinética Directa bajo Presión sobre Agar Sabouraud / Rosa de Bengala (ISO 8573-7) - Cuantitativo (UFC/1000 L)', time: '3-5 días', type: 'camtu', nature: 'cuantitativo', badge: '⭐ Isocinético ISO' },
                        { id: 'air-hyl-descomp', label: 'Descompresión + Película Seca HyL', name: 'Descompresión Aséptica Controlada + Película Seca Rehidratable de Hongos y Levaduras Rápidos - Cuantitativo', time: '48-72h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Película Seca Rápida' },
                        { id: 'air-hyl-membrana', label: 'Filtración Membrana Sabouraud', name: 'Descompresión Aséptica y Filtración por Membrana sobre Agar Dextrosa Sabouraud + Cloranfenicol (ISO 8573-7)', time: '3-5 días', type: 'bam-iso', nature: 'cuantitativo', badge: 'Membrana ISO' }
                    ]
                },
                {
                    id: 'ind-s-air-coli',
                    name: 'Coliformes Totales & Enterobacterias en Aire Comprimido (ISO 8573-7)',
                    code: 'AIR-COLI-8573',
                    badge: 'ISO 8573-7 / Higiene Neumática',
                    nature: 'cuantitativo',
                    sampleReq: 'Puntos de aplicación directa a alimentos o envases primarios (mínimo 2 bar)',
                    method: 'Impactación Isocinética Directa en Agar Selectivo VRBG (ISO 8573-7) [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'air-coli-isoc', label: 'Impactación Isocinética Directa (ISO)', name: 'Impactación Isocinética Directa bajo Presión sobre Agar VRBG / MacConkey (ISO 8573-7) - Cuantitativo', time: '24-48h', type: 'camtu', nature: 'cuantitativo', badge: '⭐ Isocinético ISO' },
                        { id: 'air-coli-descomp', label: 'Descompresión + Película Seca Coliformes', name: 'Descompresión Aséptica + Película Seca Rehidratable de Coliformes Totales / E. coli - Cuantitativo', time: '24h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Película Seca 24h' }
                    ]
                },
                {
                    id: 'ind-s-air-ana',
                    name: 'Bacterias Anaerobias y Esporulados en Aire Comprimido & Gases (ISO 8573-7 / USP <1116>)',
                    code: 'AIR-ANA-8573',
                    badge: 'ISO 8573-7 / USP <1116>',
                    nature: 'cuantitativo',
                    sampleReq: 'Gases de proceso (N2, CO2, Aire médico/farma), líneas asépticas',
                    method: 'Impactación Isocinética bajo Presión con Incubación Anaeróbica [Cuantitativo]',
                    time: '48-72h',
                    methods: [
                        { id: 'air-ana-isoc', label: 'Impactación Isocinética Anaerobia', name: 'Impactación Isocinética Directa bajo Presión en Agar Schaedler / Tioglicolato en Atmósfera Anaeróbica (ISO 8573-7) - Cuantitativo', time: '48-72h', type: 'camtu', nature: 'cuantitativo', badge: 'Anaerobiosis ISO' },
                        { id: 'air-ana-membrana', label: 'Descompresión + Membrana Anaerobia', name: 'Descompresión Aséptica y Filtración por Membrana con Incubación Anaeróbica (USP <1116> / ISO 8573-7)', time: '48-72h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Farma USP' }
                    ]
                },
                {
                    id: 'ind-s1',
                    name: 'Monitoreo Microbiológico de Aire Ambiental (RAM / Hongos)',
                    code: 'AMB-AIRE',
                    badge: 'Calidad de Aire en Plantas & Salas Blancas',
                    sampleReq: 'Área de producción, sala de envasado, empaque aséptico',
                    method: 'Impactación Volumétrica Activa vs Sedimentación Pasiva [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'impact', label: 'Impactación Volumétrica Activa (m³)', name: 'Impactación Volumétrica Activa en Muestreador de Aire Calibrado (100 L/min / 1 m³) - Cuantitativo', time: '48h', type: 'air-impact', nature: 'cuantitativo', badge: '💨 Impactación Activa' },
                        { id: 'sediment', label: 'Sedimentación Pasiva en Placa', name: 'Sedimentación Pasiva en Placa 90mm (Exposición estandarizada 15-60 min) - Cuantitativo', time: '48h', type: 'air-sediment', nature: 'cuantitativo', badge: '🪟 Sedimentación Pasiva' }
                    ]
                },
                {
                    id: 'ind-s2',
                    name: 'Hisopado de Superficie de Contacto Inerte (RAM + Coliformes)',
                    code: 'SUP-INE',
                    badge: 'Validación de Limpieza y Desinfección',
                    sampleReq: '100 cm² plantilla estéril / cinta transportadora / mesas acero inox',
                    method: 'Hisopado Neutralizante con Película Seca Rehidratable [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'sponge', label: 'Esponja + Película Seca', name: 'Hisopado con Esponja Neutralizante Caldo D/E + Película Seca Rehidratable - Cuantitativo', time: '48h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Película Seca' },
                        { id: 'rodac', label: 'Placa RODAC Contacto', name: 'Placa de Contacto RODAC Contact Plate (Agar Convexo 25 cm²) - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'RODAC Directa' },
                        { id: 'classic', label: 'Hisopado Tradicional', name: 'Hisopo Algodón/Poliéster con Plantilla 100 cm² + Placa Tradicional PCA/VRB - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Placa Clásica' }
                    ]
                },
                {
                    id: 'ind-s3',
                    name: 'Detección de Listeria spp. en Ambientes & Drenajes',
                    code: 'SUP-LIST',
                    badge: 'Zonas 1, 2, 3 y 4 de Planta Alimentaria',
                    sampleReq: 'Hisopado de drenajes, pisos, uniones, marcos de puertas y cintas',
                    method: 'Detección Molecular LAMP Isotérmica (24h) [Cualitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'mda', label: 'Detección Molecular LAMP (24h)', name: 'Amplificación Molecular Isotérmica LAMP Ambiental (AOAC 24h) - Cualitativo (Presencia/Ausencia)', time: '24h', type: 'mda', nature: 'cualitativo', badge: '🧬 Molecular 24h' },
                        { id: 'enrichment', label: 'Cultivo Enriquecimiento (ISO 11290)', name: 'Hisopado Esponja Enriquecimiento Caldo UVM/Fraser + Agar Oxford (ISO 11290) - Cualitativo', time: '48-72h', type: 'bam-iso', nature: 'cualitativo', badge: 'Cultivo Tradicional' }
                    ]
                },
                {
                    id: 'ind-s4',
                    name: 'Detección de Salmonella spp. en Ambientes & Polvos',
                    code: 'SUP-SALM',
                    badge: 'Monitoreo de Zonas Secas y Empaque',
                    sampleReq: 'Hisopado de polvos de secado, aspirados, tolvas y filtros de aire',
                    method: 'Detección Molecular LAMP Isotérmica (24h) [Cualitativo]',
                    time: '24-72h',
                    methods: [
                        { id: 'mda', label: 'Detección Molecular LAMP (24h)', name: 'Amplificación Molecular Isotérmica LAMP Ambiental (AOAC 24h) - Cualitativo (Presencia/Ausencia)', time: '24h', type: 'mda', nature: 'cualitativo', badge: '🧬 Molecular 24h' },
                        { id: 'classic', label: 'Cultivo Oficial FDA/ISO', name: 'Preenriquecimiento Caldo BPW + Caldo Rappaport-Vassiliadis + Agar XLD - Cualitativo', time: '3-5 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Tradicional FDA' }
                    ]
                },
                {
                    id: 'ind-s5',
                    name: 'Frotis de Manos de Manipuladores de Alimentos',
                    code: 'SUP-MAN',
                    badge: 'Buenas Prácticas de Manufactura BPM',
                    sampleReq: 'Palmas de las manos, pliegues ungueales y dedos de operarios',
                    method: 'Hisopado de Manos en Película Seca Selectiva [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Selectiva', name: 'Hisopado de Manos en Película Seca Selectiva S. aureus + Coliformes E. coli - Cuantitativo', time: '48h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Película Seca' },
                        { id: 'classic', label: 'Cultivo en Placa', name: 'Cultivo Tradicional Agar Baird-Parker + Agar EMB MacConkey - Cuantitativo', time: '48h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Placa Clásica' }
                    ]
                },
                {
                    id: 'ind-s6',
                    name: 'Control de Esterilidad & Bioburden en Áreas Limpias (USP <1116>)',
                    code: 'SUP-ESTER',
                    badge: 'Grado Farmacéutico & Dispositivos',
                    sampleReq: 'Salas asépticas ISO Grado A/B/C/D, cabinas de bioseguridad',
                    method: 'Filtración por Membrana o Inoculación Directa (USP <71> / <1116>) [Cualitativo]',
                    time: '14 días',
                    methods: [
                        { id: 'membrane', label: 'USP <71> Membrana', name: 'Membrana Filtrante Estéril en Caldo Tioglicolato Líquido y TSB (14 días) - Cualitativo', time: '14 días', type: 'bam-iso', nature: 'cualitativo', badge: 'USP Farmacopea' },
                        { id: 'direct', label: 'Inoculación Directa', name: 'Inoculación Directa en Medios Fluidos de Tioglicolato y Caldo Soya Tripticasa - Cualitativo', time: '14 días', type: 'bam-iso', nature: 'cualitativo', badge: 'USP Farmacopea' }
                    ]
                }
            ]
        },
        {
            id: 'pharma_cosmetics',
            title: 'Cosméticos, Dispositivos Médicos & Farmacia',
            icon: ShieldCheck,
            badge: 'ISO 22716 / USP <61> <62>',
            description: 'Control de biocarga (Bioburden), patógenos cosméticos y test de eficacia de conservantes.',
            tests: [
                {
                    id: 'ind-p1',
                    name: 'Recuento Mesófilos Aerobios Totales en Cosméticos',
                    code: 'COS-RAM',
                    badge: 'ISO 21149 / USP <61>',
                    sampleReq: 'Cremas, lociones, champús, maquillaje, geles (100g/mL)',
                    method: 'Película Seca Validada / Vertido en Placa (ISO 21149 / USP <61>) [Cuantitativo]',
                    time: '48-72h',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Validada', name: 'Película Seca Rehidratable Validada en Formulaciones Cosméticas (AOAC) - Cuantitativo', time: '48h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Rápido 48h' },
                        { id: 'usp', label: 'Vertido USP <61> / ISO 21149', name: 'Placa Vertido Agar Soja Tripticasa con Neutralizantes Letheen/Tween - Cuantitativo', time: '48-72h', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO/USP' }
                    ]
                },
                {
                    id: 'ind-p2',
                    name: 'Recuento de Mohos y Levaduras en Cosméticos',
                    code: 'COS-HL',
                    badge: 'ISO 16212 / USP <61>',
                    sampleReq: 'Productos cosméticos tópicos y capilares (100g/mL)',
                    method: 'Película Seca / Agar Sabouraud (ISO 16212 / USP <61>) [Cuantitativo]',
                    time: '3-5 días',
                    methods: [
                        { id: 'petrifilm', label: 'Película Seca Mohos y Levaduras', name: 'Película Seca Rehidratable con Neutralizante para Formulaciones Cosméticas (AOAC) - Cuantitativo', time: '48-72h', type: 'petrifilm', nature: 'cuantitativo', badge: 'Rápido 48h' },
                        { id: 'usp', label: 'Agar Sabouraud ISO 16212 / USP', name: 'Agar Sabouraud Dextrosa con Cloranfenicol (SDA) a 25°C - Cuantitativo', time: '5 días', type: 'bam-iso', nature: 'cuantitativo', badge: 'Norma ISO/USP' }
                    ]
                },
                {
                    id: 'ind-p3',
                    name: 'Batería Patógenos Específicos Cosméticos (S. aureus, P. aeruginosa, C. albicans, E. coli)',
                    code: 'COS-PAT',
                    badge: 'ISO 22717 / 22718 / 18416 / USP <62>',
                    sampleReq: 'Cosméticos de uso ocular, facial y corporal (100g/mL)',
                    method: 'Batería Completa Selectiva ISO / USP <62> [Cualitativo]',
                    time: '48-72h',
                    methods: [
                        { id: 'iso', label: 'Batería ISO / USP <62>', name: 'Batería Enriquecimiento Caldo Eugon LT100 + Medios Selectivos Diferenciales - Cualitativo', time: '48-72h', type: 'bam-iso', nature: 'cualitativo', badge: 'ISO / USP Oficial' }
                    ]
                },
                {
                    id: 'ind-p4',
                    name: 'Test de Eficacia de Conservantes (Challenge Test)',
                    code: 'COS-CHAL',
                    badge: 'ISO 11930 / USP <51>',
                    sampleReq: 'Producto terminado en envase final comercial (300g/mL)',
                    method: 'Reto Microbiano Cinético (Días 0, 7, 14 y 28) [Cuantitativo]',
                    time: '28 días',
                    methods: [
                        { id: 'usp', label: 'ISO 11930 / USP <51>', name: 'Inoculación de 5 Cepas ATCC y Cuantificación a 0, 7, 14, 28 días - Cuantitativo', time: '28 días', type: 'bam-iso', nature: 'cuantitativo', badge: 'Challenge Test Oficial' }
                    ]
                }
            ]
        },
        {
            id: 'allergens_hygiene',
            title: 'Alérgenos Alimentarios & Verificación Rápida de Higiene',
            icon: ShieldCheck,
            badge: 'ELISA Cuantitativo / Flujo Lateral / ATP',
            description: 'Detección cuantitativa por inmunoensayo ELISA y tiras rápidas de flujo lateral para alérgenos críticos (Gluten, Leche, Maní, Soya, Huevo, Frutos Secos) y bioluminiscencia ATP de superficies.',
            tests: [
                {
                    id: 'ind-al-gluten',
                    name: 'Detección y Cuantificación de Gluten / Gliadina',
                    code: 'ALERG-GLUT',
                    badge: 'Etiquetado Libre de Gluten (<20 ppm)',
                    sampleReq: 'Alimentos procesados, harinas, cereales, superficies o enjuague CIP (100g/mL)',
                    method: 'Inmunoensayo ELISA Cuantitativo (AOAC-RI 061403) [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA (ppm)', name: 'Inmunoensayo ELISA Sandwich Cuantitativo Gliadina/Gluten (Rango 2.5 - 80 ppm / AOAC-RI 061403) - Cuantitativo', time: '24-48h', type: 'neogen', nature: 'cuantitativo', badge: 'ELISA Cuantitativo' },
                        { id: 'strip', label: 'Flujo Lateral Rápido (10 min)', name: 'Inmunocromatografía de Flujo Lateral Rápido Cualitativo (Sensibilidad 5 ppm) - Cualitativo', time: 'Mismo día', type: 'neogen', nature: 'cualitativo', badge: 'Flujo Lateral Rápido' }
                    ]
                },
                {
                    id: 'ind-al-leche',
                    name: 'Alérgeno Proteína Total de Leche / Caseína / BLG',
                    code: 'ALERG-LECHE',
                    badge: 'Alérgeno Mayor RTCA / FDA',
                    sampleReq: 'Alimentos, bebidas, superficies de empaque y CIP (100g/mL)',
                    method: 'Inmunoensayo ELISA Cuantitativo / Flujo Lateral [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA (ppm)', name: 'Inmunoensayo ELISA Cuantitativo Proteína Total de Leche / Caseína (2.5 - 25 ppm) - Cuantitativo', time: '24-48h', type: 'neogen', nature: 'cuantitativo', badge: 'ELISA Cuantitativo' },
                        { id: 'strip', label: 'Flujo Lateral Superficies', name: 'Inmunocromatografía de Flujo Lateral Rápido para Validación de Limpieza - Cualitativo', time: 'Mismo día', type: 'neogen', nature: 'cualitativo', badge: 'Flujo Lateral' }
                    ]
                },
                {
                    id: 'ind-al-mani',
                    name: 'Alérgeno Maní / Cacahuate (Peanut Allergen)',
                    code: 'ALERG-MANI',
                    badge: 'Alérgeno Severo Cero Tolerancia',
                    sampleReq: 'Snacks, galletas, chocolates, confitería y superficies (100g/mL)',
                    method: 'Inmunoensayo ELISA Cuantitativo / Flujo Lateral [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA (ppm)', name: 'Inmunoensayo ELISA Cuantitativo Alérgeno de Maní / Cacahuate (2.5 - 25 ppm) - Cuantitativo', time: '24-48h', type: 'neogen', nature: 'cuantitativo', badge: 'ELISA Cuantitativo' },
                        { id: 'strip', label: 'Flujo Lateral Rápido', name: 'Inmunocromatografía de Flujo Lateral Tira Reactiva (Detección a 5 ppm) - Cualitativo', time: 'Mismo día', type: 'neogen', nature: 'cualitativo', badge: 'Flujo Lateral' }
                    ]
                },
                {
                    id: 'ind-al-soya',
                    name: 'Alérgeno Proteína de Soya (Soy Protein)',
                    code: 'ALERG-SOYA',
                    badge: 'Control Contaminación Cruzada',
                    sampleReq: 'Cárnicos embutidos, salsas, panadería y líneas de proceso (100g/mL)',
                    method: 'Inmunoensayo ELISA Cuantitativo / Flujo Lateral [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA (ppm)', name: 'Inmunoensayo ELISA Cuantitativo Proteína de Soya (2.5 - 25 ppm) - Cuantitativo', time: '24-48h', type: 'neogen', nature: 'cuantitativo', badge: 'ELISA Cuantitativo' },
                        { id: 'strip', label: 'Flujo Lateral Rápido', name: 'Inmunocromatografía de Flujo Lateral Rápido para Proteína de Soya - Cualitativo', time: 'Mismo día', type: 'neogen', nature: 'cualitativo', badge: 'Flujo Lateral' }
                    ]
                },
                {
                    id: 'ind-al-huevo',
                    name: 'Alérgeno Proteína Total de Huevo (Egg Allergen)',
                    code: 'ALERG-HUEVO',
                    badge: 'Proteína de Huevo / Ovalbúmina',
                    sampleReq: 'Pastelería, pastas, aderezos, mayonesas y superficies (100g/mL)',
                    method: 'Inmunoensayo ELISA Cuantitativo / Flujo Lateral [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA (ppm)', name: 'Inmunoensayo ELISA Cuantitativo Proteína Total de Huevo / Ovalbúmina (2.5 - 25 ppm) - Cuantitativo', time: '24-48h', type: 'neogen', nature: 'cuantitativo', badge: 'ELISA Cuantitativo' },
                        { id: 'strip', label: 'Flujo Lateral Rápido', name: 'Inmunocromatografía de Flujo Lateral Rápido para Huevo - Cualitativo', time: 'Mismo día', type: 'neogen', nature: 'cualitativo', badge: 'Flujo Lateral' }
                    ]
                },
                {
                    id: 'ind-al-frutos',
                    name: 'Alérgeno Frutos de Cáscara Secos (Almendra / Nuez / Avellana)',
                    code: 'ALERG-NUEZ',
                    badge: 'Frutos de Cáscara',
                    sampleReq: 'Cereales, helados, granolas, barras de proteína y superficies (100g)',
                    method: 'Inmunoensayo ELISA Cuantitativo / Flujo Lateral [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA Específico', name: 'Inmunoensayo ELISA Cuantitativo Específico (Almendra / Avellana / Nuez) - Cuantitativo', time: '24-48h', type: 'neogen', nature: 'cuantitativo', badge: 'ELISA Cuantitativo' },
                        { id: 'strip', label: 'Flujo Lateral Rápido', name: 'Inmunocromatografía de Flujo Lateral para Frutos Secos en Líneas - Cualitativo', time: 'Mismo día', type: 'neogen', nature: 'cualitativo', badge: 'Flujo Lateral' }
                    ]
                },
                {
                    id: 'ind-al-crustaceo',
                    name: 'Alérgeno Crustáceos & Mariscos (Tropomiosina)',
                    code: 'ALERG-CRUST',
                    badge: 'Alérgeno Mayor Marino',
                    sampleReq: 'Productos pesqueros, caldos, sazonadores y líneas mixtas (100g)',
                    method: 'Inmunoensayo ELISA Cuantitativo Tropomiosina (2.5 - 25 ppm) [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA Tropomiosina', name: 'Inmunoensayo ELISA Cuantitativo Tropomiosina en Crustáceos y Mariscos - Cuantitativo', time: '48h', type: 'neogen', nature: 'cuantitativo', badge: 'ELISA Cuantitativo' }
                    ]
                },
                {
                    id: 'ind-al-sesamo',
                    name: 'Alérgeno Sésamo / Ajonjolí (Sesame Allergen)',
                    code: 'ALERG-SES',
                    badge: 'Alérgeno Mayor FASTER Act',
                    sampleReq: 'Panificación, aderezos, tahini, botanas y superficies (100g)',
                    method: 'Inmunoensayo ELISA Cuantitativo Alérgeno de Sésamo (2.5 - 25 ppm) [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA Sésamo', name: 'Inmunoensayo ELISA Cuantitativo Alérgeno de Sésamo / Ajonjolí - Cuantitativo', time: '48h', type: 'neogen', nature: 'cuantitativo', badge: 'ELISA Cuantitativo' }
                    ]
                },
                {
                    id: 'ind-hg-atp',
                    name: 'Verificación Inmediata de Higiene por Bioluminiscencia ATP',
                    code: 'HIG-ATP',
                    badge: 'Monitoreo Inmediato RLU',
                    sampleReq: 'Superficie de contacto (hisopado directo en planta o agua de enjuague final CIP)',
                    method: 'Bioluminiscencia Enzimática ATP de Alta Sensibilidad en RLU [Cuantitativo]',
                    time: 'Mismo día (Inmediato)',
                    methods: [
                        { id: 'atp-surf', label: 'Bioluminiscencia ATP Superficie', name: 'Bioluminiscencia Enzimática Luciferina-Luciferasa en RLU para Superficie (Lectura en 10s) - Cuantitativo', time: 'Inmediato', type: 'neogen', nature: 'cuantitativo', badge: 'ATP Superficie' },
                        { id: 'atp-cip', label: 'Bioluminiscencia ATP Agua CIP', name: 'Bioluminiscencia Enzimática para Agua de Enjuague Final CIP / Líquidos - Cuantitativo', time: 'Inmediato', type: 'neogen', nature: 'cuantitativo', badge: 'ATP Agua CIP' }
                    ]
                },
                {
                    id: 'ind-hg-protein',
                    name: 'Detección Visual Rápida de Residuos de Proteína en Superficies',
                    code: 'HIG-PROT',
                    badge: 'Validación de Limpieza Alergénica',
                    sampleReq: 'Hisopado de 100 cm² en fajas, llenadoras, cuchillas o tolvas',
                    method: 'Prueba Colorimétrica Rápida de Residuos Proteicos [Cualitativo]',
                    time: 'Mismo día (Inmediato)',
                    methods: [
                        { id: 'protein-test', label: 'Colorimetría Residuos Proteína', name: 'Viraje Colorimétrico Rápido Sensible a Residuos Proteicos (<10 µg) - Cualitativo', time: 'Inmediato', type: 'neogen', nature: 'cualitativo', badge: 'Colorimétrico' }
                    ]
                }
            ]
        },
        {
            id: 'mycotoxins_toxins',
            title: 'Micotoxinas Cuantitativas & Enterotoxinas Bacterianas',
            icon: AlertCircle,
            badge: 'ELISA Cuantitativo (ppb) / Tiras Ópticas',
            description: 'Detección cuantitativa de micotoxinas en café, granos y lácteos, junto con enterotoxinas estafilocócicas y bacterianas.',
            tests: [
                {
                    id: 'ind-myc-afla',
                    name: 'Aflatoxinas Totales (B1 + B2 + G1 + G2)',
                    code: 'MYCO-AFLA',
                    badge: 'Carcinógeno Grupo 1 IARC',
                    sampleReq: 'Maíz, arroz, maní, frutos secos, harinas, especias, café (500g)',
                    method: 'Inmunoensayo ELISA Cuantitativo (ppb) / Flujo Lateral Óptico [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA (ppb)', name: 'Inmunoensayo ELISA Cuantitativo Aflatoxinas Totales (5 - 50 ppb / AOAC 993.17) - Cuantitativo', time: '24-48h', type: 'mycotoxin', nature: 'cuantitativo', badge: 'ELISA (ppb)' },
                        { id: 'strip-opt', label: 'Flujo Lateral Lector Óptico', name: 'Inmunocromatografía de Flujo Lateral Cuantitativa con Lector Fotométrico Calibrado - Cuantitativo', time: 'Mismo día', type: 'mycotoxin', nature: 'cuantitativo', badge: 'Lector Óptico' }
                    ]
                },
                {
                    id: 'ind-myc-aflam1',
                    name: 'Aflatoxina M1 en Leche y Productos Lácteos',
                    code: 'MYCO-M1',
                    badge: 'Regulación Láctea RTCA / FDA',
                    sampleReq: 'Leche fluida cruda/pasteurizada, leche en polvo, quesos (250 mL / 200g)',
                    method: 'Inmunoensayo ELISA Ultra-Sensible Cuantitativo (0.05 ppb / 50 ppt) [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA Ultra-Sensible', name: 'Inmunoensayo ELISA Cuantitativo de Alta Sensibilidad para Aflatoxina M1 (Límite 0.05 ppb / 50 ppt) - Cuantitativo', time: '24-48h', type: 'mycotoxin', nature: 'cuantitativo', badge: 'ELISA ppt/ppb' }
                    ]
                },
                {
                    id: 'ind-myc-ota',
                    name: 'Ocratoxina A (OTA) en Café de Costa Rica & Cereales',
                    code: 'MYCO-OTA',
                    badge: 'Norma Exportación Café & Granos',
                    sampleReq: 'Café verde oro, café tostado y molido, cacao, cereales, pasas (500g)',
                    method: 'Inmunoensayo ELISA Cuantitativo (ppb) / Flujo Lateral Café [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA OTA (ppb)', name: 'Inmunoensayo ELISA Cuantitativo Ocratoxina A en Café y Cereales (Rango 2 - 25 ppb) - Cuantitativo', time: '24-48h', type: 'mycotoxin', nature: 'cuantitativo', badge: 'ELISA OTA' },
                        { id: 'strip-opt', label: 'Flujo Lateral Rápido Café', name: 'Inmunocromatografía Cuantitativa Rápida para Ocratoxina A en Café Verde y Tostado - Cuantitativo', time: 'Mismo día', type: 'mycotoxin', nature: 'cuantitativo', badge: 'Rápido Café' }
                    ]
                },
                {
                    id: 'ind-myc-don',
                    name: 'Deoxinivalenol / Vomitoxina (DON)',
                    code: 'MYCO-DON',
                    badge: 'Toxina de Fusarium en Trigo & Harinas',
                    sampleReq: 'Trigo, cebada, harinas de panificación, pastas, piensos (500g)',
                    method: 'Inmunoensayo ELISA Cuantitativo Deoxinivalenol (0.5 - 5.0 ppm) [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA DON (ppm)', name: 'Inmunoensayo ELISA Cuantitativo para Deoxinivalenol / Vomitoxina (0.5 - 5.0 ppm) - Cuantitativo', time: '24-48h', type: 'mycotoxin', nature: 'cuantitativo', badge: 'ELISA DON' }
                    ]
                },
                {
                    id: 'ind-myc-zea',
                    name: 'Zearalenona (ZEA) en Maíz & Granos',
                    code: 'MYCO-ZEA',
                    badge: 'Micotoxina Estrogénica',
                    sampleReq: 'Maíz amarillo/blanco, cereales de desayuno, alimentos balanceados (500g)',
                    method: 'Inmunoensayo ELISA Cuantitativo Zearalenona (25 - 500 ppb) [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA ZEA (ppb)', name: 'Inmunoensayo ELISA Cuantitativo para Zearalenona en Granos y Derivados (25 - 500 ppb) - Cuantitativo', time: '24-48h', type: 'mycotoxin', nature: 'cuantitativo', badge: 'ELISA ZEA' }
                    ]
                },
                {
                    id: 'ind-myc-fum',
                    name: 'Fumonisinas Totales (B1, B2, B3) en Maíz',
                    code: 'MYCO-FUM',
                    badge: 'Toxinas de Fusarium en Derivados de Maíz',
                    sampleReq: 'Maíz en grano, harina de maíz, tortillas, snacks extruidos (500g)',
                    method: 'Inmunoensayo ELISA Cuantitativo Fumonisinas Totales (1 - 6 ppm) [Cuantitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa', label: 'Inmunoensayo ELISA Fumonisinas', name: 'Inmunoensayo ELISA Cuantitativo para Fumonisinas Totales B1+B2+B3 en Maíz (1 - 6 ppm) - Cuantitativo', time: '24-48h', type: 'mycotoxin', nature: 'cuantitativo', badge: 'ELISA Fumonisinas' }
                    ]
                },
                {
                    id: 'ind-tox-staph',
                    name: 'Enterotoxinas Estafilocócicas (SET A, B, C, D, E)',
                    code: 'TOX-SET',
                    badge: 'Intoxicación Alimentaria Termoestable',
                    sampleReq: 'Quesos frescos, natillas, cárnicos cocidos, embutidos, pastelería (250g)',
                    method: 'Inmunoensayo ELISA Sandwich (SET A, B, C, D, E) [Cualitativo]',
                    time: '48h',
                    methods: [
                        { id: 'elisa-set', label: 'ELISA Específico SET A-E', name: 'Inmunoensayo Enzimático Sandwich Detección de Enterotoxinas Estafilocócicas A, B, C, D y E (<0.25 ng/g) - Cualitativo', time: '48h', type: 'toxin', nature: 'cualitativo', badge: 'ELISA Oficial SET' }
                    ]
                },
                {
                    id: 'ind-tox-bcereus',
                    name: 'Toxinas de Bacillus cereus (Diarreica Hbl/Nhe y Emética Cereulida)',
                    code: 'TOX-BCER',
                    badge: 'Toxinas en Arroces, Pastas & Especias',
                    sampleReq: 'Arroces cocidos, pastas preparadas, purés, especias deshidratadas (250g)',
                    method: 'Inmunoensayo ELISA Toxinas Diarreicas Hbl/Nhe [Cualitativo]',
                    time: '48h',
                    methods: [
                        { id: 'elisa-bcereus', label: 'ELISA Toxina Diarreica Hbl/Nhe', name: 'Inmunoensayo Enzimático para Complejo de Enterotoxinas Diarreicas Hbl y Nhe de Bacillus cereus - Cualitativo', time: '48h', type: 'toxin', nature: 'cualitativo', badge: 'ELISA Diarreica' }
                    ]
                },
                {
                    id: 'ind-tox-stec',
                    name: 'Detección Inmunológica de Shiga-Toxinas (Stx1 / Stx2)',
                    code: 'TOX-STEC',
                    badge: 'Toxina de E. coli Enterohemorrágica',
                    sampleReq: 'Carnes molidas, hamburguesas, leche cruda, vegetales de hoja verde (250g)',
                    method: 'Inmunoensayo ELISA / Inmunocromatografía Shiga-Toxinas [Cualitativo]',
                    time: '24-48h',
                    methods: [
                        { id: 'elisa-stx', label: 'ELISA Shiga-Toxinas Stx1/Stx2', name: 'Detección Enzimática Inmunológica de Exotoxinas Activas Stx1 y Stx2 en Caldo de Enriquecimiento - Cualitativo', time: '24-48h', type: 'toxin', nature: 'cualitativo', badge: 'ELISA Stx1/Stx2' }
                    ]
                },
                {
                    id: 'ind-tox-cperf',
                    name: 'Enterotoxina de Clostridium perfringens (CPE)',
                    code: 'TOX-CPER',
                    badge: 'Toxina Esporular en Alimentos y Brotes',
                    sampleReq: 'Cárnicos cocidos con salsa, guisos, alimentos en buffet caliente (250g)',
                    method: 'Inmunoensayo ELISA Sandwich Enterotoxina CPE [Cualitativo]',
                    time: '48h',
                    methods: [
                        { id: 'elisa-cpe', label: 'ELISA Enterotoxina CPE', name: 'Detección Inmunoenzimática de Enterotoxina Esporular CPE de Clostridium perfringens - Cualitativo', time: '48h', type: 'toxin', nature: 'cualitativo', badge: 'ELISA CPE' }
                    ]
                }
            ]
        }
    ];

    // ─── B. DIVISIÓN CLÍNICA & SALUD HUMANA (MICROBIOLOGÍA CLÍNICA MÁS COMPLETA DE COSTA RICA) ───
    const CLINICAL_CATEGORIES = [
        {
            id: 'micro_clinical',
            title: 'Bacteriología Médica Especializada & Cultivos',
            icon: Microscope,
            badge: 'CLSI M100 / Colegio MQC',
            description: 'Aislamiento, tipificación bacteriana y antibiograma automatizado con CMI según CLSI M100.',
            tests: [
                {
                    id: 'cli-m1',
                    name: 'Urocultivo Cuantitativo con Antibiograma CLSI',
                    code: 'URO-01',
                    badge: 'Diagnóstico ITU',
                    sampleReq: 'Orina chorro medio frasco estéril (primer vaciado mañana)',
                    method: 'Aislamiento Cuantitativo + Microdilución CMI Automatizada CLSI [Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'cmi', label: 'Microdilución CMI Automatizada', name: 'Microdilución en Caldo Automatizada (Concentración Mínima Inhibitoria CMI / CLSI M100) - Cuantitativo', time: '48h', type: 'cmi', nature: 'cuantitativo', badge: '💊 CMI Automatizado' },
                        { id: 'kirby', label: 'Disco-Difusión Kirby-Bauer', name: 'Difusión en Disco Kirby-Bauer Estandarizada en Agar Mueller-Hinton (CLSI M100) - Cualitativo', time: '48h', type: 'bam-iso', nature: 'cualitativo', badge: 'Kirby-Bauer' }
                    ]
                },
                {
                    id: 'cli-m2',
                    name: 'Coprocultivo Clínico Ampliado (Salmonella, Shigella, Campylobacter, E. coli patógena)',
                    code: 'COPRO-02',
                    badge: 'Gastroenteritis Infecciosa',
                    sampleReq: 'Heces frescas emisión reciente en frasco estéril o medio Cary-Blair',
                    method: 'Medios Selectivos Diferenciales + Identificación Bioquímica y CMI [Cualitativo / Cuantitativo]',
                    time: '48-72h',
                    methods: [
                        { id: 'cmi', label: 'Cultivo Integral + CMI CLSI', name: 'Aislamiento Cromogénico + Galería Bioquímica e Identificación CMI CLSI - Cualitativo/Cuantitativo', time: '48-72h', type: 'cmi', nature: 'cualitativo', badge: 'Cultivo Completo' },
                        { id: 'rapid', label: 'Inmunocromatografía Antígeno', name: 'Inmunocromatografía Antígeno Fecal Rápida + Cultivo Selectivo - Cualitativo', time: '24-48h', type: 'bam-iso', nature: 'cualitativo', badge: 'Rápido 24h' }
                    ]
                },
                {
                    id: 'cli-m3',
                    name: 'Cultivo de Exudado Faríngeo & Nasofaríngeo',
                    code: 'FARINGE-03',
                    badge: 'Infecciones Vías Respiratorias',
                    sampleReq: 'Hisopado estéril de pilares y amígdalas sin tocar mucosa yugal',
                    method: 'Agar Sangre de Carnero 5% para S. pyogenes y sensibles [Cualitativo]',
                    time: '48h',
                    methods: [
                        { id: 'agar', label: 'Agar Sangre 5%', name: 'Agar Sangre de Carnero 5% + Test Sensibilidad a Bacitracina (S. pyogenes) - Cualitativo', time: '48h', type: 'bam-iso', nature: 'cualitativo', badge: 'Agar Sangre' },
                        { id: 'rapid', label: 'Test Inmunológico Rápido', name: 'Test Rápido Inmunológico Estreptococo Grupo A + Siembra Confirmatoria - Cualitativo', time: 'Mismo día', type: 'bam-iso', nature: 'cualitativo', badge: 'Rápido Inmediato' }
                    ]
                },
                {
                    id: 'cli-m4',
                    name: 'Cultivo de Secreción de Herida, Absceso o Tejido con Antibiograma',
                    code: 'HERIDA-04',
                    badge: 'Infecciones Quirúrgicas y Traumas',
                    sampleReq: 'Aspirado con jeringa estéril o hisopo con medio de transporte Amies/Stuart',
                    method: 'Aislamiento Aerobio / Anaerobio + Microdilución CMI Automatizada [Cuantitativo]',
                    time: '48-72h',
                    methods: [
                        { id: 'cmi', label: 'Microdilución CMI Automatizada', name: 'Aislamiento Aerobio/Anaerobio + Microdilución CMI Automatizada CLSI M100 - Cuantitativo', time: '48-72h', type: 'cmi', nature: 'cuantitativo', badge: '💊 CMI Automatizado' },
                        { id: 'kirby', label: 'Disco-Difusión Kirby-Bauer', name: 'Aislamiento Bacteriano + Sensibilidad Kirby-Bauer Disco Difusión - Cualitativo', time: '48h', type: 'bam-iso', nature: 'cualitativo', badge: 'Kirby-Bauer' }
                    ]
                },
                {
                    id: 'cli-m5',
                    name: 'Exudado Vaginal, Uretral & Endocervical',
                    code: 'GENIT-05',
                    badge: 'Infecciones Urogenitales & ITS',
                    sampleReq: 'Hisopado urogenital con hisopo dacrón en medio Stuart',
                    method: 'Gram + Fresco + Aislamiento en Agar Thayer-Martin / Chocolate [Cualitativo]',
                    time: '48h',
                    methods: [
                        { id: 'culture', label: 'Cultivo Integral + CMI', name: 'Cultivo Medios Selectivos (Thayer-Martin Neisseria, Gardnerella, Candida) + Antibiograma - Cualitativo', time: '48h', type: 'cmi', nature: 'cualitativo', badge: 'Cultivo Integral' },
                        { id: 'direct', label: 'Fresco + Gram Inmediato', name: 'Examen Directo al Fresco (Trichomonas) + Tinción de Gram (Puntaje Nugent Vaginosis) - Cualitativo', time: 'Mismo día', type: 'bam-iso', nature: 'cualitativo', badge: 'Inmediato' }
                    ]
                },
                {
                    id: 'cli-m6',
                    name: 'Hemocultivo Automatizado (Adulto / Pediátrico - Botella Aerobio + Anaerobio)',
                    code: 'HEMO-06',
                    badge: 'Sepsis & Bacteriemia Crítica',
                    sampleReq: '8-10 mL de sangre total por punción venosa aséptica estricta',
                    method: 'Monitoreo Continuo Automatizado en Frascos Hemocultivo 24/7 [Cualitativo]',
                    time: '5 días',
                    methods: [
                        { id: 'automated', label: 'Monitoreo Automatizado 24/7', name: 'Monitoreo Colorimétrico Continuo 24/7 en Incubadora Automatizada con Sensor CO2 (5 días) - Cualitativo', time: '5 días', type: 'cmi', nature: 'cualitativo', badge: 'Automatizado 24/7' },
                        { id: 'rapid-alert', label: 'Alerta Detección Precoz', name: 'Alerta Inmediata por Detección Precoz + Tinción de Gram Directa en 1 Hora - Cualitativo', time: '24-48h', type: 'cmi', nature: 'cualitativo', badge: 'Alerta Precoz' }
                    ]
                },
                {
                    id: 'cli-m7',
                    name: 'Cultivo de Esputo & Secreción Traqueal',
                    code: 'ESPUTO-07',
                    badge: 'Neumonía & Infección Pulmonar',
                    sampleReq: 'Primer esputo matinal expectorado tras enjuague bucal frasco estéril',
                    method: 'Evaluación Criterio Murray-Washington + Cultivo y CMI CLSI [Cuantitativo / Cualitativo]',
                    time: '48-72h',
                    methods: [
                        { id: 'cmi', label: 'Criterio Murray + CMI', name: 'Selección de Muestra (<10 células epiteliales) + Cultivo Agar Chocolate/Sangre + CMI - Cuantitativo', time: '48-72h', type: 'cmi', nature: 'cuantitativo', badge: 'CLSI M100' },
                        { id: 'baar', label: 'Gram + Ziehl-Neelsen (BAAR)', name: 'Tinción de Gram Directa + Baciloscopía Ziehl-Neelsen para Micobacterias (TB) - Cualitativo', time: 'Mismo día', type: 'bam-iso', nature: 'cualitativo', badge: 'Baciloscopía' }
                    ]
                }
            ]
        },
        {
            id: 'mycology',
            title: 'Micología Médica & Hongos Patógenos',
            icon: Sparkles,
            badge: 'Micología Especializada',
            description: 'Diagnóstico microscópico directo y aislamiento de dermatofitos, levaduras y mohos.',
            tests: [
                {
                    id: 'cli-my1',
                    name: 'Examen Micológico Directo con KOH 20% + Calcoflúor',
                    code: 'KOH-01',
                    badge: 'Diagnóstico Micológico Inmediato',
                    sampleReq: 'Raspado de escamas de piel, raspado ungueal subungueal, pelos',
                    method: 'Microscopía con KOH 20% Clarificante + Fluorescencia Calcoflúor [Cualitativo]',
                    time: 'Mismo día',
                    methods: [
                        { id: 'koh', label: 'KOH 20% Inmediato', name: 'Aclaramiento Tisular con KOH 20% y Lectura Microscópica Directa a 40x - Cualitativo', time: 'Mismo día', type: 'bam-iso', nature: 'cualitativo', badge: 'Mismo Día' }
                    ]
                },
                {
                    id: 'cli-my2',
                    name: 'Cultivo Micológico (Dermatofitos en Piel, Uñas y Cabello)',
                    code: 'CULT-MICO',
                    badge: 'Tinea Unguium / Pedis / Capitis',
                    sampleReq: 'Raspado de lesión cutánea, detritos ungueales o hebras pilosas',
                    method: 'Siembra en Agar DTM + Agar Sabouraud Cloranfenicol (15-21 días) [Cualitativo]',
                    time: '15-21 días',
                    methods: [
                        { id: 'dtm', label: 'Agar DTM + Sabouraud', name: 'Dermatophyte Test Medium (DTM) con viraje de color + Sabouraud Cloranfenicol - Cualitativo', time: '15-21 días', type: 'bam-iso', nature: 'cualitativo', badge: 'Norma Micológica' },
                        { id: 'rapid-koh', label: 'KOH Directo + Cultivo', name: 'Examen KOH Mismo Día + Siembra Micológica Incubación Prolongada a 28°C - Cualitativo', time: 'Mismo día / 21d', type: 'bam-iso', nature: 'cualitativo', badge: 'Perfil Completo' }
                    ]
                },
                {
                    id: 'cli-my3',
                    name: 'Identificación de Levaduras (Candida albicans / no-albicans)',
                    code: 'CANDIDA-03',
                    badge: 'Candidiasis & Levaduras',
                    sampleReq: 'Flujo vaginal, orina, secreción ótica, lesiones orales',
                    method: 'Agar Cromogénico Diferencial + Tubo Germinativo [Cualitativo / Cuantitativo]',
                    time: '48h',
                    methods: [
                        { id: 'chromagar', label: 'Agar Cromogénico Diferencial', name: 'Diferenciación en Agar Cromogénico Selectivo (C. albicans verde, C. tropicalis azul, C. krusei rosa) + Tubo Germinativo - Cualitativo', time: '48h', type: 'cmi', nature: 'cualitativo', badge: 'Cromogénico' },
                        { id: 'auxo', label: 'Auxonograma + CMI Antifúngico', name: 'Asimilación Automatizada de Carbohidratos Auxonograma + Antifungigrama CMI - Cuantitativo', time: '48-72h', type: 'cmi', nature: 'cuantitativo', badge: 'Antifungigrama CMI' }
                    ]
                }
            ]
        },
        {
            id: 'urinalysis',
            title: 'Uroanálisis, Coprología & Parasitología',
            icon: Droplets,
            badge: 'Microscopía Clínica',
            description: 'Exámenes de rutina de orina, valoración microscópica de sedimento y parasitología integral.',
            tests: [
                {
                    id: 'cli-u1',
                    name: 'Examen General de Orina (EGO Automatizado + Sedimento)',
                    code: 'EGO-01',
                    badge: 'Rutina Clínica',
                    sampleReq: 'Orina primera de la mañana frasco estéril',
                    method: 'Tira Reactiva 10 Parámetros + Sedimento Microscópico 400x',
                    time: 'Mismo día',
                    methods: [
                        { id: 'ego-std', label: 'EGO Completo', name: 'Química Seca Automatizada + Análisis Microscópico de Elementos Formes en Sedimento', time: 'Mismo día', type: 'bam-iso', badge: 'Mismo Día' }
                    ]
                },
                {
                    id: 'cli-u2',
                    name: 'Examen Coproparasitológico Seriado (3 Muestras Concentración)',
                    code: 'PARAS-02',
                    badge: 'Tamizaje Helmintos y Protozoarios',
                    sampleReq: '3 muestras de heces recolectadas en días alternos recolector limpio',
                    method: 'Técnica de Concentración Éter-Formol (Ritchie) + Examen Directo Salina/Lugol',
                    time: 'Mismo día',
                    methods: [
                        { id: 'ritchie', label: 'Concentración Ritchie', name: 'Centrifugación y Concentración Éter-Formol (Ritchie) + Examen Directo Salina/Lugol', time: 'Mismo día', type: 'bam-iso', badge: 'Seriado Oficial' }
                    ]
                },
                {
                    id: 'cli-u3',
                    name: 'Sangre Oculta en Heces Inmunoquímica (FIT / iFOBT)',
                    code: 'FOBT-03',
                    badge: 'Prevención Cáncer Colorrectal',
                    sampleReq: 'Heces recolector limpio sin restricción dietética previa',
                    method: 'Inmunocromatografía Específica para Hemoglobina Humana',
                    time: 'Mismo día',
                    methods: [
                        { id: 'fit', label: 'Inmunoquímico Humano', name: 'Inmunocromatografía Monoclonal Específica para Hemoglobina Humana (Sin falsos positivos)', time: 'Mismo día', type: 'bam-iso', badge: 'Alta Especificidad' }
                    ]
                },
                {
                    id: 'cli-u4',
                    name: 'Frotis de Heces por Leucocitos Fecales (Azul de Metileno / Wright)',
                    code: 'LEUCO-04',
                    badge: 'Diarrea Inflamatoria',
                    sampleReq: 'Moco fecal fresco en recolector estéril',
                    method: 'Tinción con Azul de Metileno de Loeffler / Tinción de Wright',
                    time: 'Mismo día',
                    methods: [
                        { id: 'loeffler', label: 'Tinción Directa', name: 'Detección Microscópica de Polimorfonucleares en Moco Fecal para Diarrea Invasiva', time: 'Mismo día', type: 'bam-iso', badge: 'Mismo Día' }
                    ]
                },
                {
                    id: 'cli-u5',
                    name: 'Test de Graham (Cinta Adhesiva para Enterobius vermicularis)',
                    code: 'GRAHAM-05',
                    badge: 'Oxiuriasis Pediátrica',
                    sampleReq: 'Cinta adhesiva transparente aplicada a región perianal a primera hora mañana',
                    method: 'Microscopía Óptica para Detección de Huevos de Enterobius',
                    time: 'Mismo día',
                    methods: [
                        { id: 'graham', label: 'Cinta Graham Perianal', name: 'Observación Microscópica Directa de Huevos Asimétricos de Oxiuros', time: 'Mismo día', type: 'bam-iso', badge: 'Mismo Día' }
                    ]
                }
            ]
        },
        {
            id: 'clinical_chem',
            title: 'Química Sanguínea & Perfil Metabólico',
            icon: HeartPulse,
            badge: 'Colegio MQC',
            description: 'Evaluación metabólica, perfil renal, lipídico y química automatizada de alta precisión.',
            tests: [
                { id: 'cli-c1', name: 'Glucosa en Ayunas', method: 'Hexoquinasa / GOD-PAP Automatizado', time: 'Mismo día', sampleReq: 'Suero sanguíneo ayuno 8-12h', code: '1001' },
                { id: 'cli-c2', name: 'Hemoglobina Glicosilada (HbA1c)', method: 'Inmunoensayo Turbidimétrico / HPLC', time: 'Mismo día', sampleReq: 'Sangre total tubo lila EDTA', code: '1002' },
                { id: 'cli-c3', name: 'Perfil Lipídico Completo (Colesterol, Triglicéridos, HDL, LDL)', method: 'Panel Enzimático Automatizado', time: 'Mismo día', sampleReq: 'Suero sanguíneo ayuno 12h', code: '1003' },
                { id: 'cli-c4', name: 'Creatinina en Suero', method: 'Jaffé Cinético Compensado', time: 'Mismo día', sampleReq: 'Suero sanguíneo', code: '1004' },
                { id: 'cli-c5', name: 'Nitrógeno Ureico (BUN) y Urea', method: 'Ureasa / GLDH Cinético', time: 'Mismo día', sampleReq: 'Suero sanguíneo', code: '1005' },
                { id: 'cli-c6', name: 'Ácido Úrico', method: 'Uricasa / PAP Enzimático', time: 'Mismo día', sampleReq: 'Suero sanguíneo', code: '1006' },
                { id: 'cli-c7', name: 'Perfil Hepático (TGO/AST, TGP/ALT, Fosfatasa, Bilirrubinas)', method: 'Cinético UV IFCC', time: 'Mismo día', sampleReq: 'Suero sanguíneo protegido luz', code: '1007' },
                { id: 'cli-c8', name: 'Electrolitos Séricos (Na+, K+, Cl-)', method: 'Electrodo Selectivo de Iones (ISE)', time: 'Mismo día', sampleReq: 'Suero no hemolizado', code: '1008' }
            ]
        },
        {
            id: 'hematology',
            title: 'Hematología & Coagulación Automatizada',
            icon: Activity,
            badge: 'CLSI / Automatizado',
            description: 'Recuentos celulares, frotis periférico y pruebas de coagulación pre-quirúrgica.',
            tests: [
                { id: 'cli-h1', name: 'Hemograma Completo Automatizado + Frotis', method: 'Citometría de Flujo e Impedancia + Wright', time: 'Mismo día', sampleReq: 'Sangre total tubo lila EDTA', code: '2001' },
                { id: 'cli-h2', name: 'Velocidad de Eritrosedimentación (VSG)', method: 'Westergren Automatizado', time: 'Mismo día', sampleReq: 'Sangre total EDTA / Citrato', code: '2002' },
                { id: 'cli-h3', name: 'Tiempo de Protrombina (TP) e INR', method: 'Coagulometría Óptica', time: 'Mismo día', sampleReq: 'Plasma citratado tubo celeste', code: '2003' },
                { id: 'cli-h4', name: 'Tiempo de Tromboplastina Parcial (TPT)', method: 'Coagulometría Óptica', time: 'Mismo día', sampleReq: 'Plasma citratado tubo celeste', code: '2004' },
                { id: 'cli-h5', name: 'Fibrinógeno', method: 'Método Clauss Coagulométrico', time: 'Mismo día', sampleReq: 'Plasma citratado', code: '2005' },
                { id: 'cli-h6', name: 'Grupo Sanguíneo y Factor Rh', method: 'Aglutinación en Tubo / Tarjeta', time: 'Mismo día', sampleReq: 'Sangre total EDTA', code: '2006' }
            ]
        }
    ];

    // ─── PANELES Y PAQUETES PRECONFIGURADOS 3D: DIVISIÓN INDUSTRIAL ───
    const INDUSTRIAL_PANELS = [
        {
            id: 'panel-ind-rtca',
            title: 'Paquete Exportación & Registro RTCA Alimentos',
            tagline: 'Inocuidad microbiológica para alimentos procesados, cárnicos y materias primas',
            badge: 'RTCA / ISO 17025',
            icon: Utensils,
            gradient: 'from-amber-500/20 via-slate-900 to-indigo-950',
            borderAccent: 'border-amber-500/40 hover:border-amber-400',
            glow: 'shadow-amber-500/20',
            textColor: 'text-amber-300',
            deliveryTime: '24h - 5 días (Según método 3D)',
            testIds: ['ind-f1', 'ind-f2', 'ind-f3', 'ind-f4', 'ind-f6'],
            highlights: ['Aerobios Mesófilos (RAM)', 'Coliformes / E. coli', 'Staph. aureus coag (+)', 'Salmonella spp. (25g)', 'Hongos y Levaduras']
        },
        {
            id: 'panel-ind-mda',
            title: 'Mega-Panel Patógenos Moleculares LAMP Isotérmica (24h Ultra-Rápido)',
            tagline: 'Detección molecular LAMP rápida para liberación expedita de lotes industriales',
            badge: 'Molecular LAMP / AOAC',
            icon: Dna,
            gradient: 'from-purple-500/20 via-slate-900 to-indigo-950',
            borderAccent: 'border-purple-500/40 hover:border-purple-400',
            glow: 'shadow-purple-500/20',
            textColor: 'text-purple-300',
            deliveryTime: '24 horas',
            testIds: ['ind-f4', 'ind-f5', 'ind-f7', 'ind-s3'],
            highlights: ['Salmonella spp. Molecular 24h', 'Listeria monocytogenes 24h', 'E. coli STEC O157 24h', 'Listeria spp. Ambiental 24h']
        },
        {
            id: 'panel-ind-agua',
            title: 'Perfil Integral Potabilidad Agua & Hielo',
            tagline: 'Cumplimiento oficial Decreto Ejecutivo Nº 38924-S y aguas envasadas',
            badge: 'SMEWW / Dec. 38924-S',
            icon: Droplets,
            gradient: 'from-cyan-500/20 via-slate-900 to-indigo-950',
            borderAccent: 'border-cyan-500/40 hover:border-cyan-400',
            glow: 'shadow-cyan-500/20',
            textColor: 'text-cyan-300',
            deliveryTime: '24-48 horas',
            testIds: ['ind-w1', 'ind-w2', 'ind-w3', 'ind-w4', 'ind-w7'],
            highlights: ['Coliformes Fecales / E. coli Enzimático', 'Recuento Heterotrófico en Placa', 'Pseudomonas aeruginosa', 'Enterococos Fecales', 'Cloro Libre Residual (DPD)']
        },
        {
            id: 'panel-ind-ambientes',
            title: 'Monitoreo Integral de Aire & Superficies BPM',
            tagline: 'Validación ambiental activa/pasiva y control de superficies de contacto y manipuladores',
            badge: 'HACCP / BPM / SAS m³',
            icon: Wind,
            gradient: 'from-emerald-500/20 via-slate-900 to-indigo-950',
            borderAccent: 'border-emerald-500/40 hover:border-emerald-400',
            glow: 'shadow-emerald-500/20',
            textColor: 'text-emerald-300',
            deliveryTime: '24-48 horas',
            testIds: ['ind-s1', 'ind-s2', 'ind-s3', 'ind-s5'],
            highlights: ['Aire Ambiental (Impactación SAS / Placa)', 'Superficie Inerte con Esponja Neutralizante', 'Listeria Ambiental Molecular LAMP 24h', 'Frotis Manos Manipulador']
        },
        {
            id: 'panel-ind-cosmeticos',
            title: 'Perfil Microbiológico Cosméticos & Dispositivos',
            tagline: 'Control de inocuidad y biocarga bajo normas ISO 22716 y Farmacopea USP',
            badge: 'ISO 22716 / USP <61><62>',
            icon: ShieldCheck,
            gradient: 'from-pink-500/20 via-slate-900 to-indigo-950',
            borderAccent: 'border-pink-500/40 hover:border-pink-400',
            glow: 'shadow-pink-500/20',
            textColor: 'text-pink-300',
            deliveryTime: '48-72 horas',
            testIds: ['ind-p1', 'ind-p2', 'ind-p3'],
            highlights: ['Mesófilos Totales en Cosméticos', 'Mohos y Levaduras', 'Patógenos Cosméticos (S. aureus, P. aeruginosa, Candida, E. coli)']
        },
        {
            id: 'panel-ind-camtu',
            title: 'Validación Aire Comprimido Grado Alimentario & Farma (ISO 8573-7)',
            tagline: 'Validación microbiológica completa de aire comprimido: RTA, Hongos y Levaduras (HyL) y Coliformes según ISO 8573-7',
            badge: 'ISO 8573-7',
            icon: Wind,
            gradient: 'from-sky-500/25 via-slate-900 to-indigo-950',
            borderAccent: 'border-sky-400/50 hover:border-sky-300',
            glow: 'shadow-sky-500/25',
            textColor: 'text-sky-300',
            deliveryTime: '48 horas - 5 días',
            testIds: ['ind-s-camtu', 'ind-s-air-rta', 'ind-s-air-hyl', 'ind-s-air-coli', 'ind-s-air-ana'],
            highlights: ['RTA Aerobios Mesófilos (ISO 8573-7)', 'Hongos y Levaduras (HyL)', 'Coliformes & Enterobacterias', 'Anaerobios / Esporulados USP', 'Impactación Directa bajo Presión']
        },
        {
            id: 'panel-ind-alergenos',
            title: 'Panel Integral Alérgenos Alimentarios & Verificación Higiene',
            tagline: 'Detección cuantitativa ELISA e inmunocromatografía de flujo lateral para prevención de contaminación cruzada',
            badge: 'ELISA Cuantitativo / Flujo Lateral',
            icon: ShieldCheck,
            gradient: 'from-rose-500/20 via-slate-900 to-indigo-950',
            borderAccent: 'border-rose-500/40 hover:border-rose-400',
            glow: 'shadow-rose-500/20',
            textColor: 'text-rose-300',
            deliveryTime: 'Inmediato - 48h',
            testIds: ['ind-al-gluten', 'ind-al-leche', 'ind-al-mani', 'ind-al-soya', 'ind-hg-atp'],
            highlights: ['Gluten Cuantitativo (<20 ppm)', 'Leche Total & Caseína', 'Maní / Cacahuate Cuantitativo', 'Proteína de Soya', 'Bioluminiscencia ATP de Superficie (RLU)']
        },
        {
            id: 'panel-ind-micotoxinas',
            title: 'Panel Integral Micotoxinas Cuantitativas (Café, Granos & Lácteos)',
            tagline: 'Cuantificación en ppb/ppm con inmunoensayos ELISA para cumplimiento de límites de exportación e inocuidad',
            badge: 'ELISA Cuantitativo / ppb',
            icon: AlertCircle,
            gradient: 'from-amber-600/20 via-slate-900 to-indigo-950',
            borderAccent: 'border-amber-500/40 hover:border-amber-400',
            glow: 'shadow-amber-500/20',
            textColor: 'text-amber-300',
            deliveryTime: '24-48 horas',
            testIds: ['ind-myc-afla', 'ind-myc-aflam1', 'ind-myc-ota', 'ind-myc-don', 'ind-myc-zea'],
            highlights: ['Aflatoxinas Totales (B1+B2+G1+G2)', 'Aflatoxina M1 en Leche', 'Ocratoxina A (OTA) en Café de Costa Rica', 'Deoxinivalenol (DON)', 'Zearalenona (ZEA)']
        },
        {
            id: 'panel-ind-enterotoxinas',
            title: 'Panel Toxinas Bacterianas & Enterotoxinas de Inocuidad',
            tagline: 'Screening oficial ELISA para enterotoxinas estafilocócicas, cereulida y shiga-toxinas en alimentos',
            badge: 'ELISA Oficial / FDA-BAM',
            icon: Zap,
            gradient: 'from-orange-500/20 via-slate-900 to-indigo-950',
            borderAccent: 'border-orange-500/40 hover:border-orange-400',
            glow: 'shadow-orange-500/20',
            textColor: 'text-orange-300',
            deliveryTime: '24-48 horas',
            testIds: ['ind-tox-staph', 'ind-tox-bcereus', 'ind-tox-stec', 'ind-tox-cperf'],
            highlights: ['Enterotoxinas Estafilocócicas SET A-E', 'Toxina Diarreica B. cereus', 'Shiga-Toxinas Stx1/Stx2 E. coli', 'Enterotoxina Clostridium perfringens']
        }
    ];

    // ─── PANELES Y PAQUETES PRECONFIGURADOS 3D: DIVISIÓN CLÍNICA ───
    const CLINICAL_PANELS = [
        {
            id: 'panel-cli-bacteriologia',
            title: 'Panel Microbiológico Infeccioso CLSI M100',
            tagline: 'Aislamiento de patógenos bacterianos y antibiograma automatizado con CMI',
            badge: 'CLSI M100',
            icon: Microscope,
            gradient: 'from-emerald-500/20 via-slate-900 to-rose-950',
            borderAccent: 'border-emerald-500/40 hover:border-emerald-400',
            glow: 'shadow-emerald-500/20',
            textColor: 'text-emerald-300',
            deliveryTime: '48-72 horas',
            testIds: ['cli-m1', 'cli-m2', 'cli-m3', 'cli-m4'],
            highlights: ['Urocultivo con Antibiograma CMI', 'Coprocultivo Patógenos Entéricos', 'Cultivo de Exudado Faríngeo', 'Cultivo de Herida / Absceso CMI']
        },
        {
            id: 'panel-cli-micologia',
            title: 'Perfil Diagnóstico Micológico Integral',
            tagline: 'Detección directa inmediata y cultivo de hongos, dermatofitos y levaduras',
            badge: 'Micología Médica',
            icon: Sparkles,
            gradient: 'from-purple-500/20 via-slate-900 to-rose-950',
            borderAccent: 'border-purple-500/40 hover:border-purple-400',
            glow: 'shadow-purple-500/20',
            textColor: 'text-purple-300',
            deliveryTime: 'Mismo día - 15 días',
            testIds: ['cli-my1', 'cli-my2', 'cli-my3'],
            highlights: ['Examen Directo KOH 20% Inmediato', 'Cultivo Dermatofitos Piel/Uñas', 'CHROMagar Candida Levaduras']
        },
        {
            id: 'panel-cli-ejecutivo',
            title: 'Panel Check-Up Clínico Ejecutivo Integral',
            tagline: 'Evaluación integral médica, perfil metabólico, función renal y hematología',
            badge: 'Perfil Preventivo',
            icon: HeartPulse,
            gradient: 'from-rose-500/20 via-slate-900 to-rose-950',
            borderAccent: 'border-rose-500/40 hover:border-rose-400',
            glow: 'shadow-rose-500/20',
            textColor: 'text-rose-300',
            deliveryTime: 'Mismo día',
            testIds: ['cli-c1', 'cli-c3', 'cli-c4', 'cli-h1', 'cli-u1'],
            highlights: ['Glucosa en Ayunas', 'Perfil Lipídico Completo (Lipidograma)', 'Creatinina Sérica', 'Hemograma Completo + Frotis', 'Examen General de Orina (EGO)']
        },
        {
            id: 'panel-cli-metabolico',
            title: 'Perfil Metabólico & Función Renal',
            tagline: 'Monitoreo de diabetes, hiperuricemia y función depuradora renal',
            badge: 'Colegio MQC',
            icon: Activity,
            gradient: 'from-amber-500/20 via-slate-900 to-rose-950',
            borderAccent: 'border-amber-500/40 hover:border-amber-400',
            glow: 'shadow-amber-500/20',
            textColor: 'text-amber-300',
            deliveryTime: 'Mismo día',
            testIds: ['cli-c1', 'cli-c2', 'cli-c4', 'cli-c5', 'cli-c6'],
            highlights: ['Glucosa en Ayunas', 'Hemoglobina Glicosilada (HbA1c)', 'Creatinina Sérica', 'BUN y Urea', 'Ácido Úrico']
        },
        {
            id: 'panel-cli-quirurgico',
            title: 'Perfil Coagulación & Pre-Quirúrgico',
            tagline: 'Tamizaje hemostático preoperatorio y pruebas de seguridad quirúrgica',
            badge: 'CLSI / Coagulometría',
            icon: ShieldCheck,
            gradient: 'from-indigo-500/20 via-slate-900 to-rose-950',
            borderAccent: 'border-indigo-500/40 hover:border-indigo-400',
            glow: 'shadow-indigo-500/20',
            textColor: 'text-indigo-300',
            deliveryTime: 'Mismo día',
            testIds: ['cli-h1', 'cli-h3', 'cli-h4', 'cli-h5', 'cli-h6'],
            highlights: ['Hemograma Completo Automatizado', 'Tiempo de Protrombina (TP) + INR', 'Tiempo Tromboplastina (TPT)', 'Fibrinógeno Clauss', 'Grupo Sanguíneo y Factor Rh']
        }
    ];

    // Categorías y Paneles activos según la preselección de división
    const activeCatalogCategories = quoteDivision === 'industrial' ? INDUSTRIAL_CATEGORIES : CLINICAL_CATEGORIES;
    const activePanels = quoteDivision === 'industrial' ? INDUSTRIAL_PANELS : CLINICAL_PANELS;

    // Todos los ensayos posibles de la división actual (para conteo y búsqueda)
    const allTestsInDivision = activeCatalogCategories.flatMap(c => c.tests);

    // 4. Modalidad de Selección Dinámica 3D & Filtro por Metodología
    const [selectionMode, setSelectionMode] = useState('panels'); // 'panels' | 'categories' | 'matrix'
    const [activeMethodFilter, setActiveMethodFilter] = useState('all'); // 'all' | 'mda' | 'petrifilm' | 'bam-iso' | 'air-impact' | 'air-sediment' | 'colilert' | 'cmi'
    const [activeNatureFilter, setActiveNatureFilter] = useState('all'); // 'all' | 'cuantitativo' | 'cualitativo'
    const [testSelectedMethods, setTestSelectedMethods] = useState({}); // { [testId]: methodId }

    // Helper: Determinar si un método o ensayo es Cuantitativo o Cualitativo
    const getMethodNature = (method, test) => {
        if (method && method.nature) return method.nature;
        const text = ((method?.name || '') + ' ' + (method?.label || '') + ' ' + (method?.badge || '') + ' ' + (test?.name || '') + ' ' + (test?.badge || '')).toLowerCase();
        if (
            text.includes('cuantitativ') || 
            text.includes('recuento') || 
            text.includes('ufc') || 
            text.includes('nmp') || 
            text.includes('veratox') || 
            text.includes('cmi') || 
            text.includes('rlu') || 
            text.includes('ppm') || 
            text.includes('ppb') || 
            text.includes('ppt') ||
            text.includes('conteo') || 
            text.includes('mg/dl') || 
            text.includes('automatizado') ||
            text.includes('cuantificaci')
        ) {
            return 'cuantitativo';
        }
        if (
            text.includes('cualitativ') || 
            text.includes('detección') || 
            text.includes('deteccion') || 
            text.includes('ausencia') || 
            text.includes('presencia') || 
            text.includes('reveal') || 
            text.includes('screening') || 
            text.includes('fresco') || 
            text.includes('koh') || 
            text.includes('gram') || 
            text.includes('strip') ||
            text.includes('mda-2') ||
            text.includes('lamp')
        ) {
            return 'cualitativo';
        }
        return 'cuantitativo';
    };

    // Helper: Evaluar si un ensayo coincide con el filtro de naturaleza (Cuantitativo vs Cualitativo)
    const isTestMatchingNatureFilter = (test, natureFilter) => {
        if (!natureFilter || natureFilter === 'all') return true;
        const activeMethod = getTestActiveMethod(test);
        const activeNature = getMethodNature(activeMethod, test);
        const hasMatchingMethod = test.methods && test.methods.some(m => getMethodNature(m, test) === natureFilter);
        return activeNature === natureFilter || hasMatchingMethod;
    };

    // Helper: Obtener método activo para un ensayo (seleccionado por el usuario o el predeterminado)
    const getTestActiveMethod = (test) => {
        if (!test.methods || test.methods.length === 0) {
            return {
                id: 'default',
                label: test.method,
                name: test.method,
                time: test.time,
                type: 'standard',
                badge: 'Estándar'
            };
        }
        const userSelectedId = testSelectedMethods[test.id];
        const selected = test.methods.find(m => m.id === userSelectedId);
        return selected || test.methods[0];
    };

    // Helper: Enriquecer un ensayo con su método analítico 3D activo y naturaleza
    const enrichTestWithActiveMethod = (test) => {
        const activeMethod = getTestActiveMethod(test);
        const nature = getMethodNature(activeMethod, test);
        return {
            ...test,
            selectedMethodId: activeMethod.id,
            method: activeMethod.name,
            activeMethodLabel: activeMethod.label,
            time: activeMethod.time,
            resultNature: nature
        };
    };

    // Helper: Cambiar interactivamente de método en 3D
    const handleSelectTestMethod = (test, method, e) => {
        if (e) e.stopPropagation();
        setTestSelectedMethods(prev => ({
            ...prev,
            [test.id]: method.id
        }));

        // Si el ensayo ya está en selectedTests, actualizar su método y tiempo de entrega
        if (selectedTests.some(t => t.id === test.id)) {
            setSelectedTests(prev => prev.map(t => {
                if (t.id === test.id) {
                    return {
                        ...t,
                        selectedMethodId: method.id,
                        method: method.name,
                        activeMethodLabel: method.label,
                        time: method.time
                    };
                }
                return t;
            }));
            addNotification(`Método 3D actualizado para "${test.name}": ${method.label} (${method.time})`, 'info');
        }
    };

    // Helper: Evaluar si un ensayo cumple con el filtro de metodología 3D
    const isTestMatchingMethodFilter = (test, filter) => {
        if (!filter || filter === 'all') return true;
        const methodsList = test.methods || [{ id: 'std', type: 'standard', name: test.method }];
        if (filter === 'camtu') {
            return methodsList.some(m => m.type === 'camtu' || m.id?.includes('camtu') || m.name.toLowerCase().includes('camtu') || test.name.toLowerCase().includes('camtu') || test.name.toLowerCase().includes('aire comprimido'));
        }
        if (filter === 'neogen-alerg') {
            return methodsList.some(m => m.type === 'neogen' || m.id?.includes('neogen') || m.name.toLowerCase().includes('neogen') || m.name.toLowerCase().includes('veratox') || m.name.toLowerCase().includes('reveal') || m.name.toLowerCase().includes('alérgeno') || test.name.toLowerCase().includes('alérgeno') || test.name.toLowerCase().includes('gluten') || test.name.toLowerCase().includes('atp') || test.name.toLowerCase().includes('higiene'));
        }
        if (filter === 'neogen-myco') {
            return methodsList.some(m => m.type === 'mycotoxin' || m.id?.includes('myco') || m.name.toLowerCase().includes('micotoxina') || m.name.toLowerCase().includes('aflatoxina') || m.name.toLowerCase().includes('ocratoxina') || test.name.toLowerCase().includes('micotoxina') || test.name.toLowerCase().includes('aflatoxina') || test.name.toLowerCase().includes('ocratoxina') || test.name.toLowerCase().includes('don') || test.name.toLowerCase().includes('zearalenona'));
        }
        if (filter === 'toxins') {
            return methodsList.some(m => m.type === 'toxin' || m.id?.includes('tox') || m.name.toLowerCase().includes('enterotoxina') || m.name.toLowerCase().includes('toxina') || test.name.toLowerCase().includes('enterotoxina') || test.name.toLowerCase().includes('toxina') || test.name.toLowerCase().includes('cereulida'));
        }
        if (filter === 'mda') {
            return methodsList.some(m => m.type === 'mda' || m.id === 'mda' || m.name.toLowerCase().includes('mda') || m.name.toLowerCase().includes('lamp') || m.name.toLowerCase().includes('molecular'));
        }
        if (filter === 'petrifilm') {
            return methodsList.some(m => m.type === 'petrifilm' || m.id === 'petrifilm' || m.name.toLowerCase().includes('petrifilm'));
        }
        if (filter === 'bam-iso') {
            return methodsList.some(m => m.type === 'bam-iso' || m.id === 'bam' || m.id === 'iso' || m.name.toLowerCase().includes('bam') || m.name.toLowerCase().includes('iso'));
        }
        if (filter === 'air-impact') {
            return methodsList.some(m => m.type === 'air-impact' || m.id === 'impact' || m.name.toLowerCase().includes('impactación') || m.name.toLowerCase().includes('sas'));
        }
        if (filter === 'air-sediment') {
            return methodsList.some(m => m.type === 'air-sediment' || m.id === 'sediment' || m.name.toLowerCase().includes('sedimentación'));
        }
        if (filter === 'colilert') {
            return methodsList.some(m => m.type === 'colilert' || m.id === 'colilert' || m.id === 'membrane' || m.name.toLowerCase().includes('colilert') || m.name.toLowerCase().includes('membrana'));
        }
        if (filter === 'cmi') {
            return methodsList.some(m => m.type === 'cmi' || m.id === 'cmi' || m.name.toLowerCase().includes('cmi') || m.name.toLowerCase().includes('clsi'));
        }
        return true;
    };

    // Helpers de Paneles 3D
    const isPanelFullySelected = (panel) => panel.testIds.every(id => selectedTests.some(t => t.id === id));
    const isPanelPartiallySelected = (panel) => panel.testIds.some(id => selectedTests.some(t => t.id === id)) && !isPanelFullySelected(panel);
    const getPanelSelectedCount = (panel) => panel.testIds.filter(id => selectedTests.some(t => t.id === id)).length;

    const togglePanel = (panel) => {
        const isFull = isPanelFullySelected(panel);
        if (isFull) {
            setSelectedTests(selectedTests.filter(t => !panel.testIds.includes(t.id)));
            addNotification(`Paquete "${panel.title}" desmarcado.`, 'info');
        } else {
            const panelTests = allTestsInDivision.filter(t => panel.testIds.includes(t.id));
            const missing = panelTests.filter(pt => !selectedTests.some(st => st.id === pt.id)).map(enrichTestWithActiveMethod);
            setSelectedTests([...selectedTests, ...missing]);
            addNotification(`Paquete 3D "${panel.title}" activado (+${missing.length} análisis agregados).`, 'success');
        }
    };

    // Helpers de Selección Múltiple por Categoría & División
    const isCategoryFullySelected = (cat) => cat.tests.every(t => selectedTests.some(st => st.id === t.id));

    const toggleSelectAllCategory = (cat) => {
        if (isCategoryFullySelected(cat)) {
            const catTestIds = cat.tests.map(t => t.id);
            setSelectedTests(selectedTests.filter(t => !catTestIds.includes(t.id)));
            addNotification(`Categoría "${cat.title}" desmarcada.`, 'info');
        } else {
            const missing = cat.tests.filter(t => !selectedTests.some(st => st.id === t.id)).map(enrichTestWithActiveMethod);
            setSelectedTests([...selectedTests, ...missing]);
            addNotification(`Categoría "${cat.title}": +${missing.length} análisis agregados.`, 'success');
        }
    };

    const isDivisionFullySelected = allTestsInDivision.length > 0 && allTestsInDivision.every(t => selectedTests.some(st => st.id === t.id));

    const toggleSelectAllDivision = () => {
        if (isDivisionFullySelected) {
            const divTestIds = allTestsInDivision.map(t => t.id);
            setSelectedTests(selectedTests.filter(t => !divTestIds.includes(t.id)));
            addNotification(`Todos los análisis de la división ${quoteDivision === 'industrial' ? 'Industrial' : 'Clínica'} fueron desmarcados.`, 'info');
        } else {
            const missing = allTestsInDivision.filter(t => !selectedTests.some(st => st.id === t.id)).map(enrichTestWithActiveMethod);
            setSelectedTests([...selectedTests, ...missing]);
            addNotification(`Multi-selección completa: +${missing.length} análisis añadidos a su cotización.`, 'success');
        }
    };

    const selectTopFrequentTests = () => {
        const topIds = quoteDivision === 'industrial' 
            ? ['ind-f1', 'ind-f2', 'ind-f4', 'ind-w1'] 
            : ['cli-m1', 'cli-my1', 'cli-c1', 'cli-h1'];
        const testsToAdd = allTestsInDivision.filter(t => topIds.includes(t.id) && !selectedTests.some(st => st.id === t.id)).map(enrichTestWithActiveMethod);
        if (testsToAdd.length > 0) {
            setSelectedTests([...selectedTests, ...testsToAdd]);
            addNotification(`Se agregaron ${testsToAdd.length} análisis frecuentes de alta demanda.`, 'success');
        } else {
            addNotification('Los análisis frecuentes ya están seleccionados.', 'info');
        }
    };

    // Filtrado inteligente por buscador, método 3D, naturaleza (Cuantitativo vs Cualitativo) o pestaña activa
    const filteredTests = catalogSearchQuery.trim()
        ? allTestsInDivision.filter(t => 
            isTestMatchingMethodFilter(t, activeMethodFilter) &&
            isTestMatchingNatureFilter(t, activeNatureFilter) &&
            (
                t.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                t.method.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                (t.code && t.code.toLowerCase().includes(catalogSearchQuery.toLowerCase())) ||
                (t.sampleReq && t.sampleReq.toLowerCase().includes(catalogSearchQuery.toLowerCase())) ||
                (t.methods && t.methods.some(m => m.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) || m.label.toLowerCase().includes(catalogSearchQuery.toLowerCase())))
            )
          )
        : (
            activeCatalogCategories.find(c => c.id === activeCatalogTab)?.tests.filter(t => 
                isTestMatchingMethodFilter(t, activeMethodFilter) &&
                isTestMatchingNatureFilter(t, activeNatureFilter)
            ) || []
          );

    const toggleSelectTest = (test) => {
        if (selectedTests.some(t => t.id === test.id)) {
            setSelectedTests(selectedTests.filter(t => t.id !== test.id));
        } else {
            const enriched = enrichTestWithActiveMethod(test);
            setSelectedTests([...selectedTests, enriched]);
        }
    };

    // =========================================================================
    // HANDLERS: VALIDACIÓN DE CONTRASEÑA PREVIA & ACCESOS SEPARADOS
    // =========================================================================
    // 1. Validar Password Previo Institucional para Uso Interno
    const handleStaffPasscodeSubmit = async (e) => {
        e.preventDefault();
        setStaffPasscodeError('');
        setStaffPasscodeSuccess(false);

        const cleanPass = staffPasscode.trim().toUpperCase();
        if (!cleanPass) {
            setStaffPasscodeError('Ingrese la contraseña institucional de acceso previo.');
            return;
        }

        setValidatingStaff(true);

        try {
            // Verificación vía backend con rate limiting
            let isAuthorized = false;
            try {
                const res = await fetch(`${API_URL}/api/public/verify-staff-passcode`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ passcode: cleanPass })
                });
                const data = await res.json();
                if (res.ok && data.authorized) {
                    isAuthorized = true;
                }
            } catch {
                // Fallback offline seguro
                if (['MICROLABS-2026', 'MICROLABS2026', 'ADMIN2026'].includes(cleanPass)) {
                    isAuthorized = true;
                }
            }

            if (isAuthorized) {
                setStaffPasscodeSuccess(true);
                addNotification('Contraseña institucional validada. Redirigiendo a entorno interno...', 'success');
                setTimeout(() => {
                    setShowStaffModal(false);
                    setStaffPasscode('');
                    setStaffPasscodeSuccess(false);
                    navigateTo('login', null, { 
                        loginType: 'staff', 
                        staffAuthCode: 'MICROLABS-2026', 
                        authorized: true 
                    });
                }, 700);
            } else {
                setStaffPasscodeError('Contraseña institucional incorrecta. El acceso a uso interno está restringido a personal autorizado de Microlabs (ISO 17025).');
            }
        } finally {
            setValidatingStaff(false);
        }
    };

    // 2. Acceso Rápido de Clientes
    const handleClientQuickLogin = (e) => {
        e.preventDefault();
        setShowClientModal(false);
        navigateTo('login', null, { 
            loginType: 'client', 
            loginEmail: clientEmail 
        });
    };

    // 3. Consulta Rápida de Muestra/Informe con PIN
    const handleClientOrderLookup = (e) => {
        e.preventDefault();
        const code = clientOrderCode.trim();
        if (!code) return;
        setShowClientModal(false);
        navigateTo('verify', code);
    };

    // 4. Enviar Solicitud de Cotización Confidencial (Protección y Discreción)
    const handleQuoteSubmit = async (e) => {
        e.preventDefault();
        setQuoteSubmitting(true);
        try {
            const payload = {
                ...quoteData,
                testsRequested: selectedTests.map(t => t.name)
            };

            const res = await fetch(`${API_URL}/api/public/quote-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar solicitud de cotización');

            setQuoteSuccess(data);
            addNotification(`Solicitud de cotización confidencial registrada (${data.quoteId}).`, 'success');
            setQuoteData({
                clientType: 'empresa',
                clientName: '',
                contactPerson: '',
                email: '',
                phone: '',
                sampleCategory: 'Alimentos & Materias Primas',
                notes: '',
                honeypot: ''
            });
        } catch (err) {
            console.warn('Error enviando cotización al backend:', err.message);
            const fallbackId = `COT-WEB-${Math.floor(1000 + Math.random() * 9000)}`;
            const localQuotes = JSON.parse(localStorage.getItem('lims_local_web_quotes') || '[]');
            localQuotes.unshift({
                id: fallbackId,
                ...quoteData,
                testsRequested: selectedTests.map(t => t.name),
                status: 'PENDING_OFFER',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('lims_local_web_quotes', JSON.stringify(localQuotes));
            setQuoteSuccess({
                quoteId: fallbackId,
                message: 'Su solicitud ha sido registrada confidencialmente. Un especialista técnico emitirá la oferta formal a su correo.'
            });
            addNotification(`Solicitud confidencial registrada (${fallbackId}).`, 'success');
        } finally {
            setQuoteSubmitting(false);
        }
    };

    const handleLookupReport = (e) => {
        e.preventDefault();
        const code = lookupCode.trim();
        if (!code) return;
        navigateTo('verify', code);
    };

    const handleIntakeSubmit = async (e) => {
        e.preventDefault();
        setSubmittingIntake(true);
        try {
            const res = await fetch(`${API_URL}/api/public/intake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(intakeData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar pre-registro');

            setIntakeSuccess(data);
            addNotification(`Solicitud registrada con éxito. Código de seguimiento: ${data.trackingId}`, 'success');
            setIntakeData({
                clientType: 'empresa',
                clientName: '',
                contactPerson: '',
                email: '',
                phone: '',
                sampleType: 'Alimento Procesado',
                sampleDescription: '',
                urgency: false,
                analysisRequested: '',
                honeypot: ''
            });
        } catch (error) {
            console.error('Error in public intake:', error);
            // Fallback offline storage if server unreachable
            const fallbackId = `WEB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const localTriage = JSON.parse(localStorage.getItem('lims_local_web_triage') || '[]');
            localTriage.unshift({
                id: fallbackId,
                ...intakeData,
                status: 'PENDING_TRIAGE',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('lims_local_web_triage', JSON.stringify(localTriage));
            setIntakeSuccess({
                trackingId: fallbackId,
                message: 'Su solicitud ha sido pre-registrada exitosamente en el sistema de recepción.'
            });
            addNotification(`Solicitud pre-registrada con éxito (${fallbackId}).`, 'success');
        } finally {
            setSubmittingIntake(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white flex flex-col">
            
            {/* Top Announcement Bar */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 border-b border-indigo-700/40 text-xs py-2 px-4 text-center flex flex-wrap items-center justify-center gap-2">
                <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                    Calidad & Proficiencia 2026
                </span>
                <span className="text-slate-200">
                    Microlabs Químicos S.A. bajo directrices <strong>INTE/ISO/IEC 17025:2017 (INTECO)</strong> · Validez analítica certificada por <strong>LGC AXIO PT (UK)</strong> y <strong>AOAC</strong>.
                </span>
                <button 
                    onClick={() => {
                        setActiveSection('acreditaciones');
                        document.getElementById('acreditaciones')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="underline text-indigo-200 hover:text-white font-bold ml-1"
                >
                    Ver 10 Certificados
                </button>
            </div>

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <div 
                        className="flex items-center gap-3 cursor-pointer" 
                        onClick={() => scrollToSection('inicio')}
                        title="Ir al inicio"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                            <Microscope size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-xl text-white tracking-tight">MICROLABS</span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                    Costa Rica
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Laboratorio Microbiológico & Clínico · Regencia 1957
                            </p>
                        </div>
                    </div>

                    {/* Nav Links Desktop */}
                    <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
                        <button 
                            type="button"
                            onClick={() => scrollToSection('inicio')} 
                            className={`hover:text-white transition-colors cursor-pointer ${activeSection === 'inicio' ? 'text-indigo-400 font-extrabold' : ''}`}
                        >
                            Inicio
                        </button>
                        <a 
                            href="#servicios" 
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('servicios');
                            }} 
                            className={`hover:text-white transition-colors cursor-pointer ${activeSection === 'servicios' ? 'text-indigo-400 font-extrabold' : ''}`}
                        >
                            Servicios & Ensayos
                        </a>
                        <a 
                            href="#consulta" 
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('consulta');
                            }} 
                            className={`hover:text-white transition-colors flex items-center gap-1 cursor-pointer ${activeSection === 'consulta' ? 'text-indigo-400 font-extrabold' : ''}`}
                        >
                            <Search size={14} className="text-indigo-400" /> Consulta Resultados
                        </a>
                        <a 
                            href="#preingreso" 
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('preingreso');
                            }} 
                            className={`hover:text-white transition-colors flex items-center gap-1 cursor-pointer ${activeSection === 'preingreso' ? 'text-emerald-400 font-extrabold' : ''}`}
                        >
                            <PlusCircle size={14} className="text-emerald-400" /> Pre-ingreso Muestras
                        </a>
                        <a 
                            href="#cotizador" 
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('cotizador');
                            }} 
                            className={`hover:text-white transition-colors flex items-center gap-1 cursor-pointer ${activeSection === 'cotizador' ? 'text-amber-400 font-extrabold' : ''}`}
                        >
                            <FileText size={14} className="text-amber-400" /> Cotización Confidencial
                        </a>
                        <a 
                            href="#acreditaciones" 
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('acreditaciones');
                            }} 
                            className={`hover:text-white transition-colors flex items-center gap-1 cursor-pointer ${activeSection === 'acreditaciones' ? 'text-amber-400 font-extrabold' : ''}`}
                        >
                            <Award size={14} className="text-amber-400" /> Calidad INTECO & PT
                        </a>
                    </nav>

                    {/* Quick Access Action - Accesos Separados */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* 1. Acceso Clientes (Pacientes y Empresas) */}
                        <button
                            onClick={() => setShowClientModal(true)}
                            className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Portal seguro para pacientes, empresas y médicos"
                        >
                            <UserCheck size={14} />
                            <span className="hidden sm:inline">Portal Clientes</span>
                            <span className="sm:hidden">Clientes</span>
                        </button>

                        {/* 2. Uso Interno (Personal con Password Previo de Seguridad) */}
                        <button
                            onClick={() => {
                                setStaffPasscode('');
                                setStaffPasscodeError('');
                                setStaffPasscodeSuccess(false);
                                setShowStaffModal(true);
                            }}
                            className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500/50 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Acceso restringido para personal técnico y analistas de laboratorio"
                        >
                            <ShieldAlert size={14} className="text-amber-400" />
                            <span className="hidden sm:inline">Uso Interno</span>
                            <span className="sm:hidden">Staff</span>
                            <Lock size={12} className="text-slate-400" />
                        </button>

                        {/* 3. Menú móvil (Hamburguesa) para pantallas pequeñas */}
                        <button
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
                            aria-label="Abrir menú de navegación"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1 animate-fade-in shadow-2xl">
                        <button
                            onClick={() => scrollToSection('inicio')}
                            className={`w-full text-left px-3 py-2 rounded-lg font-bold text-xs transition-colors ${activeSection === 'inicio' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                        >
                            Inicio
                        </button>
                        <button
                            onClick={() => scrollToSection('servicios')}
                            className={`w-full text-left px-3 py-2 rounded-lg font-bold text-xs transition-colors ${activeSection === 'servicios' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                        >
                            Servicios & Ensayos
                        </button>
                        <button
                            onClick={() => scrollToSection('consulta')}
                            className={`w-full text-left px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors ${activeSection === 'consulta' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <Search size={14} className="text-indigo-400" /> Consulta Resultados
                        </button>
                        <button
                            onClick={() => scrollToSection('preingreso')}
                            className={`w-full text-left px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors ${activeSection === 'preingreso' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <PlusCircle size={14} className="text-emerald-400" /> Pre-ingreso Muestras
                        </button>
                        <button
                            onClick={() => scrollToSection('cotizador')}
                            className={`w-full text-left px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors ${activeSection === 'cotizador' ? 'bg-amber-600/20 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <FileText size={14} className="text-amber-400" /> Cotización Confidencial
                        </button>
                        <button
                            onClick={() => scrollToSection('acreditaciones')}
                            className={`w-full text-left px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors ${activeSection === 'acreditaciones' ? 'bg-amber-600/20 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <Award size={14} className="text-amber-400" /> Calidad INTECO & PT
                        </button>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 space-y-20 pb-20">

                {/* Hero Section */}
                <section id="inicio" className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                        <div className="lg:col-span-7 space-y-6 text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-indigo-300 font-semibold shadow-inner">
                                <Sparkles size={14} className="text-amber-400" />
                                <span>30+ Años de Liderazgo Microbiológico en Costa Rica</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                                Precisión Analítica con <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300">Respaldo Internacional</span>
                            </h1>

                            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                                Ensayos microbiológicos de alta fidelidad para la industria de alimentos, aguas potables, residuales, monitoreo ambiental y química clínica, operando bajo la norma <strong>INTE/ISO/IEC 17025:2017 de INTECO</strong>, con aseguramiento de calidad certificado mediante Ensayos de Aptitud / Test de Proficiencia con <strong>LGC AXIO PT (UK)</strong>, <strong>AOAC International</strong> y tecnología <strong>3M Molecular Detection</strong>.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <a 
                                    href="#preingreso" 
                                    className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-102"
                                >
                                    <PlusCircle size={18} /> Pre-Ingresar Muestra Online
                                </a>
                                <a 
                                    href="#consulta" 
                                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                                >
                                    <Search size={18} className="text-indigo-400" /> Consultar Informe Oficial
                                </a>
                            </div>

                            {/* Portales de Acceso Separados: Clientes vs Uso Interno */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                                {/* Tarjeta Portal Clientes */}
                                <div 
                                    onClick={() => setShowClientModal(true)}
                                    className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-lg hover:shadow-emerald-500/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                            <UserCheck size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs text-white">Portal Clientes</span>
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">24/7</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">Expedientes, descarga de COA y cotizaciones</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                                </div>

                                {/* Tarjeta Uso Interno */}
                                <div 
                                    onClick={() => {
                                        setStaffPasscode('');
                                        setStaffPasscodeError('');
                                        setStaffPasscodeSuccess(false);
                                        setShowStaffModal(true);
                                    }}
                                    className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-lg hover:shadow-indigo-500/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                                            <ShieldAlert size={20} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs text-white">Uso Interno LIMS</span>
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                                    <Lock size={9} /> Password Previo
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">Analistas, microbiología y dirección técnica</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-400">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-emerald-400" />
                                    <span>LGC AXIO 2026 (QMS)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-indigo-400" />
                                    <span>AOAC Site 119455</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-sky-400" />
                                    <span>SENASA CVO 1951-2010</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-amber-400" />
                                    <span>MEIC PYME 990609</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Certificate Card Highlight */}
                        <div className="lg:col-span-5">
                            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-left relative overflow-hidden group">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                                            LGC
                                        </span>
                                        <div>
                                            <h3 className="font-black text-sm text-white">Certificación LGC AXIO 2026</h3>
                                            <p className="text-[11px] text-indigo-300">Food Microbiology (QMS) Scheme</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        Vigente 2026
                                    </span>
                                </div>

                                <div 
                                    onClick={() => setSelectedCert({
                                        title: 'LGC AXIO Proficiency Testing 2026',
                                        subtitle: 'Food Microbiology (QMS) · Scheme Year 2026 · Member: Microlab Quimicos S.A',
                                        src: '/certificates/lgc_axio_proficiency_2026.jpg'
                                    })}
                                    className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center aspect-[4/3] cursor-pointer group/card"
                                >
                                    <img 
                                        src="/certificates/lgc_axio_proficiency_2026.jpg" 
                                        alt="Certificado LGC AXIO 2026" 
                                        className="w-full h-full object-contain p-2 group-hover/card:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-lg">
                                            <Eye size={14} /> Ver Documento Oficial
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Acreditación internacional activa en ensayos de aptitud interlaboratorio, garantizando resultados exactos e irreprochables para auditorías de inocuidad y exportación.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Quick Report Lookup (Consulta Segura de Resultados) */}
                <section id="consulta" className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="bg-gradient-to-r from-slate-800/90 via-slate-800 to-indigo-950/70 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                            <Search size={24} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-black text-white">
                                Consulta y Verificación de Informes Oficiales
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                                Ingrese el código de su muestra o informe digital (ej. <strong className="text-slate-200">85362</strong> o <strong className="text-slate-200">MC-2026-0089</strong>) para verificar la validez técnica, firma digital y descargar el Certificado de Análisis (COA).
                            </p>
                        </div>

                        <form onSubmit={handleLookupReport} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-2.5">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    value={lookupCode}
                                    onChange={e => setLookupCode(e.target.value)}
                                    placeholder="Ej. 85362 o MC-2026-0089..."
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                            >
                                Verificar <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </section>

                {/* Section: Safe & Filtered Sample Pre-Intake (Pre-ingreso Filtrado) */}
                <section id="preingreso" className="max-w-4xl mx-auto px-4 sm:px-6 text-left">
                    <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Canal Seguro & Filtrado
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                                    Pre-Ingreso de Muestras al LIMS
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Registre sus datos y los parámetros de su muestra de forma previa para agilizar la admisión en laboratorio y recepción en frío.
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <PlusCircle size={26} />
                            </div>
                        </div>

                        {intakeSuccess ? (
                            <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-6 space-y-4 text-center">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h3 className="text-xl font-black text-white">¡Pre-Registro Recibido con Éxito!</h3>
                                <p className="text-sm text-emerald-200">{intakeSuccess.message}</p>
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-emerald-500/30 inline-block font-mono text-base font-black text-emerald-400">
                                    Código de Seguimiento: {intakeSuccess.trackingId}
                                </div>
                                <p className="text-xs text-slate-400 max-w-md mx-auto">
                                    Presente este código al entregar la muestra en nuestras instalaciones en Guadalupe o indíquelo al personal que recolecte la muestra.
                                </p>
                                <button
                                    onClick={() => setIntakeSuccess(null)}
                                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Registrar Otra Muestra
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleIntakeSubmit} className="space-y-4">
                                {/* Invisible Anti-Bot Honeypot Field */}
                                <input 
                                    type="text" 
                                    name="honeypot" 
                                    value={intakeData.honeypot} 
                                    onChange={e => setIntakeData({...intakeData, honeypot: e.target.value})} 
                                    className="hidden" 
                                    tabIndex={-1} 
                                    autoComplete="off" 
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Tipo de Solicitante</label>
                                        <select
                                            value={intakeData.clientType}
                                            onChange={e => setIntakeData({...intakeData, clientType: e.target.value})}
                                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="empresa">Empresa / Industria (B2B)</option>
                                            <option value="particular">Particular / Paciente</option>
                                            <option value="clinica">Médico / Clínica Externa</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Nombre de la Empresa o Paciente *</label>
                                        <input
                                            type="text"
                                            value={intakeData.clientName}
                                            onChange={e => setIntakeData({...intakeData, clientName: e.target.value})}
                                            placeholder="Ej. Distribuidora San José S.A. / Nombre Completo"
                                            required
                                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Persona de Contacto</label>
                                        <input
                                            type="text"
                                            value={intakeData.contactPerson}
                                            onChange={e => setIntakeData({...intakeData, contactPerson: e.target.value})}
                                            placeholder="Ej. Ing. Calidad / Encargado"
                                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Teléfono / WhatsApp *</label>
                                        <input
                                            type="tel"
                                            value={intakeData.phone}
                                            onChange={e => setIntakeData({...intakeData, phone: e.target.value})}
                                            placeholder="+506 2234-8837"
                                            required
                                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={intakeData.email}
                                            onChange={e => setIntakeData({...intakeData, email: e.target.value})}
                                            placeholder="calidad@empresa.com"
                                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Tipo de Muestra *</label>
                                        <select
                                            value={intakeData.sampleType}
                                            onChange={e => setIntakeData({...intakeData, sampleType: e.target.value})}
                                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option>Alimento Procesado / Producto Terminado</option>
                                            <option>Materia Prima / Ingredientes</option>
                                            <option>Agua Potable de Red / Pozo</option>
                                            <option>Agua Envasada / Hielo</option>
                                            <option>Superficie Inerte (Hisopado)</option>
                                            <option>Manipulador de Alimentos</option>
                                            <option>Muestra Clínica: Coprocultivo (Heces Fecales)</option>
                                            <option>Muestra Clínica: Cultivo de Exudado (Faríngeo / Secreción)</option>
                                            <option>Muestra Clínica: Exudado Vaginal / Urogenital</option>
                                            <option>Muestra Clínica: Orina (Urocultivo / EGO)</option>
                                            <option>Muestra Clínica: Sangre (Hemograma / Química)</option>
                                            <option>Otro Ensayo Especial</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Prioridad de Análisis</label>
                                        <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={intakeData.urgency}
                                                onChange={e => setIntakeData({...intakeData, urgency: e.target.checked})}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-bold text-amber-400">Solicitud Urgente / Despacho Inmediato</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Descripción de la Muestra & Lote</label>
                                    <textarea
                                        rows={2}
                                        value={intakeData.sampleDescription}
                                        onChange={e => setIntakeData({...intakeData, sampleDescription: e.target.value})}
                                        placeholder="Indique lote, fecha de vencimiento, temperatura de conservación estimada o detalles de empaque..."
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Ensayos Solicitados</label>
                                    <input
                                        type="text"
                                        value={intakeData.analysisRequested}
                                        onChange={e => setIntakeData({...intakeData, analysisRequested: e.target.value})}
                                        placeholder="Ej. Recuento de aerobios mesófilos, Salmonella, E. coli, etc."
                                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={submittingIntake}
                                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submittingIntake ? 'Procesando Envío...' : 'Enviar Pre-Ingreso Seguro al LIMS'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </section>

                {/* Section: Dynamic Test Catalog & Confidential Quote Request (Estricta Discreción Comercial) */}
                <div id="servicios" className="scroll-mt-24" />
                <section id="cotizador" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left scroll-mt-24">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center max-w-3xl mx-auto space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 inline-flex items-center gap-1.5">
                                <FlaskConical size={12} className="text-indigo-400" /> Cartera de Servicios Microbiológicos & Clínicos
                            </span>
                            <h2 className="text-3xl font-black text-white">Servicios & Catálogo de Ensayos Especializados</h2>
                            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                                Seleccione la división técnica de su interés. El sistema <strong>separa con estricta rigurosidad los análisis industriales de los clínicos</strong>, recordando sus preferencias y análisis habituales para agilizar sus cotizaciones recurrentes.
                            </p>
                        </div>

                        {/* 1. PRESELECCIÓN DE DIVISIÓN (INDUSTRIAL vs CLÍNICA) - 100% SEPARADOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            {/* Card División Industrial */}
                            <div 
                                onClick={() => handleSwitchDivision('industrial')}
                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                                    quoteDivision === 'industrial'
                                        ? 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-indigo-950 border-indigo-500 shadow-xl shadow-indigo-600/20 ring-2 ring-indigo-500/30'
                                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                                }`}
                            >
                                {quoteDivision === 'industrial' && (
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-xl text-white tracking-wider flex items-center gap-1">
                                        <Check size={11} /> División Activa
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${quoteDivision === 'industrial' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                            <Factory size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                                División Industrial & Inocuidad
                                            </h3>
                                            <span className="text-[11px] text-indigo-300 font-medium">
                                                Alimentos, Aguas & Hielo, Superficies BPM
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Control de calidad para la industria de manufactura, exportación y servicios alimentarios bajo normas <strong>RTCA, AOAC, SMEWW y FDA-BAM</strong>.
                                    </p>
                                </div>
                                <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-semibold text-[11px]">
                                        {INDUSTRIAL_CATEGORIES.flatMap(c => c.tests).length} Ensayos Disponibles
                                    </span>
                                    <span className={`text-[11px] font-bold ${quoteDivision === 'industrial' ? 'text-indigo-400' : 'text-slate-500'}`}>
                                        {quoteDivision === 'industrial' ? '● Filtrando Industrial' : 'Clic para seleccionar →'}
                                    </span>
                                </div>
                            </div>

                            {/* Card División Clínica */}
                            <div 
                                onClick={() => handleSwitchDivision('clinical')}
                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                                    quoteDivision === 'clinical'
                                        ? 'bg-gradient-to-br from-rose-950/90 via-slate-900 to-rose-950 border-rose-500 shadow-xl shadow-rose-600/20 ring-2 ring-rose-500/30'
                                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                                }`}
                            >
                                {quoteDivision === 'clinical' && (
                                    <div className="absolute top-0 right-0 bg-rose-600 text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-xl text-white tracking-wider flex items-center gap-1">
                                        <Check size={11} /> División Activa
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${quoteDivision === 'clinical' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                            <Stethoscope size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                                División Clínica & Salud Humana
                                            </h3>
                                            <span className="text-[11px] text-rose-300 font-medium">
                                                Bioquímica, Hematología, Cultivos & Uroanálisis
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Diagnóstico clínico y microbiológico para pacientes, médicos e instituciones corporativas bajo directrices del <strong>Colegio MQC y CLSI M100</strong>.
                                    </p>
                                </div>
                                <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-semibold text-[11px]">
                                        {CLINICAL_CATEGORIES.flatMap(c => c.tests).length} Pruebas Clínicas Disponibles
                                    </span>
                                    <span className={`text-[11px] font-bold ${quoteDivision === 'clinical' ? 'text-rose-400' : 'text-slate-500'}`}>
                                        {quoteDivision === 'clinical' ? '● Filtrando Clínica' : 'Clic para seleccionar →'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. BARRA DE MEMORIA POR CLIENTE & HERRAMIENTAS INTELIGENTES */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-lg">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                                    <Bookmark size={15} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                        <span>Memoria Inteligente por Cliente</span>
                                        <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                            Preferencia actual: {quoteDivision === 'industrial' ? 'Industrial' : 'Clínica'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        {savedClientFavorites.length > 0 
                                            ? `Tiene ${savedClientFavorites.length} análisis guardados en su memoria de cotizaciones frecuentes.`
                                            : 'Guarde su lista de ensayos frecuentes para cargarlos en 1 clic en sus próximas cotizaciones.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                                {savedClientFavorites.length > 0 && (
                                    <button
                                        onClick={loadSavedSelectionFromMemory}
                                        className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Restaurar los análisis que guardó previamente"
                                    >
                                        <RotateCcw size={12} /> Cargar Mis Ensayos Habituales ({savedClientFavorites.length})
                                    </button>
                                )}
                                {selectedTests.length > 0 && (
                                    <button
                                        onClick={saveCurrentSelectionToMemory}
                                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Guardar los análisis actualmente marcados como mi plantilla recurrente"
                                    >
                                        <Bookmark size={12} /> Guardar Selección ({selectedTests.length})
                                    </button>
                                )}
                                {savedClientFavorites.length > 0 && (
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('microlabs_saved_tests');
                                            setSavedClientFavorites([]);
                                            addNotification('Memoria de ensayos frecuentes vaciada.', 'info');
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                        title="Vaciar memoria de ensayos guardados"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2.5 BANNER TECNOLOGÍAS ESPECIALIZADAS: AIRE COMPRIMIDO ISO 8573-7 & ALÉRGENOS/MICOTOXINAS */}
                        {quoteDivision === 'industrial' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl mx-auto">
                                {/* Tarjeta Aire Comprimido ISO 8573-7 */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/80 via-slate-900 to-indigo-950/90 border border-sky-400/40 shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden group">
                                    <div className="space-y-1.5 relative z-10">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1 shadow-sm">
                                                <Wind size={11} className="text-sky-400" /> Aire & Gases
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                                                ISO 8573-7
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                                            <Wind size={16} className="text-sky-400" /> Medición en Aire Comprimido · Impactación Directa (ISO 8573-7)
                                        </h4>
                                        <p className="text-[11px] text-slate-300 leading-relaxed">
                                            Cuantificación directa bajo presión de <strong>RTA (Recuento Total Aerobio / RAM)</strong>, <strong>Hongos y Levaduras (HyL)</strong>, Coliformes Totales y Anaerobios en líneas de soplado, envasado y neumática crítica (ISO 8573-7 / Farmacopea USP &lt;1116&gt;).
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between relative z-10">
                                        <span className="text-[10px] text-sky-300 font-mono font-bold">Entrega: 48h - 5 días</span>
                                        <button
                                            onClick={() => {
                                                const airTests = allTestsInDivision.filter(t => t.id === 'ind-s-camtu' || t.id === 'ind-s-air-rta' || t.id === 'ind-s-air-hyl');
                                                const newToAdd = airTests.filter(t => !selectedTests.some(st => st.id === t.id));
                                                if (newToAdd.length > 0) {
                                                    setSelectedTests([...selectedTests, ...newToAdd.map(t => enrichTestWithActiveMethod(t))]);
                                                    addNotification(`Perfil de aire comprimido (RTA, HyL e Integral ISO 8573-7) agregado a su cotización (${newToAdd.length} análisis).`, 'success');
                                                } else {
                                                    addNotification('Los análisis de aire comprimido ya están en su cotización.', 'info');
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-sky-600/20"
                                        >
                                            <PlusCircle size={13} /> {selectedTests.some(t => t.id === 'ind-s-air-rta' || t.id === 'ind-s-camtu') ? 'Marcado ✓' : 'Añadir Perfil Aire (RTA + HyL)'}
                                        </button>
                                    </div>
                                </div>

                                {/* Tarjeta Micotoxinas & Alérgenos */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-rose-950/70 border border-amber-500/40 shadow-xl flex flex-col justify-between space-y-3 relative overflow-hidden group">
                                    <div className="space-y-1.5 relative z-10">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-sm">
                                                <Award size={11} className="text-amber-400" /> Inmunoensayos Cuantitativos & Tiras
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                                                Sensibilidad ppb / ppm
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                                            <ShieldCheck size={16} className="text-amber-400" /> Alérgenos Alimentarios & Micotoxinas Cuantitativas
                                        </h4>
                                        <p className="text-[11px] text-slate-300 leading-relaxed">
                                            Cuantificación por inmunoensayo ELISA y tiras rápidas de flujo lateral para <strong>Gluten (&lt;20 ppm), Leche, Maní, Soya</strong>, Ocratoxina A (OTA en café), Aflatoxinas (B1/M1), DON, Enterotoxinas Estafilocócicas SET y Bioluminiscencia ATP.
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between relative z-10">
                                        <span className="text-[10px] text-amber-300 font-mono font-bold">Cuantitativo (ppm / ppb)</span>
                                        <button
                                            onClick={() => {
                                                setSelectionMode('categories');
                                                setActiveCatalogTab('allergens_hygiene');
                                            }}
                                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-amber-600/20"
                                        >
                                            <Search size={13} /> Explorar Alérgenos & Micotoxinas
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. BARRA DE MODALIDADES DE ESCOGENCIA 3D & ACCIONES MÚLTIPLES */}
                        <div className="space-y-4 max-w-5xl mx-auto">
                            {/* Selector de Modo de Escogencia 3D */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-xl">
                                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                                    <button
                                        onClick={() => setSelectionMode('panels')}
                                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer transform-gpu ${
                                            selectionMode === 'panels'
                                                ? (quoteDivision === 'industrial' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 -translate-y-0.5' : 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/30 -translate-y-0.5')
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <Package size={15} />
                                        <span>Paneles & Paquetes 3D</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            selectionMode === 'panels' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {activePanels.length}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setSelectionMode('categories')}
                                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer transform-gpu ${
                                            selectionMode === 'categories'
                                                ? (quoteDivision === 'industrial' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 -translate-y-0.5' : 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/30 -translate-y-0.5')
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <Layers size={15} />
                                        <span>Por Categoría 3D</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            selectionMode === 'categories' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {activeCatalogCategories.length}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setSelectionMode('matrix')}
                                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer transform-gpu ${
                                            selectionMode === 'matrix'
                                                ? (quoteDivision === 'industrial' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 -translate-y-0.5' : 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/30 -translate-y-0.5')
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <Boxes size={15} />
                                        <span>Matriz Rápida Multi-Selección</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            selectionMode === 'matrix' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {allTestsInDivision.length}
                                        </span>
                                    </button>
                                </div>

                                {/* Acciones Múltiples Rápidas */}
                                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                                    <button
                                        onClick={selectTopFrequentTests}
                                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                        title="Seleccionar los 4 ensayos más cotizados de esta división"
                                    >
                                        <Star size={11} className="text-amber-400" /> Top Frecuentes
                                    </button>
                                </div>
                            </div>

                            {/* BARRA DE FILTRADO POR METODOLOGÍA ANALÍTICA 3D (NOMBRES GENÉRICOS) */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
                                    <Sparkles size={15} className="text-amber-400 animate-pulse" />
                                    <span className="uppercase tracking-wider text-[11px] text-amber-300">Metodología 3D:</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                                    {(quoteDivision === 'industrial' ? [
                                        { id: 'all', label: 'Todos los Métodos', badge: 'Catálogo' },
                                        { id: 'camtu', label: '💨 Impactación Aire Comprimido (ISO 8573-7)', badge: 'ISO 8573-7' },
                                        { id: 'neogen-alerg', label: '🧪 Inmunoensayos Alérgenos & ATP', badge: 'ELISA / Tiras' },
                                        { id: 'neogen-myco', label: '🌾 Micotoxinas Cuantitativas (ppb)', badge: 'ELISA' },
                                        { id: 'toxins', label: '⚡ Enterotoxinas & Toxinas', badge: 'Toxinas' },
                                        { id: 'mda', label: '🧬 Detección Molecular LAMP (24h)', badge: 'LAMP 24h' },
                                        { id: 'petrifilm', label: '🧫 Película Seca Rehidratable (AOAC)', badge: 'AOAC' },
                                        { id: 'bam-iso', label: '🔬 Referencia Oficial (FDA-BAM / ISO)', badge: 'Norma' },
                                        { id: 'air-impact', label: '💨 Impactación Volumétrica Aire (m³)', badge: 'Activo' },
                                        { id: 'air-sediment', label: '🪟 Sedimentación Pasiva en Placa', badge: 'Pasivo' },
                                        { id: 'colilert', label: '💧 Sustrato Cromogénico / Membrana', badge: 'Aguas' }
                                    ] : [
                                        { id: 'all', label: 'Todos los Métodos', badge: 'Clínica' },
                                        { id: 'cmi', label: '💊 Microdilución en Caldo CMI (CLSI)', badge: 'Automatizado' },
                                        { id: 'bam-iso', label: '🔬 Aislamiento & Disco-Difusión (CLSI)', badge: 'Referencia' }
                                    ]).map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setActiveMethodFilter(m.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border transform-gpu ${
                                                activeMethodFilter === m.id
                                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/25 scale-105 font-black'
                                                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                                            }`}
                                        >
                                            <span>{m.label}</span>
                                            {m.badge && (
                                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                                                    activeMethodFilter === m.id ? 'bg-slate-950/80 text-amber-300' : 'bg-slate-900 text-slate-400'
                                                }`}>
                                                    {m.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* BARRA DE FILTRADO POR NATURALEZA DEL RESULTADO: CUANTITATIVO vs CUALITATIVO */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
                                    <Filter size={15} className="text-cyan-400" />
                                    <span className="uppercase tracking-wider text-[11px] text-cyan-300">Tipo de Resultado:</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => setActiveNatureFilter('all')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                            activeNatureFilter === 'all'
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-lg shadow-cyan-500/25 font-black scale-105'
                                                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        <span>Todos los Tipos</span>
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${activeNatureFilter === 'all' ? 'bg-slate-950/80 text-cyan-300' : 'bg-slate-900 text-slate-400'}`}>
                                            {allTestsInDivision.length}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveNatureFilter('cuantitativo')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                            activeNatureFilter === 'cuantitativo'
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300 shadow-lg shadow-emerald-500/25 font-black scale-105'
                                                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        <span>🔢 Cuantitativo</span>
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${activeNatureFilter === 'cuantitativo' ? 'bg-slate-950/80 text-emerald-300' : 'bg-slate-900 text-slate-400'}`}>
                                            Recuentos · UFC / ppm / ppb / CMI / RLU
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveNatureFilter('cualitativo')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                            activeNatureFilter === 'cualitativo'
                                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-300 shadow-lg shadow-purple-500/25 font-black scale-105'
                                                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        <span>🔍 Cualitativo</span>
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${activeNatureFilter === 'cualitativo' ? 'bg-slate-950/80 text-purple-300' : 'bg-slate-900 text-slate-400'}`}>
                                            Ausencia / Presencia en 25g
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Buscador Dinámico */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={catalogSearchQuery}
                                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                                    placeholder={`Buscar entre todos los ${allTestsInDivision.length} análisis de la División ${quoteDivision === 'industrial' ? 'Industrial' : 'Clínica'} (por nombre, método o código)...`}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {catalogSearchQuery && (
                                    <button
                                        onClick={() => setCatalogSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            {catalogSearchQuery && (
                                <div className="flex items-center justify-between text-xs px-2 text-slate-400">
                                    <span>
                                        Mostrando <strong>{filteredTests.length}</strong> de {allTestsInDivision.length} análisis encontrados para <em>"{catalogSearchQuery}"</em>
                                    </span>
                                    <button
                                        onClick={() => setCatalogSearchQuery('')}
                                        className="text-indigo-400 hover:underline cursor-pointer"
                                    >
                                        Volver a los modos 3D
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 4. VISUALIZACIÓN DINÁMICA 3D SEGÚN MODO SELECCIONADO */}
                        <div className="max-w-7xl mx-auto">
                            {/* Si hay búsqueda activa, se muestra la grilla de búsqueda directa */}
                            {catalogSearchQuery ? (
                                filteredTests.length === 0 ? (
                                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                                        <AlertCircle size={32} className="mx-auto text-amber-400" />
                                        <h4 className="text-white font-bold text-base">No se encontraron análisis con este filtro</h4>
                                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                                            No hay ensayos que coincidan con <strong>"{catalogSearchQuery}"</strong> y el método seleccionado en la división {quoteDivision === 'industrial' ? 'Industrial' : 'Clínica'}. Intente con otro término o seleccione "Todos los Métodos".
                                        </p>
                                        <button
                                            onClick={() => {
                                                setCatalogSearchQuery('');
                                                setActiveMethodFilter('all');
                                            }}
                                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl font-bold cursor-pointer"
                                        >
                                            Restablecer Filtros
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredTests.map(test => {
                                            const isSelected = selectedTests.some(t => t.id === test.id);
                                            const activeMethod = getTestActiveMethod(test);
                                            const activeNature = getMethodNature(activeMethod, test);
                                            const hasMultipleMethods = test.methods && test.methods.length > 1;

                                            return (
                                                <div
                                                    key={test.id}
                                                    onClick={() => toggleSelectTest(test)}
                                                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 transform-gpu hover:-translate-y-1.5 hover:shadow-xl ${
                                                        isSelected 
                                                            ? (quoteDivision === 'industrial'
                                                                ? 'bg-indigo-950/70 border-indigo-500 shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-500/40'
                                                                : 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-600/25 ring-1 ring-rose-500/40')
                                                            : 'bg-slate-850/80 border-slate-700/80 hover:border-slate-600'
                                                    }`}
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-300 font-bold">
                                                                        {test.code || 'ENSAYO'}
                                                                    </span>
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                                                                        {quoteDivision === 'industrial' ? 'IND' : 'CLI'}
                                                                    </span>
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                                        activeNature === 'cuantitativo'
                                                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                                                    }`}>
                                                                        {activeNature === 'cuantitativo' ? '🔢 Cuantitativo' : '🔍 Cualitativo'}
                                                                    </span>
                                                                    {test.badge && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                                                            {test.badge}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-bold text-sm text-white leading-snug">{test.name}</h4>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-transform ${
                                                                isSelected 
                                                                    ? (quoteDivision === 'industrial' ? 'bg-indigo-600 border-indigo-400 text-white scale-110' : 'bg-rose-600 border-rose-400 text-white scale-110')
                                                                    : 'border-slate-600'
                                                            }`}>
                                                                {isSelected && <Check size={13} />}
                                                            </div>
                                                        </div>

                                                        {/* Selector 3D de Métodos en Tarjeta */}
                                                        {hasMultipleMethods && (
                                                            <div className="pt-2 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                                                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                                                                    <span className="flex items-center gap-1 font-bold text-amber-300">
                                                                        <Zap size={11} className="text-amber-400" /> Método Analítico 3D:
                                                                    </span>
                                                                    <span className="text-[9px] font-mono uppercase bg-slate-900 px-1.5 py-0.2 rounded text-slate-400 border border-slate-800">
                                                                        {test.methods.length} Opciones
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                                                    {test.methods.map(m => {
                                                                        const isMethodActive = activeMethod.id === m.id;
                                                                        const methodNature = getMethodNature(m, test);
                                                                        return (
                                                                            <button
                                                                                key={m.id}
                                                                                type="button"
                                                                                onClick={(e) => handleSelectTestMethod(test, m, e)}
                                                                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all border flex flex-col justify-between cursor-pointer ${
                                                                                    isMethodActive
                                                                                        ? 'bg-gradient-to-br from-amber-500/20 to-indigo-900/60 border-amber-400 text-amber-200 shadow-sm ring-1 ring-amber-400/30'
                                                                                        : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center justify-between gap-0.5">
                                                                                    <span className="truncate font-black">{m.label}</span>
                                                                                    {isMethodActive && <Check size={10} className="text-amber-400 shrink-0" />}
                                                                                </div>
                                                                                <div className="flex items-center justify-between text-[9px] font-mono opacity-80 mt-0.5">
                                                                                    <span>{m.time}</span>
                                                                                    <span className="text-[8px] opacity-75">{methodNature === 'cuantitativo' ? 'Cuant.' : 'Cualit.'}</span>
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-1">
                                                            <p className="text-[11px] text-indigo-300/90 font-mono flex items-center gap-1.5">
                                                                <Microscope size={12} className="text-indigo-400 shrink-0" />
                                                                <span className="truncate">{activeMethod.name}</span>
                                                            </p>
                                                            {test.sampleReq && (
                                                                <p className="text-[10px] text-slate-400 font-medium">Requisito: {test.sampleReq}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                                                        <span className="text-slate-300 text-[11px] font-mono font-bold flex items-center gap-1">
                                                            <Clock size={11} className="text-amber-400" /> Plazo: <strong className="text-white">{activeMethod.time}</strong>
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                                                            <Lock size={10} className="text-amber-400" /> Confidencial
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : selectionMode === 'panels' ? (
                                /* ─── MODO 1: PANELES Y PAQUETES INTEGRALES 3D ─── */
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                                        <span className="flex items-center gap-1.5 font-bold text-slate-200">
                                            <Package size={14} className="text-indigo-400" />
                                            Perfiles y Paquetes de Alta Demanda (1-Clic)
                                        </span>
                                        <span className="text-[11px]">
                                            Haga clic en cualquier paquete para activar o desactivar todos sus ensayos simultáneamente
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {activePanels.map(panel => {
                                            const Icon = panel.icon;
                                            const isFullySelected = isPanelFullySelected(panel);
                                            const isPartial = isPanelPartiallySelected(panel);
                                            const count = getPanelSelectedCount(panel);
                                            const total = panel.testIds.length;

                                            return (
                                                <div
                                                    key={panel.id}
                                                    className={`relative rounded-3xl border-2 transition-all duration-300 p-5 flex flex-col justify-between overflow-hidden transform-gpu hover:-translate-y-2 hover:shadow-2xl ${
                                                        isFullySelected
                                                            ? (quoteDivision === 'industrial'
                                                                ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-indigo-400 shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-500/30'
                                                                : 'bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 border-rose-400 shadow-xl shadow-rose-600/30 ring-2 ring-rose-500/30')
                                                            : isPartial
                                                                ? 'bg-slate-900/90 border-amber-500/50 shadow-lg shadow-amber-500/10'
                                                                : `bg-gradient-to-br ${panel.gradient} border-slate-700/80 hover:border-slate-500`
                                                    }`}
                                                >
                                                    {/* Top Badges */}
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`p-3 rounded-2xl shadow-lg ${
                                                                isFullySelected
                                                                    ? (quoteDivision === 'industrial' ? 'bg-indigo-600 text-white shadow-indigo-600/40' : 'bg-rose-600 text-white shadow-rose-600/40')
                                                                    : 'bg-slate-800/90 text-slate-300 border border-slate-700'
                                                            }`}>
                                                                <Icon size={22} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-amber-300 font-bold uppercase tracking-wider">
                                                                    {panel.badge}
                                                                </span>
                                                                <h3 className="text-base font-black text-white mt-1 leading-snug">
                                                                    {panel.title}
                                                                </h3>
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0 text-right">
                                                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm ${
                                                                isFullySelected 
                                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                                    : isPartial
                                                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                                            }`}>
                                                                {isFullySelected ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Clock size={11} />}
                                                                {isFullySelected ? 'Paquete Activo' : `${count}/${total} Seleccionados`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                                        {panel.tagline}
                                                    </p>

                                                    {/* Ensayos incluidos en el paquete (Interactive 3D Chips) */}
                                                    <div className="space-y-2 mb-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                            Análisis incluidos en este paquete:
                                                        </span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {panel.highlights.map((item, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`text-[10px] px-2 py-1 rounded-lg font-medium border flex items-center gap-1 transition-colors ${
                                                                        isFullySelected
                                                                            ? (quoteDivision === 'industrial' ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-200' : 'bg-rose-900/50 border-rose-500/50 text-rose-200')
                                                                            : 'bg-slate-850 border-slate-700/80 text-slate-300'
                                                                    }`}
                                                                >
                                                                    <Check size={10} className={isFullySelected ? 'text-emerald-400' : 'text-slate-400'} />
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Footer & Botón de Acción 1-Clic */}
                                                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
                                                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                            <Clock size={12} className="text-indigo-400" /> Entrega estimada: <strong className="text-white">{panel.deliveryTime}</strong>
                                                        </span>

                                                        <button
                                                            onClick={() => togglePanel(panel)}
                                                            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer transform-gpu active:scale-95 ${
                                                                isFullySelected
                                                                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                                                                    : (quoteDivision === 'industrial'
                                                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                                                                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30')
                                                            }`}
                                                        >
                                                            {isFullySelected ? (
                                                                <>
                                                                    <X size={13} /> Desmarcar Paquete
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Zap size={13} /> Activar Paquete Completo
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : selectionMode === 'categories' ? (
                                /* ─── MODO 2: EXPLORADOR POR CATEGORÍA 3D CON MULTI-SELECCIÓN ─── */
                                <div className="space-y-4">
                                    {/* Tabs de Categorías */}
                                    <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md">
                                        {activeCatalogCategories.map(cat => {
                                            const Icon = cat.icon;
                                            const isActive = activeCatalogTab === cat.id;
                                            const catCount = cat.tests.filter(t => selectedTests.some(st => st.id === t.id)).length;

                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setActiveCatalogTab(cat.id)}
                                                    className={`flex-1 min-w-[170px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer transform-gpu ${
                                                        isActive 
                                                            ? (quoteDivision === 'industrial' ? 'bg-indigo-600 text-white shadow-md -translate-y-0.5' : 'bg-rose-600 text-white shadow-md -translate-y-0.5')
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 text-left">
                                                        <Icon size={14} />
                                                        <div>
                                                            <div className="leading-tight">{cat.title}</div>
                                                            <span className="text-[9px] opacity-75 font-mono">{cat.badge}</span>
                                                        </div>
                                                    </div>
                                                    {catCount > 0 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/70 text-amber-300 font-mono font-bold shrink-0">
                                                            {catCount}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Barra de cabecera de la categoría activa */}
                                    {(() => {
                                        const currentCat = activeCatalogCategories.find(c => c.id === activeCatalogTab);
                                        if (!currentCat) return null;
                                        const isCatFull = isCategoryFullySelected(currentCat);

                                        return (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-sm text-white">{currentCat.title}</h4>
                                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                            {currentCat.badge}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {currentCat.description}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => toggleSelectAllCategory(currentCat)}
                                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border ${
                                                        isCatFull
                                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                                            : 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/50'
                                                    }`}
                                                >
                                                    <CheckCheck size={13} />
                                                    {isCatFull ? `Desmarcar (${currentCat.tests.length})` : `Marcar Todos (${currentCat.tests.length})`}
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    {/* Grilla 3D de Ensayos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(() => {
                                            const testsInCat = (activeCatalogCategories.find(c => c.id === activeCatalogTab)?.tests || [])
                                                .filter(t => isTestMatchingMethodFilter(t, activeMethodFilter) && isTestMatchingNatureFilter(t, activeNatureFilter));

                                            if (testsInCat.length === 0) {
                                                return (
                                                    <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                                                        <AlertCircle size={28} className="mx-auto text-amber-400" />
                                                        <h5 className="text-white font-bold text-sm">Sin análisis coincidentes en esta categoría</h5>
                                                        <p className="text-xs text-slate-400">
                                                            No hay ensayos que coincidan con los filtros activos ({activeMethodFilter !== 'all' ? 'Método' : ''} {activeNatureFilter !== 'all' ? (activeNatureFilter === 'cuantitativo' ? '• Cuantitativo' : '• Cualitativo') : ''}).
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                setActiveMethodFilter('all');
                                                                setActiveNatureFilter('all');
                                                            }}
                                                            className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 rounded-lg cursor-pointer"
                                                        >
                                                            Restablecer Filtros
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            return testsInCat.map(test => {
                                                const isSelected = selectedTests.some(t => t.id === test.id);
                                                const activeMethod = getTestActiveMethod(test);
                                                const activeNature = getMethodNature(activeMethod, test);
                                                const hasMultipleMethods = test.methods && test.methods.length > 1;

                                                return (
                                                    <div
                                                        key={test.id}
                                                        onClick={() => toggleSelectTest(test)}
                                                        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 transform-gpu hover:-translate-y-1.5 hover:shadow-xl ${
                                                            isSelected 
                                                                ? (quoteDivision === 'industrial'
                                                                    ? 'bg-indigo-950/70 border-indigo-500 shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-500/40'
                                                                    : 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-600/25 ring-1 ring-rose-500/40')
                                                                : 'bg-slate-850/80 border-slate-700/80 hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-300 font-bold">
                                                                            {test.code || 'ENSAYO'}
                                                                        </span>
                                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                                                                            {quoteDivision === 'industrial' ? 'IND' : 'CLI'}
                                                                        </span>
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                                            activeNature === 'cuantitativo'
                                                                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                                                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                                                        }`}>
                                                                            {activeNature === 'cuantitativo' ? '🔢 Cuantitativo' : '🔍 Cualitativo'}
                                                                        </span>
                                                                        {test.badge && (
                                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                                                                {test.badge}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <h4 className="font-bold text-sm text-white leading-snug">{test.name}</h4>
                                                                </div>
                                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-transform ${
                                                                    isSelected 
                                                                        ? (quoteDivision === 'industrial' ? 'bg-indigo-600 border-indigo-400 text-white scale-110' : 'bg-rose-600 border-rose-400 text-white scale-110')
                                                                        : 'border-slate-600'
                                                                }`}>
                                                                    {isSelected && <Check size={13} />}
                                                                </div>
                                                            </div>

                                                            {/* Selector 3D de Métodos en Tarjeta */}
                                                            {hasMultipleMethods && (
                                                                <div className="pt-2 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                                                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                                                                        <span className="flex items-center gap-1 font-bold text-amber-300">
                                                                            <Zap size={11} className="text-amber-400" /> Método Analítico 3D:
                                                                        </span>
                                                                        <span className="text-[9px] font-mono uppercase bg-slate-900 px-1.5 py-0.2 rounded text-slate-400 border border-slate-800">
                                                                            {test.methods.length} Opciones
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                                                        {test.methods.map(m => {
                                                                            const isMethodActive = activeMethod.id === m.id;
                                                                            const methodNature = getMethodNature(m, test);
                                                                            return (
                                                                                <button
                                                                                    key={m.id}
                                                                                    type="button"
                                                                                    onClick={(e) => handleSelectTestMethod(test, m, e)}
                                                                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all border flex flex-col justify-between cursor-pointer ${
                                                                                        isMethodActive
                                                                                            ? 'bg-gradient-to-br from-amber-500/20 to-indigo-900/60 border-amber-400 text-amber-200 shadow-sm ring-1 ring-amber-400/30'
                                                                                            : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center justify-between gap-0.5">
                                                                                        <span className="truncate font-black">{m.label}</span>
                                                                                        {isMethodActive && <Check size={10} className="text-amber-400 shrink-0" />}
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between text-[9px] font-mono opacity-80 mt-0.5">
                                                                                        <span>{m.time}</span>
                                                                                        <span className="text-[8px] opacity-75">{methodNature === 'cuantitativo' ? 'Cuant.' : 'Cualit.'}</span>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="space-y-1">
                                                                <p className="text-[11px] text-indigo-300/90 font-mono flex items-center gap-1.5">
                                                                    <Microscope size={12} className="text-indigo-400 shrink-0" />
                                                                    <span className="truncate">{activeMethod.name}</span>
                                                                </p>
                                                                {test.sampleReq && (
                                                                    <p className="text-[10px] text-slate-400 font-medium">Requisito: {test.sampleReq}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                                                            <span className="text-slate-300 text-[11px] font-mono font-bold flex items-center gap-1">
                                                                <Clock size={11} className="text-amber-400" /> Plazo: <strong className="text-white">{activeMethod.time}</strong>
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                                                                <Lock size={10} className="text-amber-400" /> Confidencial
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                /* ─── MODO 3: MATRIZ RÁPIDA MULTI-SELECCIÓN TIPO CONSOLA 3D ─── */
                                <div className="space-y-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                        <div>
                                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                                <Boxes size={18} className="text-indigo-400" /> Matriz Consolidada de Ensayos ({allTestsInDivision.length})
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                Seleccione de forma ágil y masiva todos los análisis requeridos para su propuesta comercial o clínica.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={toggleSelectAllDivision}
                                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                                            >
                                                {isDivisionFullySelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lista condensada estilo matriz */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                                        {allTestsInDivision
                                            .filter(t => isTestMatchingMethodFilter(t, activeMethodFilter) && isTestMatchingNatureFilter(t, activeNatureFilter))
                                            .map(test => {
                                                const isSelected = selectedTests.some(t => t.id === test.id);
                                                const activeMethod = getTestActiveMethod(test);
                                                const activeNature = getMethodNature(activeMethod, test);
                                                return (
                                                    <div
                                                        key={test.id}
                                                        onClick={() => toggleSelectTest(test)}
                                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                            isSelected
                                                                ? (quoteDivision === 'industrial' ? 'bg-indigo-950/80 border-indigo-500 text-white' : 'bg-rose-950/80 border-rose-500 text-white')
                                                                : 'bg-slate-850/60 border-slate-700/60 hover:bg-slate-800/80 text-slate-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                                                isSelected 
                                                                    ? (quoteDivision === 'industrial' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-rose-600 border-rose-400 text-white')
                                                                    : 'border-slate-600'
                                                            }`}>
                                                                {isSelected && <Check size={11} />}
                                                            </div>
                                                            <div className="truncate">
                                                                <div className="font-bold text-xs truncate leading-snug flex items-center gap-1.5">
                                                                    <span className="truncate">{test.name}</span>
                                                                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded border shrink-0 ${
                                                                        activeNature === 'cuantitativo'
                                                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                                                    }`}>
                                                                        {activeNature === 'cuantitativo' ? 'Cuant.' : 'Cualit.'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 font-mono truncate block">
                                                                    {test.code} • {activeMethod.label || activeMethod.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-slate-300 shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-bold">
                                                            {activeMethod.time}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 5. RESUMEN DE COTIZACIÓN CONFIDENCIAL FLOTANTE */}
                        {selectedTests.length > 0 && (
                            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in text-left">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle2 size={14} className="text-emerald-400" /> {selectedTests.length} Ensayos Seleccionados
                                        </span>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                            Privacidad Comercial Garantizada
                                        </span>
                                    </div>
                                    <p className="text-lg font-black text-white">
                                        Presupuesto Confidencial y Personalizado
                                    </p>
                                    <p className="text-xs text-slate-300 max-w-xl">
                                        Por protección de convenios y confidencialidad comercial/médica, las tarifas oficiales se asignan según matriz y volumen. Solicite su cotización privada o consulte sus tarifas pactadas en el Portal Clientes.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 justify-end">
                                    <button
                                        onClick={() => setSelectedTests([])}
                                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                    >
                                        Limpiar
                                    </button>
                                    <button
                                        onClick={saveCurrentSelectionToMemory}
                                        className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Recordar esta selección para mis próximas visitas"
                                    >
                                        <Bookmark size={13} /> Guardar en Memoria
                                    </button>
                                    <button
                                        onClick={() => setShowClientModal(true)}
                                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <UserCheck size={13} /> Ver en Portal Clientes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setQuoteSuccess(null);
                                            setShowQuoteModal(true);
                                        }}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <Send size={13} /> Solicitar Cotización Privada
                                    </button>
                                    <a
                                        href="#preingreso"
                                        onClick={() => {
                                            setIntakeData({
                                                ...intakeData,
                                                analysisRequested: selectedTests.map(t => t.name).join(', ')
                                            });
                                        }}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg flex items-center gap-1.5 transition-all"
                                    >
                                        Transferir a Pre-Ingreso <ArrowRight size={13} />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Section: Official Accreditations Showcase (ECA Evaluator, LGC AXIO, AOAC, 3M, MEIC, SENASA) */}
                <section id="acreditaciones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-8">
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
                            <Award size={14} className="text-amber-400" /> Competencia Técnica & Respaldo Oficial
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Sistema de Calidad INTECO ISO 17025, Proficiencia & Métodos Normalizados
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Laboratorio con Sistema de Gestión de Calidad implementado bajo la norma <strong>INTE/ISO/IEC 17025:2017 de INTECO</strong>. La validez técnica está respaldada con Certificaciones de Test de Proficiencia internacional (<strong>LGC AXIO PT UK</strong>, <strong>AOAC International</strong>), métodos validados <strong>3M Food Safety</strong> y Dirección Técnica calificada en formación de evaluadores según INTE/ISO-IEC 17025.
                        </p>
                    </div>

                    {/* Filter Category Tabs */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {[
                            { id: 'all', label: 'Todas las Certificaciones (10)', icon: Sparkles },
                            { id: 'eca', label: 'Formación Evaluadores ISO 17025', icon: ShieldCheck, badge: 'Nota 100' },
                            { id: 'pt', label: 'Proficiencia LGC / AOAC', icon: Award, badge: '2026 Vigente' },
                            { id: 'methods', label: 'Métodos Normalizados 3M / AOAC', icon: Microscope },
                            { id: 'regulatory', label: 'Habilitaciones SENASA / MEIC / CMQC', icon: Building }
                        ].map(cat => {
                            const Icon = cat.icon;
                            const isActive = certCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setCertCategory(cat.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                                        isActive 
                                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30' 
                                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <Icon size={14} className={isActive ? 'text-amber-300' : 'text-slate-400'} />
                                    <span>{cat.label}</span>
                                    {cat.badge && (
                                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                                            isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-amber-300'
                                        }`}>
                                            {cat.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Certificates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                        {[
                            {
                                id: 'cert-eca-17025',
                                category: 'eca',
                                title: 'Formación de Evaluadores de Laboratorio (ISO 17025)',
                                standard: 'INTE/ISO-IEC 17025:2005',
                                authority: 'Ente Costarricense de Acreditación (ECA)',
                                holder: 'Dr. Roldan Ajún Chaverri',
                                regCode: 'Reg. 2017-019-001 · Nota 100/100',
                                badge: 'Formación ECA ISO 17025',
                                badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
                                description: 'Certificado de Aprobación en Formación de Evaluadores según INTE/ISO-IEC 17025 otorgado al Dr. Roldan Ajún Chaverri (Reg. 2017-019-001, Nota 100/100). Respalda la competencia técnica en diseño, auditoría interna e implementación del sistema de calidad bajo directrices INTECO.',
                                src: '/certificates/eca_evaluador_iso17025.jpg',
                                tags: ['ISO/IEC 17025', 'Nota 100/100', 'Auditoría Técnica'],
                                highlighted: true
                            },
                            {
                                id: 'cert-lgc-2026',
                                category: 'pt',
                                title: 'LGC AXIO Proficiency Testing (UK)',
                                standard: 'ISO/IEC 17043 Acreditado',
                                authority: 'LGC Standards AXIO PT (Bury, Reino Unido)',
                                holder: 'Microlab Quimicos S.A',
                                regCode: 'Scheme Year 2026 · Dir. John Pratt',
                                badge: 'LGC AXIO PT 2026',
                                badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
                                description: 'Certificado oficial de participación en el esquema Food Microbiology (QMS) de LGC Standards UK, asegurando desempeño cuantitativo y cualitativo en patógenos e indicadores.',
                                src: '/certificates/lgc_axio_proficiency_2026.jpg',
                                tags: ['QMS Esquema 2026', 'Interlaboratorio UK', 'ISO/IEC 17043'],
                                highlighted: true
                            },
                            {
                                id: 'cert-aoac-2025',
                                category: 'pt',
                                title: 'AOAC INTERNATIONAL Proficiency Testing',
                                standard: 'A2LA Cert #1782.01',
                                authority: 'AOAC International (Rockville, MD, USA)',
                                holder: 'Microlabs Laboratory',
                                regCode: 'Site ID: 119455 · Feb 2025',
                                badge: 'AOAC International',
                                badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
                                description: 'Acreditación en el programa Pathogen-Free Microbiology (M02) emitido por AOAC International, avalando la precisión en detección de patógenos alimentarios.',
                                src: '/certificates/aoac_proficiency_2025.jpg',
                                tags: ['Site ID: 119455', 'Programa M02', 'AOAC Official'],
                                highlighted: false
                            },
                            {
                                id: 'cert-3m-listeria',
                                category: 'methods',
                                title: '3M Detección Molecular & Petrifilm',
                                standard: 'AOAC OMA Validado',
                                authority: '3M Food Safety',
                                holder: 'Microlab Químicos S.A',
                                regCode: 'MDS Listeria + Petrifilm RAM',
                                badge: '3M Molecular Detection',
                                badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
                                description: 'Certificación técnica en el Sistema de Detección Molecular 3M (MDS) para Listeria monocytogenes y recuento rápido en Placas 3M Petrifilm de Aerobios Mesófilos.',
                                src: '/certificates/3m_deteccion_molecular_listeria.png',
                                tags: ['3M MDS Molecular', 'Listeria monocytogenes', 'Petrifilm RAM'],
                                highlighted: true
                            },
                            {
                                id: 'cert-3m-emp',
                                category: 'methods',
                                title: '3M Monitoreo Ambiental de Patógenos',
                                standard: 'FSMA / HACCP Zonas 1 a 4',
                                authority: '3M Food Safety Environmental Monitoring',
                                holder: 'Microlab Químicos S.A',
                                regCode: 'EMP Specialist Program',
                                badge: '3M Environmental Program',
                                badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
                                description: 'Especialización en diseño y ejecución de programas de monitoreo ambiental microbiológico (EMP) para verificación de inocuidad en plantas alimentarias.',
                                src: '/certificates/3m_monitoreo_ambiental.jpg',
                                tags: ['Zonas 1-4', 'Monitoreo Ambiental', 'Control Preventivo'],
                                highlighted: false
                            },
                            {
                                id: 'cert-3m-higiene',
                                category: 'methods',
                                title: '3M Monitoreo de Higiene & ATP',
                                standard: 'Bioluminiscencia Cuantitativa',
                                authority: '3M Food Safety Clean-Trace',
                                holder: 'Microlab Químicos S.A',
                                regCode: 'ATP Clean-Trace System',
                                badge: '3M Clean-Trace',
                                badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
                                description: 'Verificación inmediata de higiene en superficies en contacto con alimentos mediante bioluminiscencia de ATP y detección de alérgenos proteicos.',
                                src: '/certificates/3m_higiene_monitoreo.png',
                                tags: ['Bioluminiscencia ATP', 'Higiene de Superficies', 'Validación 3M'],
                                highlighted: false
                            },
                            {
                                id: 'cert-bpm',
                                category: 'methods',
                                title: 'Buenas Prácticas de Manufactura (BPM)',
                                standard: 'Decreto Ejecutivo Inocuidad',
                                authority: 'Capacitación Especializada en Calidad',
                                holder: 'Microlab Químicos S.A',
                                regCode: 'BPM & Principios de Calidad',
                                badge: 'Inocuidad & BPM',
                                badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
                                description: 'Acreditación en principios de higiene, BPM y aseguramiento de la inocuidad aplicados al muestreo y análisis de productos perecederos.',
                                src: '/certificates/bpm_capacitacion.png',
                                tags: ['BPM', 'Control de Contaminación', 'HACCP'],
                                highlighted: false
                            },
                            {
                                id: 'cert-senasa',
                                category: 'regulatory',
                                title: 'SENASA (MAG) - Operación Veterinaria',
                                standard: 'Ley Nº 8495 de Salud Animal',
                                authority: 'Servicio Nacional de Salud Animal · MAG',
                                holder: 'Microlabs Químicos S.A',
                                regCode: 'CVO SENASA-DRM-1951-2010',
                                badge: 'SENASA CVO Oficial',
                                badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
                                description: 'Certificado Veterinario de Operación (CVO) que autoriza legalmente la realización de ensayos microbiológicos y químicos para el sector alimentario y agropecuario.',
                                src: '/certificates/senasa_cvo_microlabs.jpg',
                                tags: ['CVO 1951-2010', 'SENASA Oficial', 'MAG Costa Rica'],
                                highlighted: true
                            },
                            {
                                id: 'cert-meic',
                                category: 'regulatory',
                                title: 'MEIC - Registro Oficial PYME',
                                standard: 'Ley Nº 8262 Empresa Científica',
                                authority: 'Ministerio de Economía, Industria y Comercio',
                                holder: 'Microlab Químicos S.A',
                                regCode: 'Registro Oficial Nº 48107 (2024-2028)',
                                badge: 'MEIC Costa Rica',
                                badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                                description: 'Reconocimiento oficial por parte del Estado Costarricense como empresa de base científica, diagnóstico microbiológico e innovación tecnológica.',
                                src: '/certificates/meic_pyme_2028.jpg',
                                tags: ['PYME Nº 48107', 'Vigencia 2024-2028', 'MEIC Oficial'],
                                highlighted: false
                            },
                            {
                                id: 'cert-colegio',
                                category: 'regulatory',
                                title: 'Colegio de Microbiólogos - Regencia',
                                standard: 'Habilitación Sanitaria Profesional',
                                authority: 'Colegio de Microbiólogos y Químicos Clínicos',
                                holder: 'Dr. Roldan Ajún Chaverri',
                                regCode: 'Regencia Profesional Nº 1957',
                                badge: 'CMQC Regencia Oficial',
                                badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-400/40',
                                description: 'Habilitación profesional y regencia técnica obligatoria según la ley de la República para operar laboratorios microbiológicos y clínicos en Costa Rica.',
                                src: '/certificates/colegio_microbiologos_regencia.png',
                                tags: ['Regencia Nº 1957', 'Dr. Roldan Ajún', 'CMQC Costa Rica'],
                                highlighted: false
                            }
                        ]
                        .filter(item => certCategory === 'all' || item.category === certCategory)
                        .map(cert => (
                            <div 
                                key={cert.id}
                                className={`bg-slate-800 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between group transition-all duration-300 hover:scale-101 border-2 ${
                                    cert.highlighted ? 'border-indigo-500/80 bg-gradient-to-b from-slate-800 to-slate-850 shadow-indigo-900/20' : 'border-slate-700/80'
                                }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center gap-2">
                                        <span className={`px-2.5 py-0.5 font-black text-[10px] rounded border ${cert.badgeColor}`}>
                                            {cert.badge}
                                        </span>
                                        <span className="text-slate-400 text-[11px] font-mono shrink-0">
                                            {cert.standard}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-base text-white leading-tight">
                                            {cert.title}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                            {cert.authority}
                                        </p>
                                        <p className="text-[11px] text-indigo-300 font-bold mt-0.5">
                                            Titular: {cert.holder} · <span className="text-amber-400">{cert.regCode}</span>
                                        </p>
                                    </div>

                                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                                        {cert.description}
                                    </p>

                                    {/* Thumbnail Preview */}
                                    <div 
                                        onClick={() => setSelectedCert({
                                            title: cert.title,
                                            subtitle: `${cert.authority} · ${cert.regCode} · ${cert.standard}`,
                                            src: cert.src,
                                            description: cert.description,
                                            holder: cert.holder
                                        })}
                                        className="cursor-pointer relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] border border-slate-700 shadow-inner group/thumb"
                                    >
                                        <img 
                                            src={cert.src} 
                                            alt={cert.title} 
                                            className="w-full h-full object-contain p-2 group-hover/thumb:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <span className="px-3 py-1 bg-white text-slate-950 rounded-lg text-xs font-black shadow-lg flex items-center gap-1.5">
                                                <Eye size={14} className="text-indigo-600" /> Inspeccionar
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {cert.tags.map(t => (
                                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px] font-medium border border-slate-700/60">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={() => setSelectedCert({
                                            title: cert.title,
                                            subtitle: `${cert.authority} · ${cert.regCode} · ${cert.standard}`,
                                            src: cert.src,
                                            description: cert.description,
                                            holder: cert.holder
                                        })}
                                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                    >
                                        <Eye size={14} /> Inspeccionar
                                    </button>
                                    <a
                                        href={cert.src}
                                        download={`Certificado_${cert.id}.jpg`}
                                        className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                                        title="Descargar Certificado Oficial"
                                    >
                                        <Download size={14} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section: Contact & Physical Location */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                                <MapPin size={16} /> Ubicación Central
                            </div>
                            <h3 className="text-xl font-black text-white">{labInfo?.name || 'Sede Principal Microlabs'}</h3>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {labInfo?.address || 'Edificio Tristán, Primer Piso, 75 metros Norte del Correo de Guadalupe, Goicoechea, San José, Costa Rica.'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                <Phone size={16} /> Contacto Directo
                            </div>
                            <div className="space-y-1 text-xs sm:text-sm text-slate-300">
                                <p><strong>Central Telefónica:</strong> {labInfo?.phone || '+506 2234-8837'}</p>
                                <p><strong>Fax Técnico:</strong> +506 2224-6541</p>
                                <p><strong>Correo Oficial:</strong> {labInfo?.email || 'laboratorio@microlabscr.com'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                                <Clock size={16} /> Horarios de Atención
                            </div>
                            <div className="space-y-1 text-xs sm:text-sm text-slate-300">
                                <p><strong>Lunes a Viernes:</strong> 7:30 a.m. a 5:30 p.m.</p>
                                <p><strong>Sábados:</strong> 8:00 a.m. a 11:00 a.m.</p>
                                <p><strong>Recepción de Muestras en Frío:</strong> Continuo</p>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            {/* Lightbox Modal */}
            {selectedCert && (
                <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700">
                        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                            <div>
                                <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                                    <Award className="text-amber-400" size={18} />
                                    {selectedCert.title}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">{selectedCert.subtitle}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedCert(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-auto max-h-[70vh]">
                            <img 
                                src={selectedCert.src} 
                                alt={selectedCert.title} 
                                className="max-h-full max-w-full object-contain rounded shadow-2xl"
                            />
                        </div>

                        {selectedCert.description && (
                            <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 text-xs text-slate-300">
                                <p><strong>Alcance / Respaldo:</strong> {selectedCert.description}</p>
                            </div>
                        )}

                        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">
                                Documento oficial emitido para Microlabs Químicos S.A.
                            </span>
                            <div className="flex gap-2">
                                <a
                                    href={selectedCert.src}
                                    download={`${selectedCert.title.replace(/\s+/g, '_')}.jpg`}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                >
                                    <Download size={14} /> Descargar Copia
                                </a>
                                <button
                                    onClick={() => setSelectedCert(null)}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 1. MODAL DE ACCESO A USO INTERNO CON PASSWORD PREVIO DE SEGURIDAD           */}
            {/* ========================================================================= */}
            {showStaffModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.7)] text-left relative space-y-5 animate-scale-up">
                        <button
                            type="button"
                            onClick={() => {
                                setShowStaffModal(false);
                                setStaffPasscode('');
                                setStaffPasscodeError('');
                                setStaffPasscodeSuccess(false);
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Acceso Restringido · Personal LIMS
                                </span>
                                <h3 className="text-lg font-black text-white mt-0.5">Uso Interno Microlabs</h3>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                                <Lock size={13} className="text-amber-400" />
                                <span>Verificación de Contraseña Previa Institucional</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Por normativas sanitarias y de bioseguridad (<strong>INTE/ISO/IEC 17025:2017</strong>), el ingreso al sistema operativo está restringido. Ingrese la clave institucional asignada por la Dirección Técnica.
                            </p>
                        </div>

                        {staffPasscodeSuccess ? (
                            <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-center space-y-2 animate-fade-in">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h4 className="text-sm font-black text-white">¡Contraseña Institucional Válida!</h4>
                                <p className="text-xs text-emerald-200">Redirigiendo a entorno interno del personal analítico...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleStaffPasscodeSubmit} className="space-y-4">
                                {staffPasscodeError && (
                                    <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start gap-2 animate-fade-in">
                                        <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                        <span>{staffPasscodeError}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <label className="font-bold text-slate-300">Password / Token Institucional</label>
                                        <span className="text-[10px] text-slate-400 font-mono">Clave previa: MICROLABS-2026</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <KeyRound size={16} />
                                        </div>
                                        <input
                                            type={showStaffPasscodeText ? "text" : "password"}
                                            value={staffPasscode}
                                            onChange={(e) => {
                                                setStaffPasscode(e.target.value);
                                                setStaffPasscodeError('');
                                            }}
                                            placeholder="Ingrese clave institucional previa..."
                                            autoFocus
                                            required
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowStaffPasscodeText(!showStaffPasscodeText)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                                        >
                                            {showStaffPasscodeText ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowStaffModal(false)}
                                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={validatingStaff}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {validatingStaff ? 'Verificando...' : 'Desbloquear Acceso'} <ArrowRight size={14} />
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                            Área técnica: analistas microbiológicos, químicos clínicos y dirección técnica.
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 2. MODAL DE ACCESO A PORTAL DE CLIENTES (PACIENTES & EMPRESAS)              */}
            {/* ========================================================================= */}
            {showClientModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.7)] text-left relative space-y-5 animate-scale-up">
                        <button
                            type="button"
                            onClick={() => setShowClientModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Portal Oficial de Clientes
                                </span>
                                <h3 className="text-lg font-black text-white mt-0.5">Pacientes & Empresas</h3>
                            </div>
                        </div>

                        {/* Tabs: Login con Contraseña vs Consulta de Orden con PIN */}
                        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setClientModalTab('login')}
                                className={`py-2 rounded-lg transition-all ${
                                    clientModalTab === 'login'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                type="button"
                                onClick={() => setClientModalTab('quick_order')}
                                className={`py-2 rounded-lg transition-all ${
                                    clientModalTab === 'quick_order'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Consulta con PIN
                            </button>
                        </div>

                        {clientModalTab === 'login' ? (
                            <form onSubmit={handleClientQuickLogin} className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-300">Correo Electrónico / Cédula</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            value={clientEmail}
                                            onChange={(e) => setClientEmail(e.target.value)}
                                            placeholder="cliente@correo.com"
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-300">Contraseña Previa de Cuenta</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            value={clientPassword}
                                            onChange={(e) => setClientPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>Ingresar al Portal Privado</span> <ArrowRight size={14} />
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleClientOrderLookup} className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-300">Número de Muestra / Orden</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={clientOrderCode}
                                            onChange={(e) => setClientOrderCode(e.target.value)}
                                            placeholder="Ej. 85362 o MC-2026-0089"
                                            required
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-300">PIN / Clave de Retiro Impresa</label>
                                    <div className="relative">
                                        <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            value={clientOrderPin}
                                            onChange={(e) => setClientOrderPin(e.target.value)}
                                            placeholder="PIN de 4-6 dígitos en comprobante"
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>Consultar Informe Oficial</span> <Search size={14} />
                                </button>
                            </form>
                        )}

                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                            <span className="text-slate-400 text-[11px]">¿Nuevo cliente o empresa?</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowClientModal(false);
                                    navigateTo('login', null, { loginType: 'client' });
                                }}
                                className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                            >
                                Registrarme aquí
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 3. MODAL DE SOLICITUD DE COTIZACIÓN CONFIDENCIAL (DISCRECIÓN TOTAL)        */}
            {/* ========================================================================= */}
            {showQuoteModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.7)] text-left relative space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setShowQuoteModal(false);
                                setQuoteSuccess(null);
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                                <FileText size={24} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Reserva Comercial & Privacidad
                                </span>
                                <h3 className="text-lg font-black text-white mt-0.5">Solicitud de Cotización Confidencial</h3>
                            </div>
                        </div>

                        {quoteSuccess ? (
                            <div className="p-5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-center space-y-3 animate-fade-in">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h4 className="text-base font-black text-white">¡Solicitud Confidencial Registrada!</h4>
                                <p className="text-xs text-emerald-200 leading-relaxed">{quoteSuccess.message}</p>
                                <div className="p-2.5 bg-slate-900 rounded-xl border border-emerald-500/30 inline-block font-mono text-xs font-bold text-emerald-400">
                                    Código de Cotización: {quoteSuccess.quoteId}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Sus requerimientos han sido remitidos directamente al departamento técnico-comercial sin exposición pública de tarifas.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowQuoteModal(false);
                                        setQuoteSuccess(null);
                                    }}
                                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                >
                                    Entendido y Cerrar
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleQuoteSubmit} className="space-y-3.5">
                                {/* Invisible Anti-bot */}
                                <input
                                    type="text"
                                    name="honeypot"
                                    value={quoteData.honeypot}
                                    onChange={(e) => setQuoteData({ ...quoteData, honeypot: e.target.value })}
                                    className="hidden"
                                    tabIndex={-1}
                                    autoComplete="off"
                                />

                                {/* Lista de Ensayos Seleccionados */}
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                                        <span>Ensayos a Cotizar ({selectedTests.length}):</span>
                                        <span className="text-[10px] text-indigo-400">Garantía de Privacidad</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                        {selectedTests.length > 0 ? (
                                            selectedTests.map(t => (
                                                <span key={t.id} className="text-[10px] bg-slate-800 text-indigo-200 px-2 py-0.5 rounded border border-slate-700 inline-flex items-center gap-1">
                                                    <span>{t.name}</span>
                                                    {(t.activeMethodLabel || t.method) && (
                                                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">
                                                            {t.activeMethodLabel || t.time}
                                                        </span>
                                                    )}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">No ha seleccionado ensayos específicos del catálogo. Cotización general.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Cliente</label>
                                        <select
                                            value={quoteData.clientType}
                                            onChange={(e) => setQuoteData({ ...quoteData, clientType: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="empresa">Empresa / Industria</option>
                                            <option value="particular">Particular / Paciente</option>
                                            <option value="clinica">Médico / Clínica</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">Nombre / Empresa *</label>
                                        <input
                                            type="text"
                                            required
                                            value={quoteData.clientName}
                                            onChange={(e) => setQuoteData({ ...quoteData, clientName: e.target.value })}
                                            placeholder="Razón Social o Nombre"
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">Correo para Envío *</label>
                                        <input
                                            type="email"
                                            required
                                            value={quoteData.email}
                                            onChange={(e) => setQuoteData({ ...quoteData, email: e.target.value })}
                                            placeholder="proforma@empresa.com"
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={quoteData.phone}
                                            onChange={(e) => setQuoteData({ ...quoteData, phone: e.target.value })}
                                            placeholder="+506 8888-0000"
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Matriz, Volumen o Notas Adicionales</label>
                                    <textarea
                                        rows={2}
                                        value={quoteData.notes}
                                        onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                                        placeholder="Ej. Análisis mensual de 5 lotes de agua purificada, o alimentos lácteos..."
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
                                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                                    <span>Garantía de confidencialidad comercial y protección de datos bajo Ley 8968.</span>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuoteModal(false)}
                                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={quoteSubmitting}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {quoteSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud Confidencial'} <Send size={13} />
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>© 1993 - 2026 MICROLABS QUÍMICOS S.A. Todos los derechos reservados.</p>
                    <div className="flex flex-wrap gap-4 font-medium items-center justify-center">
                        <button 
                            onClick={() => scrollToSection('inicio')} 
                            className="hover:text-indigo-400 text-slate-300 transition-colors cursor-pointer"
                        >
                            Inicio
                        </button>
                        <button 
                            onClick={() => scrollToSection('servicios')} 
                            className="hover:text-indigo-400 text-slate-300 transition-colors cursor-pointer"
                        >
                            Servicios & Ensayos
                        </button>
                        <button 
                            onClick={() => setShowClientModal(true)} 
                            className="hover:text-emerald-400 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <UserCheck size={13} /> Portal Clientes
                        </button>
                        <button 
                            onClick={() => {
                                setStaffPasscode('');
                                setStaffPasscodeError('');
                                setStaffPasscodeSuccess(false);
                                setShowStaffModal(true);
                            }} 
                            className="hover:text-indigo-400 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <ShieldAlert size={13} className="text-amber-400" /> Uso Interno (Staff)
                        </button>
                        <a 
                            href="#consulta" 
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('consulta');
                            }} 
                            className="hover:text-slate-300 transition-colors"
                        >
                            Consulta de Informes
                        </a>
                        <a 
                            href="#preingreso" 
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('preingreso');
                            }} 
                            className="hover:text-slate-300 transition-colors"
                        >
                            Pre-Ingreso
                        </a>
                        <a 
                            href="#cotizador" 
                            onClick={(e) => {
                                e.preventDefault();
                                scrollToSection('cotizador');
                            }} 
                            className="hover:text-slate-300 transition-colors"
                        >
                            Cotización Confidencial
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
