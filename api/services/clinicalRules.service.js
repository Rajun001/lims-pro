import prisma from '../config/db.js';

/**
 * Motor de Reglas Clínicas y Calculadora de Factores de Dilución
 * Cumple con validación de rangos biológicos dependientes de edad, sexo,
 * hora de extracción (ej. cortisol matutino) y ayuno.
 */
export class ClinicalRulesService {
  /**
   * Aplica un factor de dilución transparente a un valor bruto del autoanalizador
   * @param {number} rawResult - Valor bruto medido por el autoanalizador (ej. 15.2 mg/L)
   * @param {number} dilutionFactor - Factor multiplicador (ej. 10.0 para dilución 1/10)
   * @returns {number} calculatedResult - Valor final corregido sin alterar rawResult en BD
   */
  static applyDilutionFactor(rawResult, dilutionFactor = 1.0) {
    if (rawResult === null || rawResult === undefined || isNaN(rawResult)) return null;
    const factor = Number(dilutionFactor) > 0 ? Number(dilutionFactor) : 1.0;
    return Number((rawResult * factor).toFixed(3));
  }

  /**
   * Evalúa las reglas biológicas aplicables a un análisis clínico
   * @param {Object} params
   * @param {string} params.testCode - Código del análisis (ej. "CORTISOL", "GLU")
   * @param {number} params.val - Valor calculado a evaluar
   * @param {string} params.gender - Sexo del paciente ("M", "F")
   * @param {number} params.ageYears - Edad del paciente en años
   * @param {Date} params.collectionTime - Fecha/hora de toma de muestra
   * @param {boolean} params.fastingStatus - Estado de ayuno
   */
  static async evaluateRules({ testCode, val, gender, ageYears, collectionTime, fastingStatus }) {
    if (val === null || val === undefined) {
      return { flag: 'PENDING', appliedRange: 'No evaluado', ruleDescription: 'Sin resultado' };
    }

    // Extraer hora de toma de muestra en formato HH:MM (para ritmos circadianos como cortisol)
    const timeStr = collectionTime ? new Date(collectionTime).toTimeString().substring(0, 5) : null;

    // Buscar regla más específica en la BD
    const rules = await prisma.clinicalRule.findMany({
      where: {
        testCode,
        isActive: true
      }
    });

    // Filtrar la regla biológica correspondiente según los criterios
    let matchedRule = rules.find(r => {
      // 1. Filtrar sexo si está definido en la regla
      if (r.gender && r.gender !== gender) return false;
      // 2. Filtrar rango de edad
      if (ageYears !== undefined) {
        if (r.ageMinYears !== null && ageYears < r.ageMinYears) return false;
        if (r.ageMaxYears !== null && ageYears > r.ageMaxYears) return false;
      }
      // 3. Filtrar ventana horaria (ej. Cortisol matutino 06:00 - 10:00)
      if (r.timeStart && r.timeEnd && timeStr) {
        if (timeStr < r.timeStart || timeStr > r.timeEnd) return false;
      }
      // 4. Requisito de ayuno
      if (r.fastingRequired !== null && r.fastingRequired !== undefined) {
        if (r.fastingRequired !== fastingStatus) return false;
      }
      return true;
    });

    // Fallback a regla general si no hubo coincidencia estricta
    if (!matchedRule && rules.length > 0) {
      matchedRule = rules[0];
    }

    if (!matchedRule) {
      // Regla por defecto si no existen en la base de datos
      return {
        flag: 'NORMAL',
        appliedRange: 'Rango genérico (0.00 - 100.00)',
        ruleDescription: 'Sin regla de referencia específica configurada'
      };
    }

    // Clasificación del valor según los límites min, max y críticos
    let flag = 'NORMAL';
    if (matchedRule.criticalMin !== null && val < matchedRule.criticalMin) {
      flag = 'CRITICAL_LOW';
    } else if (matchedRule.criticalMax !== null && val > matchedRule.criticalMax) {
      flag = 'CRITICAL_HIGH';
    } else if (val < matchedRule.minRange) {
      flag = 'LOW';
    } else if (val > matchedRule.maxRange) {
      flag = 'HIGH';
    }

    const rangeString = `${matchedRule.minRange} - ${matchedRule.maxRange} ${matchedRule.unit}`;

    return {
      flag,
      appliedRange: rangeString,
      ruleDescription: matchedRule.description,
      minRange: matchedRule.minRange,
      maxRange: matchedRule.maxRange,
      unit: matchedRule.unit
    };
  }
}
