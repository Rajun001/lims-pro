import { Router } from 'express';
import { handleWhatsAppWebhook } from '../controllers/whatsappAiBotController.js';

const router = Router();

// Webhook endpoint para mensajes entrantes de WhatsApp AI Bot (Kora AI Equivalent)
router.post('/whatsapp-bot/webhook', handleWhatsAppWebhook);

export default router;
