import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileText, Search, Filter, Calendar, ShieldCheck, Download, Eye, 
    ArrowRight, CheckCircle2, Clock, AlertCircle, Building2, FlaskConical,
    Sparkles, RefreshCw, FileCheck, Layers, ChevronLeft, ChevronRight,
    Camera, Sliders
} from 'lucide-react';
import { LoadingSpinner } from '../components/UI';

export const ReportsExplorerView = ({ navigateTo, _userRole, _user }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('ALL'); // ALL, INDUSTRIAL_COA, CLINICAL_HUMAN
    const [selectedMatrix, setSelectedMatrix] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const pageSize = 15;

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('page', currentPage);
                params.append('limit', pageSize);
                if (searchTerm) params.append('search', searchTerm);
                if (selectedType !== 'ALL') params.append('type', selectedType);
                if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

                const res = await fetch(`/api/reports?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setReports(data.items || []);
                    setTotalPages(data.totalPages || 1);
                    setTotalReports(data.total || 0);
                } else {
                    console.error("Error al consultar informes");
                }
            } catch (err) {
                console.error("Error conectando con API de informes:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [currentPage, searchTerm, selectedType, selectedStatus, refreshTrigger]);

    // Matrices únicas para filtros rápidos
    const matrices = [
        'ALL',
        'Agua Potable',
        'Alimento Procesado',
        'Superficie Inerte',
        'Hielo',
        'Manipulador de Alimentos',
        'Agua Recreacional (Piscina)'
    ];

    const filteredReports = useMemo(() => {
        if (selectedMatrix === 'ALL') return reports;
        return reports.filter(r => (r.matrix || '').toLowerCase().includes(selectedMatrix.toLowerCase()));
    }, [reports, selectedMatrix]);

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header del Centro de Informes & Certificados */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                            <FileText size={22} />
                        </span>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                            Informes & Certificados Oficiales de Ensayo
                        </h1>
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm">
                        Catálogo centralizado de Certificados de Análisis (CoA) ISO/IEC 17025:2017 e Informes Clínicos. 
                        Histórico sincronizado con Estimaciones de QuickBooks ({totalReports.toLocaleString()} informes registrados).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Actualizar listado"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>
                    <button
                        onClick={() => navigateTo('final_report', '85362')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                        <Sparkles size={15} />
                        <span>Ver Certificado Demo ISO 17025</span>
                    </button>
                </div>
            </div>

            {/* Tarjetas de Métricas de Emisión */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Informes</span>
                        <span className="text-2xl font-black text-slate-800">{totalReports.toLocaleString()}</span>
                    </div>
                    <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Layers size={20} />
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Industriales (CoA)</span>
                        <span className="text-2xl font-black text-emerald-600">1,223</span>
                    </div>
                    <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Building2 size={20} />
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Clínicos (ISO 15189)</span>
                        <span className="text-2xl font-black text-indigo-600">79</span>
                    </div>
                    <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <FlaskConical size={20} />
                    </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Firma GAUDI / BCCR</span>
                        <span className="text-2xl font-black text-purple-600">100%</span>
                    </div>
                    <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                        <ShieldCheck size={20} />
                    </span>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder="Buscar por Nº Reporte / Estimate (#85362), Empresa (Spoon, Taco Bell), Matriz o Parámetro..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedType}
                            onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                            <option value="ALL">Todos los Tipos</option>
                            <option value="INDUSTRIAL_COA">Certificados Industriales (CoA)</option>
                            <option value="CLINICAL_HUMAN">Informes Clínicos Humanos</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                            <option value="ALL">Cualquier Estado</option>
                            <option value="ISSUED">Emitidos / Concluidos</option>
                            <option value="PENDING_SIGNATURE">Pendiente de Firma</option>
                            <option value="DRAFT">Borradores</option>
                        </select>
                    </div>
                </div>

                {/* Filtros Rápidos de Matriz */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10.5px] font-bold text-slate-400 self-center mr-1">Matriz:</span>
                    {matrices.map(m => (
                        <button
                            key={m}
                            onClick={() => setSelectedMatrix(m)}
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                                selectedMatrix === m 
                                    ? 'bg-slate-800 text-white shadow-xs' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {m === 'ALL' ? 'Todas las Matrices' : m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listado de Informes */}
            {loading ? (
                <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                    <LoadingSpinner />
                    <span className="text-xs font-bold text-slate-500 mt-2">Consultando registros oficiales en LIMS...</span>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-700">No se encontraron informes coincidentes</h3>
                    <p className="text-xs text-slate-400 mt-1">Pruebe ajustando los filtros o el término de búsqueda.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider select-none">
                                    <th className="p-3.5 pl-6">Nº Informe / QB</th>
                                    <th className="p-3.5">Cliente / Solicitante</th>
                                    <th className="p-3.5">Matriz / Muestra</th>
                                    <th className="p-3.5 text-center">Ensayos</th>
                                    <th className="p-3.5 text-center">Fecha Emisión</th>
                                    <th className="p-3.5 text-center">Estado</th>
                                    <th className="p-3.5 pr-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                                {filteredReports.map((r) => {
                                    const isIndustrial = r.reportType === 'INDUSTRIAL_COA';
                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50/75 transition-colors group">
                                            <td className="p-3.5 pl-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-black text-indigo-700 text-sm">
                                                        #{r.reportNumber}
                                                    </span>
                                                    {r.hasPdf && (
                                                        <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200" title="PDF Físico disponible">
                                                            PDF
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[9.5px] font-semibold text-slate-400 block mt-0.5">
                                                    {isIndustrial ? 'Certificado CoA Industrial' : 'Informe Clínico'}
                                                </span>
                                            </td>

                                            <td className="p-3.5 font-bold text-slate-800">
                                                <div className="flex items-center gap-1.5">
                                                    {isIndustrial ? (
                                                        <Building2 size={14} className="text-slate-400 shrink-0" />
                                                    ) : (
                                                        <FlaskConical size={14} className="text-slate-400 shrink-0" />
                                                    )}
                                                    <span className="truncate max-w-[200px]">{r.clientName}</span>
                                                </div>
                                            </td>

                                            <td className="p-3.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                                                    {r.matrix}
                                                </span>
                                            </td>

                                            <td className="p-3.5 text-center font-bold text-slate-700">
                                                {r.testCount > 0 ? (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px]">
                                                        {r.testCount} parámetros
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-mono text-[11px]">-</span>
                                                )}
                                            </td>

                                            <td className="p-3.5 text-center font-medium text-slate-600 font-mono text-[11px]">
                                                {new Date(r.signedAt).toLocaleDateString('es-CR')}
                                            </td>

                                            <td className="p-3.5 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                                    <span>{r.status === 'ISSUED' ? 'Emitido Oficial' : r.status}</span>
                                                </span>
                                            </td>

                                            <td className="p-3.5 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => navigateTo('final_report', r.reportNumber)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                                        title="Abrir Certificado con Opciones y Evidencias"
                                                    >
                                                        <Eye size={13} />
                                                        <span>Ver Certificado</span>
                                                    </button>
                                                    <a
                                                        href={`/verify/${r.reportNumber}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                                        title="Verificar QR"
                                                    >
                                                        <ShieldCheck size={15} />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>Página {currentPage} de {totalPages} ({totalReports} informes totales)</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                            >
                                <ChevronLeft size={15} />
                                <span>Anterior</span>
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                            >
                                <span>Siguiente</span>
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
