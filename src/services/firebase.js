import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
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
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence to protect against network drops and data loss
try {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open in older browser.');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistence not supported by this browser.');
        }
    });
} catch (e) {
    console.error("Persistence setup error:", e);
}
