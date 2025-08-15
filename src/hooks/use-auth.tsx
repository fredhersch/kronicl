'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithRedirect, signOut as firebaseSignOut, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from './use-toast';

// Define a type for the user object, extending the FirebaseUser
interface User extends FirebaseUser {}

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the application and provide auth state
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs once on mount to handle both initial auth state and redirect results.
    let isMounted = true;

    // First, check if a redirect operation has just completed.
    getRedirectResult(auth)
      .then((result) => {
        if (result && isMounted) {
          // User successfully signed in via redirect.
          // The onAuthStateChanged listener below will handle setting the user state.
          console.log("Redirect result successful:", result.user);
          router.push('/');
        }
      })
      .catch((error) => {
        console.error("Error processing redirect result:", error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Sign In Failed',
            description: 'Could not complete sign in with Google. Please try again.',
          });
        }
      });

    // Set up the primary listener for authentication state changes.
    // This will fire on initial load and whenever the user signs in or out.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isMounted) {
        console.log(currentUser ? "Auth State Changed: User is signed in" : "Auth State Changed: User is signed out", currentUser);
        setUser(currentUser as User);
        // We can now safely say the initial auth state has been determined.
        setLoading(false);
      }
    });

    // Cleanup function runs when the component unmounts.
    return () => {
      isMounted = false;
      unsubscribe();
    };
    // The dependency array is empty to ensure this effect runs only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to initiate the sign-in process
  const signIn = async () => {
    setLoading(true); // Set loading to true before redirecting
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Sign in failed:", error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
      setLoading(false);
    }
  };

  // Function to sign the user out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // After signing out, the onAuthStateChanged listener will set user to null
      router.push('/login'); // Redirect to the login page
    } catch (error) {
      console.error("Sign out failed:", error);
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'Could not sign out. Please try again.',
      });
    }
  };

  // Provide the auth state and functions to the rest of the app
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily access the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
