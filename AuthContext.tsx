import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { auth } from './firebaseConfig';
import { recipeStore } from './recipeStore';

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
  const prevUserRef = useRef<User | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    // onAuthStateChanged returns an Unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const prevUser = prevUserRef.current;
      setUser(firebaseUser);
      setLoading(false);

      // Clear recipe on login or logout, but not on first load
      if (!isFirstLoadRef.current && ((prevUser === null && firebaseUser !== null) || (prevUser !== null && firebaseUser === null))) {
        recipeStore.set(null);
      }

      prevUserRef.current = firebaseUser;
      isFirstLoadRef.current = false;
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