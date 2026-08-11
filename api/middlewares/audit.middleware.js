import prisma from '../config/db.js';

export const isLocalIp = (ip) => {
  if (!ip) return true;
  let cleanIp = ip;
  if (ip.startsWith('::ffff:')) {
    cleanIp = ip.substring(7);
  }
  if (cleanIp === 'localhost' || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.endsWith('.local')) {
    return true;
  }
  
  // RFC 1918 Private IP Ranges
  if (cleanIp.startsWith('10.')) return true;
  if (cleanIp.startsWith('192.168.')) return true;
  if (cleanIp.startsWith('172.')) {
    const parts = cleanIp.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
  }
  return false;
};

// Middleware para registrar automáticamente las solicitudes a la API
export const auditLogger = async (req, res, next) => {
  // Ignorar la propia ruta de logs, qbwc y health para no saturar ni entrar en recursión
  if (req.path === '/logs/access' || req.path.startsWith('/qbwc') || req.path === '/health') {
    return next();
  }
  
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const accessType = isLocalIp(ip) ? 'LOCAL' : 'EXTERNAL';
  const userAgent = req.headers['user-agent'] || 'Desconocido';
  
  // Si el frontend envía cabeceras de usuario en cada petición, las capturamos
  const userId = req.headers['x-user-id'] || null;
  const email = req.headers['x-user-email'] || null;
  const role = req.headers['x-user-role'] || null;
  const company = req.headers['x-user-company'] || null;
  
  try {
    await prisma.accessLog.create({
      data: {
        ip,
        accessType,
        userId,
        email,
        role,
        company,
        action: 'API_REQUEST',
        details: `${req.method} ${req.originalUrl} - ${userAgent}`
      }
    });
  } catch (err) {
    console.error("Error al registrar log de acceso automático:", err.message);
  }
  
  next();
};
