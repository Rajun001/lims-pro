import { Router } from 'express';
import { getWorkcards, updateWorkcard } from '../controllers/workcards.controller.js';

const router = Router();

router.get('/workcards', getWorkcards);
router.put('/workcards/:id', updateWorkcard);

export default router;
