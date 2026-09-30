/**
 * Catálogo Oficial de Criterios Microbiológicos, Normas Técnicas y Límites de Aceptación
 * Fuente: Biblioteca Técnica Microlabs, RTCA 67.04.50:17 (Criterios Microbiológicos para Alimentos),
 * Decreto Ejecutivo 38924-S (Reglamento de Calidad del Agua Potable Costa Rica),
 * ICMSF (Microorganisms in Foods), Codex Alimentarius y Estándares de Luminometría ATP Clean-Trace 3M.
 */

export const MICROBIOLOGY_STANDARDS = [
    // ── 1. LÁCTEOS Y DERIVADOS ──
    {
        id: 'lac_queso_fresco',
        category: 'Lácteos y Derivados',
        commodity: 'Queso fresco, blanco, tierno no madurado',
        normative: 'RTCA 67.04.50:17 / ICMSF',
        parameters: [
            { microorganism: 'Coliformes Fecales', unit: 'NMP/g o UFC/g', n: 5, c: 2, m: 100, M: 1000, interpretation: 'Indicador higiénico del proceso' },
            { microorganism: 'Escherichia coli', unit: 'UFC/g', n: 5, c: 1, m: 10, M: 100, interpretation: 'Contaminación fecal directa' },
            { microorganism: 'Staphylococcus aureus', unit: 'UFC/g', n: 5, c: 1, m: 100, M: 1000, interpretation: 'Riesgo de enterotoxinas estafilocócicas' },
            { microorganism: 'Salmonella spp.', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Patógeno entérico crítico' },
            { microorganism: 'Listeria monocytogenes', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Patógeno psicrotrofo invasivo' }
        ]
    },
    {
        id: 'lac_queso_madurado',
        category: 'Lácteos y Derivados',
        commodity: 'Queso madurado y semimadurado (Cheddar, Gouda, Edam)',
        normative: 'RTCA 67.04.50:17',
        parameters: [
            { microorganism: 'Coliformes Totales', unit: 'UFC/g', n: 5, c: 2, m: 100, M: 1000, interpretation: 'Indicador de maduración y proceso' },
            { microorganism: 'Escherichia coli', unit: 'UFC/g', n: 5, c: 1, m: 10, M: 100, interpretation: 'Indicador fecal' },
            { microorganism: 'Staphylococcus aureus', unit: 'UFC/g', n: 5, c: 1, m: 1000, M: 10000, interpretation: 'Enterotoxinas' },
            { microorganism: 'Listeria monocytogenes', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Patógeno tolerante a salinidad' }
        ]
    },
    {
        id: 'lac_leche_pasteurizada',
        category: 'Lácteos y Derivados',
        commodity: 'Leche fluida pasteurizada',
        normative: 'RTCA 67.04.50:17 / Decreto MAG-MEIC-S',
        parameters: [
            { microorganism: 'Recuento Total de Aerobios Mesófilos (RAM)', unit: 'UFC/mL', n: 5, c: 1, m: 20000, M: 30000, interpretation: 'Eficacia de pasteurización' },
            { microorganism: 'Coliformes Totales', unit: 'UFC/mL', n: 5, c: 1, m: 1, M: 5, interpretation: 'Contaminación pospasteurización' },
            { microorganism: 'Salmonella spp.', unit: 'Ausencia en 25 mL', n: 5, c: 0, m: 0, M: 0, interpretation: 'Patógeno entérico' }
        ]
    },
    {
        id: 'lac_helados',
        category: 'Lácteos y Derivados',
        commodity: 'Helados y mezclas para helados',
        normative: 'RTCA 67.04.50:17',
        parameters: [
            { microorganism: 'Recuento de Aerobios Mesófilos', unit: 'UFC/g', n: 5, c: 2, m: 10000, M: 50000, interpretation: 'Carga bacteriana total' },
            { microorganism: 'Coliformes Fecales', unit: 'NMP/g', n: 5, c: 1, m: 10, M: 100, interpretation: 'Higiene del proceso de congelación' },
            { microorganism: 'Salmonella spp.', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Ausencia obligatoria' },
            { microorganism: 'Listeria monocytogenes', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Monitoreo en frío' }
        ]
    },

    // ── 2. CARNES, EMBUTIDOS Y AVES ──
    {
        id: 'car_carne_molida',
        category: 'Carnes y Productos Cárnicos',
        commodity: 'Carne molida cruda (Res, Cerdo)',
        normative: 'RTCA 67.04.50:17 / USDA FSIS',
        parameters: [
            { microorganism: 'Recuento de Aerobios Mesófilos', unit: 'UFC/g', n: 5, c: 3, m: 1000000, M: 10000000, interpretation: 'Calidad higiénica de la materia prima' },
            { microorganism: 'Escherichia coli', unit: 'UFC/g', n: 5, c: 2, m: 100, M: 500, interpretation: 'Contaminación entérica en faenamiento' },
            { microorganism: 'Staphylococcus aureus', unit: 'UFC/g', n: 5, c: 1, m: 100, M: 1000, interpretation: 'Manipulación humana' },
            { microorganism: 'Salmonella spp.', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Criterio microbiológico de inocuidad' }
        ]
    },
    {
        id: 'car_embutidos_cocidos',
        category: 'Carnes y Productos Cárnicos',
        commodity: 'Embutidos cocidos (Jamones, Salchichas, Mortadelas)',
        normative: 'RTCA 67.04.50:17',
        parameters: [
            { microorganism: 'Recuento de Aerobios Mesófilos', unit: 'UFC/g', n: 5, c: 2, m: 10000, M: 100000, interpretation: 'Supervivencia al tratamiento térmico' },
            { microorganism: 'Coliformes Fecales', unit: 'NMP/g', n: 5, c: 1, m: 3, M: 20, interpretation: 'Recontaminación poscocción' },
            { microorganism: 'Clostridium perfringens', unit: 'UFC/g', n: 5, c: 1, m: 10, M: 100, interpretation: 'Esporulados anaerobios' },
            { microorganism: 'Salmonella spp.', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Ausencia obligatoria' },
            { microorganism: 'Listeria monocytogenes', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'RTE (Ready to eat) riesgo crítico' }
        ]
    },
    {
        id: 'car_pollo_fresco',
        category: 'Carnes y Productos Cárnicos',
        commodity: 'Carne de ave fresca o congelada',
        normative: 'RTCA 67.04.50:17 / SENASA',
        parameters: [
            { microorganism: 'Escherichia coli', unit: 'UFC/g', n: 5, c: 2, m: 500, M: 5000, interpretation: 'Eviscerado e higiene de matadero' },
            { microorganism: 'Salmonella spp.', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Zoonosis de vigilancia nacional' },
            { microorganism: 'Campylobacter jejuni', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Patógeno aviar zoonótico' }
        ]
    },

    // ── 3. PESCADOS Y PRODUCTOS DE LA PESCA ──
    {
        id: 'pes_pescado_fresco',
        category: 'Pescados y Mariscos',
        commodity: 'Pescado fresco, refrigerado o congelado (Filetes, Tilapia)',
        normative: 'RTCA 67.04.50:17 / Codex Stan 190',
        parameters: [
            { microorganism: 'Recuento de Aerobios Mesófilos', unit: 'UFC/g', n: 5, c: 3, m: 500000, M: 5000000, interpretation: 'Frescura e índice de vida útil' },
            { microorganism: 'Escherichia coli', unit: 'UFC/g', n: 5, c: 1, m: 10, M: 500, interpretation: 'Lavado y manipulación' },
            { microorganism: 'Staphylococcus aureus', unit: 'UFC/g', n: 5, c: 1, m: 100, M: 1000, interpretation: 'Manipulación del fileteador' },
            { microorganism: 'Salmonella spp.', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Inocuidad estricta' },
            { microorganism: 'Vibrio cholerae / parahaemolyticus', unit: 'Ausencia en 25 g', n: 5, c: 0, m: 0, M: 0, interpretation: 'Flora marina patógena' }
        ]
    },

    // ── 4. AGUAS Y BEBIDAS ──
    {
        id: 'agua_potable_cr',
        category: 'Aguas y Hielos',
        commodity: 'Agua Potable de Red / Consumo Humano',
        normative: 'Decreto Ejecutivo 38924-S (Costa Rica)',
        parameters: [
            { microorganism: 'Coliformes Fecales / Escherichia coli', unit: 'NMP/100 mL o UFC/100 mL', n: 1, c: 0, m: 0, M: 0, interpretation: 'Cero tolerancia: indicador directo de fecalismo' },
            { microorganism: 'Coliformes Totales', unit: 'NMP/100 mL o UFC/100 mL', n: 1, c: 0, m: 0, M: 0, interpretation: 'Cero tolerancia en agua clorada distribuida' },
            { microorganism: 'Recuento en Placa Heterótrofa a 35°C', unit: 'UFC/mL', n: 1, c: 0, m: 100, M: 500, interpretation: 'Flora bacteriana oportunista' },
            { microorganism: 'Cloro Residual Libre (Físicoquímico)', unit: 'mg/L (ppm)', n: 1, c: 0, m: 0.3, M: 0.6, interpretation: 'Rango reglamentario de potabilidad' }
        ]
    },
    {
        id: 'agua_envasada',
        category: 'Aguas y Hielos',
        commodity: 'Agua envasada purificada o manantial',
        normative: 'RTCA 13.01.25:05 / FDA 21 CFR 165',
        parameters: [
            { microorganism: 'Coliformes Totales', unit: 'UFC/100 mL', n: 5, c: 0, m: 0, M: 0, interpretation: 'Eficacia de filtración y ósmosis' },
            { microorganism: 'Escherichia coli', unit: 'UFC/100 mL', n: 5, c: 0, m: 0, M: 0, interpretation: 'Ausencia absoluta' },
            { microorganism: 'Pseudomonas aeruginosa', unit: 'Ausencia en 250 mL', n: 5, c: 0, m: 0, M: 0, interpretation: 'Biofilm y patógeno oportunista' }
        ]
    },
    {
        id: 'hielo_consumo',
        category: 'Aguas y Hielos',
        commodity: 'Hielo para consumo humano en cubos o cilindros',
        normative: 'Decreto Ejecutivo 38924-S / RTCA',
        parameters: [
            { microorganism: 'Coliformes Totales', unit: 'NMP/100 mL o UFC/100 mL', n: 5, c: 0, m: 0, M: 0, interpretation: 'Inocuidad del agua de congelación' },
            { microorganism: 'Escherichia coli', unit: 'NMP/100 mL', n: 5, c: 0, m: 0, M: 0, interpretation: 'Ausencia absoluta' },
            { microorganism: 'Recuento Total en Placa', unit: 'UFC/mL', n: 5, c: 1, m: 100, M: 500, interpretation: 'Higiene del embolsado y fábrica' }
        ]
    },

    // ── 5. SUPERFICIES VIVAS E INERTES (BPM / INOCUIDAD) ──
    {
        id: 'sup_manos_manipulador',
        category: 'Higiene & Superficies',
        commodity: 'Frotis de manos de manipuladores de alimentos',
        normative: 'Guía Técnica de Buenas Prácticas de Manufactura Microlabs / MINSA',
        parameters: [
            { microorganism: 'Recuento de Aerobios Mesófilos', unit: 'UFC/mano', n: 1, c: 0, m: 100, M: 500, interpretation: 'Eficacia del protocolo de lavado y desinfección' },
            { microorganism: 'Coliformes Totales', unit: 'UFC/mano', n: 1, c: 0, m: 0, M: 10, interpretation: 'Indicador higiénico' },
            { microorganism: 'Staphylococcus aureus', unit: 'UFC/mano', n: 1, c: 0, m: 0, M: 0, interpretation: 'Portador asintomático nasofaríngeo o cutáneo' }
        ]
    },
    {
        id: 'sup_inerte_contacto',
        category: 'Higiene & Superficies',
        commodity: 'Superficie inerte en contacto con alimentos (Tablas, Cuchillos, Mesas)',
        normative: 'Criterio Microbiológico de Superficies APHA / ICMSF',
        parameters: [
            { microorganism: 'Recuento de Aerobios Mesófilos', unit: 'UFC/100 cm²', n: 1, c: 0, m: 50, M: 250, interpretation: 'Aceptable < 50 UFC/100cm² | Insatisfactorio > 250' },
            { microorganism: 'Coliformes Totales', unit: 'UFC/100 cm²', n: 1, c: 0, m: 0, M: 10, interpretation: 'Tolerancia máxima 10 UFC/100cm²' },
            { microorganism: 'Listeria spp. / Salmonella spp.', unit: 'Ausencia en superficie muestreada', n: 1, c: 0, m: 0, M: 0, interpretation: 'Zona crítica de contacto' }
        ]
    },
    {
        id: 'sup_atp_luminometria',
        category: 'Higiene & Superficies',
        commodity: 'Luminometría ATP de Superficies (3M Clean-Trace)',
        normative: 'Guía Operativa 3M Food Safety / Microlabs',
        parameters: [
            { microorganism: 'ATP Superficie Limpia (Zona A)', unit: 'RLU', n: 1, c: 0, m: 0, M: 150, interpretation: 'PASA: < 150 RLU | PRECAUCIÓN: 151-300 RLU | FALLA: > 300 RLU' },
            { microorganism: 'ATP Agua de Enjuague CIP (Clean-Trace Water)', unit: 'RLU', n: 1, c: 0, m: 0, M: 50, interpretation: 'PASA: < 50 RLU | FALLA: > 50 RLU (Residuo biológico presente)' }
        ]
    },

    // ── 6. AMBIENTES Y AIRE ──
    {
        id: 'amb_aire_sedimentacion',
        category: 'Monitoreo Ambiental',
        commodity: 'Aire ambiental por sedimentación pasiva (Placa expuesta 15-30 min)',
        normative: 'Criterio de Monitoreo Ambiental USP <1116> / OMS',
        parameters: [
            { microorganism: 'Recuento de Bacterias Mesófilas', unit: 'UFC/placa/15 min', n: 1, c: 0, m: 15, M: 30, interpretation: 'Área Limpia / Empaque' },
            { microorganism: 'Recuento de Mohos y Levaduras', unit: 'UFC/placa/15 min', n: 1, c: 0, m: 5, M: 15, interpretation: 'Dispersión fúngica aérea' }
        ]
    }
];

/**
 * Busca un estándar normativo oficial por nombre de matriz o palabra clave
 */
export const findStandardByCommodity = (searchTerm) => {
    if (!searchTerm) return null;
    const term = searchTerm.toLowerCase().trim();
    return MICROBIOLOGY_STANDARDS.find(std => 
        std.commodity.toLowerCase().includes(term) || 
        std.category.toLowerCase().includes(term) ||
        std.id.toLowerCase().includes(term)
    ) || null;
};
