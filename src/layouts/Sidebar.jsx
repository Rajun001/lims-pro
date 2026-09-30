import React from 'react';
import { 
    ClipboardList, FileText, Package, Activity, History, Wallet, Receipt, 
    Calculator, UserCheck, Lock, Cpu, Snowflake, PlusCircle, HelpCircle, 
    Microscope, Factory, Truck, Wrench, ShieldAlert, Navigation, Layers,
    UserPlus, Building2, CheckCircle2, Send, FileSpreadsheet, Settings,
    FileCheck2, SlidersHorizontal, Home, Thermometer, Stethoscope, 
    CreditCard, TrendingUp, Search, Award, Globe, BellRing, Sparkles
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

const isClientRole = (role) => {
    return role === 'client' || role === 'patient' || (typeof role === 'string' && role.startsWith('client_'));
};

const getRoleLabel = (role) => {
    switch (role) {
        case 'director_tecnico': return { title: 'Director Técnico', tag: 'Regente', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
        case 'analyst': return { title: 'Analista de Lab', tag: 'Técnico', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
        case 'billing_agent': return { title: 'Facturación & Cobros', tag: 'Finanzas', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
        case 'admin': return { title: 'Administrador', tag: 'Master', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
        case 'client_patient':
        case 'patient': return { title: 'Paciente', tag: 'Cliente', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
        case 'client_company': return { title: 'Empresa / B2B', tag: 'Corporativo', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
        case 'client_doctor': return { title: 'Médico Tratante', tag: 'Clínico', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
        case 'client': return { title: 'Portal de Clientes', tag: 'Externo', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
        default: return { title: 'Usuario LIMS', tag: 'Staff', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
};

export const Sidebar = ({ navigateTo, view, labInfo, userRole }) => {
    const roleInfo = getRoleLabel(userRole);
    const isClient = isClientRole(userRole);

    return (
        <div className="w-64 bg-slate-900 text-white flex-col h-full shadow-2xl z-20 print:hidden hidden md:flex shrink-0 border-r border-slate-800">
            {/* Header / Logo */}
            <div 
                className="p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors" 
                onClick={() => navigateTo(isClient ? 'client_portal' : 'home')}
            >
                <div className="flex items-center justify-between mb-2">
                    <Logo url={labInfo?.logoUrl} variant="horizontal" className="h-7" />
                </div>
                <div className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleInfo.color}`}>
                    <span className="truncate">{roleInfo.title}</span>
                    <span className="text-[9px] uppercase tracking-wider">{roleInfo.tag}</span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-3.5 overflow-y-auto custom-scrollbar">
                
                {/* ========================================================================= */}
                {/* A) MENÚ EXCLUSIVO PARA CLIENTES (PACIENTES, EMPRESAS, MÉDICOS)            */}
                {/* ========================================================================= */}
                {isClient ? (
                    <div className="space-y-4">
                        <NavGroup title="Portal de Autoservicio" color="text-teal-400">
                            <NavItem 
                                view="client_portal" 
                                currentView={view} 
                                navigateTo={navigateTo} 
                                icon={FileText} 
                                label={userRole === 'client_doctor' ? "Buscador de Pacientes" : "Mis Resultados & Informes"} 
                            />
                            {userRole === 'client_company' && (
                                <>
                                    <NavItem 
                                        view="client_portal" 
                                        currentView={view} 
                                        navigateTo={navigateTo} 
                                        icon={Calculator} 
                                        label="Cotizaciones & Ensayos B2B" 
                                    />
                                    <NavItem 
                                        view="client_portal" 
                                        currentView={view} 
                                        navigateTo={navigateTo} 
                                        icon={Receipt} 
                                        label="Facturas & Estado de Cuenta" 
                                    />
                                </>
                            )}
                            <NavItem 
                                view="client_portal" 
                                currentView={view} 
                                navigateTo={navigateTo} 
                                icon={CreditCard} 
                                label="Pagos en Línea & SINPE" 
                                badge="BCCR"
                            />
                            <NavItem 
                                view="client_portal" 
                                currentView={view} 
                                navigateTo={navigateTo} 
                                icon={TrendingUp} 
                                label="Tendencias & Evolución" 
                            />
                        </NavGroup>

                        <NavGroup title="Atención & Soporte" color="text-sky-400">
                            <NavItem 
                                view="client_portal" 
                                currentView={view} 
                                navigateTo={navigateTo} 
                                icon={HelpCircle} 
                                label="Preguntas Frecuentes (FAQ)" 
                            />
                        </NavGroup>

                        {/* Banner Informativo de Confidencialidad Sanitaria */}
                        <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/50 text-[11px] text-teal-200">
                            <div className="flex items-center gap-1.5 font-bold mb-1 text-teal-400">
                                <CheckCircle2 size={13} />
                                <span>Portal Seguro Verificado</span>
                            </div>
                            <p className="text-[10px] text-teal-300/80 leading-relaxed">
                                Acceso cifrado a resultados médicos y análisis industriales certificados.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* ========================================================================= */
                    /* B) MENÚ PERSONAL DE MICROLABS (SEGREGADO ESTRICTAMENTE POR ROL)            */
                    /* ========================================================================= */
                    <>
                        {/* Panel Principal */}
                        <div className="mb-4 space-y-0.5">
                            <NavItem view="home" currentView={view} navigateTo={navigateTo} icon={Home} label="Panel General (Inicio)" />
                            <NavItem 
                                view="web" 
                                currentView={view} 
                                navigateTo={navigateTo} 
                                icon={Globe} 
                                label="Web Pública (microlabscr)" 
                                badge="2026" 
                            />
                        </div>

                        {/* PASO 1: CLIENTES Y EMPRESAS (Comercial / Admisión / Facturación / Dirección) */}
                        {['admin', 'director_tecnico', 'billing_agent'].includes(userRole) && (
                            <NavGroup step="Paso 1" title="Clientes & Empresas" color="text-sky-400">
                                <NavItem view="reminders" currentView={view} navigateTo={navigateTo} icon={BellRing} label="Agenda & Recordatorios" badge="Alertas" />
                                <NavItem view="client-crm" currentView={view} navigateTo={navigateTo} icon={Sparkles} label="Reactivación & Mercadeo" badge="Rescate" />
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
                        {['admin', 'director_tecnico', 'analyst', 'billing_agent'].includes(userRole) && (
                            <NavGroup step="Paso 2" title="Recepción & Solicitud" color="text-amber-400">
                                <NavItem view="new_request" currentView={view} navigateTo={navigateTo} icon={PlusCircle} label="Ingreso de Solicitud (Form)" badge="Nuevo" />
                                <NavItem view="dashboard" currentView={view} navigateTo={navigateTo} icon={FileText} label="Listado de Órdenes" />
                                {['admin', 'director_tecnico', 'analyst'].includes(userRole) && (
                                    <>
                                        <NavItem view="field-sampling" currentView={view} navigateTo={navigateTo} icon={Navigation} label="Muestreo en Campo (App)" />
                                        <NavItem view="bulk_upload" currentView={view} navigateTo={navigateTo} icon={FileSpreadsheet} label="Carga Masiva de Muestras" />
                                        <NavItem view="manual_form" currentView={view} navigateTo={navigateTo} icon={FileCheck2} label="Formularios Físicos" />
                                    </>
                                )}
                            </NavGroup>
                        )}

                        {/* PASO 3: LABORATORIO & INGRESO DE RESULTADOS (Exclusivo Analistas, DT y Admin) */}
                        {['admin', 'director_tecnico', 'analyst'].includes(userRole) && (
                            <NavGroup step="Paso 3" title="Laboratorio & Resultados" color="text-emerald-400">
                                <NavItem view="microbiology" currentView={view} navigateTo={navigateTo} icon={Microscope} label="Microbiología & Hojas" />
                                <NavItem view="results_review" currentView={view} navigateTo={navigateTo} icon={Activity} label="Ingreso de Datos & Ensayos" />
                                <NavItem view="batch" currentView={view} navigateTo={navigateTo} icon={Layers} label="Lotes, Alícuotas & Incubación" />
                                <NavItem view="environmental" currentView={view} navigateTo={navigateTo} icon={Factory} label="Monitoreo de Planta" />
                                <NavItem view="referrals" currentView={view} navigateTo={navigateTo} icon={Truck} label="Laboratorios de Referencia (B2B)" />
                            </NavGroup>
                        )}

                        {/* PASO 4: CONTROL DE CALIDAD Y VALIDACIÓN (Exclusivo DT, Admin y Analistas) */}
                        {['admin', 'director_tecnico', 'analyst'].includes(userRole) && (
                            <NavGroup step="Paso 4" title="Validación & Calidad" color="text-purple-400">
                                <NavItem view="qc" currentView={view} navigateTo={navigateTo} icon={CheckCircle2} label="Control de Calidad (QC)" />
                                <NavItem 
                                    view="qc_proficiencia" 
                                    currentView={view === 'qc' ? 'qc_proficiencia' : ''} 
                                    navigateTo={() => navigateTo('qc', null, { tab: 'proficiencia' })} 
                                    icon={Award} 
                                    label="Exámenes Proficiencia" 
                                    badge="LGC 2026" 
                                />
                                <NavItem view="storage" currentView={view} navigateTo={navigateTo} icon={Snowflake} label="Mapeo & Freezer" />
                                <NavItem view="cold_chain" currentView={view} navigateTo={navigateTo} icon={Thermometer} label="Cadena de Frío (IoT)" badge="Nuevo" />
                                <NavItem view="capa" currentView={view} navigateTo={navigateTo} icon={ShieldAlert} label="Aseguramiento ISO (CAPA)" />
                            </NavGroup>
                        )}

                        {/* PASO 5: EMISIÓN, ENVIOS E INFORMES (Facturación, DT y Admin) */}
                        {['admin', 'director_tecnico', 'billing_agent', 'analyst'].includes(userRole) && (
                            <NavGroup step="Paso 5" title="Emisión & Envíos" color="text-rose-400">
                                <NavItem view="reports" currentView={view} navigateTo={navigateTo} icon={FileCheck2} label="Informes & Certificados" badge="ISO 17025" />
                                <NavItem view="billing" currentView={view} navigateTo={navigateTo} icon={Send} label="Envíos & Facturación" />
                                {userRole === 'admin' && (
                                    <NavItem view="accounting" currentView={view} navigateTo={navigateTo} icon={Wallet} label="Contabilidad & Cobros" />
                                )}
                            </NavGroup>
                        )}

                        {/* CONFIGURACIÓN & ADMINISTRACIÓN (Solo DT y Admin) */}
                        {['admin', 'director_tecnico'].includes(userRole) && (
                            <NavGroup title="Configuración y Sistema">
                                <NavItem view="inventory" currentView={view} navigateTo={navigateTo} icon={Package} label="Inventario & Reactivos" />
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
                    </>
                )}
                
            </nav>

            {/* Footer */}
            <div className="p-3.5 border-t border-slate-800 space-y-1 bg-slate-900/90 backdrop-blur shrink-0">
                {!isClient && (
                    <button onClick={() => navigateTo('help')} className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-colors ${view === 'help' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <HelpCircle size={16} /> <span className="font-medium text-xs">Ayuda & Guías</span>
                    </button>
                )}
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
};

