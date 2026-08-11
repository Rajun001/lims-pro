import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA2UFIGB3qwyto_IIqMq3jh1ibAWx-8qSE",
    authDomain: "lims-microlabs.firebaseapp.com",
    projectId: "lims-microlabs",
    storageBucket: "lims-microlabs.firebasestorage.app",
    messagingSenderId: "244307478529",
    appId: "1:244307478529:web:61c4da911089adc8b39800",
    measurementId: "G-CVNQ87T4M6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFirebase() {
    console.log("Checking Firestore connection...");
    try {
        // Since we are unauthenticated in this Node script, reading `/users` should fail due to rules.
        // Let's see if we can query public data or if it is completely locked down.
        const q = query(collection(db, "artifacts/lims-final-v5/public/data/requests"), limit(5));
        const snap = await getDocs(q);
        console.log(`Success! Found ${snap.size} requests.`);
        snap.forEach(doc => {
            console.log(`Document ID: ${doc.id}`, doc.data());
        });
    } catch (error) {
        console.error("Firestore read failed:", error.code, error.message);
    }
}

checkFirebase();
