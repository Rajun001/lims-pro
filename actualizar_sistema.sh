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

# 1. Sincronizar con el repositorio oficial
echo "[1/5] Descargando ultimas mejoras de GitHub..."
git pull origin main
echo "OK: Codigo actualizado."
echo ""

# 2. Instalar dependencias
echo "[2/5] Verificando dependencias de Node.js..."
npm install --prefer-offline --no-audit
echo "OK: Dependencias verificadas."
echo ""

# 3. Sincronizar Base de Datos con Prisma
echo "[3/5] Sincronizando estructura de base de datos..."
if [ -d "api" ]; then
    cd api
    if [ "$NODE_ENV" = "production" ]; then
        npx prisma migrate deploy 2>/dev/null || npx prisma db push
    else
        npx prisma db push
    fi
    cd ..
fi
echo "OK: Base de datos al dia."
echo ""

# 4. Compilar Frontend
echo "[4/5] Compilando version de produccion..."
npm run build
echo "OK: Compilacion completada."
echo ""

# 5. Reiniciar servicios con PM2
echo "[5/5] Reiniciando servicios con PM2..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs
    pm2 save
    echo "OK: Servicios PM2 reiniciados."
else
    echo "AVISO: PM2 no instalado. Para instalar: npm install -g pm2"
fi
echo ""

echo "========================================================="
echo "   SISTEMA ACTUALIZADO AL 100% CON EXITO!"
echo "========================================================="
echo ""
echo "App Cloud:  https://lims-microlabs.web.app"
echo "API Local:  http://localhost:3001/health"
echo ""
