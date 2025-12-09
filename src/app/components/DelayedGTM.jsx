'use client'
import { useEffect, useState } from "react";

export default function DelayedGTM({ gtmId }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // ⏳ Wait 5 seconds before injecting GTM
    // This allows the LCP image and critical content to load fully first.
    const timer = setTimeout(() => {
      setLoaded(true);
      
      // Standard GTM Snippet
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer', gtmId);
      
    }, 8000); 

    return () => clearTimeout(timer);
  }, [gtmId]);

  return null;
}