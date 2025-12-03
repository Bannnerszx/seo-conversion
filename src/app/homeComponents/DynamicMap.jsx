'use client';

import dynamic from 'next/dynamic';

// 1. Move the dynamic import here
const WorldMapSection = dynamic(() => import('./MapSection'), {
  ssr: false, // 2. This is valid inside a Client Component
  loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg" />
});

export default function DynamicMap() {
  return <WorldMapSection />;
}