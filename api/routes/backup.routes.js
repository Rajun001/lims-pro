import { Router } from 'express';
import { createDatabaseBackup } from '../utils/backup.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use('/backup', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'));

/**
 * GET /api/backup - Estado o metadatos de respaldo (Restringido)
 */
router.get('/backup', (req, res) => {
  res.json({ status: 'ok', message: 'Servicio de respaldos activo y protegido.' });
});

/**
 * POST /api/backup - Dispara un respaldo manual inmediato de la base de datos (Restringido)
 */
router.post('/backup', async (req, res) => {
  try {
    const reason = req.body?.reason || 'MANUAL_REQUEST';
    const result = await createDatabaseBackup(reason);
    if (result.success) {
      return res.status(200).json({
        message: 'Respaldo de base de datos generado exitosamente.',
        ...result
      });
    }
    return res.status(500).json({
      error: 'No se pudo generar el respaldo.',
      details: result.error
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
