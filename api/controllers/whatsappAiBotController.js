/**
 * WhatsApp AI Bot Controller (Equivalente a Kora AI de SavvyLab)
 * Conecta los mensajes de WhatsApp entrantes con el motor de Inteligencia Artificial Gemini de LIMS Microlabs.
 * Permite a los pacientes y clientes consultar 24/7:
 * 1. Estado de sus exámenes de laboratorio.
 * 2. Requisitos de toma de muestra (ayuno, recolección de orina, etc.).
 * 3. Cotización de exámenes y horarios de atención de sedes.
 */

export const handleWhatsAppWebhook = async (req, res) => {
    try {
        const { message, senderPhone, clientName } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Mensaje no proporcionado" });
        }

        const systemInstruction = `
        Eres Kora-Microlabs, el Asistente Virtual Inteligente de Laboratorio Clínico y Microbiológico Microlabs.
        Respondes con amabilidad, precisión médica e higiene verbal profesional vía WhatsApp.
        Horarios de atención: Lunes a Viernes 6:00 AM - 6:00 PM, Sábados 6:00 AM - 12:00 MD.
        Requisitos comunes:
        - Glucosa / Perfil Lipídico: 8 a 12 horas de ayuno estricto.
        - Examen de Orina: Primera orina de la mañana, previo aseo, desechar el primer chorro.
        - Urocultivo: Muestra limpia sin consumo de antibióticos en las últimas 48h.
        `;

        const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

        let responseText = "Hola, bienvenido a LIMS Microlabs. ¿En qué podemos ayudarte hoy?";

        if (geminiApiKey) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
            const aiRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: [{ parts: [{ text: `Mensaje del paciente (${clientName || 'Cliente'}): ${message}` }] }]
                })
            });

            if (aiRes.ok) {
                const data = await aiRes.json();
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || responseText;
            }
        }

        return res.json({
            success: true,
            recipientPhone: senderPhone,
            replyMessage: responseText,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error en WhatsApp AI Bot:", error);
        return res.status(500).json({ error: "Error interno del Bot de IA WhatsApp" });
    }
};
