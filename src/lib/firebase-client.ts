'use client';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { debugLog, debugWarn, isDebugMode } from '@/lib/debug';

// Hardcoded fallback values as a temporary workaround
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA-rkUxnU-lvCa7tcOrWySvN43B3aV69wA',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'memorylane-ghzrx.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'memorylane-ghzrx',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'memorylane-ghzrx.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '992326242121',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:992326242121:web:13da8459c8e46d42edd498',
};

// Debug Firebase configuration
if (typeof window !== 'undefined') {
    debugLog('=== Firebase Client Configuration Check ===');
    debugLog('NODE_ENV:', process.env.NODE_ENV);
    
    // Check if we're using environment variables or fallbacks
    const usingEnvVars = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    debugLog(`Configuration source: ${usingEnvVars ? '✅ Environment variables' : '⚠️ Fallback values'}`);
    
    // Validate the actual config values being used
    const configValid = firebaseConfig.apiKey && 
                       firebaseConfig.authDomain && 
                       firebaseConfig.projectId && 
                       firebaseConfig.storageBucket && 
                       firebaseConfig.messagingSenderId && 
                       firebaseConfig.appId;
    
    if (configValid) {
        debugLog('✅ Firebase configuration is valid');
        debugLog('Config preview:', {
            apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
            authDomain: firebaseConfig.authDomain,
            projectId: firebaseConfig.projectId
        });
    } else {
        debugWarn('❌ Firebase configuration is invalid');
    }
    
    if (!usingEnvVars) {
        debugWarn('⚠️ Using fallback Firebase configuration. Add .env file with NEXT_PUBLIC_FIREBASE_* variables for production.');
    }
}

// Initialize Firebase
// This pattern ensures that Firebase is initialized only once.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app, firebaseConfig };
