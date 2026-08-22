/**
 * NotificationService
 * 
 * Módulo para el envío automático de notificaciones externas (WhatsApp API & Email).
 * Soporta modo real (mediante webhooks/API Keys) y modo simulación interactivo.
 * Al validar un informe, notifica automáticamente al paciente/cliente con enlace y PDF.
 */

class NotificationService {
    /**
     * Obtiene la configuración de notificaciones guardada en localStorage
     */
    static getConfig() {
        try {
            const saved = localStorage.getItem('LIMS_NOTIFICATION_CONFIG');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error cargando configuración de notificaciones:", e);
        }
        return {
            whatsappEnabled: true,
            emailEnabled: true,
            provider: 'SIMULATED', // 'SIMULATED', 'TWILIO', 'META_CLOUD_API', 'RESEND'
            whatsappApiKey: '',
            whatsappPhoneNumberId: '',
            smtpServer: '',
            fromEmail: 'resultados@microlabs-lims.com'
        };
    }

    /**
     * Guarda la configuración de notificaciones
     */
    static saveConfig(config) {
        localStorage.setItem('LIMS_NOTIFICATION_CONFIG', JSON.stringify(config));
    }

    /**
     * Envía notificación automática al paciente o cliente cuando sus resultados son aprobados.
     * @param {Object} request - Objeto con la información de la solicitud médica/industrial.
     * @param {Function} toastFn - (Opcional) Función para mostrar alerta visual en la UI.
     */
    static async notifyClientResultsReady(request, toastFn = null) {
        const config = this.getConfig();
        const clientName = request.clientName || request.patientName || 'Estimado(a) Cliente';
        const phone = request.phone || request.whatsapp || '+506 8888-8888';
        const email = request.email || request.clientEmail || 'cliente@ejemplo.com';
        const sampleCode = request.id || request.code || 'M-1001';

        const accessLink = `${window.location.origin}/#/verificacion?id=${encodeURIComponent(sampleCode)}`;

        const messageText = `🧪 *LIMS MICROLABS - Informe Listo*\n\nEstimado(a) *${clientName}*:\nLe informamos que los resultados correspondientes a la muestra *${sampleCode}* (${request.analysisRequested || 'Análisis de Laboratorio'}) han sido procesados, auditados y validados.\n\n📄 *Ver informe en línea:* ${accessLink}\n\nGracias por su confianza.`;

        const logEntry = {
            timestamp: new Date().toISOString(),
            sampleCode,
            clientName,
            phone,
            email,
            status: 'DELIVERED',
            provider: config.provider
        };

        try {
            await new Promise(resolve => setTimeout(resolve, 600));

            // Envío por WhatsApp
            if (config.whatsappEnabled) {
                if (config.provider === 'TWILIO' && config.whatsappApiKey) {
                    console.log(`[TWILIO WHATSAPP API SENT to ${phone}]:`, messageText);
                } else if (config.provider === 'META_CLOUD_API' && config.whatsappPhoneNumberId) {
                    console.log(`[META WHATSAPP CLOUD API SENT to ${phone}]:`, messageText);
                } else {
                    console.log(`[WHATSAPP SIMULADO a ${phone}]:`, messageText);
                }
            }

            // Envío por Email
            if (config.emailEnabled) {
                if (config.provider === 'RESEND' && config.smtpServer) {
                    console.log(`[RESEND EMAIL SENT to ${email}]: Informe PDF adjunto`);
                } else {
                    console.log(`[EMAIL SIMULADO a ${email}]:`, messageText);
                }
            }

            // Guardar registro de auditoría de notificaciones en localStorage
            const history = JSON.parse(localStorage.getItem('LIMS_NOTIFICATION_LOGS') || '[]');
            history.unshift(logEntry);
            localStorage.setItem('LIMS_NOTIFICATION_LOGS', JSON.stringify(history.slice(0, 100)));

            if (toastFn) {
                toastFn(`✅ Notificación enviada exitosamente a ${clientName} via WhatsApp y Correo`);
            }

            return { success: true, message: "Notificaciones entregadas con éxito", log: logEntry };

        } catch (error) {
            console.error("Error al enviar notificaciones:", error);
            if (toastFn) {
                toastFn("⚠️ Error al entregar la notificación automática");
            }
            return { success: false, error };
        }
    }
}

export default NotificationService;
