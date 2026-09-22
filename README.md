# 🔬 LIMS-PRO — Sistema de Gestión de Laboratorio Clínico y Microbiología Industrial

**Laboratorio Microlabs Químicos S.A.** | Cédula Jurídica: `3-101-144450`  
San José, Costa Rica | Conforme a normas **ISO/IEC 17025:2017**, **ISO 15189** y **21 CFR Part 11**.

---

## 📌 Descripción General

**LIMS-PRO** es una plataforma de software integral de última generación diseñada específicamente para centralizar, automatizar y auditar todos los flujos de trabajo de un laboratorio analítico dual:

1. **Química Clínica y Hematología**:
   - Conexión directa TCP con autoanalizadores mediante protocolos **ASTM E1394** y **HL7 v2.x**.
   - Motor de validación biológica y rangos de referencia circadianos/por edad y sexo.
   - Control de Calidad Analítico con gráficos de **Levey-Jennings** y reglas de **Westgard multirule**.
   - Firma electrónica criptográfica con PIN de 2º factor conforme a **21 CFR Part 11**.
   - Notificaciones y entrega de informes vía WhatsApp Cloud API y correo electrónico.

2. **Microbiología Industrial y Farmacéutica**:
   - Estudios de **Vida Útil / Estabilidad** en tiempo real bajo condiciones climáticas RTCA.
   - Ensayos de Eficacia Antimicrobiana (**Challenge Test USP <51> / ISO 11930**).
   - Planes de muestreo personalizados para la industria alimentaria, hotelera y cosmética.
   - Emisión de Certificados de Análisis (**COA**) industriales con firma digital y códigos QR verificables.

---

## 🧭 Centro de Mando: `panel_control.bat`

Para facilitar la administración diaria sin requerir comandos de terminal, el sistema incluye una consola interactiva en la raíz:

```bash
panel_control.bat
```

Desde este menú se puede acceder con una sola tecla a:
- `[1]` Iniciar el entorno de desarrollo completo.
- `[2]` Actualizar el sistema a la última versión con respaldo automático previo.
- `[3]` Generar una copia de seguridad SQLite instantánea (`VACUUM INTO`).
- `[4]` Sincronizar los respaldos al servidor NAS Synology (Unidad `Z:`).
- `[5]` Habilitar túnel seguro para pruebas remotas desde el hogar.
- `[6]` Diagnóstico y reparación integral de Windows (DISM / SFC / Defender).
- `[7]` Herramientas de mantenimiento avanzado y servicio de escritorio remoto.
- `[8]` Apertura directa del Manual de Usuario oficial.

---

## 📂 Arquitectura del Repositorio

El sistema sigue una arquitectura modular y organizada:

