import { Router } from 'express';
import { getCapas, saveCapa, deleteCapa } from '../controllers/capa.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use('/capa', authenticateJWT);

router.get('/capa', getCapas);
router.post('/capa', saveCapa);
router.delete('/capa/:id', deleteCapa);

export default router;
