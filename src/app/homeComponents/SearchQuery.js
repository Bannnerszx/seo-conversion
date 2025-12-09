"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { Autocomplete } from "../stock/stockComponents/autoComplete"

// 1. Optimize Dropdown with React.memo to prevent unnecessary re-renders
const Dropdown = memo(({ placeholder, options, value, onChange }) => {
  return (
    <div className="relative inline-block w-full">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={placeholder} className="w-full border p-3 rounded-none bg-white py-[20px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border rounded-none">
          {options.map((option, index) => (
            <SelectItem key={index} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
});

// Display name for debugging
Dropdown.displayName = "Dropdown";

const SearchQuery = ({ initialIsMobile = false, carMakes, db, carBodytypes, initialMaker = "", initialModel = "", initialBodyType = "" }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMounted(true);

    // 3. Keep the resize listener for window resizing
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    // We don't need to call checkMobile() immediately if initialIsMobile is accurate,
    // but it's safe to leave the listener.
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // eslint-disable-next-line no-unused-vars
  const [showRequestNotice, setShowRequestNotice] = useState(false)
  const router = useRouter();
  const [query, setQuery] = useState("");

  const [dropdownValues, setDropdownValues] = useState({
    "Select Make": initialMaker.replace(/\s+/g, " "),
    "Select Model": initialModel.replace(/\s+/g, " "),
    "Body Type": initialBodyType.replace(/\s+/g, " "),
  })

  const [carModels, setCarModels] = useState([]) || []
  // eslint-disable-next-line no-unused-vars
  const [isFetchingModels, setIsFetchingModels] = useState(false)

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedMake = dropdownValues["Select Make"]

  useEffect(() => {
    const getModels = async () => {
      if (!selectedMake || selectedMake === 'none') {
        setCarModels([]);
        return;
      }
      setIsFetchingModels(true)
      try {
        const res = await fetch(`/api/models?make=${selectedMake}`)
        const data = await res.json()
        setCarModels(data.models || [])
      } catch (error) {
        console.error("Error fetching models:", error)
      } finally {
        setIsFetchingModels(false)
      }
    }

    getModels()
  }, [selectedMake])

  const handleDropdownChange = (key, value) => {
    setDropdownValues((prevValues) => {
      if (key === "Select Make") {
        return {
          ...prevValues,
          [key]: value,
          "Select Model": "",
        }
      }
      return {
        ...prevValues,
        [key]: value,
      }
    })
  }

  // 2. Memoize expensive data calculations
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const minYearStart = 1970
    return Array.from({ length: currentYear - minYearStart + 1 }, (_, index) => currentYear - index)
  }, []);

  // 3. Memoize Option Arrays
  const makeOptions = useMemo(() => [
    { value: "none", label: "Select Make" },
    ...carMakes.map((make) => ({
      value: make.toUpperCase(),
      label: make,
    })),
  ], [carMakes]);

  const modelOptions = useMemo(() => [
    { value: "none", label: "Select Model" },
    ...carModels.map((model) => ({
      value: model.toUpperCase(),
      label: model,
    })),
  ], [carModels]);

  const bodyTypeOptions = useMemo(() => [
    { value: "none", label: "Body Type" },
    ...carBodytypes.map((bodytype) => ({
      value: bodytype,
      label: bodytype,
    })),
  ], [carBodytypes]);

  const yearOptions = useMemo(() => [
    { value: "none", label: "Year" }, // Generic label for reuse
    ...years.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    })),
  ], [years]);

  // Static options (moved out of render loop effectively via useMemo with empty deps or static definition)
  const priceOptionsMin = useMemo(() => [
    { value: "none", label: "Min Price" },
    { value: "500", label: "$500" },
    { value: "1000", label: "$1000" },
    { value: "3000", label: "$3,000" },
    { value: "5000", label: "$5,000" },
    { value: "10000", label: "$10,000" },
    { value: "15000", label: "$15,000" },
    { value: "20000", label: "$20,000" },
  ], []);

  const priceOptionsMax = useMemo(() => [
    { value: "none", label: "Max Price" },
    { value: "500", label: "$500" },
    { value: "1000", label: "$1000" },
    { value: "3000", label: "$3,000" },
    { value: "5000", label: "$5,000" },
    { value: "10000", label: "$10,000" },
    { value: "15000", label: "$15,000" },
    { value: "20000", label: "$20,000" },
  ], []);

  const mileageOptionsMin = useMemo(() => [
    { value: "none", label: "Min Mileage" },
    { value: "50000", label: "50,000 km" },
    { value: "100000", label: "100,000 km" },
    { value: "150000", label: "150,000 km" },
  ], []);

  const mileageOptionsMax = useMemo(() => [
    { value: "none", label: "Max Mileage" },
    { value: "200000", label: "200,000 km" },
    { value: "250000", label: "250,000 km" },
    { value: "300000", label: "300,000 km" },
  ], []);

  // 4. Construct the group structure using memoized parts
  const dropdownGroups = useMemo(() => [
    [
      { placeholder: "Select Make", options: makeOptions },
      { placeholder: "Select Model", options: modelOptions },
      { placeholder: "Body Type", options: bodyTypeOptions },
    ],
    [
      { placeholder: "Min Price", options: priceOptionsMin },
      { placeholder: "Min Year", options: yearOptions.map(o => ({ ...o, label: o.value === "none" ? "Min Year" : o.label })) },
      { placeholder: "Min Mileage", options: mileageOptionsMin },
    ],
    [
      { placeholder: "Max Price", options: priceOptionsMax },
      { placeholder: "Max Year", options: yearOptions.map(o => ({ ...o, label: o.value === "none" ? "Max Year" : o.label })) },
      { placeholder: "Max Mileage", options: mileageOptionsMax },
    ],
  ], [makeOptions, modelOptions, bodyTypeOptions, yearOptions, priceOptionsMin, priceOptionsMax, mileageOptionsMin, mileageOptionsMax]);

  const handleSearch = (values = dropdownValues) => {
    if (typeof values !== "object" || values === null) {
      values = dropdownValues;
    }

    const selectedMake = values["Select Make"];
    const model = values["Select Model"];
    const bodytypeRaw = values["Body Type"];
    const minPrice = values["Min Price"];
    const maxPrice = values["Max Price"];
    const minYear = values["Min Year"];
    const maxYear = values["Max Year"];
    const minMileage = values["Min Mileage"];
    const maxMileage = values["Max Mileage"];

    const finalMaker = selectedMake === "none" ? "" : selectedMake;
    const finalModel = model === "none" ? "" : decodeURIComponent(model);
    const finalBodytype = bodytypeRaw && bodytypeRaw !== "none" ? decodeURIComponent(bodytypeRaw) : "";
    const finalMinYear = minYear === "none" ? "" : minYear;
    const finalMaxYear = maxYear === "none" ? "" : maxYear;
    const finalMinPrice = minPrice === "none" ? "" : minPrice;
    const finalMaxPrice = maxPrice === "none" ? "" : maxPrice;
    const finalMinMileage = minMileage === "none" ? "" : minMileage;
    const finalMaxMileage = maxMileage === "none" ? "" : maxMileage;
    const finalKeyword = !query ? "" : query;

    let route = "/stock";
    if (finalMaker) {
      route += `/${finalMaker}`;
      if (finalModel) {
        route += `/${finalModel}`;
      }
    }

    const queryParams = {};
    if (finalBodytype) queryParams.bodytype = finalBodytype;
    if (finalMinYear) queryParams.minYear = finalMinYear;
    if (finalMaxYear) queryParams.maxYear = finalMaxYear;
    if (finalMinPrice) queryParams.minPrice = finalMinPrice;
    if (finalMaxPrice) queryParams.maxPrice = finalMaxPrice;
    if (finalMinMileage) queryParams.minMileage = finalMinMileage;
    if (finalMaxMileage) queryParams.maxMileage = finalMaxMileage;
    if (finalKeyword) queryParams.searchKeywords = finalKeyword;
    const queryString = new URLSearchParams(queryParams).toString();
    const finalUrl = queryString ? `${route}?${queryString}` : route;

    router.push(finalUrl);
  };

  if (!isMounted) {
    return <div className="max-w-7xl mx-auto w-full h-80 bg-white/50 animate-pulse rounded-lg relative md:-top-20"></div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-4 md:space-y-6 relative md:-top-20 px-1">
      {isMobile ? (
        // --- MOBILE VIEW ---
        <div className="md:hidden">
          <div className="bg-white p-8 rounded-md shadow-lg space-y-4 relative -top-[20px]">
            {/* Make & Model Row */}
            <div className="grid grid-cols-2 gap-4">
              {dropdownGroups[0].slice(0, 2).map((dropdown, index) => (
                <Dropdown
                  key={index}
                  placeholder={dropdown.placeholder}
                  options={dropdown.options}
                  value={dropdownValues[dropdown.placeholder] || ""}
                  onChange={(value) => handleDropdownChange(dropdown.placeholder, value)}
                />
              ))}
            </div>

            {/* Body Type Column */}
            <div>
              <Dropdown
                placeholder={dropdownGroups[0][2].placeholder}
                options={dropdownGroups[0][2].options}
                value={dropdownValues[dropdownGroups[0][2].placeholder] || ""}
                onChange={(value) => handleDropdownChange(dropdownGroups[0][2].placeholder, value)}
              />
            </div>

            {/* Min Year & Max Year Row */}
            <div className="grid grid-cols-2 gap-4">
              {[dropdownGroups[1][1], dropdownGroups[2][1]].map((dropdown, index) => (
                <Dropdown
                  key={index}
                  placeholder={dropdown.placeholder}
                  options={dropdown.options}
                  value={dropdownValues[dropdown.placeholder] || ""}
                  onChange={(value) => handleDropdownChange(dropdown.placeholder, value)}
                />
              ))}
            </div>

            {/* Min Mileage & Max Mileage Row */}
            <div className="grid grid-cols-2 gap-4">
              {[dropdownGroups[1][2], dropdownGroups[2][2]].map((dropdown, index) => (
                <Dropdown
                  key={index}
                  placeholder={dropdown.placeholder}
                  options={dropdown.options}
                  value={dropdownValues[dropdown.placeholder] || ""}
                  onChange={(value) => handleDropdownChange(dropdown.placeholder, value)}
                />
              ))}
            </div>

            <div className="z-[9999]">
              <Autocomplete
                dropdownGroups={dropdownGroups}
                onSelect={(opt) => {
                  handleDropdownChange(opt.category, opt.value);
                }}
                handleSearch={handleSearch}
                query={query}
                setQuery={setQuery}
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={() => handleSearch()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md py-6"
            >
              Search
            </Button>
          </div>
        </div>
      ) : (
        // --- DESKTOP VIEW ---
        <div className="hidden md:block bg-white p-8 rounded-lg shadow-lg space-y-6">
          {/* Group 0 */}
          <div className="grid grid-cols-3 gap-6">
            {dropdownGroups[0].map((dropdown, index) => (
              <Dropdown
                key={index}
                placeholder={dropdown.placeholder}
                options={dropdown.options}
                value={dropdownValues[dropdown.placeholder] || ""}
                onChange={(value) => handleDropdownChange(dropdown.placeholder, value)}
              />
            ))}
          </div>

          {/* Group 1 */}
          <div className="grid grid-cols-3 gap-6">
            {dropdownGroups[1].map((dropdown, index) => (
              <Dropdown
                key={index}
                placeholder={dropdown.placeholder}
                options={dropdown.options}
                value={dropdownValues[dropdown.placeholder] || ""}
                onChange={(value) => handleDropdownChange(dropdown.placeholder, value)}
              />
            ))}
          </div>

          {/* Group 2 */}
          <div className="grid grid-cols-3 gap-6">
            {dropdownGroups[2].map((dropdown, index) => (
              <Dropdown
                key={index}
                placeholder={dropdown.placeholder}
                options={dropdown.options}
                value={dropdownValues[dropdown.placeholder] || ""}
                onChange={(value) => handleDropdownChange(dropdown.placeholder, value)}
              />
            ))}
          </div>

          {/* Search Row */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Autocomplete
                dropdownGroups={dropdownGroups}
                onSelect={(opt) => {
                  handleDropdownChange(opt.category, opt.value);
                }}
                handleSearch={handleSearch}
                query={query}
                setQuery={setQuery}
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              className="bg-[#0000ff] hover:bg-blue-700 text-white px-10 py-6 rounded-md w-full max-w-[250px]"
            >
              <span className="text-lg font-semibold text-white">Search</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchQuery