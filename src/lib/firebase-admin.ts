import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
let dbInstance: ReturnType<typeof getFirestore>;

export const initAdmin = () => {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
    }
    try {
      adminApp = initializeApp({
        credential: credential.cert(JSON.parse(serviceAccount)),
      });
      dbInstance = getFirestore(adminApp);
    } catch (error: any) {
      console.error('Firebase Admin Initialization Error:', error.message);
      // Don't re-throw, let the app attempt to continue if possible,
      // subsequent calls will fail if initialization was truly required.
    }
  } else {
    adminApp = getApps()[0];
    dbInstance = getFirestore(adminApp);
  }
};

// Initialize on module load
initAdmin();

export { adminApp, dbInstance as db };
