# 🛠️ Catálogo de Scripts y Automatizaciones — LIMS-PRO

Este directorio contiene las herramientas de automatización, diagnóstico, integración con QuickBooks y mantenimiento de **LIMS-PRO (Laboratorio Microlabs Químicos S.A.)**.

---

## 📑 Clasificación por Categorías

### 1. 💼 QuickBooks Desktop & Conector QODBC
Scripts encargados del enlace local con QuickBooks Enterprise / Pro para extracción y sincronización de clientes, cotizaciones y facturación:

| Script | Descripción |
| :--- | :--- |
| `test_qodbc.ps1` | Prueba la conexión DSN de 32/64 bits con el controlador QODBC. |
| `test_qodbc_32.ps1` | Diagnóstico específico para el runtime de 32 bits de Sybase iAnywhere / QODBC. |
| `fetch_qb_estimates.ps1` | Extrae cotizaciones (Estimates) recientes desde la base de QuickBooks activa. |
| `auto_authorize_and_connect.ps1` | Automatiza el diálogo de permisos de aplicaciones integradas en QuickBooks. |
| `close_all_qb_windows.ps1` | Cierra de manera limpia las ventanas internas de QuickBooks para evitar bloqueos modales. |
| `dismiss_modals.ps1` | Descarta diálogos de confirmación pendientes en la interfaz de QuickBooks. |
| `clean_qb_and_test_conn.ps1` | Resetea sesiones colgadas y valida la reconexión con el archivo de empresa `.QBW`. |

---

### 2. 🔍 Diagnóstico, Salud y Verificación
Herramientas para auditar la integridad operativa del sistema completo:

| Script | Descripción |
| :--- | :--- |
| `check_integrity.ps1` | Verificación general: puertos (5173, 3001, 8080), servicios PM2, SQLite WAL y dependencias. |
| `verify_system.cjs` | Prueba sintética de rutas del backend y respuesta de endpoints de API. |
| `check_recent_dates.cjs` | Audita las fechas de ingreso de muestras recientes y consistencia de zona horaria. |
| `count_db.cjs` | Consulta rápida de conteo de registros en la base de datos SQLite y Firestore. |

---

### 3. 📦 Trazabilidad de Versiones & Compilación
Utilidades ejecutadas automáticamente en el ciclo de vida de `npm run build` o despliegue:

| Script | Descripción |
| :--- | :--- |
| `generate_version.js` | Genera los sellos de versión sincronizados en `src/version.json`, `api/version.json` y `public/version.json` usando el hash de Git y correlativo de compilación. |

---

### 4. 📂 Migración de Archivos & Limpieza
Scripts para procesamiento y normalización de información histórica (IONOS HiDrive, Excel, etc.):

| Script | Descripción |
| :--- | :--- |
| `migrate_all_hidrive_full.cjs` | Script de migración masiva desde las unidades compartidas de IONOS HiDrive. |
| `reclassify_and_clean.cjs` | Limpieza y clasificación automática de registros (Pacientes Clínicos vs Empresas Industriales). |
| `ingest_estimate_131474.cjs` | Ingesta y correlación de cotizaciones específicas con solicitudes del LIMS. |

---

### 5. 🛡️ Mantenimiento del Sistema Operativo (`scripts/maintenance/`)
| Script | Descripción |
| :--- | :--- |
| `chrome_remote_watchdog.ps1` | Guardián para asegurar la disponibilidad continua de Chrome Remote Desktop. |
| `reparar_windows_completo.ps1` | Ejecuta DISM (`RestoreHealth`) y SFC (`scannow`) para estabilizar Windows Server/Desktop. |

---

### 🗄️ Carpeta `scripts/test_artifacts/`
Directorio local ignorado por Git donde se almacenan capturas temporales (`.png`), volcados de prueba (`.log`) y PDFs de muestra generados durante diagnósticos analíticos.
