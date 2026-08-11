import { Router } from 'express';
import { getCapas, saveCapa, deleteCapa } from '../controllers/capa.controller.js';

const router = Router();

router.get('/capa', getCapas);
router.post('/capa', saveCapa);
router.delete('/capa/:id', deleteCapa);

export default router;
