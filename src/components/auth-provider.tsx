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
    Auth,
    getRedirectResult,
    linkWithRedirect,
    unlink,
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
  const [isLinkingFlow, setIsLinkingFlow] = useState(false); // <-- Add this state
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

    // Note: getRedirectResult is only needed for redirect-based flows
    // Since we're using signInWithPopup, this logic is not needed here

  }, []);

  // Separate effect to handle Photos linking redirects (only when isLinkingFlow is true)
  useEffect(() => {
    if (!auth || !isLinkingFlow) return;
    
    // This handles the result from linkWithRedirect for Photos linking
    getRedirectResult(auth)
      .then(async (result: any) => {
        if (result) {
          // User successfully linked Google Photos
          await handleUser(result.user);
          const message = 'Your Google Photos account has been successfully linked.';
          router.push(`/profile?status=success&message=${encodeURIComponent(message)}`);
          setIsLinkingFlow(false);
        }
      })
      .catch((error: any) => {
        console.error("Error processing Photos linking redirect result:", error);
        let message = 'Could not complete the Google Photos connection. Please try again.';
        if (error.code === 'auth/credential-already-in-use') {
          message = 'This Google account is already associated with another user.';
        }
        router.push(`/profile?status=error&message=${encodeURIComponent(message)}`);
        setIsLinkingFlow(false);
      });
  }, [auth, isLinkingFlow, router]);

  const handleUser = async (rawUser: FirebaseUser | null) => {
    if (rawUser) {
        const idToken = await rawUser.getIdToken();
        try {
            setUser(rawUser);
            checkGooglePhotosConnection(rawUser.uid);
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
  };

  const checkGooglePhotosConnection = useCallback(async (uid: string) => {
    if (!db) return false;
    
    try {
      const tokenDoc = await getDoc(doc(db, 'google-photos', uid));
      
      if (!tokenDoc.exists()) {
        console.log(`No Google Photos token document found for user ${uid}`);
        setIsPhotosConnected(false);
        return false;
      }
      
      const tokenData = tokenDoc.data();
      const hasRefreshToken = !!tokenData?.refreshToken;
      const hasAccessToken = !!tokenData?.accessToken;
      // Fix: Check for the new photoslibrary scope, not readonly
      const hasValidScopes = tokenData?.scopes?.includes('https://www.googleapis.com/auth/photoslibrary');
      
      console.log(`🔍 Google Photos connection check for user ${uid}:`, {
        hasRefreshToken,
        hasAccessToken,
        hasValidScopes,
        scopes: tokenData?.scopes
      });
      
      // Only consider connected if we have all required tokens and scopes
      const isConnected = hasRefreshToken && hasAccessToken && hasValidScopes;
      
      setIsPhotosConnected(isConnected);
      
      if (!isConnected) {
        console.log(`❌ Invalid or incomplete Google Photos tokens for user ${uid}`);
        // Clean up invalid tokens
        if (tokenDoc.exists()) {
          await deleteDoc(doc(db, 'google-photos', uid));
          console.log(`✅ Cleaned up invalid token document for user ${uid}`);
        }
      } else {
        console.log(`✅ Valid Google Photos connection found for user ${uid}`);
      }
      
      return isConnected;
    } catch (error) {
      console.error(`Error checking Google Photos connection for user ${uid}:`, error);
      setIsPhotosConnected(false);
      return false;
    }
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
                // Redirect to main page after successful authentication
                router.push('/');
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
    try {
        await signInWithPopup(auth, googleProvider);
        // The popup will close automatically, and onAuthStateChanged will handle the user state
        // No manual redirect needed - Firebase handles the flow
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

  const linkGoogleAccount = async () => {
    if (!auth?.currentUser) return;
    
    // Check if already connected to avoid duplicate linking
    if (isPhotosConnected) {
      toast({
        title: 'Already Connected',
        description: 'Your Google Photos account is already connected.',
      });
      return;
    }
    
    setIsLinkingFlow(true);
    try {
      // Use the API route instead of Firebase linking
      // This will handle the OAuth flow for Google Photos API access
      window.location.href = '/api/google/auth';
    } catch (error) {
      console.error("Error starting Google Photos connection:", error);
      setIsLinkingFlow(false);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: 'Could not start the Google Photos connection process. Please try again.',
      });
    }
  };

  const unlinkGoogleAccount = async () => {
    if (!auth?.currentUser || !db) return;
    console.log(`Attempting to unlink Google Photos for user: ${auth.currentUser.uid}`);
    try {
        const tokenDocRef = doc(db, 'google-photos', auth.currentUser.uid);
        await deleteDoc(tokenDocRef);
        setIsPhotosConnected(false);
        console.log(`✅ Successfully deleted token document for user: ${auth.currentUser.uid}`);
        toast({
            title: 'Disconnected from Google Photos',
            description: 'Your account has been successfully unlinked.',
        });
    } catch (error) {
        console.error("❌ Error unlinking Google Account:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to unlink account',
            description: 'There was a problem unlinking your account. Check the console for details.',
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
