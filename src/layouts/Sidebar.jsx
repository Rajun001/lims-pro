import React from 'react';
import { 
    ClipboardList, FileText, Package, Activity, History, Wallet, Receipt, 
    Calculator, UserCheck, Lock, Cpu, Snowflake, PlusCircle, HelpCircle, 
    Microscope, Factory, Truck, Wrench, ShieldAlert, Navigation, Layers,
    UserPlus, Building2, CheckCircle2, Send, FileSpreadsheet, Settings,
    FileCheck2, SlidersHorizontal, Home
} from 'lucide-react';
import { Logo } from '../components/UI';
import versionData from '../version.json';

const NavItem = ({ view, currentView, navigateTo, icon: Icon, label, badge, onClickOverride }) => (
    Icon && (
        <button 
            onClick={onClickOverride || (() => navigateTo(view))} 
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-left ${
                currentView === view 
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 translate-x-0.5' 
                    : 'hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium'
            }`}
        >
            <div className="flex items-center gap-2.5 truncate">
                <Icon size={17} className={currentView === view ? 'text-white' : 'text-slate-400'} /> 
                <span className="text-xs truncate">{label}</span>
            </div>
            {badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                    {badge}
                </span>
            )}
        </button>
    )
);

const NavGroup = ({ step, title, color = "text-indigo-400", children }) => (
    <div className="mb-5">
        <div className="px-3 flex items-center gap-1.5 mb-1.5">
            {step && (
                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 ${color}`}>
                    {step}
                </span>
            )}
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</h3>
        </div>
        <div className="space-y-0.5">
            {children}
        </div>
    </div>
);

