import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncQuickBooksEstimates, ingestEstimatesArray, getSyncStatus } from '../services/qbWatcher.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

/**
 * Trigger manual de sincronización desde QuickBooks Desktop (2024 a Hoy)
 */
router.post('/qb/sync-now', async (req, res) => {
    try {
        const maxReturned = req.body?.maxReturned ? parseInt(req.body.maxReturned, 10) : 500;
        const fromDate = req.body?.fromDate || '2024-01-01';
        const result = await syncQuickBooksEstimates(maxReturned, fromDate);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Ingesta directa de estimaciones desde JSON o archivo exportado (sin necesidad de PDFs)
 */
router.post('/qb/import-json', async (req, res) => {
    try {
        let estimates = req.body?.estimates;
        if (!estimates || !Array.isArray(estimates)) {
            const diskFile = path.resolve(__dirname, '../../scripts/qb_estimates_latest.json');
            if (fs.existsSync(diskFile)) {
                let raw = fs.readFileSync(diskFile, 'utf8').replace(/^\uFEFF/, '').trim();
                estimates = JSON.parse(raw);
            } else {
                return res.status(400).json({ error: 'No se recibieron datos ni se encontró qb_estimates_latest.json' });
            }
        }
        const result = await ingestEstimatesArray(estimates);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * Consulta de estado y estadísticas de sincronización
 */
router.get('/qb/sync-status', (req, res) => {
    try {
        const status = getSyncStatus();
        return res.json(status);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;

