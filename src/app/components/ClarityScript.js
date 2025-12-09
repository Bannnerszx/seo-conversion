'use client'
import { useEffect } from "react";
export default function ClarityScript() {
  'use client'; // This must be a client component
  useEffect(() => {
    const timer = setTimeout(() => {
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "jyynkqpjss");
    }, 4000); // 4 second delay allows React hydration to finish first
    return () => clearTimeout(timer);
  }, []);
  return null;
}

