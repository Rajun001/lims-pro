/**
 * Generador de Mensajes Inteligentes y Enlaces Directos de WhatsApp
 * para Notificación y Entrega Autónoma de Resultados LIMS MicroLabs
 */

/**
 * Formatea un número de teléfono a estándar internacional sin caracteres especiales.
 */
export const cleanPhoneNumber = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/[^\d+]/g, '').replace(/^\+/, '');
};

/**
 * Genera el mensaje y enlace de WhatsApp para entrega de informe de resultados listo.
 */
export const generateResultsReadyWhatsApp = ({
    patientName,
    orderCode,
    requestDate,
    verificationUrl,
    laboratoryName = 'MicroLabs Laboratorio Clínico y Microbiológico',
    phoneNumber = ''
}) => {
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    const dateStr = requestDate ? new Date(requestDate).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Hoy';

    const message = `👋 Hola *${patientName || 'Estimado(a) Paciente'}*,\n\n` +
        `Le informamos que los resultados de sus análisis clínicos/microbiológicos ya se encuentran listos y validados.\n\n` +
        `📋 *Orden / Muestra:* #${orderCode || 'S/N'}\n` +
        `📅 *Fecha:* ${dateStr}\n` +
        `🏥 *Laboratorio:* ${laboratoryName}\n\n` +
        `🔗 *Descargar Informe Oficial Firmado:*\n${verificationUrl}\n\n` +
        `_Este enlace cuenta con firma digital y verificación de autenticidad mediante código QR._\n\n` +
        `Agradecemos su confianza en nuestros servicios. 🔬✨`;

    const encodedMessage = encodeURIComponent(message);
    const link = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
        : `https://api.whatsapp.com/send?text=${encodedMessage}`;

    return {
        message,
        link,
        phoneNumber: cleanPhone
    };
};

/**
 * Genera el mensaje y enlace prioritario de Alerta de Valor Crítico (Valor de Pánico)
 * para notificación inmediata al médico tratante o paciente.
 */
export const generatePanicAlertWhatsApp = ({
    doctorName,
    doctorPhone,
    patientName,
    patientDni,
    orderCode,
    panicAlerts = [],
    laboratoryName = 'MicroLabs'
}) => {
    const cleanPhone = cleanPhoneNumber(doctorPhone);
    const alertsText = panicAlerts.map(a => `• *${a.testName}:* ${a.value} ${a.unit || ''} (Límite: ${a.limitMin || a.limitMax})`).join('\n');

    const message = `🚨 *ALERTA MÉDICA PRIORITARIA - VALOR DE PÁNICO* 🚨\n\n` +
        `Dr(a). *${doctorName || 'Médico Tratante'}*,\n` +
        `Se ha detectado un valor analítico crítico que requiere atención clínica inmediata:\n\n` +
        `👤 *Paciente:* ${patientName}\n` +
        `🪪 *Identificación:* ${patientDni || 'N/A'}\n` +
        `📋 *Orden:* #${orderCode}\n\n` +
        `⚠️ *Valores Fuera de Límite de Seguridad:*\n${alertsText}\n\n` +
        `🏥 *Emitido por:* ${laboratoryName}\n` +
        `⏰ *Hora de Notificación:* ${new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
        `_Por favor acusar recibo de esta alerta para el registro de trazabilidad ISO 15189._`;

    const encodedMessage = encodeURIComponent(message);
    const link = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
        : `https://api.whatsapp.com/send?text=${encodedMessage}`;

    return {
        message,
        link,
        phoneNumber: cleanPhone
    };
};
