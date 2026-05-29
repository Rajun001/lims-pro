import React from 'react';
import { ClipboardList, FileText, PlusCircle, Activity, UserCheck } from 'lucide-react';

export const MobileNav = ({ navigateTo, view }) => (
    <div className="md:hidden border-t flex justify-around p-2 bg-slate-900 text-white text-[10px] z-20 print:hidden mt-auto shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        <button onClick={() => navigateTo('home')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'home' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <ClipboardList size={22} className="mb-1" />
            <span className="font-medium">Inicio</span>
        </button>
        <button onClick={() => navigateTo('new_request')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'new_request' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <PlusCircle size={22} className="mb-1" />
            <span className="font-medium">Ingreso</span>
        </button>
        <button onClick={() => navigateTo('dashboard')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <FileText size={22} className="mb-1" />
            <span className="font-medium">Listado</span>
        </button>
        <button onClick={() => navigateTo('results_review')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'results_review' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <Activity size={22} className="mb-1" />
            <span className="font-medium">Resultados</span>
        </button>
        <button onClick={() => navigateTo('crm')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'crm' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <UserCheck size={22} className="mb-1" />
            <span className="font-medium">CRM</span>
        </button>
    </div>
);
