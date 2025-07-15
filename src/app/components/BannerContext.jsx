"use client";

import React, { createContext, useState, useEffect } from "react";

export const BannerContext = createContext(false);

export function BannerProvider({ children }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    fetch("/api/show-banner", { credentials: "same-origin" })
      .then((res) => res.json())
      .then(({ showBanner }) => setShowBanner(showBanner))
      .catch(() => {
        /* swallow errors */
      });
  }, []);

  return (
    <BannerContext.Provider value={showBanner}>
      {children}
    </BannerContext.Provider>
  );
}
