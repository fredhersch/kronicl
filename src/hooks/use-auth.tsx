'use client';
import { createContext, useContext } from 'react';
import type { User as FirebaseUser, Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

// Define a type for the user object, extending the FirebaseUser
interface User extends FirebaseUser {}

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signInWithEmail: (email: string, password: string) => void;
  signUpWithEmail: (email: string, password: string) => void;
  signOut: () => void;
  linkGoogleAccount: () => void;
  unlinkGoogleAccount: () => void;
  isGooglePhotosConnected: () => boolean;
  // Make Firebase services available through the context
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

// Create the authentication context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is the hook that components will use to access the auth context.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
