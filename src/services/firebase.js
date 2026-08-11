import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyA2UFIGB3qwyto_IIqMq3jh1ibAWx-8qSE",
    authDomain: "lims-microlabs.firebaseapp.com",
    projectId: "lims-microlabs",
    storageBucket: "lims-microlabs.firebasestorage.app",
    messagingSenderId: "244307478529",
    appId: "1:244307478529:web:61c4da911089adc8b39800",
    measurementId: "G-CVNQ87T4M6"
};

export const LIMSSystemId = 'lims-final-v5';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Inicializar Firestore con la configuración moderna de persistencia de caché.
// Se envuelve en try-catch para evitar caídas del sistema en navegadores como
// Edge/Safari cuando las políticas de cookies o el modo incógnito bloquean IndexedDB.
let firestoreInstance;
try {
    firestoreInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
} catch (e) {
    console.warn("La persistencia de Firestore no es compatible con este navegador. Usando caché en memoria.", e);
    firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const storage = getStorage(app);
