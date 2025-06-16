const admin = require('firebase-admin');

console.log('🔍 Firebase Admin module imported:', typeof admin, !!admin);

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!admin) {
  throw new Error('Firebase Admin SDK failed to import properly');
}

if (!admin.apps.length) {
  if (!serviceAccountJson) {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON env variable is not set.');
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env variable is not set.');
  } else {
    try {
      console.log('🔥 Attempting to initialize Firebase Admin SDK...');
      console.log('Admin object:', !!admin, !!admin.initializeApp, !!admin.credential);
      
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
      if (error instanceof Error) {
        throw new Error(`Firebase Admin failed to initialize: ${error.message}`);
      } else {
        throw new Error('Firebase Admin failed to initialize: Unknown error');
      }
    }
  }
}

const firestoreDbAdmin = admin.firestore();
const authAdmin = admin.auth();

const firebaseAdmin = { firestoreDbAdmin, authAdmin };
export default firebaseAdmin;

export { admin, firestoreDbAdmin, authAdmin };
