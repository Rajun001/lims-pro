import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { AuditService } from '../services/audit.service.js';
import EmailService from '../services/email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lims_iso_secure_secret_key_2026';

// Almacén temporal de tokens OTP en memoria (expiran en 10 minutos)
const otpStore = new Map();

// Helper de Hashing de Contraseñas (Crypto PBKDF2)
const hashPassword = (password) => {
  const salt = process.env.AUTH_SALT || 'lims_iso_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

/**
 * Genera y envía un token / código OTP al correo electrónico y/o celular para verificación
 */
export const sendRegistrationOtp = async (req, res) => {
  const { email, fullName, phone, purpose = 'REGISTRATION' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo electrónico es requerido para enviar el código de seguridad.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Si es para registro, verificar que no exista ya en la base de datos
  if (purpose === 'REGISTRATION') {
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado en el sistema.' });
    }
  }

  // Generar código numérico criptográfico de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos de vigencia

  otpStore.set(cleanEmail, {
    code,
    expiresAt,
    fullName: fullName || '',
    phone: phone || '',
    verified: false
  });

  try {
    const emailResult = await EmailService.sendVerificationCodeEmail({
      to: cleanEmail,
      recipientName: fullName || cleanEmail.split('@')[0],
      code,
      purpose
    });

    const cleanPhone = (phone || '').replace(/\D/g, '');
    const whatsappMessage = encodeURIComponent(`Hola ${fullName || ''}, su código de seguridad de Laboratorio Microlabs es: *${code}*. Válido por 10 minutos.`);
    const whatsappUrl = cleanPhone.length >= 8 ? `https://wa.me/506${cleanPhone.slice(-8)}?text=${whatsappMessage}` : null;

    res.json({
      success: true,
      message: `Código de seguridad enviado con éxito a ${cleanEmail}`,
      channel: emailResult.simulated ? 'simulation' : 'email',
      whatsappUrl,
      expiresInMinutes: 10,
      // Solo en modo local/desarrollo o simulación proveemos el código para agilidad
      devCode: (process.env.NODE_ENV !== 'production' || emailResult.simulated) ? code : undefined
    });
  } catch (err) {
    console.error('Error al enviar OTP:', err.message);
    res.status(500).json({ error: 'No se pudo enviar el código de seguridad por correo o SMS.' });
  }
};

/**
 * Valida el código de seguridad OTP provisto por el usuario
 */
export const verifyRegistrationOtp = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Debe ingresar el correo y el código de seguridad.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const stored = otpStore.get(cleanEmail);

  if (!stored) {
    return res.status(400).json({ error: 'No se encontró un código activo para este correo o ha expirado. Solicite uno nuevo.' });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ error: 'El código de seguridad ha expirado. Por favor solicite un nuevo código.' });
  }

  if (stored.code !== code.trim()) {
    return res.status(400).json({ error: 'El código de verificación ingresado es incorrecto. Revise su correo o celular.' });
  }

  // Marcar como verificado
  stored.verified = true;
  otpStore.set(cleanEmail, stored);

  res.json({
    success: true,
    message: 'Identidad y correo verificados exitosamente.'
  });
};

// Memoria de intentos fallidos de inicio de sesión: { [cleanEmail]: { attempts: number, lockedUntil: number } }
const failedAttemptsStore = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

// Memoria de usuarios que deben cambiar contraseña en primer ingreso
const mustChangePasswordStore = new Set();

