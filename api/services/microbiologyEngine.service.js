import prisma from '../config/db.js';

/**
 * Motor de Microbiología Industrial y Farmacéutica
 * Soporta Estudios de Vida Útil (RTCA), Pruebas de Desafío USP <51>,
 * Eficacia de Desinfectantes (Prueba 5,5,5 y AOAC 960.09),
 * Esterilidad Comercial (USP <71> / FDA BAM Ch 21a) y Control Biológico de Esterilización (Bioindicadores).
 */
export class MicrobiologyEngineService {
  /**
   * Calculadora de Reducción Logarítmica para Challenge Test (USP <51>) y Desinfectantes
   * \[\Delta \log_{10} = \log_{10}(N_0) - \log_{10}(N_t)\]
   */
  static calculateLogReduction(N0, Nt) {
    if (!N0 || N0 <= 0 || Nt === null || Nt === undefined || Nt < 0) return null;
    if (Nt === 0) {
      Nt = 1; // Para evitar log10(0) indeterminación
    }
    const logN0 = Math.log10(N0);
    const logNt = Math.log10(Nt);
    const logRed = logN0 - logNt;
    return Number(Math.max(0, logRed).toFixed(2));
  }

  /**
   * Evaluación de Pruebas de Esterilidad Comercial (USP <71> / FDA BAM Capítulo 21a / ISO 22718)
   * Monitorea incubación de 14 días en dos medios clave:
   * 1. Tioglicolato de Sodio (FTM) a 30°C - 35°C (Bacterias Anaerobias y Aerobias)
   * 2. Caldo Casoy (TSB) a 20°C - 25°C (Hongos, Levaduras y Bacterias Aerobias)
   */
  static evaluateCommercialSterilityTest({ ftmGrowth = false, tsbGrowth = false, incubationDays = 14 }) {
    let compliance = 'PASS';
    let conclusion = `ESTERILIDAD COMERCIAL CONFORME. Ausencia total de crecimiento en medio FTM (30-35°C) y TSB (20-25°C) durante ${incubationDays} días.`;

    if (ftmGrowth || tsbGrowth) {
      compliance = 'FAIL';
      const detail = ftmGrowth && tsbGrowth
        ? 'en ambos medios FTM y TSB'
        : (ftmGrowth ? 'en medio Tioglicolato FTM (Bacterias)' : 'en medio Casoy TSB (Hongos/Levaduras)');
      conclusion = `NO CONFORME - CRECIMIENTO DETECTADO ${detail}. Producto no cumple con el estándar de Esterilidad Comercial.`;
    }

    return {
      ftmGrowth,
      tsbGrowth,
      incubationDays,
      compliance,
      conclusion
    };
  }

  /**
   * Evaluación de Indicadores Biológicos de Esterilización (Control Biológico)
   * Cepas bioindicadoras:
   * - Geobacillus stearothermophilus ATCC 7953 (Autoclave de Vapor / VHP)
   * - Bacillus atrophaeus ATCC 9372 (Calor Seco / Óxido de Etileno ETO)
   */
  static evaluateBiologicalIndicatorTest({ bioindicatorOrganism, growthDetected = false, readTimeHours = 24, sterilizationProcess = 'VAPOR_AUTOCLAVE' }) {
    let compliance = 'PASS';
    let conclusion = `CICLO DE ESTERILIZACIÓN EFICAZ Y VALIDADOS (Indicador Biológico ${bioindicatorOrganism} Negativo a Crecimiento / Cambio de Color a las ${readTimeHours} horas).`;

    if (growthDetected) {
      compliance = 'FAIL text-rose-400';
      conclusion = `FALLO DE ESTERILIZACIÓN: Se detectó crecimiento/viabilidad del Bioindicador (${bioindicatorOrganism}). El ciclo de esterilización fue ineficaz.`;
    }

    return {
      bioindicatorOrganism,
      sterilizationProcess,
      readTimeHours,
      growthDetected,
      compliance,
      conclusion
    };
  }

  /**
   * Evaluación de la Prueba de Desinfectantes 5,5,5 (Norma Europea EN 1276 / EN 1650 / EN 13697)
   */
  static evaluate555DisinfectantTest({ organismType, N0, Nt, contactTimeMinutes = 5, organicLoad = '0.3 g/L BSA' }) {
    const logReduction = this.calculateLogReduction(N0, Nt);
    const isBacteria = !organismType?.includes('Candida') && !organismType?.includes('Aspergillus');
    const requiredLogRed = isBacteria ? 5.0 : 4.0;

    let compliance = 'PASS';
    let conclusion = `Cumple con la Prueba 5,5,5 (EN 1276/1650). Reducción de ${logReduction} log en ${contactTimeMinutes} min.`;

    if (logReduction === null || logReduction < requiredLogRed) {
      compliance = 'FAIL';
      conclusion = `Fallo en Prueba 5,5,5: Reducción de ${logReduction || 0} log es menor a la exigencia de ${requiredLogRed} log.`;
    }

    return {
      logReduction,
      requiredLogRed,
      contactTimeMinutes,
      organicLoad,
      compliance,
      conclusion
    };
  }

