import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/types';
import { onAuthChange, getCurrentUser, getUserData, signIn as firebaseSignIn, signUpPrincipal as firebaseSignUpPrincipal, signOut as firebaseSignOut } from '@/services/firebase/authService';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUpPrincipal: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await firebaseSignIn(email, password);
    setUserData(data);
  };

  const signUpPrincipal = async (email: string, password: string, name: string) => {
    const data = await firebaseSignUpPrincipal(email, password, name);
    setUserData(data);
  };

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signUpPrincipal, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};