import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { AuditService } from '../services/audit.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lims_iso_secure_secret_key_2026';

// Helper de Hashing de Contraseñas (Crypto PBKDF2)
const hashPassword = (password) => {
  const salt = process.env.AUTH_SALT || 'lims_iso_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Debe ingresar correo y contraseña.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciales inválidas o cuenta inactiva.' });
    }

    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generar Token JWT con vigencia de 8 horas (Turno analítico)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Registrar trazabilidad 21 CFR Part 11 de inicio de sesión exitoso
    await AuditService.logEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityName: 'User',
      entityId: String(user.id),
      newValues: { email: user.email, role: user.role },
      ipAddress
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (err) {
    console.error('Error en controlador de login:', err.message);
    res.status(500).json({ error: 'Fallo interno en servidor de autenticación.' });
  }
};

export const registerUser = async (req, res) => {
  const { email, password, fullName, role, licenseNumber, signaturePin } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        fullName,
        role: role || 'CLINICAL_ANALYST',
        licenseNumber,
        signaturePin: signaturePin ? hashPassword(signaturePin) : null
      }
    });

    await AuditService.logEvent({
      userId: req.user?.id || newUser.id,
      userName: req.user?.fullName || newUser.fullName,
      userRole: req.user?.role || newUser.role,
      action: 'CREATE_USER',
      entityName: 'User',
      entityId: String(newUser.id),
      newValues: { email, fullName, role },
      ipAddress
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente con credenciales normativas.',
      user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role }
    });
  } catch (err) {
    console.error('Error al registrar usuario:', err.message);
    res.status(500).json({ error: 'Fallo al registrar usuario.' });
  }
};

export const publicRegister = async (req, res) => {
  const { email, password, fullName, role, licenseNumber, authCode, clientProfile } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe contener al menos 8 caracteres para cumplir con la política de seguridad.' });
    }

    const normalizedRole = (role || '').toLowerCase();
    const isStaff = normalizedRole === 'admin' || normalizedRole === 'director_tecnico' || normalizedRole === 'analyst' || normalizedRole === 'billing_agent';

    if (isStaff) {
      const validStaffToken = process.env.STAFF_REGISTRATION_TOKEN || 'MICROLABS-2026';
      if (!authCode || authCode.trim() !== validStaffToken) {
        return res.status(403).json({ 
          error: 'Código de Autorización Institucional inválido o no proporcionado. El registro de personal requiere autorización de la Dirección del Laboratorio.' 
        });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado en el sistema.' });
    }

    // Mapear rol a enumeración o valor canónico
    let assignedRole = 'CLIENT_PATIENT';
    if (isStaff) {
      if (normalizedRole === 'admin') assignedRole = 'ADMINISTRATOR';
      else if (normalizedRole === 'director_tecnico') assignedRole = 'TECHNICAL_DIRECTOR';
      else if (normalizedRole === 'billing_agent') assignedRole = 'RECEPTION';
      else assignedRole = 'CLINICAL_ANALYST';
    } else {
      if (clientProfile === 'company') assignedRole = 'CLIENT_COMPANY';
      else if (clientProfile === 'doctor') assignedRole = 'CLIENT_DOCTOR';
      else assignedRole = 'CLIENT_PATIENT';
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        fullName,
        role: assignedRole,
        licenseNumber: licenseNumber || null,
        isActive: true
      }
    });

    await AuditService.logEvent({
      userId: newUser.id,
      userName: newUser.fullName,
      userRole: newUser.role,
      action: isStaff ? 'REGISTER_STAFF_USER' : 'REGISTER_CLIENT_USER',
      entityName: 'User',
      entityId: String(newUser.id),
      newValues: { email, fullName, role: assignedRole },
      ipAddress
    });

    res.status(201).json({
      message: 'Cuenta registrada exitosamente y lista para operar.',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: assignedRole
      }
    });
  } catch (err) {
    console.error('Error en publicRegister:', err.message);
    res.status(500).json({ error: 'Error interno al procesar el registro.' });
  }
};

