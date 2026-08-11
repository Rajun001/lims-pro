import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Para ejecutar este script, descargue la clave JSON de la cuenta de servicio desde la Consola de Firebase:
// Configuración del Proyecto -> Cuentas de Servicio -> Generar nueva clave privada.
// Guarde el archivo descargado como 'serviceAccountKey.json' dentro de la carpeta 'scratch'.

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.log("=========================================================================");
    console.log("AVISO DE SEGURIDAD:");
    console.log("No se encontró el archivo de credenciales 'scratch/serviceAccountKey.json'.");
    console.log("Para inicializar usuarios administrativos con roles inmutables en producción:");
    console.log("1. Vaya a la consola de Firebase.");
    console.log("2. Project Settings -> Service Accounts -> Generate new private key.");
    console.log("3. Guarde la clave descargada como 'scratch/serviceAccountKey.json'.");
    console.log("4. Ejecute: node scratch/seed_users.js");
    console.log("=========================================================================");
    process.exit(0);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const usersToCreate = [
    { email: 'admin@microlabs.com', password: 'AdminPassword123!', role: 'admin' },
    { email: 'director@microlabs.com', password: 'DirectorPassword123!', role: 'director_tecnico' },
    { email: 'analista@microlabs.com', password: 'AnalystPassword123!', role: 'analyst' },
    { email: 'factura@microlabs.com', password: 'BillingPassword123!', role: 'billing_agent' },
];

async function seedUsers() {
    console.log("Iniciando registro de usuarios...");
    for (const u of usersToCreate) {
        try {
            let userRecord;
            try {
                userRecord = await auth.getUserByEmail(u.email);
                console.log(`[-] El usuario ya existe: ${u.email} (UID: ${userRecord.uid})`);
            } catch (err) {
                if (err.code === 'auth/user-not-found') {
                    userRecord = await auth.createUser({
                        email: u.email,
                        password: u.password,
                        emailVerified: true
                    });
                    console.log(`[+] Usuario registrado con éxito: ${u.email} (UID: ${userRecord.uid})`);
                } else {
                    throw err;
                }
            }

            // Asignar el rol en la colección /users
            await db.collection('users').doc(userRecord.uid).set({
                email: u.email,
                role: u.role,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`[✔] Rol '${u.role}' mapeado a la colección de seguridad.`);
        } catch (e) {
            console.error(`[X] Error procesando ${u.email}:`, e.message);
        }
    }
    console.log("Proceso terminado.");
    process.exit(0);
}

seedUsers();
