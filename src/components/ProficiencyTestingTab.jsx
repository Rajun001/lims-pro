import React, { useState, useEffect } from 'react';
import { 
    Award, ShieldCheck, Download, PlusCircle, ExternalLink, 
    CheckCircle2, AlertTriangle, AlertOctagon, FileText, 
    Search, Filter, Eye, Sparkles, Building, Calendar, 
    Calculator, RefreshCw, X, TestTube, Microscope, Check
} from 'lucide-react';
import { FormInput } from './UI';
import { exportToCSV } from '../utils/exportUtils';
import { formatToCRDate } from '../utils/dateFormatter';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';

const DEFAULT_PT_ROUNDS = [
    {
        id: 'PT-2026-001',
        provider: 'LGC AXIO Proficiency Testing',
        scheme: 'Food Microbiology (QMS)',
        roundCode: 'QMS-2026-R1',
        year: 2026,
        sampleMatrix: 'Matriz Cárnica Liofilizada',
        parameter: 'Escherichia coli (Cuantitativo)',
        unit: 'Log10 UFC/g',
        assignedValue: 3.45,
        targetSD: 0.22,
        labResult: 3.48,
        zScore: 0.14,
        status: 'SATISFACTORIO',
        date: '2026-02-15',
        analyst: 'Dra. Rebeca Mora (Microbióloga)',
        certificateRef: 'LGC-QMS-2026-119455'
    },
    {
        id: 'PT-2026-002',
        provider: 'LGC AXIO Proficiency Testing',
        scheme: 'Food Microbiology (QMS)',
        roundCode: 'QMS-2026-R1',
        year: 2026,
        sampleMatrix: 'Matriz Láctea en Polvo',
        parameter: 'Salmonella spp. (Detección / 25g)',
        unit: 'Presencia / Ausencia',
        assignedValue: 'Ausente / 25g',
        targetSD: null,
        labResult: 'Ausente / 25g',
        zScore: 0.00,
        status: 'SATISFACTORIO',
        date: '2026-02-15',
        analyst: 'Lic. Kevin Monge (Analista)',
        certificateRef: 'LGC-QMS-2026-119455'
    },
    {
        id: 'PT-2026-003',
        provider: 'LGC AXIO Proficiency Testing',
        scheme: 'Food Microbiology (QMS)',
        roundCode: 'QMS-2026-R2',
        year: 2026,
        sampleMatrix: 'Harina de Trigo / Cereales',
        parameter: 'Recuento Aerobios Mesófilos (RAM)',
        unit: 'Log10 UFC/g',
        assignedValue: 4.82,
        targetSD: 0.28,
        labResult: 4.79,
        zScore: -0.11,
        status: 'SATISFACTORIO',
        date: '2026-03-10',
        analyst: 'Dr. Roldan Ajún Chaverri',
        certificateRef: 'LGC-QMS-2026-119455'
    },
    {
        id: 'PT-2025-004',
        provider: 'AOAC International PT',
        scheme: 'M02 - Pathogen-Free Microbiology',
        roundCode: 'AOAC-M02-FEB25',
        year: 2025,
        sampleMatrix: 'Matriz Alimento Procesado',
        parameter: 'Listeria monocytogenes (Detección / 25g)',
        unit: 'Presencia / Ausencia',
        assignedValue: 'Ausente / 25g',
        targetSD: null,
        labResult: 'Ausente / 25g',
        zScore: 0.00,
        status: 'SATISFACTORIO',
        date: '2025-02-17',
        analyst: 'Dr. José Guillermo Ajún Jiménez',
        certificateRef: 'AOAC-M02-119455'
    },
    {
        id: 'PT-2025-005',
        provider: 'AOAC International PT',
        scheme: 'M02 - Pathogen-Free Microbiology',
        roundCode: 'AOAC-M02-FEB25',
        year: 2025,
        sampleMatrix: 'Agua Potable y Alimentos',
        parameter: 'Coliformes Totales Petrifilm',
        unit: 'Log10 UFC/g',
        assignedValue: 2.90,
        targetSD: 0.25,
        labResult: 2.95,
        zScore: 0.20,
        status: 'SATISFACTORIO',
        date: '2025-02-17',
        analyst: 'Dra. Rebeca Mora (Microbióloga)',
        certificateRef: 'AOAC-M02-119455'
    }
];

