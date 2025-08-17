
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. The application will not work correctly.');
  }

  try {
    const serviceAccountJson = JSON.parse(serviceAccount);
    adminApp = initializeApp({
      credential: credential.cert(serviceAccountJson),
    });
    return adminApp;
  } catch (e: any) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON string.', e);
    throw new Error('Failed to initialize Firebase Admin SDK: ' + e.message);
  }
}

function getDb() {
    return getFirestore(getAdminApp());
}


export { getAdminApp, getDb };
