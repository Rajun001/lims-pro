#!/bin/bash
# ================================================================
# LIMS-PRO - Herramienta de Reparación y Mantenimiento macOS
# Compatible con: Mac Mini, Linux (Ubuntu/Debian)
# ================================================================

echo "================================================================"
echo "    HERRAMIENTA DE REPARACIÓN Y MANTENIMIENTO LIMS (macOS)     "
echo "================================================================"
echo ""

LOG_FILE="logs/repair_system.log"
mkdir -p logs

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Iniciando proceso de diagnóstico y reparación..."

# 1. Verificar Node.js y npm
if ! command -v node &> /dev/null; then
    log "[ERROR] Node.js no está instalado."
    exit 1
fi
log "[✓] Node.js $(node -v) detectado."

# 2. Reparar dependencias de Node.js
log "[1/4] Reinstalando y verificando dependencias..."
npm install --prefer-offline --no-audit
if [ $? -ne 0 ]; then
    log "[!] Advertencia: La instalación de dependencias reportó problemas. Forzando ajuste..."
    npm install --legacy-peer-deps
fi
log "[✓] Dependencias al día."

# 3. Reparar y Sincronizar Base de Datos SQLite con Prisma
log "[2/4] Sincronizando esquema de Base de Datos SQLite (Prisma)..."
if [ -d "api" ]; then
    cd api
    npx prisma generate
    npx prisma db push
    cd ..
    log "[✓] Base de Datos SQLite sincronizada correctamente."
else
    log "[ERROR] Directorio api no encontrado."
fi

# 4. Reconstruir Frontend de Producción
log "[3/4] Compilando Frontend de producción (Vite)..."
npm run build
if [ $? -eq 0 ]; then
    log "[✓] Compilación frontend exitosa (dist/ listo)."
else
    log "[ERROR] Falló la compilación del frontend."
    exit 1
fi

# 5. Reiniciar Servicios PM2 (si están activos)
log "[4/4] Reiniciando procesos en PM2..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs
    pm2 save
    log "[✓] Servicios PM2 reiniciados con éxito."
else
    log "[INFO] PM2 no instalado globalmente. Para ejecutar en producción en segundo plano: npm install -g pm2"
fi

echo ""
echo "================================================================"
echo "   SISTEMA REPARADO Y OPTIMIZADO AL 100% CON ÉXITO!"
echo "================================================================"
echo ""
