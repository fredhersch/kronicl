import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

export const initAdmin = (): App => {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  }

  try {
    adminApp = initializeApp({
      credential: credential.cert(JSON.parse(serviceAccount)),
    });
  } catch (error: any) {
    // This can happen in serverless environments where the instance is reused.
    if (!/already exists/u.test(error.message)) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
  return adminApp;
};

export const db = getFirestore(initAdmin());
