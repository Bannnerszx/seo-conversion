// components/NotificationCount.jsx
'use client'

import { useEffect, useState } from 'react';

export default function NotificationCount({ userEmail }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userEmail) return;

    const es = new EventSource(
      `/api/undread-counter?userEmail=${encodeURIComponent(userEmail)}`
    );

    es.onmessage = e => {
      setCount(Number(e.data));
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [userEmail]);

  // No wrapper—just the raw number
  return <>{count}</>;
}
