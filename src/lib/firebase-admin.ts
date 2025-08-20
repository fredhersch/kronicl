/**
 * ⚠️ SERVER-ONLY FILE ⚠️
 * 
 * This file contains Node.js specific code and should NEVER be imported in:
 * - React components
 * - Client-side hooks
 * - Any browser-side code
 * 
 * Only import this file in:
 * - API routes (/app/api/route.ts)
 * - Server actions
 * - Other server-only code
 */

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  // This check prevents this server-side code from ever running in the browser.
  if (typeof window !== 'undefined') {
    throw new Error("Firebase Admin SDK can't be used in the browser.");
  }
  
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountString) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. The application will not work correctly.');
  }

  try {
    // Debug: Log the first and last 50 characters to help diagnose format issues
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Firebase Admin SDK Debug ===');
      console.log('Service Account Key Debug:');
      console.log('Length:', serviceAccountString.length);
      console.log('First 50 chars:', serviceAccountString.substring(0, 50));
      console.log('Last 50 chars:', serviceAccountString.substring(serviceAccountString.length - 50));
      console.log('Starts with {:', serviceAccountString.trim().startsWith('{'));
      console.log('Ends with }:', serviceAccountString.trim().endsWith('}'));
      console.log('Admin credential available:', !!admin.credential);
      console.log('Admin credential.cert available:', !!admin.credential?.cert);
    }

    const serviceAccount = JSON.parse(serviceAccountString);
    
    // Validate required fields
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in service account: ${missingFields.join(', ')}`);
    }

    adminApp = initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return adminApp;
  } catch (e: any) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON string.', e);
    
    if (e instanceof SyntaxError) {
      console.error('JSON Syntax Error - Common issues:');
      console.error('1. Make sure the entire JSON is on one line in .env file');
      console.error('2. Escape backslashes in private_key (\\n should be \\\\n)');
      console.error('3. No trailing commas in the JSON');
      console.error('4. Proper quotes around all strings');
    }
    
    throw new Error('Failed to initialize Firebase Admin SDK: ' + e.message);
  }
}

function getDb() {
    return getFirestore(getAdminApp());
}


export { getAdminApp, getDb };
