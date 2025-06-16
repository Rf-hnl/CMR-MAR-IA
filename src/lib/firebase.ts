import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Using the provided configuration directly
const firebaseConfig = {
  apiKey: "AIzaSyAJF_Rr58vyCTsBwIyDCbko_PDZ8NocEOQ",
  authDomain: "leadsia-bc845.firebaseapp.com",
  projectId: "leadsia-bc845",
  storageBucket: "leadsia-bc845.firebasestorage.app", // Using user-provided value
  messagingSenderId: "812268403215",
  appId: "1:812268403215:web:74b2dae1d28e2eb395417a",
  measurementId: "G-702Q1CRN86"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
