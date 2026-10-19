import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';

export const logAuditAction = async (db, userId, action, details, relatedId = null) => {
    const actor = typeof userId === 'string' ? userId : (userId?.displayName || userId?.email || userId?.uid || 'offline-user');
    const timestamp = new Date().toISOString();
    const entry = {
        id: 'AUDIT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 7),
        action,
        details,
        relatedId,
        performedBy: actor,
        timestamp
    };

    // 1. Siempre persistir en registro local auditable de contingencia (ISO 15189 / 21 CFR Part 11)
    try {
        const localLogs = localStorage.getItem('lims_local_audit_logs') 
            ? JSON.parse(localStorage.getItem('lims_local_audit_logs')) 
            : [];
        localLogs.unshift(entry);
        if (localLogs.length > 500) localLogs.pop(); // Mantener los últimos 500 registros
        localStorage.setItem('lims_local_audit_logs', JSON.stringify(localLogs));
        window.dispatchEvent(new Event('lims_local_data_updated'));
    } catch (e) {
        console.warn("Local Audit Error:", e);
    }

    // 2. Persistir en Firestore si la conexión está disponible
    if (db && actor !== 'offline-user') {
        try {
            await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/audit_logs`), {
                action,
                details,
                relatedId,
                performedBy: actor,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.warn("Firestore Audit Error:", e);
        }
    }
};
