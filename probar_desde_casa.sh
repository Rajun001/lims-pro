#!/bin/bash
echo "==================================================="
echo "    CONFIGURANDO ACCESO EXTERNO PARA LIMS-PRO    "
echo "==================================================="
echo ""
echo "Este asistente preparara la version de produccion local"
echo "y creara un tunel seguro para que puedas probar el sistema"
echo "desde tu casa de forma inmediata y sin configurar el router."
echo ""

# Verificar si Node.js esta instalado
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js no esta instalado en este sistema."
    exit 1
fi

echo "[1/3] Compilando la interfaz del Frontend (Vite)..."
echo ""
npm run build
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Hubo un problema al compilar el proyecto."
    exit 1
fi
echo ""
echo "[✓] Frontend compilado con exito."
echo ""

echo "[2/3] Iniciando el servidor API y sirviendo la Web (Puerto 3001)..."
echo ""
echo "[INFO] Iniciando el servicio local..."
echo ""

echo "==================================================="
echo "[3/3] ABRIENDO TUNEL SEGURO DESDE TU CASA..."
echo "==================================================="
echo ""
echo "Instrucciones:"
echo "1. Una vez que inicie, busca la linea que contiene \".lhr.life\" (ej. https://xxxx.lhr.life)"
echo "2. Abre esa URL en el navegador de tu casa o en tu celular."
echo "3. ¡Listo! Accede de forma directa y sin contraseñas."
echo ""
echo "Iniciando servidores... presiona Ctrl+C para terminar."
echo ""

npx concurrently --kill-others "node api/index.js" "ssh -N -T -o StrictHostKeyChecking=no -R 80:localhost:3001 nokey@localhost.run"
