import { Router } from 'express';
import { getWorkcards, updateWorkcard } from '../controllers/workcards.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use('/workcards', authenticateJWT);

router.get('/workcards', getWorkcards);
router.put('/workcards/:id', updateWorkcard);

export default router;
