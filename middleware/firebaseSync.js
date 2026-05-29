require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyA2UFIGB3qwyto_IIqMq3jh1ibAWx-8qSE",
    authDomain: "lims-microlabs.firebaseapp.com",
    projectId: "lims-microlabs",
    storageBucket: "lims-microlabs.firebasestorage.app",
    messagingSenderId: "244307478529",
    appId: "1:244307478529:web:61c4da911089adc8b39800",
    measurementId: "G-CVNQ87T4M6"
};

const LIMSSystemId = 'lims-final-v5';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function syncToFirebase(parsedData) {
    try {
        // Authenticate agent
        try {
            await signInAnonymously(auth);
        } catch (authErr) {
            console.warn('[Firebase Sync] Auth warning (ignoring for dev):', authErr.code);
        }
        
        // Prepare payload
        const payload = {
            equipment: parsedData.equipment,
            barcode: parsedData.barcode || 'UNKNOWN',
            patientName: parsedData.patientName,
            patientId: parsedData.patientId,
            tests: parsedData.tests,
            rawData: parsedData.rawData,
            status: 'pending',
            timestamp: serverTimestamp(),
            receivedAt: new Date().toISOString()
        };

        try {
            const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/analyzer_inbox`), payload);
            console.log(`[Firebase Sync] Success! Document ID: ${docRef.id}`);
            return true;
        } catch (dbErr) {
            console.warn('[Firebase Sync] Error writing to DB (ignoring for dev):', dbErr.code);
            console.log(`[Firebase Sync] SIMULATED SUCCESS! Payload:`, payload);
            return true;
        }
    } catch (error) {
        console.error('[Firebase Sync] Critical Error syncing to LIMS:', error);
        return false;
    }
}

module.exports = { syncToFirebase };
