
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// This new implementation ensures a single, robust initialization of the Firebase Admin SDK.
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    console.error('FATAL ERROR: FIREBASE_SERVICE_ACCOUNT_KEY is not set. The application will not work correctly.');
  } else {
    try {
      // The service account key is a JSON string, so it needs to be parsed.
      const serviceAccountJson = JSON.parse(serviceAccount);
      initializeApp({
        credential: credential.cert(serviceAccountJson),
      });
    } catch (e) {
      console.error('Error initializing Firebase Admin SDK:', e);
    }
  }
}

// We can now safely get the admin app and firestore instance.
const adminApp: App = getApps()[0];
const db: ReturnType<typeof getFirestore> = getFirestore(adminApp);

export { adminApp, db };
