'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../src/app/providers/AuthProvider'; // Import Auth to check status

// Lazy load the actual SDK
const ClientAppCheck = dynamic(() => import('./ClientAppCheck'), {
  ssr: false,
});

export default function ClientAppCheckWrapper() {
  // ⚡️ LOAD IMMEDIATELY
  // Since we have components fetching data on mount (<100ms),
  // we must initialize App Check right away to provide the token.
  return <ClientAppCheck />;
}