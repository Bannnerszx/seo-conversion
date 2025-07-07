'use client'// SortContext.jsx
import React, { createContext, useState, useContext } from 'react';

const SortContext = createContext();

export const SortProvider = ({ children }) => {
  const [sort, setSort] = useState('dateAdded-asc');
  const [profitMap, setProfitMap] = useState(null);
  const [inspectionToggle, setInspectionToggle] = useState(null);
  return (
    <SortContext.Provider value={{ sort, setSort, setProfitMap, profitMap, setInspectionToggle, inspectionToggle }}>
      {children}
    </SortContext.Provider>
  );
};

export const useSort = () => useContext(SortContext);