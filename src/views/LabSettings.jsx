import React, { useState } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { FormInput, RestrictedAccess } from '../components/UI';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';

export const LabSettings = ({ db, labInfo, userRole, user, navigateTo }) => {
    const [info, setInfo] = useState(labInfo || {});
    const { addNotification } = useNotification();

    if (userRole !== 'admin') {
        return <RestrictedAccess navigateTo={navigateTo} />;
    }

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/lab_settings`, "main"), info, { merge: true });
            await logAuditAction(db, user?.uid, 'MODIFICAR_CONFIGURACION', `Configuración del laboratorio modificada. Nuevo nombre: ${info.name || ''}`, "main");
            addNotification('Configuración guardada exitosamente.', 'success');
        } catch (error) {
            console.error("Error al guardar configuración:", error);
            addNotification('Error al guardar la configuración.', 'error');
        }
    };
    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
            <div className="flex justify-between mb-6"><h2 className="text-2xl font-bold">Configuración</h2><button onClick={() => navigateTo('dashboard')} className="text-slate-500">Volver</button></div>
            <form onSubmit={handleSave} className="space-y-4">
                <FormInput label="Nombre Laboratorio" value={info.name || ''} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder="Ej. Microlabs Central" />
                <FormInput label="URL del Logo" value={info.logoUrl || ''} onChange={e => setInfo({ ...info, logoUrl: e.target.value })} placeholder="Ej. https://www.microlabscr.com/s/misc/logo.jpg" />
                <FormInput label="Dirección" value={info.address || ''} onChange={e => setInfo({ ...info, address: e.target.value })} placeholder="Ej. Av. Principal 123, Ciudad" />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full">Guardar</button>
            </form>
        </div>
    );
};
