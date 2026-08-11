import { Router } from 'express';
import { ingestAnalyzerData } from '../controllers/analyzer.controller.js';

const router = Router();

router.post('/analyzer-ingest', ingestAnalyzerData);

export default router;
