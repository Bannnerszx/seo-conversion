'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRedirect({ to }) {
  const router = useRouter();

  useEffect(() => {
    router.push(to);
  }, [router, to]);

  return null;
}
