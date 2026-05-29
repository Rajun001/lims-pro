/**
 * NotificationService
 * 
 * Este módulo abstrae el envío de notificaciones externas (Email, WhatsApp, SMS).
 * En la fase actual, simula el envío a través de la consola o mediante la adición de
 * logs internos que se pueden capturar desde la interfaz de usuario.
 * 
 * Para implementar notificaciones reales, integra los SDKs correspondientes aquí (ej. Twilio, Resend).
 */

class NotificationService {
    /**
     * Notifica al cliente que sus resultados están listos y aprobados.
     * @param {Object} request - Objeto con la información de la solicitud médica/industrial.
     * @param {Function} toastFn - (Opcional) Función para mostrar alerta visual en la UI.
     */
    static async notifyClientResultsReady(request, toastFn = null) {
        try {
            // Simulamos latencia de red
            await new Promise(resolve => setTimeout(resolve, 800));

            const message = `LIMS-PRO: Estimado(a) ${request.clientName || 'Cliente'}, los resultados de su análisis "${request.analysisRequested || 'Laboratorio'}" ya se encuentran procesados y aprobados. Puede revisarlos ingresando al portal con su código de acceso.`;

            // Simulamos envío de WhatsApp
            console.log(`[WHATSAPP ENVIADO a Cliente]: ${message}`);
            
            // Simulamos envío de Correo Electrónico
            console.log(`[EMAIL ENVIADO a Cliente]: ${message}`);

            if (toastFn) {
                toastFn(`Simulación: Notificación enviada a ${request.clientName}`);
            }

            return { success: true, message: "Notificaciones enviadas con éxito" };

        } catch (error) {
            console.error("Error al enviar notificaciones:", error);
            if (toastFn) {
                toastFn("Error al intentar notificar al cliente");
            }
            return { success: false, error };
        }
    }
}

export default NotificationService;
