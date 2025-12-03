'use client';

import dynamic from 'next/dynamic';

// 1. Dynamic import with ssr: false is valid here because this file is a Client Component
const ClientAppCheck = dynamic(() => import('./ClientAppCheck'), {
  ssr: false,
});

export default function ClientAppCheckWrapper() {
  return <ClientAppCheck />;
}