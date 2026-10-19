import { Router } from 'express';
import { 
  login, 
  registerUser, 
  publicRegister, 
  sendRegistrationOtp, 
  verifyRegistrationOtp,
  listStaffUsers,
  createStaffUser,
  toggleStaffUserActive,
  claimOrderWithPin,
  listCompanyDelegates,
  createCompanyDelegate,
  toggleCompanyDelegate,
  changePassword
} from '../controllers/auth.controller.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Rutas de autenticación pública (con rate limiting)
router.post('/auth/login', authLimiter, login);
router.post('/auth/change-password', authLimiter, changePassword);
router.post('/auth/public-register', authLimiter, publicRegister);
router.post('/auth/send-otp', authLimiter, sendRegistrationOtp);
router.post('/auth/verify-otp', authLimiter, verifyRegistrationOtp);
router.post('/auth/claim-order', authLimiter, claimOrderWithPin);

// Rutas B2B: Control de Equipos de Calidad y Delegados de Empresas Industriales
router.get('/auth/company-delegates', listCompanyDelegates);
router.post('/auth/company-delegates', createCompanyDelegate);
router.patch('/auth/company-delegates/:id/toggle', toggleCompanyDelegate);

// Rutas de administración interna de personal (ISO 17025 / ISO 15189)
// Exclusivo para administradores y directores técnicos autenticados
router.post('/auth/register', authenticateJWT, authorizeRoles('ADMINISTRATOR'), registerUser);
router.get('/auth/staff-users', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), listStaffUsers);
router.post('/auth/staff-users', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), createStaffUser);
router.patch('/auth/staff-users/:id/toggle', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), toggleStaffUserActive);

export default router;

