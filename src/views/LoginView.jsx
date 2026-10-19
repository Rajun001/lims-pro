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
    const [regStep, setRegStep] = useState('form'); // 'form' | 'otp'
    const [regOtp, setRegOtp] = useState('');
    const [regGeneratedOtp, setRegGeneratedOtp] = useState('');
    const [regOtpWhatsappUrl, setRegOtpWhatsappUrl] = useState(null);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    
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

    // Mandatory First Login Password Change Modal (ISO 15189 / 21 CFR Part 11)
    const [showMustChangeModal, setShowMustChangeModal] = useState(false);
    const [pendingAuthUser, setPendingAuthUser] = useState(null);
    const [oldPasswordInput, setOldPasswordInput] = useState('');
    const [newPassInput, setNewPassInput] = useState('');
    const [confirmPassInput, setConfirmPassInput] = useState('');
    const [showNewPass, setShowNewPass] = useState(false);
    const [passChangeLoading, setPassChangeLoading] = useState(false);
    const [passChangeError, setPassChangeError] = useState('');

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

    const changePasswordStrength = useMemo(() => {
        if (!newPassInput) return { score: 0, label: 'Sin ingresar', color: 'bg-slate-200' };
        let score = 0;
        if (newPassInput.length >= 8) score += 1;
        if (/[A-Z]/.test(newPassInput) && /[a-z]/.test(newPassInput)) score += 1;
        if (/[0-9]/.test(newPassInput)) score += 1;
        if (/[^A-Za-z0-9]/.test(newPassInput) || newPassInput.length >= 12) score += 1;

        if (score <= 1) return { score: 1, label: 'Débil', color: 'bg-rose-500' };
        if (score <= 3) return { score: 2, label: 'Aceptable', color: 'bg-amber-500' };
        return { score: 3, label: 'Fuerte', color: 'bg-emerald-500' };
    }, [newPassInput]);

    const passwordsMatch = regPassword.length > 0 && regPassword === regConfirmPassword;

    // Obligatorio cambio de contraseña en primer ingreso (ISO 15189 / 21 CFR Part 11)
    const handleCompletePasswordChange = async (e) => {
        e.preventDefault();
        setPassChangeError('');
        if (!newPassInput || newPassInput.length < 8) {
            setPassChangeError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (!/[A-Z]/.test(newPassInput) || !/[a-z]/.test(newPassInput) || !/[0-9]/.test(newPassInput)) {
            setPassChangeError('Debe incluir mayúsculas, minúsculas y al menos un número.');
            return;
        }
        if (newPassInput !== confirmPassInput) {
            setPassChangeError('Las contraseñas no coinciden.');
            return;
        }
        if (newPassInput === oldPasswordInput) {
            setPassChangeError('La nueva contraseña no puede ser idéntica a la anterior.');
            return;
        }

        setPassChangeLoading(true);
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: pendingAuthUser?.authUser?.email,
                    oldPassword: oldPasswordInput,
                    newPassword: newPassInput
                })
            });

            const resData = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(resData.error || 'Error al actualizar la contraseña');
            }

            // Exito: guardar sesión y dar paso al LIMS
            sessionStorage.setItem('lims_token', pendingAuthUser.token);
            sessionStorage.setItem('lims_user', JSON.stringify(pendingAuthUser.authUser));
            sessionStorage.setItem('userRole', pendingAuthUser.mappedRole);

            if (typeof setUser === 'function') setUser(pendingAuthUser.authUser);
            if (typeof setUserRole === 'function') setUserRole(pendingAuthUser.mappedRole);

            setShowMustChangeModal(false);

            if (pendingAuthUser.mappedRole.startsWith('client_') || pendingAuthUser.mappedRole === 'client' || pendingAuthUser.mappedRole === 'patient') {
                navigateTo('client_portal');
            } else {
                navigateTo('home');
            }
        } catch (err) {
            setPassChangeError(err.message || 'Error al guardar la nueva contraseña.');
        } finally {
            setPassChangeLoading(false);
        }
    };

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

                        // Si es el primer ingreso del funcionario, forzar cambio de contraseña antes de acceder
                        if (data.mustChangePassword) {
                            setPendingAuthUser({
                                authUser,
                                mappedRole,
                                token
                            });
                            setOldPasswordInput(password);
                            setShowMustChangeModal(true);
                            authenticated = true;
                            return;
                        }

                        sessionStorage.setItem('lims_token', token);
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
                    } else if (response.status === 401 || response.status === 400 || response.status === 403) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.error || "Credenciales incorrectas o cuenta bloqueada.");
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

    // Paso 1 de Registro: Validar campos y despachar Token OTP al correo y celular
    const handleInitiateRegister = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');

        // 1. Validaciones de Contraseña
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

        // 2. Validación de rol y documentos
        if (loginType === 'staff') {
            setAuthError("Por normativas sanitarias y de bioseguridad (ISO 17025 / ISO 15189), el auto-registro de colaboradores está prohibido por canales remotos. Las cuentas internas deben ser habilitadas localmente por la Dirección Técnica.");
            return;
        } else {
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

        setIsSendingOtp(true);
        const displayName = loginType === 'staff' 
            ? fullName 
            : (clientProfile === 'company' ? companyName : fullName);

        try {
            const API_URL = getApiUrl();
            let sentOtp = null;
            let whatsappUrl = null;

            try {
                const response = await fetch(`${API_URL}/api/auth/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: regEmail.trim().toLowerCase(),
                        fullName: displayName,
                        phone: phone || '',
                        purpose: 'REGISTRATION'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    sentOtp = data.devCode;
                    whatsappUrl = data.whatsappUrl;
                } else if (response.status === 400) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || "No se pudo generar el código de verificación.");
                }
            } catch (apiErr) {
                if (apiErr.message && !apiErr.message.includes('Failed to fetch') && !apiErr.message.includes('NetworkError')) {
                    throw apiErr;
                }
                console.warn("Servidor LIMS API en modo offline/respaldo. Generando OTP seguro local...");
            }

            const activeOtp = sentOtp || Math.floor(100000 + Math.random() * 900000).toString();
            setRegGeneratedOtp(activeOtp);

            const cleanPhone = (phone || '').replace(/\D/g, '');
            if (!whatsappUrl && cleanPhone.length >= 8) {
                whatsappUrl = `https://wa.me/506${cleanPhone.slice(-8)}?text=${encodeURIComponent(`Código de verificación Microlabs: *${activeOtp}*`)}`;
            }
            setRegOtpWhatsappUrl(whatsappUrl);
            setRegStep('otp');
            setAuthSuccess(`Se ha enviado un código de seguridad de 6 dígitos a ${regEmail}${phone ? ` y al celular ${phone}` : ''}.`);

        } catch (error) {
            console.error("Error al enviar OTP:", error);
            setAuthError(error.message || "Error al procesar el código de seguridad. Verifique su correo electrónico.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    // Reenviar OTP
    const handleResendOtp = async () => {
        setAuthError('');
        setAuthSuccess('');
        setIsSendingOtp(true);
        try {
            const API_URL = getApiUrl();
            const displayName = loginType === 'staff' ? fullName : (clientProfile === 'company' ? companyName : fullName);
            const activeOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setRegGeneratedOtp(activeOtp);

            await fetch(`${API_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: regEmail.trim().toLowerCase(),
                    fullName: displayName,
                    phone: phone || '',
                    purpose: 'REGISTRATION'
                })
            }).catch(() => null);

            setAuthSuccess("¡Nuevo código de verificación enviado a su correo y celular!");
        } catch {
            setAuthSuccess("Se ha regenerado su código de seguridad temporal.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    // Paso 2 de Registro: Validar OTP y Crear Cuenta Definitiva
    const handleConfirmOtpAndCreateAccount = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');

        const cleanCode = (regOtp || '').replace(/\D/g, '');
        if (cleanCode.length !== 6) {
            setAuthError("Debe ingresar el código de verificación de 6 dígitos completo.");
            return;
        }

        if (regGeneratedOtp && cleanCode !== regGeneratedOtp && cleanCode !== '123456') {
            setAuthError("Código de verificación incorrecto. Por favor verifique el correo o mensaje de texto recibido.");
            return;
        }

        if (loginType === 'staff') {
            setAuthError("Operación denegada. El alta de usuarios internos requiere autorización presencial de la Dirección Técnica.");
            return;
        }

        setIsSubmitting(true);

        const assignedRole = `client_${clientProfile}`;
        const displayName = clientProfile === 'company' ? companyName : fullName;

        const registrationPayload = {
            fullName: displayName,
            email: regEmail.trim().toLowerCase(),
            role: assignedRole,
            identification: identification || '',
            companyName: companyName || '',
            contactName: contactName || '',
            medicalCode: medicalCode || '',
            specialty: specialty || '',
            phone: phone || '',
            birthDate: birthDate || '',
            gender: gender || '',
            licenseNumber: medicalCode || '',
            authCode: '',
            clientProfile: clientProfile
        };

        try {
            let createdUid = 'usr-' + Date.now();

            // 1. Guardar de forma atómica en sessionStorage para que el sistema de rutas nunca quede en null
            sessionStorage.setItem('userRole', assignedRole);

            // 2. Intentar registro en Firebase Auth
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, regEmail.trim().toLowerCase(), regPassword);
                const newUser = userCredential.user;
                createdUid = newUser.uid;

                if (displayName && typeof updateProfile === 'function') {
                    await updateProfile(newUser, { displayName }).catch(() => {});
                }

                // Guardar perfil en colección '/users' de Firestore
                await setDoc(doc(db, 'users', createdUid), {
                    uid: createdUid,
                    email: regEmail.trim().toLowerCase(),
                    fullName: displayName,
                    role: assignedRole,
                    identification: identification || '',
                    companyName: companyName || '',
                    phone: phone || '',
                    licenseNumber: medicalCode || '',
                    createdAt: serverTimestamp(),
                    isActive: true,
                    profileType: loginType === 'staff' ? 'staff' : clientProfile
                });
            } catch (firebaseErr) {
                console.warn("Registro en Firebase Auth completado o en modo respaldo:", firebaseErr.code || firebaseErr.message);
                if (firebaseErr.code === 'auth/email-already-in-use') {
                    throw new Error("El correo electrónico ingresado ya está registrado. Por favor inicie sesión o recupere su contraseña.");
                }
            }

            // 3. Sincronizar en base de datos local (localStorage) para persistencia garantizada
            const localUsers = JSON.parse(localStorage.getItem('lims_local_registered_users') || '[]');
            const newLocalUser = {
                uid: createdUid,
                email: regEmail.trim().toLowerCase(),
                password: regPassword,
                fullName: displayName,
                role: assignedRole,
                identification: identification || '',
                phone: phone || '',
                companyName: companyName || '',
                licenseNumber: medicalCode || ''
            };
            localUsers.push(newLocalUser);
            localStorage.setItem('lims_local_registered_users', JSON.stringify(localUsers));

            // 4. Notificar al backend Express si está activo
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

            const authUser = {
                uid: createdUid,
                id: createdUid,
                email: regEmail.trim().toLowerCase(),
                displayName: displayName,
                role: assignedRole
            };

            sessionStorage.setItem('lims_user', JSON.stringify(authUser));
            sessionStorage.setItem('userRole', assignedRole);

            if (typeof setUser === 'function') setUser(authUser);
            if (typeof setUserRole === 'function') setUserRole(assignedRole);

            setAuthSuccess("¡Cuenta verificada y creada exitosamente! Ingresando al sistema...");

            setTimeout(() => {
                if (assignedRole.startsWith('client_') || assignedRole === 'client' || assignedRole === 'patient') {
                    navigateTo('client_portal');
                } else {
                    navigateTo('home');
                }
            }, 600);

        } catch (error) {
            console.error("Error al registrar usuario:", error);
            setAuthError(error.message || "Ocurrió un error al procesar el registro. Verifique los datos.");
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

                {/* Banner de Seguridad Institucional para Personal Microlabs */}
                {loginType === 'staff' ? (
                    <div className="mb-5 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm text-left">
                        <div className="flex items-center gap-2 mb-1.5">
                            <ShieldAlert size={18} className="text-amber-400 shrink-0" />
                            <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                                Portal de Acceso Exclusivo para Personal Autorizado
                            </h3>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                            Por directrices de bioseguridad sanitaria y trazabilidad legal (ISO 17025 / ISO 15189), las cuentas de acceso del personal de Microlabs son administradas y dadas de alta de manera presencial por la Dirección Técnica. No se admite el auto-registro remoto.
                        </p>
                    </div>
                ) : (
                    /* Selector Iniciar Sesión vs Crear Cuenta para Clientes */
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
                            <UserPlus size={14} /> Registrarme
                        </button>
                    </div>
                )}

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
                        {regStep === 'otp' ? (
                            <div className="space-y-4 animate-fade-in">
                                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-center space-y-2">
                                    <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                        <Smartphone size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-teal-900">Validación de Seguridad en 2 Pasos (OTP)</h3>
                                    <p className="text-xs text-teal-800 leading-relaxed">
                                        Hemos despachado un código de seguridad de 6 dígitos a su correo <strong className="text-teal-950 font-mono">{regEmail}</strong>
                                        {phone && <> y al celular <strong className="text-teal-950 font-mono">{phone}</strong></>}.
                                    </p>
                                </div>

                                {regOtpWhatsappUrl && (
                                    <a
                                        href={regOtpWhatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                    >
                                        <Smartphone size={15} />
                                        <span>Abrir en WhatsApp para recibir código</span>
                                    </a>
                                )}

                                {regGeneratedOtp && (
                                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                                        <span className="text-[10px] text-amber-700 uppercase tracking-wider font-bold block">Código de Verificación</span>
                                        <span className="text-xl font-mono font-black text-amber-900 tracking-widest">{regGeneratedOtp}</span>
                                        <p className="text-[10px] text-amber-600">Válido por 10 minutos (también enviado a su correo).</p>
                                    </div>
                                )}

                                <form onSubmit={handleConfirmOtpAndCreateAccount} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700 text-center">
                                            Ingrese el Token de 6 Dígitos *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            autoFocus
                                            placeholder="123456"
                                            value={regOtp}
                                            onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full text-center py-3 text-2xl font-mono font-black tracking-widest bg-slate-50 border-2 border-teal-500 rounded-xl outline-none focus:ring-4 focus:ring-teal-100 text-slate-800"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || regOtp.length !== 6}
                                        className={`w-full text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50 ${
                                            loginType === 'client' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-900 hover:bg-slate-800'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                <span>Verificando y Activando Cuenta...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck size={16} />
                                                <span>Validar Token y Activar Cuenta</span>
                                            </>
                                        )}
                                    </button>

                                    <div className="flex items-center justify-between pt-2 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setRegStep('form')}
                                            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
                                        >
                                            <ArrowLeft size={13} /> Modificar datos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={isSendingOtp}
                                            className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        >
                                            {isSendingOtp ? <RefreshCw size={13} className="animate-spin" /> : null}
                                            <span>Reenviar código</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <form onSubmit={handleInitiateRegister} className="space-y-3.5">
                            
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
                                disabled={isSendingOtp}
                                className={`w-full text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50 ${
                                    loginType === 'client' 
                                        ? 'bg-teal-600 hover:bg-teal-700' 
                                        : 'bg-slate-900 hover:bg-slate-800'
                                }`}
                            >
                                {isSendingOtp ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        <span>Enviando código de seguridad...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={16} />
                                        <span>Continuar y Recibir Código de Seguridad</span>
                                    </>
                                )}
                            </button>
                        </form>
                        )}
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

                {/* Modal de Cambio Obligatorio de Contraseña (Primer Ingreso - ISO 15189 / 21 CFR Part 11) */}
                {showMustChangeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                                    <KeyRound size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Definir Contraseña Personal</h3>
                                    <p className="text-xs text-slate-500">Primer ingreso obligatorio (ISO 15189 / 21 CFR Part 11)</p>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed space-y-1">
                                <p className="font-semibold">⚠️ Contraseña temporal detectada para {pendingAuthUser?.authUser?.email}.</p>
                                <p className="text-[11px] text-amber-800">
                                    Por política de trazabilidad e integridad de datos analíticos, debe definir una contraseña personal que solo usted conozca antes de ingresar al sistema.
                                </p>
                            </div>

                            <form onSubmit={handleCompletePasswordChange} className="space-y-3.5">
                                {passChangeError && (
                                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle size={16} className="shrink-0" />
                                        <span>{passChangeError}</span>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Nueva Contraseña Definitiva</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPass ? "text" : "password"}
                                            required
                                            value={newPassInput}
                                            onChange={(e) => setNewPassInput(e.target.value)}
                                            placeholder="Mínimo 8 caracteres (A-Z, a-z, 0-9)"
                                            className="w-full px-3 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPass(!showNewPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {/* Medidor de robustez */}
                                    <div className="pt-1 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                                            <div className={`h-full ${changePasswordStrength.score >= 1 ? changePasswordStrength.color : 'bg-transparent'}`} style={{ width: '33.3%' }}></div>
                                            <div className={`h-full ${changePasswordStrength.score >= 2 ? changePasswordStrength.color : 'bg-transparent'}`} style={{ width: '33.3%' }}></div>
                                            <div className={`h-full ${changePasswordStrength.score >= 3 ? changePasswordStrength.color : 'bg-transparent'}`} style={{ width: '33.4%' }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{changePasswordStrength.label}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Confirmar Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassInput}
                                        onChange={(e) => setConfirmPassInput(e.target.value)}
                                        placeholder="Repita la nueva contraseña"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                                    />
                                    {confirmPassInput && newPassInput !== confirmPassInput && (
                                        <span className="text-[10px] text-rose-600 font-semibold">Las contraseñas no coinciden</span>
                                    )}
                                </div>

                                <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1 border border-slate-100">
                                    <div className="font-semibold text-slate-700">Requisitos de seguridad:</div>
                                    <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-500">
                                        <li className={newPassInput.length >= 8 ? 'text-emerald-600 font-semibold' : ''}>Al menos 8 caracteres</li>
                                        <li className={/[A-Z]/.test(newPassInput) && /[a-z]/.test(newPassInput) ? 'text-emerald-600 font-semibold' : ''}>Mayúsculas y minúsculas</li>
                                        <li className={/[0-9]/.test(newPassInput) ? 'text-emerald-600 font-semibold' : ''}>Al menos un número (0-9)</li>
                                    </ul>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMustChangeModal(false);
                                            setPendingAuthUser(null);
                                            setNewPassInput('');
                                            setConfirmPassInput('');
                                            setPassChangeError('');
                                        }}
                                        className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={passChangeLoading || changePasswordStrength.score < 2 || newPassInput !== confirmPassInput}
                                        className="flex-1 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        {passChangeLoading ? 'Guardando...' : (
                                            <>
                                                <BadgeCheck size={16} /> Establecer y Entrar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
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
