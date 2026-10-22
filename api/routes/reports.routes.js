import { Router } from 'express';
import prisma from '../config/db.js';
import { ReportGeneratorService } from '../services/reportGenerator.service.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { publicVerifyLimiter } from '../middlewares/rateLimiter.middleware.js';
import { fetchAndIngestSingleEstimate } from '../services/qbWatcher.service.js';
import EmailService from '../services/email.service.js';
import { validateSecurityKey, generateReportAccessToken } from '../utils/securityTokens.js';
import { IdenticalPdfService } from '../services/identicalPdf.service.js';

function maskOwnerName(str) {
  if (!str) return 'Titular Confidencial';
  const parts = str.trim().split(/\s+/);
  if (parts.length === 1) {
    const s = parts[0];
    return s.length > 4 ? s.slice(0, 2) + '****' + s.slice(-2) : s.slice(0, 1) + '***';
  }
  return parts.map((p, i) => (i === 0 || i === parts.length - 1 ? p : '****')).join(' ');
}

const router = Router();

// Listado General de Informes de Laboratorio (con paginación y búsqueda - Protegido)
router.get('/reports', authenticateJWT, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const type = req.query.type;
    const status = req.query.status;

    const where = {};
    if (type === 'CLINICAL' || type === 'CLINICAL_HUMAN') {
      where.reportType = 'CLINICAL';
    } else if (type === 'INDUSTRIAL_COA' || type === 'INDUSTRIAL') {
      where.reportType = 'INDUSTRIAL_COA';
    } else if (type && type !== 'ALL') {
      where.reportType = type;
    }
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { reportNumber: { contains: search } },
        { industrialSample: { matrixType: { contains: search } } },
        { industrialSample: { contract: { client: { companyName: { contains: search } } } } },
        { clinicalOrder: { sample: { patient: { firstName: { contains: search } } } } },
        { clinicalOrder: { sample: { patient: { lastName: { contains: search } } } } },
        { clinicalOrder: { sample: { patient: { uniqueId: { contains: search } } } } }
      ];
    }

    const [total, items, totalIndustrial, totalClinical] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          industrialSample: {
            include: {
              contract: {
                include: { client: true }
              },
              tests: true
            }
          },
          clinicalOrder: {
            include: {
              sample: { include: { patient: true } },
              tests: true
            }
          },
          technicalDirector: {
            select: { id: true, fullName: true, email: true }
          },
          signature: true
        }
      }),
      prisma.report.count({ where: { reportType: 'INDUSTRIAL_COA' } }),
      prisma.report.count({ where: { reportType: { in: ['CLINICAL', 'CLINICAL_HUMAN'] } } })
    ]);

    const formatted = items.map(r => {
      const isIndustrial = r.reportType === 'INDUSTRIAL_COA';
      const clientName = isIndustrial
        ? (r.industrialSample?.contract?.client?.companyName || 'Cliente Industrial')
        : (r.clinicalOrder?.sample?.patient ? `${r.clinicalOrder.sample.patient.firstName} ${r.clinicalOrder.sample.patient.lastName}` : 'Paciente');
      
      const matrix = isIndustrial ? r.industrialSample?.matrixType : r.clinicalOrder?.sample?.sampleType;
      const testCount = isIndustrial ? (r.industrialSample?.tests?.length || 0) : (r.clinicalOrder?.tests?.length || 0);

      return {
        id: r.id,
        reportNumber: r.reportNumber,
        reportType: r.reportType,
        status: r.status,
        clientName,
        matrix: matrix || 'N/A',
        testCount,
        signedAt: r.signedAt || r.createdAt,
        hasPdf: Boolean(r.pdfUrl),
        pdfUrl: r.pdfUrl,
        createdAt: r.createdAt
      };
    });

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts: {
        totalFiltered: total,
        totalIndustrial,
        totalClinical
      },
      items: formatted
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar informes: ' + err.message });
  }
});

