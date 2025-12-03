"use client";

import React, { useState, useEffect } from "react";
import { useIpInfo } from "@/providers/IpInfoContext";
import dynamic from "next/dynamic"; // 1. Import dynamic

// 2. Lazy load the popup component
const ZambiaPopup = dynamic(() => import("@/app/components/ZambiaPopup"), {
  ssr: false, // Popups don't need SEO
});

const ZambiaChecker = () => {
  const ipInfo = useIpInfo();
  // List of countries that should trigger the popup
  const popupCountries = ["Zambia", "Tanzania"];

  // 3. Simple check
  const showPopup = ipInfo && popupCountries.includes(ipInfo.country_name);

  if (!showPopup) return null;

  return <ZambiaPopup />;
};

export default ZambiaChecker;