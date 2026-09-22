/**
 * qbNormalizer.service.js
 * Motor de normalización y traducción semántica de reportes (QuickBooks / PDFs) hacia Microlabs LIMS.
 * Clasifica matrices: Aguas, Superficies (limpia/sucia), Manipuladores, Ambientes, Aire Comprimido, Alimentos.
 * Mapea metodologías: AOAC, SMEWW, ISO, APHA, Petrifilm, M1-M14.
 */

export class QbNormalizerService {
    /**
     * Determina el sector industrial y la matriz principal
     */
    static classifyMatrix(sampleNameRaw = '', groupNameRaw = '') {
        const text = `${sampleNameRaw} ${groupNameRaw}`.toUpperCase();

        // 1. Aguas y Hielo
        if (text.includes('HIELO')) {
            return { matrixType: 'Hielo', category: 'MICROBIOLOGICAL' };
        }
        if (text.includes('AGUA') || text.includes('PISCINA') || text.includes('POZO') || text.includes('CISTERNA')) {
            const isFlameada = text.includes('FLAMEAD') && !text.includes('NO FLAMEAD');
            const isNoFlameada = text.includes('NO FLAMEAD') || text.includes('SIN FLAME');
            let condition = null;
            if (isFlameada) condition = 'TUBERIA_FLAMEADA';
            else if (isNoFlameada) condition = 'TUBERIA_NO_FLAMEADA';

            return {
                matrixType: text.includes('PISCINA') ? 'Agua Recreacional' : 'Agua Potable',
                category: 'MICROBIOLOGICAL',
                condition
            };
        }

        // 2. Manipuladores / Manos
        if (text.includes('MANOS') || text.includes('MANIPULADOR') || text.includes('FROTIS DE MANOS')) {
            return { matrixType: 'Manipulador / Manos', category: 'MICROBIOLOGICAL', condition: 'MANIPULADOR' };
        }

        // 3. Superficies
        if (text.includes('SUPERFICIE') || text.includes('TABLA') || text.includes('CUCHILLO') || 
            text.includes('UTENSILIO') || text.includes('RIEL') || text.includes('BANDA') || text.includes('LINEA CALIENTE')) {
            
            const isLimpia = text.includes('LIMPI') || text.includes('DESINFECTAD') || text.includes('LAVAD') || text.includes('PRE-OPERACIONAL');
            const isSucia = text.includes('SUCI') || text.includes('EN USO') || text.includes('OPERACIONAL') || text.includes('POST-USO');
            
            let condition = 'SUPERFICIE_INERTE';
            if (isLimpia) condition = 'SUPERFICIE_LIMPIA';
            else if (isSucia) condition = 'SUPERFICIE_SUCIA';

            return { matrixType: 'Superficie Inerte', category: 'MICROBIOLOGICAL', condition };
        }

        // 4. Aire Comprimido
        if (text.includes('AIRE COMPRIMIDO') || text.includes('COMPRESOR') || text.includes('ISO 8573')) {
            return { matrixType: 'Aire Comprimido', category: 'AIR_QUALITY', condition: 'AIRE_COMPRIMIDO' };
        }

        // 5. Ambiente / Aire
        if (text.includes('AMBIENTE') || text.includes('IMPACTACION') || text.includes('SEDIMENTACION') || text.includes('PLACA EXPUESTA')) {
            return {
                matrixType: 'Ambiente Aéreo',
                category: 'MICROBIOLOGICAL',
                condition: text.includes('IMPACTACION') ? 'AMBIENTE_ACTIVO' : 'AMBIENTE_PASIVO'
            };
        }

        // 6. Alimentos y Materias Primas por defecto
        return { matrixType: 'Alimento Procesado', category: 'MICROBIOLOGICAL', condition: 'ALIMENTO' };
    }

    /**
     * Parsea resultados numéricos vs cualitativos
     */
    static parseResult(rawResult) {
        if (rawResult === null || rawResult === undefined) {
            return { numVal: null, textVal: null };
        }

        const str = String(rawResult).trim();
        // Si tiene formato < 4 o > 1000 o Negativo
        if (str.startsWith('<') || str.startsWith('>') || /negativo|positivo|ausencia|presencia/i.test(str)) {
            return { numVal: null, textVal: str };
        }

        // Si tiene espacios entre miles (ej. "1 300")
        const cleanNumber = str.replace(/\s+/g, '').replace(',', '.');
        const parsed = parseFloat(cleanNumber);

        if (!isNaN(parsed) && isFinite(parsed)) {
            return { numVal: parsed, textVal: str };
        }

        return { numVal: null, textVal: str };
    }

    /**
     * Limpia la unidad
     */
    static normalizeUnit(unitStr) {
        if (!unitStr) return null;
        let u = unitStr.trim();
        u = u.replace(/\^2/g, '²').replace(/\^3/g, '³');
        return u;
    }
}
