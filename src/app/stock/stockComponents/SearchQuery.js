"use client"
import * as React from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "@bprogress/next"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator";
import { SelectedFilters } from "./filterBubble";
import { useSort } from "./sortContext";
import { useInspectionToggle } from "@/app/product/productComponents/inspectionToggle"
import { Autocomplete } from "./autoComplete"
import MigrateButton from "./migrate-button"
import ConvertVehicleProductsButton from "./convertVehicleProducts"
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    // Set initial state
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
const Dropdown = ({ placeholder, options, value, onChange }) => {
  const isMobile = useIsMobile()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Set hydration state after the component mounts
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    // Render a basic placeholder or nothing during SSR
    return (
      <div className="relative inline-block w-full">
        <select
          value={value}
          className="w-full border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
  if (isMobile) {
    return (
      <div className="relative inline-block w-full">
        <select
          value={decodeURIComponent(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Render the Select component after hydration
  return (
    <div className="relative inline-block w-full">
      <Select value={decodeURIComponent(value)} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={index} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function CarSearch({
  carFiltersServer,
  countryArray,
  carBodytypes,
  carMakes,
  initialMaker = "",
  initialModel = "",
  initialBodyType = "",
  country,
  port
}) {

  const router = useRouter();
  const pathname = usePathname();
  const { setProfitMap, setInspectionToggle, inspectionToggle } = useSort();
  const [dropdownValues, setDropdownValues] = useState({
    make: initialMaker,
    model: initialModel,
  })

  const [carModels, setCarModels] = useState([]) || []
  const [inspection, setInspection] = React.useState(false)
  const [insurance, setInsurance] = React.useState(false)
  const [isFetchingModels, setIsFetchingModels] = useState(false)

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

  const selectedMake = dropdownValues["Select Make"]
  const model = dropdownValues["Select Model"]
  // const selectedModel = dropdownValues["Select Model"];
  const bodytype = dropdownValues["Body Type"]

  useEffect(() => {
    const getModels = async () => {
      if (!selectedMake) return
      setIsFetchingModels(true)
      try {
        const res = await fetch(`/api/models?make=${selectedMake}`)
        const data = await res.json()
        setCarModels(data.models)
      } catch (error) {
        console.error("Error fetching models:", error)
      } finally {
        setIsFetchingModels(false)
      }
    }

    getModels()
  }, [selectedMake])
  const currentYear = new Date().getFullYear()
  const minYearStart = 1970
  const years = Array.from({ length: currentYear - minYearStart + 1 }, (_, index) => currentYear - index)

  const dropdownGroups = [
    [
      {
        placeholder: "Select Make",
        options: [
          { value: "none", label: "Select Make" },
          ...carMakes.map((make) => ({
            value: make.toUpperCase(),
            label: make,
          })),
        ],
      },
      {
        placeholder: "Select Model",
        options: [
          { value: "none", label: "Select Model" },
          ...carModels.map((model) => ({
            value: model.toUpperCase(),
            label: model,
          })),
        ],
      },
      {
        placeholder: "Body Type",
        options: [
          { value: "none", label: "Body Type" },
          ...carBodytypes.map((bodytype) => ({
            value: bodytype,
            label: bodytype,
          })),
        ],
      },
    ],
    [
      {
        placeholder: "Min Price",
        options: [
          { value: "none", label: "Min Price" },
          { value: "500", label: "$500" },
          { value: "1000", label: "$1000" },
          { value: "3000", label: "$3,000" },
          { value: "5000", label: "$5,000" },
          { value: "10000", label: "$10,000" },
          { value: "15000", label: "$15,000" },
          { value: "20000", label: "$20,000" },
        ],
      },
      {
        placeholder: "Min Year",
        options: [
          { value: "none", label: "Min Year" },
          ...years.map((year) => ({
            value: year.toString(),
            label: year.toString(),
          })),
        ],
      },
      {
        placeholder: "Min Mileage",
        options: [
          { value: "none", label: "Min Mileage" },
          { value: "50000", label: "50,000 km" },
          { value: "100000", label: "100,000 km" },
          { value: "150000", label: "150,000 km" },
        ],
      },
    ],
    [
      {
        placeholder: "Max Price",
        options: [
          { value: "none", label: "Max Price" },
          { value: "500", label: "$500" },
          { value: "1000", label: "$1000" },
          { value: "3000", label: "$3,000" },
          { value: "5000", label: "$5,000" },
          { value: "10000", label: "$10,000" },
          { value: "15000", label: "$15,000" },
          { value: "20000", label: "$20,000" },
        ],
      },
      {
        placeholder: "Max Year",
        options: [
          { value: "none", label: "Max Year" },
          ...years.map((year) => ({
            value: year.toString(),
            label: year.toString(),
          })),
        ],
      },
      {
        placeholder: "Max Mileage",
        options: [
          { value: "none", label: "Max Mileage" },
          { value: "200000", label: "200,000 km" },
          { value: "250000", label: "250,000 km" },
          { value: "300000", label: "300,000 km" },
        ],
      },
    ],
  ]

  const [ports, setPorts] = useState([])
  const [dropdownValuesLocations, setDropdownValuesLocations] = useState({
    "Select Country": country,
    "Select Port": port,
  });
  const selectedCountry = dropdownValuesLocations["Select Country"]
  const selectedPort = dropdownValuesLocations["Select Port"]

  const { inspectionData } = useInspectionToggle(dropdownValuesLocations);
  // const [inspectionToggle, setInspectionToggle] = useState(inspectionData?.toggle);
  const isRequired = inspectionData?.inspectionIsRequired === "Required";
  useEffect(() => {
    setInspectionToggle(inspectionData?.toggle);
    if (!isRequired) {
      setInspectionToggle(false);
    }
  }, [selectedCountry, isRequired]);

  useEffect(() => {
    const getPortInspection = async () => {
      // Log the raw value for debugging
      console.log("selectedPort raw value:", selectedPort);

      // More comprehensive check for invalid values
      if (
        selectedPort === undefined ||
        selectedPort === null ||
        selectedPort === 'none' ||
        (typeof selectedPort === 'string' && selectedPort.trim() === '')
      ) {
        setProfitMap('');
        console.log("Skipping API call for invalid selectedPort:", selectedPort);
        return;
      }

      try {
        console.log("Making API call for selectedPort:", selectedPort);
        const res = await fetch(`/api/inspection?selectedPort=${encodeURIComponent(selectedPort)}`);
        const data = await res.json();
        setProfitMap(data?.portsInspection?.profitPrice);
      } catch (error) {
        console.error("Error fetching port data:", error);
      }
    };

    // Only run the effect if component is mounted
    getPortInspection();
  }, [selectedPort]);

  const handleSubmit = async (e) => {


    // Call the API route to process the country and port data
    const response = await fetch('/api/country-port-selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: selectedCountry, port: selectedPort }),
    });

    const result = await response.json();

    // Get the current query string from the URL (if any)
    const currentQuery = window.location.search;
    const params = new URLSearchParams(currentQuery);

    // Add country only if it's not "none"
    if (result.country && result.country.toLowerCase() !== 'none') {
      params.set('country', result.country);
    } else {
      params.delete('country');
    }

    // Add port only if it's not "none"
    if (result.port && result.port.toLowerCase() !== 'none') {
      params.set('port', result.port);
    } else {
      params.delete('port');
    }

    // Construct the final URL: if there are no query parameters, use just the pathname.
    const finalQuery = params.toString();
    const finalUrl = finalQuery ? `${pathname}?${finalQuery}` : pathname;

    router.push(finalUrl);
  };


  useEffect(() => {
    const getPorts = async () => {
      if (!selectedCountry) return
      setIsFetchingModels(true)
      try {
        // Sending query parameter as "ports"
        const res = await fetch(`/api/ports?ports=${selectedCountry}`)
        const data = await res.json()
        setPorts(data.ports)
      } catch (error) {
        console.error("Error fetching ports:", error)
      } finally {
        setIsFetchingModels(false)
      }
    }

    getPorts()
  }, [selectedCountry]);







  const handleDropdownChangeLocation = (key, value) => {
    setDropdownValuesLocations((prevValues) => {
      if (key === "Select Country") {
        return {
          ...prevValues,
          [key]: value,
          "Select Port": "",
        }
      }
      return {
        ...prevValues,
        [key]: value,
      }
    })
  }
  const dropdownGroupsLocations = [
    [
      {
        placeholder: "Select Country",
        options: [
          { value: "none", label: "Select Country" },
          ...countryArray.map((country) => ({
            value: country,
            label: country === "D_R_Congo" ? "D.R. Congo" : country,
          })),
        ],
      },
      {
        placeholder: "Select Port",
        options: [
          { value: "none", label: "Select Port" },
          // if there are ports, map them; otherwise add a single "Others" entry
          ...(ports.length > 0
            ? ports.map((port) => {
              const safeValue = port.replace(/\./g, "_");
              return { value: safeValue, label: port };
            })
            : [{ value: 'Others', label: "Others" }]),
        ],
      },
    ],
  ];

  const handleSearch = (values = dropdownValues, searchKeywords) => {
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
    const finalBodytype =
      bodytypeRaw && bodytypeRaw !== "none"
        ? decodeURIComponent(bodytypeRaw)
        : "";
    const finalMinYear = minYear === "none" ? "" : minYear;
    const finalMaxYear = maxYear === "none" ? "" : maxYear;
    const finalMinPrice = minPrice === "none" ? "" : minPrice;
    const finalMaxPrice = maxPrice === "none" ? "" : maxPrice;
    const finalMinMileage = minMileage === "none" ? "" : minMileage;
    const finalMaxMileage = maxMileage === "none" ? "" : maxMileage;
    const finalKeyword = !searchKeywords ? "" : searchKeywords;
    let route = "/stock";
    if (finalMaker) {
      route += `/${finalMaker}`;
      if (finalModel) {
        route += `/${finalModel}`;
      }
    }

    const queryParams = {};
    if (finalBodytype) queryParams.bodytype = finalBodytype;
    if (selectedCountry) queryParams.country = selectedCountry;
    if (selectedPort) queryParams.port = selectedPort;
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



  const handleReset = () => {

    setDropdownValues((prevValues) => Object.fromEntries(Object.entries(prevValues).map(([key]) => [key, ""])))

    // Clear search input if needed
    // if (searchInputRef.current) {
    //   searchInputRef.current.value = "";
    // }
  }

  // Handle removing car filters
  const handleRemoveCarFilter = (key) => {
    // Create a new state value locally
    let updatedValues = { ...dropdownValues, [key]: "none" };

    // If removing make, also clear the model

    if (key === "Select Make") {
      updatedValues = { ...updatedValues, "Select Make": "none", "Select Model": "none" };
    }


    setDropdownValues(updatedValues);

    // Immediately trigger handleSearch with the newly computed values
    handleSearch(updatedValues);
  };
  // Handle removing location filters
  const handleRemoveLocationFilter = (key) => {
    setDropdownValuesLocations((prevValues) => ({
      ...prevValues,
      [key]: "",
    }))

    // If removing country, also clear port
    if (key === "Select Country") {
      setDropdownValuesLocations((prevValues) => ({
        ...prevValues,
        "Select Country": "",
        "Select Port": "",
      }))
    }
  }

  // Toggle handlers for inspection and insurance
  const handleToggleInspection = () => setInspection(!inspection)
  const handleToggleInsurance = () => setInsurance(!insurance)
  const [isOpen, setIsOpen] = useState(false);





  return (
    <>
      <div className="md:hidden px-4 py-6">

        <SelectedFilters
          carFiltersServer={carFiltersServer}
          carFilters={dropdownValues}
          calculatorFilters={dropdownValuesLocations}
          inspection={inspection}
          insurance={insurance}
          onRemoveCarFilter={handleRemoveCarFilter}
          onRemoveCalculatorFilter={handleRemoveLocationFilter}
          onToggleInspection={handleToggleInspection}
          onToggleInsurance={handleToggleInsurance}
          handleSearch={handleSearch}
        />

        <div className="bg-white rounded-lg shadow-lg border border-gray-100 mx-auto max-w-xl relative transform transition-all duration-300 hover:shadow-xl animate-float">
          <Sheet>
            <SheetTrigger asChild>
              <button
                onClick={(e) => e.currentTarget.blur()} // Remove focus from the button
                className="w-full flex items-center p-4 hover:bg-gray-50"
              >
                <Search className="h-5 w-5 mr-4" />
                <span className="font-medium">Find Used Cars</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Find Your Perfect Car</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                {dropdownGroups.flat().map((dropdown, index) => (
                  <Dropdown
                    key={index}
                    placeholder={dropdown.placeholder}
                    options={dropdown.options}
                    value={dropdownValues[dropdown.placeholder] || ""}
                    onChange={(value) => handleDropdownChange(dropdown.placeholder, value)}
                  />
                ))}
                <div className="relative">
                  <Autocomplete
                    dropdownGroups={dropdownGroups}
                    onSelect={(opt) => {
                      handleDropdownChange(opt.category, opt.value);
                    }}
                    handleSearch={handleSearch}
                  />
                </div>
                <Button
                  onClick={() => handleSearch()}
                  className="w-full bg-[#0000ff] hover:bg-[#0000dd] rounded-xs"
                  size="lg"
                >
                  Search
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Separator />

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="w-full flex items-center p-4 hover:bg-gray-50">
                <span className="flex items-center justify-center h-5 w-5 mr-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <span className="font-medium">Total Price Calculators</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Total Price Calculator</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                {dropdownGroupsLocations.flat().map((dropdown, index) => (
                  <Dropdown
                    key={index}
                    placeholder={dropdown.placeholder}
                    options={dropdown.options}
                    value={dropdownValuesLocations[dropdown.placeholder] || ""}
                    onChange={(value) => handleDropdownChangeLocation(dropdown.placeholder, value)}
                  />
                ))}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mobile-inspection" className="cursor-pointer">
                      Inspection
                    </Label>
                    <Switch
                      id="mobile-inspection"
                      checked={isRequired ? true : inspectionToggle}
                      disabled={inspectionData?.isToggleDisabled || isRequired}
                      onCheckedChange={(checked) => {
                        if (!isRequired) {
                          setInspectionToggle(checked);
                        }
                      }}
                      className="data-[state=checked]:bg-[#7b9cff]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="mobile-insurance" className="cursor-pointer">
                      Insurance
                    </Label>
                    <Switch id="mobile-insurance" checked={insurance} onCheckedChange={setInsurance} />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Total Price calculator will estimate the total price of the cars based on your shipping destination
                    port and other preferences
                  </p>
                  <p className="text-xs text-gray-400">Note: In some cases the total price cannot be estimated.</p>
                  <Button onClick={() => { handleSubmit(); setIsOpen(false) }} className="w-full bg-[#0000ff] hover:bg-[#0000dd] rounded-xs" size="lg">
                    Calculate
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>


      <div className="hidden md:grid md:mx-auto md:max-w-7xl md:gap-6 md:p-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Find Your Perfect Car</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              {dropdownGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.map((dropdown, index) => (
                    <Dropdown
                      key={index}
                      placeholder={dropdown.placeholder}
                      options={dropdown.options}
                      value={dropdownValues[dropdown.placeholder] || ""}
                      onChange={(value) => handleDropdownChange(dropdown.placeholder, value)}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="relative">

                {/* <Input
                  className="pl-10 rounded-xs h-10"
                  placeholder="Search by make, model, or keyword"
                  type="search"
                /> */}
                <Autocomplete
                  dropdownGroups={dropdownGroups}
                  onSelect={(opt) => {
                    handleDropdownChange(opt.category, opt.value);
                  }}
                  handleSearch={handleSearch}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleReset}
                  className="w-full border-2 border-[#0000ff] text-[#0000ff] bg-transparent hover:bg-[#f0f0ff] rounded-xs"
                  size="lg"
                  variant="outline"
                >
                  Reset
                </Button>
                <Button onClick={() => handleSearch()} className="w-full bg-[#0000ff] hover:bg-[#0000dd] rounded-xs" size="lg">
                  Search
                </Button>
                {/* <MigrateButton /> */}
                {/* <ConvertVehicleProductsButton /> */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>Total Price Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dropdownGroupsLocations.map((group, groupIndex) => (
              <div key={groupIndex} className="grid gap-4 sm:grid-cols-2">
                {group.map((dropdown, index) => (
                  <Dropdown
                    key={index}
                    placeholder={dropdown.placeholder}
                    options={dropdown.options}
                    value={dropdownValuesLocations[dropdown.placeholder] || ""}
                    onChange={(value) => handleDropdownChangeLocation(dropdown.placeholder, value)}
                  />
                ))}
              </div>
            ))}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="inspection" className="cursor-pointer">
                  Inspection
                </Label>
                <Switch
                  id="inspection"
                  checked={isRequired ? true : inspectionToggle}
                  disabled={inspectionData?.isToggleDisabled || isRequired}
                  onCheckedChange={(checked) => {
                    if (!isRequired) {
                      setInspectionToggle(checked);
                    }
                  }}
                  className="data-[state=checked]:bg-[#7b9cff]"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="insurance" className="cursor-pointer">
                  Insurance
                </Label>
                <Switch id="insurance" checked={insurance} onCheckedChange={setInsurance} />
              </div>
            </div>

            <div className="space-y-[23px]">
              <p className="text-sm text-gray-500">
                Total Price calculator will estimate the total price of the cars based on your shipping destination port
                and other preferences
              </p>
              <p className="text-xs text-gray-400">Note: In some cases the total price cannot be estimated.</p>
              <Button onClick={() => handleSubmit()} className="w-full bg-[#0000ff] hover:bg-[#0000dd] rounded-xs" size="lg">
                Calculate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
