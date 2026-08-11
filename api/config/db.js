import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Configuración de alto rendimiento y concurrencia para SQLite (Modo WAL)
const initSqliteOptimizations = async () => {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
    await prisma.$queryRawUnsafe('PRAGMA foreign_keys = ON;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
    console.log('✅ SQLite configurado con Modo WAL (Write-Ahead Logging) y alta concurrencia.');
  } catch (err) {
    console.warn('⚠️ No se pudieron aplicar las optimizaciones PRAGMA en SQLite:', err.message);
  }
};

initSqliteOptimizations();

export default prisma;
