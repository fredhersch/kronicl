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
    GoogleAuthProvider,
    updateProfile,
    initializeAuth,
    indexedDBLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from './use-toast';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
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

  const checkGooglePhotosConnection = useCallback(async (uid: string) => {
    const tokenDoc = await getDoc(doc(db, 'google-photos', uid));
    const connected = tokenDoc.exists();
    setIsPhotosConnected(connected);
    return connected;
  }, []);

  useEffect(() => {
    // This effect should only run once on mount
    try {
        initializeAuth(auth.app, { persistence: indexedDBLocalPersistence });
    } catch (e: any) {
        if (e.code !== 'auth/already-initialized') {
            console.error("Firebase auth initialization error", e);
        }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setUser(user as User);
            checkGooglePhotosConnection(user.uid);
            const idToken = await user.getIdToken();
            // This is a fire-and-forget call to set the session cookie
            fetch('/api/auth/session', {
                method: 'POST',
                headers: { Authorization: `Bearer ${idToken}` },
            }).catch(err => console.error("Session cookie creation failed:", err));
        } else {
            setUser(null);
            setIsPhotosConnected(false);
            // This is a fire-and-forget call to clear the session cookie
            fetch('/api/auth/session', { method: 'DELETE' }).catch(err => console.error("Session cookie deletion failed:", err));
        }
        setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const signInWithGoogle = async () => {
    setLoading(true);
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
    setLoading(true);
    try {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = email.split('@')[0];
        await updateProfile(newUser, { displayName });
        setUser({ ...newUser, displayName } as User); // Update local state immediately
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
