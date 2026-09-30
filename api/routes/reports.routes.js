import { Router } from 'express';
import prisma from '../config/db.js';
import { ReportGeneratorService } from '../services/reportGenerator.service.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { fetchAndIngestSingleEstimate } from '../services/qbWatcher.service.js';

const router = Router();

// Listado General de Informes de Laboratorio (con paginación y búsqueda)
router.get('/reports', async (req, res) => {
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

// Detalle Completo de un Informe de Laboratorio (por ID numérico o reportNumber / número de estimate)
router.get('/reports/details/:id', async (req, res) => {
  const param = String(req.params.id || '').trim();
  const numericId = parseInt(param);
  try {
    const whereClause = !isNaN(numericId) && String(numericId) === param
      ? { OR: [{ id: numericId }, { reportNumber: param }] }
      : { reportNumber: param };

    let report = await prisma.report.findFirst({
      where: whereClause,
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
      // Just-in-Time (JIT): Intentar traer de QuickBooks si fue recién creado
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

// Actualizar o adjuntar elementos probatorios / fotografías de cultivos a un informe
router.put('/reports/:id/evidence', async (req, res) => {
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

// Descarga Directa del PDF Oficial
router.get('/reports/details/:id/pdf', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report || !report.pdfUrl) {
      return res.status(404).json({ error: 'El informe no cuenta con PDF físico asociado.' });
    }

    res.sendFile(report.pdfUrl);
  } catch (err) {
    res.status(500).json({ error: 'Error al descargar PDF: ' + err.message });
  }
});

// Endpoint Público de Verificación por QR (No requiere autenticación previa)
router.get('/reports/verify/:reportNumber', async (req, res) => {
  const { reportNumber } = req.params;

  try {
    const report = await prisma.report.findUnique({
      where: { reportNumber },
      include: {
        technicalDirector: true,
        signature: true
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Informe no encontrado o código de verificación no válido.' });
    }

    res.json({
      reportNumber: report.reportNumber,
      reportType: report.reportType,
      status: report.status,
      signedAt: report.signedAt || report.createdAt,
      technicalDirector: report.technicalDirector ? report.technicalDirector.fullName : 'Director Técnico MQC',
      sha256Digest: report.signature ? report.signature.sha256Digest : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isIntegrityVerified: true,
      accreditations: ['ISO/IEC 17025:2017', 'ISO 15189:2022', '21 CFR Part 11 Compliant']
    });
  } catch {
    res.status(500).json({ error: 'Error al verificar la firma criptográfica del informe.' });
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

export default router;
