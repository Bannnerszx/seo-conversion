import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from 'next/navigation';
import { Select, SelectTrigger, SelectItem, SelectValue, SelectContent } from "@/components/ui/select"
import { Icon, Calculator } from 'lucide-react';
import { usePathname } from "next/navigation"
import { useRouter } from "@bprogress/next"
import { useSort } from "./sortContext"
import { useInspectionToggle } from "@/app/product/productComponents/inspectionToggle"
/**
 * A reusable price calculator card.
 *
 * Props:
 * - title: string (heading text)
 * - Icon: React component (icon to display)
 * - dropdownGroups: array of dropdown group arrays
 * - dropdownValues: object mapping placeholder to selected value
 * - onDropdownChange: fn(placeholder: string, value: any)
 * - inspectionToggle: boolean
 * - onInspectionChange: fn(checked: boolean)
 * - insurance: boolean
 * - onInsuranceChange: fn(checked: boolean)
 * - inspectionData: object ({ isToggleDisabled: boolean })
 * - isRequired: boolean (forces inspection on)
 * - onSubmit: fn()
 */
const Dropdown = ({ placeholder, options, value, onChange, containerRef }) => {
    return (
        <div className="relative inline-block w-full">
            <Select value={decodeURIComponent(value)} onValueChange={onChange}>
                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent container={containerRef.current} className="z-[9004]">
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
export default function PriceCalculatorCard({ countryArray, context, onClose }) {
    const searchParams = useSearchParams();
    const [pendingUrlPort, setPendingUrlPort] = useState(null);
    const [pendingUrlInspection, setPendingUrlInspection] = useState(null);
    const [didHydrateInspectionFromUrl, setDidHydrateInspectionFromUrl] = useState(false);

    const preferUrlInspectionRef = useRef(false);
    const containerRef = useRef(null)
    const router = useRouter()
    const pathname = usePathname();
    const { setProfitMap, setInspectionToggle, inspectionToggle } = useSort();
    const [ports, setPorts] = useState([])
    const [selectedCountry, setSelectedCountry] = useState('');
    const [dropdownValuesLocations, setDropdownValuesLocations] = useState({
        'Select Country': 'none',
        'Select Port': 'none',
    })

    useEffect(() => {
        if (!selectedCountry) {
            setPorts([])
            return
        }

        const getPorts = async () => {
            try {
                const res = await fetch(
                    `/api/ports?ports=${encodeURIComponent(selectedCountry)}`
                )
                if (!res.ok) throw new Error(res.statusText)
                const data = await res.json()
                setPorts(Array.isArray(data.ports) ? data.ports : [])
            } catch (err) {
                console.error('Error fetching ports:', err)
                setPorts([])
            }
        }
        getPorts()
    }, [selectedCountry])

    // 2) Build your dropdown groups
    const dropdownGroupsLocations = [
        [
            {
                placeholder: 'Select Country',
                options: [
                    { value: 'none', label: 'Select Country' },
                    ...countryArray?.map((c) => ({
                        value: c,
                        label: c === 'D_R_Congo' ? 'D.R. Congo' : c,
                    })),
                ],
            },
            {
                placeholder: 'Select Port',
                options: [
                    { value: 'none', label: 'Select Port' },
                    ...(ports.length > 0
                        ? ports.map((port) => ({
                            value: port.replace(/\./g, '_'),
                            label: port,
                        }))
                        : [{ value: 'Others', label: 'Others' }]),
                ],
            },
        ],
    ];
    const selectedPort = dropdownValuesLocations["Select Port"]
    const { inspectionData } = useInspectionToggle(dropdownValuesLocations);
    const isRequired = inspectionData?.inspectionIsRequired === "Required";
    useEffect(() => {
        // 1) Force on if required by port
        if (isRequired) {
            setInspectionToggle(true);
            return;
        }

        // 2) If URL contains an inspection value, honor it (don’t overwrite)
        if (preferUrlInspectionRef.current && pendingUrlInspection !== null) {
            setInspectionToggle(!!pendingUrlInspection);
            return;
        }

        // 3) If the user manually toggled, don’t auto-override anymore
        if (userSetInspectionRef.current) return;

        // 4) Otherwise fall back to inspectionData or false
        if (typeof inspectionData?.toggle === 'boolean') {
            setInspectionToggle(inspectionData.toggle);
        } else {
            setInspectionToggle(false);
        }
    }, [isRequired, pendingUrlInspection, inspectionData?.toggle, setInspectionToggle]);
    useEffect(() => {
        const getPortInspection = async () => {
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
    }, [selectedPort])

    const handleDropdownChangeLocation = (placeholder, value) => {
        // update the individual dropdown’s value
        setDropdownValuesLocations((prev) => ({
            ...prev,
            [placeholder]: value,
        }))

        if (placeholder === 'Select Country') {
            // when country changes, update selectedCountry (and reset the port dropdown)
            setSelectedCountry(value === 'none' ? '' : value)
            setDropdownValuesLocations((prev) => ({
                ...prev,
                'Select Port': 'none',
            }))
        }
    };
    const [insurance, setInsurance] = useState(false)

    const userSetInspectionRef = useRef(false);
    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        onClose();

        const response = await fetch('/api/country-port-selection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: selectedCountry, port: selectedPort }),
        });

        const result = await response.json();

        const params = new URLSearchParams(window.location.search);

        const setPersist = (k, v) => {
            document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=31536000`;
            localStorage.setItem(k, v);
        };
        const clearPersist = (k) => {
            document.cookie = `${k}=; path=/; max-age=0`;
            localStorage.removeItem(k);
        };

        if (result.country && result.country.toLowerCase() !== 'none') {
            params.set('country', result.country);
            setPersist('stock_country', result.country);
        } else {
            params.delete('country');
            clearPersist('stock_country');
        }

        if (result.port && result.port.toLowerCase() !== 'none') {
            params.set('port', result.port);
            setPersist('stock_port', result.port);
        } else {
            params.delete('port');
            clearPersist('stock_port');
        }
        if (isRequired || inspectionToggle) {
            params.set('inspection', '1');
            setPersist('stock_inspection', '1');
        } else {
            params.delete('inspection');
            clearPersist('stock_inspection');
        }
        const finalQuery = params.toString();
        const finalUrl = finalQuery ? `${pathname}?${finalQuery}` : pathname;
        router.replace(finalUrl, { scroll: false });
    };
    useEffect(() => {
        // already reading country/port...
        const urlCountry = searchParams?.get('country');
        const urlPortRaw = searchParams?.get('port');
        const urlInspectionRaw = searchParams?.get('inspection'); // <-- NEW

        // country (existing)
        if (urlCountry && urlCountry.toLowerCase() !== 'none') {
            setSelectedCountry(urlCountry);
            setDropdownValuesLocations((prev) => ({ ...prev, 'Select Country': urlCountry }));
        } else if (urlCountry === 'none' || urlCountry === '' || urlCountry === null) {
            setSelectedCountry('');
            setDropdownValuesLocations((prev) => ({ ...prev, 'Select Country': 'none' }));
        }

        // port (existing)
        if (urlPortRaw && urlPortRaw.toLowerCase() !== 'none') {
            setPendingUrlPort(urlPortRaw);
        } else if (urlPortRaw === 'none' || urlPortRaw === '' || urlPortRaw === null) {
            setDropdownValuesLocations((prev) => ({ ...prev, 'Select Port': 'none' }));
        }
        if (urlInspectionRaw !== null) {
            const val = /^(1|true|on|yes)$/i.test(urlInspectionRaw);
            setPendingUrlInspection(val);
            preferUrlInspectionRef.current = true;     // <-- add this
        } else {
            // param removed → stop preferring URL unless user toggled later
            preferUrlInspectionRef.current = false;    // <-- add this
        }
        // inspection (NEW) — store temporarily until we know if the port requires inspection
        if (urlInspectionRaw !== null) {
            const val = /^(1|true|on|yes)$/i.test(urlInspectionRaw);
            setPendingUrlInspection(val);
            setDidHydrateInspectionFromUrl(false); // allow a one-time hydrate below
        }
    }, [searchParams]);


    useEffect(() => {
        if (!pendingUrlPort) return;
        if (!Array.isArray(ports) || ports.length === 0) return;

        const normalize = (p) => p.replace(/\./g, '_');
        const wanted = normalize(pendingUrlPort);

        const exists = ports.some((p) => normalize(p).toLowerCase() === wanted.toLowerCase());

        setDropdownValuesLocations((prev) => ({
            ...prev,
            'Select Port': exists ? wanted : 'Others', // fallback if not found
        }));

        setPendingUrlPort(null);
    }, [ports, pendingUrlPort]);

    const calcContent = (
        <>
            <Card className="p-6 shadow-lg ">
                <h3 className="font-semibold text-lg mb-6 flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                    Price Calculator
                </h3>

                <div className="space-y-2">
                    <div>
                        {dropdownGroupsLocations.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-2">
                                {group.map((dropdown, index) => (
                                    <div key={index}>
                                        <Label className="text-sm font-medium mb-2 block">
                                            {dropdown.placeholder === "Select Country" ? "Country" : "Port"}
                                        </Label>
                                        <Dropdown
                                            containerRef={containerRef}
                                            placeholder={dropdown.placeholder}
                                            options={dropdown.options}
                                            value={dropdownValuesLocations[dropdown.placeholder] || ""}
                                            onChange={(value) => handleDropdownChangeLocation(dropdown.placeholder, value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2 pt-4 border-blue-200">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="inspection" className="text-sm font-medium text-blue-800">
                                Inspection
                            </Label>
                            <Switch
                                id="inspection"
                                checked={isRequired ? true : inspectionToggle}
                                disabled={inspectionData?.isToggleDisabled || isRequired}
                                onCheckedChange={(checked) => {
                                    if (!isRequired) {
                                        userSetInspectionRef.current = true;
                                        setInspectionToggle(checked);

                                        // keep URL + cookies/localStorage in sync
                                        const params = new URLSearchParams(window.location.search);
                                        const setPersist = (k, v) => {
                                            document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=31536000`;
                                            localStorage.setItem(k, v);
                                        };
                                        const clearPersist = (k) => {
                                            document.cookie = `${k}=; path=/; max-age=0`;
                                            localStorage.removeItem(k);
                                        };

                                        if (checked) {
                                            params.set('inspection', '1');
                                            setPersist('stock_inspection', '1');
                                        } else {
                                            params.delete('inspection');
                                            clearPersist('stock_inspection');
                                        }

                                        const q = params.toString();
                                        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
                                    }
                                }}
                                className="data-[state=checked]:bg-blue-600"
                            />

                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="insurance" className="text-sm font-medium text-blue-800">
                                Insurance
                            </Label>
                            <Switch
                                id="insurance"
                                checked={insurance}
                                onCheckedChange={setInsurance}
                                className="data-[state=checked]:bg-blue-600"
                            />
                        </div>


                    </div>

                    <Button onClick={handleSubmit} size="lg" className="w-full bg-[#0000ff] hover:bg-[#0000dd] text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                        Calculate Total Price
                    </Button>
                </div>
            </Card>
        </>
    )
    const sidebarCalc = (
        <>
            <div className="pb-4">


                <div className="space-y-4">
                    <div>
                        {dropdownGroupsLocations.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-2">
                                {group.map((dropdown, index) => (
                                    <div key={index}>
                                        <Label className="text-sm font-medium mb-2 block">
                                            {dropdown.placeholder === "Select Country" ? "Country" : "Port"}
                                        </Label>
                                        <Dropdown
                                            containerRef={containerRef}
                                            placeholder={dropdown.placeholder}
                                            options={dropdown.options}
                                            value={dropdownValuesLocations[dropdown.placeholder] || ""}
                                            onChange={(value) => handleDropdownChangeLocation(dropdown.placeholder, value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-5 pt-4 border-blue-200">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="inspection" className="text-sm font-medium text-blue-800">
                                Inspection
                            </Label>
                            <Switch
                                id="inspection"
                                checked={isRequired ? true : inspectionToggle}
                                disabled={inspectionData?.isToggleDisabled || isRequired}
                                onCheckedChange={(checked) => {
                                    if (!isRequired) {
                                        setInspectionToggle(checked);

                                        // keep URL + cookies/localStorage in sync
                                        const params = new URLSearchParams(window.location.search);
                                        const setPersist = (k, v) => {
                                            document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=31536000`;
                                            localStorage.setItem(k, v);
                                        };
                                        const clearPersist = (k) => {
                                            document.cookie = `${k}=; path=/; max-age=0`;
                                            localStorage.removeItem(k);
                                        };

                                        if (checked) {
                                            params.set('inspection', '1');
                                            setPersist('stock_inspection', '1');
                                        } else {
                                            params.delete('inspection');
                                            clearPersist('stock_inspection');
                                        }

                                        const q = params.toString();
                                        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
                                    }
                                }}
                                className="data-[state=checked]:bg-blue-600"
                            />

                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="insurance" className="text-sm font-medium text-blue-800">
                                Insurance
                            </Label>
                            <Switch
                                id="insurance"
                                checked={insurance}
                                onCheckedChange={setInsurance}
                                className="data-[state=checked]:bg-blue-600"
                            />
                        </div>


                    </div>

                    <Button onClick={handleSubmit} size="lg" className="p-3 w-full bg-[#0000ff] hover:bg-[#0000dd] text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                        Calculate Total Price
                    </Button>
                </div>
            </div>
        </>
    );
    if (context === "sidebar") {
        return (
            <div ref={containerRef} className="px-4 gap-2 w-full mb-4">
                {sidebarCalc}
            </div>
        )
    }
    return (
        <div ref={containerRef}>
            {calcContent}
        </div>
    );
}
