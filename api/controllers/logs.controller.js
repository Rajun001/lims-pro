import prisma from '../config/db.js';
import { isLocalIp } from '../middlewares/audit.middleware.js';

export const registerSessionLog = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const accessType = isLocalIp(ip) ? 'LOCAL' : 'EXTERNAL';
    const userAgent = req.headers['user-agent'] || 'Desconocido';
    const { action, userId, email, role, company } = req.body;

    const newLog = await prisma.accessLog.create({
      data: {
        ip,
        accessType,
        userId: userId || null,
        email: email || null,
        role: role || null,
        company: company || null,
        action: action || 'SESSION_START',
        details: userAgent
      }
    });

    res.json(newLog);
  } catch (err) {
    console.error("Error al registrar log de acceso:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAccessLogs = async (req, res) => {
  try {
    const role = req.headers['x-user-role'];
    if (role && role !== 'admin') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const logs = await prisma.accessLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 150
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
