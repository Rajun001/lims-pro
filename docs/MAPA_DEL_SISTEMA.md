# 🗺️ Mapa Integral del Sistema y Guía de Reparaciones — LIMS-PRO

**Laboratorio Microlabs Químicos S.A.** | Cédula Jurídica: `3-101-144450`  
Sede Central: 75m Norte del Correo de Guadalupe, Goicoechea, San José, Costa Rica.  
Central Telefónica: `(506) 2234-8837` / `2234-5862` / `2224-6541` | WhatsApp: `+506 7138-2750`  
Correos Oficiales: `resultados@microlabscr.com` / `laboratorio@microlabscr.com`

---

## 📌 Propósito de este Documento

Este mapa técnico permite a cualquier desarrollador, microbiólogo administrador o agente de IA **ubicar de inmediato** cada componente, servicio, constante de laboratorio o base de datos del sistema para efectuar mantenimientos, ampliaciones y reparaciones sin riesgo de desconfiguración.

---

## 🧭 Estructura General del Proyecto

```
c:\lims-microlabs\
├── src/                        # FRONTEND (React 19 + Vite + Tailwind CSS)
│   ├── views/                  # Vistas principales de navegación
│   ├── components/             # Componentes modulares, modales y widgets
│   ├── constants/              # Criterios normativos, equipos, clientes y firmas
│   ├── services/               # Conexión con Firestore y Gemini AI
│   ├── layouts/                # Barra superior (TopBar) y barra lateral (Sidebar)
│   └── utils/                  # Funciones de cálculo clínico y utilidades
│
├── api/                        # BACKEND (Node.js + Express + Prisma ORM)
│   ├── routes/                 # Endpoints REST (CRM, reportes, sincronización QB)
│   ├── services/               # Lógica de negocio (QuickBooks watcher, recordatorios)
│   └── prisma/                 # Esquema Prisma y base local dev.db (SQLite WAL)
│
├── analyzer-service/           # MICROSERVICIO DE ANALIZADORES CLÍNICOS
│   └── Sockets TCP directos para Mindray BC-5000, Cobas c111 (ASTM E1394 / HL7)
│
├── scripts/                    # AUTOMATIZACIONES Y DIAGNÓSTICOS
│   ├── maintenance/            # Reparaciones del SO Windows y Remote Desktop
│   └── test_artifacts/         # Capturas y logs temporales (ignorado por Git)
│
├── docs/                       # MANUALES Y GUÍAS DE OPERACIÓN
│   ├── MAPA_DEL_SISTEMA.md     # (Este archivo) Directorio maestro del sistema
│   ├── MANUAL_DE_USUARIO_LIMS.md # Manual operativo para personal del laboratorio
│   └── MAC_MINI_SETUP.md       # Configuración para estaciones secundarias
│
├── panel_control.bat           # Menú interactivo de Windows para administración
└── package.json                # Dependencias y scripts de compilación
```

---

## 📍 Directorio de Archivos Clave del Frontend (`src/`)

