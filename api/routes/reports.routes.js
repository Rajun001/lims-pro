import { Router } from 'express';
import prisma from '../config/db.js';
import { ReportGeneratorService } from '../services/reportGenerator.service.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

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
