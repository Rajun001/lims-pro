import { Router } from 'express';
import express from 'express';
import { handleQbwcSoap, getQwcFile, getQbSettings, saveQbSettings, getQbClients, clearQbClients } from '../controllers/qbwc.controller.js';

const router = Router();

router.post('/qbwc', express.text({ type: '*/*', limit: '10mb' }), handleQbwcSoap);
router.get('/qbwc/qwc', getQwcFile);
router.get('/qbwc/settings', getQbSettings);
router.post('/qbwc/settings', saveQbSettings);
router.get('/qbwc/clients', getQbClients);
router.delete('/qbwc/clients', clearQbClients);

export default router;
