import { Router } from 'express';
import { 
    getReminders, 
    runAutomatedReminderScanner, 
    dispatchReminder, 
    updateReminderStatus, 
    createCustomReminder 
} from '../services/reminderScheduler.service.js';

const router = Router();

/**
 * GET /api/reminders
 * Listado clasificado de recordatorios y agenda
 */
router.get('/reminders', async (req, res) => {
    try {
        const filters = {
            targetAudience: req.query.targetAudience || 'ALL',
            status: req.query.status || 'ALL',
            reminderType: req.query.reminderType || 'ALL',
            search: req.query.search || ''
        };
        const result = await getReminders(filters);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/reminders/scan
 * Ejecuta escaneo inmediato de alertas y pendientes en la base de datos
 */
router.post('/reminders/scan', async (req, res) => {
    try {
        const result = await runAutomatedReminderScanner();
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/reminders/:id/dispatch
 * Despacha un recordatorio (WhatsApp / Email / Sistema)
 */
router.post('/reminders/:id/dispatch', async (req, res) => {
    try {
        const { channel, userName } = req.body;
        const result = await dispatchReminder(req.params.id, { channel, userName });
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/reminders/:id/status
 * Actualiza estado (DISMISSED, SNOOZED, PENDING, SENT)
 */
router.patch('/reminders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'Estado no proporcionado' });
        const updated = await updateReminderStatus(req.params.id, status);
        return res.json(updated);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/reminders/custom
 * Crea un recordatorio personalizado
 */
router.post('/reminders/custom', async (req, res) => {
    try {
        const reminder = await createCustomReminder(req.body);
        return res.status(201).json(reminder);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
