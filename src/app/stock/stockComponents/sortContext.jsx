'use client'
import React, { createContext, useState, useContext } from 'react';

const SortContext = createContext();

export const SortProvider = ({ children }) => {
  // Existing State
  const [sort, setSort] = useState('dateAdded-asc');
  const [profitMap, setProfitMap] = useState(null);
  const [inspectionToggle, setInspectionToggle] = useState(null);
  const [insuranceToggle, setInsuranceToggle] = useState(null);
  const [withPhotosOnly, setWithPhotosOnly] = useState(true);

  // NEW: Clearing and Delivery State (Required for Calculator)
  const [clearingToggle, setClearingToggle] = useState(false);
  const [clearingCost, setClearingCost] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);

  return (
    <SortContext.Provider value={{ 
        insuranceToggle, setInsuranceToggle, 
        withPhotosOnly, setWithPhotosOnly, 
        sort, setSort, 
        setProfitMap, profitMap, 
        setInspectionToggle, inspectionToggle,
        
        // Export new values so Calculator & Listings can share them
        clearingToggle, setClearingToggle,
        clearingCost, setClearingCost,
        deliveryCost, setDeliveryCost
    }}>
      {children}
    </SortContext.Provider>
  );
};

export const useSort = () => useContext(SortContext);