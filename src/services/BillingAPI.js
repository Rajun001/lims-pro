/**
 * BillingAPI.js
 * 
 * Adaptador genérico para conexión con APIs de facturación electrónica gubernamental.
 * (Ej: Hacienda Costa Rica, SAT México, DIAN Colombia, SUNAT Perú).
 * 
 * Permite mantener la interfaz web desconectada de los detalles técnicos específicos del proveedor.
 */

class BillingAPI {
    constructor() {
        // En un entorno de producción real, estas variables de entorno apuntarán
        // al servidor fiscal intermediario o a la API del proveedor de facturación.
        this.endpoint = import.meta.env.VITE_BILLING_API_URL || 'https://api.sandbox.factura-electronica.local';
        this.apiKey = import.meta.env.VITE_BILLING_API_KEY || 'sandbox_key_123';
    }

    /**
     * Convierte la solicitud interna de LIMS a un payload estándar fiscal.
     */
    _buildInvoicePayload(requestData, clientData) {
        return {
            company_id: "LIMS-PRO-COMPANY",
            currency: "USD",
            client: {
                name: clientData.name,
                tax_id: clientData.taxId || 'N/A',
                email: clientData.email || '',
                address: clientData.address || ''
            },
            items: requestData.items.map(item => ({
                code: item.code || "SRV-LAB",
                description: item.name,
                quantity: item.qty || 1,
                unit_price: item.price,
                total: item.price * (item.qty || 1),
                tax_rate: 0.13 // Ej. 13% IVA
            })),
            total_amount: requestData.total
        };
    }

    /**
     * Envía la factura al sistema de Hacienda/SAT
     * @param {Object} requestData 
     * @param {Object} clientData 
     * @returns {Promise<Object>} Respuesta con el estado y URL del PDF/XML
     */
    async issueInvoice(requestData, clientData) {
        console.log(`[BillingAPI] Iniciando emisión de factura para ${clientData.name}...`);
        
        const payload = this._buildInvoicePayload(requestData, clientData);
        
        // SIMULACIÓN DE LLAMADA API:
        // await fetch(this.endpoint + '/v1/invoices', { ... })
        
        return new Promise((resolve, _reject) => {
            setTimeout(() => {
                // Simulamos un éxito
                console.log("[BillingAPI] Factura emitida con éxito.", payload);
                resolve({
                    success: true,
                    invoiceNumber: `FE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    xmlUrl: "https://sandbox.local/docs/factura.xml",
                    pdfUrl: "https://sandbox.local/docs/factura.pdf",
                    timestamp: new Date().toISOString()
                });
            }, 1500); // Latencia simulada
        });
    }

    /**
     * Consulta el estado de una factura previamente emitida
     */
    async checkStatus(_invoiceNumber) {
        return {
            success: true,
            status: "ACCEPTED_BY_TAX_AUTHORITY"
        };
    }
}

export default new BillingAPI();
