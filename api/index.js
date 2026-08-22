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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// GLOBAL MIDDLEWARES & SECURITY
// =============================================================================

// 1. Cabeceras de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));

// 2. Limitador de peticiones (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.' }
});
app.use('/api/', limiter);

// Función auxiliar para verificar si un origen corresponde a una IP local/red privada o loopback
const isLocalOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local')) {
      return true;
    }
    
    if (hostname.startsWith('10.')) return true;
    
    if (hostname.startsWith('172.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
      }
    }
    
    if (hostname.startsWith('192.168.')) return true;
    
    return false;
  } catch {
    return false;
  }
};

// 3. CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://lims-microlabs.web.app'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || isLocalOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));

// 4. JSON Payload Parser
app.use(express.json({ limit: '10kb' }));

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
