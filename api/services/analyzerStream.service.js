import prisma from '../config/db.js';
import { ClinicalRulesService } from './clinicalRules.service.js';

/**
 * Servicio de Procesamiento de Datastreams de Autoanalizadores
 * Compatible con HL7 v2.x (ORU^R01) y ASTM E1381/E1394
 */
export class AnalyzerStreamService {
  /**
   * Parsea un mensaje de texto HL7 v2.x (ORU^R01)
   */
  static parseHL7Message(hl7Text) {
    const lines = hl7Text.split(/\r?\n|\r/);
    const resultObj = {
      messageType: 'HL7_ORU_R01',
      patientId: null,
      sampleBarcode: null,
      observations: []
    };

    for (const line of lines) {
      const fields = line.split('|');
      const segmentType = fields[0];

      if (segmentType === 'PID') {
        // PID-3: Patient ID
        resultObj.patientId = fields[3] || fields[2];
      } else if (segmentType === 'OBR') {
        // OBR-2 o OBR-3: Sample Barcode / Specimen ID
        resultObj.sampleBarcode = fields[2] || fields[3];
      } else if (segmentType === 'OBX') {
        // OBX-3: Test Identifier (e.g. ^CORTISOL^Cortisol AM)
        // OBX-5: Test Value
        // OBX-6: Units
        const testIdentifier = fields[3] ? fields[3].split('^')[1] || fields[3] : 'UNKNOWN';
        const rawValue = parseFloat(fields[5]);
        const unit = fields[6] || '';
        const flags = fields[8] || '';

        resultObj.observations.push({
          testCode: testIdentifier,
          testName: fields[3] ? fields[3].split('^')[2] || testIdentifier : testIdentifier,
          rawValue: isNaN(rawValue) ? null : rawValue,
          unit,
          flags
        });
      }
    }

    return resultObj;
  }

  /**
   * Ingesta y procesa un datastream recibido de un equipo (ej. Roche Cobas, Mindray, Sysmex)
   */
  static async ingestStream({ deviceId, rawMessage, format = 'HL7' }) {
    try {
      const parsed = format === 'HL7' ? this.parseHL7Message(rawMessage) : JSON.parse(rawMessage);

      // Guardar log del mensaje de streaming en la base de datos
      const streamRecord = await prisma.hL7StreamMessage.create({
        data: {
          deviceId,
          messageType: parsed.messageType,
          rawData: rawMessage,
          parsedJson: JSON.stringify(parsed),
          status: 'PROCESSED'
        }
      });

      // Si existe un código de barras de muestra, asociar automáticamente los resultados
      if (parsed.sampleBarcode) {
        const sample = await prisma.clinicalSample.findUnique({
          where: { barcode: parsed.sampleBarcode },
          include: { patient: true, orders: { include: { tests: true } } }
        });

        if (sample && sample.orders.length > 0) {
          const activeOrder = sample.orders[0];

          for (const obs of parsed.observations) {
            // Buscar si la orden contiene esta prueba
            const existingTest = activeOrder.tests.find(t => t.testCode === obs.testCode);
            if (existingTest) {
              // Calcular factor de dilución
              const calculatedResult = ClinicalRulesService.applyDilutionFactor(
                obs.rawValue,
                existingTest.dilutionFactor
              );

              // Evaluar motor de reglas
              const ruleEval = await ClinicalRulesService.evaluateRules({
                testCode: obs.testCode,
                val: calculatedResult,
                gender: sample.patient?.gender,
                collectionTime: sample.collectionTime,
                fastingStatus: sample.fastingStatus
              });

              // Actualizar la prueba clínica
              await prisma.clinicalTest.update({
                where: { id: existingTest.id },
                data: {
                  rawResult: obs.rawValue,
                  calculatedResult,
                  unit: obs.unit || existingTest.unit,
                  appliedReferenceRange: ruleEval.appliedRange,
                  flag: ruleEval.flag,
                  status: 'ANALYZED'
                }
              });
            }
          }
        }
      }

      return { success: true, streamId: streamRecord.id, parsed };
    } catch (err) {
      console.error('💥 Error procesando stream de autoanalizador:', err.message);
      await prisma.hL7StreamMessage.create({
        data: {
          deviceId,
          messageType: 'UNKNOWN',
          rawData: rawMessage,
          status: 'ERROR',
          errorMessage: err.message
        }
      });
      throw err;
    }
  }
}
