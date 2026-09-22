# Guía de Despliegue a Producción (Firebase Hosting)

LIMS-PRO está configurado para desplegarse fácilmente en **Firebase Hosting** usando una arquitectura SPA (Single Page Application).

Sigue estos pasos en tu terminal para publicar la aplicación en internet y que tus clientes puedan acceder a sus resultados.

### Requisitos Previos
1. Necesitas una cuenta de Google con un proyecto creado en la [Consola de Firebase](https://console.firebase.google.com/).
2. Asegúrate de tener Node.js instalado.

### Paso 1: Instalar Firebase CLI
Si aún no tienes las herramientas de Firebase, instala el CLI de forma global:
```bash
npm install -g firebase-tools
```

### Paso 2: Iniciar Sesión en Firebase
Ejecuta el siguiente comando. Se abrirá tu navegador para que inicies sesión de forma segura con tu cuenta de Google.
```bash
firebase login
```

### Paso 3: Vincular el Proyecto
Si es la primera vez que vas a desplegar, necesitas vincular esta carpeta al proyecto que creaste en la nube:
```bash
firebase init hosting
```
- Selecciona "Use an existing project" y elige tu proyecto.
- Cuando te pregunte **What do you want to use as your public directory?**, escribe: `dist`
- Cuando te pregunte **Configure as a single-page app (rewrite all urls to /index.html)?**, responde: `Yes` (o simplemente `y`).
- Cuando te pregunte **Set up automatic builds and deploys with GitHub?**, responde: `No` (o `n`).
- Si te pregunta si deseas **overwrite index.html**, responde: `No` (o `n`).

### Paso 4: Construir la Versión Final
Genera el paquete optimizado de producción:
```bash
npm run build
```

### Paso 5: Despliegue
¡Sube el proyecto a internet!
```bash
firebase deploy --only hosting
```

La consola te devolverá una **URL pública** (Hosting URL) que podrás compartir inmediatamente con tu equipo y clientes.
