import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { onSnapshot, collection, doc, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { auth, db, LIMSSystemId as appId } from './services/firebase';
import { useNotification } from './contexts/NotificationContext';
import { FlaskConical } from 'lucide-react';
import mockData from './data/mock_data.json';

import { ErrorBoundary, LoadingSpinner } from './components/UI';
import { getApiUrl } from './utils/api.js';

const CALCULATED_CLINICAL_ANALYSES = [
    // Lipids
    { id: 'calc-vldl', code: 'VLDL', name: 'VLDL', category: 'Química Sanguínea', minRange: '10', maxRange: '50', unit: 'mg/dL' },
    { id: 'calc-ldl', code: '1550', name: 'LDL-Colesterol', category: 'Química Sanguínea', minRange: '0', maxRange: '130', unit: 'mg/dL' },
    { id: 'calc-ldl-hdl', code: 'LDL_HDL', name: 'LDL/HDL', category: 'Química Sanguínea', minRange: '0', maxRange: '3.5', unit: '' },
    { id: 'calc-risk', code: 'FR_CT_HDL', name: 'FR- CT/HDL', category: 'Química Sanguínea', minRange: '0', maxRange: '4.5', unit: '' },
    { id: 'calc-nohdl', code: 'COL_NO_HDL', name: 'Colesterol No-HDL', category: 'Química Sanguínea', minRange: '0', maxRange: '130', unit: 'mg/dL' },
    // HOMA
    { id: 'calc-homair', code: 'HOMA_IR', name: 'HOMA-IR', category: 'Química Sanguínea', minRange: '0', maxRange: '2.5', unit: '' },
    { id: 'calc-homabeta', code: 'HOMA_BETA', name: 'HOMA-%B', category: 'Química Sanguínea', minRange: '0', maxRange: '100', unit: '%' },
    { id: 'calc-homasens', code: 'HOMA_SENS', name: 'HOMA-%S', category: 'Química Sanguínea', minRange: '0', maxRange: '100', unit: '%' },
    // RAC
    { id: 'calc-rac', code: 'RAC', name: 'Relación Alb/Creat', category: 'Química Sanguínea', minRange: '0', maxRange: '30', unit: 'mg/g creat...' },
    // PSA
    { id: 'calc-psaratio', code: 'PSA_L_T', name: 'Relación PSA Libre/Total', category: 'Química Sanguínea', minRange: '25', maxRange: '100', unit: '%' },
    // Perfil Renal & Electrólitos
    { id: 'calc-nucrea', code: 'NU_CREA', name: 'Relación NU/CREA', category: 'Química Sanguínea', minRange: '10', maxRange: '20', unit: '' },
    { id: 'calc-nak', code: 'NA_K', name: 'Na/K', category: 'Química Sanguínea', minRange: '28', maxRange: '35', unit: '' }
];

const mergeCalculatedAnalyses = (baseAnalyses) => {
    const list = [...baseAnalyses];
    CALCULATED_CLINICAL_ANALYSES.forEach(calc => {
        if (!list.some(a => a.code === calc.code)) {
            list.push(calc);
        }
    });
    return list;
};

import { Sidebar } from './layouts/Sidebar';
import { TopBar } from './layouts/TopBar';
import { MobileNav } from './layouts/MobileNav';
import { DemoRunner } from './components/DemoRunner';
import { VersionUpdateNotifier } from './components/VersionUpdateNotifier';

// Lazy load views
const LoginView = lazy(() => import('./views/LoginView').then(m => ({ default: m.LoginView })));
const ClientPortal = lazy(() => import('./views/ClientPortal').then(m => ({ default: m.ClientPortal })));
const PublicVerificationView = lazy(() => import('./views/PublicVerificationView').then(m => ({ default: m.PublicVerificationView })));
const HomeDashboard = lazy(() => import('./views/HomeDashboard').then(m => ({ default: m.HomeDashboard })));
const Dashboard = lazy(() => import('./views/Dashboard').then(m => ({ default: m.Dashboard })));
const RequestForm = lazy(() => import('./views/RequestForm').then(m => ({ default: m.RequestForm })));
const RequestDetails = lazy(() => import('./views/RequestDetails').then(m => ({ default: m.RequestDetails })));
const AuditView = lazy(() => import('./views/AuditView').then(m => ({ default: m.AuditView })));
const InventoryView = lazy(() => import('./views/InventoryView').then(m => ({ default: m.InventoryView })));
const StorageMapView = lazy(() => import('./views/StorageMapView').then(m => ({ default: m.StorageMapView })));
const QCView = lazy(() => import('./views/QCView').then(m => ({ default: m.QCView })));
const ClientSettings = lazy(() => import('./views/ClientSettings').then(m => ({ default: m.ClientSettings })));
const AnalysisSettings = lazy(() => import('./views/AnalysisSettings').then(m => ({ default: m.AnalysisSettings })));
const LabSettings = lazy(() => import('./views/LabSettings').then(m => ({ default: m.LabSettings })));
const ReportView = lazy(() => import('./views/ReportView').then(m => ({ default: m.ReportView })));
const AccountingView = lazy(() => import('./views/AccountingView').then(m => ({ default: m.AccountingView })));
const QuotesView = lazy(() => import('./views/QuotesView').then(m => ({ default: m.QuotesView })));
const BillingView = lazy(() => import('./views/BillingView').then(m => ({ default: m.BillingView })));
const CRMView = lazy(() => import('./views/CRMView').then(m => ({ default: m.CRMView })));
const PreReportView = lazy(() => import('./views/PreReportView').then(m => ({ default: m.PreReportView })));
const FinalReportView = lazy(() => import('./views/FinalReportView').then(m => ({ default: m.FinalReportView })));
const ManualFormView = lazy(() => import('./views/ManualFormView').then(m => ({ default: m.ManualFormView })));
const BulkUploadView = lazy(() => import('./views/BulkUploadView').then(m => ({ default: m.BulkUploadView })));
const AnalyzerInboxView = lazy(() => import('./views/AnalyzerInboxView').then(m => ({ default: m.AnalyzerInboxView })));
const ResultsReviewView = lazy(() => import('./views/ResultsReviewView').then(m => ({ default: m.ResultsReviewView })));
const MicrobiologyWorkcards = lazy(() => import('./views/MicrobiologyWorkcards').then(m => ({ default: m.MicrobiologyWorkcards })));
const EnvironmentalMonitoring = lazy(() => import('./views/EnvironmentalMonitoring').then(m => ({ default: m.EnvironmentalMonitoring })));
const SystemDiagnosticsView = lazy(() => import('./views/SystemDiagnosticsView').then(m => ({ default: m.SystemDiagnosticsView })));
const HelpView = lazy(() => import('./views/HelpView').then(m => ({ default: m.HelpView })));
const ExternalReferralsView = lazy(() => import('./views/ExternalReferralsView').then(m => ({ default: m.ExternalReferralsView })));
const EquipmentView = lazy(() => import('./views/EquipmentView').then(m => ({ default: m.EquipmentView })));
const CAPAView = lazy(() => import('./views/CAPAView').then(m => ({ default: m.CAPAView })));
const FieldSamplingView = lazy(() => import('./views/FieldSamplingView').then(m => ({ default: m.FieldSamplingView })));
const BatchProcessingView = lazy(() => import('./views/BatchProcessingView').then(m => ({ default: m.BatchProcessingView })));

const RequestViewWrapper = ({ requests, analyses, db, user, labInfo, navigateTo, ViewComponent }) => {
    const _unusedComponent = ViewComponent;
    const { id } = useParams();
    const [fetchedRequest, setFetchedRequest] = useState(null);
    const [fetching, setFetching] = useState(false);

    const request = useMemo(() => {
        const found = requests.find(r => r.id === id);
        if (found) return found;
        if (id && id.startsWith('MC-2026-')) {
            const mockDateSeconds = 1779926400; // Mock date for MC-2026
            return {
                id,
                clientName: 'Cliente Mock (Simulación)',
                analysisRequested: 'Análisis Demostrativo',
                requestDate: { seconds: mockDateSeconds },
                status: 'En Proceso'
            };
        }
        return fetchedRequest;
    }, [requests, id, fetchedRequest]);

    useEffect(() => {
        const found = requests.find(r => r.id === id);
        if (found || (id && id.startsWith('MC-2026-')) || !db) return;

        Promise.resolve().then(() => setFetching(true));
        const docRef = doc(db, `artifacts/${appId}/public/data/requests`, id);
        getDoc(docRef).then((snap) => {
            if (snap.exists()) {
                setFetchedRequest({ id: snap.id, ...snap.data() });
            }
            setFetching(false);
        }).catch((err) => {
            console.error("Error fetching request by ID:", err);
            setFetching(false);
        });
    }, [requests, id, db]);

    if (fetching) {
        return <LoadingSpinner />;
    }

    if (!request) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto mt-12 animate-fade-in">
                <FlaskConical className="text-indigo-500 w-16 h-16 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-800">Solicitud No Encontrada</h3>
                <p className="text-slate-500 text-sm mt-1">No pudimos encontrar la solicitud con ID "{id}". Es posible que no exista, haya sido eliminada, o no tengas permisos para verla.</p>
                <button onClick={() => navigateTo('dashboard')} className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm shadow-sm">
                    Ir al Listado de Solicitudes
                </button>
            </div>
        );
    }

    return <ViewComponent request={request} navigateTo={navigateTo} availableAnalyses={analyses} db={db} user={user} labInfo={labInfo} />;
};

