import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { onSnapshot, collection, doc, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { auth, db, LIMSSystemId as appId } from './services/firebase';
import { useNotification } from './contexts/NotificationContext';
import { FlaskConical } from 'lucide-react';

import { ErrorBoundary, LoadingSpinner } from './components/UI';
import { Sidebar } from './layouts/Sidebar';
import { TopBar } from './layouts/TopBar';
import { MobileNav } from './layouts/MobileNav';
import { DemoRunner } from './components/DemoRunner';

// Lazy load views
const LoginView = lazy(() => import('./views/LoginView').then(m => ({ default: m.LoginView })));
const ClientPortal = lazy(() => import('./views/ClientPortal').then(m => ({ default: m.ClientPortal })));
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
    const [user, setUser] = useState(null);
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

    const [requests, setRequests] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [clients, setClients] = useState([]);
    const [labInfo, setLabInfo] = useState({ name: 'Laboratorio Microlabs', logoUrl: 'https://www.microlabscr.com/s/misc/logo.jpg' });
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
                await auth.signOut();
                setUser(null);
                setUserRole(null);
                sessionStorage.removeItem('userRole');
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
                // Eliminamos signInAnonymously() para que no expida tokens automáticamente sin Login.
            } catch (error) {
                console.error("Auth Error", error);
            }
        };
        initAuth();
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                setLoading(true);
            } else {
                setUser(null);
                setUserRole(null);
                sessionStorage.removeItem('userRole');
                setLoading(false);
            }
            setIsAuthReady(true);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!isAuthReady || !user) return;

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
            const unsubAnalyses = onSnapshot(collection(db, `artifacts/${appId}/public/data/analyses`), (s) => setAnalyses(s.docs.map(x => ({ id: x.id, ...x.data() }))), (e) => console.error(e));
            const unsubLab = onSnapshot(doc(db, `artifacts/${appId}/public/data/lab_settings`, "main"), (d) => { if (d.exists()) setLabInfo(d.data()); }, (e) => console.error(e));

            const timer = setTimeout(() => {
                setLoading(false);
            }, 1000);

            return () => { 
                clearTimeout(timer);
                unsubRequests(); 
                unsubClients(); 
                unsubAnalyses(); 
                unsubLab(); 
            };
        } catch (e) {
            console.error("Firestore Init Error:", e);
            Promise.resolve().then(() => setLoading(false));
        }
    }, [isAuthReady, user]);

    if (!isAuthReady || loading) return <LoadingSpinner />;

    return (
        <ErrorBoundary>
            <Routes>
                {/* Auth & External Routes */}
                <Route path="/login" element={
                    <Suspense fallback={<LoadingSpinner />}>
                        <LoginView navigateTo={navigateTo} setUserRole={setUserRole} setUser={setUser} />
                    </Suspense>
                } />
                <Route path="/client_portal" element={
                    <Suspense fallback={<LoadingSpinner />}>
                        <ClientRoute user={user} userRole={userRole}>
                            <ClientPortal navigateTo={navigateTo} userRole={userRole} />
                        </ClientRoute>
                    </Suspense>
                } />

                {/* Internal App Routes with Layout */}
                <Route path="/" element={<Navigate to="/home" replace />} />
                
                <Route path="/home" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><HomeDashboard navigateTo={navigateTo} requests={requests} /></LayoutWrapper>} />
                <Route path="/dashboard" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><Dashboard requests={requests} navigateTo={navigateTo} clients={clients} /></LayoutWrapper>} />
                
                <Route path="/new_request" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestForm db={db} user={user} navigateTo={navigateTo} availableAnalyses={analyses} clients={clients} /></LayoutWrapper>} />
                <Route path="/request_details/:id" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestViewWrapper requests={requests} analyses={analyses} db={db} user={user} labInfo={labInfo} navigateTo={navigateTo} ViewComponent={RequestDetails} /></LayoutWrapper>} />
                
                <Route path="/report/:id" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestViewWrapper requests={requests} analyses={analyses} db={db} user={user} labInfo={labInfo} navigateTo={navigateTo} ViewComponent={ReportView} /></LayoutWrapper>} />
                <Route path="/pre_report/:id" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestViewWrapper requests={requests} analyses={analyses} db={db} user={user} labInfo={labInfo} navigateTo={navigateTo} ViewComponent={PreReportView} /></LayoutWrapper>} />
                <Route path="/final_report/:id" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><RequestViewWrapper requests={requests} analyses={analyses} db={db} user={user} labInfo={labInfo} navigateTo={navigateTo} ViewComponent={FinalReportView} /></LayoutWrapper>} />
                
                <Route path="/audit" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><AuditView db={db} userRole={userRole} navigateTo={navigateTo} /></LayoutWrapper>} />
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
                <Route path="/billing" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><BillingView /></LayoutWrapper>} />
                <Route path="/crm" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><CRMView db={db} clients={clients} user={user} requests={requests} /></LayoutWrapper>} />
                <Route path="/quotes" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><QuotesView navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/analyzer_inbox" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><AnalyzerInboxView db={db} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/results_review" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><ResultsReviewView db={db} requests={requests} analyses={analyses} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/microbiology" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><MicrobiologyWorkcards db={db} requests={requests} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/referrals" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><ExternalReferralsView db={db} requests={requests} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/diagnostics" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><SystemDiagnosticsView db={db} requests={requests} clients={clients} userRole={userRole} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/help" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><HelpView /></LayoutWrapper>} />
                
                <Route path="/bulk_upload" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><BulkUploadView db={db} user={user} navigateTo={navigateTo} /></LayoutWrapper>} />
                <Route path="/manual_form" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><ManualFormView navigateTo={navigateTo} labInfo={labInfo} /></LayoutWrapper>} />
                <Route path="/field-sampling" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><FieldSamplingView user={user} /></LayoutWrapper>} />
                <Route path="/batch" element={<LayoutWrapper user={user} userRole={userRole} labInfo={labInfo} navigateTo={navigateTo}><BatchProcessingView db={db} requests={requests} /></LayoutWrapper>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            <DemoRunner />
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