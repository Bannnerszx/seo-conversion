// app/components/ClientWrapper.jsx
'use client';

import { useState, useEffect, useRef } from 'react';

export default function ClientWrapper({ id, children, className }) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Desktop: show immediately
    if (window.innerWidth >= 768) {
      setVisible(true);
      return;
    }

    // Mobile: observe when this wrapper enters view
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );

    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div id={id} ref={containerRef} className={className}>
      {visible ? children : null}
    </div>
  );
}
