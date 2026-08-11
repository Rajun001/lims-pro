import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';

export const logAuditAction = async (db, userId, action, details, relatedId = null) => {
    if (!userId) return;
    if (userId === 'offline-user') {
        try {
            const localLogs = localStorage.getItem('lims_local_audit_logs') 
                ? JSON.parse(localStorage.getItem('lims_local_audit_logs')) 
                : [];
            localLogs.push({
                id: 'AUDIT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                action,
                details,
                relatedId,
                performedBy: userId,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('lims_local_audit_logs', JSON.stringify(localLogs));
            window.dispatchEvent(new Event('lims_local_data_updated'));
        } catch (e) {
            console.error("Local Audit Error:", e);
        }
        return;
    }

    try {
        await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/audit_logs`), {
            action,
            details,
            relatedId,
            performedBy: userId,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Audit Error:", e);
    }
};
