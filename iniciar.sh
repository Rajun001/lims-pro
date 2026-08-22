#!/bin/bash
# ===================================================
# LIMS-PRO - Script de Inicio para macOS / Mac Mini
# ===================================================

echo "==================================================="
echo "             INICIANDO SISTEMA LIMS-PRO            "
echo "==================================================="
echo ""

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no está instalado en este Mac."
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

# 2. Verificar dependencias de Node
if [ ! -d "node_modules" ]; then
    echo "[INFO] Instalando dependencias de Node.js..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Falló la instalación de dependencias."
        exit 1
    fi
fi

# 3. Sincronizar Base de Datos SQLite (Prisma)
if [ -d "api" ]; then
    echo "[INFO] Sincronizando esquema de Base de Datos SQLite..."
    (cd api && npx prisma db push)
fi

echo ""
echo "[INFO] Iniciando Frontend (Puerto 5173), API Backend (Puerto 3001) y Analizadores (Puerto 9000)..."
echo "[INFO] Abre en tu navegador: http://localhost:5173"
echo ""

npm run dev