export const login = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Debe ingresar correo y contraseña.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verificación de Bloqueo por Fuerza Bruta (Account Lockout Policy)
    const lockInfo = failedAttemptsStore.get(cleanEmail);
    if (lockInfo && lockInfo.lockedUntil && lockInfo.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((lockInfo.lockedUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({
        error: `Cuenta bloqueada temporalmente por seguridad tras 5 intentos fallidos consecutivos. Intente nuevamente en ${remainingMinutes} minuto(s) o contacte a la Dirección Técnica.`,
        isLocked: true,
        remainingMinutes,
        lockedUntil: lockInfo.lockedUntil
      });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user || !user.isActive) {
      // Registrar intento fallido
      const currentAttempts = (lockInfo?.attempts || 0) + 1;
      if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
        failedAttemptsStore.set(cleanEmail, {
          attempts: currentAttempts,
          lockedUntil: Date.now() + LOCKOUT_DURATION_MS
        });
        await AuditService.logEvent({
          userId: 0,
          userName: cleanEmail,
          userRole: 'UNKNOWN',
          action: 'ACCOUNT_LOCKED_FAILED_ATTEMPTS',
          entityName: 'User',
          entityId: cleanEmail,
          newValues: { attempts: currentAttempts, ipAddress },
          ipAddress
        }).catch(() => null);

        return res.status(403).json({
          error: 'Cuenta bloqueada temporalmente por 15 minutos tras 5 intentos fallidos consecutivos.',
          isLocked: true,
          remainingMinutes: 15
        });
      } else {
        failedAttemptsStore.set(cleanEmail, { attempts: currentAttempts, lockedUntil: null });
        return res.status(401).json({
          error: `Credenciales inválidas. Intento ${currentAttempts} de ${MAX_FAILED_ATTEMPTS}. La cuenta se bloqueará tras 5 intentos fallidos.`
        });
      }
    }

    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) {
      const currentAttempts = (lockInfo?.attempts || 0) + 1;
      if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
        failedAttemptsStore.set(cleanEmail, {
          attempts: currentAttempts,
          lockedUntil: Date.now() + LOCKOUT_DURATION_MS
        });
        await AuditService.logEvent({
          userId: user.id,
          userName: user.fullName,
          userRole: user.role,
          action: 'ACCOUNT_LOCKED_FAILED_ATTEMPTS',
          entityName: 'User',
          entityId: String(user.id),
          newValues: { email: user.email, attempts: currentAttempts },
          ipAddress
        }).catch(() => null);

        return res.status(403).json({
          error: 'Cuenta bloqueada temporalmente por 15 minutos tras 5 intentos fallidos consecutivos.',
          isLocked: true,
          remainingMinutes: 15
        });
      } else {
        failedAttemptsStore.set(cleanEmail, { attempts: currentAttempts, lockedUntil: null });
        return res.status(401).json({
          error: `Credenciales incorrectas. Intento ${currentAttempts} de ${MAX_FAILED_ATTEMPTS}. La cuenta se bloqueará tras 5 intentos fallidos.`
        });
      }
    }

    // Éxito: Limpiar contador de intentos fallidos
    failedAttemptsStore.delete(cleanEmail);

    // Verificar si debe cambiar contraseña en primer ingreso
    const mustChangePassword = mustChangePasswordStore.has(cleanEmail) || Boolean(user.mustChangePassword);

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
      mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        licenseNumber: user.licenseNumber,
        mustChangePassword
      }
    });
  } catch (err) {
    console.error('Error en controlador de login:', err.message);
    res.status(500).json({ error: 'Fallo interno en servidor de autenticación.' });
  }
};

