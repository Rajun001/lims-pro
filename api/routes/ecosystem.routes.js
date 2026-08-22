import { Router } from 'express';
import { getEcosystemStatus, triggerNasBackup } from '../controllers/ecosystem.controller.js';

const router = Router();

// GET /api/ecosystem/status - Diagnóstico en tiempo real del ecosistema
router.get('/ecosystem/status', getEcosystemStatus);

// POST /api/ecosystem/backup-nas - Disparar respaldo manual y replicar al NAS
router.post('/ecosystem/backup-nas', triggerNasBackup);

export default router;
