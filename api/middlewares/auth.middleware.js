import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lims_iso_secure_secret_key_2026';

/**
 * Middleware para Autenticación de Tokens JWT
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token JWT no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, fullName }
    next();
  } catch {
    return res.status(403).json({ error: 'Token no válido o expirado. Por favor inicie sesión nuevamente.' });
  }
};

/**
 * Middleware para Control de Acceso Basado en Roles (RBAC)
 * @param  {...string} allowedRoles - Roles permitidos (ej. 'ADMINISTRATOR', 'TECHNICAL_DIRECTOR')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'No autorizado: Credenciales o rol de usuario faltantes.' });
    }

    if (req.user.role === 'ADMINISTRATOR') {
      // El Administrador tiene acceso global
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acceso Denegado: Tu rol actual (${req.user.role}) no tiene permisos para esta operación regulada.`
      });
    }

    next();
  };
};
