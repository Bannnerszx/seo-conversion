"use client";

import React from "react";
import { useIpInfo } from "@/providers/IpInfoContext";
import ZambiaPopup from "@/app/components/ZambiaPopup";

const ZambiaChecker = () => {
  const ipInfo = useIpInfo();

  // List of countries that should trigger the popup
  const popupCountries = ["Poland", "Germany", "Netherlands", "Zambia", "Germany", "Japan"];

  // If we don’t yet have IP info, render nothing
  if (!ipInfo) return null;

  // Show the popup if the user's country is in our list
  return popupCountries.includes(ipInfo.country_name) ? <ZambiaPopup /> : null;
};

export default ZambiaChecker;
