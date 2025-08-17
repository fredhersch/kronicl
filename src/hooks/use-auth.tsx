'use client';
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    onAuthStateChanged, 
    signInWithRedirect, 
    signOut as firebaseSignOut, 
    User as FirebaseUser, 
    getRedirectResult, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    linkWithRedirect,
    unlink,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from './use-toast';

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
  const router = useRouter();
  const { toast } = useToast();

  const handleUser = useCallback(async (rawUser: FirebaseUser | null) => {
    if (rawUser) {
        setUser(rawUser as User);
        const idToken = await rawUser.getIdToken();
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });
    } else {
        setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);

    getRedirectResult(auth)
      .then((result) => {
        if (result) {
            toast({
                title: 'Account linked',
                description: 'Your Google account has been successfully linked.',
            });
            handleUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Error processing redirect result:", error);
        if (error.code === 'auth/credential-already-in-use') {
             toast({
                variant: 'destructive',
                title: 'Account linking failed',
                description: 'This Google account is already associated with another user.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Sign In Failed',
                description: 'Could not complete sign in. Please try again.',
            });
        }
      });

    return () => unsubscribe();
  }, [toast, handleUser]);
  
  const signInWithGoogle = async () => {
    setLoading(true); 
    await signInWithRedirect(auth, googleProvider);
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
            description: error.message || 'Invalid email or password.',
        });
        setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push('/');
    } catch (error: any) {
        console.error("Sign up failed:", error);
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: error.message || 'Could not create account. Please try again.',
        });
        setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
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
    if (!auth.currentUser) return;
    try {
        await linkWithRedirect(auth.currentUser, googleProvider);
    } catch (error: any) {
        console.error("Error linking Google Account", error);
        toast({
            variant: 'destructive',
            title: 'Failed to link account',
            description: 'There was a problem linking your Google Account.',
        });
    }
  };

  const unlinkGoogleAccount = async () => {
    if (!auth.currentUser) return;
    try {
        const googleProviderId = GoogleAuthProvider.PROVIDER_ID;
        await unlink(auth.currentUser, googleProviderId);
        toast({
            title: 'Account unlinked',
            description: 'Your Google account has been unlinked.',
        });
        // Manually trigger a user state update
        handleUser(auth.currentUser);
    } catch (error: any) {
        console.error("Error unlinking Google Account", error);
        toast({
            variant: 'destructive',
            title: 'Failed to unlink account',
            description: 'There was a problem unlinking your Google Account.',
        });
    }
  };

  const isGooglePhotosConnected = () => {
    if (!user) return false;
    return user.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);
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
