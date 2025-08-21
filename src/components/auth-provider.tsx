'use client';

import { useState, useEffect, ReactNode } from 'react';
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
} from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { app } from '@/lib/firebase-client';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/hooks/use-auth';
import { createUserProfileClient } from '@/lib/user-profile-client';

// This provider component will handle all the client-side Firebase logic.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleUser = async (rawUser: FirebaseUser | null) => {
    if (rawUser) {
        const idToken = await rawUser.getIdToken();
        try {
            setUser(rawUser);
            
            // Create or update user profile in Firestore
            try {
              await createUserProfileClient(rawUser.uid, {
                displayName: rawUser.displayName || 'Anonymous User',
                email: rawUser.email || '',
                photoURL: rawUser.photoURL || undefined
              });
              console.log('✅ User profile created/updated successfully');
            } catch (profileError) {
              console.error('❌ Failed to create/update user profile:', profileError);
              // Don't fail the auth if profile creation fails
            }
            
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
        fetch('/api/auth/session', { method: 'DELETE' }).catch(err => console.error("Session cookie deletion failed:", err));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!auth) return; // Don't run auth logic until the auth instance is ready.
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const idToken = await user.getIdToken();
            
            // Check if this is a new user (created within the last minute)
            const isNewUser = user.metadata.creationTime && 
              (Date.now() - new Date(user.metadata.creationTime).getTime()) < 60000;
            
            try {
                setUser(user);
                
                // Create or update user profile in Firestore for ALL sign-ins
                try {
                  // Only include photoURL if it exists
                  const profileData: any = {
                    displayName: user.displayName || 'Anonymous User',
                    email: user.email || ''
                  };
                  
                  if (user.photoURL) {
                    profileData.photoURL = user.photoURL;
                  }
                  
                  await createUserProfileClient(user.uid, profileData);
                  
                  if (isNewUser) {
                    console.log('✅ New user profile created successfully');
                  } else {
                    console.log('✅ Existing user profile updated successfully');
                  }
                } catch (profileError) {
                  console.error('❌ Failed to create/update user profile:', profileError);
                  // Don't fail the auth if profile creation fails
                }
                
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                    },
                });
                
                // Redirect new users to welcome flow, existing users to main page
                if (isNewUser) {
                  router.push('/welcome');
                } else {
                  router.push('/');
                }
            } catch (err) {
                console.error("Session cookie creation failed:", err);
            }
        } else {
            setUser(null);
            fetch('/api/auth/session', { method: 'DELETE' }).catch(err => console.error("Session cookie deletion failed:", err));
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router, toast]);

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
        
        // Create user profile in Firestore
        try {
          // Only include photoURL if it exists
          const profileData: any = {
            displayName,
            email: newUser.email || ''
          };
          
          if (newUser.photoURL) {
            profileData.photoURL = newUser.photoURL;
          }
          
          await createUserProfileClient(newUser.uid, profileData);
          console.log('✅ User profile created successfully');
        } catch (profileError) {
          console.error('❌ Failed to create user profile:', profileError);
          // Don't fail the signup if profile creation fails
        }
        
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

  const getUserProfile = async () => {
    if (!user || !db) return null;
    
    try {
      const profileDoc = await getDoc(doc(db, 'user-profiles', user.uid));
      if (profileDoc.exists()) {
        return profileDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getUserProfile,
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
