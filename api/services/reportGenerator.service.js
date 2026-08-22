import prisma from '../config/db.js';
import crypto from 'crypto';

/**
 * Servicio Generador Dinámico de Reportes y Certificados de Análisis (CoA)
 * Soporta plantillas diferenciadas para Química Clínica Humana vs Certificados Industriales
 */
export class ReportGeneratorService {
  /**
   * Genera el payload estructurado para un Reporte de Química Clínica Humana
   */
  static async buildClinicalReportData(clinicalOrderId) {
    const order = await prisma.clinicalOrder.findUnique({
      where: { id: Number(clinicalOrderId) },
      include: {
        sample: { include: { patient: true } },
        tests: { include: { verifiedBy: true } },
        reports: true
      }
    });

    if (!order) throw new Error(`Orden clínica #${clinicalOrderId} no encontrada.`);

    const reportNumber = `INF-CLI-${new Date().getFullYear()}-${String(order.id).padStart(5, '0')}`;

    return {
      templateType: 'HUMAN_CLINICAL',
      reportNumber,
      header: {
        title: 'INFORME DE RESULTADOS DE QUÍMICA CLÍNICA',
        isoAccreditation: 'ISO 15189:2022 - Laboratorio Clínico Acreditado',
        labName: 'MICROLABS LIMS - Área Analítica'
      },
      patient: {
        fullName: `${order.sample.patient.firstName} ${order.sample.patient.lastName}`,
        uniqueId: order.sample.patient.uniqueId || 'N/A',
        gender: order.sample.patient.gender,
        dob: order.sample.patient.dob
      },
      sample: {
        barcode: order.sample.barcode,
        sampleType: order.sample.sampleType,
        collectionTime: order.sample.collectionTime,
        fastingStatus: order.sample.fastingStatus ? 'Sí (Ayuno Completo)' : 'No'
      },
      results: order.tests.map(t => ({
        testCode: t.testCode,
        testName: t.testName,
        rawResult: t.rawResult,
        dilutionFactor: t.dilutionFactor,
        finalResult: t.calculatedResult,
        unit: t.unit,
        referenceRange: t.appliedReferenceRange,
        flag: t.flag,
        analyst: t.verifiedBy ? t.verifiedBy.fullName : 'Automatizado'
      }))
    };
  }

  /**
   * Genera el payload estructurado para un Certificado de Análisis (CoA) Industrial / Farmacéutico
   */
  static async buildIndustrialCoaData(industrialSampleId) {
    const sample = await prisma.industrialSample.findUnique({
      where: { id: Number(industrialSampleId) },
      include: {
        contract: { include: { client: true } },
        tests: true,
        reports: true
      }
    });

    if (!sample) throw new Error(`Muestra industrial #${industrialSampleId} no encontrada.`);

    const reportNumber = `COA-IND-${new Date().getFullYear()}-${String(sample.id).padStart(5, '0')}`;

    // Determinar dictamen global de conformidad
    const isAnyNonConforming = sample.tests.some(t => t.compliance === 'NO_CONFORME');
    const globalCompliance = isAnyNonConforming ? 'NO CONFORME' : 'CONFORME CON ESPECIFICACIONES';

    return {
      templateType: 'INDUSTRIAL_COA',
      reportNumber,
      header: {
        title: 'CERTIFICADO DE ANÁLISIS FISICOQUÍMICO Y MICROBIOLÓGICO',
        isoAccreditation: 'ISO/IEC 17025:2017 - Laboratorio de Ensayo Acreditado',
        labName: 'MICROLABS INDUSTRIAL & PHARMA'
      },
      client: {
        companyName: sample.contract.client.companyName,
        taxId: sample.contract.client.taxId,
        projectCode: sample.contract.projectCode,
        sector: sample.contract.client.industrySector
      },
      sample: {
        barcode: sample.barcode,
        matrixType: sample.matrixType,
        lotNumber: sample.lotNumber,
        samplingProtocol: sample.samplingProtocol,
        receptionTempC: sample.receptionTempC ? `${sample.receptionTempC} °C` : 'N/A',
        receivedAt: sample.receivedAt
      },
      globalCompliance,
      results: sample.tests.map(t => ({
        category: t.category,
        parameterName: t.parameterName,
        isoStandardRef: t.isoStandardRef || 'Método Interno Validado',
        resultValue: t.quantitativeResult !== null ? `${t.quantitativeResult} UFC/g` : t.qualitativeResult,
        specificationLimit: t.specificationLimit || 'N/A',
        compliance: t.compliance,
        microscopicObservations: t.microscopicObservation || 'Sin hallazgos'
      }))
    };
  }

  /**
   * Ejecuta la Firma Electrónica 21 CFR Part 11 de un Informe por el Director Técnico
   */
  static async signAndReleaseReport({ reportId, directorUserId, signaturePin, meaning = 'APROBACIÓN_Y_EMISION_FINAL_DE_INFORME', technicalObservations = '', ipAddress = '127.0.0.1' }) {
    // 1. Validar usuario Director Técnico
    const director = await prisma.user.findUnique({
      where: { id: Number(directorUserId) }
    });

    if (!director || (director.role !== 'TECHNICAL_DIRECTOR' && director.role !== 'ADMINISTRATOR')) {
      throw new Error('Permisos insuficientes: Solo un Director Técnico puede realizar la firma electrónica final.');
    }

    // 2. Validar PIN de firma de 2º factor
    if (director.signaturePin && director.signaturePin !== signaturePin) {
      throw new Error('PIN de firma electrónica no válido. Autenticación re-ingresada fallida.');
    }

    const report = await prisma.report.findUnique({ where: { id: Number(reportId) } });
    if (!report) throw new Error('Informe no encontrado.');

    // 3. Crear Digest Criptográfico SHA-256 de los contenidos firmados
    const payloadToHash = `${report.reportNumber}|${report.reportType}|${director.email}|${new Date().toISOString()}|${technicalObservations}`;
    const sha256Digest = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    // 4. Registrar Firma Electrónica
    const signature = await prisma.electronicSignature.create({
      data: {
        userId: director.id,
        userName: director.fullName,
        userRole: director.role,
        meaning,
        entityName: 'Report',
        entityId: String(report.id),
        sha256Digest,
        ipAddress
      }
    });

    // 5. Actualizar estado del Reporte a ISSUED
    const updatedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: 'ISSUED',
        technicalDirectorId: director.id,
        signatureId: signature.id,
        signedAt: new Date(),
        technicalObservations
      }
    });

    return { success: true, report: updatedReport, signature };
  }
}
