/**
 * Motor de Clasificación Inteligente: Pacientes Clínicos vs Empresas Industriales
 * Laboratorio Microbiológico y Químico Microlabs
 */

const CORPORATE_SUFFIXES = [
    'S.A.', 'SA', 'S.R.L.', 'SRL', 'LTDA', 'LIMITADA', 'CORP', 'CORPORACION',
    'INC', 'LLC', 'INVERSIONES', 'GRUPO', 'HOLDING', 'CIA', 'COMPAÑIA', 'COMPANIA'
];

const CORPORATE_KEYWORDS = [
    'HOTEL', 'RESORT', 'RESTAURANT', 'RESTAURANTE', 'SODA', 'CAFETERIA', 'BAR',
    'ALIMENTOS', 'ALIMENTARIA', 'AGRO', 'AGROPECUARIA', 'AGRICOLA', 'CARNICERIA',
    'CARNES', 'EMBUTIDOS', 'POLLO', 'POLLERIA', 'PESCADOS', 'MARISCOS', 'PANADERIA',
    'PASTELERIA', 'LACTEOS', 'QUESOS', 'LECHE', 'HELADOS', 'BEBIDAS', 'EMBOTELLADORA',
    'AGUA', 'AGUAS', 'ASADA', 'ACUEDUCTO', 'MUNICIPALIDAD', 'CONDOMINIO', 'CLUB',
    'FABRICA', 'INDUSTRIA', 'INDUSTRIAL', 'DISTRIBUIDORA', 'COMERCIALIZADORA',
    'EXPORTADORA', 'IMPORTADORA', 'SUPERMERCADO', 'ABASTECEDOR', 'PULPERIA',
    'LABORATORIO', 'FARMACEUTICA', 'CLINICA', 'HOSPITAL', 'COOPE', 'COOPERATIVA',
    'FINCA', 'GRANJA', 'AVICOLA', 'PORCINA', 'FRUTAS', 'VEGETALES', 'LEGUMBRES', 'PROCESADORA',
    'PACKING', 'SERVICIOS', 'LOGISTICA', 'CATERING', 'DELI', 'GOURMET', 'HIELO'
];

const CLINICAL_TEST_KEYWORDS = [
    'COPROCULTIVO', 'UROCULTIVO', 'HEMOGRAMA', 'EXUDADO', 'FROTIS', 'ANTIBIOGRAMA',
    'KOH', 'ORINA', 'HECES', 'SANGRE', 'PARASITOLOGICO', 'ESPUTO', 'BIOQUIMICA',
    'GLUCOSA', 'COLESTEROL', 'TRIGLICERIDOS', 'CREATININA', 'UREA', 'ACIDO URICO',
    'PERFIL LIPIDICO', 'HORMONAS', 'TIROIDES', 'TSH', 'T3', 'T4', 'ANTIGENO'
];

/**
 * Determina si una entidad es una Empresa o un Paciente
 * @param {string} name - Nombre completo o razón social
 * @param {string} [template] - Nombre de la plantilla de reporte (opcional)
 * @param {string[]} [testNames] - Nombres de los ensayos realizados (opcional)
 * @returns {{ entityType: 'COMPANY' | 'PATIENT', sector: string, confidence: number, reasoning: string }}
 */
