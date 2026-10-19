import React, { useState, useEffect } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { FormInput, RestrictedAccess } from '../components/UI';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';
import { getApiUrl } from '../utils/api';
import { 
    Building2, PlusCircle, Edit3, Trash2, CheckCircle2, Star, MapPin, 
    Phone, Mail, UserCheck, ShieldCheck, CreditCard, Copy, Check,
    UserPlus, ShieldAlert, KeyRound, Lock, Eye, EyeOff, User, AlertCircle, RefreshCw,
    Database, Download, Upload, HardDrive, FileCheck2, AlertTriangle
} from 'lucide-react';
import { OFFICIAL_BANK_ACCOUNTS, SINPE_MOVIL_INFO } from '../constants/bankAccounts';
import versionData from '../version.json';

export const LabSettings = ({ db, labInfo, userRole, user, navigateTo }) => {
    const [copiedIban, setCopiedIban] = useState('');
    const [info, setInfo] = useState(() => {
        // Deep-copy to avoid mutating the incoming prop reference (ESLint: no prop mutation)
        const base = { ...(labInfo || {}) };
        if (!base.name) base.name = 'Laboratorio Microlabs Químicos S.A.';
        if (!base.legalId && !base.cedulaJuridica) {
            base.legalId = '3101144450';
            base.cedulaJuridica = '3101144450';
        }
        if (!base.website) base.website = 'www.microlabscr.com';
        if (!base.address) base.address = '75 metros norte del correo de Guadalupe, Goicoechea, San José, Costa Rica';
        if (!base.telephones) base.telephones = '+506 22348837, +506 22345862, +506 22246541';
        if (!base.whatsapp) base.whatsapp = '71382750';
        if (!base.email) base.email = 'laboratorio@microlabscr.com';
        if (!base.emailReports) base.emailReports = 'reportes@microlabscr.com';
        if (!base.emailBilling) base.emailBilling = 'fe@microlabscr.com';
        if (!base.emailCxC) base.emailCxC = 'cxc@microlabscr.com';
        if (!base.directorName) base.directorName = 'Dr. Roldan Ajún Chaverri';
        if (!base.directorCode) base.directorCode = '802';
        if (!base.professional2Name) base.professional2Name = 'M.Q.C. José Guillermo Ajún Jiménez';
        if (!base.professional2Code) base.professional2Code = 'Reg. Trámite';
        if (!base.professional3Name) base.professional3Name = 'M.Q.C. Roldán Alberto Ajún Jiménez';
        if (!base.professional3Code) base.professional3Code = 'Reg. Trámite';

        if (!base.branches || base.branches.length === 0) {
            base.branches = [
                {
                    id: 'suc-guadalupe',
                    code: 'GUA-01',
                    name: 'Sede Central Guadalupe',
                    legalId: '3101144450',
                    cedulaJuridica: '3101144450',
                    type: 'Sede Matriz & Laboratorio Central',
                    isMain: true,
                    address: '75 metros norte del correo de Guadalupe, Goicoechea, San José, Costa Rica',
                    telephones: '+506 22348837, +506 22345862, +506 22246541',
                    whatsapp: '71382750',
                    email: 'laboratorio@microlabscr.com',
                    emailReports: 'reportes@microlabscr.com',
                    emailBilling: 'fe@microlabscr.com',
                    emailCxC: 'cxc@microlabscr.com',
                    website: 'www.microlabscr.com',
                    directorName: 'Dr. Roldan Ajún Chaverri',
                    directorCode: '802',
                    permitNumber: 'MINSA-01048',
                    active: true
                }
            ];
        } else {
            // Always spread the branches array to avoid shared reference mutation
            base.branches = [...base.branches];
        }
        return base;
    });

    const [activeTab, setActiveTab] = useState('branches'); // 'general' | 'branches' | 'microbiologists'
    const [editingBranch, setEditingBranch] = useState(null); // modal state: null or branch object
    const [isNewBranch, setIsNewBranch] = useState(false);

    const { addNotification } = useNotification();

    // ===== RESPALDOS Y SNAPSHOTS DE BASE DE DATOS (ISO 15189 / 21 CFR Part 11) =====
    const [isExportingBackup, setIsExportingBackup] = useState(false);
    const [backupMetadata, setBackupMetadata] = useState(null);
    const [verifyFileResult, setVerifyFileResult] = useState(null);
    const [isVerifyingFile, setIsVerifyingFile] = useState(false);

    // ===== GESTIÓN DE PERSONAL Y USUARIOS INTERNOS (STAFF) =====
    const [staffUsers, setStaffUsers] = useState(() => {
        const saved = localStorage.getItem('lims_local_staff_users');
        if (saved) {
            try { return JSON.parse(saved); } catch { /* ignore */ }
        }
        return [
            { 
                id: 1, 
                fullName: 'Dr. Roldan Ajún Chaverri', 
                email: 'director@microlabscr.com', 
                role: 'TECHNICAL_DIRECTOR', 
                licenseNumber: '802', 
                identification: '1-0524-0891',
                isActive: true,
                scope: 'Regencia y Dirección Técnica, validación oficial, co-firma y auditoría 21 CFR Part 11'
            },
            { 
                id: 2, 
                fullName: 'M.Q.C. José Guillermo Ajún Jiménez', 
                email: 'jose.ajun@microlabscr.com', 
                role: 'CLINICAL_ANALYST', 
                licenseNumber: 'Reg. Trámite', 
                identification: '1-1450-0231',
                isActive: true,
                scope: 'Microbiólogo Clínico e Industrial, control de calidad analítico y validación'
            },
            { 
                id: 3, 
                fullName: 'M.Q.C. Roldán Alberto Ajún Jiménez', 
                email: 'roldan.ajun@microlabscr.com', 
                role: 'CLINICAL_ANALYST', 
                licenseNumber: 'Reg. Trámite', 
                identification: '1-1678-0412',
                isActive: true,
                scope: 'Microbiólogo Analista y Co-firmante, ensayos fisicoquímicos y microbiológicos'
            },
            { 
                id: 4, 
                fullName: 'Licda. Ana Sofía Morales', 
                email: 'recepcion@microlabscr.com', 
                role: 'RECEPTION', 
                licenseNumber: 'SEC-104', 
                identification: '1-1204-0552',
                isActive: true,
                scope: 'Admisión de muestras, facturación electrónica y entrega de PIN de retiro a pacientes'
            }
        ];
    });

    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState({
        fullName: '',
        identification: '',
        role: 'CLINICAL_ANALYST',
        licenseNumber: '',
        email: '',
        password: '',
        signaturePin: ''
    });
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffError, setStaffError] = useState('');
    const [showStaffPassword, setShowStaffPassword] = useState(false);

    // Cargar personal desde API si el backend está activo
    useEffect(() => {
        let isMounted = true;
        const fetchStaff = async () => {
            try {
                const token = sessionStorage.getItem('lims_token');
                const API_URL = getApiUrl();
                const res = await fetch(`${API_URL}/api/auth/staff-users`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && data.staffUsers && data.staffUsers.length > 0) {
                        setStaffUsers(data.staffUsers);
                        localStorage.setItem('lims_local_staff_users', JSON.stringify(data.staffUsers));
                    }
                }
            } catch {
                // Modo respaldo/local
            }
        };
        fetchStaff();
        return () => { isMounted = false; };
    }, []);

    const generateSecurePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setStaffForm(prev => ({ ...prev, password: pass }));
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setStaffError('');

        if (staffForm.password.length < 8) {
            setStaffError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setStaffLoading(true);
        try {
            const token = sessionStorage.getItem('lims_token');
            const API_URL = getApiUrl();
            let savedApiUser = null;

            try {
                const res = await fetch(`${API_URL}/api/auth/staff-users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(staffForm)
                });
                if (res.ok) {
                    const data = await res.json();
                    savedApiUser = data.user;
                } else {
                    const err = await res.json().catch(() => ({}));
                    if (res.status === 400 && err.error) {
                        setStaffError(err.error);
                        setStaffLoading(false);
                        return;
                    }
                }
            } catch {
                // Fallback local
            }

            const newStaffUser = {
                id: savedApiUser?.id || Date.now(),
                fullName: staffForm.fullName.trim(),
                email: staffForm.email.trim().toLowerCase(),
                role: staffForm.role,
                identification: staffForm.identification.trim(),
                licenseNumber: staffForm.licenseNumber.trim() || null,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            const updated = [newStaffUser, ...staffUsers];
            setStaffUsers(updated);
            localStorage.setItem('lims_local_staff_users', JSON.stringify(updated));

            // Sincronizar en Firebase Firestore si está habilitado
            try {
                if (db) {
                    await setDoc(doc(db, 'users', `staff-${newStaffUser.id}`), {
                        fullName: newStaffUser.fullName,
                        email: newStaffUser.email,
                        role: newStaffUser.role.toLowerCase(),
                        identification: newStaffUser.identification,
                        licenseNumber: newStaffUser.licenseNumber,
                        isActive: true,
                        isStaff: true
                    }, { merge: true });
                }
            } catch {
                /* ignore firestore setDoc errors */
            }

            await logAuditAction(
                db, 
                user?.uid, 
                'CREAR_COLABORADOR_STAFF', 
                `Se dio de alta internamente al colaborador ${newStaffUser.fullName} con rol ${newStaffUser.role}.`, 
                String(newStaffUser.id)
            );

            addNotification(`Colaborador ${newStaffUser.fullName} dado de alta exitosamente.`, 'success');
            setShowStaffModal(false);
            setStaffForm({ fullName: '', identification: '', role: 'CLINICAL_ANALYST', licenseNumber: '', email: '', password: '', signaturePin: '' });
        } catch (err) {
            setStaffError(err.message || 'Error al dar de alta al colaborador.');
        } finally {
            setStaffLoading(false);
        }
    };

    const handleToggleStaffStatus = async (staffId) => {
        const target = staffUsers.find(s => s.id === staffId);
        if (!target) return;

        if (target.email === 'director@microlabscr.com' || target.role === 'ADMINISTRATOR') {
            alert('No se puede desactivar la cuenta del Administrador / Dirección Técnica Principal.');
            return;
        }

        const newStatus = !target.isActive;
        const confirmMsg = newStatus 
            ? `¿Desea reactivar los permisos de acceso para ${target.fullName}?` 
            : `¿Está seguro de suspender inmediatamente el acceso al sistema para ${target.fullName}? No podrá iniciar sesión hasta ser reactivado.`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const token = sessionStorage.getItem('lims_token');
            const API_URL = getApiUrl();
            await fetch(`${API_URL}/api/auth/staff-users/${staffId}/toggle`, {
                method: 'PATCH',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            }).catch(() => null);

            const updated = staffUsers.map(s => s.id === staffId ? { ...s, isActive: newStatus } : s);
            setStaffUsers(updated);
            localStorage.setItem('lims_local_staff_users', JSON.stringify(updated));

            await logAuditAction(
                db, 
                user?.uid, 
                newStatus ? 'ACTIVAR_STAFF' : 'SUSPENDER_STAFF', 
                `Se modificó el estado de ${target.fullName} a ${newStatus ? 'ACTIVO' : 'SUSPENDIDO'}.`, 
                String(staffId)
            );

            addNotification(`Acceso de ${target.fullName} ${newStatus ? 'activado' : 'suspendido'}.`, 'success');
        } catch {
            addNotification('Error al modificar estado del colaborador.', 'error');
        }
    };

    // Funciones de Respaldo y Snapshot Cifrado (ISO 15189 / 21 CFR Part 11)
    const computeSHA256 = async (text) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleExportEncryptedSnapshot = async () => {
        setIsExportingBackup(true);
        try {
            const timestamp = new Date().toISOString();
            const actorName = user?.displayName || user?.email || 'Administrador LIMS';

            // Recolectar datos completos del sistema
            const snapshotData = {
                metadata: {
                    format: "MICROLABS_ENCRYPTED_SNAPSHOT_V2",
                    institution: "Laboratorio Microlabs Químicos S.A.",
                    legalId: "3101144450",
                    exportedAt: timestamp,
                    exportedBy: actorName,
                    systemVersion: versionData?.version || "2.5.0",
                    fullVersion: versionData?.fullVersion || "2.5.0",
                    regulationStandard: "ISO 15189:2022 / ISO/IEC 17025:2017 / 21 CFR Part 11"
                },
                data: {
                    labInfo: info,
                    staffUsers: staffUsers,
                    requests: JSON.parse(localStorage.getItem('lims_local_requests') || '[]'),
                    clients: JSON.parse(localStorage.getItem('lims_local_clients') || '[]'),
                    analyses: JSON.parse(localStorage.getItem('lims_local_analyses') || '[]'),
                    auditLogs: JSON.parse(localStorage.getItem('lims_local_audit_logs') || '[]'),
                    accessLogs: JSON.parse(localStorage.getItem('lims_local_access_logs') || '[]')
                }
            };

            const jsonString = JSON.stringify(snapshotData);
            const checksum = await computeSHA256(jsonString);

            const finalPackage = {
                ...snapshotData,
                integrity: {
                    algorithm: "SHA-256",
                    checksum: checksum,
                    totalRequests: snapshotData.data.requests.length,
                    totalStaff: snapshotData.data.staffUsers.length,
                    totalAuditLogs: snapshotData.data.auditLogs.length
                }
            };

            // Descarga de archivo snapshot .limsbak
            const blob = new Blob([JSON.stringify(finalPackage, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const filename = `microlabs_lims_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.limsbak`;
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            await logAuditAction(
                db,
                user?.uid,
                'DATABASE_SNAPSHOT_EXPORTED',
                `Exportación y firma de respaldo de base de datos completa (${filename}). SHA-256: ${checksum.slice(0, 16)}... Total Muestras: ${snapshotData.data.requests.length}`,
                'BACKUP-SYS'
            );

            setBackupMetadata({
                filename,
                checksum,
                exportedAt: timestamp,
                totalRecords: snapshotData.data.requests.length + snapshotData.data.staffUsers.length + snapshotData.data.auditLogs.length
            });

            addNotification(`Snapshot de base de datos generado exitosamente (${filename}).`, 'success');
        } catch (err) {
            console.error("Error creating backup:", err);
            addNotification('Error al generar snapshot de base de datos.', 'error');
        } finally {
            setIsExportingBackup(false);
        }
    };

    const handleVerifyBackupFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsVerifyingFile(true);
        setVerifyFileResult(null);
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            if (!parsed.metadata || !parsed.data || !parsed.integrity) {
                throw new Error("El archivo no posee la estructura canónica de un snapshot Microlabs LIMS.");
            }

            const dataToVerify = {
                metadata: parsed.metadata,
                data: parsed.data
            };
            const computed = await computeSHA256(JSON.stringify(dataToVerify));
            const isValid = computed === parsed.integrity.checksum;

            setVerifyFileResult({
                filename: file.name,
                isValid,
                metadata: parsed.metadata,
                integrity: parsed.integrity,
                computedChecksum: computed,
                data: parsed.data
            });
        } catch (err) {
            setVerifyFileResult({
                filename: file.name,
                isValid: false,
                error: err.message || "Archivo corrupto o formato no reconocido."
            });
        } finally {
            setIsVerifyingFile(false);
        }
    };

    const handleRestoreBackup = async () => {
        if (!verifyFileResult || !verifyFileResult.isValid) return;
        if (!window.confirm("ADVERTENCIA CRÍTICA: La restauración sobrescribirá los datos analíticos y configuraciones locales con los del snapshot. ¿Desea proceder?")) {
            return;
        }

        try {
            const { data } = verifyFileResult;
            if (data.labInfo) {
                setInfo(data.labInfo);
                localStorage.setItem('lims_local_labInfo', JSON.stringify(data.labInfo));
            }
            if (data.staffUsers) {
                setStaffUsers(data.staffUsers);
                localStorage.setItem('lims_local_staff_users', JSON.stringify(data.staffUsers));
            }
            if (data.requests) {
                localStorage.setItem('lims_local_requests', JSON.stringify(data.requests));
            }
            if (data.clients) {
                localStorage.setItem('lims_local_clients', JSON.stringify(data.clients));
            }
            if (data.analyses) {
                localStorage.setItem('lims_local_analyses', JSON.stringify(data.analyses));
            }

            window.dispatchEvent(new Event('lims_local_data_updated'));

            await logAuditAction(
                db,
                user?.uid,
                'DATABASE_RESTORE_EXECUTED',
                `Restauración completa de base de datos desde snapshot ${verifyFileResult.filename}. Versión original: ${verifyFileResult.metadata.systemVersion}`,
                'RESTORE-SYS'
            );

            addNotification("Base de datos restaurada correctamente desde el snapshot.", 'success');
            setVerifyFileResult(null);
        } catch {
            addNotification("Error al restaurar la base de datos.", 'error');
        }
    };

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
            directorName: info.directorName || 'Dr. Roldan Ajún Chaverri',
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
                <button
                    type="button"
                    onClick={() => setActiveTab('banking')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeTab === 'banking' 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <CreditCard size={15} /> Cuentas Bancarias & IBAN
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('staff')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeTab === 'staff' 
                            ? 'bg-slate-900 text-white shadow-md shadow-slate-900/30' 
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <ShieldCheck size={15} className="text-amber-400" /> Personal & Roles Staff ({staffUsers.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('backup')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        activeTab === 'backup' 
                            ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/30' 
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <Database size={15} /> Respaldos & Snapshot DB
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
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Información del Laboratorio (Razón Social y Registro Tributario)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Nombre o Razón Social del Laboratorio" value={info.name || ''} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder="Laboratorio Microlabs Químicos S.A." />
                            <FormInput label="Cédula Jurídica (Costa Rica)" value={info.legalId || info.cedulaJuridica || ''} onChange={e => setInfo({ ...info, legalId: e.target.value, cedulaJuridica: e.target.value })} placeholder="3101144450" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Sitio Web Oficial" value={info.website || ''} onChange={e => setInfo({ ...info, website: e.target.value })} placeholder="www.microlabscr.com" />
                            <FormInput label="URL del Logo Oficial" value={info.logoUrl || ''} onChange={e => setInfo({ ...info, logoUrl: e.target.value })} placeholder="/logo.png" />
                        </div>
                        <FormInput label="Dirección de la Sede Matriz (Guadalupe)" value={info.address || ''} onChange={e => setInfo({ ...info, address: e.target.value })} placeholder="75 metros norte del correo de Guadalupe, Goicoechea, San José, Costa Rica" />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Canales de Contacto Centrales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Teléfonos de Atención Central" value={info.telephones || ''} onChange={e => setInfo({ ...info, telephones: e.target.value })} placeholder="+506 22348837, +506 22345862, +506 22246541" />
                            <FormInput label="WhatsApp Central" value={info.whatsapp || ''} onChange={e => setInfo({ ...info, whatsapp: e.target.value })} placeholder="71382750" />
                            <FormInput label="Correo Central / General" value={info.email || ''} onChange={e => setInfo({ ...info, email: e.target.value })} placeholder="laboratorio@microlabscr.com" />
                            <FormInput label="Correo de Resultados e Informes" value={info.emailReports || ''} onChange={e => setInfo({ ...info, emailReports: e.target.value })} placeholder="resultados@microlabscr.com" />
                            <div className="md:col-span-2">
                                <FormInput label="Correo de Facturas Electrónicas y Gastos Externos" value={info.emailBilling || ''} onChange={e => setInfo({ ...info, emailBilling: e.target.value })} placeholder="fe@microlabscr.com" />
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
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Microbiólogos Químicos Clínicos y Validadores Oficiales
                            </h3>
                            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                3 Profesionales Habilitados
                            </span>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                                <span>👥</span> <span>Cuerpo Profesional de Regencia & Firmas Microlabs</span>
                            </p>
                            <p className="text-[11px] text-blue-900 leading-relaxed">
                                Los reportes cuentan con selector dinámico de firmas según el caso (Regente individual, analista individual o firmas conjuntas). Al graduarse e incorporarse <strong>Roldán Alberto Ajún Jiménez</strong>, su firma y sello ya están plenamente integrados en el sistema para validar y co-firmar cualquier reporte clínico o industrial.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Regente Principal */}
                            <FormInput label="Director Técnico & Regente Principal" value={info.directorName || ''} onChange={e => setInfo({ ...info, directorName: e.target.value })} placeholder="Dr. Roldan Ajún Chaverri" />
                            <FormInput label="Código / Registro Profesional MQC Regente" value={info.directorCode || ''} onChange={e => setInfo({ ...info, directorCode: e.target.value })} placeholder="802" />
                            
                            {/* Hijo 1: José Guillermo */}
                            <FormInput label="Microbiólogo Analista / Técnico Complementario (Hijo)" value={info.professional2Name || ''} onChange={e => setInfo({ ...info, professional2Name: e.target.value })} placeholder="M.Q.C. José Guillermo Ajún Jiménez" />
                            <FormInput label="Código / Registro Analista Complementario" value={info.professional2Code || ''} onChange={e => setInfo({ ...info, professional2Code: e.target.value })} placeholder="Reg. Trámite" />

                            {/* Hijo 2: Roldán Alberto */}
                            <FormInput label="Microbiólogo Analista / Co-firmante (Hijo)" value={info.professional3Name || ''} onChange={e => setInfo({ ...info, professional3Name: e.target.value })} placeholder="M.Q.C. Roldán Alberto Ajún Jiménez" />
                            <FormInput label="Código / Registro Profesional Analista (Hijo)" value={info.professional3Code || ''} onChange={e => setInfo({ ...info, professional3Code: e.target.value })} placeholder="Reg. Trámite" />
                        </div>
                    </div>

                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-xl w-full shadow-md transition-all cursor-pointer">
                        Guardar Profesionales
                    </button>
                </form>
            )}

            {/* TAB 4: CUENTAS BANCARIAS & IBAN OFICIAL */}
            {activeTab === 'banking' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4">
                        <div>
                            <h3 className="text-sm font-extrabold text-slate-800">
                                Cuentas Bancarias Institucionales — Microlabs Químicos S.A.
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Cédula Jurídica: <strong className="text-slate-800">3-101-144450</strong> • Certificadas para cobro de facturas y proformas.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Cuentas Activas & Validadas
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {OFFICIAL_BANK_ACCOUNTS.map((acc) => (
                            <div key={acc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-extrabold text-sm text-slate-900">{acc.bankName}</h4>
                                        <p className="text-xs text-slate-500 font-medium">{acc.accountType} ({acc.currency})</p>
                                    </div>
                                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {acc.currency} {acc.currencySymbol}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Nº de Cuenta:</span>
                                        <span className="font-mono font-semibold">{acc.accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Cuenta Cliente:</span>
                                        <span className="font-mono text-slate-700">{acc.clientNumber}</span>
                                    </div>
                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Código IBAN</span>
                                            <span className="font-mono font-bold text-slate-800 text-xs tracking-tight">{acc.iban}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(acc.iban);
                                                setCopiedIban(acc.id);
                                                setTimeout(() => setCopiedIban(''), 2500);
                                            }}
                                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                            title="Copiar IBAN"
                                        >
                                            {copiedIban === acc.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                            <span>{copiedIban === acc.id ? 'Copiado' : 'Copiar'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Banner SINPE Móvil */}
                    <div className="p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <span className="text-xs uppercase font-extrabold tracking-wider text-sky-100">Canal de Pago Inmediato</span>
                            <h4 className="text-lg font-black mt-0.5">SINPE Móvil Oficial: {SINPE_MOVIL_INFO.displayPhone}</h4>
                            <p className="text-xs text-sky-100">Titular: {SINPE_MOVIL_INFO.holder} • Cédula: {SINPE_MOVIL_INFO.legalId}</p>
                        </div>
                        <div className="text-right text-xs">
                            <span className="block text-sky-200">Envío de comprobantes:</span>
                            <strong className="underline text-white">{SINPE_MOVIL_INFO.notifyEmail}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: GESTIÓN LOCAL DE PERSONAL, USUARIOS INTERNOS Y ROLES (STAFF) */}
            {activeTab === 'staff' && (
                <div className="space-y-6 animate-fade-in text-left">
                    {/* Encabezado del Módulo de Personal */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                                    <ShieldAlert size={18} />
                                </span>
                                <h3 className="font-extrabold text-sm text-white tracking-wide">
                                    Directorio Institucional de Personal & Control de Accesos LIMS
                                </h3>
                                <span className="bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30">
                                    ISO 17025 / 15189
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                                El auto-registro remoto está totalmente inhabilitado. Todo colaborador del laboratorio debe ser dado de alta y autorizado aquí por la Dirección Técnica, con los alcances estrictos de su competencia profesional.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setStaffError(''); setShowStaffModal(true); }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                        >
                            <UserPlus size={15} /> Dar de Alta Colaborador
                        </button>
                    </div>

                    {/* Banner Normativo de Alcances */}
                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-amber-950">
                        <div className="space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-amber-900">
                                <Lock size={14} className="text-amber-600" /> Principio de Mínimo Privilegio (Least Privilege):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-amber-900/90 pt-1">
                                <span className="bg-white/70 p-2 rounded-lg border border-amber-200/60">
                                    <strong>Dirección Técnica:</strong> Firma digital oficial, aprobación y auditoría.
                                </span>
                                <span className="bg-white/70 p-2 rounded-lg border border-amber-200/60">
                                    <strong>Analista Clínico:</strong> Carga de lecturas analíticas y QC interno.
                                </span>
                                <span className="bg-white/70 p-2 rounded-lg border border-amber-200/60">
                                    <strong>Facturación/Recepción:</strong> Órdenes, cobro y PIN de entrega confidencial.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tarjetas de Colaboradores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {staffUsers.map((member) => {
                            const isDirector = member.role === 'TECHNICAL_DIRECTOR' || member.role === 'ADMINISTRATOR';
                            const isAnalyst = member.role === 'CLINICAL_ANALYST' || member.role === 'MICROBIOLOGIST';
                            const isReception = member.role === 'RECEPTION';

                            const roleBadgeLabel = isDirector 
                                ? 'Dirección Técnica / Regente' 
                                : isAnalyst 
                                    ? 'Microbiólogo / Analista' 
                                    : isReception 
                                        ? 'Recepción de Muestras' 
                                        : 'Facturación & Administración';

                            const roleBadgeColor = isDirector 
                                ? 'bg-purple-100 text-purple-800 border-purple-200' 
                                : isAnalyst 
                                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                    : 'bg-teal-100 text-teal-800 border-teal-200';

                            return (
                                <div 
                                    key={member.id} 
                                    className={`bg-white rounded-2xl p-5 border transition-all shadow-xs relative flex flex-col justify-between ${
                                        member.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50 opacity-60'
                                    }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-extrabold text-sm text-slate-900">{member.fullName}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}>
                                                        {roleBadgeLabel}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium block mt-0.5">{member.email}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                member.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                                {member.isActive ? 'Activo' : 'Suspendido'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 mb-3 bg-slate-50/50 rounded-lg p-2.5">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cédula / Identificación</span>
                                                <span className="font-mono text-slate-800 font-semibold">{member.identification || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Registro / CQCR</span>
                                                <span className="font-mono text-slate-800 font-semibold">{member.licenseNumber || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Alcance y Facultades en LIMS:</span>
                                            <p className="text-[11px] text-slate-600 leading-relaxed bg-white border border-slate-150 p-2 rounded-lg">
                                                {member.scope || (
                                                    isDirector 
                                                        ? 'Firma de reportes oficiales, co-firma analítica, configuración de sede y gestión de accesos.' 
                                                        : isAnalyst 
                                                            ? 'Procesamiento de muestras, carga de resultados de analizadores y control de calidad (QC).' 
                                                            : 'Admisión y rotulación de muestras, facturación y entrega de PIN de retiro confidencial.'
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStaffStatus(member.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                member.isActive 
                                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            }`}
                                        >
                                            {member.isActive ? 'Suspender Acceso' : 'Reactivar Acceso'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 6: RESPALDOS Y SNAPSHOTS DE BASE DE DATOS (ISO 15189 / 21 CFR Part 11) */}
            {activeTab === 'backup' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Encabezado */}
                    <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-wider">
                                <ShieldCheck size={16} /> Continuidad Operativa & Recuperación ante Desastres
                            </div>
                            <h3 className="text-xl font-black tracking-tight">
                                Respaldos y Snapshots Cifrados de Base de Datos
                            </h3>
                            <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
                                Conforme a los requisitos de integridad de datos de ISO 15189:2022 (cláusula 8.9) y 21 CFR Part 11. Permite congelar, verificar y exportar en un solo clic la base de datos completa con sellado de integridad SHA-256.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tarjeta 1: Generar y Descargar Snapshot */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                                        <HardDrive size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-sm text-slate-800">
                                            Exportar Snapshot Completo (.limsbak)
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            Empaqueta configuraciones, catálogo, muestras, personal y bitácoras.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-xs text-slate-600 space-y-2">
                                    <div className="font-bold text-slate-700 flex items-center justify-between">
                                        <span>Tablas y Registros Incluidos:</span>
                                        <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">SHA-256 Sealed</span>
                                    </div>
                                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                                        <li>Configuración de Sede Matriz y Red de Sucursales</li>
                                        <li>Cuentas de Colaboradores Internos y Roles Staff ({staffUsers.length} usuarios)</li>
                                        <li>Órdenes de Muestras Clínicas e Industriales</li>
                                        <li>Catálogo de Análisis, Pruebas y Metodologías</li>
                                        <li>Registro de Trazabilidad y Auditoría de Acciones (Audit Logs)</li>
                                        <li>Bitácoras de Acceso y Trazabilidad de Sesión</li>
                                    </ul>
                                </div>

                                {backupMetadata && (
                                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-1 text-emerald-950">
                                        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                            <span>Snapshot Generado Exitosamente</span>
                                        </div>
                                        <p className="text-[11px] font-mono text-emerald-800 truncate">
                                            📄 {backupMetadata.filename}
                                        </p>
                                        <p className="text-[10px] font-mono text-emerald-700 truncate">
                                            🔒 SHA-256: {backupMetadata.checksum}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleExportEncryptedSnapshot}
                                disabled={isExportingBackup}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Download size={16} />
                                <span>{isExportingBackup ? 'Generando y Firmando Snapshot...' : 'Descargar Snapshot de Base de Datos (.limsbak)'}</span>
                            </button>
                        </div>

                        {/* Tarjeta 2: Verificador de Integridad y Restauración */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                                        <FileCheck2 size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-sm text-slate-800">
                                            Verificar y Restaurar Snapshot
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            Valida la firma matemática del archivo antes de aplicar restauraciones.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Seleccione el archivo .limsbak a verificar:
                                    </label>
                                    <input
                                        type="file"
                                        accept=".limsbak,.json"
                                        onChange={handleVerifyBackupFile}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white cursor-pointer"
                                    />
                                </div>

                                {isVerifyingFile && (
                                    <div className="p-3 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                                        <RefreshCw size={14} className="animate-spin text-indigo-600" />
                                        <span>Calculando y verificando hash SHA-256 en memoria...</span>
                                    </div>
                                )}

                                {verifyFileResult && (
                                    <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                                        verifyFileResult.isValid 
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                                            : 'bg-rose-50 border-rose-200 text-rose-950'
                                    }`}>
                                        <div className="flex items-center gap-2 font-bold">
                                            {verifyFileResult.isValid ? (
                                                <>
                                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                                    <span>Integridad Criptográfica Verificada (100% Auténtico)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                                                    <span>Error de Integridad: Archivo Manipulado o Inválido</span>
                                                </>
                                            )}
                                        </div>

                                        {verifyFileResult.isValid ? (
                                            <div className="space-y-1 text-[11px] text-emerald-800">
                                                <p><strong>Emisor:</strong> {verifyFileResult.metadata.institution} ({verifyFileResult.metadata.legalId})</p>
                                                <p><strong>Versión LIMS:</strong> {verifyFileResult.metadata.systemVersion}</p>
                                                <p><strong>Fecha de Creación:</strong> {new Date(verifyFileResult.metadata.exportedAt).toLocaleString()}</p>
                                                <p className="font-mono text-[10px] truncate"><strong>Hash:</strong> {verifyFileResult.integrity.checksum}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-rose-800">
                                                {verifyFileResult.error || "El checksum calculado no coincide con la firma del emisor. Por seguridad, no se puede restaurar."}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleRestoreBackup}
                                disabled={!verifyFileResult || !verifyFileResult.isValid}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Upload size={16} />
                                <span>Restaurar Base de Datos desde Snapshot</span>
                            </button>
                        </div>
                    </div>
                </div>
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cédula Jurídica</label>
                                    <input 
                                        type="text" 
                                        value={editingBranch.legalId || editingBranch.cedulaJuridica || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, legalId: e.target.value, cedulaJuridica: e.target.value })} 
                                        placeholder="3101144450" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Permiso Ministerio Salud</label>
                                    <input 
                                        type="text" 
                                        value={editingBranch.permitNumber || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, permitNumber: e.target.value })} 
                                        placeholder="Ej. MINSA-01048" 
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
                                    placeholder="75 metros norte del correo de Guadalupe, Goicoechea, San José, Costa Rica" 
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
                                        placeholder="+506 22348837, 22345862, 22246541" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp de Sede</label>
                                    <input 
                                        type="tel" 
                                        value={editingBranch.whatsapp || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, whatsapp: e.target.value })} 
                                        placeholder="71382750" 
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo de Sede</label>
                                    <input 
                                        type="email" 
                                        value={editingBranch.email || ''} 
                                        onChange={e => setEditingBranch({ ...editingBranch, email: e.target.value })} 
                                        placeholder="laboratorio@microlabscr.com" 
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

            {/* MODAL ALTA SEGURA DE COLABORADOR / PERSONAL INTERNO */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                                    <UserPlus size={20} className="text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg text-slate-800">
                                        Alta Segura de Colaborador (Personal Staff)
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">
                                        Creación local de usuario interno con rol normativo y credenciales directas.
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowStaffModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-2 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {staffError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                                <span>{staffError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Nombre Completo y Título Profesional <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    value={staffForm.fullName} 
                                    onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })} 
                                    placeholder="Ej. M.Q.C. María Elena Morales" 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Cédula de Identidad <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={staffForm.identification} 
                                        onChange={e => setStaffForm({ ...staffForm, identification: e.target.value })} 
                                        placeholder="1-1234-0567" 
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Nº Colegiatura / CQCR
                                    </label>
                                    <input 
                                        type="text" 
                                        value={staffForm.licenseNumber} 
                                        onChange={e => setStaffForm({ ...staffForm, licenseNumber: e.target.value })} 
                                        placeholder="CQCR-1234 o N/A" 
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Rol Operativo en LIMS <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={staffForm.role}
                                        onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        <option value="CLINICAL_ANALYST">Microbiólogo / Analista Clínico</option>
                                        <option value="RECEPTION">Facturación & Recepción de Muestras</option>
                                        <option value="TECHNICAL_DIRECTOR">Dirección Técnica / Regente</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Correo Institucional <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={staffForm.email} 
                                        onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} 
                                        placeholder="colaborador@microlabscr.com" 
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-700 uppercase">
                                        Contraseña Inicial de Acceso <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={generateSecurePassword}
                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                    >
                                        <KeyRound size={12} /> Generar Clave Segura
                                    </button>
                                </div>
                                <div className="relative">
                                    <input 
                                        type={showStaffPassword ? "text" : "password"} 
                                        required 
                                        value={staffForm.password} 
                                        onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} 
                                        placeholder="Mínimo 8 caracteres (A-Z, a-z, 0-9)" 
                                        className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowStaffPassword(v => !v)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        {showStaffPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowStaffModal(false)}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={staffLoading}
                                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                                >
                                    {staffLoading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} className="text-amber-400" />}
                                    <span>Dar de Alta y Emitir Credenciales</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
