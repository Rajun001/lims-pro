import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LOCAL_BACKUPS_DIR = path.join(ROOT_DIR, 'api/prisma/backups');
const LOG_FILE = path.join(ROOT_DIR, 'logs/synology_sync.log');

function log(msg) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  try {
    const logsDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch {}
}

/**
 * Obtiene los directorios de destino según la plataforma
 */
function getSynologyTargets() {
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';
  const home = os.homedir();

  const candidateDirs = [];

  if (isMac) {
    // macOS: Carpetas montadas de Synology en /Volumes o carpeta de usuario
    candidateDirs.push(
      '/Volumes/Respaldos_LIMS',
      '/Volumes/public/Respaldos_LIMS',
      '/Volumes/home/Respaldos_LIMS',
      '/Volumes/Synology/Respaldos_LIMS',
      path.join(home, 'Respaldos_LIMS'),
      path.join(home, 'Synology/Respaldos_LIMS')
    );
  } else if (isWin) {
    // Windows: Unidad Z: o carpeta local de sincronización
    candidateDirs.push(
      'Z:\\public\\Respaldos_LIMS',
      'Z:\\Respaldos_LIMS',
      path.join(home, 'Respaldos_LIMS')
    );
  }

  const existing = [];
  for (const d of candidateDirs) {
    try {
      if (fs.existsSync(d)) {
        existing.push(d);
      } else if (d.startsWith(home) && !existing.includes(d)) {
        fs.mkdirSync(d, { recursive: true });
        existing.push(d);
      }
    } catch {}
  }

  return existing;
}

/**
 * Sincroniza archivos .db locales o de puente hacia el Synology NAS
 */
export async function syncBackupsToSynology() {
  log('================================================================');
  log('     SINCRONIZACIÓN AUTOMÁTICA DE RESPALDOS AL NAS SYNOLOGY     ');
  log('================================================================');

  const targets = getSynologyTargets();
  log(`🎯 Destinos de almacenamiento detectados: [${targets.join(', ') || 'Ninguno'}]`);

  // 1. Recopilar archivos a sincronizar
  const sourceFiles = [];

  // Desde carpeta local api/prisma/backups
  if (fs.existsSync(LOCAL_BACKUPS_DIR)) {
    const local = fs.readdirSync(LOCAL_BACKUPS_DIR)
      .filter(f => f.endsWith('.db'))
      .map(f => path.join(LOCAL_BACKUPS_DIR, f));
    sourceFiles.push(...local);
  }

  // Desde unidad puente Z:\ si existe
  const hidriveDir = 'Z:\\public\\Respaldos_LIMS';
  if (fs.existsSync(hidriveDir)) {
    const cloud = fs.readdirSync(hidriveDir)
      .filter(f => f.endsWith('.db'))
      .map(f => path.join(hidriveDir, f));
    for (const cf of cloud) {
      if (!sourceFiles.some(sf => path.basename(sf) === path.basename(cf))) {
        sourceFiles.push(cf);
      }
    }
  }

  log(`📦 Archivos de respaldo encontrados para sincronizar: ${sourceFiles.length}`);

  if (sourceFiles.length === 0) {
    log('ℹ️ No hay archivos de respaldo pendientes para sincronizar.');
    return { success: true, copiedCount: 0 };
  }

  let totalCopied = 0;

  for (const targetDir of targets) {
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      for (const src of sourceFiles) {
        const fileName = path.basename(src);
        const dest = path.join(targetDir, fileName);

        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          const stat = fs.statSync(dest);
          const mb = (stat.size / (1024 * 1024)).toFixed(2);
          log(`  ✅ [COPIADO A SYNOLOGY] -> ${fileName} (${mb} MB) guardado en: ${targetDir}`);
          totalCopied++;
        } else {
          const srcStat = fs.statSync(src);
          const dstStat = fs.statSync(dest);
          if (srcStat.size !== dstStat.size) {
            fs.copyFileSync(src, dest);
            log(`  🔄 [ACTUALIZADO EN SYNOLOGY] -> ${fileName} en: ${targetDir}`);
            totalCopied++;
          }
        }
      }
    } catch (err) {
      log(`  ⚠️ Error sincronizando con destino ${targetDir}: ${err.message}`);
    }
  }

  log(`🎉 Sincronización finalizada exitosamente.`);
  return { success: true, copiedCount: totalCopied, targets };
}

// Si se ejecuta directamente desde CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncBackupsToSynology()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal:', err);
      process.exit(1);
    });
}
