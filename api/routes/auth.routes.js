import { Router } from 'express';
import { login, registerUser, publicRegister } from '../controllers/auth.controller.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/auth/login', authLimiter, login);
router.post('/auth/register', authenticateJWT, authorizeRoles('ADMINISTRATOR'), registerUser);
router.post('/auth/public-register', authLimiter, publicRegister);

export default router;
