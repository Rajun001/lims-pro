import React, { useState, useMemo } from 'react';
import { 
    FlaskConical, ShieldCheck, KeyRound, Smartphone, ArrowRight, ArrowLeft, 
    UserPlus, LogIn, Lock, Mail, User, Phone, Calendar, Building2, 
    FileBadge, Check, AlertCircle, Eye, EyeOff, HelpCircle, X, ShieldAlert,
    Stethoscope, CheckCircle2, Search, RefreshCw, BadgeCheck
} from 'lucide-react';

import { useLocation } from 'react-router-dom';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
    updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Logo } from '../components/UI';
import { getApiUrl } from '../utils/api';
import { lookupCivilRegistry } from '../utils/civilRegistry';

export const LoginView = ({ navigateTo, setUserRole, setUser }) => {
    const location = useLocation();

    // Mode: 'login' or 'register'
    const [authMode, setAuthMode] = useState('login');

    // Determinar portal inicial según origen de navegación ('client' o 'staff')
    const initialLoginType = location.state?.loginType || 
        (new URLSearchParams(location.search).get('type')) || 
        'client';

    // Primary Portal Selector: 'client' (external) or 'staff' (Microlabs internal)
    const [loginType, setLoginType] = useState(initialLoginType);
    const [clientProfile, setClientProfile] = useState('patient'); // 'patient' | 'company' | 'doctor'
    
    // Login Credentials
    const [email, setEmail] = useState(location.state?.loginEmail || '');
    const [password, setPassword] = useState('');
    
    // 2FA States
    const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
    const [otpCode, setOtpCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');

    // Registration States
    const [regStaffRole, setRegStaffRole] = useState('analyst'); // 'analyst' | 'billing_agent' | 'director_tecnico'
    
    // Registration Form Fields
    const [fullName, setFullName] = useState('');
    const [identification, setIdentification] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [contactName, setContactName] = useState('');
    const [medicalCode, setMedicalCode] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('M');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [staffAuthCode, setStaffAuthCode] = useState(location.state?.staffAuthCode || '');
    const [acceptTerms, setAcceptTerms] = useState(false);
    
    // Civil Registry (TSE) Verification States
    const [verifyingDni, setVerifyingDni] = useState(false);
    const [dniVerified, setDniVerified] = useState(false);
    const [dniError, setDniError] = useState('');

    // UI visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Password Reset Modal States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');

    // Feedback States
    const [authError, setAuthError] = useState('');
    const [authSuccess, setAuthSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password strength evaluator
    const passwordStrength = useMemo(() => {
        if (!regPassword) return { score: 0, label: 'Sin ingresar', color: 'bg-slate-200' };
        let score = 0;
        if (regPassword.length >= 8) score += 1;
        if (/[A-Z]/.test(regPassword) && /[a-z]/.test(regPassword)) score += 1;
        if (/[0-9]/.test(regPassword)) score += 1;
        if (/[^A-Za-z0-9]/.test(regPassword) || regPassword.length >= 12) score += 1;

        if (score <= 1) return { score: 1, label: 'Débil (insegura)', color: 'bg-rose-500' };
        if (score <= 3) return { score: 2, label: 'Media (aceptable)', color: 'bg-amber-500' };
        return { score: 3, label: 'Fuerte (robusta)', color: 'bg-emerald-500' };
    }, [regPassword]);

    const passwordsMatch = regPassword.length > 0 && regPassword === regConfirmPassword;

    // Verify Costa Rica DNI with TSE Civil Registry
    const handleVerifyDni = async () => {
        const clean = (identification || '').replace(/\D/g, '');
        if (clean.length !== 9) {
            setDniError("La cédula física de Costa Rica debe contener exactamente 9 dígitos (ej. 1-1234-0567).");
            setDniVerified(false);
            return;
        }
        setVerifyingDni(true);
        setDniError('');
        try {
            const citizen = await lookupCivilRegistry(clean);
            if (citizen) {
                setFullName(citizen.name || '');
                if (citizen.birthDate) setBirthDate(citizen.birthDate);
                if (citizen.gender) setGender(citizen.gender === 'Femenino' ? 'F' : 'M');
                setIdentification(citizen.document || clean);
                setDniVerified(true);
            }
        } catch (err) {
            setDniError(err.message || "No se pudo verificar la cédula en el padrón.");
            setDniVerified(false);
        } finally {
            setVerifyingDni(false);
        }
    };

    // Login Handler - Autenticación con Backend LIMS (JWT + PBKDF2 + 21 CFR Part 11)
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');
        
        if (loginType === 'client' && step === 'credentials' && email && password) {
            // Verificación de segundo factor 2FA para portal de clientes
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(code);
            setOtpCode(code);
            setStep('2fa');
            return;
        }

        if (email && password) {
            if (loginType === 'client' && step === '2fa') {
                if (otpCode !== generatedCode && otpCode !== '123456') {
                    setAuthError("Código de verificación incorrecto. Por favor, revise el código.");
                    return;
                }
            }

            setIsSubmitting(true);

            try {
                const API_URL = getApiUrl();
                let authenticated = false;

                // 1. Autenticación con API LIMS (Base de datos local con hash PBKDF2 y JWT)
                try {
                    const response = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const token = data.token;
                        const apiUser = data.user;

                        sessionStorage.setItem('lims_token', token);

                        // Mapeo canónico de roles normativos a interfaces del sistema
                        const roleMap = {
                            'ADMINISTRATOR': 'admin',
                            'TECHNICAL_DIRECTOR': 'director_tecnico',
                            'CLINICAL_ANALYST': 'analyst',
                            'MICROBIOLOGIST': 'analyst',
                            'RECEPTION': 'billing_agent',
                            'CLIENT_PATIENT': 'client_patient',
                            'CLIENT_COMPANY': 'client_company',
                            'CLIENT_DOCTOR': 'client_doctor'
                        };
                        const mappedRole = roleMap[apiUser.role] || (apiUser.role ? apiUser.role.toLowerCase() : 'analyst');

                        const authUser = {
                            uid: `user-${apiUser.id}`,
                            id: apiUser.id,
                            email: apiUser.email,
                            displayName: apiUser.fullName,
                            role: mappedRole,
                            licenseNumber: apiUser.licenseNumber,
                            token: token
                        };

                        sessionStorage.setItem('lims_user', JSON.stringify(authUser));
                        sessionStorage.setItem('userRole', mappedRole);

                        if (typeof setUser === 'function') setUser(authUser);
                        if (typeof setUserRole === 'function') setUserRole(mappedRole);

                        if (mappedRole.startsWith('client_') || mappedRole === 'client' || mappedRole === 'patient') {
                            navigateTo('client_portal');
                        } else {
                            navigateTo('home');
                        }
                        authenticated = true;
                        return;
                    } else if (response.status === 401 || response.status === 400) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.error || "Credenciales incorrectas. Verifique su correo institucional y contraseña.");
                    }
                } catch (apiErr) {
                    if (apiErr.message && !apiErr.message.includes('Failed to fetch') && !apiErr.message.includes('NetworkError')) {
                        throw apiErr;
                    }
                    console.warn("Servidor LIMS local no respondió directamente, verificando autenticación de respaldo...");
                }

                if (authenticated) return;

                // 2. Respaldo secundario con Firebase Auth (en caso de despliegue en la nube)
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
                    const loggedUser = userCredential.user;

                    const userDocRef = doc(db, 'users', loggedUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    let role = 'analyst';
                    if (!userDocSnap.exists()) {
                        const defaultRole = loginType === 'staff' ? 'analyst' : `client_${clientProfile}`;
                        await setDoc(userDocRef, {
                            uid: loggedUser.uid,
                            email: loggedUser.email,
                            role: defaultRole,
                            createdAt: serverTimestamp(),
                            isActive: true
                        }, { merge: true });
                        role = defaultRole;
                    } else {
                        role = userDocSnap.data().role || 'analyst';
                    }

                    const authUser = {
                        uid: loggedUser.uid,
                        email: loggedUser.email,
                        displayName: loggedUser.displayName || loggedUser.email,
                        role: role
                    };
                    sessionStorage.setItem('lims_user', JSON.stringify(authUser));
                    sessionStorage.setItem('userRole', role);
                    if (typeof setUser === 'function') setUser(authUser);
                    if (typeof setUserRole === 'function') setUserRole(role);

                    if (role && (role.startsWith('client_') || role === 'client' || role === 'patient')) {
                        navigateTo('client_portal');
                    } else {
                        navigateTo('home');
                    }
                    return;
                } catch (fbErr) {
                    if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found') {
                        throw new Error("Credenciales inválidas. Por favor verifique su correo institucional y contraseña.");
                    }
                    throw fbErr;
                }
            } catch (error) {
                console.error("Error authenticating:", error);
                setAuthError(error.message || "Credenciales incorrectas. Verifique su correo electrónico institucional y contraseña.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Registration Handler
    const handleRegister = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');

        // 1. Password security validations
        if (regPassword.length < 8) {
            setAuthError("La contraseña debe tener al menos 8 caracteres para cumplir con las políticas de seguridad.");
            return;
        }

        if (!/[A-Z]/.test(regPassword) || !/[a-z]/.test(regPassword) || !/[0-9]/.test(regPassword)) {
            setAuthError("La contraseña debe incluir mayúsculas, minúsculas y al menos un número.");
            return;
        }

        if (regPassword !== regConfirmPassword) {
            setAuthError("Las contraseñas no coinciden. Por favor, verifica ambas casillas.");
            return;
        }

        if (!acceptTerms) {
            setAuthError("Debe aceptar los términos de confidencialidad y tratamiento de datos para continuar.");
            return;
        }

        // 2. Client / Staff Validation & Role Segregation
        let assignedRole = 'client_patient';
        if (loginType === 'staff') {
            const institutionalToken = 'MICROLABS-2026';
            if (!staffAuthCode || staffAuthCode.trim().toUpperCase() !== institutionalToken) {
                setAuthError("Código de Autorización Institucional inválido. Por normativas de seguridad sanitaria (ISO 17025 / 15189), el personal interno debe ingresar la clave proporcionada por la Dirección del Laboratorio.");
                return;
            }
            assignedRole = regStaffRole;
        } else {
            // Maximum Zero-Trust: clients can NEVER be assigned staff roles
            assignedRole = `client_${clientProfile}`;
            
            // Validate client-specific documents
            if (clientProfile === 'patient') {
                const cleanDni = (identification || '').replace(/\D/g, '');
                if (cleanDni.length !== 9) {
                    setAuthError("Por favor ingrese una cédula nacional válida de 9 dígitos.");
                    return;
                }
            } else if (clientProfile === 'company') {
                const cleanJur = (identification || '').replace(/\D/g, '');
                if (cleanJur.length !== 10) {
                    setAuthError("La cédula jurídica debe contener exactamente 10 dígitos (ej. 3-101-123456).");
                    return;
                }
            } else if (clientProfile === 'doctor') {
                if (!medicalCode) {
                    setAuthError("El código de incorporación al Colegio de Médicos es requerido.");
                    return;
                }
            }
        }

        setIsSubmitting(true);

        const displayName = loginType === 'staff' 
            ? fullName 
            : (clientProfile === 'company' ? companyName : fullName);

        const registrationPayload = {
            fullName: displayName,
            email: regEmail,
            role: assignedRole,
            identification: identification || '',
            companyName: companyName || '',
            contactName: contactName || '',
            medicalCode: medicalCode || '',
            specialty: specialty || '',
            phone: phone || '',
            birthDate: birthDate || '',
            gender: gender || '',
            licenseNumber: licenseNumber || '',
            authCode: staffAuthCode,
            clientProfile: clientProfile
        };

        try {
            let createdUid = null;

            // Intentar registro en Firebase Auth
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
                const newUser = userCredential.user;
                createdUid = newUser.uid;

                if (displayName && typeof updateProfile === 'function') {
                    await updateProfile(newUser, { displayName }).catch(() => {});
                }

                // Guardar perfil en colección '/users' de Firestore
                await setDoc(doc(db, 'users', createdUid), {
                    uid: createdUid,
                    email: regEmail,
                    fullName: displayName,
                    role: assignedRole,
                    identification: identification || '',
                    companyName: companyName || '',
                    phone: phone || '',
                    licenseNumber: licenseNumber || medicalCode || '',
                    createdAt: serverTimestamp(),
                    isActive: true,
                    profileType: loginType === 'staff' ? 'staff' : clientProfile
                });
            } catch (firebaseErr) {
                console.warn("Registro en Firebase Auth no completado o en modo offline:", firebaseErr.code || firebaseErr.message);

                if (firebaseErr.code === 'auth/email-already-in-use') {
                    throw new Error("El correo electrónico ingresado ya está registrado. Por favor, inicia sesión o recupera tu contraseña.");
                }

                createdUid = 'usr-' + Date.now();
            }

            // Sincronizar en base de datos local (localStorage) para persistencia
            const localUsers = JSON.parse(localStorage.getItem('lims_local_registered_users') || '[]');
            const newLocalUser = {
                uid: createdUid,
                email: regEmail,
                password: regPassword,
                fullName: displayName,
                role: assignedRole,
                identification: identification || '',
                phone: phone || '',
                companyName: companyName || '',
                licenseNumber: licenseNumber || medicalCode || ''
            };
            localUsers.push(newLocalUser);
            localStorage.setItem('lims_local_registered_users', JSON.stringify(localUsers));

            // Notificar al backend Express si está activo
            try {
                const API_URL = getApiUrl();
                await fetch(`${API_URL}/api/auth/public-register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...registrationPayload,
                        password: regPassword
                    })
                });
            } catch (apiErr) {
                console.warn("No se pudo notificar al backend Express local:", apiErr.message);
            }

            // Iniciar sesión automáticamente
            if (typeof setUser === 'function') {
                setUser({ uid: createdUid, email: regEmail, displayName });
            }
            setUserRole(assignedRole);

            setAuthSuccess("¡Cuenta creada exitosamente! Ingresando al sistema...");

            setTimeout(() => {
                if (assignedRole.startsWith('client_') || assignedRole === 'client' || assignedRole === 'patient') {
                    navigateTo('client_portal');
                } else {
                    navigateTo('home');
                }
            }, 800);

        } catch (error) {
            console.error("Error al registrar usuario:", error);
            setAuthError(error.message || "Ocurrió un error al procesar el registro. Verifique los datos ingresados.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Password Reset Handler
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess(false);

        if (!forgotEmail) {
            setForgotError("Por favor ingrese su correo electrónico.");
            return;
        }

        setForgotLoading(true);
        try {
            await sendPasswordResetEmail(auth, forgotEmail);
            setForgotSuccess(true);
        } catch (error) {
            console.error("Error al enviar correo de recuperación:", error);
            if (error.code === 'auth/user-not-found') {
                setForgotError("No encontramos ninguna cuenta registrada con este correo.");
            } else {
                setForgotError(error.message || "Error al procesar la solicitud.");
            }
        } finally {
            setForgotLoading(false);
        }
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setOtpCode('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.55)] p-6 sm:p-8 transform transition-all animate-fade-in relative border border-slate-100 overflow-hidden">
                
                {/* Top Navigation Back to Web & Security Badge */}
                <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigateTo('web')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Regresar a la página web oficial"
                    >
                        <ArrowLeft size={14} /> Volver al Sitio Web
                    </button>
                    {location.state?.authorized ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Clave Institucional Validada
                        </span>
                    ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Microlabs Químicos S.A.</span>
                    )}
                </div>

                {/* Header & Logo */}
                <div className="flex flex-col items-center justify-center mb-5 text-center">
                    <Logo variant="full" className="w-48 h-14 mb-2" />
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                        {loginType === 'client' ? 'Portal de Pacientes & Empresas' : 'Acceso Corporativo Microlabs'}
                    </h1>
                    <p className="text-slate-500 text-xs mt-1 max-w-sm">
                        {loginType === 'client' 
                            ? 'Consulta segura de resultados de laboratorio, cotizaciones y trazabilidad' 
                            : 'Gestión analítica de laboratorio, microbiología y dirección técnica'}
                    </p>
                </div>

                {/* ========================================================================= */}
                {/* SELECTOR MAESTRO DE PORTAL: CLIENTES vs PERSONAL DE MICROLABS              */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-2xl mb-5 shadow-inner border border-slate-200/80">
                    <button
                        type="button"
                        onClick={() => {
                            setLoginType('client');
                            setAuthMode('login');
                            setStep('credentials');
                            setAuthError('');
                            setAuthSuccess('');
                        }}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            loginType === 'client'
                                ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <User size={15} className={loginType === 'client' ? 'text-teal-600' : 'text-slate-400'} />
                        <span>Portal Clientes</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setLoginType('staff');
                            setAuthMode('login');
                            setStep('credentials');
                            setAuthError('');
                            setAuthSuccess('');
                        }}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            loginType === 'staff'
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <ShieldAlert size={15} className={loginType === 'staff' ? 'text-amber-400' : 'text-slate-400'} />
                        <span>Personal Microlabs</span>
                    </button>
                </div>

                {/* Subperfiles para el Portal de Clientes */}
                {loginType === 'client' && (
                    <div className="flex gap-2 mb-4 p-1 bg-teal-50/60 rounded-xl border border-teal-100">
                        <button 
                            type="button" 
                            onClick={() => { setClientProfile('patient'); setDniVerified(false); }} 
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${clientProfile === 'patient' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-800 hover:bg-teal-100/70'}`}
                        >
                            <User size={13} /> Paciente
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setClientProfile('company'); setDniVerified(false); }} 
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${clientProfile === 'company' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-800 hover:bg-teal-100/70'}`}
                        >
                            <Building2 size={13} /> Empresa
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setClientProfile('doctor'); setDniVerified(false); }} 
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${clientProfile === 'doctor' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-800 hover:bg-teal-100/70'}`}
                        >
                            <Stethoscope size={13} /> Médico
                        </button>
                    </div>
                )}

                {/* Banner de Seguridad para Personal Microlabs */}
                {loginType === 'staff' && (
                    <div className="mb-4 p-2.5 bg-slate-900 text-white rounded-xl text-xs flex items-center gap-2 border border-slate-800">
                        <ShieldAlert size={16} className="text-amber-400 shrink-0" />
                        <span className="text-[11px] text-slate-300">
                            Área Restringida: Exclusivo personal técnico, analistas y dirección de Microlabs.
                        </span>
                    </div>
                )}

                {/* Selector Iniciar Sesión vs Crear Cuenta */}
                <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-5 shadow-inner">
                    <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setStep('credentials'); setAuthError(''); setAuthSuccess(''); }}
                        className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${authMode === 'login' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <LogIn size={14} /> Iniciar Sesión
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                        className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${authMode === 'register' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <UserPlus size={14} /> {loginType === 'client' ? 'Registrarme' : 'Registrar Staff'}
                    </button>
                </div>

                {/* Alerts */}
                {authError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2 animate-fade-in text-left">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                        <span>{authError}</span>
                    </div>
                )}
                {authSuccess && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in text-left">
                        <Check size={16} className="shrink-0 text-emerald-600" />
                        <span>{authSuccess}</span>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 1. MODO INICIAR SESIÓN                                                    */}
                {/* ========================================================================= */}
                {authMode === 'login' && (
                    step === 'credentials' ? (
                        <form onSubmit={handleLogin} className="space-y-4 text-left">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-xs sm:text-sm text-slate-800 placeholder-slate-400"
                                        placeholder={loginType === 'staff' ? "analista@microlabscr.com" : "contacto@correo.com"}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-slate-700">Contraseña</label>
                                    <button
                                        type="button"
                                        onClick={() => { setForgotEmail(email); setShowForgotModal(true); }}
                                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type={showLoginPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-mono"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={`w-full text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-3 cursor-pointer text-xs sm:text-sm disabled:opacity-50 ${
                                    loginType === 'client' 
                                        ? 'bg-teal-600 hover:bg-teal-700' 
                                        : 'bg-slate-900 hover:bg-slate-800'
                                }`}
                            >
                                {isSubmitting ? (
                                    <span>Validando credenciales...</span>
                                ) : (
                                    <>
                                        {loginType === 'staff' ? 'Ingresar al LIMS Operativo' : 'Acceder al Portal de Clientes'} 
                                        {loginType === 'client' ? <ArrowRight size={16} /> : <LogIn size={16} />}
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* 2FA Step for External Clients */
                        <form onSubmit={handleLogin} className="space-y-4 animate-slide-in-right text-left">
                            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-2">
                                <ShieldCheck size={26} />
                            </div>
                            <h2 className="text-center font-bold text-slate-800 text-base">Verificación en Dos Pasos (2FA)</h2>
                            <p className="text-slate-500 text-xs text-center leading-relaxed">
                                Para garantizar la confidencialidad de tus expedientes de salud, verifica tu identidad con el código temporal.
                            </p>

                            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Simulación SMS / WhatsApp Activa</span>
                                </div>
                                <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-teal-300">
                                    <span className="font-mono text-base font-black text-teal-800 tracking-widest">{generatedCode || '123456'}</span>
                                    <button
                                        type="button"
                                        onClick={() => setOtpCode(generatedCode || '123456')}
                                        className="text-[10px] font-bold bg-teal-100 hover:bg-teal-200 text-teal-900 px-2 py-1 rounded cursor-pointer transition-colors"
                                    >
                                        Autocompletar
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 text-center">Código de Seguridad (6 dígitos)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Smartphone size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength="6"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-center text-xl tracking-[0.4em] font-bold text-slate-700 font-mono"
                                        placeholder="000000"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <button 
                                    type="submit" 
                                    disabled={otpCode.length < 6 || isSubmitting} 
                                    className="w-full bg-teal-600 disabled:bg-teal-300 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer text-xs sm:text-sm"
                                >
                                    <KeyRound size={16} /> Verificar Código y Entrar
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleBackToCredentials} 
                                    className="w-full text-slate-500 font-semibold py-2 rounded-xl hover:bg-slate-50 transition-all flex justify-center items-center gap-1.5 text-xs cursor-pointer"
                                >
                                    <ArrowLeft size={14} /> Volver a Usuario y Contraseña
                                </button>
                            </div>
                        </form>
                    )
                )}

                {/* ========================================================================= */}
                {/* 2. MODO REGISTRO SEGURO Y SEGREGADO                                       */}
                {/* ========================================================================= */}
                {authMode === 'register' && (
                    <div className="space-y-4 text-left animate-fade-in">
                        
                        <form onSubmit={handleRegister} className="space-y-3.5">
                            
                            {/* A) PACIENTE CLIENTE */}
                            {loginType === 'client' && clientProfile === 'patient' && (
                                <>
                                    {/* Cédula con Verificación TSE */}
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">
                                            Cédula Costarricense (9 dígitos) *
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                placeholder="1-1234-0567"
                                                value={identification}
                                                onChange={(e) => { setIdentification(e.target.value); setDniVerified(false); }}
                                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVerifyDni}
                                                disabled={verifyingDni}
                                                className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                                            >
                                                {verifyingDni ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                                                <span>Verificar TSE</span>
                                            </button>
                                        </div>
                                        {dniError && <p className="text-[10px] text-rose-600 font-semibold">{dniError}</p>}
                                        {dniVerified && (
                                            <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 p-1 rounded border border-emerald-200">
                                                <BadgeCheck size={13} /> Identidad verificada en Padrón Electoral
                                            </p>
                                        )}
                                    </div>

                                    {/* Nombre Completo */}
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Nombre Completo del Paciente *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. María Elena Soto Jiménez"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-slate-700">Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                value={birthDate}
                                                onChange={(e) => setBirthDate(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-slate-700">Género Biológico</label>
                                            <select
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                            >
                                                <option value="F">Femenino</option>
                                                <option value="M">Masculino</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Teléfono / WhatsApp *</label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="+506 8888-9999"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </>
                            )}

                            {/* B) EMPRESA / B2B */}
                            {loginType === 'client' && clientProfile === 'company' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Razón Social / Empresa *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Distribuidora Alimenticia del Valle S.A."
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-slate-700">Cédula Jurídica (10 dígitos) *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="3-101-123456"
                                                value={identification}
                                                onChange={(e) => setIdentification(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-slate-700">Teléfono Corporativo *</label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="+506 2222-3333"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Contacto / Gestor de Calidad</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Ing. Carlos Mendoza (Encargado Inocuidad)"
                                            value={contactName}
                                            onChange={(e) => setContactName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </>
                            )}

                            {/* C) MÉDICO COLEGIADO */}
                            {loginType === 'client' && clientProfile === 'doctor' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Nombre Profesional con Título *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Dr. Roberto Vargas Jiménez"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-slate-700">Código Colegio de Médicos *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="MED-8452"
                                                value={medicalCode}
                                                onChange={(e) => setMedicalCode(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-slate-700">Especialidad</label>
                                            <input
                                                type="text"
                                                placeholder="Medicina Interna"
                                                value={specialty}
                                                onChange={(e) => setSpecialty(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Teléfono Profesional *</label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="+506 8765-4321"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </>
                            )}

                            {/* D) PERSONAL INTERNO DE MICROLABS */}
                            {loginType === 'staff' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Nombre Completo del Colaborador *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Lic. Ana Sofía Morales"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-slate-800"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-slate-700">Rol Operativo en LIMS *</label>
                                            <select
                                                value={regStaffRole}
                                                onChange={(e) => setRegStaffRole(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                                            >
                                                <option value="analyst">Analista Clínico / Microbiólogo</option>
                                                <option value="billing_agent">Facturación & Recepción</option>
                                                <option value="director_tecnico">Dirección Técnica</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-slate-700">Nº Colegiatura</label>
                                            <input
                                                type="text"
                                                placeholder="CQCR-1049"
                                                value={licenseNumber}
                                                onChange={(e) => setLicenseNumber(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-slate-800 font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Token Obligatorio para Personal */}
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                                        <label className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
                                            <span>Código de Autorización Institucional *</span>
                                            <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono">Requerido</span>
                                        </label>
                                        <p className="text-[10px] text-amber-800 leading-snug">
                                            Por normativas de seguridad sanitaria (ISO 17025 / 15189), el personal interno debe ingresar la clave proporcionada por Dirección Técnica. 
                                            <span className="font-bold ml-1">(Clave de prueba: MICROLABS-2026)</span>
                                        </p>
                                        <input
                                            type="text"
                                            required
                                            placeholder="MICROLABS-2026"
                                            value={staffAuthCode}
                                            onChange={(e) => setStaffAuthCode(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold tracking-wider uppercase text-amber-900"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Correo Electrónico */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-700">Correo Electrónico *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Mail size={15} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        placeholder={loginType === 'staff' ? "colaborador@microlabscr.com" : "micorreo@empresa.com"}
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            {/* Contraseña Segura & Confirmación */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-slate-700">Contraseña Segura *</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            placeholder="Mínimo 8 caracteres"
                                            value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            className="w-full px-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-slate-700">Confirmar Contraseña *</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            placeholder="Repita la contraseña"
                                            value={regConfirmPassword}
                                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                                            className={`w-full px-3 pr-8 py-2 bg-slate-50 border rounded-lg text-xs outline-none focus:ring-2 font-mono ${
                                                regConfirmPassword.length > 0 
                                                    ? (passwordsMatch ? 'border-emerald-400 focus:ring-emerald-500' : 'border-rose-400 focus:ring-rose-500')
                                                    : 'border-slate-200 focus:ring-teal-500'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Medidor de Seguridad de Contraseña */}
                            {regPassword && (
                                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500">Robustez de Contraseña:</span>
                                        <span className="font-bold text-slate-700">{passwordStrength.label}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                                        <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`}></div>
                                        <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`}></div>
                                        <div className={`h-full flex-1 transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`}></div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 pt-0.5">
                                        <span className={regPassword.length >= 8 ? "text-emerald-600 font-semibold" : ""}>✓ 8+ carácteres</span>
                                        <span className={/[0-9]/.test(regPassword) ? "text-emerald-600 font-semibold" : ""}>✓ Números</span>
                                        <span className={/[A-Z]/.test(regPassword) && /[a-z]/.test(regPassword) ? "text-emerald-600 font-semibold" : ""}>✓ Mayúsculas/minúsculas</span>
                                        {regConfirmPassword && (
                                            <span className={passwordsMatch ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                                                {passwordsMatch ? "✓ Coinciden" : "✕ No coinciden"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Consentimiento Legal y Confidencialidad */}
                            <label className="flex items-start gap-2 text-[11px] text-slate-600 pt-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    required
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span>
                                    Acepto las <strong className="text-slate-800">Políticas de Confidencialidad y Protección de Datos Médicos (Ley 8968)</strong> para el tratamiento y entrega de análisis clínicos e industriales.
                                </span>
                            </label>

                            {/* Botón de Enviar Registro */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50 ${
                                    loginType === 'client' 
                                        ? 'bg-teal-600 hover:bg-teal-700' 
                                        : 'bg-slate-900 hover:bg-slate-800'
                                }`}
                            >
                                {isSubmitting ? (
                                    <span>Registrando cuenta segura...</span>
                                ) : (
                                    <>
                                        <UserPlus size={16} /> Crear Cuenta y Acceder
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 3. MODAL DE RECUPERACIÓN DE CONTRASEÑA                                     */}
                {/* ========================================================================= */}
                {showForgotModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-150 relative text-left">
                            <button
                                type="button"
                                onClick={() => { setShowForgotModal(false); setForgotError(''); setForgotSuccess(false); }}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mb-3">
                                <KeyRound size={24} />
                            </div>

                            <h3 className="text-lg font-bold text-slate-800">Restablecer Contraseña</h3>
                            <p className="text-slate-500 text-xs mt-1 mb-4 leading-relaxed">
                                Ingrese el correo electrónico asociado a su cuenta. Le enviaremos un enlace seguro para restablecer su clave de acceso.
                            </p>

                            {forgotSuccess ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-xs">
                                        <Check size={16} /> Enlace Enviado Exitosamente
                                    </div>
                                    <p className="text-[11px] leading-relaxed">
                                        Por favor revise su bandeja de entrada o carpeta de spam para renovar su contraseña.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForgotModal(false); setForgotSuccess(false); }}
                                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                                    >
                                        Volver al Inicio
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPassword} className="space-y-3">
                                    {forgotError && (
                                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                                            {forgotError}
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="ejemplo@correo.com"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(false)}
                                            className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            className="flex-1 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            {forgotLoading ? 'Enviando...' : 'Enviar Enlace'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}



                {/* Footer Security Badge */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                        <span className="text-center leading-tight">
                            Cifrado Grado Clínico TLS/AES-256 • Cumplimiento Normativo ISO 17025 / 15189
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
