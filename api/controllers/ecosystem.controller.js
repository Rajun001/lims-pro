import net from 'net';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { createDatabaseBackup } from '../utils/backup.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../prisma/dev.db');
const LOCAL_BACKUPS_DIR = path.resolve(__dirname, '../prisma/backups');
const NAS_BACKUP_DIR = 'Z:\\public\\Respaldos_LIMS';

// Helper to test TCP port with short timeout
const testTcpPort = (ip, port, timeout = 1200) => {
  return new Promise((resolve) => {
    let resolved = false;
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    const finish = (val) => {
      if (!resolved) {
        resolved = true;
        socket.removeAllListeners();
        socket.destroy();
        resolve(val);
      }
    };

    socket.on('connect', () => finish(true));
    socket.on('timeout', () => finish(false));
    socket.on('error', () => finish(false));
    try {
      socket.connect(port, ip);
    } catch {
      finish(false);
    }
  });
};

/**
 * Obtiene el estado completo de salud del ecosistema
 */
export const getEcosystemStatus = async (req, res) => {
  try {
    // 1. Host local
    const hostname = os.hostname();
    const platform = `${os.platform()} (${os.release()})`;
    const ifaces = os.networkInterfaces();
    let localIp = '127.0.0.1';
    for (const name in ifaces) {
      for (const iface of ifaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
    }

    // 2. Base de Datos SQLite
    let dbStatus = {
      healthy: false,
      sizeMB: '0.00',
      lastModified: null,
      walMode: true
    };
    if (fs.existsSync(DB_PATH)) {
      const stats = fs.statSync(DB_PATH);
      dbStatus = {
        healthy: true,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        lastModified: stats.mtime.toISOString(),
        walMode: true
      };
    }

    // 3. Analizador de Laboratorio y puerto TCP 9000
    const analyzerPortOpen = await testTcpPort('127.0.0.1', 9000, 800);
    const snibeSmbOpen = await testTcpPort('192.168.0.24', 445, 800);

    const analyzerStatus = {
      servicePort9000: analyzerPortOpen,
      snibeEquipmentOnline: snibeSmbOpen,
      snibeIp: '192.168.0.24',
      status: analyzerPortOpen ? 'ONLINE' : (snibeSmbOpen ? 'EQUIPMENT_READY' : 'STANDBY')
    };

    // 4. NAS y Almacenamiento en la Nube (Unidad Z:)
    let nasStatus = {
      mounted: false,
      drive: 'Z:',
      path: NAS_BACKUP_DIR,
      recentBackupsCount: 0,
      latestBackup: null
    };

    try {
      if (fs.existsSync('Z:\\')) {
        nasStatus.mounted = true;
        if (fs.existsSync(NAS_BACKUP_DIR)) {
          const files = fs.readdirSync(NAS_BACKUP_DIR)
            .filter(f => f.endsWith('.db'))
            .map(f => {
              const fPath = path.join(NAS_BACKUP_DIR, f);
              const stat = fs.statSync(fPath);
              return {
                name: f,
                sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
                modified: stat.mtime.toISOString()
              };
            })
            .sort((a, b) => new Date(b.modified) - new Date(a.modified));

          nasStatus.recentBackupsCount = files.length;
          nasStatus.latestBackup = files[0] || null;
          nasStatus.backups = files.slice(0, 10);
        }
      }
    } catch (e) {
      nasStatus.error = e.message;
    }

    // 5. Escritorio Remoto (Chrome Remote Desktop para Mac Mini en Casa)
    let remoteDesktopStatus = {
      installed: false,
      running: false,
      serviceName: 'chromoting'
    };

    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync('sc.exe query chromoting', { timeout: 2000 });
        if (stdout.includes('RUNNING')) {
          remoteDesktopStatus.installed = true;
          remoteDesktopStatus.running = true;
        } else if (stdout.includes('STATE')) {
          remoteDesktopStatus.installed = true;
          remoteDesktopStatus.running = false;
        }
      } catch {
        // Service might not exist or permission denied
      }
    }

    // 6. Resumen de Salud Global
    const overallScore = [
      dbStatus.healthy ? 25 : 0,
      nasStatus.mounted ? 25 : 0,
      remoteDesktopStatus.running ? 25 : 15,
      (analyzerStatus.servicePort9000 || analyzerStatus.snibeEquipmentOnline) ? 25 : 20
    ].reduce((a, b) => a + b, 0);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      healthScore: overallScore,
      host: {
        hostname,
        platform,
        localIp,
        environment: 'LABORATORIO_CENTRAL'
      },
      database: dbStatus,
      analyzer: analyzerStatus,
      nasStorage: nasStatus,
      remoteAccess: {
        chromeRemoteDesktop: remoteDesktopStatus,
        accessUrlGuide: 'https://remotedesktop.google.com/access',
        cloudTunnelSupported: fs.existsSync(path.resolve(__dirname, '../../cloudflared.exe'))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error al consultar estado del ecosistema',
      details: error.message
    });
  }
};

/**
 * Dispara un respaldo manual y lo replica inmediatamente al NAS / Z:
 */
export const triggerNasBackup = async (req, res) => {
  try {
    const reason = req.body?.reason || 'ECOSYSTEM_MANUAL_TRIGGER';
    const result = await createDatabaseBackup(reason);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Respaldo generado y replicado al NAS exitosamente.',
        ...result
      });
    }

    return res.status(500).json({
      success: false,
      error: 'No se pudo completar el respaldo',
      details: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
