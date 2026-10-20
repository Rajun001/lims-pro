# 🛡️ PLAN DE CONTINUIDAD DEL NEGOCIO Y RECUPERACIÓN ANTE DESASTRES (DRP)
## Laboratorio Microlabs Costa Rica — LIMS-PRO & QuickBooks

> **Escenario Crítico:** Pérdida total del equipo físico actual (daño de hardware, robo, incendio, inundación o fallo irrecuperable del sistema operativo).  
> **Objetivo:** Restablecer el 100% de la operatividad del laboratorio (LIMS-PRO + QuickBooks) en una computadora nueva en un tiempo estimado de **15 a 30 minutos**.

---

## 1. Diagnóstico de Supervivencia: ¿Dónde están mis datos ahora mismo?

Si este equipo físico desapareciera en este instante, **ningún dato crítico se pierde** porque la arquitectura ya cuenta con triple capa de redundancia remota fuera de las instalaciones físicas:

| Componente Crítico | Ubicación en la PC Actual | Destino en la Nube / Fuera del Sitio | Frecuencia de Respaldo |
| :--- | :--- | :--- | :--- |
| **Código Fuente del Sistema** | `C:\lims-microlabs` | **GitHub Cloud Privado:**<br>`https://github.com/Rajun001/lims-pro.git` | En cada actualización y commit |
| **Base de Datos LIMS-PRO** | `C:\lims-microlabs\api\prisma\dev.db` | **Nube IONOS HiDrive (Alemania/Global):**<br>`\\microlabshp.webdav.hidrive.ionos.com@SSL\DavWWWRoot\Publica\Respaldos_LIMS\` | Automático cada 24h y en cada arranque (`lims_backup_*.db`) |
| **QuickBooks Empresarial** | `C:\quickbooks2010\alimentos10.QBW` | **Nube IONOS HiDrive:**<br>`C:\IONOS HiDrive\users\microlabshp\BACKUPALIMENTOS\` | Archivos comprimidos `.QBB` (ej. `alimentos10 (Backup ...).QBB`) |
| **Documentos y PDF Históricos** | `C:\Users\HP LAB\Desktop\revisar\...` | **Nube IONOS HiDrive:**<br>`C:\IONOS HiDrive\Publica\Laboratorio\` | Sincronizado en tiempo real por el servicio HiDrive |

---

## 2. Requisitos Previos en la Nueva Computadora

Para restablecer el sistema en una máquina nueva (o temporal):
1. **Sistema Operativo:** Windows 10 u 11 (64 bits).
2. **Software Base:**
   - **Node.js LTS** (versión 20 o 22): Descargar desde [nodejs.org](https://nodejs.org).
   - **Git para Windows**: Descargar desde [git-scm.com](https://git-scm.com).
   - **QuickBooks Enterprise Solutions 24.0** (Accountant Edition): Con las credenciales o instalador oficial.
   - **Cliente IONOS HiDrive**: Descargar para montar la unidad de red y sincronizar los archivos.

---

## 3. Protocolo de Restauración Paso a Paso (15 a 20 Minutos)

### Paso 1: Clonar el Repositorio de Código
Abrir una terminal de **PowerShell** o **Símbolo del Sistema (CMD)** y ejecutar:
```cmd
cd C:\
git clone https://github.com/Rajun001/lims-pro.git lims-microlabs
cd C:\lims-microlabs
npm install
npm install -w api
```

### Paso 2: Configurar las Variables de Entorno (`.env`)
Crear el archivo `C:\lims-microlabs\api\.env` con los parámetros base:
```env
# Configuración Servidor y Base de Datos
PORT=3001
VITE_API_URL=http://localhost:3001
ANALYZER_PORT=9000
DATABASE_URL="file:./dev.db"
ALLOWED_ANALYZER_IPS="127.0.0.1,::1"

# Servidor de Correo para Envío de Reportes
SMTP_HOST=smtp.ionos.com
SMTP_PORT=465
SMTP_USER=reportes@microlabscr.com
SMTP_PASS=Microlabscr*1
SMTP_FROM="Laboratorio Microlabs <reportes@microlabscr.com>"
```

### Paso 3: Restaurar la Base de Datos LIMS-PRO
1. Iniciar sesión en **IONOS HiDrive** (vía web en [hidrive.ionos.com](https://hidrive.ionos.com) o montando la unidad `Z:`).
2. Ir a la carpeta: `Publica / Respaldos_LIMS /`
3. Descargar el archivo `.db` más reciente (por ejemplo: `lims_backup_2026-10-20T23-06-00-022Z_STARTUP.db`).
4. Renombrar dicho archivo como `dev.db` y copiarlo en:
   ```
   C:\lims-microlabs\api\prisma\dev.db
   ```
5. En la terminal dentro de `C:\lims-microlabs`, ejecutar:
   ```cmd
   npm run build
   npx prisma generate --schema=api/prisma/schema.prisma
   ```

*(Nota: También puede ejecutar el script automatizado: `node scripts/disaster_recovery_restore.cjs [ruta-al-archivo-backup]`)*.

### Paso 4: Restaurar QuickBooks Desktop
1. Desde **IONOS HiDrive**, ir a la carpeta: `users / microlabshp / BACKUPALIMENTOS /`
2. Descargar el archivo `.QBB` más reciente (por ejemplo: `alimentos10 (Backup Oct 16,2026 ...).QBB`).
3. Abrir QuickBooks en la nueva computadora.
4. Seleccionar: **File** > **Open or Restore Company...**
5. Elegir **Restore a backup copy (.qbb)** > **Local backup**.
6. Seleccionar el archivo descargado y elegir como destino:
   ```
   C:\quickbooks2010\alimentos10.QBW
   ```
7. QuickBooks reconstruirá y validará la empresa completa en menos de 3 minutos.

### Paso 5: Poner en Marcha LIMS-PRO
En la terminal de `C:\lims-microlabs`, ejecutar:
```cmd
npx pm2 start ecosystem.config.cjs
```
O hacer doble clic en el acceso directo de producción:
```cmd
scripts\start_lims_background.bat
```

¡Listo! Ingrese a **http://localhost:5173** en el navegador y el sistema estará 100% en línea con todo su historial, clientes, muestras y reportes.

---

## 4. Métricas de Recuperación (SLA Operativo)

| Métrica | Definición | Valor LIMS-PRO Actual |
| :--- | :--- | :---: |
| **RPO** (*Recovery Point Objective*) | Pérdida máxima de datos en el peor escenario posible. | **< 24 Horas** (con respaldos automáticos diarios programados) |
| **RTO** (*Recovery Time Objective*) | Tiempo total para tener el sistema funcionando nuevamente. | **15 - 30 Minutos** |

---

## 5. Recomendaciones de Alta Seguridad (Mejores Prácticas)

1. **Respaldos Fuera de Sitio Semanales (Regla 3-2-1):**
   - 3 copias de los datos.
   - 2 tipos de almacenamiento diferentes (Disco Local + HiDrive Cloud).
   - 1 copia externa fuera del edificio (ya cubierta por los centros de datos de IONOS).
2. **Acceso a Credenciales Críticas:**
   - Asegúrese de que el usuario administrador conozca la clave de acceso a GitHub (`Rajun001`) y la cuenta de IONOS HiDrive (`microlabshp`).
3. **Prueba de Simulacro Trimestral:**
   - Una vez cada 3 a 6 meses, se recomienda descargar un archivo `lims_backup_*.db` de la nube y verificar que abre correctamente con SQLite o en una laptop secundaria.
