// src/app/providers/AuthProvider.jsx
'use client'
import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext({
  user: null,
  loading: false,
  logOut: async () => { },
  counts: 0
});

export const useAuth = () => useContext(AuthContext);

// 1. Accept new props: initialUser and hasSessionCookie
export default function AuthProvider({ children, initialUser, hasSessionCookie }) {
  const [user, setUser] = useState(initialUser); // Starts as null (Guest)
  const [counts, setCounts] = useState(0);
  const [loading, setLoading] = useState(false);

  // 2. Client-Side Verification Effect
  useEffect(() => {
    // Only fetch if we have a cookie AND we haven't verified the user yet
    if (hasSessionCookie && !user) {
      verifySession();
    }
  }, [hasSessionCookie]);

  const verifySession = async () => {
    try {
      // This fetch happens in the browser, unblocking the initial page load
      const res = await fetch('/api/verify-session');
      const data = await res.json();
      
      if (data.valid) {
        // Update state to "Logged In"
        setUser(data.claims.email);
        
        // Optional: Fetch notification counts here now that we have the user
        // fetchNotificationCounts(data.claims.email).then(setCounts);
      }
    } catch (error) {
      console.error("Session verification failed", error);
    }
  };

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
    <AuthContext.Provider value={{ user, setLoading, loading, logOut, counts }}>
        {children}
    </AuthContext.Provider>
  );
};