/**
 * HardwareLink.js
 * 
 * Interfaz para conectar equipos físicos (Analizadores Clínicos, Balanzas, etc.) 
 * directamente a la página web utilizando la Web Serial API.
 * 
 * Nota de Compatibilidad: Solo funciona en navegadores basados en Chromium (Chrome, Edge).
 * Requiere HTTPS o estar en localhost.
 */

class HardwareLink {
    constructor() {
        this.port = null;
        this.reader = null;
    }

    /**
     * Verifica si el navegador soporta Web Serial API
     */
    isSupported() {
        return 'serial' in navigator;
    }

    /**
     * Solicita permiso al usuario para conectar un dispositivo COM/USB
     */
    async connect(baudRate = 9600) {
        if (!this.isSupported()) {
            throw new Error("Tu navegador no soporta conexión directa a Hardware. Usa Google Chrome o Microsoft Edge.");
        }

        try {
            // El navegador mostrará un popup nativo pidiendo al usuario seleccionar un puerto
            this.port = await navigator.serial.requestPort();
            
            // Abre el puerto con la velocidad especificada (9600 es estándar para LIS)
            await this.port.open({ baudRate });
            
            console.log("[HardwareLink] Dispositivo conectado con éxito.");
            return true;
        } catch (e) {
            console.error("[HardwareLink] Error al conectar:", e);
            throw e;
        }
    }

    /**
     * Comienza a escuchar datos del puerto y ejecuta un callback por cada bloque de texto recibido
     * Útil para capturar streams crudos HL7 o ASTM.
     */
    async startListening(onDataReceived) {
        if (!this.port) throw new Error("No hay dispositivo conectado.");

        try {
            // Pipeline para convertir los bytes crudos (Uint8Array) a texto (String)
            const textDecoder = new TextDecoderStream();
            const _readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();

            console.log("[HardwareLink] Escuchando puerto...");

            // Bucle infinito de lectura
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                    // Si el lector ha sido cancelado
                    break;
                }
                if (value) {
                    onDataReceived(value);
                }
            }
        } catch (e) {
            console.error("[HardwareLink] Error leyendo datos:", e);
        } finally {
            this.reader?.releaseLock();
        }
    }

    /**
     * Cierra el puerto de forma segura
     */
    async disconnect() {
        if (this.reader) {
            await this.reader.cancel();
            this.reader = null;
        }
        if (this.port) {
            await this.port.close();
            this.port = null;
            console.log("[HardwareLink] Dispositivo desconectado.");
        }
    }
}

export default new HardwareLink();
