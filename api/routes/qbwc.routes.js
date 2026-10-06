import { Router } from 'express';
import express from 'express';
import { handleQbwcSoap, getQwcFile, getQbSettings, saveQbSettings, getQbClients, clearQbClients } from '../controllers/qbwc.controller.js';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// SOAP Endpoint público para QuickBooks Web Connector (Autenticado internamente mediante protocolo SOAP)
router.post('/qbwc', express.text({ type: '*/*', limit: '10mb' }), handleQbwcSoap);

// Rutas de administración y configuración de QBWC (Restringidas)
router.get('/qbwc/qwc', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), getQwcFile);
router.get('/qbwc/settings', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), getQbSettings);
router.post('/qbwc/settings', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), saveQbSettings);
router.get('/qbwc/clients', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), getQbClients);
router.delete('/qbwc/clients', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR'), clearQbClients);

export default router;