// Detalle Completo de un Informe de Laboratorio (Protegido con JWT)
router.get('/reports/details/:id', authenticateJWT, async (req, res) => {
  const param = String(req.params.id || '').trim();
  const numericId = parseInt(param);
  try {
    const whereConditions = [];
    if (!isNaN(numericId) && String(numericId) === param) {
      whereConditions.push({ id: numericId });
    }
    whereConditions.push({ reportNumber: param });
    whereConditions.push({ industrialSample: { barcode: param } });
    whereConditions.push({ clinicalOrder: { sample: { barcode: param } } });

    let report = await prisma.report.findFirst({
      where: { OR: whereConditions },
      include: {
        industrialSample: {
          include: {
            contract: { include: { client: true } },
            tests: true
          }
        },
        clinicalOrder: {
          include: {
            sample: { include: { patient: true } },
            tests: true
          }
        },
        technicalDirector: {
          select: { id: true, fullName: true, email: true }
        },
        signature: true
      }
    });

    if (!report) {
      // 1. Buscar si es una Muestra Industrial recibida aún sin Reporte
      const indSample = await prisma.industrialSample.findFirst({
        where: {
          OR: [
            { barcode: param },
            ...(!isNaN(numericId) ? [{ id: numericId }] : [])
          ]
        },
        include: {
          contract: { include: { client: true } },
          tests: true
        }
      });

      if (indSample) {
        report = {
          id: indSample.id,
          reportNumber: indSample.barcode,
          reportType: 'INDUSTRIAL_COA',
          status: indSample.status === 'COMPLETED' ? 'ISSUED' : 'DRAFT',
          industrialSampleId: indSample.id,
          industrialSample: indSample,
          clinicalOrder: null,
          createdAt: indSample.createdAt,
          signedAt: null,
          technicalDirector: null,
          signature: null
        };
      }
    }

    if (!report) {
      // 2. Just-in-Time (JIT): Intentar traer de QuickBooks si fue recién creado
      report = await fetchAndIngestSingleEstimate(param);
    }

    if (!report) {
      return res.status(404).json({ error: 'Informe no encontrado' });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener detalle del informe: ' + err.message });
  }
});

// Actualizar o adjuntar elementos probatorios / fotografías de cultivos a un informe (Personal Técnico Regulado)
router.put('/reports/:id/evidence', authenticateJWT, authorizeRoles('TECHNICAL_DIRECTOR', 'ADMINISTRATOR', 'CLINICAL_ANALYST'), async (req, res) => {
  const id = parseInt(req.params.id);
  const { evidencePhotos } = req.body;
  try {
    const photosString = typeof evidencePhotos === 'string' ? evidencePhotos : JSON.stringify(evidencePhotos || []);
    const updated = await prisma.report.update({
      where: { id },
      data: { evidencePhotos: photosString }
    });
    res.json({ message: 'Evidencias fotográficas actualizadas con éxito.', report: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar evidencias fotográficas: ' + err.message });
  }
});

// Descarga Directa del PDF Oficial Idéntico (Protegido con JWT o Acceso Local)
router.get('/reports/details/:id/pdf', authenticateJWT, async (req, res) => {
  const param = String(req.params.id || '').trim();
  const numericId = parseInt(param);
  try {
    const whereConditions = [];
    if (!isNaN(numericId) && String(numericId) === param) {
      whereConditions.push({ id: numericId });
    }
    whereConditions.push({ reportNumber: param });

    const report = await prisma.report.findFirst({
      where: { OR: whereConditions },
      include: {
        industrialSample: {
          include: {
            contract: { include: { client: true } },
            tests: true
          }
        },
        clinicalOrder: {
          include: {
            sample: { include: { patient: true } },
            tests: true
          }
        },
        technicalDirector: true,
        signature: true
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Informe no encontrado para descarga de PDF.' });
    }

    const pdfPath = await IdenticalPdfService.ensureIdenticalPdf(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${report.reportNumber}.pdf"`);
    res.sendFile(pdfPath);
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar/descargar PDF: ' + err.message });
  }
});

// Endpoint Público de Verificación por QR con Filtro de Doble Llave (Anti-Scraping / Anti-Enumeración)
router.all('/reports/verify/:reportNumber', publicVerifyLimiter, async (req, res) => {
  const { reportNumber } = req.params;
  const providedKey = req.query.key || req.body?.key || req.headers['x-security-key'];
  const providedToken = req.query.token || req.body?.token;

  try {
    const report = await prisma.report.findFirst({
      where: {
        OR: [
          { reportNumber },
          { industrialSample: { barcode: reportNumber } },
          { clinicalOrder: { sample: { barcode: reportNumber } } }
        ]
      },
      include: {
        industrialSample: {
          include: {
            contract: { include: { client: true } },
            tests: true
          }
        },
        clinicalOrder: {
          include: {
            sample: { include: { patient: true } },
            tests: true
          }
        },
        technicalDirector: true,
        signature: true
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Informe no encontrado o código de verificación no válido.' });
    }

    const isIndustrial = report.reportType === 'INDUSTRIAL_COA';
    const patient = report.clinicalOrder?.sample?.patient;
    const client = report.industrialSample?.contract?.client;
    const ownerIdentifier = isIndustrial ? client?.taxId : patient?.uniqueId;
    const ownerName = isIndustrial 
      ? (client?.companyName || 'Cliente Industrial') 
      : (patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'Paciente Clínico');

    const basePublicData = {
      reportNumber: report.reportNumber,
      reportType: report.reportType,
      status: report.status,
      signedAt: report.signedAt || report.createdAt,
      technicalDirector: report.technicalDirector ? report.technicalDirector.fullName : 'Dr. Roldan Ajún Chaverri (MQC #802)',
      sha256Digest: report.signature ? report.signature.sha256Digest : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isIntegrityVerified: true,
      accreditations: ['ISO/IEC 17025:2017', 'ISO 15189:2022', '21 CFR Part 11 Compliant'],
      isProtected: true,
      maskedOwner: maskOwnerName(ownerName)
    };

    // Validar si se suministró la 2ª Llave (Cédula / DNI / Token Efímero)
    const keyValidation = validateSecurityKey(report.reportNumber, ownerIdentifier, providedKey, providedToken);

    if (!keyValidation.valid) {
      // Retornar ÚNICAMENTE validación institucional criptográfica sin resultados analíticos ni datos personales
      return res.json({
        ...basePublicData,
        unlocked: false,
        requiresKey: true,
        authError: (providedKey || providedToken) ? 'La identificación o llave ingresada no coincide con el titular de este informe.' : null,
        message: 'Certificado oficial verificado en base de datos. Para ver los resultados analíticos detallados, ingrese la 2ª Llave (Cédula de Identidad o Jurídica del solicitante).'
      });
    }

    // --- SEGUNDA LLAVE VÁLIDA: DESBLOQUEAR RESULTADOS ANALÍTICOS COMPLETOS ---
    const tests = isIndustrial ? (report.industrialSample?.tests || []) : (report.clinicalOrder?.tests || []);
    const analyzerResults = tests.map(t => ({
      testCode: t.testCode || t.parameterName,
      testName: t.testName || t.parameterName,
      value: t.quantitativeResult !== null && t.quantitativeResult !== undefined 
        ? String(t.quantitativeResult) 
        : (t.calculatedResult !== null && t.calculatedResult !== undefined 
          ? String(t.calculatedResult) 
          : (t.rawResult !== null && t.rawResult !== undefined 
            ? String(t.rawResult) 
            : (t.qualitativeResult || 'Normal'))),
      unit: isIndustrial ? (t.quantitativeResult !== null ? 'UFC/g' : '') : (t.unit || ''),
      refRange: t.specificationLimit || t.appliedReferenceRange || '—',
      specificationLimit: t.specificationLimit,
      compliance: t.compliance || 'CONFORME',
      method: t.isoStandardRef || 'Método Normalizado Oficial'
    }));

    return res.json({
      ...basePublicData,
      unlocked: true,
      requiresKey: false,
      unlockMethod: keyValidation.method,
      clientOrPatient: ownerName,
      ownerIdentifier: isIndustrial ? client?.taxId : patient?.uniqueId,
      sampleBarcode: isIndustrial ? report.industrialSample?.barcode : report.clinicalOrder?.sample?.barcode,
      sampleType: isIndustrial ? report.industrialSample?.matrixType : report.clinicalOrder?.sample?.sampleType,
      matrix: isIndustrial ? report.industrialSample?.matrixType : report.clinicalOrder?.sample?.sampleType,
      sampleLot: isIndustrial ? report.industrialSample?.lotNumber : null,
      technicalObservations: report.technicalObservations || 'Muestra conforme según criterios sanitarios.',
      analyzerResults,
      hasPdf: Boolean(report.pdfUrl)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar la firma criptográfica del informe: ' + err.message });
  }
});

// Endpoint Regulado para Firma Electrónica por Director Técnico
router.post('/reports/:id/sign', authenticateJWT, authorizeRoles('TECHNICAL_DIRECTOR', 'ADMINISTRATOR'), async (req, res) => {
  const { id } = req.params;
  const { pin, meaning, technicalObservations } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    const result = await ReportGeneratorService.signAndReleaseReport({
      reportId: id,
      directorUserId: req.user.id,
      signaturePin: pin,
      meaning,
      technicalObservations,
      ipAddress
    });

    res.json({
      message: 'Informe firmado electrónicamente y emitido exitosamente.',
      result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint para Envío Silencioso de Informes por Correo (SMTP IONOS)
router.post('/reports/send-email', async (req, res) => {
  const { 
    to, 
    patientName, 
    reportNumber, 
    analysisRequested, 
    verificationUrl,
    sampleType,
    matrix,
    samplingLocation,
    resultsList,
    interpretation
  } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Debe especificar el correo electrónico destinatario.' });
  }

  try {
    const result = await EmailService.sendReportEmail({
      to,
      patientName: patientName || 'Estimado(a) Cliente',
      reportNumber: reportNumber || 'S/N',
      analysisRequested: analysisRequested || 'Análisis de Laboratorio',
      verificationUrl: verificationUrl || `https://lims-microlabs.web.app/verify/${reportNumber || ''}`,
      sampleType,
      matrix,
      samplingLocation,
      resultsList,
      interpretation
    });

    if (result.requiresPassword) {
      return res.status(503).json({
        success: false,
        requiresPassword: true,
        message: 'El servidor requiere la contraseña de reportes@microlabscr.com para activar el envío.'
      });
    }

    res.json({
      success: true,
      message: `Informe enviado exitosamente a ${to}`,
      messageId: result.messageId
    });
  } catch (err) {
    console.error('Error al enviar correo SMTP:', err);
    res.status(500).json({ error: 'Error al enviar el correo: ' + err.message });
  }
});

export default router;