function classifyClient(name, template = '', testNames = []) {
    if (!name || typeof name !== 'string') {
        return {
            entityType: 'COMPANY',
            sector: 'Alimentos y Bebidas',
            confidence: 0.5,
            reasoning: 'Nombre no provisto; asignación por defecto a Empresa'
        };
    }

    const clean = name.trim().toUpperCase();
    const cleanNoAccents = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanTmpl = (template || '').toUpperCase();
    const testsUpper = (testNames || []).map(t => (t || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

    // 1. Verificación por Tipo de Ensayos si existen
    const hasClinicalTests = testsUpper.some(t => 
        CLINICAL_TEST_KEYWORDS.some(k => t.includes(k))
    );
    if (hasClinicalTests) {
        return {
            entityType: 'PATIENT',
            sector: 'Microbiología Clínica y Salud Humana',
            confidence: 0.95,
            reasoning: 'Ensayos clínicos humanos detectados en la orden (HL7/Bioquímica/Cultivo)'
        };
    }

    // 2. Verificación por Nombre de Plantilla
    if (cleanTmpl.includes('CLINIC') || cleanTmpl.includes('PACIENTE') || cleanTmpl.includes('HUMAN')) {
        return {
            entityType: 'PATIENT',
            sector: 'Microbiología Clínica y Salud Humana',
            confidence: 0.95,
            reasoning: 'Plantilla de reporte clínico humano'
        };
    }

    // 3. Verificación de sufijos corporativos legales
    const cleanNoDots = clean.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
    const cleanWords = cleanNoDots.split(' ');

    const hasCorporateSuffix = CORPORATE_SUFFIXES.some(s => {
        const sClean = s.replace(/\./g, '').trim();
        return cleanWords.includes(sClean) || clean.endsWith(s) || clean.endsWith(s.replace(/\.$/, ''));
    });

    if (hasCorporateSuffix) {
        return {
            entityType: 'COMPANY',
            sector: detectIndustrySector(clean),
            confidence: 0.99,
            reasoning: `Sufijo legal corporativo detectado en razón social`
        };
    }

    // 4. Verificación de palabras clave corporativas
    for (const kw of CORPORATE_KEYWORDS) {
        if (cleanWords.includes(kw) || cleanNoAccents.includes(` ${kw}`) || cleanNoAccents.startsWith(`${kw} `) || cleanNoAccents.includes(kw)) {
            return {
                entityType: 'COMPANY',
                sector: detectIndustrySector(clean),
                confidence: 0.95,
                reasoning: `Palabra clave industrial/comercial detectada: ${kw}`
            };
        }
    }

    // 4b. Verificación si los ensayos son de alimentos/aguas/superficies
    const hasIndustrialTests = testsUpper.some(t => 
        t.includes('ALIMENTO') || t.includes('AGUA') || t.includes('SUPERFICIE') || 
        t.includes('MANOS') || t.includes('MANIPULADOR') || t.includes('UFC') || 
        t.includes('NMP') || t.includes('PETRIFILM') || t.includes('RTA') || 
        t.includes('LOTE') || t.includes('COLIFORMES') || t.includes('AEROBIOS')
    );
    if (hasIndustrialTests) {
        return {
            entityType: 'COMPANY',
            sector: detectIndustrySector(clean),
            confidence: 0.92,
            reasoning: 'Ensayos y matrices industriales/microbiológicas detectadas'
        };
    }

    // 5. Análisis del nombre de persona vs empresa
    // Nombres como "Juan Pérez Rojas" o "María Rodríguez" suelen ser 2 a 4 palabras sin números
    const words = clean.split(/\s+/).filter(Boolean);
    const hasNumbers = /\d/.test(clean);

    if (words.length >= 2 && words.length <= 4 && !hasNumbers) {
        // Podría ser un paciente o un cliente individual
        return {
            entityType: 'PATIENT',
            sector: 'Paciente Individual / Consulta Privada',
            confidence: 0.75,
            reasoning: 'Estructura de nombre y apellidos de persona natural'
        };
    }

    // Fallback a Empresa
    return {
        entityType: 'COMPANY',
        sector: detectIndustrySector(clean),
        confidence: 0.70,
        reasoning: 'Estructura comercial asignada a Empresa'
    };
}

/**
 * Detecta el sector industrial específico de la empresa
 */
function detectIndustrySector(nameUpper) {
    if (nameUpper.includes('HOTEL') || nameUpper.includes('RESORT')) return 'Hotelería y Turismo';
    if (nameUpper.includes('RESTAURANT') || nameUpper.includes('SODA') || nameUpper.includes('CATERING') || nameUpper.includes('BAR')) return 'Restaurantes y Servicios Gastronómicos';
    if (nameUpper.includes('AGUA') || nameUpper.includes('ASADA') || nameUpper.includes('ACUEDUCTO') || nameUpper.includes('PISCINA')) return 'Aguas y Recursos Hídricos';
    if (nameUpper.includes('HIELO')) return 'Plantas de Hielo y Frío';
    if (nameUpper.includes('CARNE') || nameUpper.includes('POLLO') || nameUpper.includes('PESCADO') || nameUpper.includes('EMBUTIDO')) return 'Industria Cárnica y Avícola';
    if (nameUpper.includes('LACTEO') || nameUpper.includes('QUESO') || nameUpper.includes('LECHE')) return 'Industria Láctea';
    if (nameUpper.includes('PANADERIA') || nameUpper.includes('PASTEL') || nameUpper.includes('HARINA')) return 'Panificación y Repostería';
    if (nameUpper.includes('FARMACEUTICA') || nameUpper.includes('LABORATORIO')) return 'Industria Farmacéutica y Cosmética';
    if (nameUpper.includes('AGRO') || nameUpper.includes('FINCA') || nameUpper.includes('FRUTA') || nameUpper.includes('VEGETAL')) return 'Agroindustria y Exportación';
    if (nameUpper.includes('SUPERMERCADO') || nameUpper.includes('COMERCIAL')) return 'Comercio y Distribución Masiva';
    return 'Alimentos Procesados y Bebidas';
}

/**
 * Calcula el estado de actividad comercial de un cliente según su último reporte
 * @param {Date | string | null} lastReportDate 
 * @returns {'ACTIVE' | 'AT_RISK' | 'INACTIVE' | 'NEW'}
 */
function calculateActivityStatus(lastReportDate) {
    if (!lastReportDate) return 'INACTIVE';
    const last = new Date(lastReportDate);
    if (isNaN(last.getTime())) return 'INACTIVE';

    const now = new Date();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

    if (diffDays <= 90) return 'ACTIVE';        // Activo: muestra en los últimos 3 meses
    if (diffDays <= 180) return 'AT_RISK';      // En riesgo: 3 a 6 meses sin análisis
    return 'INACTIVE';                          // Inactivo / Rescate: más de 6 meses
}

export {
    classifyClient,
    detectIndustrySector,
    calculateActivityStatus
};

export default {
    classifyClient,
    detectIndustrySector,
    calculateActivityStatus
};
