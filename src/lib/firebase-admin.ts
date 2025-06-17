import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    let serviceAccount;
    
    // Use individual environment variables
    serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // Fallback initialization for development
    console.warn('Using fallback Firebase Admin initialization...');
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'leadsia-bc845',
    });
  }
}

// Export admin SDK services
export const admin = {
  firestore: () => getFirestore(),
  auth: () => getAuth(),
};

// Export Firestore instance for convenience
export const db = getFirestore();