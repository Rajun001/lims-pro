import React, { useState } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { FormInput, RestrictedAccess } from '../components/UI';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';
import { Building2, PlusCircle, Edit3, Trash2, CheckCircle2, Star, MapPin, Phone, Mail, UserCheck, ShieldCheck } from 'lucide-react';

export const LabSettings = ({ db, labInfo, userRole, user, navigateTo }) => {
    const [info, setInfo] = useState(() => {
        const base = labInfo || {};
        if (!base.branches || base.branches.length === 0) {
            base.branches = [
                {
                    id: 'suc-guadalupe',
                    code: 'GUA-01',
                    name: 'Sede Central Guadalupe',
                    type: 'Sede Matriz & Laboratorio Central',
                    isMain: true,
                    address: 'Guadalupe, del correo 75 mts Norte. Zip: 10801, San José',
                    telephones: '22348837, 22345862, 22246541',
                    whatsapp: '71382750',
                    email: 'laboratorio@microlabscr.com',
                    emailReports: 'reportes@microlabscr.com',
                    emailBilling: 'fe@microlabscr.com',
                    directorName: 'Dr. Roldán Ajún Chaverri',
                    directorCode: '802',
                    permitNumber: 'MINSA-01048',
                    active: true
                }
            ];
        }
        return base;
    });

    const [activeTab, setActiveTab] = useState('branches'); // 'general' | 'branches' | 'microbiologists'
    const [editingBranch, setEditingBranch] = useState(null); // modal state: null or branch object
    const [isNewBranch, setIsNewBranch] = useState(false);

    const { addNotification } = useNotification();

    if (userRole !== 'admin' && userRole !== 'director_tecnico') {
        return <RestrictedAccess navigateTo={navigateTo} />;
    }

    const saveSettingsToStorage = async (updatedInfo) => {
        try {
            if (user?.uid === 'offline-user') {
                localStorage.setItem('lims_local_labInfo', JSON.stringify(updatedInfo));
                window.dispatchEvent(new Event('lims_local_data_updated'));
                await logAuditAction(db, user?.uid, 'MODIFICAR_CONFIGURACION', `Configuración del laboratorio y sucursales actualizada.`, "main");
                addNotification('Configuración guardada exitosamente.', 'success');
            } else {
                await setDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/lab_settings`, "main"), updatedInfo, { merge: true });
                await logAuditAction(db, user?.uid, 'MODIFICAR_CONFIGURACION', `Configuración del laboratorio y sucursales actualizada.`, "main");
                addNotification('Configuración guardada exitosamente.', 'success');
            }
        } catch (error) {
            console.error("Error al guardar configuración:", error);
            addNotification('Error al guardar la configuración.', 'error');
        }
    };

    const handleGeneralSave = async (e) => {
        e.preventDefault();
        await saveSettingsToStorage(info);
    };

    const handleSaveBranch = async (e) => {
        e.preventDefault();
        if (!editingBranch.name || !editingBranch.code) {
            alert("Por favor ingrese el nombre y código de la sucursal.");
            return;
        }

        let updatedBranches = [...(info.branches || [])];

        if (isNewBranch) {
            const newBranch = {
                ...editingBranch,
                id: editingBranch.id || `suc-${Date.now()}`,
                active: true,
                isMain: updatedBranches.length === 0 ? true : !!editingBranch.isMain
            };
            if (newBranch.isMain) {
                updatedBranches = updatedBranches.map(b => ({ ...b, isMain: false }));
            }
            updatedBranches.push(newBranch);
        } else {
            if (editingBranch.isMain) {
                updatedBranches = updatedBranches.map(b => ({ ...b, isMain: false }));
            }
            updatedBranches = updatedBranches.map(b => b.id === editingBranch.id ? { ...editingBranch } : b);
        }

        const newInfo = { ...info, branches: updatedBranches };
        setInfo(newInfo);
        setEditingBranch(null);
        await saveSettingsToStorage(newInfo);
    };

    const handleToggleBranchActive = async (branchId) => {
        const updatedBranches = (info.branches || []).map(b => {
            if (b.id === branchId) {
                if (b.isMain) {
                    alert("La Sede Matriz no se puede desactivar.");
                    return b;
                }
                return { ...b, active: !b.active };
            }
            return b;
        });
        const newInfo = { ...info, branches: updatedBranches };
        setInfo(newInfo);
        await saveSettingsToStorage(newInfo);
    };

    const handleSetMainBranch = async (branchId) => {
        const updatedBranches = (info.branches || []).map(b => ({
            ...b,
            isMain: b.id === branchId,
            active: true
        }));
        const newInfo = { ...info, branches: updatedBranches };
        setInfo(newInfo);
        await saveSettingsToStorage(newInfo);
    };

    const handleDeleteBranch = async (branchId) => {
        const target = info.branches?.find(b => b.id === branchId);
        if (target?.isMain) {
            alert("No se puede eliminar la Sede Matriz del Laboratorio.");
            return;
        }
        if (window.confirm(`¿Está seguro de eliminar la sucursal "${target?.name}"?`)) {
            const updatedBranches = (info.branches || []).filter(b => b.id !== branchId);
            const newInfo = { ...info, branches: updatedBranches };
            setInfo(newInfo);
            await saveSettingsToStorage(newInfo);
        }
    };

    const openNewBranchModal = () => {
        setIsNewBranch(true);
        setEditingBranch({
            id: `suc-${Date.now()}`,
            code: `SUC-0${(info.branches?.length || 0) + 1}`,
            name: '',
            type: 'Sucursal de Análisis y Muestreo',
            isMain: false,
            address: '',
            telephones: '',
            whatsapp: '',
            email: '',
            directorName: info.directorName || 'Dr. Roldán Ajún Chaverri',
            directorCode: info.directorCode || '802',
            permitNumber: 'MINSA-PROV',
            active: true
        });
    };

    const openEditBranchModal = (branch) => {
        setIsNewBranch(false);
        setEditingBranch({ ...branch });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sedes, Sucursales y Configuración</h1>
                        <p className="text-xs text-slate-500 font-medium">Gestión multi-sucursal del laboratorio y datos corporativos.</p>
                    </div>
                </div>
                <button onClick={() => navigateTo('home')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">
                    Volver al Panel
                </button>
            </div>

            {/* Pestañas de Navegación */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('branches')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeTab === 'branches' 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <Building2 size={15} /> Sedes & Sucursales ({info.branches?.length || 1})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeTab === 'general' 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    🏛️ Datos Corporativos Matriz
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('microbiologists')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeTab === 'microbiologists' 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <UserCheck size={15} /> Microbiólogos Validadores
                </button>
            </div>

            {/* TAB 1: GESTIÓN MULTI-SUCURSAL */}
            {activeTab === 'branches' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                        <div>
                            <h3 className="font-extrabold text-indigo-950 text-sm">Red de Sucursales de Laboratorio</h3>
                            <p className="text-xs text-indigo-700/80 mt-0.5">
                                Permite recepcionar muestras, asignar analistas y generar informes rotulados con la dirección y teléfonos de cada sede.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openNewBranchModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                        >
                            <PlusCircle size={15} /> Registrar Nueva Sucursal
                        </button>
                    </div>

                    {/* Tarjetas de Sucursales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(info.branches || []).map((branch) => (
                            <div 
                                key={branch.id} 
                                className={`bg-white rounded-2xl p-5 border transition-all shadow-sm relative ${
                                    branch.isMain 
                                        ? 'border-indigo-400 ring-2 ring-indigo-500/20' 
                                        : branch.active 
                                            ? 'border-slate-200 hover:border-slate-300' 
                                            : 'border-slate-200 bg-slate-50 opacity-60'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-md">
                                            {branch.code}
                                        </span>
                                        {branch.isMain && (
                                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Star size={11} className="fill-amber-500 text-amber-500" /> Sede Matriz
                                            </span>
                                        )}
                                        {!branch.active && (
                                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                Inactiva
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEditBranchModal(branch)}
                                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                            title="Editar Sucursal"
                                        >
                                            <Edit3 size={15} />
                                        </button>
                                        {!branch.isMain && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteBranch(branch.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                title="Eliminar Sucursal"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <h3 className="font-extrabold text-base text-slate-800 mb-1">
                                    {branch.name}
                                </h3>
                                <p className="text-xs font-semibold text-slate-400 mb-3">
                                    {branch.type || 'Sucursal de Laboratorio'}
                                </p>

                                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                                    <div className="flex items-start gap-1.5">
                                        <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{branch.address || 'Sin dirección registrada'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Phone size={13} className="text-slate-400 shrink-0" />
                                        <span>{branch.telephones || 'Sin teléfono'} {branch.whatsapp ? `• WA: ${branch.whatsapp}` : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <UserCheck size={13} className="text-indigo-500 shrink-0" />
                                        <span className="font-bold text-slate-700">Regente: {branch.directorName} ({branch.directorCode})</span>
                                    </div>
                                    {branch.permitNumber && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                                            <ShieldCheck size={13} className="shrink-0" />
                                            <span>Permiso Sanitario: {branch.permitNumber}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                                    {!branch.isMain ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSetMainBranch(branch.id)}
                                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                        >
                                            ⭐ Convertir en Sede Matriz
                                        </button>
                                    ) : (
                                        <span className="text-[11px] text-slate-400 font-medium italic">Sede de operaciones principal</span>
                                    )}

                                    {!branch.isMain && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleBranchActive(branch.id)}
                                            className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                                branch.active 
                                                    ? 'text-slate-500 hover:text-rose-600' 
                                                    : 'text-emerald-700 bg-emerald-50'
                                            }`}
                                        >
                                            {branch.active ? 'Desactivar' : 'Activar Sede'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: DATOS CORPORATIVOS */}
            {activeTab === 'general' && (
                <form onSubmit={handleGeneralSave} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-fade-in">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Información del Laboratorio (Razón Social y Marca)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Nombre del Laboratorio" value={info.name || ''} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder="Ej. Laboratorio Microlabs" />
                            <FormInput label="URL del Logo Oficial" value={info.logoUrl || ''} onChange={e => setInfo({ ...info, logoUrl: e.target.value })} placeholder="/logo.png" />
                        </div>
                        <FormInput label="Dirección de la Sede Matriz (Guadalupe)" value={info.address || ''} onChange={e => setInfo({ ...info, address: e.target.value })} placeholder="Guadalupe, del correo 75 mts Norte. Zip: 10801" />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Canales de Contacto Centrales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Teléfonos Centrales" value={info.telephones || ''} onChange={e => setInfo({ ...info, telephones: e.target.value })} placeholder="22348837, 22345862, 22246541" />
                            <FormInput label="WhatsApp Central" value={info.whatsapp || ''} onChange={e => setInfo({ ...info, whatsapp: e.target.value })} placeholder="71382750" />
                            <FormInput label="Correo Central" value={info.email || ''} onChange={e => setInfo({ ...info, email: e.target.value })} placeholder="laboratorio@microlabscr.com" />
                            <FormInput label="Correo de Informes/Reportes" value={info.emailReports || ''} onChange={e => setInfo({ ...info, emailReports: e.target.value })} placeholder="reportes@microlabscr.com" />
                            <div className="md:col-span-2">
                                <FormInput label="Correo de Facturación Electrónica" value={info.emailBilling || ''} onChange={e => setInfo({ ...info, emailBilling: e.target.value })} placeholder="fe@microlabscr.com" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-xl w-full shadow-md transition-all cursor-pointer">
                        Guardar Información Corporativa
                    </button>
                </form>
            )}

            {/* TAB 3: MICROBIÓLOGOS */}
            {activeTab === 'microbiologists' && (
                <form onSubmit={handleGeneralSave} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-fade-in">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Microbiólogos Químicos Clínicos y Validadores Oficiales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Director Técnico / Regente Principal" value={info.directorName || ''} onChange={e => setInfo({ ...info, directorName: e.target.value })} placeholder="Dr. Roldán Ajún Chaverri" />
                            <FormInput label="Código / Registro Profesional MQC" value={info.directorCode || ''} onChange={e => setInfo({ ...info, directorCode: e.target.value })} placeholder="802" />
                            <FormInput label="Microbiólogo Co-firmante / Sede" value={info.professional2Name || ''} onChange={e => setInfo({ ...info, professional2Name: e.target.value })} placeholder="Dr. José Guillermo Ajún Jiménez" />
                            <FormInput label="Código / Registro Co-firmante" value={info.professional2Code || ''} onChange={e => setInfo({ ...info, professional2Code: e.target.value })} placeholder="Reg. Trámite" />
                        </div>
                    </div>

                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-xl w-full shadow-md transition-all cursor-pointer">
                        Guardar Profesionales
                    </button>
                </form>
            )}

            {/* MODAL REGISTRAR / EDITAR SUCURSAL */}
            {editingBranch && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg text-slate-800">
                                        {isNewBranch ? 'Registrar Nueva Sucursal' : 'Editar Sucursal de Laboratorio'}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Configure los datos de la sede para órdenes e informes.</p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setEditingBranch(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-2 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveBranch} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Sede <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={editingBranch.code} 
                                        onChange={e => setEditingBranch({ ...editingBranch, code: e.target.value.toUpperCase() })} 
                                        placeholder="Ej. SJO-02" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de la Sucursal <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={editingBranch.name} 
                                        onChange={e => setEditingBranch({ ...editingBranch, name: e.target.value })} 
                                        placeholder="Ej. Sucursal San José Centro" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Sucursal</label>
                                    <select 
                                        value={editingBranch.type} 
                                        onChange={e => setEditingBranch({ ...editingBranch, type: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
                                    >
                                        <option>Sucursal de Análisis y Muestreo</option>
                                        <option>Puesto de Extracción y Toma de Muestras</option>
                                        <option>Laboratorio Satélite Industrial</option>
                                        <option>Sede Matriz & Laboratorio Central</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Permiso Ministerio de Salud</label>
                                    <input 
                                        type="text" 
                                        value={editingBranch.permitNumber || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, permitNumber: e.target.value })} 
                                        placeholder="Ej. MINSA-02451" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección Exacta de la Sede <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    required
                                    value={editingBranch.address} 
                                    onChange={e => setEditingBranch({ ...editingBranch, address: e.target.value })} 
                                    placeholder="Ej. San José, Calle 1, Avenidas 2 y 4, frente a..." 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfonos Directos</label>
                                    <input 
                                        type="tel" 
                                        value={editingBranch.telephones || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, telephones: e.target.value })} 
                                        placeholder="Ej. 2222-1111" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp de Sede</label>
                                    <input 
                                        type="tel" 
                                        value={editingBranch.whatsapp || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, whatsapp: e.target.value })} 
                                        placeholder="Ej. 8888-9999" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo de Sede</label>
                                    <input 
                                        type="email" 
                                        value={editingBranch.email || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, email: e.target.value })} 
                                        placeholder="sede@microlabs.com" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Microbiólogo Regente de Sede <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={editingBranch.directorName || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, directorName: e.target.value })} 
                                        placeholder="Dr. / Dra. Nombre Completo" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código MQC Regente <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={editingBranch.directorCode || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, directorCode: e.target.value })} 
                                        placeholder="Ej. 802 o 1234" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingBranch(null)}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                    {isNewBranch ? 'Guardar Sucursal' : 'Actualizar Sucursal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
