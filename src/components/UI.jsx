import React, { useState, useEffect } from 'react';
import { AlertTriangle, Microscope, Lock } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, LIMSSystemId } from '../services/firebase';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { 
        console.error("UI Error:", error, errorInfo); 
        
        // Registrar error en Firebase automáticamente
        try {
            addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/lab_system_errors`), {
                errorMessage: error.toString(),
                componentStack: errorInfo?.componentStack || 'No stack trace available',
                timestamp: serverTimestamp(),
                status: 'Pendiente',
                userAgent: navigator.userAgent
            });
        } catch (e) {
            console.error("No se pudo guardar el log de error en Firebase", e);
        }
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center text-slate-800 bg-white rounded-2xl m-6 border border-slate-200 shadow-xl max-w-lg mx-auto animate-fade-in">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Recuperación de Interfaz</h2>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        Se detectó una discrepancia de estado en la sesión. Puedes reiniciar la vista para continuar sin problemas.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button 
                            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer border-0"
                        >
                            Volver al Inicio
                        </button>
                        <button 
                            onClick={() => { localStorage.clear(); window.location.href = '/login'; }} 
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border-0"
                        >
                            Reiniciar Sesión
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export const Logo = ({ url, className = "h-10 w-10", variant = "icon" }) => {
    const logoSrc = url || "/logo.png";
    
    if (variant === "full") {
        return (
            <div className={`${className} flex items-center justify-center select-none`}>
                <img 
                    src={logoSrc} 
                    alt="Laboratorio Microlabs Centro Microbiológico" 
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                        if (e.target.src !== window.location.origin + '/logo.png') {
                            e.target.src = '/logo.png';
                        }
                    }}
                />
            </div>
        );
    }

    if (variant === "horizontal") {
        return (
            <div className={`${className} flex items-center select-none`}>
                <div className="bg-white/95 px-2.5 py-1 rounded-xl shadow-xs border border-slate-700/40 flex items-center justify-center">
                    <img 
                        src={logoSrc} 
                        alt="Microlabs Centro Microbiológico" 
                        className="h-6 w-auto max-w-[170px] object-contain"
                        onError={(e) => {
                            if (e.target.src !== window.location.origin + '/logo.png') {
                                e.target.src = '/logo.png';
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    // Default: 'icon'
    return (
        <div className={`${className} flex items-center justify-center shrink-0`}>
            <div className="bg-white p-1 rounded-xl shadow-xs flex items-center justify-center overflow-hidden border border-slate-200/80">
                <img 
                    src={logoSrc} 
                    alt="Microlabs" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        if (e.target.src !== window.location.origin + '/logo.png') {
                            e.target.src = '/logo.png';
                        }
                    }}
                />
            </div>
        </div>
    );
};

export const LoadingSpinner = () => {
    const [showText, setShowText] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowText(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            {showText && <p className="text-slate-500 font-medium animate-pulse">Cargando sistema LIMS...</p>}
        </div>
    );
};

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, confirmText = 'Confirmar', confirmColor = 'bg-blue-600 hover:bg-blue-700' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-slate-800">{title}</h3>
                <div className="mb-6 text-slate-600">{children}</div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium">Cancelar</button>
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white font-medium ${confirmColor}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export const FormInput = ({ label, name, type = 'text', value, onChange, required = false, className = '', placeholder = '' }) => (
    <div className={className}>
        <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <input
            type={type} id={name} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
        />
    </div>
);

export const StatusBadge = ({ status }) => {
    const styles = {
        'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'En Proceso': 'bg-blue-100 text-blue-800 border-blue-200',
        'Esperando Validación': 'bg-orange-100 text-orange-800 border-orange-200',
        'Completado': 'bg-green-100 text-green-800 border-green-200',
        'En Corrección': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
            {status}
        </span>
    );
};

export const BarcodeDisplay = ({ value }) => {
    const valueStr = String(value || '');
    const charCodeSum = valueStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return (
        <div className="bg-white p-2 rounded border border-slate-200 inline-block text-center select-none">
            <div className="h-8 flex items-end justify-center gap-[2px] mb-1 px-1">
                {[...Array(24)].map((_, i) => {
                    const hash = (charCodeSum * (i + 1)) % 100;
                    const isThick = hash % 3 === 0;
                    const heightPercent = 50 + (hash % 45);
                    return (
                        <div 
                            key={i} 
                            className="bg-slate-900" 
                            style={{ 
                                width: isThick ? '2px' : '1px', 
                                height: `${heightPercent}%` 
                            }}
                        ></div>
                    );
                })}
            </div>
            <p className="font-mono text-[10px] tracking-widest text-slate-600">{value}</p>
        </div>
    );
};

export const RestrictedAccess = ({ navigateTo }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Lock size={48} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Acceso Restringido</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">No tienes los privilegios necesarios para acceder a esta sección del sistema.</p>
            <button onClick={() => navigateTo('home')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md">
                Volver al Inicio
            </button>
        </div>
    );
};
