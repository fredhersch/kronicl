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

import { getDb } from './firebase-admin';
import * as admin from 'firebase-admin';

// Types for user profile data
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
    language: string;
  };
  metadata: {
    createdAt: any; // Firestore serverTimestamp
    updatedAt: any; // Firestore serverTimestamp
    lastActive: any; // Firestore serverTimestamp
    loginCount: number;
    provider: string; // 'google', 'email', etc.
  };
  settings: {
    privacy: 'public' | 'private' | 'friends';
    autoBackup: boolean;
    storageQuota: number; // in MB
    galleryFolder: string; // Firebase Storage path for user's gallery
  };
}

// Default user preferences
export const defaultUserPreferences = {
  theme: 'system' as const,
  notifications: true,
  emailUpdates: true,
  language: 'en'
};

// Default user settings
export const defaultUserSettings = {
  privacy: 'private' as const,
  autoBackup: false,
  storageQuota: 1000, // 1GB default
  galleryFolder: 'photos-demo' // Default to demo folder, users can change this
};

// Server-side functions (using Firebase Admin)
export async function createUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
  const db = getDb();
  
  // Filter out undefined values to prevent Firestore errors
  const cleanUserData: Partial<UserProfile> = Object.fromEntries(
    Object.entries(userData).filter(([_, value]) => value !== undefined)
  ) as Partial<UserProfile>;
  
  const userProfile: UserProfile = {
    uid,
    displayName: cleanUserData.displayName || 'Anonymous User',
    email: cleanUserData.email || '',
    photoURL: cleanUserData.photoURL, // This will be undefined for email users, which is fine
    preferences: {
      ...defaultUserPreferences,
      ...(cleanUserData.preferences || {})
    },
    metadata: {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      loginCount: 1,
      provider: cleanUserData.metadata?.provider || 'unknown'
    },
    settings: {
      ...defaultUserSettings,
      ...(cleanUserData.settings || {})
    }
  };

  // Remove undefined fields from the final profile
  const finalProfile = Object.fromEntries(
    Object.entries(userProfile).filter(([_, value]) => value !== undefined)
  );

  await db.collection('user-profiles').doc(uid).set(finalProfile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getDb();
  const docRef = db.collection('user-profiles').doc(uid);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    return docSnap.data() as UserProfile;
  }
  
  return null;
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const db = getDb();
  const docRef = db.collection('user-profiles').doc(uid);
  
  const updateData = {
    ...updates,
    metadata: {
      ...updates.metadata,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    }
  };
  
  await docRef.update(updateData);
}

export async function updateUserLastActive(uid: string): Promise<void> {
  const db = getDb();
  const docRef = db.collection('user-profiles').doc(uid);
  
  await docRef.update({
    'metadata.lastActive': admin.firestore.FieldValue.serverTimestamp()
  });
}

export async function incrementLoginCount(uid: string): Promise<void> {
  const db = getDb();
  const docRef = db.collection('user-profiles').doc(uid);
  
  // Get current profile to increment login count
  const currentProfile = await getUserProfile(uid);
  if (currentProfile) {
    await docRef.update({
      'metadata.loginCount': (currentProfile.metadata.loginCount || 0) + 1,
      'metadata.lastActive': admin.firestore.FieldValue.serverTimestamp()
    });
  }
}
