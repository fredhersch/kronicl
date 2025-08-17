'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

// NOTE: Hardcoding config to fix environment variable loading issues.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

// Initialize Firebase
// This pattern ensures that Firebase is initialized only once.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app, firebaseConfig };
