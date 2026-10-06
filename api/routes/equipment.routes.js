import { Router } from 'express';
import { getEquipment, saveEquipment, deleteEquipment } from '../controllers/equipment.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use('/equipment', authenticateJWT);

router.get('/equipment', getEquipment);
router.post('/equipment', saveEquipment);
router.delete('/equipment/:id', deleteEquipment);

export default router;
