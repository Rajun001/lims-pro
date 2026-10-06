import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import apiRouter from './routes/index.js';
import { auditLogger } from './middlewares/audit.middleware.js';
import { initAutomaticBackupScheduler } from './utils/backup.js';
import { startQuickBooksWatcher } from './services/qbWatcher.service.js';
import { startReminderScheduler } from './services/reminderScheduler.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Ocultar cabecera X-Powered-By para mitigar fingerprinting de atacantes
app.disable('x-powered-by');

// =============================================================================
// GLOBAL MIDDLEWARES & PERIMETER SECURITY
// =============================================================================

// 1. Cabeceras de seguridad reforzadas con Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Compatibilidad con Vite y recursos web externos
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
  xContentTypeOptions: true,
  xFrameOptions: { action: 'sameorigin' },
  xXssProtection: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hidePoweredBy: true
}));

// 2. Limitador general de peticiones (Rate Limiting de defensa perimetral)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 1000, // Máximo 1000 peticiones globales por IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP. Por favor intente de nuevo en 15 minutos.' }
});
app.use('/api/', limiter);

// Función auxiliar para verificar si un origen corresponde a una red autorizada
const isAllowedOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // Loopback local (desarrollo o servicios en el mismo equipo)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local')) {
      return true;
    }
    
    // Redes LAN privadas institucionales (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    if (hostname.startsWith('10.')) return true;
    if (hostname.startsWith('172.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
      }
    }
    if (hostname.startsWith('192.168.')) return true;
    
    // Dominios oficiales de Microlabs
    if (
      hostname === 'microlabscr.com' ||
      hostname.endsWith('.microlabscr.com') ||
      hostname === 'lims-microlabs.web.app' ||
      hostname === 'lims-microlabs.firebaseapp.com'
    ) {
      return true;
    }
    
    // Túneles remotos autorizados (Cloudflare Tunnel)
    if (hostname.endsWith('.trycloudflare.com')) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

// 3. Política de CORS restringida y validada
const allowedStaticOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.microlabscr.com',
  'https://microlabscr.com',
  'https://lims-microlabs.web.app',
  'https://lims-microlabs.firebaseapp.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (ej. curl local, scripts del servidor, web connector SOAP)
    if (!origin) return callback(null, true);
    if (allowedStaticOrigins.includes(origin) || isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS Blocked] Acceso denegado desde origen no autorizado: ${origin}`);
    return callback(new Error('Acceso bloqueado por política de seguridad CORS de Microlabs.'));
  },
  credentials: true
}));

// 4. JSON Payload Parser (50MB para soportar importación masiva de datos estructurados de QuickBooks)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// =============================================================================
// AUDIT LOGGING & ROUTES
// =============================================================================

// Middleware para auditoría automática
app.use('/api/', auditLogger);

// Helper para obtener metadatos de versión del backend
const getVersionMetadata = () => {
  try {
    const versionPath = path.join(__dirname, 'version.json');
    if (fs.existsSync(versionPath)) {
      return JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    }
  } catch (err) {
    console.warn('[VERSION] No se pudo leer api/version.json:', err.message);
  }
  return { version: '2.5.0', fullVersion: 'v2.5.0-dev', gitCommit: 'local' };
};

// =============================================================================
// HEALTH & VERSION ENDPOINTS (Trazabilidad y diagnóstico)
// =============================================================================
app.get('/health', (req, res) => {
  const versionInfo = getVersionMetadata();
  res.status(200).json({
    status: 'ok',
    service: 'LIMS API',
    version: versionInfo.fullVersion || versionInfo.version,
    gitCommit: versionInfo.gitCommit || 'unknown',
    gitBranch: versionInfo.gitBranch || 'main',
    buildNumber: versionInfo.buildNumber || null,
    builtAt: versionInfo.builtAt || null,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/version', (req, res) => {
  const versionInfo = getVersionMetadata();
  res.status(200).json({
    status: 'ok',
    ...versionInfo,
    uptimeSeconds: Math.round(process.uptime())
  });
});

// Registrar todas las rutas modularizadas
app.use('/api', apiRouter);

// Manejador 404 estricto para peticiones /api no encontradas (Previene exponer el HTML de SPA)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Recurso de API no encontrado: ${req.method} ${req.originalUrl}` });
});

// =============================================================================
// FALLBACK & SERVER START
// =============================================================================

// Servir archivos estáticos del cliente React en producción
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback de React Router (debe declararse después de todas las rutas /api)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Arranque del servidor
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  initAutomaticBackupScheduler();
  startQuickBooksWatcher(20);
  startReminderScheduler(30);
});

// =============================================================================
// GLOBAL ERROR HANDLERS (prevent server crash on unhandled errors)
// =============================================================================
process.on('uncaughtException', (error) => {
  console.error('💥 [UNCAUGHT EXCEPTION] El servidor encontró un error no manejado:', error.message);
  console.error(error.stack);
  // Log but do NOT exit — PM2 will restart if needed
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [UNHANDLED REJECTION] Promesa rechazada sin manejar:', promise, 'Razón:', reason);
  // Log but do NOT exit
});
