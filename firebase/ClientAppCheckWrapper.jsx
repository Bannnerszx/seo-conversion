'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../src/app/providers/AuthProvider'; // Import Auth to check status

// Lazy load the actual SDK
const ClientAppCheck = dynamic(() => import('./ClientAppCheck'), {
  ssr: false,
});

export default function ClientAppCheckWrapper() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const { user } = useAuth(); // Check if user is logged in

  useEffect(() => {
    // 1. If user is logged in, we likely need App Check IMMEDIATELY for Notifications/Profile
    if (user) {
        setShouldLoad(true);
        return;
    }

    // 2. If Guest, we can delay slightly to prioritize LCP (Hero Banner)
    // 2000ms is usually safe for "reading" public data like New Arrivals, 
    // assuming those components handle "loading" states gracefully.
    // If you still get errors, reduce this to 500 or 0.
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 5000); 

    return () => clearTimeout(timer);
  }, [user]);

  if (!shouldLoad) return null;

  return <ClientAppCheck />;
}