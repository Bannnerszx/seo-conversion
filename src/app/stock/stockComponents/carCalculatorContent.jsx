"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, MapPin, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils";
import { useSearchParams, usePathname } from 'next/navigation';
import { useRouter } from "@bprogress/next";
import { useSort } from "./sortContext";
import { useInspectionToggle } from "@/app/product/productComponents/inspectionToggle";
import { fetchInspectionPrice } from "@/app/actions/actions"; 

export default function PriceCalculatorCard({ countryArray, d2dCountries = [], context, onClose }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const containerRef = useRef(null);

    // =========================================================================
    // 1. GLOBAL CONTEXT
    // =========================================================================
    const {
        setProfitMap,
        setInspectionToggle,
        inspectionToggle,
        setInsuranceToggle,
        insuranceToggle,
        clearingToggle, setClearingToggle,
        setClearingCost,
        deliveryCost, setDeliveryCost
    } = useSort();

    // =========================================================================
    // 2. LOCAL STATE
    // =========================================================================
    const [ports, setPorts] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [dropdownValuesLocations, setDropdownValuesLocations] = useState({
        'Select Country': 'none',
        'Select Port': 'none',
    });

    // D2D & Delivery
    const [d2dMatch, setD2dMatch] = useState(null);
    const [d2dCities, setD2dCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [city, setCity] = useState(""); 
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    
    // Hydration
    const [pendingUrlPort, setPendingUrlPort] = useState(null);
    const [pendingUrlInspection, setPendingUrlInspection] = useState(null);
    const [didHydrateInspectionFromUrl, setDidHydrateInspectionFromUrl] = useState(false);
    const [pendingUrlInsurance, setPendingUrlInsurance] = useState(null);
    const [didHydrateInsuranceFromUrl, setDidHydrateInsuranceFromUrl] = useState(false);
    
    const [didHydrateClearing, setDidHydrateClearing] = useState(false);
    const [didHydrateDelivery, setDidHydrateDelivery] = useState(false);

    // Refs
    const preferUrlInspectionRef = useRef(false);
    const preferUrlInsuranceRef = useRef(false);
    const userSetInspectionRef = useRef(false);

    const selectedPort = dropdownValuesLocations["Select Port"];
    const { inspectionData } = useInspectionToggle(dropdownValuesLocations);
    const isInspectionRequired = inspectionData?.inspectionIsRequired === "Required";
    
    const [inspectionPrice, setInspectionPrice] = useState('');
    
    useEffect(() => {
        if (!inspectionData?.inspectionName) return;
        const getInspectionPrice = async () => {
            try {
                const price = await fetchInspectionPrice(inspectionData?.inspectionName);
                setInspectionPrice(price);
            } catch (error) {
                console.error('Error fetching inspection price:', error);
            }
        };
        getInspectionPrice();
    }, [inspectionData?.inspectionName]);

    const inspectionAddOn = Number(inspectionPrice ?? 300) || 300;

    // =========================================================================
    // 3. HELPERS
    // =========================================================================

    const setPersist = (k, v) => {
        if (typeof document !== 'undefined') {
            document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=31536000`;
            localStorage.setItem(k, v);
        }
    };

    const clearPersist = (k) => {
        if (typeof document !== 'undefined') {
            document.cookie = `${k}=; path=/; max-age=0`;
            localStorage.removeItem(k);
        }
    };

    const updateUrlParam = (key, value, explicitSaveValue = null) => {
        const params = new URLSearchParams(window.location.search);

        if (value) {
            const valToSave = explicitSaveValue || '1';
            params.set(key, valToSave);
            setPersist(`stock_${key}`, valToSave);
        } else {
            params.delete(key);
            clearPersist(`stock_${key}`);
        }
        
        const q = params.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    };

    // =========================================================================
    // 4. EFFECTS
    // =========================================================================

    // D2D Match & Reset Logic
    useEffect(() => {
        if (didHydrateClearing && didHydrateDelivery) {
             if (selectedCountry && d2dCountries.length > 0) {
                 const match = d2dCountries.find(
                     (d2d) => d2d.name === selectedCountry || d2d.id === selectedCountry
                 );
                 setD2dMatch(match || null);
                 
                 if (match) {
                     setClearingCost(Number(match.clearingPrice) || 0);
                 } else {
                     // Reset everything atomically
                     const params = new URLSearchParams(window.location.search);
                     let changed = false;

                     if(clearingToggle) { params.delete('clearing'); clearPersist('stock_clearing'); changed = true; }
                     if(city) { params.delete('delivery'); clearPersist('stock_delivery'); changed = true; }

                     setClearingCost(0);
                     setClearingToggle(false);
                     setCity("");
                     setDeliveryCost(0);

                     if(changed) {
                         const q = params.toString();
                         router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
                     }
                 }
             } else {
                 setD2dMatch(null);
                 setClearingCost(0);
                 setClearingToggle(false);
                 setCity("");
                 setDeliveryCost(0);
             }
        } else {
             if (selectedCountry && d2dCountries.length > 0) {
                 const match = d2dCountries.find(
                     (d2d) => d2d.name === selectedCountry || d2d.id === selectedCountry
                 );
                 setD2dMatch(match || null);
                 if (match) setClearingCost(Number(match.clearingPrice) || 0);
             }
        }
    }, [selectedCountry, d2dCountries, setClearingCost, setClearingToggle, setDeliveryCost, didHydrateClearing, didHydrateDelivery]);

    // Fetch Cities
    useEffect(() => {
        if (d2dMatch?.id) {
            setLoadingCities(true);
            fetch(`/api/d2d-cities?countryId=${d2dMatch.id}`)
                .then(res => res.json())
                .then(data => {
                    setD2dCities(data.cities || []);
                })
                .catch(err => {
                    console.error("Error fetching cities:", err);
                    setD2dCities([]);
                })
                .finally(() => setLoadingCities(false));
        } else {
            setD2dCities([]);
        }
    }, [d2dMatch]);

    // Delivery Cost
    useEffect(() => {
        if (!city || !d2dCities.length) {
            setDeliveryCost(0);
            return;
        }
        const selectedCityData = d2dCities.find(c => (c.name || c.id).toLowerCase() === city.toLowerCase());
        if (selectedCityData) {
            setDeliveryCost(Number(selectedCityData.deliveryPrice) || 0);
        } else {
            setDeliveryCost(0);
        }
    }, [city, d2dCities, setDeliveryCost]);

    // Fetch Ports
    useEffect(() => {
        if (!selectedCountry || selectedCountry === 'none') {
            setPorts([]);
            return;
        }
        const getPorts = async () => {
            try {
                const res = await fetch(`/api/ports?ports=${encodeURIComponent(selectedCountry)}`);
                if (!res.ok) throw new Error(res.statusText);
                const data = await res.json();
                setPorts(Array.isArray(data.ports) ? data.ports : []);
            } catch (err) {
                console.error('Error fetching ports:', err);
                setPorts([]);
            }
        };
        getPorts();
    }, [selectedCountry]);

    // Fetch Profit Map
    useEffect(() => {
        const getPortInspection = async () => {
            if (!selectedPort || selectedPort === 'none' || selectedPort.trim() === '') {
                setProfitMap('');
                return;
            }
            try {
                const res = await fetch(`/api/inspection?selectedPort=${encodeURIComponent(selectedPort)}`);
                const data = await res.json();
                setProfitMap(data?.portsInspection?.profitPrice);
            } catch (error) {
                console.error("Error fetching port data:", error);
            }
        };
        getPortInspection();
    }, [selectedPort, setProfitMap]);

    // URL Sync & Hydration
    useEffect(() => {
        const urlCountry = searchParams?.get('country');
        const urlPortRaw = searchParams?.get('port');
        const urlInspectionRaw = searchParams?.get('inspection');
        const urlInsuranceRaw = searchParams?.get('insurance');
        const urlClearingRaw = searchParams?.get('clearing');
        const urlDeliveryRaw = searchParams?.get('delivery');

        if (urlCountry && urlCountry.toLowerCase() !== 'none') {
            setSelectedCountry(urlCountry);
            setDropdownValuesLocations(prev => ({ ...prev, 'Select Country': urlCountry }));
        }
        if (urlPortRaw && urlPortRaw.toLowerCase() !== 'none') {
            setPendingUrlPort(urlPortRaw);
        }

        if (urlInspectionRaw !== null) {
            const val = /^(1|true|on|yes)$/i.test(urlInspectionRaw);
            setPendingUrlInspection(val);
            preferUrlInspectionRef.current = true;
            setDidHydrateInspectionFromUrl(false);
        }
        if (urlInsuranceRaw !== null) {
            const val = /^(1|true|on|yes)$/i.test(urlInsuranceRaw);
            setPendingUrlInsurance(val);
            setDidHydrateInsuranceFromUrl(false);
        }

        if (urlClearingRaw !== null && !didHydrateClearing) {
            const val = /^(1|true|on|yes)$/i.test(urlClearingRaw);
            setClearingToggle(val);
            setDidHydrateClearing(true);
        } else if (!didHydrateClearing) {
            setDidHydrateClearing(true);
        }

        if (urlDeliveryRaw !== null && !didHydrateDelivery) {
            setCity(urlDeliveryRaw);
            setDidHydrateDelivery(true);
        } else if (!didHydrateDelivery) {
            setDidHydrateDelivery(true);
        }
    }, [searchParams]);

    // Apply Pending Port
    useEffect(() => {
        if (!pendingUrlPort || !ports.length) return;
        const normalize = (p) => p.replace(/\./g, '_');
        const wanted = normalize(pendingUrlPort);
        const exists = ports.some((p) => normalize(p).toLowerCase() === wanted.toLowerCase());
        setDropdownValuesLocations((prev) => ({
            ...prev,
            'Select Port': exists ? wanted : 'Others',
        }));
        setPendingUrlPort(null);
    }, [ports, pendingUrlPort]);

    // Inspection Logic
    useEffect(() => {
        if (isInspectionRequired) {
            setInspectionToggle(true);
            return;
        }
        if (preferUrlInspectionRef.current && pendingUrlInspection !== null) {
            setInspectionToggle(!!pendingUrlInspection);
            return;
        }
        if (userSetInspectionRef.current) return;

        if (typeof inspectionData?.toggle === 'boolean') {
            setInspectionToggle(inspectionData.toggle);
        } else {
            setInspectionToggle(false);
        }
    }, [isInspectionRequired, pendingUrlInspection, inspectionData?.toggle, setInspectionToggle]);

    // Insurance Hydration
    useEffect(() => {
        if (!didHydrateInsuranceFromUrl && pendingUrlInsurance !== null) {
            setInsuranceToggle(!!pendingUrlInsurance);
            setDidHydrateInsuranceFromUrl(true);
        }
    }, [pendingUrlInsurance, didHydrateInsuranceFromUrl, setInsuranceToggle]);

    // =========================================================================
    // 5. HANDLERS
    // =========================================================================

    const handleCountryChange = (value) => {
        setSelectedCountry(value);
        setDropdownValuesLocations({
            'Select Country': value,
            'Select Port': 'none'
        });
        
        // PERSIST COUNTRY:
        updateUrlParam('country', true, value);
        // Reset port param
        updateUrlParam('port', false);
    };

    const handlePortChange = (value) => {
        setDropdownValuesLocations(prev => ({
            ...prev,
            'Select Port': value
        }));
        
        // PERSIST PORT:
        updateUrlParam('port', true, value);
    };

    const handleCityChange = (value) => {
        setCity(value);
        updateUrlParam('delivery', true, value);
        setIsDeliveryModalOpen(false); 
    };

    const toggleService = (service) => {
        if (service === "inspection") {
            if (isInspectionRequired || inspectionData?.isToggleDisabled) return;
            const newState = !inspectionToggle;
            userSetInspectionRef.current = true;
            setInspectionToggle(newState);
            updateUrlParam('inspection', newState);
        }
        else if (service === "insurance") {
            const newState = !insuranceToggle;
            setInsuranceToggle(newState);
            updateUrlParam('insurance', newState);
        }
        else if (service === "clearing") {
            const next = !clearingToggle;
            setClearingToggle(next);
            
            if (next) {
                updateUrlParam('clearing', true);
            } else {
                // Disable Clearing AND Delivery atomically
                const params = new URLSearchParams(window.location.search);
                
                params.delete('clearing');
                clearPersist('stock_clearing');
                
                params.delete('delivery');
                clearPersist('stock_delivery');
                
                setCity(""); 
                setDeliveryCost(0);
                
                const q = params.toString();
                router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
            }
        }
        else if (service === "delivery") {
            if (!clearingToggle) return; 
            
            if (city) {
                setCity(""); 
                setDeliveryCost(0);
                updateUrlParam('delivery', false);
            } else {
                setIsDeliveryModalOpen(true); 
            }
        }
    };

    // =========================================================================
    // 6. RENDER
    // =========================================================================

    const renderFormBody = () => (
        <div className="space-y-4">
            {/* Country */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-700">Country</label>
                <Select value={selectedCountry === 'none' ? '' : selectedCountry} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-full bg-white border-blue-200 focus:ring-blue-500"><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent className="max-h-[40vh] overflow-y-auto z-[9999]">
                        {countryArray?.map((c, idx) => (<SelectItem key={idx} value={c}>{c === 'D_R_Congo' ? 'D.R. Congo' : c}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
            {/* Port */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-700">Port</label>
                <Select value={selectedPort === 'none' ? '' : selectedPort} onValueChange={handlePortChange} disabled={!ports.length && selectedCountry !== ''}>
                    <SelectTrigger className="w-full bg-white border-blue-200 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"><SelectValue placeholder="Select Port" /></SelectTrigger>
                    <SelectContent className="max-h-[40vh] overflow-y-auto z-[9999]">
                        {ports.length > 0 ? (ports.map((port, idx) => (<SelectItem key={idx} value={port.replace(/\./g, '_')}>{port}</SelectItem>))) : (<SelectItem value="Others">Others</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            {/* Services */}
            <div className="space-y-2 pt-1">
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggleService("inspection")} disabled={isInspectionRequired || inspectionData?.isToggleDisabled} className={cn("relative rounded-full border px-4 py-1.5 text-xs font-medium transition-all flex items-center gap-1", (isInspectionRequired || inspectionToggle) ? "border-[#155DFC] bg-[#155DFC] text-white" : "border-[#155DFC] bg-white text-slate-700 hover:bg-[#155DFC] hover:text-white")}>
                        Inspection {(isInspectionRequired || inspectionToggle) && <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold", (isInspectionRequired || inspectionToggle) ? "bg-white text-[#155DFC]" : "bg-[#155DFC] text-white")}>+${inspectionAddOn}</span>} {isInspectionRequired && <Check className="w-3 h-3 ml-1" />}
                    </button>
                    <button onClick={() => toggleService("insurance")} className={cn("relative rounded-full border px-4 py-1.5 text-xs font-medium transition-all flex items-center", insuranceToggle ? "border-[#155DFC] bg-[#155DFC] text-white" : "border-[#155DFC] bg-white text-slate-700 hover:bg-[#155DFC] hover:text-white")}>
                        Insurance {insuranceToggle && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#155DFC]">+$50</span>}
                    </button>
                    {d2dMatch && (
                        <>
                            <button onClick={() => toggleService("clearing")} className={cn("relative rounded-full border px-4 py-1.5 text-xs font-medium transition-all flex items-center", clearingToggle ? "border-[#155DFC] bg-[#155DFC] text-white" : "border-[#155DFC] bg-white text-slate-700 hover:bg-[#155DFC] hover:text-white")}>
                                Clearing {clearingToggle && d2dMatch?.clearingPrice && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#155DFC]">+${d2dMatch.clearingPrice}</span>}
                            </button>
                            <button onClick={() => toggleService("delivery")} disabled={!clearingToggle} className={cn("relative rounded-full border px-4 py-1.5 text-xs font-medium transition-all flex items-center", !clearingToggle ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed" : city ? "border-[#155DFC] bg-[#155DFC] text-white" : "border-[#155DFC] bg-white text-slate-700 hover:bg-[#155DFC] hover:text-white")}>
                                Delivery {city && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#155DFC]">+${deliveryCost}</span>}
                            </button>
                        </>
                    )}
                </div>
                {d2dMatch && !clearingToggle && <p className="text-[10px] text-slate-400 px-1">*Delivery requires Clearing enabled</p>}
            </div>
            {city && (
                <div className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-blue-700"><MapPin className="h-4 w-4" /><span className="font-medium">Delivery to: {city.charAt(0).toUpperCase() + city.slice(1)}</span></div>
                    <button onClick={() => setIsDeliveryModalOpen(true)} className="text-xs font-medium text-blue-600 hover:underline">Change</button>
                </div>
            )}
        </div>
    );

    const calcContent = (<Card className="w-full border-blue-200 shadow-sm"><CardHeader className="pb-3 pt-4"><CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900"><Calculator className="h-5 w-5 text-blue-600" />Price Calculator</CardTitle></CardHeader><CardContent className="pb-4">{renderFormBody()}</CardContent></Card>);
    const sidebarCalc = (<div className="pb-4">{renderFormBody()}</div>);

    const deliveryDialog = (
        <Dialog open={isDeliveryModalOpen} onOpenChange={setIsDeliveryModalOpen}>
            <DialogContent className="z-[9999] w-full max-w-xs sm:max-w-xs">
                <DialogHeader><DialogTitle>Select Delivery City</DialogTitle></DialogHeader>
                <div className="pt-4 pb-2">
                    <Select value={city} onValueChange={handleCityChange} disabled={loadingCities}>
                        <SelectTrigger className="w-full"><SelectValue placeholder={loadingCities ? "Loading cities..." : "Choose a city..."} /></SelectTrigger>
                        <SelectContent className="z-[10000] max-h-[40vh]">
                            {d2dCities && d2dCities.length > 0 ? (d2dCities.map((cityObj) => (<SelectItem key={cityObj.id} value={(cityObj.name || 'Others').toLowerCase()}>{cityObj.name || 'Others'}</SelectItem>))) : (<div className="p-2 text-sm text-center text-slate-500">{loadingCities ? "Loading..." : "No cities available"}</div>)}
                        </SelectContent>
                    </Select>
                </div>
            </DialogContent>
        </Dialog>
    );

    if (context === "sidebar") { return (<><div ref={containerRef} className="px-4 gap-2 w-full mb-4">{sidebarCalc}</div>{deliveryDialog}</>) }
    return (<><div ref={containerRef}>{calcContent}</div>{deliveryDialog}</>);
}