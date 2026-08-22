#!/bin/bash
# =========================================================
# LIMS-PRO - Auto Actualizador v2 para macOS y Linux
# Compatible con: Mac Mini Server, Ubuntu, Debian
# =========================================================

set -e  # Detener en cualquier error

echo "========================================================="
echo "   ACTUALIZANDO LIMS-PRO A LA ULTIMA VERSION..."
echo "========================================================="
echo ""

# Crear directorio de logs si no existe
mkdir -p logs

# Asegurar permisos de ejecucion para todos los scripts shell
chmod +x *.sh 2>/dev/null || true

# 1. Sincronizar con el repositorio oficial
echo "[1/6] Descargando ultimas mejoras de GitHub..."
git pull origin main || echo "[INFO] Continuando con la rama local actual."
echo "OK: Codigo al dia."
echo ""

echo "[*] Generando numero de version y sello de trazabilidad..."
node scripts/generate_version.js
echo ""

# 2. Instalar dependencias
echo "[2/6] Verificando dependencias de Node.js..."
npm install --prefer-offline --no-audit
echo "OK: Dependencias verificadas."
echo ""

# 3. Respaldo de Base de Datos pre-actualización
echo "[3/6] Generando copia de seguridad pre-actualización de la base de datos..."
node -e "import('./api/utils/backup.js').then(async (m) => { const res = await m.createDatabaseBackup('PRE_UPDATE'); if (res.success) { console.log('[OK] Respaldo pre-actualización completado.'); process.exit(0); } else { console.error('[ERROR] Error en respaldo:', res.error); process.exit(1); } }).catch(e => { console.error('[ERROR FATAL]:', e.message); process.exit(1); })" || echo "[ADVERTENCIA] No se pudo generar el respaldo automático pre-actualización."
echo ""

# 4. Sincronizar Base de Datos con Prisma
echo "[4/6] Sincronizando estructura de base de datos SQLite..."
if [ -d "api" ]; then
    cd api
    npx prisma generate
    npx prisma db push
    cd ..
fi
echo "OK: Base de datos al dia."
echo ""

# 5. Compilar Frontend
echo "[5/6] Compilando version de produccion..."
npm run build
echo "OK: Compilacion completada."
echo ""

# 6. Reiniciar servicios con PM2
echo "[6/6] Reiniciando servicios con PM2..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs
    pm2 save
    echo "OK: Servicios PM2 reiniciados."
else
    echo "AVISO: PM2 no instalado. Para instalar globalmente: npm install -g pm2"
fi
echo ""

echo "$(date) - ACTUALIZACIÓN COMPLETADA CON ÉXITO" >> logs/actualizaciones.log

echo "========================================================="
echo "   SISTEMA ACTUALIZADO AL 100% CON EXITO!"
echo "========================================================="
echo ""
echo "App Cloud:  https://lims-microlabs.web.app"
echo "API Local:  http://localhost:3001/health"
echo "Log Audit:  logs/actualizaciones.log"
echo ""
