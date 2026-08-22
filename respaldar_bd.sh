#!/bin/bash
# ================================================================
# LIMS-PRO - Copia de Seguridad de Base de Datos (macOS / Linux)
# ================================================================

echo ""
echo "Generando respaldo seguro de la base de datos LIMS..."
echo ""

node -e "import('./api/utils/backup.js').then(async (m) => { const res = await m.createDatabaseBackup('MANUAL_CLI_MAC'); if (res.success) { console.log('✅ Respaldo completado con éxito: ' + res.fileName); } else { console.error('❌ Error:', res.error); } process.exit(0); }).catch(e => { console.error('❌ Error fatal:', e.message); process.exit(1); })"

echo ""
echo "Los respaldos se almacenan de forma segura en: api/prisma/backups/"
echo ""
