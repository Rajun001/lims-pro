import { Router } from 'express';
import { getInventory, saveInventory, deleteInventory } from '../controllers/inventory.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use('/inventory', authenticateJWT);

router.get('/inventory', getInventory);
router.post('/inventory', saveInventory);
router.delete('/inventory/:id', deleteInventory);

export default router;
