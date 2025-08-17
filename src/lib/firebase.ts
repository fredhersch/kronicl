'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: 'memorylane-ghzrx',
  appId: '1:992326242121:web:964e354dfdc2db22edd498',
  storageBucket: 'memorylane-ghzrx.appspot.com',
  apiKey: 'AIzaSyALVOV4J9E3hDujJPL95tGaQv_b122gGVI',
  authDomain: 'memorylane-ghzrx.firebaseapp.com',
  messagingSenderId: '992326242121',
};


// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');
googleProvider.setCustomParameters({
    prompt: 'select_account'
});


export { app, auth, db, storage, googleProvider, firebaseConfig };
