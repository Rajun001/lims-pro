
/**
 * SINPEService.js — LIMS-PRO Costa Rica
 * Servicio de Cobranza y Conciliación SINPE Móvil (Banco Central de Costa Rica - BCCR)
 */

export const LAB_SINPE_PHONE = '8888-8888';
export const LAB_NAME = 'MICROLABS CR S.A.';
export const LAB_ID = '3101144450';

const STORAGE_KEY = 'lims_sinpe_transactions';

/**
 * Genera número de referencia bancaria de 15 dígitos según estándar BCCR:
 * YYYYMMDD (8) + Sucursal (3) + Secuencia (4)
 */
export function generateReferenceNumber(branchCode = '001') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const transactions = getTransactions();
    const todayPrefix = `${dateStr}${branchCode.padStart(3, '0')}`;
    const todayCount = transactions.filter(t => t.reference?.startsWith(todayPrefix)).length + 1;
    const seqStr = String(todayCount).padStart(4, '0');

    return `${todayPrefix}${seqStr}`;
}

/**
 * Genera el payload de datos para el QR SINPE Móvil
 * Compatible con la especificación de enlace rápido de Banca Móvil CR
 */
export function generateSINPEPayload({ phone = LAB_SINPE_PHONE, amount, reference, description = 'Pago Laboratorio Microlabs' }) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `sinpe://pay?phone=${cleanPhone}&amount=${amount}&ref=${reference}&desc=${encodeURIComponent(description)}`;
}

/**
 * Obtiene todas las transacciones SINPE registradas
 */
export function getTransactions() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getSeedTransactions();
    } catch {
        return getSeedTransactions();
    }
}

/**
 * Registra una nueva transacción SINPE
 */
export function recordTransaction(tx) {
    const list = getTransactions();
    const newTx = {
        id: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toISOString(),
        phone: LAB_SINPE_PHONE,
        status: 'CONFIRMADO', // CONFIRMADO | PENDIENTE | RECHAZADO
        ...tx
    };
    list.unshift(newTx);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newTx;
}

/**
 * Actualiza el estado de una transacción existente
 */
export function updateTransactionStatus(reference, status, bankAuth = null) {
    const list = getTransactions();
    const idx = list.findIndex(t => t.reference === reference);
    if (idx !== -1) {
        list[idx].status = status;
        if (bankAuth) list[idx].bankAuth = bankAuth;
        list[idx].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return list[idx];
    }
    return null;
}

/**
 * Datos iniciales demo para visualización inmediata
 */
function getSeedTransactions() {
    return [
        {
            id: 'TX-9482A',
            reference: '202609120010001',
            client: 'Cooperativa Dos Pinos R.L.',
            invoiceId: 'INV-2024-001',
            amount: 250000,
            senderPhone: '8701-2345',
            bank: 'Banco Nacional (BNCR)',
            bankAuth: 'AUT-881920',
            date: new Date(Date.now() - 3600000 * 2).toISOString(),
            status: 'CONFIRMADO',
            notes: 'Cobro de análisis microbiológico de aguas'
        },
        {
            id: 'TX-9482B',
            reference: '202609120010002',
            client: 'Hospital CIMA San José',
            invoiceId: 'INV-2024-002',
            amount: 180000,
            senderPhone: '8310-9988',
            bank: 'BAC Credomatic',
            bankAuth: 'AUT-554109',
            date: new Date(Date.now() - 3600000 * 5).toISOString(),
            status: 'CONFIRMADO',
            notes: 'Perfil lipídico y química sanguínea'
        }
    ];
}
