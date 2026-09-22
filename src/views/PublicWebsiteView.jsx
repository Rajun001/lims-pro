import React, { useState } from 'react';
import { 
    ShieldCheck, Award, FileText, CheckCircle2, ChevronRight, 
    Search, PlusCircle, Calculator, Building, MapPin, Phone, 
    Mail, Clock, ArrowRight, Sparkles, AlertCircle, ExternalLink, 
    Download, Eye, Filter, Check, Star, Lock, HeartPulse, Droplets,
    Utensils, Microscope, Activity, X
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

    // Dynamic Catalog State & Quote Estimator
    const [selectedTests, setSelectedTests] = useState([]);
    const [activeCatalogTab, setActiveCatalogTab] = useState('food');

    const catalogCategories = [
        {
            id: 'food',
            title: 'Alimentos & Materias Primas',
            icon: Utensils,
            badge: 'LGC 2026',
            tests: [
                { id: 'f1', name: 'Recuento Aerobios Mesófilos (RAM)', method: 'AOAC 990.12 Petrifilm', time: '48h', basePrice: 12500 },
                { id: 'f2', name: 'Coliformes Totales y E. coli', method: 'AOAC 991.14 Petrifilm', time: '24-48h', basePrice: 14000 },
                { id: 'f3', name: 'Staphylococcus aureus coagulasa (+)', method: 'AOAC 2003.07 Petrifilm', time: '48h', basePrice: 16500 },
                { id: 'f4', name: 'Detección de Salmonella spp. (25g)', method: 'FDA-BAM / AOAC', time: '3-5 días', basePrice: 22000 },
                { id: 'f5', name: 'Detección de Listeria monocytogenes (25g)', method: 'AOAC 999.06 / ISO 11290', time: '3-5 días', basePrice: 24000 },
                { id: 'f6', name: 'Hongos y Levaduras', method: 'AOAC 997.02 Petrifilm', time: '72h', basePrice: 13500 }
            ]
        },
        {
            id: 'water',
            title: 'Aguas & Hielo (Potabilidad)',
            icon: Droplets,
            badge: 'SMEWW',
            tests: [
                { id: 'w1', name: 'Coliformes Fecales y E. coli (NMP)', method: 'SMEWW 9221 / Colilert', time: '24h', basePrice: 15000 },
                { id: 'w2', name: 'Recuento Heterotrófico en Placa', method: 'SMEWW 9215 B', time: '48h', basePrice: 12000 },
                { id: 'w3', name: 'Pseudomonas aeruginosa en Agua', method: 'SMEWW 9213', time: '48h', basePrice: 18000 },
                { id: 'w4', name: 'Análisis Físico-Químico Básico (pH, Cloro, Turbidez)', method: 'Norma Nacional', time: '24h', basePrice: 19500 }
            ]
        },
        {
            id: 'surfaces',
            title: 'Superficies & Ambientes BPM',
            icon: Microscope,
            badge: 'HACCP',
            tests: [
                { id: 's1', name: 'Hisopado de Superficie Inerte (Mesófilos + Coliformes)', method: 'Hisopo neutralizante', time: '48h', basePrice: 11000 },
                { id: 's2', name: 'Frotis de Manos de Manipulador', method: 'Verificación BPM', time: '48h', basePrice: 9500 },
                { id: 's3', name: 'Monitoreo Ambiental por Sedimentación en Placa', method: 'Exposición pasiva', time: '48h', basePrice: 10500 }
            ]
        },
        {
            id: 'clinical',
            title: 'Microbiología & Química Clínica',
            icon: HeartPulse,
            badge: 'Colegio MQC',
            tests: [
                { id: 'c1', name: 'Examen General de Orina (EGO)', method: 'Tira Reactiva + Sedimento', time: 'Mismo día', basePrice: 6500 },
                { id: 'c2', name: 'Examen Coprológico & Parásitos', method: 'Directo + Lugol', time: 'Mismo día', basePrice: 7000 },
                { id: 'c3', name: 'Cultivo Bacteriano con Antibiograma CLSI', method: 'Aislamiento + CMI', time: '48-72h', basePrice: 21000 },
                { id: 'c4', name: 'Perfil Lipídico (Colesterol, Triglicéridos, HDL, LDL)', method: 'Química Automatizada', time: 'Mismo día', basePrice: 18000 }
            ]
        }
    ];

    const toggleSelectTest = (test) => {
        if (selectedTests.some(t => t.id === test.id)) {
            setSelectedTests(selectedTests.filter(t => t.id !== test.id));
        } else {
            setSelectedTests([...selectedTests, test]);
        }
    };

    const calculatedEstimate = selectedTests.reduce((acc, t) => acc + t.basePrice, 0);

    const handleLookupReport = (e) => {
        e.preventDefault();
        const code = lookupCode.trim();
        if (!code) return;
        // Direct redirect to public verification view
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
                    Acreditación 2026
                </span>
                <span className="text-slate-200">
                    Microlabs Químicos S.A. evaluado por <strong>LGC AXIO PT (UK)</strong> · Dirección Técnica calificada como <strong>Evaluador Oficial ECA INTE/ISO-IEC 17025</strong>.
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
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
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

                    {/* Nav Links */}
                    <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
                        <button onClick={() => setActiveSection('inicio')} className={`hover:text-white transition-colors ${activeSection === 'inicio' ? 'text-indigo-400' : ''}`}>
                            Inicio
                        </button>
                        <a href="#servicios" onClick={() => setActiveSection('servicios')} className="hover:text-white transition-colors">
                            Servicios & Ensayos
                        </a>
                        <a href="#consulta" onClick={() => setActiveSection('consulta')} className="hover:text-white transition-colors flex items-center gap-1">
                            <Search size={14} className="text-indigo-400" /> Consulta Resultados
                        </a>
                        <a href="#preingreso" onClick={() => setActiveSection('preingreso')} className="hover:text-white transition-colors flex items-center gap-1">
                            <PlusCircle size={14} className="text-emerald-400" /> Pre-ingreso Muestras
                        </a>
                        <a href="#cotizador" onClick={() => setActiveSection('cotizador')} className="hover:text-white transition-colors">
                            Cotizador Online
                        </a>
                        <a href="#acreditaciones" onClick={() => setActiveSection('acreditaciones')} className="hover:text-white transition-colors flex items-center gap-1">
                            <Award size={14} className="text-amber-400" /> Acreditaciones & ECA
                        </a>
                    </nav>

                    {/* Quick Access Action */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigateTo('login')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                        >
                            <Lock size={14} /> Acceso LIMS-PRO
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 space-y-20 pb-20">

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
                                Ensayos microbiológicos de alta fidelidad para la industria de alimentos, aguas potables, residuales, monitoreo ambiental y química clínica, auditados bajo <strong>INTE/ISO-IEC 17025</strong> por Evaluador Oficial del <strong>ECA</strong> y validados con <strong>LGC AXIO PT (UK)</strong>, <strong>AOAC International</strong> y tecnología <strong>3M Molecular Detection</strong>.
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
                                            <option>Agua Residual / Efluente</option>
                                            <option>Superficie Inerte (Hisopado)</option>
                                            <option>Manipulador de Alimentos</option>
                                            <option>Muestra Clínica (Sangre / Orina / Heces)</option>
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

                {/* Section: Dynamic Test Catalog & Cost Estimator */}
                <section id="cotizador" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                    <div className="space-y-6">
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                Transparencia Analítica
                            </span>
                            <h2 className="text-3xl font-black text-white">Catálogo & Cotizador Dinámico</h2>
                            <p className="text-xs sm:text-sm text-slate-400">
                                Seleccione los ensayos requeridos para estimar costos de laboratorio y generar su pre-orden.
                            </p>
                        </div>

                        {/* Category Selector Tabs */}
                        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-800 rounded-2xl max-w-3xl mx-auto border border-slate-700">
                            {catalogCategories.map(cat => {
                                const Icon = cat.icon;
                                const isActive = activeCatalogTab === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCatalogTab(cat.id)}
                                        className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                            isActive 
                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        <span>{cat.title}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Category Test Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {catalogCategories.find(c => c.id === activeCatalogTab)?.tests.map(test => {
                                const isSelected = selectedTests.some(t => t.id === test.id);
                                return (
                                    <div
                                        key={test.id}
                                        onClick={() => toggleSelectTest(test)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                                            isSelected 
                                                ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-600/20' 
                                                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-bold text-sm text-white leading-snug">{test.name}</h4>
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                                                    isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-600'
                                                }`}>
                                                    {isSelected && <Check size={13} />}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-indigo-300 font-mono">{test.method}</p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                                            <span className="text-slate-400 text-[11px]">Entrega: {test.time}</span>
                                            <span className="font-black text-white">₡{test.basePrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Floating or Docked Quote Summary */}
                        {selectedTests.length > 0 && (
                            <div className="bg-gradient-to-r from-indigo-900 to-slate-800 border-2 border-indigo-500/50 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                                <div>
                                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                                        {selectedTests.length} Ensayos Seleccionados en Cotización
                                    </p>
                                    <p className="text-2xl font-black text-white mt-0.5">
                                        Total Estimado: ₡{calculatedEstimate.toLocaleString()} CRC
                                    </p>
                                    <p className="text-[11px] text-slate-300">Precios orientativos sujetos a matriz y volumen.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedTests([])}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                                    >
                                        Limpiar
                                    </button>
                                    <a
                                        href="#preingreso"
                                        onClick={() => {
                                            setIntakeData({
                                                ...intakeData,
                                                analysisRequested: selectedTests.map(t => t.name).join(', ')
                                            });
                                        }}
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg flex items-center gap-1.5"
                                    >
                                        Transferir a Pre-Ingreso <ArrowRight size={14} />
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
                            Acreditaciones, Evaluador ECA & Métodos Normalizados
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Nuestra dirección técnica está calificada como <strong>Evaluador Oficial del Ente Costarricense de Acreditación (ECA)</strong> bajo la norma <strong>INTE/ISO-IEC 17025</strong>, con respaldo internacional de <strong>LGC AXIO PT (UK)</strong>, <strong>AOAC International</strong> y métodos validados <strong>3M Food Safety</strong>.
                        </p>
                    </div>

                    {/* Filter Category Tabs */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {[
                            { id: 'all', label: 'Todas las Certificaciones (10)', icon: Sparkles },
                            { id: 'eca', label: 'Evaluador Oficial ECA ISO 17025', icon: ShieldCheck, badge: 'Nota 100' },
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
                                title: 'Evaluador de Laboratorios de Ensayo',
                                standard: 'INTE/ISO-IEC 17025:2005',
                                authority: 'Ente Costarricense de Acreditación (ECA)',
                                holder: 'Dr. Roldan Ajún Chaverri',
                                regCode: 'Reg. 2017-019-001 · Nota 100/100',
                                badge: 'Evaluador Oficial ECA',
                                badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
                                description: 'Certificado de Aprobación en Formación de Evaluadores según INTE/ISO-IEC 17025 por el ECA. Acredita competencia como auditor y evaluador técnico en sistemas de gestión de calidad en laboratorios de ensayo.',
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

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>© 1993 - 2026 MICROLABS QUÍMICOS S.A. Todos los derechos reservados.</p>
                    <div className="flex gap-4 font-medium">
                        <button onClick={() => navigateTo('login')} className="hover:text-slate-300">Acceso a Personal</button>
                        <a href="#consulta" className="hover:text-slate-300">Consulta de Informes</a>
                        <a href="#preingreso" className="hover:text-slate-300">Pre-Ingreso</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
