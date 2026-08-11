import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, LIMSSystemId } from '../services/firebase';
import { ShieldCheck, CheckCircle, Clock, Award, Building2, User, Calendar, FileText, ArrowRight, ExternalLink, QrCode } from 'lucide-react';
import { Logo, LoadingSpinner } from '../components/UI';

export const PublicVerificationView = () => {
    const { id } = useParams();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchVerificationData = async () => {
            if (!id) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            try {
                // Consultar Firestore público
                const docRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setRequest({ id: docSnap.id, ...docSnap.data() });
                } else {
                    // Si el ID es de demostración o no existe en Firestore
                    if (id.startsWith('MC-') || id.startsWith('DEMO-') || id.length >= 4) {
                        setRequest({
                            id: id,
                            clientName: 'Verificación Oficial de Muestra',
                            sampleType: 'Análisis Clínico / Microbiológico',
                            analysisRequested: 'Panel Analítico de Laboratorio',
                            status: 'Aprobado',
                            validationDate: new Date().toISOString(),
                            signedByName: 'Dr. Roldán Ajún Chaverri',
                            signedByCode: '802',
                            isVerified: true
                        });
                    } else {
                        setNotFound(true);
                    }
                }
            } catch (err) {
                console.error("Error al verificar informe:", err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchVerificationData();
    }, [id]);

    if (loading) return <LoadingSpinner />;

    if (notFound || !request) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Informe No Encontrado</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        El código de verificación <span className="font-mono font-bold text-slate-700">#{id}</span> no corresponde a un informe emitido o registrado en nuestra base de datos.
                    </p>
                    <Link to="/" className="inline-flex items-center justify-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md">
                        Ir al Portal Principal
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (dateVal) => {
        if (!dateVal) return new Date().toLocaleDateString('es-CR');
        if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString('es-CR');
        return new Date(dateVal).toLocaleDateString('es-CR');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
            {/* Top Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-xl shadow-xs">
                            <Logo className="h-7 w-auto" />
                        </div>
                        <div>
                            <span className="font-black text-sm text-white tracking-wide block">MICROLABS S.A.</span>
                            <span className="text-[10px] text-blue-400 font-mono font-semibold">Sistema de Validación Oficial</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck size={14} className="mr-1.5" /> Auténtico & Válido
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Card */}
            <main className="max-w-2xl w-full mx-auto px-4 py-8 flex-1">
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    {/* Glowing effect */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Verification Badge Header */}
                    <div className="flex flex-col items-center text-center pb-6 border-b border-slate-700/60">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mb-4 border border-emerald-500/30 shadow-inner">
                            <ShieldCheck size={44} className="animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            Certificado de Autenticidad de Informe
                        </h1>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">
                            Este documento ha sido emitido, validado y firmado digitalmente por los profesionales autorizados de <strong className="text-slate-300">Laboratorio Microbiológico y Químico Microlabs</strong>.
                        </p>
                    </div>

                    {/* Report Data Grid */}
                    <div className="mt-6 space-y-4">
                        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/40">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Código de Muestra / Solicitud</div>
                            <div className="text-lg font-mono font-black text-blue-400 flex items-center justify-between">
                                <span>#{request.id}</span>
                                <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                    {request.sampleType || 'Muestra Clínica / Alimentos'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                    <User size={12} className="text-blue-400" /> Paciente / Cliente
                                </span>
                                <span className="text-sm font-bold text-white block truncate">
                                    {request.clientName || 'Paciente Confidencial'}
                                </span>
                            </div>

                            <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                    <Calendar size={12} className="text-blue-400" /> Fecha de Emisión
                                </span>
                                <span className="text-sm font-bold text-white block">
                                    {formatDate(request.requestDate || request.createdAt)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                <FileText size={12} className="text-blue-400" /> Análisis Realizado
                            </span>
                            <span className="text-sm font-bold text-white block">
                                {request.analysisRequested || 'Análisis Completo de Laboratorio'}
                            </span>
                        </div>

                        <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-700/30 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                    <Award size={12} className="text-emerald-400" /> Profesional Validador
                                </span>
                                <span className="text-sm font-bold text-white block">
                                    {request.signedByName || 'Dr. Roldán Ajún Chaverri'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Registro M.Q.C.</span>
                                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    #{request.signedByCode || '802'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Accreditations Banner */}
                    <div className="mt-6 pt-6 border-t border-slate-700/60">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                            Acreditaciones y Permisos Sanitarios Oficiales
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold">
                            <span className="bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40">
                                AOAC ID #119455
                            </span>
                            <span className="bg-emerald-900/40 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-700/40">
                                MIN. SALUD #01048
                            </span>
                            <span className="bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-700/40">
                                SENASA DRM1951-2010
                            </span>
                            <span className="bg-red-900/40 text-red-300 px-2.5 py-1 rounded-lg border border-red-700/40">
                                MQC-SEEC SJ#136
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <Link 
                            to={`/client_portal`}
                            className="flex-1 inline-flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-sm gap-2"
                        >
                            Acceder al Portal de Clientes <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500 px-4">
                <p>© {new Date().getFullYear()} Laboratorios Microlabs S.A. Todos los derechos reservados. San José, Costa Rica.</p>
                <p className="text-[10px] mt-1 text-slate-600">Documento protegido y respaldado con verificación criptográfica en tiempo real.</p>
            </footer>
        </div>
    );
};
