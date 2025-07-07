'use client'

import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCities } from "@/app/actions/actions";
const CitySelectorCombobox = ({ value: countryCode, onChange }) => {
  const [open, setOpen] = useState(false);
  const [cityValue, setCityValue] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [cityList, setCityList] = useState([]);
  
  // Load cities when popover opens or country changes
  useEffect(() => {
    // Only fetch if the popover is open and we have a country code
    if (open && countryCode) {
      const loadCities = async () => {
        setLoading(true);
        try {
          const cities = await getCities(countryCode);
          setCityList(Array.isArray(cities) ? cities : []);
        } catch (err) {
          console.error("Error fetching cities:", err);
          setCityList([]);
        } finally {
          setLoading(false);
        }
      };
      
      loadCities();
    }
  }, [open, countryCode]);
  
  // Filter cities based on search with a limit
  const displayedCities = search.trim() !== "" 
    ? cityList.filter(city => city.toLowerCase().includes(search.toLowerCase())).slice(0, 100)
    : cityList.slice(0, 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {cityValue || "Select city..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search city..." 
            value={search}
            onValueChange={setSearch}
          />
          
          {loading ? (
            <div>Loading cities...</div>
          ) : displayedCities.length === 0 ? (
            <CommandEmpty>No cities found.</CommandEmpty>
          ) : (
            <CommandGroup className="max-h-64 overflow-auto">
              {displayedCities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={(currentValue) => {
                    setCityValue(currentValue);
                    onChange?.(currentValue);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      cityValue === city ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
              {cityList.length > 100 && displayedCities.length === 100 && (
                <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                  Showing first 100 results. Refine your search for more options.
                </div>
              )}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CitySelectorCombobox;