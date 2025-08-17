'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

// NOTE: Using the correct, verified Firebase config to fix environment variable loading issues.
const firebaseConfig = {
    projectId: 'memorylane-ghzrx',
    appId: '1:992326242121:web:13da8459c8e46d42edd498',
    storageBucket: 'memorylane-ghzrx.appspot.com',
    apiKey: 'AIzaSyA-rkUxnU-lvCa7tcOrWySvN43B3aV69wA',
    authDomain: 'memorylane-ghzrx.firebaseapp.com',
    messagingSenderId: '992326242121',
};

// Initialize Firebase
// This pattern ensures that Firebase is initialized only once.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app, firebaseConfig };