export const Sidebar = ({ navigateTo, view, labInfo, userRole }) => (
    <div className="w-64 bg-slate-900 text-white flex-col h-full shadow-2xl z-20 print:hidden hidden md:flex shrink-0 border-r border-slate-800">
        <div className="p-5 flex items-center justify-between border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => navigateTo('home')}>
            <Logo url={labInfo?.logoUrl} variant="horizontal" className="h-8" />
        </div>
        <nav className="flex-1 p-3.5 overflow-y-auto custom-scrollbar">
            
            {/* Panel Principal */}
            <div className="mb-4">
                <NavItem view="home" currentView={view} navigateTo={navigateTo} icon={Home} label="Panel General (Inicio)" />
            </div>

            {/* PASO 1: CLIENTES Y EMPRESAS */}
            {['admin', 'director_tecnico', 'analyst', 'billing_agent'].includes(userRole) && (
                <NavGroup step="Paso 1" title="Clientes & Empresas" color="text-sky-400">
                    <NavItem view="crm" currentView={view} navigateTo={navigateTo} icon={UserCheck} label="Directorio General (CRM)" />
                    <NavItem 
                        view="new_request_clinical" 
                        currentView={view} 
                        navigateTo={navigateTo} 
                        onClickOverride={() => navigateTo('new_request', null, { mode: 'clinical' })} 
                        icon={UserPlus} 
                        label="Nuevo Paciente (Clínico)" 
                    />
                    <NavItem 
                        view="new_request_industrial" 
                        currentView={view} 
                        navigateTo={navigateTo} 
                        onClickOverride={() => navigateTo('new_request', null, { mode: 'industrial' })} 
                        icon={Building2} 
                        label="Nueva Empresa (Industrial)" 
                    />
                    <NavItem view="quotes" currentView={view} navigateTo={navigateTo} icon={Calculator} label="Cotizaciones & Tarifas" />
                </NavGroup>
            )}

            {/* PASO 2: RECEPCIÓN E INGRESO DE SOLICITUDES */}
            {['admin', 'director_tecnico', 'analyst'].includes(userRole) && (
                <NavGroup step="Paso 2" title="Recepción & Solicitud" color="text-amber-400">
                    <NavItem view="new_request" currentView={view} navigateTo={navigateTo} icon={PlusCircle} label="Ingreso de Solicitud (Form)" badge="Nuevo" />
                    <NavItem view="dashboard" currentView={view} navigateTo={navigateTo} icon={FileText} label="Listado de Órdenes" />
                    <NavItem view="field-sampling" currentView={view} navigateTo={navigateTo} icon={Navigation} label="Muestreo en Campo (App)" />
                    <NavItem view="bulk_upload" currentView={view} navigateTo={navigateTo} icon={FileSpreadsheet} label="Carga Masiva de Muestras" />
                    <NavItem view="manual_form" currentView={view} navigateTo={navigateTo} icon={FileCheck2} label="Formularios Físicos" />
                </NavGroup>
            )}

            {/* PASO 3: LABORATORIO & INGRESO DE RESULTADOS */}
            {['admin', 'director_tecnico', 'analyst'].includes(userRole) && (
                <NavGroup step="Paso 3" title="Laboratorio & Resultados" color="text-emerald-400">
                    <NavItem view="microbiology" currentView={view} navigateTo={navigateTo} icon={Microscope} label="Microbiología & Hojas" />
                    <NavItem view="results_review" currentView={view} navigateTo={navigateTo} icon={Activity} label="Ingreso de Datos & Ensayos" />
                    <NavItem view="batch" currentView={view} navigateTo={navigateTo} icon={Layers} label="Lotes, Alícuotas & Incubación" />
                    <NavItem view="analyzer_inbox" currentView={view} navigateTo={navigateTo} icon={Cpu} label="Analizadores Automatizados" />
                    <NavItem view="environmental" currentView={view} navigateTo={navigateTo} icon={Factory} label="Monitoreo de Planta" />
                    <NavItem view="referrals" currentView={view} navigateTo={navigateTo} icon={Truck} label="Laboratorios de Referencia (B2B)" />
                </NavGroup>
            )}

            {/* PASO 4: CONTROL DE CALIDAD Y VALIDACIÓN */}
            {['admin', 'director_tecnico'].includes(userRole) && (
                <NavGroup step="Paso 4" title="Validación & Calidad" color="text-purple-400">
                    <NavItem view="qc" currentView={view} navigateTo={navigateTo} icon={CheckCircle2} label="Control de Calidad (QC)" />
                    <NavItem view="storage" currentView={view} navigateTo={navigateTo} icon={Snowflake} label="Mapeo & Freezer" />
                    <NavItem view="capa" currentView={view} navigateTo={navigateTo} icon={ShieldAlert} label="Aseguramiento ISO (CAPA)" />
                </NavGroup>
            )}

            {/* PASO 5: EMISIÓN, ENVIOS E INFORMES */}
            {['admin', 'director_tecnico', 'billing_agent'].includes(userRole) && (
                <NavGroup step="Paso 5" title="Emisión & Envíos" color="text-rose-400">
                    <NavItem view="billing" currentView={view} navigateTo={navigateTo} icon={Send} label="Envíos & Facturación" />
                    {userRole === 'admin' && (
                        <NavItem view="accounting" currentView={view} navigateTo={navigateTo} icon={Wallet} label="Contabilidad & Cobros" />
                    )}
                </NavGroup>
            )}

            {/* CONFIGURACIÓN & ADMINISTRACIÓN */}
            {['admin', 'director_tecnico'].includes(userRole) && (
                <NavGroup title="Configuración y Sistema">
                    <NavItem view="inventory" currentView={view} navigateTo={navigateTo} icon={Package} label="Inventario & Reactivos" />
                    <NavItem view="equipment" currentView={view} navigateTo={navigateTo} icon={Wrench} label="Gestión de Equipos" />
                    <NavItem view="analysis_settings" currentView={view} navigateTo={navigateTo} icon={SlidersHorizontal} label="Catálogo de Ensayos" />
                    <NavItem view="lab_settings" currentView={view} navigateTo={navigateTo} icon={Building2} label="Sedes & Sucursales" />
                    {userRole === 'admin' && (
                        <>
                            <NavItem view="audit" currentView={view} navigateTo={navigateTo} icon={History} label="Auditoría (Admin)" />
                            <NavItem view="diagnostics" currentView={view} navigateTo={navigateTo} icon={Activity} label="Diagnósticos & Backup" />
                        </>
                    )}
                </NavGroup>
            )}
            
        </nav>
        <div className="p-3.5 border-t border-slate-800 space-y-1 bg-slate-900/90 backdrop-blur shrink-0">
            <button onClick={() => navigateTo('help')} className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-colors ${view === 'help' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <HelpCircle size={16} /> <span className="font-medium text-xs">Ayuda & Guías</span>
            </button>
            <button onClick={() => navigateTo('login')} className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer">
                <Lock size={16} /> <span className="font-medium text-xs">Cerrar Sesión</span>
            </button>
            <div className="pt-2 px-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="truncate" title={`Compilado el: ${versionData?.builtAt || 'N/A'}`}>
                    {versionData?.fullVersion || 'v2.5.0'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700/60 font-bold shrink-0">
                    #{versionData?.gitCommit || 'dev'}
                </span>
            </div>
        </div>
    </div>
);

