import React, { useState } from 'react';
import { FlaskConical, ShieldCheck, KeyRound, Smartphone, ArrowRight, ArrowLeft } from 'lucide-react';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Logo } from '../components/UI';

export const LoginView = ({ navigateTo, setUserRole, setUser }) => {
    const [loginType, setLoginType] = useState('staff'); // 'staff' or 'client'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [clientProfile, setClientProfile] = useState('patient');
    
    // 2FA States
    const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
    const [otpCode, setOtpCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');

    // Demo / testing help state
    const [showDemoAccess, setShowDemoAccess] = useState(false);

    const handleQuickLogin = (role) => {
        setStep('credentials');
        setOtpCode('');
        
        let targetEmail = '';
        let targetLoginType = 'staff';
        let targetClientProfile = 'patient';
        
        switch (role) {
            case 'admin':
                targetEmail = 'admin-offline@microlabs.com';
                targetLoginType = 'staff';
                break;
            case 'director_tecnico':
                targetEmail = 'director-offline@microlabs.com';
                targetLoginType = 'staff';
                break;
            case 'billing_agent':
                targetEmail = 'facturacion-offline@microlabs.com';
                targetLoginType = 'staff';
                break;
            case 'analyst':
                targetEmail = 'analista-offline@microlabs.com';
                targetLoginType = 'staff';
                break;
            case 'client_patient':
                targetEmail = 'paciente-offline@microlabs.com';
                targetLoginType = 'client';
                targetClientProfile = 'patient';
                break;
            case 'client_company':
                targetEmail = 'empresa-offline@microlabs.com';
                targetLoginType = 'client';
                targetClientProfile = 'company';
                break;
            case 'client_doctor':
                targetEmail = 'medico-offline@microlabs.com';
                targetLoginType = 'client';
                targetClientProfile = 'doctor';
                break;
            default:
                return;
        }
        
        setEmail(targetEmail);
        setPassword('demo123');
        setLoginType(targetLoginType);
        setClientProfile(targetClientProfile);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (loginType === 'client' && step === 'credentials' && email && password) {
            // Trigger 2FA step
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(code);
            setStep('2fa');
            alert(`[SIMULACIÓN SMS] LIMS-PRO: Tu código de seguridad temporal es ${code}. No lo compartas con nadie.`);
            return;
        }

        if (email && password) {
            if (loginType === 'client' && step === '2fa') {
                if (otpCode !== generatedCode) {
                    alert("Código incorrecto. Por favor, verifica el código enviado a tu dispositivo.");
                    return;
                }
            }

            try {
                // Si el correo contiene "offline", forzar el modo local/offline sin intentar conectar a Firebase
                if (email.toLowerCase().includes('offline')) {
                    if (typeof setUser === 'function') {
                        setUser({ uid: 'offline-user', email: email });
                    }
                    if (loginType === 'staff') {
                        if (email.toLowerCase().includes('admin')) {
                            setUserRole('admin');
                        } else if (email.toLowerCase().includes('dt@') || email.toLowerCase().includes('director')) {
                            setUserRole('director_tecnico');
                        } else if (email.toLowerCase().includes('facturacion') || email.toLowerCase().includes('cobro')) {
                            setUserRole('billing_agent');
                        } else {
                            setUserRole('analyst');
                        }
                        navigateTo('home');
                    } else {
                        setUserRole(`client_${clientProfile}`);
                        navigateTo('client_portal');
                    }
                    return;
                }

                // Iniciar sesión con Firebase real
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const loggedUser = userCredential.user;

                // Obtener rol desde Firestore en la colección '/users'
                const userDocRef = doc(db, 'users', loggedUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                    throw new Error("El usuario no tiene un rol asignado en la base de datos.");
                }

                const role = userDocSnap.data().role;
                setUserRole(role);
                
                if (role.startsWith('client_')) {
                    navigateTo('client_portal');
                } else {
                    navigateTo('home');
                }
            } catch (error) {
                console.error("Error authenticating:", error);
                
                // Si Firebase Auth no está configurado (ej. proveedor de Correo/Contraseña desactivado en la consola)
                // y se usa la contraseña demo, iniciamos sesión local de forma automática para no bloquear al usuario.
                if (error.code === 'auth/configuration-not-found' && password === 'demo123') {
                    console.warn("Firebase Auth no está configurado. Iniciando sesión en modo local/offline.");
                    if (typeof setUser === 'function') {
                        setUser({ uid: 'offline-user', email: email });
                    }
                    if (loginType === 'staff') {
                        if (email.toLowerCase().includes('admin')) {
                            setUserRole('admin');
                        } else if (email.toLowerCase().includes('dt@') || email.toLowerCase().includes('director')) {
                            setUserRole('director_tecnico');
                        } else if (email.toLowerCase().includes('facturacion') || email.toLowerCase().includes('cobro')) {
                            setUserRole('billing_agent');
                        } else {
                            setUserRole('analyst');
                        }
                        navigateTo('home');
                    } else {
                        setUserRole(`client_${clientProfile}`);
                        navigateTo('client_portal');
                    }
                    return;
                }

                let errorMsg = "Error de autenticación. Verifica tus credenciales.";
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMsg = "Credenciales incorrectas. Verifique su correo y contraseña.";
                } else if (error.code === 'auth/configuration-not-found') {
                    errorMsg = "El método de inicio de sesión con Correo y Contraseña no está habilitado en la consola de Firebase para este proyecto.";
                } else if (error.message) {
                    errorMsg = error.message;
                }
                alert(errorMsg);
            }
        }
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setOtpCode('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 sm:p-10 transform transition-all animate-fade-in">
                <div className="flex flex-col items-center justify-center mb-6">
                    {step === 'credentials' ? (
                        <>
                            <Logo variant="full" className="w-52 h-20 mb-4" />
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight text-center">
                                {loginType === 'staff' ? 'Acceso Administrativo' : 'Portal Externo'}
                            </h1>
                            <p className="text-slate-500 text-sm mt-2 text-center">
                                {loginType === 'staff' ? 'Gestión interna del laboratorio LIMS' : 'Acceso seguro para empresas, pacientes y médicos'}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck size={32} />
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight text-center">
                                Verificación en Dos Pasos
                            </h1>
                            <p className="text-slate-500 text-sm mt-2 text-center">
                                Hemos enviado un código temporal a tu dispositivo móvil para autorizar el acceso.
                            </p>
                        </>
                    )}
                </div>

                {step === 'credentials' ? (
                    <>
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => setLoginType('staff')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'staff' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Personal LIMS
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginType('client')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginType === 'client' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Acceso Externo
                            </button>
                        </div>

                        {loginType === 'client' && (
                            <div className="flex gap-2 mb-6">
                                <button type="button" onClick={() => setClientProfile('patient')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border ${clientProfile === 'patient' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Paciente</button>
                                <button type="button" onClick={() => setClientProfile('company')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border ${clientProfile === 'company' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Empresa</button>
                                <button type="button" onClick={() => setClientProfile('doctor')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all border ${clientProfile === 'doctor' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Médico</button>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                                    placeholder={loginType === 'staff' ? "admin@microlabs.com" : "contacto@correo.com"}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 mt-2">
                                {loginType === 'staff' ? 'Ingresar al Sistema' : 'Siguiente'} {loginType === 'client' && <ArrowRight size={18} />}
                            </button>
                        </form>
                    </>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6 animate-slide-in-right">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 text-center">Código de Seguridad (6 dígitos)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Smartphone size={20} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength="6"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center text-2xl tracking-[0.5em] font-bold text-slate-700"
                                    placeholder="000000"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                            <button type="submit" disabled={otpCode.length < 6} className="w-full bg-indigo-600 disabled:bg-indigo-300 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex justify-center items-center gap-2">
                                <KeyRound size={18} /> Verificar Código y Entrar
                            </button>
                            <button type="button" onClick={handleBackToCredentials} className="w-full text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all flex justify-center items-center gap-2 text-sm border border-transparent hover:border-slate-200">
                                <ArrowLeft size={16} /> Volver a Usuario y Contraseña
                            </button>
                        </div>
                    </form>
                )}

                {/* Demo Access Panel */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => setShowDemoAccess(!showDemoAccess)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 hover:bg-blue-100/80 rounded-xl text-blue-700 font-semibold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] border border-blue-100/50 cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                            </span>
                            ¿Probando el LIMS? Usar Accesos Demo (Modo Local)
                        </span>
                        <span>{showDemoAccess ? '▲' : '▼'}</span>
                    </button>
                    
                    {showDemoAccess && (
                        <div className="mt-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3.5 animate-fade-in text-left">
                            <p className="text-[11px] text-slate-500 leading-normal">
                                Para probar sin conexión a Firebase, haz clic en un rol. Esto autocompletará las credenciales "offline" y podrás iniciar sesión directamente.
                            </p>
                            
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal LIMS (Vistas Internas)</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickLogin('admin')}
                                        className="px-2.5 py-2 bg-white border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50/50 hover:text-blue-700 transition-all text-left shadow-sm flex justify-between items-center cursor-pointer"
                                    >
                                        <span>Administrador</span>
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">Admin</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickLogin('director_tecnico')}
                                        className="px-2.5 py-2 bg-white border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50/50 hover:text-blue-700 transition-all text-left shadow-sm flex justify-between items-center cursor-pointer"
                                    >
                                        <span>Dir. Técnico</span>
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">DT</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickLogin('analyst')}
                                        className="px-2.5 py-2 bg-white border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50/50 hover:text-blue-700 transition-all text-left shadow-sm flex justify-between items-center cursor-pointer"
                                    >
                                        <span>Analista</span>
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">User</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickLogin('billing_agent')}
                                        className="px-2.5 py-2 bg-white border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50/50 hover:text-blue-700 transition-all text-left shadow-sm flex justify-between items-center cursor-pointer"
                                    >
                                        <span>Facturación</span>
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">Bill</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Acceso Externo (Clientes)</div>
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickLogin('client_patient')}
                                        className="px-2 py-2 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all text-center shadow-sm cursor-pointer"
                                    >
                                        Paciente
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickLogin('client_company')}
                                        className="px-2 py-2 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all text-center shadow-sm cursor-pointer"
                                    >
                                        Empresa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickLogin('client_doctor')}
                                        className="px-2 py-2 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all text-center shadow-sm cursor-pointer"
                                    >
                                        Médico
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-center">Conexión cifrada de punto a punto<br />Cumplimiento normativa de privacidad</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
