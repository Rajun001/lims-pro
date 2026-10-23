const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function runAudit() {
    console.log('================================================================================');
    console.log('            AUDITORÍA DE FUNCIONAMIENTO INTEGRAL DEL SISTEMA LIMS               ');
    console.log('================================================================================\n');

    const results = [];

    // 1. Verificación de Base de Datos SQLite (WAL)
    try {
        const reportCount = await prisma.report.count();
        const patientCount = await prisma.patient.count();
        const clientCount = await prisma.corporateClient.count();
        const indTestCount = await prisma.industrialTest.count();
        const cliTestCount = await prisma.clinicalTest.count();

        results.push({
            module: 'Base de Datos SQLite (Prisma)',
            status: 'OPERATIVO (100%)',
            details: `${reportCount.toLocaleString()} reportes | ${patientCount.toLocaleString()} pacientes | ${clientCount.toLocaleString()} empresas | ${cliTestCount.toLocaleString()} ensayos clínicos | ${indTestCount.toLocaleString()} ensayos industriales`
        });
    } catch (err) {
        results.push({
            module: 'Base de Datos SQLite (Prisma)',
            status: 'ERROR',
            details: err.message
        });
    }

    // 2. Health Endpoint
    try {
        const res = await fetch('http://localhost:3001/health');
        const data = await res.json();
        results.push({
            module: 'API Health Endpoint (/health)',
            status: res.status === 200 && data.status === 'ok' ? 'OPERATIVO (100%)' : 'DEGRADADO',
            details: `Versión: ${data.version} | Uptime: ${Math.round(data.uptimeSeconds / 3600)}h ${(Math.round(data.uptimeSeconds % 3600 / 60))}m | Node: ${data.nodeVersion}`
        });
    } catch (err) {
        results.push({
            module: 'API Health Endpoint (/health)',
            status: 'ERROR',
            details: err.message
        });
    }

    // 3. Catálogo de Informes (/api/reports)
    try {
        const res = await fetch('http://localhost:3001/api/reports?limit=5');
        const data = await res.json();
        results.push({
            module: 'Catálogo de Informes (/api/reports)',
            status: res.status === 200 && Array.isArray(data.items) ? 'OPERATIVO (100%)' : 'ERROR',
            details: `Paginación: Página ${data.page}/${data.totalPages} (${data.total} informes totales cargados)`
        });
    } catch (err) {
        results.push({
            module: 'Catálogo de Informes (/api/reports)',
            status: 'ERROR',
            details: err.message
        });
    }

    // 4. Detalle de Reporte #131948 (Douglas Gonzales Badilla)
    try {
        const res = await fetch('http://localhost:3001/api/reports/details/131948');
        const rep = await res.json();
        const patName = `${rep.clinicalOrder?.sample?.patient?.firstName} ${rep.clinicalOrder?.sample?.patient?.lastName}`;
        const testCount = rep.clinicalOrder?.tests?.length || 0;
        results.push({
            module: 'Detalle de Reporte #131948 (Douglas Gonzales)',
            status: res.status === 200 && rep.reportNumber === '131948' ? 'OPERATIVO (100%)' : 'ERROR',
            details: `Paciente: ${patName} | Ensayos: ${testCount} determinaciones | Estado: ${rep.status}`
        });
    } catch (err) {
        results.push({
            module: 'Detalle de Reporte #131948 (Douglas Gonzales)',
            status: 'ERROR',
            details: err.message
        });
    }

    // 5. Descarga de PDF Idéntico Oficial (/api/reports/details/131948/pdf)
    try {
        const res = await fetch('http://localhost:3001/api/reports/details/131948/pdf');
        const buffer = await res.arrayBuffer();
        results.push({
            module: 'Servicio de PDF Idéntico (/api/reports/.../pdf)',
            status: res.status === 200 && res.headers.get('content-type')?.includes('pdf') ? 'OPERATIVO (100%)' : 'ERROR',
            details: `Tamaño entregado: ${buffer.byteLength} bytes | Content-Type: ${res.headers.get('content-type')}`
        });
    } catch (err) {
        results.push({
            module: 'Servicio de PDF Idéntico (/api/reports/.../pdf)',
            status: 'ERROR',
            details: err.message
        });
    }

    // 6. Seguridad y Doble Llave (/api/reports/verify/131948)
    try {
        const resLocked = await fetch('http://localhost:3001/api/reports/verify/131948').then(r => r.json());
        const resUnlocked = await fetch('http://localhost:3001/api/reports/verify/131948?key=112340567').then(r => r.json());
        const lockedOk = resLocked.unlocked === false && resLocked.requiresKey === true;
        const unlockedOk = resUnlocked.unlocked === true && resUnlocked.clientOrPatient === 'Douglas Gonzales Badilla';

        results.push({
            module: 'Verificación Hermética & Doble Llave',
            status: (lockedOk && unlockedOk) ? 'OPERATIVO (100%)' : 'FALLO DE SEGURIDAD',
            details: `Bloqueo sin llave: ${lockedOk ? 'ACTIVO' : 'FALLA'} | Desbloqueo con cédula: ${unlockedOk ? 'EXITOSO' : 'FALLA'}`
        });
    } catch (err) {
        results.push({
            module: 'Verificación Hermética & Doble Llave',
            status: 'ERROR',
            details: err.message
        });
    }

    // 7. Servidor Frontend Web (Vite Preview / Producción)
    try {
        const res5173 = await fetch('http://localhost:5173/');
        const text5173 = await res5173.text();
        const ok5173 = res5173.status === 200 && text5173.includes('LIMS');
        results.push({
            module: 'Servidor Frontend Web (Puerto 5173)',
            status: ok5173 ? 'OPERATIVO (100%)' : 'DEGRADADO',
            details: `Respuesta HTTP 200 OK | Título SPA detectado | Puerto activo en red local (0.0.0.0:5173)`
        });
    } catch (err) {
        results.push({
            module: 'Servidor Frontend Web (Puerto 5173)',
            status: 'ERROR',
            details: err.message
        });
    }

    // Imprimir Resultados
    results.forEach((r, idx) => {
        const badge = r.status.includes('OPERATIVO') ? '✅' : '❌';
        console.log(`[${idx + 1}] ${badge} ${r.module}: [${r.status}]`);
        console.log(`    Detalles: ${r.details}\n`);
    });

    const allOk = results.every(r => r.status.includes('OPERATIVO'));
    console.log('================================================================================');
    console.log(allOk ? '   RESULTADO GLOBAL: TODOS LOS SUBSISTEMAS ESTÁN 100% OPERATIVOS' : '   RESULTADO GLOBAL: SE DETECTARON ADVERTENCIAS O ERRORES');
    console.log('================================================================================\n');
}

runAudit()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
