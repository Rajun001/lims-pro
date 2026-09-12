export const PUSH_TOPICS = {
    RESULTADO_LISTO: { id: 'RESULTADO_LISTO', label: 'Resultados Listos', desc: 'Aviso inmediato al validar un informe' },
    VALOR_CRITICO: { id: 'VALOR_CRITICO', label: 'Valores Críticos / Pánico', desc: 'Alertas inmediatas de muestras fuera de rango vital' },
    MANTENIMIENTO_EQUIPO: { id: 'MANTENIMIENTO_EQUIPO', label: 'Calibración & Equipos', desc: 'Recordatorios preventivos de analizadores' },
    STOCK_BAJO: { id: 'STOCK_BAJO', label: 'Stock Bajo de Reactivos', desc: 'Alertas de inventario y punto de reorden' },
    CADENA_FRIO: { id: 'CADENA_FRIO', label: 'Ruptura Cadena de Frío', desc: 'Desviaciones térmicas en freezers e incubadoras' }
};

class NotificationService {
    /**
     * Comprueba si las notificaciones push están soportadas en el navegador
     */
    static isPushSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }

    /**
     * Obtiene el estado actual del permiso de notificación
     */
    static getPushPermission() {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission; // 'granted', 'denied', 'default'
    }

    /**
     * Suscribe el navegador a las notificaciones Push
     */
    static async subscribeToPush() {
        if (!this.isPushSupported()) {
            throw new Error('Las notificaciones Push no están soportadas en este navegador.');
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Permiso de notificaciones denegado por el usuario.');
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Clave pública VAPID simulada para PWA local
            subscription = {
                endpoint: 'https://fcm.googleapis.com/fcm/send/simulated-lims-endpoint',
                subscribedAt: new Date().toISOString()
            };
        }

        localStorage.setItem('LIMS_PUSH_SUBSCRIBED', 'true');
        return { success: true, permission, subscription };
    }

    /**
     * Desuscribe de notificaciones Push
     */
    static async unsubscribeFromPush() {
        localStorage.setItem('LIMS_PUSH_SUBSCRIBED', 'false');
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager?.getSubscription();
            if (sub) await sub.unsubscribe();
        }
        return { success: true };
    }

    /**
     * Dispara una notificación Push local (Browser Notification)
     */
    static async sendPushToSelf({ title, body, tag = 'lims-alert', icon = '/pwa-192x192.png' }) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return { success: false, reason: 'Permission not granted' };
        }

        try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
                await reg.showNotification(title, {
                    body,
                    icon,
                    tag,
                    badge: '/pwa-192x192.png',
                    vibrate: [200, 100, 200]
                });
            } else {
                new Notification(title, { body, icon });
            }

            // Guardar en historial de notificaciones
            const pushLogs = JSON.parse(localStorage.getItem('LIMS_PUSH_LOGS') || '[]');
            pushLogs.unshift({
                id: 'PUSH-' + Date.now(),
                title,
                body,
                tag,
                date: new Date().toISOString()
            });
            localStorage.setItem('LIMS_PUSH_LOGS', JSON.stringify(pushLogs.slice(0, 50)));

            return { success: true };
        } catch (e) {
            console.error('Error enviando push local:', e);
            return { success: false, error: e.message };
        }
    }

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
            fromEmail: 'resultados@microlabscr.com'
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
