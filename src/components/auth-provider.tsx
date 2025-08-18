
'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    getAuth,
    Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { app } from '@/lib/firebase-client';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { AuthContext } from '@/hooks/use-auth';

// This provider component will handle all the client-side Firebase logic.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPhotosConnected, setIsPhotosConnected] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Initialize services inside the component to ensure they only run on the client.
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);

  useEffect(() => {
    // This code now runs only on the client, after the component mounts.
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);
    const storageInstance = getStorage(app);
    setAuth(authInstance);
    setDb(dbInstance);
    setStorage(storageInstance);
  }, []);


  const checkGooglePhotosConnection = useCallback(async (uid: string) => {
    if (!db) return false;
    const tokenDoc = await getDoc(doc(db, 'google-photos', uid));
    const connected = tokenDoc.exists();
    setIsPhotosConnected(connected);
    return connected;
  }, [db]);

  useEffect(() => {
    if (!auth) return; // Don't run auth logic until the auth instance is ready.
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const idToken = await user.getIdToken();
            try {
                setUser(user);
                checkGooglePhotosConnection(user.uid);
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                    },
                });
            } catch (err) {
                console.error("Session cookie creation failed:", err);
            }
        } else {
            setUser(null);
            setIsPhotosConnected(false);
            fetch('/api/auth/session', { method: 'DELETE' }).catch(err => console.error("Session cookie deletion failed:", err));
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, checkGooglePhotosConnection, router, toast]);

  const signInWithGoogle = async () => {
    if (!auth) return;
    setLoading(true);
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');
    try {
        await signInWithPopup(auth, googleProvider);
        router.push('/');
    } catch(error: any) {
        console.error("Google sign in failed:", error);
        toast({
            variant: 'destructive',
            title: 'Sign In Failed',
            description: 'Could not sign in with Google. Please try again.',
        });
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) return;
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/');
    } catch (error: any) {
        console.error("Email/password sign in failed:", error);
        toast({
            variant: 'destructive',
            title: 'Sign In Failed',
            description: 'Invalid email or password.',
        });
    } finally {
        setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!auth) return;
    setLoading(true);
    try {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = email.split('@')[0];
        await updateProfile(newUser, { displayName });
        // After signup, Firebase automatically signs the user in.
        // The onAuthStateChanged listener will handle the user state update.
        router.push('/');
    } catch (error: any) {
        console.error("Sign up failed:", error);
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: error.message || 'Could not create account. Please try again.',
        });
    } finally {
        setLoading(false);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Sign out failed:", error);
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'Could not sign out. Please try again.',
      });
    }
  };

  const linkGoogleAccount = () => {
    window.location.href = '/api/google/auth';
  };

  const unlinkGoogleAccount = async () => {
    if (!auth?.currentUser || !db) return;
    try {
        const tokenDocRef = doc(db, 'google-photos', auth.currentUser.uid);
        await deleteDoc(tokenDocRef);
        setIsPhotosConnected(false);
        toast({
            title: 'Disconnected from Google Photos',
            description: 'Your account has been unlinked.',
        });
    } catch (error) {
        console.error("Error unlinking Google Account", error);
        toast({
            variant: 'destructive',
            title: 'Failed to unlink account',
            description: 'There was a problem unlinking your account.',
        });
    }
  };

  const isGooglePhotosConnected = () => {
    return isPhotosConnected;
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    linkGoogleAccount,
    unlinkGoogleAccount,
    isGooglePhotosConnected,
    // We pass the initialized services through the context
    auth,
    db,
    storage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
