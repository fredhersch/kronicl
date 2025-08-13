'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Mock user type
interface User {
  displayName: string;
  email: string;
  photoURL: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('memorylane-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('memorylane-user');
    }
    setLoading(false);
  }, []);

  const signIn = () => {
    const mockUser: User = {
      displayName: 'Alex Doe',
      email: 'alex.doe@example.com',
      photoURL: 'https://placehold.co/100x100.png',
    };
    localStorage.setItem('memorylane-user', JSON.stringify(mockUser));
    setUser(mockUser);
    router.push('/');
  };

  const signOut = () => {
    localStorage.removeItem('memorylane-user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
