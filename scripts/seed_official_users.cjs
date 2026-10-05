const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:C:/lims-microlabs/api/prisma/dev.db'
    }
  }
});

const salt = process.env.AUTH_SALT || 'lims_iso_salt_2026';
const hashPassword = (password) => {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

const officialUsers = [
  {
    email: 'admin@microlabs.com',
    fullName: 'Administrador de Sistemas LIMS',
    role: 'ADMINISTRATOR',
    password: 'Admin@MicroLabs2026!',
    licenseNumber: 'ADM-01',
    signaturePin: '2026'
  },
  {
    email: 'director@microlabs.com',
    fullName: 'Dr. Roldan Ajún Chaverri',
    role: 'TECHNICAL_DIRECTOR',
    password: 'Director@MicroLabs2026!',
    licenseNumber: '802',
    signaturePin: '8020'
  },
  {
    email: 'analista@microlabs.com',
    fullName: 'Lic. Análisis Clínico y Microbiología',
    role: 'CLINICAL_ANALYST',
    password: 'Analista@MicroLabs2026!',
    licenseNumber: 'QC-1048',
    signaturePin: '1048'
  },
  {
    email: 'facturacion@microlabs.com',
    fullName: 'Recepción y Facturación Institucional',
    role: 'RECEPTION',
    password: 'Factura@MicroLabs2026!',
    licenseNumber: 'REC-01',
    signaturePin: null
  }
];

async function seed() {
  console.log('--- INICIALIZANDO USUARIOS OFICIALES LIMS-PRO ---');
  for (const u of officialUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`[EXISTENTE] Actualizando credenciales seguras para: ${u.email}`);
      await prisma.user.update({
        where: { email: u.email },
        data: {
          fullName: u.fullName,
          role: u.role,
          passwordHash: hashPassword(u.password),
          licenseNumber: u.licenseNumber,
          signaturePin: u.signaturePin ? hashPassword(u.signaturePin) : null,
          isActive: true
        }
      });
    } else {
      console.log(`[CREANDO] Creando usuario oficial: ${u.email} (${u.role})`);
      await prisma.user.create({
        data: {
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          passwordHash: hashPassword(u.password),
          licenseNumber: u.licenseNumber,
          signaturePin: u.signaturePin ? hashPassword(u.signaturePin) : null,
          isActive: true
        }
      });
    }
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, licenseNumber: true, isActive: true }
  });
  console.log('\n--- USUARIOS REGISTRADOS EN BASE DE DATOS LOCAL ---');
  console.table(allUsers);
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('Error sembrando usuarios:', err);
  process.exit(1);
});
