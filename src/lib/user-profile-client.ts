// Client-side user profile service
// This file is safe to import in React components

import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

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
  storageQuota: 1000 // 1GB default
};

// Client-side functions (using Firebase client SDK)
export async function createUserProfileClient(uid: string, userData: Partial<UserProfile>): Promise<void> {
  const db = getFirestore();
  
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
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

  await setDoc(doc(db, 'user-profiles', uid), finalProfile);
}

export async function updateUserProfileClient(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const db = getFirestore();
  const docRef = doc(db, 'user-profiles', uid);
  
  const updateData = {
    ...updates,
    metadata: {
      ...updates.metadata,
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    }
  };
  
  await updateDoc(docRef, updateData);
}
