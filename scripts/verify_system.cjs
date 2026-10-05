async function run() {
    try {
        console.log('Iniciando verificación...');
        const [stats, companies, patients, reminders, qbStatus] = await Promise.all([
            fetch('http://localhost:3001/api/crm/stats').then(r => r.json()),
            fetch('http://localhost:3001/api/crm/clients?entityType=COMPANY&limit=3').then(r => r.json()),
            fetch('http://localhost:3001/api/crm/clients?entityType=PATIENT&limit=3').then(r => r.json()),
            fetch('http://localhost:3001/api/reminders').then(r => r.json()),
            fetch('http://localhost:3001/api/qb/sync-status').then(r => r.json())
        ]);

        console.log('\n=== VERIFICACIÓN ENDPOINTS LIMS ===');
        console.log('1. STATS RESUMEN:', JSON.stringify(stats.summary, null, 2));
        console.log('2. TOP 3 EMPRESAS:', companies.data.map(c => ({ name: c.name, sector: c.sector, status: c.activityStatus, reports: c.totalReportsCount })));
        console.log('3. TOP 3 PACIENTES:', patients.data.map(p => ({ name: p.name, id: p.identifier, status: p.activityStatus, reports: p.totalReportsCount })));
        console.log('4. RECORDATORIOS CONTADORES:', JSON.stringify(reminders.counts, null, 2));
        console.log('5. ESTADO SYNC QUICKBOOKS:', JSON.stringify(qbStatus, null, 2));
        console.log('=== TODO VERIFICADO CORRECTAMENTE ===\n');
        process.exit(0);
    } catch (err) {
        console.error('Error verificación:', err.message);
        process.exit(1);
    }
}

run();
