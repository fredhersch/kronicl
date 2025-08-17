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
    GoogleAuthProvider,
    updateProfile,
    initializeAuth,
    indexedDBLocalPersistence,
    browserLocalPersistence
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
  const [isLinkingFlow, setIsLinkingFlow] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect should only run once to initialize auth and set up listeners.
    const initialize = async () => {
      try {
        // Initialize auth with persistence. This is crucial to do once.
        initializeAuth(auth.app, { persistence: indexedDBLocalPersistence });
      } catch (e) {
        console.error("Firebase auth initialization error", e);
      }

      const unsubscribe = onAuthStateChanged(auth, handleUser);

      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await handleUser(result.user);
          setTimeout(() => {
            if (isLinkingFlow) {
              const message = 'Your Google account has been successfully linked.';
              router.push(`/profile?status=success&message=${encodeURIComponent(message)}`);
              setIsLinkingFlow(false);
            } else {
              router.push('/');
            }
          }, 100);
        }
      } catch (error: any) {
        console.error("Error processing redirect result:", error);
        let message = 'Could not complete the authentication. Please try again.';
        if (error.code === 'auth/credential-already-in-use') {
          message = 'This Google account is already associated with another user.';
        }
        if (isLinkingFlow) {
          router.push(`/profile?status=error&message=${encodeURIComponent(message)}`);
          setIsLinkingFlow(false);
        } else {
          // It's possible for this to fire on login page if there's a stored redirect error.
          // Only show toast if it's a manual login attempt, not on page load.
          // For now, logging to console is safer than showing a confusing toast on load.
        }
      }

      return unsubscribe;
    };

    const unsubscribePromise = initialize();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setLoading(false);
  }, []);
  
  const signInWithGoogle = async () => {
    setLoading(true); 
    await signInWithRedirect(auth, googleProvider);
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
            description: error.message || 'Invalid email or password.',
        });
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

  const linkGoogleAccount = async () => {
    if (!auth.currentUser) return;
    try {
        setIsLinkingFlow(true);
        await linkWithRedirect(auth.currentUser, googleProvider);
    } catch (error: any) {
        console.error("Error linking Google Account", error);
        setIsLinkingFlow(false);
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
        const googleProviderInfo = auth.currentUser.providerData.find(p => p.providerId === googleProviderId);

        if (googleProviderInfo) {
            await unlink(auth.currentUser, googleProviderId);
            toast({
                title: 'Account unlinked',
                description: 'Your Google account has been unlinked.',
            });
            await auth.currentUser.reload();
            handleUser(auth.currentUser);
        } else {
            toast({
                variant: 'destructive',
                title: 'Not Connected',
                description: 'Your Google account is not currently connected.',
            });
        }
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
