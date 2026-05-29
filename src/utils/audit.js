import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';

export const logAuditAction = async (db, userId, action, details, relatedId = null) => {
    if (!userId) return;
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
