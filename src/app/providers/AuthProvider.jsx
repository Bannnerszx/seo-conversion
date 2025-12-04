'use client'
import { createContext, useState, useContext, useEffect } from "react";
// 1. Import the async getter
import { getFirebaseAuth } from "../../../firebase/clientApp"; 

const AuthContext = createContext({
  user: null,
  loading: true, // Start loading as true
  logOut: async () => { },
  counts: 0
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children, initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true); // Default to true until auth loads
  const [authInstance, setAuthInstance] = useState(null);

  // 2. Initialize Auth Asynchronously
  useEffect(() => {
    let unsubscribe;
    
    const initAuth = async () => {
        try {
            const auth = await getFirebaseAuth();
            setAuthInstance(auth);
            
            // Listen for changes
            const { onAuthStateChanged } = await import('firebase/auth');
            unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                if (firebaseUser) {
                    setUser(firebaseUser.email);
                } else {
                    setUser(null);
                }
                setLoading(false);
            });
        } catch (error) {
            console.error("Auth Init Failed", error);
            setLoading(false);
        }
    };

    initAuth();
    return () => unsubscribe && unsubscribe();
  }, []);

  const logOut = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logout-api', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setLoading, loading, logOut }}>
        {children}
    </AuthContext.Provider>
  );
};