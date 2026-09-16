# 📘 Manual de Usuario y Guía de Protocolos Operativos — LIMS-PRO
### Laboratorio Microlabs Químicos S.A. | Cédula Jurídica: 3-101-144450

---

## 📑 Tabla de Contenidos
1. [Presentación del Sistema](#1-presentación-del-sistema)
2. [Directorio de Contactos y Canales Oficiales](#2-directorio-de-contactos-y-canales-oficiales)
3. [Líneas de Aprendizaje por Rol (Ruta de Capacitación)](#3-líneas-de-aprendizaje-por-rol-ruta-de-capacitación)
4. [Procedimientos Operativos Estándar (POEs / SOPs)](#4-procedimientos-operativos-estándar-poes--sops)
   - [POE-01: Recepción e Ingreso de Muestras](#poe-01-recepción-e-ingreso-de-muestras)
   - [POE-02: Conectividad con Analizadores y Carga de Resultados](#poe-02-conectividad-con-analizadores-y-carga-de-resultados)
   - [POE-03: Control de Calidad (QC) y Reglas de Westgard](#poe-03-control-de-calidad-qc-y-reglas-de-westgard)
   - [POE-04: Revisión, Interpretación LIMS-AI y Aprobación de Informes](#poe-04-revisión-interpretación-lims-ai-y-aprobación-de-informes)
   - [POE-05: Facturación Electrónica (Hacienda v4.4) y SINPE Móvil](#poe-05-facturación-electrónica-hacienda-v44-y-sinpe-móvil)
   - [POE-06: Portal de Autoconsulta de Clientes (Pacientes, Médicos, Empresas)](#poe-06-portal-de-autoconsulta-de-clientes-pacientes-médicos-empresas)
   - [POE-07: Protocolo de Contingencia (Modo Offline) y Respaldos](#poe-07-protocolo-de-contingencia-modo-offline-y-respaldos)
5. [Guía Rápida de Atajos de Teclado](#5-guía-rápida-de-atajos-de-teclado)

---

## 1. Presentación del Sistema

**LIMS-PRO** es la plataforma informática de gestión integral del **Laboratorio Microlabs Químicos S.A.** Diseñado bajo los lineamientos de la norma internacional **ISO/IEC 17025:2017** y las regulaciones sanitarias del **Ministerio de Salud de Costa Rica**, el sistema asegura la trazabilidad total de las muestras biológicas e industriales desde su recepción hasta la entrega y custodia digital del reporte final.

### Arquitectura de Acceso Segregado:
* **Entorno de Laboratorio (Staff):** Módulos analíticos, validación técnica, equipos de química/hematología, inventarios, auditoría y facturación.
* **Portal de Clientes (Autogestión):** Acceso seguro con doble factor (2FA) y validación de cédulas con el Tribunal Supremo de Elecciones (TSE), divididos en:
  * **Pacientes:** Consulta de exámenes personales, historial evolutivo y descarga de reportes oficiales.
  * **Médicos:** Expedientes acumulativos de pacientes referidos, alertas de pánico y evolución gráfica.
  * **Empresas (Industria / Alimentos / Aguas):** Solicitud de cotizaciones, estados de cuenta, trazabilidad de muestras y reportes en lote.

---

## 2. Directorio de Contactos y Canales Oficiales

Para validar y verificar la información que se plasma en encabezados, facturas y reportes:

| Canal / Departamento | Detalle Registrado en Sistema | Propósito / Uso |
| :--- | :--- | :--- |
| **Central Telefónica** | `+506 2234-8837` / `+506 2234-5862` / `+506 2224-6541` | Atención general, consultas médicas e informes de laboratorio |
| **WhatsApp Oficial** | `+506 7138-2750` | Envío rápido de resultados a pacientes y cotizaciones exprés |
| **Correo General** | `laboratorio@microlabscr.com` | Recepción de pedidos, contratos y correspondencia oficial |
| **Envío de Resultados** | `resultados@microlabscr.com` | Casilla automatizada para emisión de PDFs firmados |
| **Facturación Electrónica** | `fe@microlabscr.com` | Emisión y recepción de comprobantes electrónicos XML v4.4 |
| **Soporte TI / LIMS** | `soporte.sistemas@microlabs.com` | Asistencia de conectividad, analizadores y respaldos |
| **Dirección Sede Central** | 75 m Norte del Correo de Guadalupe, Goicoechea, San José | Instalaciones principales del laboratorio |
| **Sitio Web Oficial** | [www.microlabscr.com](https://www.microlabscr.com) | Portal web institucional |
| **Dirección Técnica** | Dr. Roldan Ajún Chaverri (Cód. 802) | Regente técnico y microbiólogo responsable |
| **Subdirección / Profesional 2**| Dr. José Guillermo Ajún Jiménez | Profesional en microbiología clínica |

---

## 3. Líneas de Aprendizaje por Rol (Ruta de Capacitación)

### 🟢 Nivel 1: Admisión y Recepción (Recepcionista / Asistente)
* **Objetivo:** Recibir al paciente o cliente empresarial, ingresar la orden sin errores tipográficos y emitir el comprobante.
* **Módulos obligatorios:**
  1. `Nuevo Ingreso (/new_request)`:
     - Búsqueda por cédula con botón TSE (autocompleta nombre completo).
     - Selección de análisis clínicos o paquetes industriales.
     - Asignación de procedencia (Sede, Médico Tratante, Empresa).
  2. `Clientes (/client_settings)`: Registro de clientes particulares y jurídicos con cédula jurídica.
  3. `Cotizaciones (/quotes)`: Emisión rápida de proformas con tarifario vigente.
* **Tiempo estimado de aprendizaje:** 2 horas.

---

### 🟡 Nivel 2: Área Técnica y Analítica (Bioquímico / Analista)
* **Objetivo:** Procesar las muestras, recibir los datos de analizadores automáticos, realizar cultivos microbiológicos y velar por el control de calidad.
* **Módulos obligatorios:**
  1. `Bandeja de Analizadores (/analyzer_inbox)`:
     - Monitoreo del puerto ASTM/HL7 (Analizador SNIBE Maglumi / Hematología).
     - Vinculación automática del resultado por código de barras de la muestra.
  2. `Transcripción Manual y Carga Masiva (/manual_form` y `/bulk_upload)`: Ingreso de pruebas manuales (Uroanálisis, Coprología, Pruebas Rápidas).
  3. `Fichas Microbiológicas (/microbiology)`:
     - Registro de aislamiento bacteriano, recuento de colonias y antibiogramas (Sensible/Intermedio/Resistente).
  4. `Control de Calidad (/qc)`:
     - Gráficos de Levey-Jennings por parámetro y lote de control.
     - Evaluación de alertas Westgard ($1_{3s}, 2_{2s}, R_{4s}, 10_x$).
  5. `Cadena de Frío e IoT (/cold_chain)`: Registro de temperaturas de congeladores y refrigeración de muestras.
* **Tiempo estimado de aprendizaje:** 4 horas.

---

### 🔵 Nivel 3: Validación Médica y Dirección Técnica (Director Técnico / Regente)
* **Objetivo:** Revisión clínica experta, interpretación con apoyo de LIMS-AI, firma digital y liberación final de reportes.
* **Módulos obligatorios:**
  1. `Revisión de Resultados (/results_review)`:
     - Filtro por estado: *En Proceso*, *Pendiente de Aprobación*, *Críticos*.
     - Alerta visual de valores de pánico (fuera de rango biológico de referencia).
  2. `Interpretación LIMS-AI`:
     - Generación de nota clínica explicativa preliminar.
     - Recomendación proactiva de pruebas complementarias diagnósticas.
  3. `Pre-Reporte y Reporte Final (/pre_report/:id` y `/final_report/:id)`:
     - Aprobación definitiva, estampa de firma electrónica autorizada y código QR de autenticidad.
  4. `Gestión de No Conformidades (/capa)`: Registro de acciones correctivas y preventivas ante desvíos.
* **Tiempo estimado de aprendizaje:** 3 horas.

---

### 🟣 Nivel 4: Facturación y Administración
* **Objetivo:** Liquidación de órdenes, caja diaria, facturación electrónica y conciliación bancaria.
* **Módulos obligatorios:**
  1. `Facturación (/billing)`:
     - Generación de Factura Electrónica (FE) / Tiquete Electrónico (TE) formato Hacienda v4.4.
     - Cobro mediante **SINPE Móvil** con validación del comprobante de 15 dígitos del BCCR y código QR dinámico.
  2. `Contabilidad y Cierres (/accounting)`: Reportes de ventas por sede, tipo de cliente y análisis más rentables.
  3. `Auditoría y Diagnóstico (/audit` y `/diagnostics)`: Revisión de bitácoras de acceso, cambios en resultados y estado de servicios.
* **Tiempo estimado de aprendizaje:** 2.5 horas.

---

## 4. Procedimientos Operativos Estándar (POEs / SOPs)

### POE-01: Recepción e Ingreso de Muestras
1. Solicitar identificación al paciente (Cédula nacional, DIMEX o Pasaporte).
2. Ingresar a `Nuevo Ingreso (/new_request)`.
3. Digitar los 9 dígitos de la cédula y presionar **Verificar TSE**. El sistema completará automáticamente el nombre oficial y fecha de nacimiento.
4. Seleccionar los exámenes solicitados en la orden médica o cotización.
5. Marcar si la muestra requiere condiciones especiales (Ayuno, Refrigeración, Muestra estéril).
6. Presionar **Guardar e Imprimir Etiquetas**. Adherir la etiqueta con código unívoco `MC-2026-XXXX` al tubo o frasco antes de remitirlo al área de proceso.

---

### POE-02: Conectividad con Analizadores y Carga de Resultados
1. Colocar los tubos rotulados en los racks del analizador clínico.
2. Iniciar la corrida en el analizador.
3. En el LIMS, abrir `Bandeja de Analizadores (/analyzer_inbox)`.
4. El analizador transmitirá los valores vía protocolo TCP/IP o serial hacia el middleware.
5. Verificar que los resultados coincidan con el identificador de muestra y presionar **Importar a Ficha de Resultados**.
6. En caso de parámetros fuera de linealidad del equipo, realizar la dilución estipulada e ingresar el factor de dilución en la pantalla de revisión.

---

### POE-03: Control de Calidad (QC) y Reglas de Westgard
1. Todos los días a primera hora (antes de procesar muestras de pacientes), correr los controles de nivel Normal y Patológico.
2. Ingresar a `Control de Calidad (/qc)`.
3. Ingresar las lecturas obtenidas para el lote activo.
4. Evaluar el gráfico de Levey-Jennings:
   - **Dentro de $\pm 2$ DE:** Corrida Aceptada. Se autoriza el inicio del procesamiento analítico.
   - **Violación de Regla $1_{3s}$ o $2_{2s}$:** Corrida Rechazada. Se debe recalibrar el analito, revisar reactivos y repetir el control. No se deben liberar muestras hasta subsanar la desviación.

---

### POE-04: Revisión, Interpretación LIMS-AI y Aprobación de Informes
1. Ingresar a `Revisión de Resultados (/results_review)`.
2. Verificar que todos los parámetros solicitados posean resultado numérico o cualitativo y unidades de medida correctas.
3. Si el paciente presenta anomalías clínicas complejas, activar **Asistente LIMS-AI** para redactar una sugerencia de correlación clínica y pruebas complementarias orientadas al médico.
4. Si todo es conforme, presionar **Aprobar y Firmar**.
5. El sistema generará el PDF final bloqueado con hash criptográfico, código QR de verificación pública y notificará al paciente vía correo electrónico y portal web.

---

### POE-05: Facturación Electrónica (Hacienda v4.4) y SINPE Móvil
1. Desde la orden de trabajo, hacer clic en **Cobrar / Facturar**.
2. Elegir el método de pago:
   - **Efectivo / Tarjeta:** Emisión directa.
   - **SINPE Móvil:** Se despliega el código QR con el número oficial de Microlabs (`7138-2750`). El cliente transfiere y el cajero digita los 15 dígitos de la referencia bancaria para conciliación automática.
3. El sistema valida el XML ante el Ministerio de Hacienda (v4.4 con código de actividad económica y tarifa de IVA de servicios de salud al 4%).
4. El comprobante electrónico es enviado de forma automática al correo del cliente.

---

### POE-06: Portal de Autoconsulta de Clientes (Pacientes, Médicos, Empresas)
1. El cliente ingresa desde su celular o computadora a: [https://lims-microlabs.web.app](https://lims-microlabs.web.app).
2. Selecciona **Portal Clientes** y digita su correo o cédula registrada.
3. Introduce el código de seguridad (2FA) recibido.
4. Tendrá a su disposición:
   - Visualización y descarga inmediata de sus informes aprobados en formato PDF.
   - Consulta de muestras pendientes en proceso con línea de trazabilidad en tiempo real.
   - Pago en línea o reporte de comprobante SINPE si la muestra tuviese saldo pendiente.

---

### POE-07: Protocolo de Contingencia (Modo Offline) y Respaldos
1. **Caída de Internet:**
   - El sistema opera de manera autónoma en la red de área local (LAN) utilizando la base de datos SQLite integrada.
   - Todo trabajo realizado en modo offline se almacena localmente y se sincroniza automáticamente al restablecerse el enlace.
2. **Respaldo Atómico Diario:**
   - Al cerrar la jornada, ejecutar en el servidor el script [`respaldar_bd.bat`](file:///c:/lims-microlabs/respaldar_bd.bat) o [`sync_nas.bat`](file:///c:/lims-microlabs/sync_nas.bat).
   - El sistema creará una copia instantánea libre de bloqueos en `api/prisma/backups/` y en el **NAS Synology**.

---

## 5. Guía Rápida de Atajos de Teclado

Para maximizar la velocidad operativa en el laboratorio:

| Atajo | Acción en LIMS-PRO |
| :---: | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Abrir la **Paleta de Comandos Global** (busca pacientes, muestras y vistas al instante) |
| <kbd>Ctrl</kbd> + <kbd>/</kbd> | Desplegar el modal de atajos de teclado |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | Imprimir el reporte o formulario activo |
| <kbd>Esc</kbd> | Cerrar cualquier ventana emergente o modal activo |

---
*Manual elaborado para el personal técnico, administrativo y clientes de Laboratorio Microlabs Químicos S.A.*
