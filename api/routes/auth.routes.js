import { Router } from 'express';
import { login, registerUser } from '../controllers/auth.controller.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/auth/login', login);
router.post('/auth/register', authenticateJWT, authorizeRoles('ADMINISTRATOR'), registerUser);

export default router;
