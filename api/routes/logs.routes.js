import { Router } from 'express';
import { registerSessionLog, getAccessLogs } from '../controllers/logs.controller.js';

const router = Router();

router.post('/logs/access', registerSessionLog);
router.get('/logs/access', getAccessLogs);

export default router;
