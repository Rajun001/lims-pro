/**
 * Microlabs AI Engine & Multi-Model Intelligence Service
 * Powered by Google Gemini (2.5 Flash, 2.5 Pro, 1.5 Flash Fallbacks)
 * Standards: ISO 15189 / ISO 17025 / CLSI / EUCAST / FDA BAM / RTCA
 */

// Model cascade priority for zero-downtime reliability
const MODELS_CASCADE = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash'
];

/**
 * Retrieves the active Gemini API Key with safety fallback
 */
export const getActiveApiKey = () => {
    return localStorage.getItem('LIMS_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

/**
 * Low-level multi-model resilient AI prompt runner
 */
export const executeGeminiPrompt = async (promptText, inlineData = null, options = {}) => {
    const apiKey = options.apiKey || getActiveApiKey();
    const systemInstruction = options.systemInstruction || 'Eres el Asistente de Inteligencia Artificial del Software LIMS Microlabs, especializado en Microbiología Clínica, Análisis de Alimentos, Aguas, Calidad ISO 17025/15189 y Gestión de Laboratorios.';
    
    let lastError = null;

    for (const model of MODELS_CASCADE) {
        try {
            const parts = [{ text: promptText }];
            if (inlineData) {
                parts.push({
                    inline_data: inlineData
                });
            }

            const payload = {
                contents: [{ parts }],
                generationConfig: {
                    temperature: options.temperature !== undefined ? options.temperature : 0.1,
                    maxOutputTokens: options.maxTokens || 4096,
                    responseMimeType: options.responseMimeType || (options.isJson ? 'application/json' : 'text/plain')
                }
            };

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API Error [${model}] status ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
                return {
                    success: true,
                    text: candidateText,
                    modelUsed: model
                };
            }
        } catch (err) {
            console.warn(`[AI Engine] Error with model ${model}, attempting cascade fallback...`, err);
            lastError = err;
        }
    }

    throw lastError || new Error("Todos los modelos de IA fallaron al responder.");
};

/**
 * 1. AI Intake OCR: Extracts medical orders, handwritten prescriptions, or food/water sample forms
 */
export const extractOrderFromDocument = async (fileDataUrl, formMode = 'clinical') => {
    const base64Data = fileDataUrl.split(',')[1];
    const mimeType = fileDataUrl.split(';')[0].split(':')[1];

    const prompt = `
    Analiza meticulosamente este documento (orden médica, boleta de toma de muestra o solicitud industrial).
    Extrae toda la información en formato JSON estricto:
    {
      "tipoFormulario": "${formMode}",
      "paciente_o_cliente": {
        "nombreCompleto": "Nombre completo",
        "primerNombre": "Primer nombre",
        "segundoNombre": "Segundo nombre o vacio",
        "primerApellido": "Primer apellido",
        "segundoApellido": "Segundo apellido o vacio",
        "cedula": "Cédula/DNI/Pasaporte o vacio",
        "fechaNacimiento": "YYYY-MM-DD o vacio",
        "genero": "Masculino/Femenino o vacio",
        "telefono": "Teléfono o vacio",
        "correo": "Correo electrónico o vacio",
        "direccion": "Dirección o vacio"
      },
      "datosClinicos": {
        "medicoSolicitante": "Nombre del médico o clínica o vacio",
        "codigoMedico": "Código del médico o vacio",
        "diagnosticoOInformacion": "Diagnóstico presuntivo o vacio"
      },
      "datosEmpresa": {
        "razonSocial": "Nombre de empresa o vacio",
        "cedulaJuridica": "Cédula jurídica o vacio",
        "contactoCalidad": "Nombre contacto calidad o vacio",
        "correoCalidad": "Correo calidad o vacio",
        "temperaturaRecepcion": "Temperatura °C o vacio"
      },
      "muestras": [
        {
          "descripcion": "Descripción de la muestra (ej. Orina, Sangre, Agua potable, Queso fresco)",
          "lote": "Lote si aplica o vacio",
          "otrosDatos": "Observaciones de la muestra",
          "pruebasSolicitadas": ["Cultivo", "Antibiograma", "Recuento UFC", "NMP Coliformes", etc.]
        }
      ]
    }
    `;

    const result = await executeGeminiPrompt(prompt, { mime_type: mimeType, data: base64Data }, { isJson: true });
    try {
        const cleanJson = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        throw new Error("No se pudo parsear el resultado JSON del documento: " + e.message);
    }
};

/**
 * 2. AI Reference Lab Results Extractor
 */
export const extractExternalLabReport = async (fileDataUrl, sampleContext = {}) => {
    const base64Data = fileDataUrl.split(',')[1];
    const mimeType = fileDataUrl.split(';')[0].split(':')[1];

    const prompt = `
    Eres un Microbiólogo y Químico Clínico Auditor.
    Analiza este informe de resultados emitido por un laboratorio externo de referencia para la muestra "${sampleContext.id || 'N/A'}" (${sampleContext.analysisRequested || 'Análisis'}).
    
    Genera un resumen técnico en Markdown estructurado que incluya:
    1. Laboratorio Emisor Externo.
    2. Paciente / Muestra identificada.
    3. Parámetros Analizados, Resultados Numéricos/Cualitativos, Unidades de Medida y Rangos de Referencia.
    4. Conclusión Diagnóstica / Interpretación Microbiológica.
    5. Observaciones de Calidad y Metodología Analítica.
    `;

    const result = await executeGeminiPrompt(prompt, { mime_type: mimeType, data: base64Data });
    return result.text;
};

/**
 * 3. AI Microbiological Expert Interpreter (CLSI / EUCAST / Food BAM Criteria)
 */
export const generateMicrobiologyAIInterpretation = async ({
    pathogen,
    antibiogram = [],
    sampleType,
    analysisRequested,
    colonyCount,
    criteria
}) => {
    const prompt = `
    Como Microbiólogo Especialista y Regente de LIMS Microlabs, interpreta los siguientes hallazgos:
    - Patógeno / Microorganismo Aislado: ${pathogen || 'Sin aislamiento patógeno significativo'}
    - Tipo de Muestra / Matriz: ${sampleType || 'Clínica / Alimentos'}
    - Ensayo: ${analysisRequested || 'Cultivo Microbiológico'}
    - Recuento (si aplica): ${colonyCount || 'N/A'}
    - Criterio Normativo (si aplica): ${criteria || 'CLSI M100 / EUCAST / RTCA'}
    - Perfil de Susceptibilidad Antimicrobiana (Antibiograma):
      ${antibiogram.map(a => `- ${a.antibiotic}: ${a.result} (Halo/CMI: ${a.zone || 'N/A'})`).join('\n')}

    Redacta una conclusión e interpretación diagnóstica profesional (en español, 2 a 3 párrafos):
    1. Significado clínico o microbiológico del aislamiento.
    2. Patrón de susceptibilidad / resistencia (mencionar si hay sospecha de BLEE, MRSA, VRE, Carbapenemasas o resistencia intrínseca).
    3. Recomendación terapéutica u operativa según corresponda.
    `;

    const result = await executeGeminiPrompt(prompt);
    return result.text;
};

/**
 * 4. AI CAPA & Root Cause Analyzer (ISO 15189 / 17025)
 */
export const generateCAPAAISuggestion = async ({ title, description, category, severity }) => {
    const prompt = `
    Eres un Auditor Líder de Calidad ISO 15189 y ISO 17025 para laboratorios microbiológicos.
    Analiza la siguiente No Conformidad (CAPA):
    - Título: ${title}
    - Categoría: ${category}
    - Severidad: ${severity}
    - Descripción del Problema: ${description}

    Genera una propuesta formal estructurada en JSON con:
    {
      "rootCauseAnalysis": "Análisis de causa raíz aplicando la metodología de los 5 Porqués e Ishikawa",
      "immediateAction": "Acción de contención inmediata / corrección",
      "correctiveAction": "Acción correctiva para prevenir recurrencia",
      "preventiveAction": "Acción preventiva a nivel de sistema de gestión",
      "verificationMethod": "Método de seguimiento y verificación de eficacia",
      "riskEvaluation": "Nivel de riesgo residual (Bajo/Medio/Alto)"
    }
    `;

    const result = await executeGeminiPrompt(prompt, null, { isJson: true });
    try {
        const cleanJson = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        return {
            rootCauseAnalysis: result.text,
            immediateAction: "Revisar protocolo operativo.",
            correctiveAction: "Capacitar al personal y ajustar calibraciones.",
            preventiveAction: "Auditoría interna mensual.",
            verificationMethod: "Control de calidad y seguimiento a 30 días.",
            riskEvaluation: "Bajo"
        };
    }
};
