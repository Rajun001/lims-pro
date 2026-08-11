import { Router } from 'express';
import { getInventory, saveInventory, deleteInventory } from '../controllers/inventory.controller.js';

const router = Router();

router.get('/inventory', getInventory);
router.post('/inventory', saveInventory);
router.delete('/inventory/:id', deleteInventory);

export default router;