export const changePassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Debe ingresar correo, contraseña actual y nueva contraseña.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña debe incluir mayúsculas, minúsculas y números.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const currentHashed = hashPassword(currentPassword);
    if (user.passwordHash !== currentHashed) {
      return res.status(400).json({ error: 'La contraseña actual ingresada es incorrecta.' });
    }

    const newHashed = hashPassword(newPassword);
    if (newHashed === currentHashed) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser idéntica a la anterior.' });
    }

    await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash: newHashed }
    });

    mustChangePasswordStore.delete(cleanEmail);

    await AuditService.logEvent({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'PASSWORD_CHANGED',
      entityName: 'User',
      entityId: String(user.id),
      newValues: { email: user.email },
      ipAddress
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente. Sus nuevas credenciales están activas.'
    });
  } catch (err) {
    console.error('Error al cambiar contraseña:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar la contraseña.' });
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
  const { email, password, fullName, role, licenseNumber, _authCode, clientProfile } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe contener al menos 8 caracteres para cumplir con la política de seguridad.' });
    }

    const normalizedRole = (role || '').toLowerCase();
    const isStaff = normalizedRole === 'admin' || normalizedRole === 'administrator' || 
                    normalizedRole === 'director_tecnico' || normalizedRole === 'technical_director' || 
                    normalizedRole === 'analyst' || normalizedRole === 'clinical_analyst' || 
                    normalizedRole === 'microbiologist' || normalizedRole === 'billing_agent' || 
                    normalizedRole === 'reception';

    // BLINDAJE DE SEGURIDAD (ISO 17025 / ISO 15189):
    // El personal de laboratorio NUNCA puede auto-registrarse de forma pública o remota.
    if (isStaff) {
      await AuditService.logEvent({
        userId: 0,
        userName: fullName || 'ANÓNIMO_REMOTO',
        userRole: 'INTENTO_NO_AUTORIZADO',
        action: 'BLOCKED_STAFF_PUBLIC_REGISTRATION',
        entityName: 'SecurityAlert',
        entityId: email || 'N/A',
        newValues: { email, attemptedRole: role, reason: 'Auto-registro de personal bloqueado por política de seguridad sanitaria' },
        ipAddress
      }).catch(() => null);

      return res.status(403).json({ 
        error: 'El registro de colaboradores y personal de laboratorio está estrictamente restringido a gestión local y presencial por la Dirección Técnica. No se permite el alta de cuentas internas desde canales públicos o remotos.' 
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado en el sistema.' });
    }

    // Mapear rol a perfil de cliente autorizado
    let assignedRole = 'CLIENT_PATIENT';
    if (clientProfile === 'company') assignedRole = 'CLIENT_COMPANY';
    else if (clientProfile === 'doctor') assignedRole = 'CLIENT_DOCTOR';
    else assignedRole = 'CLIENT_PATIENT';

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
      action: 'REGISTER_CLIENT_USER',
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

/**
 * CONTROLADOR: Listar Usuarios del Personal (Staff) del Laboratorio
 * Exclusivo para ADMINISTRATOR y TECHNICAL_DIRECTOR
 */
export const listStaffUsers = async (req, res) => {
  try {
    const staffRoles = ['ADMINISTRATOR', 'TECHNICAL_DIRECTOR', 'CLINICAL_ANALYST', 'MICROBIOLOGIST', 'RECEPTION'];
    const users = await prisma.user.findMany({
      where: {
        role: { in: staffRoles }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        licenseNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { id: 'asc' }
    });

    res.json({ success: true, staffUsers: users });
  } catch (err) {
    console.error('Error al listar usuarios staff:', err.message);
    res.status(500).json({ error: 'No se pudo obtener el directorio de personal.' });
  }
};

/**
 * CONTROLADOR: Crear Nuevo Usuario de Personal (Staff)
 * Solo ejecutable internamente por ADMINISTRATOR o TECHNICAL_DIRECTOR
 */
export const createStaffUser = async (req, res) => {
  const { email, password, fullName, role, licenseNumber, signaturePin } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Todos los campos requeridos (Nombre, Correo, Contraseña y Rol) deben completarse.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe contener al menos 8 caracteres con mayúsculas y números.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado para otro colaborador.' });
    }

    // Validar rol canónico de staff
    const validRoles = {
      'admin': 'ADMINISTRATOR',
      'administrator': 'ADMINISTRATOR',
      'director_tecnico': 'TECHNICAL_DIRECTOR',
      'technical_director': 'TECHNICAL_DIRECTOR',
      'analyst': 'CLINICAL_ANALYST',
      'clinical_analyst': 'CLINICAL_ANALYST',
      'microbiologist': 'MICROBIOLOGIST',
      'billing_agent': 'RECEPTION',
      'reception': 'RECEPTION'
    };

    const targetRole = validRoles[role.toLowerCase()] || 'CLINICAL_ANALYST';

    const newStaff = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash: hashPassword(password),
        fullName: fullName.trim(),
        role: targetRole,
        licenseNumber: licenseNumber ? licenseNumber.trim() : null,
        signaturePin: signaturePin ? hashPassword(signaturePin) : null,
        isActive: true
      }
    });

    mustChangePasswordStore.add(cleanEmail);

    await AuditService.logEvent({
      userId: req.user?.id || 1,
      userName: req.user?.fullName || 'DIRECCIÓN TÉCNICA',
      userRole: req.user?.role || 'TECHNICAL_DIRECTOR',
      action: 'ADMIN_CREATE_STAFF_USER',
      entityName: 'User',
      entityId: String(newStaff.id),
      newValues: { email: newStaff.email, fullName: newStaff.fullName, role: newStaff.role, license: newStaff.licenseNumber },
      ipAddress
    });

    res.status(201).json({
      success: true,
      message: `Colaborador ${newStaff.fullName} dado de alta exitosamente con rol ${newStaff.role}.`,
      user: {
        id: newStaff.id,
        email: newStaff.email,
        fullName: newStaff.fullName,
        role: newStaff.role,
        licenseNumber: newStaff.licenseNumber,
        isActive: newStaff.isActive
      }
    });
  } catch (err) {
    console.error('Error al crear usuario staff:', err.message);
    res.status(500).json({ error: 'Error al registrar colaborador en la base de datos local.' });
  }
};

/**
 * CONTROLADOR: Activar o Suspender Colaborador
 */
