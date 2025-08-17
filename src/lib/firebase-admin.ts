
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;
let db: ReturnType<typeof getFirestore>;

if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    try {
      // The service account key is expected to be a stringified JSON object.
      // We need to parse it before passing it to the credential.cert method.
      const serviceAccountJson = JSON.parse(serviceAccount);
      adminApp = initializeApp({
        credential: credential.cert(serviceAccountJson),
      });
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON string.', e);
    }
  } else {
    console.error('FATAL ERROR: FIREBASE_SERVICE_ACCOUNT_KEY is not set. The application will not work correctly.');
  }
} else {
    adminApp = getApps()[0];
}

// Initialize Firestore only if the app was initialized successfully
// @ts-ignore
if (adminApp) {
    db = getFirestore(adminApp);
} else {
    // Provide a dummy db object to avoid crashing the app on import
    // when the service key is not available. Errors will be logged at runtime.
    db = {} as ReturnType<typeof getFirestore>;
}


export { adminApp, db };
