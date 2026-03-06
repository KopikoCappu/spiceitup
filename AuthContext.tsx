import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebaseConfig';

// 1. Define exactly what the "value" of our Context looks like
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// 2. Initialize with a default value so TS doesn't complain
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// 3. Define the Props for the Provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an Unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Export the hook to use in your screens
export const useAuth = () => useContext(AuthContext);