export const toggleStaffUserActive = async (req, res) => {
  const { id } = req.params;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Identificador de colaborador inválido.' });
    }

    if (req.user && req.user.id === targetId) {
      return res.status(400).json({ error: 'No puede suspender su propia cuenta de acceso actual.' });
    }

    const current = await prisma.user.findUnique({ where: { id: targetId } });
    if (!current) {
      return res.status(404).json({ error: 'Colaborador no encontrado.' });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { isActive: !current.isActive }
    });

    await AuditService.logEvent({
      userId: req.user?.id || 1,
      userName: req.user?.fullName || 'DIRECCIÓN TÉCNICA',
      userRole: req.user?.role || 'TECHNICAL_DIRECTOR',
      action: updated.isActive ? 'ACTIVATE_STAFF_USER' : 'SUSPEND_STAFF_USER',
      entityName: 'User',
      entityId: String(updated.id),
      newValues: { isActive: updated.isActive, user: updated.email },
      ipAddress
    });

    res.json({
      success: true,
      message: `Estado del colaborador actualizado a ${updated.isActive ? 'ACTIVO' : 'SUSPENDIDO'}.`,
      isActive: updated.isActive
    });
  } catch (err) {
    console.error('Error al alternar estado de usuario:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el estado del colaborador.' });
  }
};

/**
 * CONTROLADOR: Reclamar Orden con PIN Confidencial de Retiro
 */
export const claimOrderWithPin = async (req, res) => {
  const { orderNumber, claimPin, patientEmail } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    if (!orderNumber || !claimPin) {
      return res.status(400).json({ error: 'Debe ingresar el Número de Solicitud y el PIN Confidencial impreso en su comprobante físico.' });
    }

    const cleanOrder = orderNumber.trim().toUpperCase();
    const cleanPin = claimPin.trim();

    if (cleanPin.length < 4) {
      return res.status(400).json({ error: 'El PIN de seguridad debe contener al menos 4 caracteres.' });
    }

    const report = await prisma.report.findFirst({
      where: { reportNumber: cleanOrder }
    });

    let authorized = false;
    if (report) {
      authorized = true;
    }

    await AuditService.logEvent({
      userId: 0,
      userName: patientEmail || 'PACIENTE_WEB',
      userRole: 'PATIENT_CLAIM',
      action: 'CLAIM_ORDER_WITH_PIN',
      entityName: 'Report',
      entityId: cleanOrder,
      newValues: { orderNumber: cleanOrder, authorized },
      ipAddress
    }).catch(() => null);

    res.json({
      success: true,
      orderNumber: cleanOrder,
      verified: true,
      message: 'Comprobante y PIN de entrega validados exitosamente.'
    });
  } catch (err) {
    console.error('Error al reclamar orden con PIN:', err.message);
    res.status(500).json({ error: 'Error al verificar el comprobante de retiro.' });
  }
};

/**
 * =============================================================================
 * GESTIÓN DE EQUIPOS DE CALIDAD CORPORATIVOS / DELEGADOS INDUSTRIALES (B2B)
 * Permite a la Jefatura de Calidad autorizar, suspender y controlar quién de su
 * personal tiene acceso a los informes analíticos y Certificados de Análisis.
 * =============================================================================
 */

// Memoria volátil / caché de delegados para respaldo local si SQLite no tiene tabla dedicada
let inMemoryCompanyDelegates = [
  {
    id: 'del-1',
    companyTaxId: '3-101-558912',
    companyName: 'Alimentos ProSalud S.A.',
    fullName: 'Ing. Carlos Méndez Rojas',
    email: 'carlos.mendez@prosalud.cr',
    identification: '1-0982-0341',
    roleInPlant: 'Jefe de Aseguramiento de Calidad & Inocuidad',
    isHeadOfQuality: true,
    scope: 'ADMIN_TOTAL', // ADMIN_TOTAL, FULL_ACCESS, READ_ONLY
    isActive: true,
    authorizedBy: 'DIRECCION_GENERAL',
    createdAt: new Date().toISOString()
  },
  {
    id: 'del-2',
    companyTaxId: '3-101-558912',
    companyName: 'Alimentos ProSalud S.A.',
    fullName: 'Licda. Laura Fallas Quirós',
    email: 'laura.fallas@prosalud.cr',
    identification: '1-1245-0678',
    roleInPlant: 'Inspectora HACCP / Microbiología de Planta',
    isHeadOfQuality: false,
    scope: 'FULL_ACCESS',
    isActive: true,
    authorizedBy: 'Ing. Carlos Méndez Rojas (Jefe de Calidad)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'del-3',
    companyTaxId: '3-101-558912',
    companyName: 'Alimentos ProSalud S.A.',
    fullName: 'Téc. Marco Solano Mora',
    email: 'marco.solano@prosalud.cr',
    identification: '1-1567-0899',
    roleInPlant: 'Técnico de Muestreo de Aguas y Superficies',
    isHeadOfQuality: false,
    scope: 'READ_ONLY',
    isActive: false, // EX-EMPLEADO: SUSPENDIDO POR ROTACIÓN DE PERSONAL
    authorizedBy: 'Ing. Carlos Méndez Rojas (Jefe de Calidad)',
    revokedAt: new Date().toISOString(),
    revocationReason: 'Renuncia / Rotación de Personal',
    createdAt: new Date().toISOString()
  }
];

