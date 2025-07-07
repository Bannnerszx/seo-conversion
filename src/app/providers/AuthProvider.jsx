'use client'
import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext({
  user: null,
  loading: false,
  logOut: async () => { },

});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children, decodedToken }) {
  // Use initialUser from cookies/token as the user state
  const [user, setUser] = useState(decodedToken);

  const [counts, setCounts] = useState(0)

  

  useEffect(() => {
    if (!decodedToken) {
      setUser(null)
    }
  }, [decodedToken])

  const [loading, setLoading] = useState(false);

  const logOut = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logout-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',

      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Logout failed:", errorData.message);
      } else {
        // Clear user state after a successful logout
        setUser(null);
        console.log("User successfully logged out");
        // Optionally, redirect to a login or home page:
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
