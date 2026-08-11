import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';

/**
 * Descuenta automáticamente del inventario el reactivo o kit asociado al análisis validado.
 */
export const deductInventoryForRequest = async (db, request, user) => {
    if (!db || !request) return { success: false, deductedItems: [] };

    try {
        const invRef = collection(db, `artifacts/${LIMSSystemId}/public/data/inventory`);
        const snapshot = await getDocs(invRef);
        if (snapshot.empty) return { success: false, deductedItems: [] };

        const targetCode = (request.analysisCode || '').toUpperCase().trim();
        const targetName = (request.analysisRequested || '').toLowerCase().trim();
        const deductedItems = [];

        for (const itemDoc of snapshot.docs) {
            const item = itemDoc.data();
            const itemName = (item.name || '').toLowerCase();
            const itemCategory = (item.category || '').toLowerCase();
            const itemCode = (item.code || item.linkedCode || '').toUpperCase();

            // Verificar coincidencia por código, categoría o nombre de reactivo
            const isMatch = (targetCode && itemCode && itemCode.includes(targetCode)) ||
                            (targetName && itemName.includes(targetName)) ||
                            (targetCode && itemCategory.includes(targetCode.toLowerCase())) ||
                            (targetCode && itemName.includes(targetCode.toLowerCase()));

            if (isMatch) {
                const currentStock = parseInt(item.currentStock || item.quantity || 0, 10);
                if (currentStock > 0) {
                    const newStock = Math.max(0, currentStock - 1);
                    await updateDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/inventory`, itemDoc.id), {
                        currentStock: newStock,
                        lastUsedAt: new Date().toISOString(),
                        lastUsedInRequestId: request.id
                    });

                    // Registrar movimiento en el historial
                    try {
                        const movesRef = collection(db, `artifacts/${LIMSSystemId}/public/data/inventory_movements`);
                        await addDoc(movesRef, {
                            itemId: itemDoc.id,
                            itemName: item.name,
                            type: 'DESCUENTO_AUTOMATICO',
                            quantity: 1,
                            previousStock: currentStock,
                            newStock: newStock,
                            requestId: request.id,
                            patientName: request.clientName || 'N/A',
                            timestamp: new Date().toISOString(),
                            userId: user?.email || user?.uid || 'Sistema Automático'
                        });
                    } catch (mErr) {
                        console.warn("No se pudo registrar log de movimiento:", mErr.message);
                    }

                    deductedItems.push({
                        id: itemDoc.id,
                        name: item.name,
                        newStock: newStock
                    });
                }
            }
        }

        return { success: true, deductedItems };
    } catch (err) {
        console.error("Error al descontar inventario:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Analiza los reactivos e identifica lotes vencidos o próximos a vencer en los próximos 30 días.
 */
export const checkExpiringInventoryLots = (items = []) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expired = [];
    const expiringSoon = [];

    items.forEach(item => {
        if (!item.expirationDate) return;
        
        let expDate = null;
        if (item.expirationDate?.seconds) {
            expDate = new Date(item.expirationDate.seconds * 1000);
        } else if (typeof item.expirationDate === 'string') {
            expDate = new Date(item.expirationDate);
        }

        if (!expDate || isNaN(expDate.getTime())) return;

        const diffTime = expDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            expired.push({
                ...item,
                daysOverdue: Math.abs(diffDays),
                expDateStr: expDate.toLocaleDateString('es-CR')
            });
        } else if (diffDays <= 30) {
            expiringSoon.push({
                ...item,
                daysRemaining: diffDays,
                expDateStr: expDate.toLocaleDateString('es-CR')
            });
        }
    });

    return {
        expired,
        expiringSoon,
        hasAlerts: expired.length > 0 || expiringSoon.length > 0
    };
};