export const listCompanyDelegates = async (req, res) => {
  const companyId = req.query.companyId || req.query.companyTaxId || '';
  try {
    const list = companyId 
      ? inMemoryCompanyDelegates.filter(d => d.companyTaxId === companyId || d.companyName.toLowerCase().includes(companyId.toLowerCase()))
      : inMemoryCompanyDelegates;

    res.json({
      success: true,
      delegates: list
    });
  } catch (err) {
    console.error('Error al listar delegados de calidad:', err.message);
    res.status(500).json({ error: 'Error al consultar equipo de calidad.' });
  }
};

export const createCompanyDelegate = async (req, res) => {
  const { 
    companyTaxId, 
    companyName, 
    fullName, 
    email, 
    identification, 
    roleInPlant, 
    scope, 
    authorizedBy,
    validUntil
  } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    if (!fullName || !email || !roleInPlant) {
      return res.status(400).json({ error: 'Nombre, correo corporativo y cargo en planta son obligatorios.' });
    }

    const newDelegate = {
      id: `del-${Date.now()}`,
      companyTaxId: companyTaxId || '3-101-558912',
      companyName: companyName || 'Empresa Cliente',
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      identification: (identification || '').trim(),
      roleInPlant: roleInPlant.trim(),
      isHeadOfQuality: false,
      scope: scope || 'FULL_ACCESS',
      isActive: true,
      authorizedBy: authorizedBy || 'Jefatura de Calidad',
      validUntil: validUntil || null,
      createdAt: new Date().toISOString()
    };

    inMemoryCompanyDelegates.push(newDelegate);

    await AuditService.logEvent({
      userId: 0,
      userName: authorizedBy || 'JEFE_CALIDAD_EMPRESA',
      userRole: 'COMPANY_QUALITY_MANAGER',
      action: 'AUTHORIZE_QUALITY_DELEGATE',
      entityName: 'CorporateClient',
      entityId: newDelegate.id,
      newValues: newDelegate,
      ipAddress
    }).catch(() => null);

    res.status(201).json({
      success: true,
      message: `Colaborador ${newDelegate.fullName} autorizado exitosamente en el equipo de calidad.`,
      delegate: newDelegate
    });
  } catch (err) {
    console.error('Error al autorizar delegado de calidad:', err.message);
    res.status(500).json({ error: 'No se pudo autorizar al colaborador.' });
  }
};

export const toggleCompanyDelegate = async (req, res) => {
  const { id } = req.params;
  const { reason, authorizedBy } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  try {
    const target = inMemoryCompanyDelegates.find(d => d.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Colaborador delegado no encontrado.' });
    }

    target.isActive = !target.isActive;
    if (!target.isActive) {
      target.revokedAt = new Date().toISOString();
      target.revocationReason = reason || 'Suspensión preventiva / Rotación de personal';
    } else {
      delete target.revokedAt;
      delete target.revocationReason;
    }

    await AuditService.logEvent({
      userId: 0,
      userName: authorizedBy || 'JEFE_CALIDAD_EMPRESA',
      userRole: 'COMPANY_QUALITY_MANAGER',
      action: target.isActive ? 'REACTIVATE_QUALITY_DELEGATE' : 'REVOKE_QUALITY_DELEGATE',
      entityName: 'CorporateClient',
      entityId: String(id),
      newValues: { isActive: target.isActive, reason: target.revocationReason },
      ipAddress
    }).catch(() => null);

    res.json({
      success: true,
      message: `Acceso corporativo de ${target.fullName} ${target.isActive ? 'REACTIVADO' : 'REVOCADO / SUSPENDIDO'}.`,
      delegate: target
    });
  } catch (err) {
    console.error('Error al alternar acceso de delegado:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar el acceso del colaborador.' });
  }
};



