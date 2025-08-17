
'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// NOTE: The config is hardcoded here to ensure it's always available on the client
// without relying on environment variable loading, which was causing issues.
export const firebaseConfig = {
  apiKey: "AIzaSyALVOV4J9E3hDujJPL95tGaQv_b122gGVI",
  authDomain: "memorylane-ghzrx.firebaseapp.com",
  projectId: "memorylane-ghzrx",
  storageBucket: "memorylane-ghzrx.firebasestorage.app",
  messagingSenderId: "992326242121",
  appId: "1:992326242121:web:964e354dfdc2db22edd498",
};


// Function to get the initialized Firebase app, creating it if it doesn't exist.
// This prevents re-initialization and ensures code only runs on the client.
function getFirebaseApp(): FirebaseApp {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');
googleProvider.setCustomParameters({
    prompt: 'select_account'
});


export { app, auth, db, storage, googleProvider };
