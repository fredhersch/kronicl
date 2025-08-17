'use client';
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    onAuthStateChanged, 
    signInWithPopup, 
    signOut as firebaseSignOut, 
    User as FirebaseUser, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    linkWithPopup,
    unlink,
    GoogleAuthProvider,
    updateProfile,
    initializeAuth,
    indexedDBLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from './use-toast';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


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
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the application and provide auth state
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPhotosConnected, setIsPhotosConnected] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
        initializeAuth(auth.app, { persistence: indexedDBLocalPersistence });
    } catch (e: any) {
        if (e.code !== 'auth/already-initialized') {
            console.error("Firebase auth initialization error", e);
        }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
        handleUser(user);
        if (user) {
            checkGooglePhotosConnection(user.uid);
        } else {
            setIsPhotosConnected(false);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkGooglePhotosConnection = async (uid: string) => {
    const tokenDoc = await getDoc(doc(db, 'google-photos', uid));
    setIsPhotosConnected(tokenDoc.exists());
  };

  const handleUser = useCallback(async (rawUser: FirebaseUser | null) => {
    if (rawUser) {
        setUser(rawUser as User);
        const idToken = await rawUser.getIdToken();
        try {
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });
        } catch (error) {
            console.error("Failed to create session cookie:", error);
        }
    } else {
        setUser(null);
        await fetch('/api/auth/session', { method: 'DELETE' });
    }
  }, []);
  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await handleUser(result.user);
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
    setLoading(true);
    try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        await handleUser(user);
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
    setLoading(true);
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = email.split('@')[0];
        await updateProfile(user, { displayName });
        
        await handleUser(user);
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
    try {
      await firebaseSignOut(auth);
      await handleUser(null);
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
    // Redirect to our server-side OAuth2 initiation endpoint
    window.location.href = '/api/google/auth';
  };

  const unlinkGoogleAccount = async () => {
    if (!auth.currentUser) return;
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

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, linkGoogleAccount, unlinkGoogleAccount, isGooglePhotosConnected }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
