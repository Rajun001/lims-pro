import React, { useState, useEffect, useCallback } from 'react';
import { 
    Clock, AlertTriangle, CheckCircle2, Send, MessageCircle, Mail, 
    Calendar, RefreshCw, UserCheck, Building2, Stethoscope, Microscope, 
    Plus, Filter, Search, ChevronRight, X, PhoneCall, ShieldAlert, Sparkles,
    Check, BellRing, User, Info, ArrowUpRight
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';

const API_URL = getApiUrl();

export const RemindersScheduleView = ({ user, userRole: _userRole, navigateTo: _navigateTo }) => {
    const { addNotification } = useNotification();
    const [reminders, setReminders] = useState([]);
    const [counts, setCounts] = useState({
        total: 0, pending: 0, sent: 0, dismissed: 0,
        internalStaff: 0, corporateClients: 0, clinicalPatients: 0, urgent: 0
    });
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'INTERNAL_STAFF' | 'CORPORATE_CLIENT' | 'CLINICAL_PATIENT'
    const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING' | 'SENT' | 'ALL'
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Formulario de recordatorio manual
    const [newReminder, setNewReminder] = useState({
        title: '',
        message: '',
        targetAudience: 'INTERNAL_STAFF',
        reminderType: 'CUSTOM_SCHEDULE',
        recipientName: '',
        recipientContact: '',
        channel: 'SYSTEM',
        priority: 'NORMAL',
        dueDate: new Date().toISOString().split('T')[0]
    });

    const fetchReminders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/reminders?targetAudience=${activeTab}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setReminders(data.data || []);
                setCounts(prev => data.counts || prev);
            }
        } catch (error) {
            console.error("Error fetching reminders:", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, statusFilter, searchQuery]);

    useEffect(() => {
        fetchReminders();
    }, [activeTab, fetchReminders]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchReminders();
    };

    const handleRunScan = async () => {
        setScanning(true);
        try {
            const res = await fetch(`${API_URL}/api/reminders/scan`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                addNotification(`Escaneo completado: ${data.count} alertas o recordatorios generados.`, 'success');
                await fetchReminders();
            } else {
                addNotification('Error al ejecutar el escáner de alertas.', 'error');
            }
        } catch {
            addNotification('Fallo de conexión con el servidor LIMS.', 'error');
        } finally {
            setScanning(false);
        }
    };

    const handleDispatch = async (reminder, overrideChannel = null) => {
        try {
            const channel = overrideChannel || reminder.channel;
            const res = await fetch(`${API_URL}/api/reminders/${reminder.id}/dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel, userName: user?.displayName || 'Personal LIMS' })
            });

            if (res.ok) {
                const data = await res.json();
                addNotification(`Recordatorio despachado correctamente vía ${channel}.`, 'success');

                // Si es WhatsApp y hay enlace directo generado, abrirlo en nueva pestaña
                if (data.whatsappLink) {
                    window.open(data.whatsappLink, '_blank');
                } else if (channel === 'WHATSAPP' && reminder.recipientContact) {
                    const cleanPhone = reminder.recipientContact.replace(/[^0-9]/g, '');
                    const encodedMsg = encodeURIComponent(reminder.message);
                    window.open(`https://wa.me/${cleanPhone.startsWith('506') ? cleanPhone : '506' + cleanPhone}?text=${encodedMsg}`, '_blank');
                }

                await fetchReminders();
            }
        } catch {
            addNotification('Error al despachar el recordatorio.', 'error');
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const res = await fetch(`${API_URL}/api/reminders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                addNotification(`Estado actualizado a: ${newStatus}`, 'info');
                await fetchReminders();
            }
        } catch {
            addNotification('Error actualizando el estado.', 'error');
        }
    };

    const handleCreateCustom = async (e) => {
        e.preventDefault();
        if (!newReminder.title || !newReminder.message || !newReminder.recipientName) {
            addNotification('Complete los campos obligatorios.', 'warning');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/reminders/custom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReminder)
            });
            if (res.ok) {
                addNotification('Recordatorio programado con éxito.', 'success');
                setShowCreateModal(false);
                setNewReminder({
                    title: '',
                    message: '',
                    targetAudience: 'INTERNAL_STAFF',
                    reminderType: 'CUSTOM_SCHEDULE',
                    recipientName: '',
                    recipientContact: '',
                    channel: 'SYSTEM',
                    priority: 'NORMAL',
                    dueDate: new Date().toISOString().split('T')[0]
                });
                await fetchReminders();
            }
        } catch {
            addNotification('Error al crear el recordatorio programado.', 'error');
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar">
            {/* ENCABEZADO PRINCIPAL */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            <BellRing size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                                Agenda, Recordatorios & Notificaciones
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    Inteligente
                                </span>
                            </h1>
                            <p className="text-xs text-slate-400">
                                Motor automatizado de seguimiento clínico e industrial para personal, pacientes y empresas.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={handleRunScan}
                        disabled={scanning}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />
                        {scanning ? 'Escaneando Sistema...' : 'Escanear Alertas Ahora'}
                    </button>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer"
                    >
                        <Plus size={15} />
                        Nuevo Recordatorio
                    </button>
                </div>
            </div>

            {/* TARJETAS DE RESUMEN EJECUTIVO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div 
                    onClick={() => { setActiveTab('INTERNAL_STAFF'); setStatusFilter('PENDING'); }}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                        activeTab === 'INTERNAL_STAFF' 
                            ? 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">Personal Lab</span>
                        <Microscope size={17} className="text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{counts.internalStaff}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Órdenes y firmas pendientes</div>
                </div>

                <div 
                    onClick={() => { setActiveTab('CORPORATE_CLIENT'); setStatusFilter('PENDING'); }}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                        activeTab === 'CORPORATE_CLIENT' 
                            ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider">Empresas (B2B)</span>
                        <Building2 size={17} className="text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{counts.corporateClients}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Renovación periódica sanitarias</div>
                </div>

                <div 
                    onClick={() => { setActiveTab('CLINICAL_PATIENT'); setStatusFilter('PENDING'); }}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                        activeTab === 'CLINICAL_PATIENT' 
                            ? 'bg-teal-950/40 border-teal-500/50 shadow-lg shadow-teal-500/10' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider">Pacientes Clínicos</span>
                        <Stethoscope size={17} className="text-teal-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{counts.clinicalPatients}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Resultados listos y control</div>
                </div>

                <div 
                    onClick={() => { setActiveTab('ALL'); setStatusFilter('PENDING'); }}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                        counts.urgent > 0 
                            ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-500/10' 
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wider">Prioridad Urgente</span>
                        <AlertTriangle size={17} className="text-rose-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{counts.urgent}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Requiere atención inmediata</div>
                </div>
            </div>

            {/* BARRA DE FILTROS Y PESTAÑAS */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Tabs de Audiencia */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                                activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Todos ({counts.total})
                        </button>
                        <button
                            onClick={() => setActiveTab('INTERNAL_STAFF')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'INTERNAL_STAFF' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Microscope size={13} />
                            Personal Lab
                        </button>
                        <button
                            onClick={() => setActiveTab('CORPORATE_CLIENT')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'CORPORATE_CLIENT' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Building2 size={13} />
                            Empresas
                        </button>
                        <button
                            onClick={() => setActiveTab('CLINICAL_PATIENT')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'CLINICAL_PATIENT' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Stethoscope size={13} />
                            Pacientes
                        </button>
                    </div>

                    {/* Filtro de Estado */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Estado:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="PENDING">Pendientes</option>
                            <option value="SENT">Enviados / Despachados</option>
                            <option value="DISMISSED">Descartados</option>
                            <option value="ALL">Todos los Estados</option>
                        </select>
                    </div>
                </div>

                {/* Formulario de Búsqueda */}
                <form onSubmit={handleSearchSubmit} className="relative">
                    <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, paciente, informe, código o palabra clave..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                </form>
            </div>

            {/* LISTADO DE RECORDATORIOS */}
            <div className="space-y-3">
                {loading ? (
                    <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                        <RefreshCw size={32} className="mx-auto text-indigo-400 animate-spin mb-3" />
                        <p className="text-xs text-slate-400">Cargando agenda y alertas del laboratorio...</p>
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                        <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-3" />
                        <h3 className="text-sm font-bold text-white mb-1">Todo al día</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            No hay recordatorios pendientes en esta categoría. Puedes hacer clic en "Escanear Alertas Ahora" para verificar nuevas tareas.
                        </p>
                    </div>
                ) : (
                    reminders.map((r) => {
                        const isUrgent = r.priority === 'URGENT' || r.priority === 'HIGH';
                        const isStaff = r.targetAudience === 'INTERNAL_STAFF';
                        const isCompany = r.targetAudience === 'CORPORATE_CLIENT';
                        const isPatient = r.targetAudience === 'CLINICAL_PATIENT';

                        return (
                            <div 
                                key={r.id} 
                                className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 bg-slate-900 ${
                                    isUrgent 
                                        ? 'border-rose-500/40 hover:border-rose-500/80 shadow-md shadow-rose-500/5' 
                                        : 'border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Badge Audiencia */}
                                            {isStaff && (
                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                                    <Microscope size={11} /> Personal Lab
                                                </span>
                                            )}
                                            {isCompany && (
                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                                    <Building2 size={11} /> Empresa B2B
                                                </span>
                                            )}
                                            {isPatient && (
                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                                                    <Stethoscope size={11} /> Paciente
                                                </span>
                                            )}

                                            {/* Badge Prioridad */}
                                            {isUrgent && (
                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                                    <AlertTriangle size={11} /> Prioridad Alta
                                                </span>
                                            )}

                                            {/* Referencia */}
                                            {r.entityReference && (
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                                    Ref: {r.entityReference}
                                                </span>
                                            )}

                                            {/* Estado */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                r.status === 'SENT' ? 'bg-emerald-500/20 text-emerald-300' :
                                                r.status === 'DISMISSED' ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/20 text-indigo-300'
                                            }`}>
                                                {r.status === 'SENT' ? 'Enviado' : r.status === 'DISMISSED' ? 'Descartado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            {r.title}
                                        </h3>

                                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                            {r.message}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                                            <span className="flex items-center gap-1.5">
                                                <User size={13} className="text-slate-500" />
                                                Destinatario: <strong className="text-slate-200">{r.recipientName}</strong>
                                            </span>
                                            {r.recipientContact && (
                                                <span className="flex items-center gap-1.5">
                                                    <PhoneCall size={13} className="text-slate-500" />
                                                    {r.recipientContact}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-500" />
                                                Fecha: {new Date(r.dueDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* BOTONES DE ACCIÓN */}
                                    <div className="flex flex-row md:flex-col items-center gap-2 shrink-0 pt-2 md:pt-0">
                                        {/* Botón WhatsApp */}
                                        <button
                                            onClick={() => handleDispatch(r, 'WHATSAPP')}
                                            title="Enviar mensaje por WhatsApp"
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
                                        >
                                            <MessageCircle size={14} />
                                            WhatsApp
                                        </button>

                                        {/* Botón Email */}
                                        <button
                                            onClick={() => handleDispatch(r, 'EMAIL')}
                                            title="Enviar notificación por Correo"
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                                        >
                                            <Mail size={14} />
                                            Email
                                        </button>

                                        {/* Botón Completar / Descartar */}
                                        {r.status === 'PENDING' ? (
                                            <button
                                                onClick={() => handleStatusUpdate(r.id, 'SENT')}
                                                title="Marcar como atendido"
                                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-300 text-[11px] font-medium transition cursor-pointer"
                                            >
                                                <Check size={13} />
                                                Listo
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusUpdate(r.id, 'PENDING')}
                                                title="Reabrir recordatorio"
                                                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                                            >
                                                Reabrir
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL CREAR RECORDATORIO MANUAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <Plus size={16} className="text-indigo-400" />
                                Programar Nuevo Recordatorio
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCustom} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Audiencia</label>
                                    <select
                                        value={newReminder.targetAudience}
                                        onChange={(e) => setNewReminder({ ...newReminder, targetAudience: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="INTERNAL_STAFF">Personal de Laboratorio</option>
                                        <option value="CORPORATE_CLIENT">Empresa / Cliente B2B</option>
                                        <option value="CLINICAL_PATIENT">Paciente Clínico</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Prioridad</label>
                                    <select
                                        value={newReminder.priority}
                                        onChange={(e) => setNewReminder({ ...newReminder, priority: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="NORMAL">Normal</option>
                                        <option value="HIGH">Alta</option>
                                        <option value="URGENT">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-400 block mb-1">Destinatario (Nombre completo o Razón Social)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Dr. Roldan Ajún / Hotel Barceló / Juan Pérez"
                                    value={newReminder.recipientName}
                                    onChange={(e) => setNewReminder({ ...newReminder, recipientName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Contacto (Teléfono o Email)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. 8888-8888 o correo@ejemplo.com"
                                        value={newReminder.recipientContact}
                                        onChange={(e) => setNewReminder({ ...newReminder, recipientContact: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Fecha Programada</label>
                                    <input
                                        type="date"
                                        value={newReminder.dueDate}
                                        onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-400 block mb-1">Título del Recordatorio</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Lectura de placa de cultivo 48h / Renovación de muestreo"
                                    value={newReminder.title}
                                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-400 block mb-1">Mensaje o Instrucción</label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="Escriba los detalles de la instrucción o el texto para WhatsApp..."
                                    value={newReminder.message}
                                    onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow cursor-pointer"
                                >
                                    Guardar Recordatorio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemindersScheduleView;
