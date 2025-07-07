"use client";
import { createContext, useContext, useState } from "react";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children,currency }) => {
  // Initialize with a default currency.
  const [selectedCurrency, setSelectedCurrency] = useState({
    code: "USD",
    symbol: "USD$",
    value: 1, // default conversion value
  });

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