const ClientRoute = ({ user, userRole, children }) => {
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (userRole && !userRole.startsWith('client_')) {
        return <Navigate to="/home" replace />;
    }
    return children;
};

const LayoutWrapper = ({ children, user, userRole, labInfo, navigateTo }) => {
    const location = useLocation();
    const view = location.pathname.substring(1) || 'home';
    
    // Route Guard
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect client role users to the client portal if they try to access internal views
    if (userRole && userRole.startsWith('client_')) {
        return <Navigate to="/client_portal" replace />;
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
            <Sidebar user={user} userRole={userRole} navigateTo={navigateTo} view={view} labInfo={labInfo} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar user={user} userRole={userRole} navigateTo={navigateTo} labInfo={labInfo} />
                <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
                    <div className="w-full max-w-7xl mx-auto">
                        <Suspense fallback={<LoadingSpinner />}>
                            {children}
                        </Suspense>
                    </div>
                </main>
                <MobileNav navigateTo={navigateTo} view={view} userRole={userRole} />
            </div>
        </div>
    );
};

const AppContent = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const saved = sessionStorage.getItem('offlineUser');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // Ignore parsing errors
            }
        }
        return null;
    });
    const [userRole, setUserRole] = useState(() => {
        return sessionStorage.getItem('userRole') || null;
    });
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        if (userRole) {
            sessionStorage.setItem('userRole', userRole);
        } else {
            sessionStorage.removeItem('userRole');
        }
    }, [userRole]);

    useEffect(() => {
        if (user && user.uid === 'offline-user') {
            sessionStorage.setItem('offlineUser', JSON.stringify(user));
        } else if (user === null) {
            sessionStorage.removeItem('offlineUser');
        }
    }, [user]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const bypassRole = params.get('bypass');
        if (bypassRole) {
            let role = 'admin';
            let email = 'admin-offline@microlabs.com';
            
            if (bypassRole === 'dt' || bypassRole === 'director') {
                role = 'director_tecnico';
                email = 'director-offline@microlabs.com';
            } else if (bypassRole === 'analyst' || bypassRole === 'analista') {
                role = 'analyst';
                email = 'analista-offline@microlabs.com';
            } else if (bypassRole === 'billing' || bypassRole === 'facturacion') {
                role = 'billing_agent';
                email = 'facturacion-offline@microlabs.com';
            } else if (bypassRole === 'patient') {
                role = 'client_patient';
                email = 'paciente-offline@microlabs.com';
            } else if (bypassRole === 'company') {
                role = 'client_company';
                email = 'empresa-offline@microlabs.com';
            } else if (bypassRole === 'doctor') {
                role = 'client_doctor';
                email = 'medico-offline@microlabs.com';
            }
            
            const offlineUser = { uid: 'offline-user', email: email };
            Promise.resolve().then(() => {
                setUser(offlineUser);
                setUserRole(role);
            });
            sessionStorage.setItem('userRole', role);
            sessionStorage.setItem('offlineUser', JSON.stringify(offlineUser));
            
            // Clean URL query parameters and redirect
            window.history.replaceState({}, document.title, window.location.pathname);
            
            if (role.startsWith('client_')) {
                navigate('/client_portal');
            } else {
                navigate('/home');
            }
        }
    }, [navigate]);

    const [requests, setRequests] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [clients, setClients] = useState([]);
    const [referenceLabs, setReferenceLabs] = useState([]);
    const [referenceLabTests, setReferenceLabTests] = useState([]);
    const [labInfo, setLabInfo] = useState({
        name: 'Laboratorio Microlabs Químicos S.A.',
        logoUrl: '/logo.png',
        website: 'www.microlabscr.com',
        telephones: '+506 22348837, +506 22345862, +506 22246541',
        whatsapp: '71382750',
        email: 'laboratorio@microlabscr.com',
        emailReports: 'reportes@microlabscr.com',
        emailBilling: 'fe@microlabscr.com',
        address: '75 metros norte del correo de Guadalupe, Goicoechea, San José, Costa Rica',
        directorName: 'Dr. Roldan Ajún Chaverri',
        directorCode: '802',
        professional2Name: 'Dr. José Guillermo Ajún Jiménez',
        professional2Code: 'Reg. Trámite',
        branches: [
            {
                id: 'suc-guadalupe',
                code: 'GUA-01',
                name: 'Sede Central Guadalupe',
                type: 'Sede Matriz & Laboratorio Central',
                isMain: true,
                address: '75 metros norte del correo de Guadalupe, Goicoechea, San José, Costa Rica',
                telephones: '+506 22348837, +506 22345862, +506 22246541',
                whatsapp: '71382750',
                email: 'laboratorio@microlabscr.com',
                emailReports: 'reportes@microlabscr.com',
                emailBilling: 'fe@microlabscr.com',
                website: 'www.microlabscr.com',
                directorName: 'Dr. Roldan Ajún Chaverri',
                directorCode: '802',
                permitNumber: 'MINSA-01048',
                active: true
            }
        ]
    });
    const [loading, setLoading] = useState(true);

    const { addNotification } = useNotification();
    const prevPendingCountRef = useRef(0);

    useEffect(() => {
        const pendingCount = requests.filter(r => r.status === 'Pendiente Revisión').length;
        if (pendingCount > prevPendingCountRef.current && isAuthReady && !loading) {
            addNotification(`Nuevos resultados de equipo automatizado listos. Tienes ${pendingCount} pendiente(s) de revisión.`, 'warning');
        }
        prevPendingCountRef.current = pendingCount;
    }, [requests, isAuthReady, loading, addNotification]);

    const navigateTo = async (viewName, id = null, state = null) => {
        if (viewName === 'login') {
            try {
                if (user) {
                    const API_URL = getApiUrl();
                    const logData = {
                        action: 'SESSION_END',
                        userId: user.uid,
                        email: user.email,
                        role: userRole,
                        company: userRole === 'client_company' 
                            ? (user?.email === 'empresa-offline@microlabs.com' ? 'Distribuidora Alimenticia S.A.' : (user?.email ? user.email.split('@')[0] : 'Empresa')) 
                            : null
                    };

                    try {
                        await fetch(`${API_URL}/api/logs/access`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(logData)
                        });
                    } catch (err) {
                        console.warn("No se pudo registrar logout en Express backend:", err.message);
                    }

                    if (user.uid === 'offline-user') {
                        const localAccessLogs = localStorage.getItem('lims_local_access_logs')
                            ? JSON.parse(localStorage.getItem('lims_local_access_logs'))
                            : [];
                        localAccessLogs.push({
                            id: 'ACC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
                            timestamp: new Date().toISOString(),
                            ip: '127.0.0.1 (Local)',
                            accessType: 'LOCAL',
                            userId: logData.userId,
                            email: logData.email,
                            role: logData.role,
                            company: logData.company,
                            action: logData.action,
                            details: navigator.userAgent
                        });
                        localStorage.setItem('lims_local_access_logs', JSON.stringify(localAccessLogs));
                        window.dispatchEvent(new Event('lims_local_data_updated'));
                    }
                }
                await auth.signOut();
                setUser(null);
                setUserRole(null);
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('offlineUser');
            } catch (err) {
                console.error("Error signing out:", err);
            }
            navigate('/login');
            return;
        }
        if (id) {
            navigate(`/${viewName}/${id}`, { state });
        } else {
            navigate(`/${viewName}`, { state });
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof window !== 'undefined' && window.__initial_auth_token) {
                    await signInWithCustomToken(auth, window.__initial_auth_token);
                }
            } catch (error) {
                console.error("Auth Error", error);
            }
        };
        initAuth();
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                setLoading(true);
                if (u.uid !== 'offline-user') {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', u.uid));
                        if (userDoc.exists()) {
                            setUserRole(userDoc.data().role);
                        } else {
                            console.warn("Usuario sin rol asignado en la base de datos.");
                            setUserRole(null);
                        }
                    } catch (e) {
                        console.error("Error al cargar el rol del usuario:", e);
                    }
                }
            } else {
                const saved = sessionStorage.getItem('offlineUser');
                if (!saved) {
                    setUser(null);
                    setUserRole(null);
                    sessionStorage.removeItem('userRole');
                }
                setLoading(false);
            }
            setIsAuthReady(true);
        });
        return () => unsub();
    }, []);

    // Interceptor global de fetch para inyectar cabeceras de usuario en peticiones a la API
    useEffect(() => {
        if (!user) return;
        const originalFetch = window.fetch;
        window.fetch = async function(resource, config = {}) {
            const urlStr = typeof resource === 'string' ? resource : (resource && resource.url);
            
            // Solo inyectar cabeceras para peticiones locales de nuestra API
            if (urlStr && urlStr.includes('/api/') && !urlStr.includes('/api/logs/access')) {
                // Ensure headers object exists
                const headers = { ...(config.headers || {}) };
                headers['x-user-id'] = user.uid;
                headers['x-user-email'] = user.email || '';
                headers['x-user-role'] = userRole || '';
                headers['x-user-company'] = userRole === 'client_company' 
                    ? (user?.email === 'empresa-offline@microlabs.com' ? 'Distribuidora Alimenticia S.A.' : (user?.email ? user.email.split('@')[0] : 'Empresa')) 
                    : '';
                config.headers = headers;
            }
            return originalFetch(resource, config);
        };
        return () => {
            window.fetch = originalFetch;
        };
    }, [user, userRole]);

    // Registrar inicio de sesión
    useEffect(() => {
        if (!isAuthReady || !user || !userRole) return;

        const logSessionStart = async () => {
            const API_URL = getApiUrl();
            const logData = {
                action: 'SESSION_START',
                userId: user.uid,
                email: user.email,
                role: userRole,
                company: userRole === 'client_company' 
                    ? (user?.email === 'empresa-offline@microlabs.com' ? 'Distribuidora Alimenticia S.A.' : (user?.email ? user.email.split('@')[0] : 'Empresa')) 
                    : null
            };

            try {
                await fetch(`${API_URL}/api/logs/access`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logData)
                });
            } catch (err) {
                console.warn("No se pudo registrar sesión en Express backend:", err.message);
            }

            if (user.uid === 'offline-user') {
                const localAccessLogs = localStorage.getItem('lims_local_access_logs')
                    ? JSON.parse(localStorage.getItem('lims_local_access_logs'))
                    : [];
                
                const lastLog = localAccessLogs[localAccessLogs.length - 1];
                if (!lastLog || lastLog.action !== 'SESSION_START' || (Date.now() - new Date(lastLog.timestamp).getTime() > 10000)) {
                    localAccessLogs.push({
                        id: 'ACC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
                        timestamp: new Date().toISOString(),
                        ip: '127.0.0.1 (Local)',
                        accessType: 'LOCAL',
                        userId: logData.userId,
                        email: logData.email,
                        role: logData.role,
                        company: logData.company,
                        action: logData.action,
                        details: navigator.userAgent
                    });
                    localStorage.setItem('lims_local_access_logs', JSON.stringify(localAccessLogs));
                    window.dispatchEvent(new Event('lims_local_data_updated'));
                }
            }
        };

        logSessionStart();
    }, [user, userRole, isAuthReady]);

    useEffect(() => {
        if (!isAuthReady || !user) return;

        if (user.uid === 'offline-user') {
            // --- MODO OFFLINE (LOCALSTORAGE & MOCK DATA) ---
            const loadLocalData = () => {
                let localRequests = localStorage.getItem('lims_local_requests');
                if (!localRequests) {
                    localRequests = JSON.stringify(mockData.requests);
                    localStorage.setItem('lims_local_requests', localRequests);
                }
                setRequests(JSON.parse(localRequests));

                let localClients = localStorage.getItem('lims_local_clients');
                if (!localClients) {
                    localClients = JSON.stringify(mockData.clients);
                    localStorage.setItem('lims_local_clients', localClients);
                }
                setClients(JSON.parse(localClients));

                let localAnalyses = localStorage.getItem('lims_local_analyses');
                if (!localAnalyses) {
                    localAnalyses = JSON.stringify(mockData.analyses);
                    localStorage.setItem('lims_local_analyses', localAnalyses);
                }
                setAnalyses(mergeCalculatedAnalyses(JSON.parse(localAnalyses)));

                let localRefLabs = localStorage.getItem('lims_local_reference_labs');
                if (!localRefLabs) {
                    localRefLabs = JSON.stringify([
                        { id: 'ref-1', name: 'Laboratorio de Referencia Nacional', email: 'contacto@refnacional.com', phone: '2211-0099', status: 'Activo' },
                        { id: 'ref-2', name: 'Lab. Microbiología Avanzada', email: 'info@microavanzada.com', phone: '2288-7766', status: 'Activo' }
                    ]);
                    localStorage.setItem('lims_local_reference_labs', localRefLabs);
                }
                setReferenceLabs(JSON.parse(localRefLabs));

                let localRefLabTests = localStorage.getItem('lims_local_reference_lab_tests');
                if (!localRefLabTests) {
                    localRefLabTests = JSON.stringify([
                        { id: 'reftest-1', labId: 'ref-1', testCode: '1020', testName: 'Acido Fólico', costPrice: 12000, patientPrice: 22000 },
                        { id: 'reftest-2', labId: 'ref-1', testCode: '1030', testName: 'Acido úrico', costPrice: 5000, patientPrice: 8000 },
                        { id: 'reftest-3', labId: 'ref-2', testCode: '2040', testName: 'ACTH', costPrice: 20000, patientPrice: 34000 }
                    ]);
                    localStorage.setItem('lims_local_reference_lab_tests', localRefLabTests);
                }
                setReferenceLabTests(JSON.parse(localRefLabTests));

                let localLabInfo = localStorage.getItem('lims_local_labInfo');
                if (!localLabInfo) {
                    localLabInfo = JSON.stringify(mockData.labInfo);
                    localStorage.setItem('lims_local_labInfo', localLabInfo);
                }
                setLabInfo(JSON.parse(localLabInfo));
                setLoading(false);
            };

            loadLocalData();

            window.addEventListener('lims_local_data_updated', loadLocalData);
            return () => {
                window.removeEventListener('lims_local_data_updated', loadLocalData);
            };
        } else {
            // --- MODO ONLINE (FIREBASE FIRESTORE) ---
            try {
                const reqQuery = query(collection(db, `artifacts/${appId}/public/data/requests`), orderBy('createdAt', 'desc'), limit(150));
                const unsubRequests = onSnapshot(reqQuery, (s) => {
                    const d = s.docs.map(x => ({ id: x.id, ...x.data() }));
                    d.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                    setRequests(d);
                    setLoading(false);
                                }, (error) => {
                    console.error("Firestore Error (Requests):", error);
                    setLoading(false);
                });
                const unsubClients = onSnapshot(collection(db, `artifacts/${appId}/public/data/clients`), (s) => setClients(s.docs.map(x => ({ id: x.id, ...x.data() }))), (e) => console.error(e));
                const unsubAnalyses = onSnapshot(collection(db, `artifacts/${appId}/public/data/analyses`), (s) => setAnalyses(mergeCalculatedAnalyses(s.docs.map(x => ({ id: x.id, ...x.data() })))), (e) => console.error(e));
                const unsubRefLabs = onSnapshot(collection(db, `artifacts/${appId}/public/data/reference_labs`), (s) => setReferenceLabs(s.docs.map(x => ({ id: x.id, ...x.data() }))), (e) => console.error(e));
                const unsubRefLabTests = onSnapshot(collection(db, `artifacts/${appId}/public/data/reference_lab_tests`), (s) => setReferenceLabTests(s.docs.map(x => ({ id: x.id, ...x.data() }))), (e) => console.error(e));
                const unsubLab = onSnapshot(doc(db, `artifacts/${appId}/public/data/lab_settings`, "main"), (d) => { if (d.exists()) setLabInfo(d.data()); }, (e) => console.error(e));

                const timer = setTimeout(() => {
                    setLoading(false);
                }, 1000);

                return () => { 
                    clearTimeout(timer);
                    unsubRequests(); 
                    unsubClients(); 
                    unsubAnalyses(); 
                    unsubRefLabs();
                    unsubRefLabTests();
                    unsubLab(); 
                };
            } catch (e) {
                console.error("Firestore Init Error:", e);
                Promise.resolve().then(() => setLoading(false));
            }
        }
    }, [isAuthReady, user]);

    if (!isAuthReady || loading) return <LoadingSpinner />;

    return (
        <ErrorBoundary>
            <Routes>
                {/* Auth & External Routes */}
                <Route path="/verify/:id" element={
                    <Suspense fallback={<LoadingSpinner />}>
                        <PublicVerificationView />
                    </Suspense>
                } />
                <Route path="/verify" element={
                    <Suspense fallback={<LoadingSpinner />}>
                        <PublicVerificationView />
                    </Suspense>
                } />
                <Route path="/login" element={
                    <Suspense fallback={<LoadingSpinner />}>
                        <LoginView navigateTo={navigateTo} setUserRole={setUserRole} setUser={setUser} />
                    </Suspense>
                } />
                <Route path="/client_portal" element={
                    <Suspense fallback={<LoadingSpinner />}>
                        <ClientRoute user={user} userRole={userRole}>
                            <ClientPortal navigateTo={navigateTo} userRole={userRole} requests={requests} />
                        </ClientRoute>
                    </Suspense>
                } />

                {/* Internal App Routes with Layout */}
                <Route path="/" element={<Navigate to="/home" replace />} />
                
                <Route path="/home" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><HomeDashboard navigateTo={navigateTo} requests={requests} /></LayoutWrapper>} />
                <Route path="/dashboard" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><Dashboard requests={requests} navigateTo={navigateTo} clients={clients} /></LayoutWrapper>} />
                
                <Route path="/new_request" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestForm db={db} user={user} navigateTo={navigateTo} availableAnalyses={analyses} clients={clients} requests={requests} labInfo={labInfo} /></LayoutWrapper>} />
                <Route path="/request_details/:id" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestViewWrapper requests={requests} analyses={analyses} db={db} user={user} labInfo={labInfo} navigateTo={navigateTo} ViewComponent={RequestDetails} /></LayoutWrapper>} />
                
                <Route path="/report/:id" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestViewWrapper requests={requests} analyses={analyses} db={db} user={user} labInfo={labInfo} navigateTo={navigateTo} ViewComponent={ReportView} /></LayoutWrapper>} />
                <Route path="/pre_report/:id" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestViewWrapper requests={requests} analyses={analyses} db={db} user={user} labInfo={labInfo} navigateTo={navigateTo} ViewComponent={PreReportView} /></LayoutWrapper>} />
                <Route path="/final_report/:id" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestViewWrapper requests={requests} analyses={analyses} db={db} user={user} labInfo={labInfo} navigateTo={navigateTo} ViewComponent={FinalReportView} /></LayoutWrapper>} />
                
                <Route path="/audit" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><AuditView db={db} userRole={userRole} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/inventory" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><InventoryView db={db} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/equipment" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><EquipmentView db={db} user={user} /></LayoutWrapper>} />
                <Route path="/capa" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><CAPAView db={db} user={user} /></LayoutWrapper>} />
                <Route path="/storage" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><StorageMapView db={db} user={user} requests={requests} /></LayoutWrapper>} />
                <Route path="/environmental" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><EnvironmentalMonitoring /></LayoutWrapper>} />
                <Route path="/qc" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><QCView db={db} user={user} /></LayoutWrapper>} />
                <Route path="/client_settings" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><ClientSettings db={db} clients={clients} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/analysis_settings" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><AnalysisSettings db={db} analyses={analyses} userRole={userRole} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/lab_settings" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><LabSettings db={db} labInfo={labInfo} userRole={userRole} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                
                <Route path="/accounting" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><AccountingView navigateTo={navigateTo} userRole={userRole} /></LayoutWrapper>} />
                <Route path="/billing" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><BillingView requests={requests} db={db} referenceLabs={referenceLabs} referenceLabTests={referenceLabTests} user={user} /></LayoutWrapper>} />
                <Route path="/crm" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><CRMView db={db} clients={clients} user={user} requests={requests} /></LayoutWrapper>} />
                <Route path="/quotes" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><QuotesView navigateTo={navigateTo} referenceLabs={referenceLabs} referenceLabTests={referenceLabTests} labInfo={labInfo} /></LayoutWrapper>} />
                <Route path="/analyzer_inbox" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><AnalyzerInboxView db={db} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/results_review" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><ResultsReviewView db={db} user={user} requests={requests} analyses={analyses} labInfo={labInfo} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/microbiology" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><MicrobiologyWorkcards db={db} user={user} requests={requests} labInfo={labInfo} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/referrals" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><ExternalReferralsView db={db} requests={requests} user={user} navigateTo={navigateTo} referenceLabs={referenceLabs} referenceLabTests={referenceLabTests} /></LayoutWrapper>} />
                <Route path="/diagnostics" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><SystemDiagnosticsView db={db} user={user} requests={requests} clients={clients} userRole={userRole} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/help" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><HelpView /></LayoutWrapper>} />
                
                <Route path="/bulk_upload" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><BulkUploadView db={db} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/manual_form" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><ManualFormView navigateTo={navigateTo} labInfo={labInfo} /></LayoutWrapper>} />
                <Route path="/field-sampling" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><FieldSamplingView user={user} /></LayoutWrapper>} />
                <Route path="/batch" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><BatchProcessingView db={db} user={user} requests={requests} /></LayoutWrapper>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            <DemoRunner />
            <VersionUpdateNotifier />
        </ErrorBoundary>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}