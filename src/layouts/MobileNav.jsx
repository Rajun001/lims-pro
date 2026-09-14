import React from 'react';
import { ClipboardList, FileText, PlusCircle, Activity, UserCheck, CreditCard, HelpCircle, Lock, Microscope, Send } from 'lucide-react';

const isClientRole = (role) => {
    return role === 'client' || role === 'patient' || (typeof role === 'string' && role.startsWith('client_'));
};

export const MobileNav = ({ navigateTo, view, userRole }) => {
    const isClient = isClientRole(userRole);

    if (isClient) {
        return (
            <div className="md:hidden border-t flex justify-around p-2 bg-slate-900 text-white text-[10px] z-20 print:hidden mt-auto shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                <button onClick={() => navigateTo('client_portal')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'client_portal' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <FileText size={20} className="mb-1" />
                    <span className="font-medium">Resultados</span>
                </button>
                <button onClick={() => navigateTo('client_portal')} className="flex flex-col items-center p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
                    <CreditCard size={20} className="mb-1" />
                    <span className="font-medium">Pagos & SINPE</span>
                </button>
                <button onClick={() => navigateTo('login')} className="flex flex-col items-center p-2 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                    <Lock size={20} className="mb-1" />
                    <span className="font-medium">Salir</span>
                </button>
            </div>
        );
    }

    // Role-tailored staff mobile navigation
    const isAnalyst = userRole === 'analyst';
    const isBilling = userRole === 'billing_agent';

    return (
        <div className="md:hidden border-t flex justify-around p-2 bg-slate-900 text-white text-[10px] z-20 print:hidden mt-auto shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
            <button onClick={() => navigateTo('home')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'home' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                <ClipboardList size={20} className="mb-1" />
                <span className="font-medium">Inicio</span>
            </button>
            
            {!isAnalyst && (
                <button onClick={() => navigateTo('new_request')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'new_request' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <PlusCircle size={20} className="mb-1" />
                    <span className="font-medium">Ingreso</span>
                </button>
            )}

            <button onClick={() => navigateTo('dashboard')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                <FileText size={20} className="mb-1" />
                <span className="font-medium">Órdenes</span>
            </button>

            {isAnalyst ? (
                <button onClick={() => navigateTo('results_review')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'results_review' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <Activity size={20} className="mb-1" />
                    <span className="font-medium">Ensayos</span>
                </button>
            ) : isBilling ? (
                <button onClick={() => navigateTo('billing')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'billing' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <Send size={20} className="mb-1" />
                    <span className="font-medium">Facturas</span>
                </button>
            ) : (
                <button onClick={() => navigateTo('results_review')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'results_review' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <Activity size={20} className="mb-1" />
                    <span className="font-medium">Resultados</span>
                </button>
            )}

            {isBilling || userRole === 'admin' ? (
                <button onClick={() => navigateTo('crm')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'crm' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <UserCheck size={20} className="mb-1" />
                    <span className="font-medium">CRM</span>
                </button>
            ) : isAnalyst ? (
                <button onClick={() => navigateTo('microbiology')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'microbiology' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <Microscope size={20} className="mb-1" />
                    <span className="font-medium">Micro</span>
                </button>
            ) : (
                <button onClick={() => navigateTo('crm')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'crm' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <UserCheck size={20} className="mb-1" />
                    <span className="font-medium">CRM</span>
                </button>
            )}
        </div>
    );
};

