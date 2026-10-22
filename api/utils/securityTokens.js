import crypto from 'crypto';

const SECRET_KEY = process.env.REPORT_TOKEN_SECRET || process.env.JWT_SECRET || 'microlabs_iso17025_double_key_secret_2026';

/**
 * Normaliza cadenas de identificación (cédula física, jurídica, DIMEX, pasaporte)
 * eliminando guiones, espacios y convirtiendo a minúsculas para validación tolerante pero exacta.
 */
export function normalizeIdentifier(val) {
    if (!val) return '';
    return String(val).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Genera un token efímero firmado por HMAC-SHA256 para enlaces seguros por correo.
 * Permite acceso de un solo clic directo al informe sin exponer contraseñas.
 */
export function generateReportAccessToken(reportNumber, ownerIdentifier, expiresInDays = 30) {
    const expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
    const normalizedId = normalizeIdentifier(ownerIdentifier);
    const payload = `${reportNumber}:${normalizedId}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
    
    // Formato: expiresAt.signature
    return `${expiresAt}.${signature}`;
}

/**
 * Verifica la validez y autenticidad del token efímero recibido en la URL.
 */
export function verifyReportAccessToken(reportNumber, ownerIdentifier, token) {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    
    const [expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return false; // Token expirado
    }

    // Validación estricta: SHA-256 en formato hexadecimal debe medir exactamente 64 caracteres [0-9a-f]
    if (!/^[0-9a-f]{64}$/i.test(signature)) {
        return false;
    }
    
    const normalizedId = normalizeIdentifier(ownerIdentifier);
    const payload = `${reportNumber}:${normalizedId}:${expiresAt}`;
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');

    const bufSignature = Buffer.from(signature, 'hex');
    const bufExpected = Buffer.from(expectedSignature, 'hex');

    if (bufSignature.length !== bufExpected.length) {
        return false;
    }
    
    try {
        return crypto.timingSafeEqual(bufSignature, bufExpected);
    } catch {
        return false;
    }
}

/**
 * Valida la segunda llave (cédula/DNI/RUC ingresada manualmente por el usuario o token).
 */
export function validateSecurityKey(reportNumber, expectedOwnerId, providedKey, providedToken) {
    // 1. Validar por token efímero
    if (providedToken && verifyReportAccessToken(reportNumber, expectedOwnerId, providedToken)) {
        return { valid: true, method: 'EPHEMERAL_TOKEN' };
    }
    
    // 2. Validar por Cédula / DNI / Tax ID manual
    if (providedKey) {
        const normExpected = normalizeIdentifier(expectedOwnerId);
        const normProvided = normalizeIdentifier(providedKey);
        
        // Coincidencia exacta o últimos 4/6 dígitos si la identificación es larga
        if (normExpected && normProvided && (normExpected === normProvided || normExpected.endsWith(normProvided))) {
            return { valid: true, method: 'OFFICIAL_ID_MATCH' };
        }
    }
    
    return { valid: false, error: 'Identificación o llave de seguridad incorrecta.' };
}