| Directorio | Propósito |
| :--- | :--- |
| [`src/`](file:///c:/lims-microlabs/src) | **Frontend React 19**: Vistas de laboratorio, portales de pacientes y médicos, calculadoras analíticas, gráficos y componentes UI (Tailwind CSS). |
| [`api/`](file:///c:/lims-microlabs/api) | **Backend Express + Prisma ORM**: Controladores, servicios de auditoría, facturación electrónica, base de datos SQLite con modo WAL de alto rendimiento. |
| [`analyzer-service/`](file:///c:/lims-microlabs/analyzer-service) | **Microservicio de Analizadores**: Servidor de sockets TCP para recepción continua de tramas ASTM y HL7 de equipos clínicos. |
| [`middleware/`](file:///c:/lims-microlabs/middleware) | Conectores de integración entre analizadores locales y sincronización de eventos. |
| [`docs/`](file:///c:/lims-microlabs/docs) | **Documentación Oficial**: Manuales operativos (POEs), guía de actualizaciones, configuraciones de servidor y despliegue. |
| [`scripts/`](file:///c:/lims-microlabs/scripts) | Scripts de automatización, trazabilidad de versiones, respaldos periódicos y guardianes (watchdogs) de sistema. |
| [`scripts/maintenance/`](file:///c:/lims-microlabs/scripts/maintenance) | Herramientas especializadas de mantenimiento de Chrome Remote Desktop y reparaciones de Windows. |
| [`samples/`](file:///c:/lims-microlabs/samples) | Archivos de prueba y plantillas (ejemplos de facturación QuickBooks, formularios PDF y tarifarios). |
| [`installers/`](file:///c:/lims-microlabs/installers) | Instaladores locales de herramientas auxiliares (Chrome Remote Desktop Host, etc.). |
| [`logs/`](file:///c:/lims-microlabs/logs) | Registros de ejecución de servicios PM2, auditoría de actualizaciones y bitácoras del sistema. |
| [`public/`](file:///c:/lims-microlabs/public) | Activos estáticos públicos, iconos PWA, Service Worker y sellos de versión. |

---

## 🚀 Inicio Rápido

### En Windows (Servidor o Estación de Trabajo del Laboratorio):
1. **Modo Gráfico**: Haz doble clic en [`panel_control.bat`](file:///c:/lims-microlabs/panel_control.bat) o [`iniciar.bat`](file:///c:/lims-microlabs/iniciar.bat).
2. **Modo Terminal**:
   ```cmd
   npm.cmd run dev
   ```
3. Accede en el navegador a: **`http://localhost:5173`**

### En macOS / Linux (Mac Mini):
```bash
chmod +x *.sh
./iniciar.sh
```

---

## 🛠️ Comandos Principales de NPM

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia Frontend (Vite), API (Express) y Analyzer Service en paralelo. |
| `npm run build` | Genera el sello de versión y compila la versión de producción optimizada del Frontend. |
| `npm run start:prod` | Inicia todos los servicios en segundo plano 24/7 utilizando PM2 (`ecosystem.config.cjs`). |
| `npm run stop:prod` | Detiene de forma segura los servicios gestionados por PM2. |
| `npm run lint` | Analiza el código con ESLint bajo estándares estrictos de calidad. |
| `npm run preview` | Previsualiza localmente el paquete de producción generado en `dist/`. |

---

## 📚 Documentación y Guías

Toda la documentación técnica y operativa está disponible en la carpeta [`docs/`](file:///c:/lims-microlabs/docs):

1. 📘 [**Manual de Usuario y POEs Operativos**](file:///c:/lims-microlabs/docs/MANUAL_DE_USUARIO_LIMS.md): Protocolos estándar (POE-01 al POE-07) para recepción de muestras, QC, validación médica, facturación Hacienda v4.4 y contingencia offline.
2. 🔄 [**Guía de Actualización Automática**](file:///c:/lims-microlabs/docs/actualizacion_automatica.md): Arquitectura de auto-actualización, tareas programadas en Windows y cron jobs.
3. ☁️ [**Guía de Despliegue en Firebase Hosting**](file:///c:/lims-microlabs/docs/deploy.md): Pasos para publicar la aplicación SPA en la nube.
4. 🍏 [**Configuración en Mac Mini (macOS)**](file:///c:/lims-microlabs/docs/MAC_MINI_SETUP.md): Configuración de entorno 24/7 y acceso LAN en servidores Apple Silicon.

---

## 🛡️ Seguridad, Respaldos y Resiliencia

- **Base de Datos SQLite en Modo WAL**: Configurada para alta concurrencia (`busy_timeout = 5000`, `PRAGMA synchronous = NORMAL`).
- **Respaldos Atómicos**: El script [`respaldar_bd.bat`](file:///c:/lims-microlabs/respaldar_bd.bat) utiliza `VACUUM INTO` para generar copias 100% íntegras sin detener las operaciones.
- **Réplica Automática en NAS**: Los respaldos se copian automáticamente al NAS Synology (Unidad `Z:\Respaldos_LIMS` o ruta de red).
- **Trazabilidad 21 CFR Part 11**: Registro inmutable de cada acción con estampas de tiempo, usuario, valores previos, valores nuevos y hash SHA-256.

---

© 2026 **Laboratorio Microlabs Químicos S.A.** Todos los derechos reservados.
