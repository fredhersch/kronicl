
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountString) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. The application will not work correctly.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    adminApp = initializeApp({
      credential: credential.cert(serviceAccount),
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
