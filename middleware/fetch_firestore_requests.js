const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
const db = getFirestore(app);

async function main() {
  console.log("Fetching requests from Firestore...");
  const snap = await getDocs(collection(db, `artifacts/${LIMSSystemId}/public/data/requests`));
  const requests = [];
  snap.forEach(doc => {
    const data = doc.data();
    const name = (data.clientName || '').toLowerCase();
    if (name.includes('yolanda') || name.includes('perez')) {
      requests.push({ id: doc.id, ...data });
    }
  });
  console.log("Filtered requests in Firestore:");
  console.log(JSON.stringify(requests, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
