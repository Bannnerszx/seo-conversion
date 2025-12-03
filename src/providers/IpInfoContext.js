"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const IpInfoContext = createContext(null);

export const IpInfoProvider = ({ children }) => {
  const [ipInfo, setIpInfo] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    // 1. DELAY the fetch by 2 seconds to let LCP finish first
    const timer = setTimeout(() => {
      Promise.all([
        fetch("https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo", { signal }).then(r => r.json()),
        fetch("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time", { signal }).then(r => r.json()),
      ])
        .then(([ip, time]) => {
          setIpInfo(ip); // You might want to store 'time' too if you need it
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error("IP fetch failed", err);
          }
        });
    }, 2000); // 👈 2000ms delay

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <IpInfoContext.Provider value={ipInfo}>
      {children}
    </IpInfoContext.Provider>
  );
};

export const useIpInfo = () => useContext(IpInfoContext);