### 1. Vistas Principales (`src/views/`)
| Vista | Archivo | Función |
| :--- | :--- | :--- |
| **Informe Final** | [`FinalReportView.jsx`](file:///c:/lims-microlabs/src/views/FinalReportView.jsx) | Generador oficial de certificados de análisis clínicos e industriales (COA), firmas electrónicas, evaluación con IA, selector de normas RTCA y código QR. |
| **Gestor CRM / Clientes** | [`CRMView.jsx`](file:///c:/lims-microlabs/src/views/CRMView.jsx) | Expedientes de pacientes clínicos y empresas de alimentos, sincronización con QuickBooks y pre-carga industrial. |
| **Parque de Equipos** | [`EquipmentView.jsx`](file:///c:/lims-microlabs/src/views/EquipmentView.jsx) | Inventario de los 12 equipos oficiales, trazabilidad metrológica y alertas de calibración. |
| **Bandeja de Analizadores**| [`AnalyzerInboxView.jsx`](file:///c:/lims-microlabs/src/views/AnalyzerInboxView.jsx) | Recepción de resultados ASTM/HL7 e importador para SNIBE Maglumi X3 (.xlsx). |
| **Control de Calidad (QC)**| [`QCView.jsx`](file:///c:/lims-microlabs/src/views/QCView.jsx) | Gráficos de Levey-Jennings, reglas multirule de Westgard y bitácora de calibración. |
| **Facturación & Cotizaciones**| [`BillingView.jsx`](file:///c:/lims-microlabs/src/views/BillingView.jsx) | Facturación electrónica costarricense (Factura Profesional / Tiquete) y enlace contable. |
| **Configuración General** | [`LabSettings.jsx`](file:///c:/lims-microlabs/src/views/LabSettings.jsx) | Datos de acreditación, logotipos, directores técnicos y personal autorizado. |

---

### 2. Catálogos y Constantes Maestras (`src/constants/`)
**Modifica estos archivos para actualizar reglas del negocio sin tocar la interfaz:**

* [`microbiologyStandards.js`](file:///c:/lims-microlabs/src/constants/microbiologyStandards.js): Criterios microbiológicos oficiales (RTCA 67.04.50:08, Decreto 38924-S, luminometría 3M Clean-Trace, superficies, ambientes).
* [`officialEquipment.js`](file:///c:/lims-microlabs/src/constants/officialEquipment.js): Ficha técnica y números de serie de los 12 equipos de Microlabs (Mindray, Cobas, Maglumi, 3M MDS, Memmert, etc.).
* [`preloadedClients.js`](file:///c:/lims-microlabs/src/constants/preloadedClients.js): Directorio maestro de las **57 empresas agroalimentarias e industriales** atendidas por Microlabs (Prosalud, Taco Bell, AMPM, Sigma, Inolasa, Britt, Bridgestone, etc.) con sus códigos y correos oficiales.
* [`bankAccounts.js`](file:///c:/lims-microlabs/src/constants/bankAccounts.js): Cuentas bancarias oficiales para cobros e IBAN de Microlabs Químicos S.A. (BNCR Colones/Dólares, BAC San José Colones/Dólares y SINPE Móvil 7138-2750).
* [`signatures.js`](file:///c:/lims-microlabs/src/constants/signatures.js): Catálogo de profesionales autorizados (Dr. Roldán Ajún, MQC José Guillermo Ajún, MQC Roldán Alberto Ajún) y combinaciones de firma.
* [`evidenceData.js`](file:///c:/lims-microlabs/src/constants/evidenceData.js): Banco fotográfico y evidencias microbiológicas para informes industriales.

---

### 3. Componentes Especializados (`src/components/`)
* [`QualityLibraryModal.jsx`](file:///c:/lims-microlabs/src/components/QualityLibraryModal.jsx): Ventana modal con las acreditaciones institucionales, Cédula Jurídica 3-101-144450, licencias del Ministerio de Salud, CVO MAG/SENASA, ensayos de aptitud AOAC LPTP e INCIENSA, y POEs.
* [`MaglumiImporter.jsx`](file:///c:/lims-microlabs/src/components/MaglumiImporter.jsx): Analizador inteligente de archivos Excel emitidos por el quimioluminiscímetro SNIBE Maglumi X3 / 600.
* [`AnalyticalSafetyGuard.jsx`](file:///c:/lims-microlabs/src/components/AnalyticalSafetyGuard.jsx): Sistema de prevención de errores analíticos y verificación de integridad previa a la firma del reporte.
* [`ReportSignatures.jsx`](file:///c:/lims-microlabs/src/components/ReportSignatures.jsx): Bloque dual de firmas con sellos digitales y códigos del Colegio de Microbiólogos.

---

## 🗄️ Fuentes de Datos y Almacenamiento

1. **Google Cloud Firestore (Base Principal)**:
   - Colección `lims_requests`: Solicitudes analíticas, resultados de laboratorio e historial.
   - Colección `lims_clients`: Expedientes clínicos y cuentas corporativas.
   - Colección `lims_equipment`: Estado y calibraciones de los analizadores.
   - Colección `lab_settings`: Parámetros institucionales del laboratorio.

2. **Base Local SQLite WAL (`api/prisma/dev.db`)**:
   - Empleada para alta velocidad de lectura, réplicas y sincronización fuera de línea con QuickBooks Desktop.

3. **Almacenamiento en Red NAS Synology (`Unidad Z:`)**:
   - Destino de las copias de seguridad automáticas ejecutadas vía `respaldar_bd.bat` y `sync_nas.bat`.

4. **Repositorio Institucional IONOS HiDrive (`C:\IONOS HiDrive`)**:
   - Ubicación en disco del archivo histórico: manuales de equipos, listas de proveedores, facturas de compra y procedimientos POE originales.

---

## 🔧 Guía Rápida de Reparaciones Comunes

### 1. ¿Cómo cambiar o corregir los firmantes de un reporte?
- Abre [`src/constants/signatures.js`](file:///c:/lims-microlabs/src/constants/signatures.js).
- En `MICROBIOLOGISTS_CATALOG` puedes actualizar los nombres, códigos del Colegio de Microbiólogos (MQC), cargos o imágenes de firma escaneadas.
- En [`src/views/FinalReportView.jsx`](file:///c:/lims-microlabs/src/views/FinalReportView.jsx), el usuario puede alternar en tiempo real entre firma única o firma compartida en la barra de herramientas.

### 2. ¿Cómo agregar o modificar un límite microbiológico (RTCA o Agua)?
- Abre [`src/constants/microbiologyStandards.js`](file:///c:/lims-microlabs/src/constants/microbiologyStandards.js).
- Localiza la matriz (por ejemplo `queso_fresco` o `agua_potable_decreto_38924_s`).
- Ajusta los límites permisibles ($m, M$), el plan de muestreo ($n, c$) o el método de ensayo. El informe final actualizará inmediatamente su evaluación de conformidad.

### 3. ¿Cómo registrar o re-calibrar un analizador?
- Ve al módulo **Equipos** en el LIMS (`/equipment`).
- Para restablecer los 12 instrumentos oficiales de fábrica, presiona el botón **"Restaurar Parque Oficial (12 Equipos)"**.
- Para editar números de serie o frecuencias de calibración, el archivo de configuración es [`src/constants/officialEquipment.js`](file:///c:/lims-microlabs/src/constants/officialEquipment.js).

### 4. ¿Cómo importar resultados del Maglumi X3 sin escribir a mano?
- Ve a **Recepción de Analizadores** (`/analyzer-inbox`).
- Haz clic en **"Importar Maglumi X3 (.xlsx)"** y selecciona el archivo exportado por el equipo. El sistema vinculará automáticamente las concentraciones y unidades a las muestras pendientes.

### 5. ¿Cómo verificar la salud del código tras realizar un cambio?
Ejecuta en la terminal de la raíz:
```cmd
npm run lint
npm run build
```
Ambos comandos deben finalizar con código `0` (sin errores de sintaxis ni fallos de importación).

---

## 🚀 Acceso Rápido del Operador
En caso de fallo general del servidor en Windows, haz doble clic en [`panel_control.bat`](file:///c:/lims-microlabs/panel_control.bat) y utiliza la opción **`[6] Diagnóstico y Reparación Integral`** o **`[1] Iniciar Entorno Completo`**.
