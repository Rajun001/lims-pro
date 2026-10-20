const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DB = path.join(ROOT_DIR, 'api/prisma/dev.db');

const CANDIDATE_BACKUP_DIRS = [
    'Z:\\Publica\\Respaldos_LIMS',
    'Z:\\public\\Respaldos_LIMS',
    'C:\\IONOS HiDrive\\Publica\\Respaldos_LIMS',
    path.join(ROOT_DIR, 'api/prisma/backups')
];

function findLatestBackup(specifiedPath) {
    if (specifiedPath && fs.existsSync(specifiedPath)) {
        return specifiedPath;
    }

    let allFiles = [];
    for (const dir of CANDIDATE_BACKUP_DIRS) {
        if (!fs.existsSync(dir)) continue;
        try {
            const files = fs.readdirSync(dir)
                .filter(f => f.startsWith('lims_backup_') && f.endsWith('.db'))
                .map(f => {
                    const full = path.join(dir, f);
                    const stat = fs.statSync(full);
                    return { full, name: f, mtime: stat.mtime, size: stat.size };
                });
            allFiles.push(...files);
        } catch (e) {}
    }

    if (allFiles.length === 0) {
        return null;
    }

    allFiles.sort((a, b) => b.mtime - a.mtime);
    return allFiles[0].full;
}

async function restore() {
    console.log('================================================================');
    console.log('   HERRAMIENTA AUTOMATIZADA DE RESTAURACIÓN DE DESASTRES (LIMS)');
    console.log('================================================================\n');

    const argPath = process.argv[2];
    const sourceBackup = findLatestBackup(argPath);

    if (!sourceBackup) {
        console.error('❌ [ERROR]: No se encontró ningún archivo de respaldo válido.');
        console.error('   Por favor especifique la ruta manualmente:');
        console.error('   node scripts/disaster_recovery_restore.cjs "C:\\ruta\\al\\respaldo.db"\n');
        process.exit(1);
    }

    console.log(`📦 Respaldo seleccionado: ${sourceBackup}`);
    const stat = fs.statSync(sourceBackup);
    console.log(`   Tamaño: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Fecha de creación: ${stat.mtime.toLocaleString()}`);

    // Crear carpeta prisma si no existe
    const prismaDir = path.dirname(TARGET_DB);
    if (!fs.existsSync(prismaDir)) {
        fs.mkdirSync(prismaDir, { recursive: true });
    }

    // Si ya existe dev.db, hacer una copia de seguridad temporal de seguridad
    if (fs.existsSync(TARGET_DB)) {
        const tempPreRestore = path.join(prismaDir, `dev_pre_restore_${Date.now()}.db.bak`);
        fs.copyFileSync(TARGET_DB, tempPreRestore);
        console.log(`🛡️  Base actual preservada como copia previa: ${path.basename(tempPreRestore)}`);
    }

    // Copiar respaldo hacia dev.db
    console.log('\nRestaurando archivo en:', TARGET_DB);
    fs.copyFileSync(sourceBackup, TARGET_DB);

    // Eliminar posibles archivos de journaling antiguos para evitar inconsistencias
    try {
        const walFile = TARGET_DB + '-wal';
        const shmFile = TARGET_DB + '-shm';
        if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
        if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
    } catch (lockErr) {
        console.log('ℹ️ Nota: Los archivos WAL temporales se limpiarán automáticamente al reiniciar la API.');
    }

    console.log('✅ Archivo dev.db restaurado exitosamente.');

    // Verificar integridad con Prisma
    console.log('\nVerificando integridad de datos con Prisma Client...');
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const [clients, patients, samples, tests, reports] = await Promise.all([
            prisma.corporateClient.count(),
            prisma.patient.count(),
            prisma.industrialSample.count(),
            prisma.industrialTest.count(),
            prisma.report.count()
        ]);
        await prisma.$disconnect();

        console.log('\n--- RESUMEN DE BASE DE DATOS RESTAURADA ---');
        console.log(`🏢 Clientes Corporativos: ${clients}`);
        console.log(`🩺 Pacientes Clínicos:     ${patients}`);
        console.log(`🧪 Muestras Industriales:  ${samples}`);
        console.log(`🔬 Ensayos Analíticos:    ${tests}`);
        console.log(`📄 Informes de Ensayo:     ${reports}`);
        console.log('-------------------------------------------');
        console.log('\n🎉 ¡RESTAURACIÓN COMPLETADA CON 100% DE ÉXITO!');
        console.log('Puede iniciar el sistema ejecutando: npm run start:prod o scripts\\start_lims_background.bat\n');
    } catch (err) {
        console.warn('Advertencia en verificación:', err.message);
        console.log('Ejecute "npx prisma generate" si es una computadora nueva.');
    }
}

restore();
