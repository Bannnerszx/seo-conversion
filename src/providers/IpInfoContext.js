"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const IpInfoContext = createContext(null);

export const IpInfoProvider = ({ children }) => {
  const [ipInfo, setIpInfo] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    Promise.all([
      fetch("https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo", { signal }).then(r => r.json()),
      fetch("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time", { signal }).then(r => r.json()),
    ])
      .then(([ip, time]) => {
        setIpInfo(ip);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log("Fetch aborted");
        } else {
          console.error("Preload fetch failed", err);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <IpInfoContext.Provider value={ipInfo}>
      {children}
    </IpInfoContext.Provider>
  );
};

export const useIpInfo = () => {
  return useContext(IpInfoContext);
};
