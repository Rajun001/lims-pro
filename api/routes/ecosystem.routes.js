import { Router } from 'express';
import { getEcosystemStatus, triggerNasBackup } from '../controllers/ecosystem.controller.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/ecosystem/status - Diagnóstico en tiempo real del ecosistema (Personal Autenticado)
router.get('/ecosystem/status', authenticateJWT, getEcosystemStatus);

// POST /api/ecosystem/backup-nas - Disparar respaldo manual y replicar al NAS (Dirección y Administrador)
router.post('/ecosystem/backup-nas', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), triggerNasBackup);

export default router;
