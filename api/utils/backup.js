import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../prisma/dev.db');
const BACKUPS_DIR = path.resolve(__dirname, '../prisma/backups');

/**
 * Crea una copia de seguridad segura de la base de datos SQLite.
 * Utiliza VACUUM INTO para garantizar atomicidad e integridad incluso durante lecturas/escrituras activas.
 */
export const createDatabaseBackup = async (reason = 'SCHEDULED') => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `lims_backup_${timestamp}_${reason}.db`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

    // En SQLite en modo WAL, VACUUM INTO crea una instantánea 100% limpia e íntegra
    const sanitizedPath = backupFilePath.replace(/\\/g, '/');
    await prisma.$queryRawUnsafe(`VACUUM INTO '${sanitizedPath}';`);

    const stats = fs.statSync(backupFilePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`📦 [BACKUP EXITOSO] Respaldo guardado: ${backupFileName} (${sizeMB} MB)`);

    // Réplica automática al Synology NAS si está en la red
    const NAS_PATH = '\\\\192.168.0.105\\Respaldos_LIMS';
    try {
      if (fs.existsSync(NAS_PATH)) {
        const nasDest = path.join(NAS_PATH, backupFileName);
        fs.copyFileSync(backupFilePath, nasDest);
        console.log(`🛡️ [NAS SYNOLOGY] Réplica de seguridad copiada a: ${nasDest}`);
      }
    } catch (nasErr) {
      console.log(`ℹ️ [NAS Sync]: ${nasErr.message}`);
    }

    // Rotación automática: conservar solo los últimos 30 respaldos
    rotateBackups(30);

    return {
      success: true,
      fileName: backupFileName,
      path: backupFilePath,
      sizeMB: `${sizeMB} MB`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ [ERROR AL CREAR BACKUP]:', error.message);
    // Fallback: copia física de seguridad si VACUUM INTO no es soportado
    try {
      if (fs.existsSync(DB_PATH)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fallbackFileName = `lims_backup_${timestamp}_FALLBACK.db`;
        const fallbackPath = path.join(BACKUPS_DIR, fallbackFileName);
        fs.copyFileSync(DB_PATH, fallbackPath);
        return {
          success: true,
          fileName: fallbackFileName,
          fallback: true,
          timestamp: new Date().toISOString()
        };
      }
    } catch (fallbackErr) {
      console.error('❌ [FALLBACK BACKUP ERROR]:', fallbackErr.message);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Elimina respaldos antiguos para evitar consumo excesivo de disco.
 */
export const rotateBackups = (keepCount = 30) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return;

    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(BACKUPS_DIR, f),
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > keepCount) {
      const filesToDelete = files.slice(keepCount);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🧹 [LIMPIEZA DE BACKUPS] Eliminado respaldo antiguo: ${file.name}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Error durante la rotación de respaldos:', err.message);
  }
};

/**
 * Inicia el temporizador de respaldo automático cada 24 horas y realiza uno al arrancar.
 */
export const initAutomaticBackupScheduler = () => {
  // Ejecutar un respaldo al arrancar el servidor en segundo plano
  setTimeout(() => {
    createDatabaseBackup('STARTUP');
  }, 5000);

  // Programar respaldo cada 24 horas (86,400,000 ms)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    createDatabaseBackup('DAILY_AUTO');
  }, TWENTY_FOUR_HOURS);

  console.log('⏰ Sistema de Respaldos Automáticos inicializado (Frecuencia: Cada 24 Horas).');
};
