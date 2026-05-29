import React from 'react';
import { ClipboardList, FileText, Package, Activity, History, Wallet, Receipt, Calculator, UserCheck, Lock, Cpu, Snowflake, PlusCircle, HelpCircle, Microscope, Factory, Truck, Wrench, ShieldAlert, Navigation, Layers } from 'lucide-react';
import { Logo } from '../components/UI';

const NavItem = ({ view, currentView, navigateTo, icon: Icon, label, onClickOverride }) => (
     
    Icon && (
    <button onClick={onClickOverride || (() => navigateTo(view))} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${currentView === view ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}>
        <Icon size={18} /> <span className="font-medium text-sm">{label}</span>
    </button>
    )
);

const NavGroup = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{title}</h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

export const Sidebar = ({ navigateTo, view, labInfo, userRole }) => (
    <div className="w-64 bg-slate-900 text-white flex-col h-full shadow-xl z-20 print:hidden hidden md:flex shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => navigateTo('home')}>
            <Logo url={labInfo?.logoUrl} className="h-8 w-8" />
            <h1 className="font-bold text-lg tracking-wide">{labInfo?.name || 'LIMS Microlabs'}</h1>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            
            {['admin', 'director_tecnico', 'analyst'].includes(userRole) && (
                <NavGroup title="Operaciones Generales">
                    <NavItem view="home" currentView={view} navigateTo={navigateTo} icon={ClipboardList} label="Inicio" />
                    <NavItem view="dashboard" currentView={view} navigateTo={navigateTo} icon={FileText} label="Listado (Dashboard)" />
                    <NavItem view="batch" currentView={view} navigateTo={navigateTo} icon={Layers} label="Alícuotas y Lotes" />
                    <NavItem view="crm" currentView={view} navigateTo={navigateTo} icon={UserCheck} label="Directorio Pacientes/Empresas" />
                    <NavItem view="results_review" currentView={view} navigateTo={navigateTo} icon={Activity} label="Módulo de Resultados" />
                </NavGroup>
            )}

            {['admin', 'director_tecnico', 'analyst'].includes(userRole) && (
                <NavGroup title="Módulo Clínico">
                    <NavItem view="new_request_clinical" currentView={view} navigateTo={navigateTo} onClickOverride={() => navigateTo('new_request', null, { mode: 'clinical' })} icon={PlusCircle} label="Ingreso Paciente" />
                    <NavItem view="analyzer_inbox" currentView={view} navigateTo={navigateTo} icon={Cpu} label="Analizadores Auto." />
                    <NavItem view="referrals" currentView={view} navigateTo={navigateTo} icon={Truck} label="Envíos Externos" />
                </NavGroup>
            )}

            {['admin', 'director_tecnico', 'analyst'].includes(userRole) && (
                <NavGroup title="Módulo Industrial / Alimentos">
                    <NavItem view="new_request_industrial" currentView={view} navigateTo={navigateTo} onClickOverride={() => navigateTo('new_request', null, { mode: 'industrial' })} icon={PlusCircle} label="Ingreso Muestra" />
                    <NavItem view="field-sampling" currentView={view} navigateTo={navigateTo} icon={Navigation} label="Muestreo en Campo (App)" />
                    <NavItem view="microbiology" currentView={view} navigateTo={navigateTo} icon={Microscope} label="Microbiología" />
                    <NavItem view="environmental" currentView={view} navigateTo={navigateTo} icon={Factory} label="Monitoreo de Planta" />
                    <NavItem view="storage" currentView={view} navigateTo={navigateTo} icon={Snowflake} label="Mapeo de Freezer" />
                    <NavItem view="qc" currentView={view} navigateTo={navigateTo} icon={Activity} label="Control de Calidad (QC)" />
                </NavGroup>
            )}

            {['admin', 'director_tecnico', 'billing_agent'].includes(userRole) && (
                <NavGroup title="Ventas & Finanzas">
                    {userRole === 'billing_agent' && <NavItem view="home" currentView={view} navigateTo={navigateTo} icon={ClipboardList} label="Inicio Facturación" />}
                    <NavItem view="quotes" currentView={view} navigateTo={navigateTo} icon={Calculator} label="Cotizaciones" />
                    <NavItem view="billing" currentView={view} navigateTo={navigateTo} icon={Receipt} label="Cobros y Facturación" />
                    {userRole === 'admin' && (
                        <NavItem view="accounting" currentView={view} navigateTo={navigateTo} icon={Wallet} label="Contabilidad (Admin)" />
                    )}
                </NavGroup>
            )}

            {['admin', 'director_tecnico'].includes(userRole) && (
                <NavGroup title="Administración">
                    <NavItem view="inventory" currentView={view} navigateTo={navigateTo} icon={Package} label="Inventario General" />
                    <NavItem view="equipment" currentView={view} navigateTo={navigateTo} icon={Wrench} label="Gestión de Equipos" />
                    <NavItem view="capa" currentView={view} navigateTo={navigateTo} icon={ShieldAlert} label="Calidad ISO (CAPA)" />
                    {userRole === 'admin' && (
                        <>
                            <NavItem view="audit" currentView={view} navigateTo={navigateTo} icon={History} label="Auditoría (Admin)" />
                            <NavItem view="diagnostics" currentView={view} navigateTo={navigateTo} icon={Activity} label="Diagnósticos & Backup" />
                        </>
                    )}
                </NavGroup>
            )}
            
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900/90 backdrop-blur shrink-0">
            <button onClick={() => navigateTo('help')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${view === 'help' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <HelpCircle size={18} /> <span className="font-medium text-sm">Ayuda & Guías</span>
            </button>
            <button onClick={() => navigateTo('login')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer">
                <Lock size={18} /> <span className="font-medium text-sm">Cerrar Sesión</span>
            </button>
        </div>
    </div>
);
