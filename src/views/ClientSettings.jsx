import React, { useEffect } from 'react';

export const ClientSettings = ({ navigateTo }) => {
    useEffect(() => {
        // Redirigir automáticamente al nuevo y mejorado CRM
        navigateTo('crm');
    }, [navigateTo]);

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto mt-12 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800">Módulo Actualizado</h3>
            <p className="text-slate-500 text-sm mt-1">Este antiguo panel de clientes ha sido reemplazado por el nuevo módulo "CRM & Mercadeo" que incluye perfiles 360 y libretas de contactos.</p>
            <p className="text-slate-500 text-sm mt-1">Redirigiendo...</p>
            <button onClick={() => navigateTo('crm')} className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm shadow-sm">
                Ir al Directorio CRM
            </button>
        </div>
    );
};
