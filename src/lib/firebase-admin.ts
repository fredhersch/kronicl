import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const initAdmin = (): App => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  }

  if (getApps().length) {
    return getApps()[0];
  }

  return initializeApp({
    credential: credential.cert(JSON.parse(serviceAccount)),
  });
};

export const db = getFirestore(initAdmin());
