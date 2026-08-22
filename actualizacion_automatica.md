# Guía de Actualización Automática y Periódica — LIMS-PRO

Esta guía describe la arquitectura de actualización desatendida del sistema LIMS-PRO para mantener la aplicación y la base de datos sincronizadas con el repositorio sin riesgo de pérdida de datos.

---

## 🔄 Flujo del Proceso de Actualización (6 Pasos)

Cada ciclo de actualización ejecuta de forma segura los siguientes pasos:

1. **`git pull origin main`**: Descarga las últimas mejoras del código fuente.
2. **`npm install --prefer-offline --no-audit`**: Actualiza y verifica dependencias de Node.js.
3. **`Copia de Seguridad Pre-Actualización`**: Genera un respaldo instantáneo SQLite mediante `VACUUM INTO` almacenado en `api/prisma/backups/` con etiquetado `PRE_UPDATE`.
4. **`npx prisma db push`**: Sincroniza y aplica migraciones a la estructura de la base de datos local SQLite.
5. **`npm run build`**: Compila la versión de producción del Frontend (Vite).
6. **`pm2 reload ecosystem.config.cjs`**: Reinicia progresivamente la API y el Servicio Analizador sin caída de servicio.

Adicionalmente, cada ejecución registra su resultado en `logs/actualizaciones.log`.

---

## ⏰ Opciones de Programación Periódica

### 1. Tarea Programada en Windows (Programador de Tareas)
Para programar la actualización automática todas las madrugadas a las **3:00 AM** en un servidor Windows:
- Ejecuta como Administrador el script:
  ```cmd
  programar_actualizacion_windows.bat
  ```
- O crea manualmente la tarea ejecutable:
  ```cmd
  schtasks /create /tn "LIMS_Pro_Auto_Update" /tr "\"C:\lims-microlabs\actualizar_sistema.bat\" --silent" /sc daily /st 03:00 /f
  ```

### 2. Cron en Mac Mini / Linux
Para servidores macOS / Linux:
```bash
crontab -e
```
Añadir la siguiente línea (ejecución diaria a las 03:00 AM):
```cron
0 3 * * * cd /ruta/a/lims-microlabs && ./actualizar_sistema.sh >> logs/cron_update.log 2>&1
```

### 3. Agente AI Antigravity
El agente AI tiene registrado el temporizador `cron: 0 3 * * *` para monitorear y verificar la integridad de las actualizaciones de forma continua.

---

## 🛡️ Seguridad y Recuperación de Respaldos

Si una actualización sufriera alguna falla, la base de datos SQLite puede restaurarse inmediatamente desde el último respaldo en `api/prisma/backups/lims_backup_<TIMESTAMP>_PRE_UPDATE.db`.

---

## 🏷️ Sistema de Trazabilidad de Versiones y Diagnóstico

Para garantizar el rastreo de cualquier error y facilitar correcciones:

- **Generador de Sello de Versión**: [scripts/generate_version.js](file:///c:/lims-microlabs/scripts/generate_version.js) inyecta la versión semántica (e.g. `v2.5.0`), el commit hash de Git (`git rev-parse --short HEAD`), el contador de compilaciones y la fecha exacta en `version.json`.
- **Endpoints de Diagnóstico**:
  - `GET /health`: Estado general, versión con commit hash y uptime de la API.
  - `GET /api/version`: Metadatos completos en formato JSON.
- **Interfaz Frontend**: Muestra en la parte inferior del menú lateral (`Sidebar`) la versión exacta activa (ej. `v2.5.0-b10` `#f5a427e`) y notifica automáticamente al usuario mediante `VersionUpdateNotifier` cuando hay una nueva actualización lista.