export const ProficiencyTestingTab = ({ db, user }) => {
    const { addNotification } = useNotification();
    const [rounds, setRounds] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const localData = localStorage.getItem('lims_local_pt_rounds');
                if (localData) return JSON.parse(localData);
            } catch {
                // ignore
            }
        }
        return DEFAULT_PT_ROUNDS;
    });
    const [selectedCert, setSelectedCert] = useState(null);
    const [showNewRoundModal, setShowNewRoundModal] = useState(false);
    const [filterProvider, setFilterProvider] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeHubTab, setActiveHubTab] = useState('PT');

    // New round state
    const [newRound, setNewRound] = useState({
        provider: 'LGC AXIO Proficiency Testing',
        scheme: 'Food Microbiology (QMS)',
        roundCode: '',
        sampleMatrix: '',
        parameter: '',
        unit: 'Log10 UFC/g',
        assignedValue: '',
        targetSD: '',
        labResult: '',
        analyst: user?.displayName || 'Dr. Roldan Ajún Chaverri',
        date: new Date().toISOString().slice(0, 10)
    });

    // Load rounds from Firestore
    useEffect(() => {
        if (user?.uid === 'offline-user' || !db) return;

        const unsub = onSnapshot(collection(db, `artifacts/${LIMSSystemId}/public/data/lab_proficiency_rounds`), (snap) => {
            if (snap.empty) {
                setRounds(DEFAULT_PT_ROUNDS);
            } else {
                const data = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
                data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                setRounds(data);
            }
        });
        return () => unsub();
    }, [db, user]);

    // Live Z-Score calculation for modal
    const computedZScore = React.useMemo(() => {
        const val = parseFloat(newRound.labResult);
        const assigned = parseFloat(newRound.assignedValue);
        const sd = parseFloat(newRound.targetSD);
        if (isNaN(val) || isNaN(assigned) || isNaN(sd) || sd === 0) return null;
        return Number(((val - assigned) / sd).toFixed(2));
    }, [newRound.labResult, newRound.assignedValue, newRound.targetSD]);

    const getStatusForZ = (z) => {
        if (z === null) return 'EVALUADO';
        const abs = Math.abs(z);
        if (abs <= 2.0) return 'SATISFACTORIO';
        if (abs < 3.0) return 'CUESTIONABLE';
        return 'NO SATISFACTORIO';
    };

    const handleSaveRound = async (e) => {
        e.preventDefault();
        try {
            const z = computedZScore;
            const status = z !== null ? getStatusForZ(z) : 'SATISFACTORIO';
            const roundRecord = {
                id: `PT-${Date.now().toString().slice(-6)}`,
                ...newRound,
                assignedValue: isNaN(parseFloat(newRound.assignedValue)) ? newRound.assignedValue : parseFloat(newRound.assignedValue),
                labResult: isNaN(parseFloat(newRound.labResult)) ? newRound.labResult : parseFloat(newRound.labResult),
                targetSD: newRound.targetSD ? parseFloat(newRound.targetSD) : null,
                zScore: z,
                status,
                year: parseInt(newRound.date.slice(0, 4), 10) || 2026,
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            };

            if (user?.uid === 'offline-user') {
                const updated = [roundRecord, ...rounds];
                localStorage.setItem('lims_local_pt_rounds', JSON.stringify(updated));
                setRounds(updated);
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else if (db) {
                await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/lab_proficiency_rounds`), {
                    ...roundRecord,
                    createdAt: serverTimestamp()
                });
            }

            await logAuditAction(
                db, 
                user?.uid, 
                'REGISTRO_PROFICIENCIA', 
                `Ronda PT registrada: ${roundRecord.roundCode} (${roundRecord.parameter}). Z-score: ${z !== null ? z : 'Cualitativo'}. Veredicto: ${status}`
            );

            addNotification('Ronda de proficiencia registrada con éxito.', 'success');
            setShowNewRoundModal(false);
            setNewRound({
                provider: 'LGC AXIO Proficiency Testing',
                scheme: 'Food Microbiology (QMS)',
                roundCode: '',
                sampleMatrix: '',
                parameter: '',
                unit: 'Log10 UFC/g',
                assignedValue: '',
                targetSD: '',
                labResult: '',
                analyst: user?.displayName || 'Dr. Roldan Ajún Chaverri',
                date: new Date().toISOString().slice(0, 10)
            });
        } catch (error) {
            console.error('Error al guardar ronda PT:', error);
            addNotification('Error al registrar la ronda de proficiencia.', 'error');
        }
    };

    const handleExportCSV = () => {
        if (!rounds.length) return addNotification('No hay registros para exportar.', 'warning');
        const dataToExport = rounds.map(r => ({
            ID: r.id,
            Proveedor: r.provider,
            Esquema: r.scheme,
            Ronda: r.roundCode,
            Fecha: r.date,
            Matriz: r.sampleMatrix,
            Parametro: r.parameter,
            ValorAsignado: r.assignedValue,
            DesviacionSD: r.targetSD ?? 'N/A',
            ResultadoLab: r.labResult,
            ZScore: r.zScore ?? 'N/A',
            Estado: r.status,
            Analista: r.analyst
        }));
        exportToCSV(dataToExport, `Proficiencia_LGC_Microlabs_${new Date().toISOString().slice(0, 10)}`);
        addNotification('Datos de proficiencia exportados a CSV.', 'success');
    };

    const filteredRounds = rounds.filter(r => {
        const matchesProvider = filterProvider === 'ALL' || r.provider.includes(filterProvider);
        const matchesSearch = !searchTerm || 
            (r.parameter && r.parameter.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.roundCode && r.roundCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.sampleMatrix && r.sampleMatrix.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesProvider && matchesSearch;
    });

    // Performance metrics
    const totalRounds = rounds.length;
    const satisfactoryRounds = rounds.filter(r => r.status === 'SATISFACTORIO').length;
    const satisfactoryRate = totalRounds > 0 ? ((satisfactoryRounds / totalRounds) * 100).toFixed(1) : 100;

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* Header Hero Banner with LGC 2026 Accreditation Tag */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-indigo-500/30">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                    <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                                <ShieldCheck size={14} className="text-emerald-400" /> Acreditación Internacional Vigente
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                                <Sparkles size={14} className="text-amber-400" /> LGC AXIO 2026 Nuevo
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                ISO/IEC 17043 · ISO 17025
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Exámenes y Ensayos de Proficiencia (PT)
                        </h2>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Control Externo de Calidad (EQA) e Interlaboratorio Internacional. Evaluación continua de competencia analítica en microbiología de alimentos y aguas respaldada por <strong className="text-white">LGC Standards</strong> y <strong className="text-white">AOAC International</strong>.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        <button 
                            onClick={handleExportCSV}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            <Download size={16} /> Exportar Historial CSV
                        </button>
                        <button 
                            onClick={() => setShowNewRoundModal(true)}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-102"
                        >
                            <PlusCircle size={16} /> Registrar Ronda PT
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Performance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa de Desempeño</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{satisfactoryRate}%</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Conforme |z| ≤ 2.0</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <CheckCircle2 size={24} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rondas Evaluadas</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{totalRounds}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Interlaboratorio Registradas</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <Award size={24} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor Oficial 2026</p>
                        <p className="text-base font-black text-indigo-700 mt-1 truncate">LGC AXIO PT</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Esquema QMS (Alimentos)</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                        <Building size={24} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site ID Registrado</p>
                        <p className="text-2xl font-black text-slate-800 mt-1 font-mono">119455</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Microlab Quimicos S.A</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                        <ShieldCheck size={24} />
                    </div>
                </div>
            </div>

            {/* Credential Hub Sub-Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-sm">
                <button
                    onClick={() => setActiveHubTab('PT')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeHubTab === 'PT' 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                >
                    <Award size={16} className={activeHubTab === 'PT' ? 'text-amber-300' : 'text-slate-500'} />
                    <span>Ensayos Interlaboratorio (LGC 2026 & AOAC)</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">2026</span>
                </button>
                <button
                    onClick={() => setActiveHubTab('ECA')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeHubTab === 'ECA' 
                            ? 'bg-sky-700 text-white shadow-md shadow-sky-700/20' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                >
                    <ShieldCheck size={16} className={activeHubTab === 'ECA' ? 'text-amber-300' : 'text-slate-500'} />
                    <span>Formación Evaluadores ECA (ISO/IEC 17025)</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">Nota 100</span>
                </button>
                <button
                    onClick={() => setActiveHubTab('METHODS')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeHubTab === 'METHODS' 
                            ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                >
                    <TestTube size={16} className={activeHubTab === 'METHODS' ? 'text-amber-300' : 'text-slate-500'} />
                    <span>Métodos Normalizados (3M Molecular MDS & Petrifilm)</span>
                </button>
                <button
                    onClick={() => setActiveHubTab('LEGAL')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeHubTab === 'LEGAL' 
                            ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                >
                    <Building size={16} className={activeHubTab === 'LEGAL' ? 'text-amber-300' : 'text-slate-500'} />
                    <span>Habilitaciones Oficiales (SENASA CVO & MEIC PYME)</span>
                </button>
            </div>

            {/* TAB 1: PROFICIENCY TESTING (LGC 2026 & AOAC) */}
            {activeHubTab === 'PT' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    
                    {/* LGC AXIO 2026 Card */}
                    <div className="bg-white rounded-2xl p-5 border-2 border-indigo-300 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                            <Sparkles size={12} className="text-amber-300" /> Año Oficial 2026
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md font-black text-xs">
                                    LGC
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-base leading-tight">
                                        LGC AXIO Proficiency Testing
                                    </h3>
                                    <p className="text-xs text-indigo-700 font-bold mt-0.5">
                                        Certificate of Participation · Scheme Year 2026
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Programa: <strong>Food Microbiology (QMS)</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Certificate Preview Thumbnail */}
                            <div 
                                onClick={() => setSelectedCert({
                                    title: 'LGC AXIO Proficiency Testing - Certificate of Participation 2026',
                                    subtitle: 'Food Microbiology (QMS) · Scheme Year 2026 · Member: Microlab Quimicos S.A',
                                    src: '/certificates/lgc_axio_proficiency_2026.jpg',
                                    issuer: 'LGC AXIO Proficiency Testing (UK)',
                                    director: 'John Pratt, Director, AXIO Proficiency Testing LGC',
                                    year: '2026'
                                })}
                                className="cursor-pointer group/thumb relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center aspect-[4/3] max-h-64 shadow-inner"
                            >
                                <img 
                                    src="/certificates/lgc_axio_proficiency_2026.jpg" 
                                    alt="Certificado LGC AXIO 2026 Microlabs" 
                                    className="w-full h-full object-contain p-2 group-hover/thumb:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <span className="px-3.5 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-black shadow-lg flex items-center gap-1.5">
                                        <Eye size={14} className="text-indigo-600" /> Ver en Pantalla Completa
                                    </span>
                                </div>
                            </div>

                            {/* Metadata Details */}
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">Miembro Inscrito:</span>
                                    <span className="font-bold text-slate-800">Microlab Quimicos S.A</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">Esquema:</span>
                                    <span className="font-bold text-indigo-700">Food Microbiology (QMS)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">Director Firmante:</span>
                                    <span className="font-medium text-slate-800">John Pratt (Director AXIO LGC)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">Normativa:</span>
                                    <span className="font-bold text-emerald-700">ISO/IEC 17043 Acreditado</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                            <button
                                onClick={() => setSelectedCert({
                                    title: 'LGC AXIO Proficiency Testing - Certificate of Participation 2026',
                                    subtitle: 'Food Microbiology (QMS) · Scheme Year 2026 · Member: Microlab Quimicos S.A',
                                    src: '/certificates/lgc_axio_proficiency_2026.jpg',
                                    issuer: 'LGC AXIO Proficiency Testing (UK)',
                                    director: 'John Pratt, Director, AXIO Proficiency Testing LGC',
                                    year: '2026'
                                })}
                                className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
                            >
                                <Eye size={14} /> Inspeccionar Documento
                            </button>
                            <a
                                href="/certificates/lgc_axio_proficiency_2026.jpg"
                                download="Certificado_LGC_AXIO_2026_Microlabs.jpg"
                                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                <Download size={14} /> Descargar
                            </a>
                        </div>
                    </div>

                    {/* AOAC International 2025 Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-3 right-3 bg-slate-800 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                            Ronda Feb 2025
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md font-black text-xs">
                                    AOAC
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-base leading-tight">
                                        AOAC INTERNATIONAL
                                    </h3>
                                    <p className="text-xs text-slate-600 font-bold mt-0.5">
                                        Participation Certification · Program M02
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Esquema: <strong>Pathogen-Free Microbiology Program</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Certificate Preview Thumbnail */}
                            <div 
                                onClick={() => setSelectedCert({
                                    title: 'AOAC INTERNATIONAL - Participation Certification',
                                    subtitle: 'M02 - Pathogen-Free Microbiology Program · February 2025 · Site ID: 119455',
                                    src: '/certificates/aoac_proficiency_2025.jpg',
                                    issuer: 'AOAC INTERNATIONAL (Rockville, MD, USA)',
                                    director: 'Shane P Flynn, Senior Director',
                                    year: '2025'
                                })}
                                className="cursor-pointer group/thumb relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center aspect-[4/3] max-h-64 shadow-inner"
                            >
                                <img 
                                    src="/certificates/aoac_proficiency_2025.jpg" 
                                    alt="Certificado AOAC 2025 Microlabs" 
                                    className="w-full h-full object-contain p-2 group-hover/thumb:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <span className="px-3.5 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-black shadow-lg flex items-center gap-1.5">
                                        <Eye size={14} className="text-indigo-600" /> Ver en Pantalla Completa
                                    </span>
                                </div>
                            </div>

                            {/* Metadata Details */}
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">Laboratorio:</span>
                                    <span className="font-bold text-slate-800">Microlabs Laboratory</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">Site ID Oficial:</span>
                                    <span className="font-mono font-bold text-indigo-700">119455</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">Acreditación:</span>
                                    <span className="font-bold text-slate-800">A2LA Cert # 1782.01</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">Emisión:</span>
                                    <span className="font-medium text-slate-800">02/17/2025 · Shane P Flynn</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                            <button
                                onClick={() => setSelectedCert({
                                    title: 'AOAC INTERNATIONAL - Participation Certification',
                                    subtitle: 'M02 - Pathogen-Free Microbiology Program · February 2025 · Site ID: 119455',
                                    src: '/certificates/aoac_proficiency_2025.jpg',
                                    issuer: 'AOAC INTERNATIONAL (Rockville, MD, USA)',
                                    director: 'Shane P Flynn, Senior Director',
                                    year: '2025'
                                })}
                                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-300"
                            >
                                <Eye size={14} /> Inspeccionar Documento
                            </button>
                            <a
                                href="/certificates/aoac_proficiency_2025.jpg"
                                download="Certificado_AOAC_2025_Microlabs.jpg"
                                className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                <Download size={14} /> Descargar
                            </a>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB 2: EVALUADOR OFICIAL ECA ISO/IEC 17025 */}
            {activeHubTab === 'ECA' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Certificate Visual Card */}
                        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border-2 border-sky-300 shadow-md flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-sky-700 text-white flex items-center justify-center font-black text-xs shadow-md">
                                            ECA
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-base leading-tight">
                                                Ente Costarricense de Acreditación (ECA)
                                            </h3>
                                            <p className="text-xs text-sky-800 font-bold mt-0.5">
                                                Formación de Evaluadores en INTE/ISO-IEC 17025:2005
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Sistema Nacional para la Calidad · Costa Rica
                                            </p>
                                        </div>
                                    </div>
                                    <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                                        Calificación 100/100
                                    </span>
                                </div>

                                <div 
                                    onClick={() => setSelectedCert({
                                        title: 'ECA - Formación de Evaluadores en Norma INTE/ISO-IEC 17025:2005',
                                        subtitle: 'Ente Costarricense de Acreditación · Dr. Roldan Ajún Chaverri · Reg. 2017-019-001',
                                        src: '/certificates/eca_evaluador_iso17025.jpg',
                                        issuer: 'Ente Costarricense de Acreditación (ECA)',
                                        director: 'ECA Costa Rica',
                                        year: '2017'
                                    })}
                                    className="cursor-pointer group/thumb relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center aspect-[4/3] max-h-72 shadow-inner"
                                >
                                    <img 
                                        src="/certificates/eca_evaluador_iso17025.jpg" 
                                        alt="Certificado ECA Evaluador ISO 17025" 
                                        className="w-full h-full object-contain p-2 group-hover/thumb:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <span className="px-3.5 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-black shadow-lg flex items-center gap-1.5">
                                            <Eye size={14} className="text-sky-700" /> Inspeccionar Certificado Oficial
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-sky-50/60 rounded-xl p-3 border border-sky-200/80 text-xs space-y-1.5 text-slate-700">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Evaluador Titular:</span>
                                        <strong className="text-slate-900">Dr. Roldan Ajún Chaverri</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Número de Registro:</span>
                                        <span className="font-mono font-bold text-sky-800">2017-019-001</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Calificación Obtenida:</span>
                                        <span className="font-bold text-emerald-700">100 / 100 Puntos (Sobresaliente)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Alcance de Autoridad:</span>
                                        <span className="font-bold text-slate-800">Auditorías & Evaluación de Laboratorios</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-2">
                                <button
                                    onClick={() => setSelectedCert({
                                        title: 'ECA - Formación de Evaluadores en Norma INTE/ISO-IEC 17025:2005',
                                        subtitle: 'Ente Costarricense de Acreditación · Dr. Roldan Ajún Chaverri · Reg. 2017-019-001',
                                        src: '/certificates/eca_evaluador_iso17025.jpg',
                                        issuer: 'Ente Costarricense de Acreditación (ECA)',
                                        director: 'ECA Costa Rica',
                                        year: '2017'
                                    })}
                                    className="flex-1 py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-sky-200"
                                >
                                    <Eye size={14} /> Inspeccionar Documento
                                </button>
                                <a
                                    href="/certificates/eca_evaluador_iso17025.jpg"
                                    download="Certificado_ECA_Evaluador_ISO17025_DrAjún.jpg"
                                    className="py-2 px-3 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Download size={14} /> Descargar
                                </a>
                            </div>
                        </div>

                        {/* Audit Verification Scope in LIMS-PRO */}
                        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                                    Garantía de Imparcialidad & Competencia Técnica
                                </span>
                                <h3 className="text-lg font-black text-slate-900 mt-2">
                                    Vigilancia Continua del Sistema de Calidad (ISO/IEC 17025)
                                </h3>
                                <p className="text-xs text-slate-600 mt-1">
                                    La dirección técnica del Dr. Roldan Ajún, calificada en formación de evaluadores según la norma INTE/ISO-IEC 17025 (ECA), asegura que cada proceso en LIMS-PRO cumple rigurosamente con los requisitos normativos del sistema de gestión INTECO e ISO 15189:
                                </p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    {
                                        clause: 'Cláusula 6.2 - Personal',
                                        title: 'Competencia e Idoneidad Técnica',
                                        desc: 'Verificación continua de calificaciones analíticas, microbiólogos regentes y entrenamiento periódico en métodos rápidos y convencionales.'
                                    },
                                    {
                                        clause: 'Cláusula 6.4 - Equipamiento',
                                        title: 'Calibración & Metrología',
                                        desc: 'Trazabilidad metrológica de autoclaves, termómetros, incubadoras y micropipetas con calibración externa periódica.'
                                    },
                                    {
                                        clause: 'Cláusula 7.2 - Métodos',
                                        title: 'Selección y Verificación de Métodos',
                                        desc: 'Adopción de estándares internacionales AOAC, SMEWW y FDA-BAM con verificación analítica de límites de detección.'
                                    },
                                    {
                                        clause: 'Cláusula 7.7 - Calidad',
                                        title: 'Aseguramiento de la Validez',
                                        desc: 'Monitoreo estadístico por cartas de control Levey-Jennings, reglas de Westgard y participación anual en ensayos interlaboratorios LGC AXIO PT.'
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded">
                                                {item.clause}
                                            </span>
                                            <CheckCircle2 size={14} className="text-emerald-600" />
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800">{item.title}</h4>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: STANDARDIZED METHODS (3M MDS & PETRIFILM) */}
            {activeHubTab === 'METHODS' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                id: '3m-mds',
                                title: '3M Detección Molecular (MDS)',
                                target: 'Listeria monocytogenes (AOAC OMA)',
                                date: '3M Food Safety',
                                src: '/certificates/3m_deteccion_molecular_listeria.png'
                            },
                            {
                                id: '3m-emp',
                                title: 'Monitoreo Ambiental (EMP)',
                                target: 'Zonificación Zonas 1 a 4 HACCP',
                                date: '3M Food Safety',
                                src: '/certificates/3m_monitoreo_ambiental.jpg'
                            },
                            {
                                id: '3m-higiene',
                                title: 'Monitoreo de Higiene ATP',
                                target: 'Bioluminiscencia Clean-Trace',
                                date: '3M Food Safety',
                                src: '/certificates/3m_higiene_monitoreo.png'
                            },
                            {
                                id: 'bpm',
                                title: 'Buenas Prácticas de Manufactura',
                                target: 'Inocuidad y Calidad Agroindustrial',
                                date: 'Capacitación BPM',
                                src: '/certificates/bpm_capacitacion.png'
                            }
                        ].map(m => (
                            <div key={m.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between group">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                        <span>{m.date}</span>
                                        <Microscope size={12} />
                                    </div>
                                    <h4 className="font-black text-slate-800 text-xs">{m.title}</h4>
                                    <p className="text-[11px] text-slate-500">{m.target}</p>
                                    <div 
                                        onClick={() => setSelectedCert({
                                            title: m.title,
                                            subtitle: m.target,
                                            src: m.src,
                                            issuer: m.date,
                                            director: '3M Food Safety Specialist',
                                            year: 'Oficial'
                                        })}
                                        className="cursor-pointer relative rounded-lg overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-50 flex items-center justify-center"
                                    >
                                        <img src={m.src} alt={m.title} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCert({
                                        title: m.title,
                                        subtitle: m.target,
                                        src: m.src,
                                        issuer: m.date,
                                        director: '3M Food Safety Specialist',
                                        year: 'Oficial'
                                    })}
                                    className="mt-3 w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors border border-rose-200"
                                >
                                    <Eye size={12} /> Ver Certificado
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Standard Methods Reference Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <TestTube size={16} className="text-rose-600" />
                                Catálogo de Métodos Normalizados en Rutina Analítica
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">Validación AOAC / BAM / SMEWW</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="p-2.5">Ensayo / Parámetro</th>
                                        <th className="p-2.5">Matriz de Aplicación</th>
                                        <th className="p-2.5">Método Normalizado Oficial</th>
                                        <th className="p-2.5">Tecnología Empleada</th>
                                        <th className="p-2.5">Tiempo Respuesta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    <tr>
                                        <td className="p-2.5 font-bold">Aerobios Mesófilos (RAM)</td>
                                        <td className="p-2.5">Alimentos y Superficies</td>
                                        <td className="p-2.5 font-mono text-indigo-700">AOAC Official Method 990.12</td>
                                        <td className="p-2.5">Placas 3M Petrifilm Rápido</td>
                                        <td className="p-2.5">48 horas</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 font-bold">Coliformes Totales y E. coli</td>
                                        <td className="p-2.5">Alimentos procesados y carnes</td>
                                        <td className="p-2.5 font-mono text-indigo-700">AOAC Official Method 991.14</td>
                                        <td className="p-2.5">Placas 3M Petrifilm EC</td>
                                        <td className="p-2.5">24 - 48 horas</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 font-bold">Staphylococcus aureus</td>
                                        <td className="p-2.5">Lácteos y derivados</td>
                                        <td className="p-2.5 font-mono text-indigo-700">AOAC Official Method 2003.07</td>
                                        <td className="p-2.5">Placas 3M Petrifilm Staph Express</td>
                                        <td className="p-2.5">24 horas</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 font-bold">Listeria monocytogenes</td>
                                        <td className="p-2.5">Alimentos listos para consumo (RTE)</td>
                                        <td className="p-2.5 font-mono text-indigo-700">AOAC-PTM Cert #021201</td>
                                        <td className="p-2.5">3M Molecular Detection System (MDS)</td>
                                        <td className="p-2.5">24 - 28 horas</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 font-bold">Salmonella spp. (Detección)</td>
                                        <td className="p-2.5">Alimentos y materias primas (25g)</td>
                                        <td className="p-2.5 font-mono text-indigo-700">FDA-BAM Cap. 5 / AOAC</td>
                                        <td className="p-2.5">Enriquecimiento selectivo + Aislamiento</td>
                                        <td className="p-2.5">3 a 5 días</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 font-bold">Coliformes y E. coli en Agua</td>
                                        <td className="p-2.5">Agua Potable y Fuentes</td>
                                        <td className="p-2.5 font-mono text-indigo-700">SMEWW 9221 / SMEWW 9223 B</td>
                                        <td className="p-2.5">Número Más Probable (NMP) / Sustrato Enzimático</td>
                                        <td className="p-2.5">24 horas</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: LEGAL & REGULATORY (SENASA, MEIC, CMQC) */}
            {activeHubTab === 'LEGAL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                    {[
                        {
                            id: 'senasa',
                            title: 'SENASA (MAG) - CVO Oficial',
                            subtitle: 'Certificado Veterinario de Operación',
                            reg: 'CVO SENASA-DRM-1951-2010',
                            src: '/certificates/senasa_cvo_microlabs.jpg'
                        },
                        {
                            id: 'meic',
                            title: 'MEIC - Registro Oficial PYME',
                            subtitle: 'Empresa Científica e Innovación',
                            reg: 'Registro Nº 48107 (2024-2028)',
                            src: '/certificates/meic_pyme_2028.jpg'
                        },
                        {
                            id: 'colegio',
                            title: 'Colegio de Microbiólogos (CMQC)',
                            subtitle: 'Regencia y Habilitación Sanitaria',
                            reg: 'Regencia Profesional Nº 1957',
                            src: '/certificates/colegio_microbiologos_regencia.png'
                        },
                        {
                            id: 'ina',
                            title: 'INA - Industria Alimentaria',
                            subtitle: 'Expositor y Capacitación Especializada',
                            reg: 'Encuentro Nacional de la Industria',
                            src: '/certificates/ina_expositor_industria.jpg'
                        }
                    ].map(leg => (
                        <div key={leg.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between group">
                            <div className="space-y-2">
                                <div className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded flex justify-between">
                                    <span>Habilitación Vigente</span>
                                    <Building size={12} />
                                </div>
                                <h4 className="font-black text-slate-800 text-xs">{leg.title}</h4>
                                <p className="text-[11px] text-slate-500">{leg.subtitle}</p>
                                <p className="text-[10px] font-mono font-bold text-emerald-700">{leg.reg}</p>
                                <div 
                                    onClick={() => setSelectedCert({
                                        title: leg.title,
                                        subtitle: `${leg.subtitle} · ${leg.reg}`,
                                        src: leg.src,
                                        issuer: leg.title,
                                        director: 'Autoridad Gubernamental',
                                        year: 'Oficial'
                                    })}
                                    className="cursor-pointer relative rounded-lg overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-50 flex items-center justify-center"
                                >
                                    <img src={leg.src} alt={leg.title} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" />
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCert({
                                    title: leg.title,
                                    subtitle: `${leg.subtitle} · ${leg.reg}`,
                                    src: leg.src,
                                    issuer: leg.title,
                                    director: 'Autoridad Gubernamental',
                                    year: 'Oficial'
                                })}
                                className="mt-3 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors border border-emerald-200"
                            >
                                <Eye size={12} /> Ver Certificado
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Proficiency Rounds & Z-Score Evaluation Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-base">
                            <Calculator size={18} className="text-indigo-600" />
                            Registro y Evaluación de Rondas Interlaboratorio (Z-Score ISO 13528 / ISO 17043)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Criterio de Aceptación: |z| ≤ 2.0 Satisfactorio · 2.0 &lt; |z| &lt; 3.0 Cuestionable · |z| ≥ 3.0 No Satisfactorio
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar analito, ronda..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <select
                            value={filterProvider}
                            onChange={e => setFilterProvider(e.target.value)}
                            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                        >
                            <option value="ALL">Todos los Proveedores</option>
                            <option value="LGC">LGC AXIO (2026)</option>
                            <option value="AOAC">AOAC International</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-3">Ronda / ID</th>
                                <th className="p-3">Proveedor & Esquema</th>
                                <th className="p-3">Matriz de Ensayo</th>
                                <th className="p-3">Parámetro / Analito</th>
                                <th className="p-3 text-right">Valor Asignado (X)</th>
                                <th className="p-3 text-right">Desv. Est. (σ)</th>
                                <th className="p-3 text-right">Resultado Lab (x)</th>
                                <th className="p-3 text-center">Z-Score (z)</th>
                                <th className="p-3 text-center">Evaluación</th>
                                <th className="p-3">Fecha & Analista</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {filteredRounds.map((r, idx) => {
                                const isSatisfactory = r.status === 'SATISFACTORIO';
                                const isQuestionable = r.status === 'CUESTIONABLE';
                                const isUnsatisfactory = r.status === 'NO SATISFACTORIO';

                                return (
                                    <tr key={r.id || idx} className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="p-3 font-mono font-bold text-indigo-700">
                                            {r.roundCode || r.id}
                                            <span className="block text-[10px] text-slate-400 font-normal">{r.year}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className="font-bold text-slate-800 block">{r.provider}</span>
                                            <span className="text-[10px] text-slate-500">{r.scheme}</span>
                                        </td>
                                        <td className="p-3 text-slate-600">
                                            {r.sampleMatrix}
                                        </td>
                                        <td className="p-3">
                                            <span className="font-bold text-slate-800 block">{r.parameter}</span>
                                            <span className="text-[10px] text-slate-400">{r.unit}</span>
                                        </td>
                                        <td className="p-3 text-right font-mono font-semibold">
                                            {r.assignedValue}
                                        </td>
                                        <td className="p-3 text-right font-mono text-slate-500">
                                            {r.targetSD !== null && r.targetSD !== undefined ? r.targetSD : '—'}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                                            {r.labResult}
                                        </td>
                                        <td className="p-3 text-center font-mono font-extrabold">
                                            {r.zScore !== null && r.zScore !== undefined ? (
                                                <span className={`px-2 py-0.5 rounded text-xs ${
                                                    Math.abs(r.zScore) <= 2.0 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : Math.abs(r.zScore) < 3.0 
                                                        ? 'bg-amber-100 text-amber-800' 
                                                        : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {r.zScore > 0 ? `+${r.zScore}` : r.zScore}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-normal">Cualitativo</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {isSatisfactory && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300">
                                                    <CheckCircle2 size={11} /> Satisfactorio
                                                </span>
                                            )}
                                            {isQuestionable && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-300">
                                                    <AlertTriangle size={11} /> Cuestionable
                                                </span>
                                            )}
                                            {isUnsatisfactory && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300">
                                                    <AlertOctagon size={11} /> No Conforme
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-slate-500 text-[11px]">
                                            <span>{r.date ? formatToCRDate(r.date) : 'N/A'}</span>
                                            <span className="block text-[10px] text-slate-400 truncate max-w-[140px]">{r.analyst}</span>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredRounds.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="p-8 text-center text-slate-400">
                                        No se encontraron rondas de proficiencia con los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Certificate Lightbox Modal */}
            {selectedCert && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700">
                        {/* Modal Header */}
                        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                            <div>
                                <h3 className="font-black text-base flex items-center gap-2">
                                    <Award className="text-amber-400" size={18} />
                                    {selectedCert.title}
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    {selectedCert.subtitle}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedCert(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Certificate Image High Res */}
                        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-auto max-h-[70vh]">
                            <img 
                                src={selectedCert.src} 
                                alt={selectedCert.title} 
                                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <div className="text-slate-600">
                                <strong>Emisor:</strong> {selectedCert.issuer} · <strong>Firmante:</strong> {selectedCert.director}
                            </div>
                            <div className="flex items-center gap-2">
                                <a 
                                    href={selectedCert.src} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                                >
                                    <ExternalLink size={14} /> Abrir en pestaña nueva
                                </a>
                                <a 
                                    href={selectedCert.src} 
                                    download={`Certificado_${selectedCert.year}_Microlabs.jpg`}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Download size={14} /> Descargar Archivo Oficial
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal to Register New Proficiency Round */}
            {showNewRoundModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                    <Calculator className="text-indigo-600" size={20} />
                                    Registrar Nueva Ronda de Proficiencia
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Cálculo automático de Z-Score bajo ISO 13528 / ISO/IEC 17043
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowNewRoundModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRound} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor Oficial</label>
                                    <select 
                                        value={newRound.provider} 
                                        onChange={e => setNewRound({
                                            ...newRound, 
                                            provider: e.target.value,
                                            scheme: e.target.value.includes('LGC') ? 'Food Microbiology (QMS)' : 'M02 - Pathogen-Free Microbiology'
                                        })}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                                    >
                                        <option value="LGC AXIO Proficiency Testing">LGC AXIO Proficiency Testing (UK)</option>
                                        <option value="AOAC International PT">AOAC International (USA)</option>
                                        <option value="INCIENSA EQA">INCIENSA (Costa Rica)</option>
                                    </select>
                                </div>

                                <FormInput 
                                    label="Esquema / Programa" 
                                    name="scheme" 
                                    value={newRound.scheme} 
                                    onChange={e => setNewRound({...newRound, scheme: e.target.value})} 
                                    required 
                                    placeholder="Ej. Food Microbiology (QMS)"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormInput 
                                    label="Código de Ronda" 
                                    name="roundCode" 
                                    value={newRound.roundCode} 
                                    onChange={e => setNewRound({...newRound, roundCode: e.target.value})} 
                                    required 
                                    placeholder="Ej. QMS-2026-R3"
                                />

                                <FormInput 
                                    type="date"
                                    label="Fecha de Participación" 
                                    name="date" 
                                    value={newRound.date} 
                                    onChange={e => setNewRound({...newRound, date: e.target.value})} 
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormInput 
                                    label="Matriz de la Muestra" 
                                    name="sampleMatrix" 
                                    value={newRound.sampleMatrix} 
                                    onChange={e => setNewRound({...newRound, sampleMatrix: e.target.value})} 
                                    required 
                                    placeholder="Ej. Matriz Cárnica Liofilizada"
                                />

                                <FormInput 
                                    label="Parámetro / Analito" 
                                    name="parameter" 
                                    value={newRound.parameter} 
                                    onChange={e => setNewRound({...newRound, parameter: e.target.value})} 
                                    required 
                                    placeholder="Ej. Salmonella spp., E. coli"
                                />
                            </div>

                            {/* Quantitative Values */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calculator size={14} className="text-indigo-600" />
                                    Valores Numéricos y Evaluación Z-Score
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <FormInput 
                                        label="Valor Asignado (X)" 
                                        name="assignedValue" 
                                        value={newRound.assignedValue} 
                                        onChange={e => setNewRound({...newRound, assignedValue: e.target.value})} 
                                        required 
                                        placeholder="Ej. 3.45"
                                    />
                                    <FormInput 
                                        label="Desv. Estándar (σ)" 
                                        name="targetSD" 
                                        value={newRound.targetSD} 
                                        onChange={e => setNewRound({...newRound, targetSD: e.target.value})} 
                                        placeholder="Ej. 0.22"
                                    />
                                    <FormInput 
                                        label="Resultado Lab (x)" 
                                        name="labResult" 
                                        value={newRound.labResult} 
                                        onChange={e => setNewRound({...newRound, labResult: e.target.value})} 
                                        required 
                                        placeholder="Ej. 3.48"
                                    />
                                </div>

                                {/* Dynamic Z calculation chip */}
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                    <div>
                                        <span className="text-slate-500 font-medium">Z-Score Calculado: </span>
                                        <strong className="font-mono text-sm text-indigo-700">
                                            {computedZScore !== null ? (computedZScore > 0 ? `+${computedZScore}` : computedZScore) : 'N/A (Cualitativo)'}
                                        </strong>
                                    </div>
                                    <div>
                                        {computedZScore !== null && (
                                            <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                                                Math.abs(computedZScore) <= 2.0 
                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                    : Math.abs(computedZScore) < 3.0 
                                                    ? 'bg-amber-100 text-amber-800' 
                                                    : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {getStatusForZ(computedZScore)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <FormInput 
                                label="Microbiólogo / Analista Responsable" 
                                name="analyst" 
                                value={newRound.analyst} 
                                onChange={e => setNewRound({...newRound, analyst: e.target.value})} 
                                required 
                            />

                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewRoundModal(false)}
                                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-600/30"
                                >
                                    Guardar Ronda
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
