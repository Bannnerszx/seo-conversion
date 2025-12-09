'use client'
import { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { getFirebaseAuth } from "../../../firebase/clientApp"; 
import { usePathname } from "next/navigation"; 

const AuthContext = createContext({
  user: null,
  loading: true,
  logOut: async () => { },
  activateAuth: () => {}
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children, initialUser, hasSessionCookie }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  
  // ✅ NEW: Track if we ever turned on Auth during this session
  const [authActivated, setAuthActivated] = useState(false);
  const isInitializing = useRef(false); // Guard against double-init

  // 1. Determine if we NEED to load auth
  const authPaths = ['/login', '/signup', '/profile', '/chats', '/orders', '/favorites'];
  
  // ✅ LOGIC UPDATE: If auth was EVER activated, keep it on (Sticky).
  const shouldAutoInit = hasSessionCookie || authActivated || authPaths.some(p => pathname?.startsWith(p));

  const initAuth = useCallback(async () => {
    // Prevent multiple initializations
    if (isInitializing.current) return;
    isInitializing.current = true;

    // ✅ Mark as active so it stays on even if we go to Homepage
    setAuthActivated(true);

    try {
      const [auth, { onAuthStateChanged }] = await Promise.all([
        getFirebaseAuth(),
        import('firebase/auth')
      ]);

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
      isInitializing.current = false; // Reset on error
    }
  }, []);

  useEffect(() => {
    let unsubscribe;

    // 🛡️ SAFETY TIMER: Force UI to load if Firebase hangs
    const safetyTimer = setTimeout(() => {
        setLoading(prev => {
            if (prev) {
                // console.warn("Auth took too long - forcing UI.");
            }
            return false;
        });
    }, 4000);

    if (shouldAutoInit) {
        initAuth().then(unsub => { unsubscribe = unsub });
    } else {
        // Guest on Homepage -> Show content immediately
        setLoading(false);
    }

    return () => { 
        if (unsubscribe) unsubscribe();
        clearTimeout(safetyTimer);
    };
  }, [shouldAutoInit, initAuth]);

  const logOut = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logout-api', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        // Force hard refresh to clear any client state
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Error logging out:", error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setLoading, loading, logOut, activateAuth: initAuth }}>
        {children}
    </AuthContext.Provider>
  );
};