'use client'
import { createContext, useState, useContext, useEffect, useCallback } from "react";

import { getFirebaseAuth } from "../../../firebase/clientApp";
import { usePathname } from "next/navigation"; // 👈 1. Import pathname

const AuthContext = createContext({
  user: null,
  loading: true,
  logOut: async () => { },
  counts: 0,
  activateAuth: () => {} // 👈 Expose a way to manually start auth
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children, initialUser, hasSessionCookie }) { // 👈 2. Check this prop
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const pathname = usePathname();

  // Define paths that REQUIRE auth immediately
  const authPaths = ['/login', '/signup', '/profile', '/chats', '/orders', '/favorites'];
  const shouldAutoInit = hasSessionCookie || authPaths.some(p => pathname?.startsWith(p));

  // 3. Create the init function but don't run it immediately
  const initAuth = useCallback(async () => {
    if (authInitialized) return; // Prevent double run

    try {
      const [auth, { onAuthStateChanged }] = await Promise.all([
        getFirebaseAuth(),
        import('firebase/auth')
      ]);

      setAuthInstance(auth);
      setAuthInitialized(true);

      return onAuthStateChanged(auth, (firebaseUser) => {
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
  }, [authInitialized]);

  // 4. Effect: Only run if cookie exists OR we are on a login page
  useEffect(() => {
    let unsubscribe;

    if (shouldAutoInit) {
        initAuth().then(unsub => { unsubscribe = unsub });
    } else {
        // For guests on homepage: we are "done" loading (user is null)
        setLoading(false); 
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, [shouldAutoInit, initAuth]);

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
    <AuthContext.Provider value={{ user, setLoading, loading, logOut, activateAuth: initAuth }}>
        {children}
    </AuthContext.Provider>
  );
};