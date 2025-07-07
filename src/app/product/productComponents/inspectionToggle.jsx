'use client'
import { useState, useEffect } from 'react';

export function useInspectionToggle(dropdownValuesLocations) {
  const [inspectionData, setInspectionData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract the selected country from dropdown values.
  const selectedCountry = dropdownValuesLocations["Select Country"];

  useEffect(() => {
    if (!selectedCountry) return;

    const url = `/api/get-inspection?country=${encodeURIComponent(selectedCountry)}`;
    setIsLoading(true);

    fetch(url)
      .then(async (response) => {
        console.log("Response status:", response.status);
        if (!response.ok) {
          // Retrieve error text from the response body.
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
        return response.json();
      })
      .then((data) => {
        setInspectionData(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setInspectionData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedCountry]);

  // Return the data values only.
  return { inspectionData, error, isLoading };
}
