import { Router } from 'express';
import { getEquipment, saveEquipment, deleteEquipment } from '../controllers/equipment.controller.js';

const router = Router();

router.get('/equipment', getEquipment);
router.post('/equipment', saveEquipment);
router.delete('/equipment/:id', deleteEquipment);

export default router;
