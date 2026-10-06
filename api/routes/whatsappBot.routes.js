import { Router } from 'express';
import { handleWhatsAppWebhook } from '../controllers/whatsappAiBotController.js';
import { whatsappWebhookLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Webhook endpoint para mensajes entrantes de WhatsApp AI Bot (Protegido con Rate Limiting)
router.post('/whatsapp-bot/webhook', whatsappWebhookLimiter, handleWhatsAppWebhook);

export default router;
