'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ClientAppCheck = dynamic(() => import('./ClientAppCheck'), {
  ssr: false,
});

export default function ClientAppCheckWrapper() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // ⚡️ PERFORMANCE FIX: Delay App Check by 8 seconds.
    // It's not needed for the initial LCP paint.
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) return null;

  return <ClientAppCheck />;
}