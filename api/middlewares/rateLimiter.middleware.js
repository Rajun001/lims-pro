import rateLimit from 'express-rate-limit';

/**
 * Limitadores de tasa dedicados para endurecimiento de seguridad perimetral.
 * Protegen contra ataques de fuerza bruta, scraping, enumeración y DoS.
 */

// 1. Limitador estricto para autenticación y registro (anti-brute force / credential stuffing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10, // Máximo 10 intentos por IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de autenticación desde esta dirección IP. Por motivos de seguridad y cumplimiento normativo (21 CFR Part 11 / ISO 17025), su acceso ha sido restringido temporalmente por 15 minutos.'
  }
});

// 2. Limitador ultra-estricto para verificación de clave institucional previa (Acceso Staff)
export const staffPasscodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5, // Máximo 5 intentos para adivinar clave institucional
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Excedió el número máximo de intentos permitidos para validar la clave institucional previa. Contacte a la Dirección Técnica de Microlabs.'
  }
});

// 3. Limitador de consultas públicas de informes / códigos QR (anti-enumeración de muestras)
export const publicVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40, // Máximo 40 consultas por IP cada 15 min
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Límite de consultas de verificación alcanzado. Por protección de datos y privacidad de pacientes, intente más tarde.'
  }
});

// 4. Limitador para formularios web públicos (pre-ingreso y presupuestos confidenciales)
export const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15, // Máximo 15 envíos cada 15 min
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Ha alcanzado el límite de solicitudes enviadas desde su conexión. Intente nuevamente en 15 minutos.'
  }
});

// 5. Limitador para el Webhook del Bot de WhatsApp AI
export const whatsappWebhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  limit: 30, // Máximo 30 mensajes por minuto
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Límite de frecuencia de mensajes excedido temporalmente.'
  }
});