  /**
   * Evaluación del Método AOAC Official Method 960.09 (Germicidal and Detergent Sanitizers Method)
   */
  static evaluateAOAC96009Test({ N0, Nt, contactTimeSeconds = 30, waterHardnessPpm = 200 }) {
    if (!N0 || N0 <= 0 || Nt === null || Nt === undefined) return null;

    const percentReduction = Number((((N0 - Nt) / N0) * 100).toFixed(5));
    const logReduction = this.calculateLogReduction(N0, Nt);

    let compliance = 'PASS';
    let conclusion = `Cumple con AOAC 960.09: Reducción del ${percentReduction}% (5 log) alcanzada en 30 segundos.`;

    if (percentReduction < 99.999) {
      compliance = 'FAIL';
      conclusion = `Fallo en AOAC 960.09: La reducción del ${percentReduction}% es menor al estándar mínimo exigido (99.999%).`;
    }

    return {
      percentReduction,
      logReduction,
      contactTimeSeconds,
      waterHardnessPpm,
      compliance,
      conclusion
    };
  }

  /**
   * Evalúa el cumplimiento de un Challenge Test según la normativa USP <51>
   */
  static evaluateUSP51Compliance({ organismType, N0, day7Count, day14Count, day28Count }) {
    const logRed7 = this.calculateLogReduction(N0, day7Count);
    const logRed14 = this.calculateLogReduction(N0, day14Count);
    const logRed28 = this.calculateLogReduction(N0, day28Count);

    let isBacteria = true;
    if (organismType?.includes('Candida') || organismType?.includes('Aspergillus') || organismType?.includes('yeast')) {
      isBacteria = false;
    }

    let complianceStatus = 'PASS';
    let conclusion = 'El sistema conservante cumple con los criterios de efectividad USP <51>.';

    if (isBacteria) {
      if (logRed14 !== null && logRed14 < 2.0) {
        complianceStatus = 'FAIL';
        conclusion = 'Fallo en Día 14: La reducción de bacterias fue menor a 2.0 log.';
      } else if (day28Count !== null && day14Count !== null && day28Count > day14Count * 1.5) {
        complianceStatus = 'FAIL';
        conclusion = 'Fallo en Día 28: Se observó incremento en la población bacteriana con respecto al día 14.';
      }
    } else {
      if (day7Count !== null && day7Count > N0 * 1.5) {
        complianceStatus = 'FAIL';
        conclusion = 'Fallo en Día 7: Incremento en recuento de hongos/levaduras respecto al inóculo inicial.';
      } else if (day14Count !== null && day14Count > N0 * 1.5) {
        complianceStatus = 'FAIL';
        conclusion = 'Fallo en Día 14: Incremento en recuento de hongos/levaduras.';
      } else if (day28Count !== null && day28Count > N0 * 1.5) {
        complianceStatus = 'FAIL';
        conclusion = 'Fallo en Día 28: Incremento en recuento de hongos/levaduras.';
      }
    }

    return {
      day7LogReduct: logRed7,
      day14LogReduct: logRed14,
      day28LogReduct: logRed28,
      complianceStatus,
      conclusion
    };
  }

  /**
   * Generador de Cronograma Automatizado para Estudios de Vida Útil (30, 60, 90, 180 días)
   */
  static async createShelfLifeStudyWorkflow({ contractId, productName, lotNumber, storageConditions, customDays = [0, 30, 60, 90, 180] }) {
    const startDate = new Date();

    const study = await prisma.shelfLifeStudy.create({
      data: {
        contractId,
        productName,
        lotNumber,
        storageConditions,
        startDate,
        timepointsDays: JSON.stringify(customDays),
        status: 'IN_PROGRESS'
      }
    });

    const timepointRecords = [];
    for (const day of customDays) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + day);

      const tp = await prisma.shelfLifeTimepoint.create({
        data: {
          studyId: study.id,
          targetDay: day,
          scheduledDate,
          status: day === 0 ? 'SAMPLING_DUE' : 'PENDING'
        }
      });
      timepointRecords.push(tp);
    }

    return { study, timepoints: timepointRecords };
  }

  /**
   * Clasifica la conformidad de ensayos microbiológicos según normativas ISO 7218 e ISO 6888
   */
  static evaluateISOFoodSafetyResult({ category, _parameterName, quantitativeResult, qualitativeResult, specificationLimit }) {
    let compliance = 'CONFORME';

    if (category === 'RAPID_KIT') {
      if (qualitativeResult === 'POSITIVO' || qualitativeResult === 'PRESENCIA/25g') {
        compliance = 'NO_CONFORME';
      }
    } else if (category === 'MICROBIOLOGICAL') {
      if (qualitativeResult && qualitativeResult.toUpperCase().includes('PRESENCIA')) {
        compliance = 'NO_CONFORME';
      }
      if (quantitativeResult !== null && quantitativeResult !== undefined && specificationLimit) {
        const match = specificationLimit.match(/\d+(\.\d+)?/);
        if (match) {
          const limitVal = parseFloat(match[0]);
          if (quantitativeResult > limitVal) {
            compliance = 'NO_CONFORME';
          }
        }
      }
    }

    return compliance;
  }
}
