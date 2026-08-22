# Guía Completa de Configuración y Ejecución en Mac Mini (macOS)

Esta guía explica cómo ejecutar, mantener y autoiniciar el sistema **LIMS-PRO** en un servidor Mac Mini.

---

## 1. Requisitos Previos en Mac Mini

1. **Node.js (v18 o v20 LTS)**:
   Instala Node.js descargando el instalador oficial `.pkg` para macOS desde [nodejs.org](https://nodejs.org/).
2. **PM2 (Gestor de Procesos de Producción)**:
   Instala PM2 de forma global en la terminal de la Mac:
   ```bash
   sudo npm install -g pm2
   ```

---

## 2. Puesta en Marcha Rápida (Modo Desarrollo o Pruebas)

Abre la aplicación **Terminal** en la Mac Mini y navega a la carpeta del proyecto:

```bash
cd ~/lims-microlabs  # o la ruta donde clonaste el proyecto
chmod +x *.sh       # Otorga permisos de ejecución a los scripts
./iniciar.sh
```

Esto iniciará simultáneamente:
- **Frontend (Vite)**: `http://localhost:5173`
- **API Backend Express (SQLite)**: `http://localhost:3001`
- **Servidor Analizadores TCP (ASTM / HL7)**: `http://localhost:9000`

---

## 3. Puesta en Producción 24/7 con PM2

Para que el servidor API y los Analizadores funcionen en segundo plano las 24 horas y sobrevivan a reinicios del sistema:

1. **Compilar el Frontend y preparar producción**:
   ```bash
   ./actualizar_sistema.sh
   ```
2. **Iniciar servicios con PM2**:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   ```
3. **Configurar arranque automático al encender la Mac**:
   ```bash
   pm2 startup
   ```
   *Sigue la instrucción de la terminal (copia y pega el comando `sudo` que te entregará PM2).*

---

## 4. Acceso desde otros Equipos de la Red Local (LAN)

Para acceder a LIMS-PRO desde otras computadoras, iPhones, iPads o teléfonos en la misma red Wi-Fi/LAN:

1. Averigua la IP local de la Mac Mini ejecutando en su terminal:
   ```bash
   ipconfig getifaddr en0
   # Ejemplo de salida: 192.168.1.50
   ```
2. Desde cualquier navegador en la red local, ingresa a:
   - **Interfaz Web (Vite Dev)**: `http://192.168.1.50:5173`
   - **API Backend / Producción**: `http://192.168.1.50:3001`

---

## 5. Mantenimiento y Respaldos hacia NAS Synology (Casa)

- **Crear un respaldo manual de la Base de Datos**:
  ```bash
  ./respaldar_bd.sh
  ```
  Los respaldos se almacenan automáticamente en:
  1. Localmente en: `api/prisma/backups/`
  2. En el **NAS Synology**: Si montas la carpeta compartida en macOS (`smb://synology/Respaldos_LIMS` o `smb://192.168.0.x/Respaldos_LIMS`), la Mac Mini copiará automáticamente el snapshot atómico a `/Volumes/Respaldos_LIMS/`.

- **Reparar estado de la base de datos o puerto bloqueado**:
  ```bash
  ./reparar_sistema.sh
  ```

- **Actualizar a la última versión del repositorio**:
  ```bash
  ./actualizar_sistema.sh
  ```

---

## 6. Arquitectura del Ecosistema

1. **🍏 Mac Mini (Casa)**: Servidor Central 24/7 de LIMS-PRO (Express API, Base de Datos, Dashboards y Reportes).
2. **💾 NAS Synology (Casa)**: Repositorio central de respaldos atómicos diarios.
3. **🧪 PC Laboratorio (Windows)**: Estación de trabajo conectada físicamente al Analizador Clínico SNIBE (`192.168.0.24`).

