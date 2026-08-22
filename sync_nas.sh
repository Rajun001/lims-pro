#!/bin/bash
# ================================================================
# Sincronizador de Respaldos LIMS hacia NAS Synology (Mac Mini)
# ================================================================
cd "$(dirname "$0")"

echo ""
echo "Iniciando sincronización con NAS Synology..."
echo ""

node scripts/sync_nas_synology.mjs

echo ""
