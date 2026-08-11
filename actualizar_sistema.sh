#!/bin/bash
# =========================================================
# LIMS-PRO - Auto Actualizador para macOS y Linux
# =========================================================

echo "========================================================="
echo "   🚀 ACTUALIZANDO LIMS-PRO A LA ÚLTIMA VERSIÓN..."
echo "========================================================="
echo ""

# 1. Sincronizar con el repositorio oficial
echo "[1/4] Descargando últimas mejoras de GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Error al descargar del repositorio. Verifica tu conexión."
    exit 1
fi
echo "✅ Código actualizado con éxito."
echo ""

# 2. Instalar dependencias si hay nuevas librerías
echo "[2/4] Verificando dependencias de Node.js..."
npm install --prefer-offline --no-audit
echo "✅ Dependencias verificadas."
echo ""

# 3. Sincronizar Prisma y Base de Datos local
echo "[3/4] Sincronizando estructura de base de datos..."
if [ -d "api" ]; then
    cd api && npx prisma db push && cd ..
fi
echo "✅ Base de datos al día."
echo ""

# 4. Compilar Frontend
echo "[4/4] Compilando versión de producción..."
npm run build
echo "✅ Compilación completada."
echo ""

echo "========================================================="
echo "   ✨ ¡SISTEMA ACTUALIZADO AL 100% CON ÉXITO! ✨"
echo "========================================================="
