"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Filter, RotateCcw, Plus, Minus, Settings, Star, Percent } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Autocomplete } from "./autoComplete"
import { useRouter } from "@bprogress/next"
import AnimatedFilter from "./AnimatedFilter"

const ENGINE_DISPLACEMENT_OPTIONS = [
    { value: "500", label: "500cc" },
    { value: "1000", label: "1,000cc" },
    { value: "1500", label: "1,500cc" },
    { value: "2000", label: "2,000cc" },
    { value: "2500", label: "2,500cc" },
    { value: "3000", label: "3,000cc" },
    { value: "3500", label: "3,500cc" },
    { value: "4000", label: "4,000cc" },
    { value: "4500", label: "4,500cc" },
    { value: "5000", label: "5,000cc" },
]

const COLORS = [
    { name: "Black", value: "Black", bg: "bg-black", type: "solid" },
    { name: "White", value: "White", bg: "bg-white", type: "solid", border: true },
    {
        name: "Pearl White",
        value: "Pearl",
        bg: "bg-gradient-to-br from-white via-blue-50 to-gray-100",
        type: "metallic",
        border: true,
    },
    { name: "Silver", value: "Silver", bg: "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400", type: "metallic" },
    {
        name: "Metallic Silver",
        value: "metallic-silver",
        bg: "bg-gradient-to-br from-gray-300 via-slate-200 to-gray-400",
        type: "metallic",
    },
    { name: "Gray", value: "Gray", bg: "bg-gray-500", type: "solid" },
    { name: "Charcoal", value: "Charcoal", bg: "bg-gray-700", type: "solid" },
    { name: "Red", value: "Red", bg: "bg-red-500", type: "solid" },
    {
        name: "Maroon",
        value: "Maroon",
        bg: "bg-[#800000]",
        type: "solid",
    },
    {
        name: "Burgundy",
        value: "Burgundy",
        bg: "bg-[#800020]",
        type: "solid",
    },
    { name: "Blue", value: "Blue", bg: "bg-blue-500", type: "solid" },
    { name: "Navy Blue", value: "navy-blue", bg: "bg-blue-900", type: "solid" },
    {
        name: "Metallic Blue",
        value: "metallic-blue",
        bg: "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600",
        type: "metallic",
    },
    { name: "Green", value: "Green", bg: "bg-green-500", type: "solid" },
    { name: "Forest Green", value: "forest-green", bg: "bg-green-700", type: "solid" },
    { name: "Yellow", value: "Yellow", bg: "bg-yellow-400", type: "solid" },
    { name: "Brown", value: "Brown", bg: "bg-amber-700", type: "solid" },
    {
        name: "Bronze",
        value: "Bronze",
        bg: "bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700",
        type: "metallic",
    },
    { name: "Orange", value: "Orange", bg: "bg-orange-500", type: "solid" },
    { name: "Purple", value: "Purple", bg: "bg-purple-500", type: "solid" },
    {
        name: "Gold",
        value: "Gold",
        bg: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600",
        type: "metallic",
    },
    {
        name: "Champagne",
        value: "Champagne",
        bg: "bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200",
        type: "metallic",
        border: true,
    },
    { name: "Beige", value: "Beige", bg: "bg-amber-100", type: "solid", border: true },
    {
        name: "Others",
        value: "Others",
        type: "rainbow",
        bg: "bg-[conic-gradient(from_0deg_at_center,_#ef4444_0%,_#f87171_8.33%,_#fbbf24_16.67%,_#a3e635_25%,_#22d3ee_33.33%,_#38bdf8_41.67%,_#3b82f6_50%,_#818cf8_58.33%,_#c084fc_66.67%,_#ec4899_75%,_#f472b6_83.33%,_#ef4444_91.67%,_#ef4444_100%)]"
    }
]


const FEATURES = [
    { id: "SafetySystemAnBrSy", label: "Anti-Lock Brakes", code: 1 },
    { id: "SafetySystemDrAi", label: "Driver Airbag", code: 2 },
    { id: "SafetySystemPaAi", label: "Passenger Airbag", code: 3 },
    { id: "SafetySystemSiAi", label: "Side Airbag", code: 4 },
    { id: "InteriorPoWi", label: "Power Windows", code: 5 },
    { id: "InteriorReWiDe", label: "Rear Window Defrost", code: 6 },
    { id: "InteriorReWiWi", label: "Rear Window Wiper", code: 7 },
    { id: "InteriorTiGl", label: "Tinted Glass", code: 8 },
    { id: "ComfortAiCoFr", label: "A/C: front", code: 9 },
    { id: "ComfortAiCoRe", label: "A/C: rear", code: 10 },
    { id: "ComfortCrSpCo", label: "Cruise Control", code: 11 },
    { id: "ComfortNaSyGPS", label: "Navigation System", code: 12 },
    { id: "ComfortPoSt", label: "Power Steering", code: 13 },
    { id: "ComfortReKeSy", label: "Keyless Entry", code: 14 },
    { id: "ComfortTiStWh", label: "Tilt Wheel", code: 15 },
    { id: "ComfortDiSp", label: "Digital Meter", code: 16 },
    { id: "ComfortAMFMRa", label: "AM/FM Radio", code: 17 },
    { id: "ComfortAMFMSt", label: "AM/FM Stereo", code: 18 },
    { id: "ComfortCDCh", label: "CD Changer", code: 19 },
    { id: "ComfortCDPl", label: "CD Player", code: 20 },
    { id: "ComfortPrAuSy", label: "Premium Sound", code: 21 },
    { id: "ComfortDVDPl", label: "DVD Player", code: 22 },
    { id: "ComfortHDD", label: "Hard Disc", code: 23 },
    { id: "InteriorLeSe", label: "Leather Seats", code: 24 },
    { id: "InteriorPoSe", label: "Power Seats", code: 25 },
    { id: "ExteriorAlWh", label: "Alloy Wheels", code: 26 },
    { id: "InteriorPoDoLo", label: "Power Door Locks", code: 27 },
    { id: "InteriorPoMi", label: "Power Mirrors", code: 28 },
    { id: "ExteriorSuRo", label: "Sunroof", code: 29 },
    { id: "InteriorThRoSe", label: "Third Row Seats", code: 30 },
    { id: "ExteriorPoSlDo", label: "Sliding Door", code: 31 },
    { id: "SellingPointsCuWh", label: "Custom Wheels", code: 32 },
    { id: "SellingPointsFuLo", label: "Fully Loaded", code: 33 },
    { id: "SellingPointsMaHiAv", label: "Maintenance Rec.", code: 34 },
    { id: "SellingPointsReBo", label: "New Paint", code: 35 },
    { id: "SellingPointsBrNeTi", label: "New Tires", code: 36 },
    { id: "SellingPointsNoAcHi", label: "No Accidents", code: 37 },
    { id: "SellingPointsOnOwHi", label: "One Owner", code: 38 },
    { id: "SellingPointsPeRaTi", label: "Performance Tires", code: 39 },
    { id: "SellingPointsUpAuSy", label: "Upgraded Sound", code: 40 },
    { id: "SellingPointsNoSmPrOw", label: "Non-Smoker", code: 41 },
    { id: "SellingPointsTuEn", label: "Turbo", code: 42 },
];


const PRICE_OPTIONS = [
    { value: "500", label: "$500" },
    { value: "1000", label: "$1,000" },
    { value: "3000", label: "$3,000" },
    { value: "5000", label: "$5,000" },
    { value: "10000", label: "$10,000" },
    { value: "15000", label: "$15,000" },
    { value: "20000", label: "$20,000" },
    { value: "30000", label: "$30,000" },

]

const YEAR_OPTIONS = Array.from({ length: 25 }, (_, i) => {
    const year = 2025 - i
    return { value: year.toString(), label: year.toString() }
})

const MILEAGE_OPTIONS = [
    { value: "0", label: "0 km" },
    { value: "10000", label: "10,000 km" },
    { value: "30000", label: "30,000 km" },
    { value: "50000", label: "50,000 km" },
    { value: "75000", label: "75,000 km" },
    { value: "100000", label: "100,000 km" },
    { value: "150000", label: "150,000 km" },
]

const TRANSMISSION = [
    { id: 'Automatic', label: 'Automatic' },
    { id: 'Manual', label: 'Manual' },
    { id: 'Auto Manual', label: 'Auto Manual' },
    { id: 'CVT', label: 'CVT' },
    { id: 'Unspecified', label: 'Unspecified' },
    { id: 'Others', label: 'Others' }
]

const FUEL_TYPES = [
    { id: 'biodiesel', label: 'Biodiesel' },
    { id: 'cng', label: 'CNG' },
    { id: 'diesel', label: 'Diesel' },
    { id: 'electric', label: 'Electric' },
    { id: 'ethanol-ffv', label: 'Ethanol-FFV' },
    { id: 'gasoline/petrol', label: 'Gasoline/Petrol' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'lpg', label: 'LPG' },
    { id: 'steam', label: 'Steam' },
    { id: 'rotary', label: 'Rotary' },
    { id: 'gasoline', label: 'Gasoline' },
]

const DRIVE_TYPE = [
    { id: '2-wheel drive', label: '2-wheel Drive' },
    { id: '4-wheel drive', label: '4-wheel Drive' },
    { id: 'all-wheel drive', label: 'All-wheel Drive' }
]
const STEERING = [
    { id: 'Left', label: 'Left' },
    { id: 'Right', label: 'Right' },
]



export default function CarFilterContent({ currency, recommendedUrl, saleUrl, totalCount, urlMaker, urlModel, isSale, isRecommended, onClose, carMakes, carBodytypes, context }) {


    const router = useRouter()
    const containerRef = useRef(null)
    const [carModels, setCarModels] = useState([])
    const [isFetchingModels, setIsFetchingModels] = useState(false)

    const [filters, setFilters] = useState({
        make: urlMaker ?? "all",
        model: urlModel ?? "all",
        bodyType: "all",
        subBodyType: "all",
        minPrice: "all",
        maxPrice: "all",
        minYear: "all",
        maxYear: "all",
        minMileage: "all",
        maxMileage: "all",
        transmission: "all",
        fuelType: "all",
        minEngineDisplacement: "all",
        maxEngineDisplacement: "all",
        driveType: 'all',
        color: "all",
        steering: 'all',
        features: [],
        query: "",
        recommended: recommendedUrl ? true : false,
        onSale: saleUrl ? true : false
    });
    const [totalCountLocal, setTotalCountLocal] = useState(0);
    console.log(totalCountLocal)
    useEffect(() => {
        const qs = new URLSearchParams();
        qs.set("currency", String(currency))
        // build your id → code map once per render
        const featureCodeMap = FEATURES.reduce((m, f) => {
            m[f.id] = f.code;
            return m;
        }, {});

        Object.entries(filters).forEach(([key, val]) => {
            // skip null/undefined
            if (val == null) return;

            // skip "all" or empty/whitespace-only strings
            if (
                typeof val === "string" &&
                (val === "all" || val.trim() === "")
            ) {
                return;
            }


            // map your keys to API params
            let paramName = key;
            switch (key) {
                case "make":
                    paramName = "carMakes";
                    break;
                case "model":
                    paramName = "carModels";
                    break;
                case "bodyType":
                    paramName = "carBodyType";
                    break;
                case "query":
                    paramName = "searchKeywords";
                    break;
                case "recommended":
                    paramName = "isRecommended";
                    break;
                case "onSale":
                    paramName = "isSale";
                    break;
                case "minPrice":
                    // leave it as “minPrice” so our server can pick it up
                    paramName = "minPrice";
                    break;
                case "maxPrice":
                    // leave it as “minPrice” so our server can pick it up
                    paramName = "maxPrice";
                    break;
                case "minMileage":
                    // leave it as “minPrice” so our server can pick it up
                    paramName = "minMileage";
                    break;
                default:
                    break;
            }

            // —— features: convert IDs to numeric codes —— 
            if (key === "features") {
                if (Array.isArray(val) && val.length) {
                    // map each feature ID to its code, drop any invalids
                    const numericFeatures = val
                        .map(fid => featureCodeMap[fid])
                        .filter(c => typeof c === "number");

                    // send as JSON array (back-end will JSON.parse it)
                    qs.set("features", JSON.stringify(numericFeatures));

                    // — or, if you prefer multiple params:
                    // numericFeatures.forEach(code =>
                    //   qs.append("features", String(code))
                    // );
                }
                return;
            }

            // boolean flags
            if (typeof val === "boolean") {
                if (val) qs.set(paramName, "true");
                return;
            }

            // everything else (numbers or non-empty strings)
            qs.set(paramName, String(val));
        });

        const queryString = qs.toString();
        console.log("fetch /api/vehicle-total-count?" + queryString);

        fetch(`/api/vehicle-total-count?${queryString}`)
            .then(r => {
                if (!r.ok) throw new Error(r.statusText);
                return r.json();
            })
            .then(({ totalCount }) => {
                setTotalCountLocal(totalCount);
            })
            .catch(err => console.error("count fetch failed:", err));
    }, [JSON.stringify(filters), router.asPath, currency]);

    const queryValue = filters.query;


    const onChangeQuery = (val) => {
        handleFilterChange("query", val);
    };
    const [activeFilters, setActiveFilters] = useState([])
    const [showMoreFilters, setShowMoreFilters] = useState(false)

    // -------------------------
    // 2. Whenever `filters.make` changes, fetch its models
    // -------------------------
    useEffect(() => {
        const selectedMake = filters.make
        if (!selectedMake || selectedMake === "all") {
            // if no make is selected or “all”, clear the models
            setCarModels([])
            return
        }

        setIsFetchingModels(true)
        fetch(`/api/models?make=${encodeURIComponent(selectedMake)}`)
            .then((res) => res.json())
            .then((data) => {
                // assume your API returns { models: [...] }
                setCarModels(Array.isArray(data.models) ? data.models : [])
            })
            .catch((err) => {
                console.error("Error fetching models:", err)
                setCarModels([])
            })
            .finally(() => {
                setIsFetchingModels(false)
            })
    }, [filters.make])

    //fetch sub body type with filter.bodytpe === truck
    const [subBodyTypes, setSubBodyTypes] = useState([]);
    const [isFetchingSub, setIsFetchingSub] = useState(false);

    useEffect(() => {
        const selectedBodyType = filters.bodyType;

        // only fetch when it’s exactly “Truck”
        if (selectedBodyType !== "Truck") {
            setSubBodyTypes([]);
            return;
        }

        setIsFetchingSub(true);

        fetch(
            `/api/truck-bodytype?docId=${encodeURIComponent(selectedBodyType)}`
        )
            .then((res) => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then((data) => {
                // data is already an array
                setSubBodyTypes(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("Error fetching sub‑body types:", err);
                setSubBodyTypes([]);
            })
            .finally(() => {
                setIsFetchingSub(false);
            });
    }, [filters.bodyType]);


    // -------------------------
    // 3. Filter‐changing logic (same as your existing code)
    // -------------------------
    const handleFilterChange = (key, value) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            // if you want changing make to reset model…
            if (key === "make" && value !== prev.make) {
                next.model = "all";
            }
            return next;
        });

        // now keep activeFilters in sync
        if (key === "features") {
            if (value.length > 0 && !activeFilters.includes("features")) {
                setActiveFilters(prev => [...prev, "features"]);
            } else if (value.length === 0) {
                setActiveFilters(prev => prev.filter(f => f !== "features"));
            }
        } else if (key === "query") {
            // track query just like other filters
            if (value && value !== "" && !activeFilters.includes("query")) {
                setActiveFilters(prev => [...prev, "query"]);
            } else if (!value && activeFilters.includes("query")) {
                setActiveFilters(prev => prev.filter(f => f !== "query"));
            }
        }
        else if (typeof value === "boolean") {
            if (value) {
                setActiveFilters(prev =>
                    prev.includes(key) ? prev : [...prev, key]
                );
            } else {
                setActiveFilters(prev =>
                    prev.filter(f => f !== key)
                );
            }
        }
        else if (value !== "all") {
            if (!activeFilters.includes(key)) {
                setActiveFilters(prev => [...prev, key]);
            }
        } else {
            setActiveFilters(prev => prev.filter(f => f !== key));
        }
    };
    const toggleFeature = (featureId) => {
        // build the next features array
        const next = filters.features.includes(featureId)
            ? filters.features.filter(id => id !== featureId)
            : [...filters.features, featureId];

        // delegate to your existing handler so both `filters.features`
        // and `activeFilters` stay in sync
        handleFilterChange("features", next);
    };

    // Clears exactly one filter
    const clearFilter = filterKey => {
        const defaults = {
            make: urlMaker ?? "all",
            model: urlModel ?? "all",
            bodyType: "all",
            subBodyType: "all",
            minPrice: "all",
            maxPrice: "all",
            minYear: "all",
            maxYear: "all",
            minMileage: "all",
            maxMileage: "all",
            transmission: "all",
            fuelType: "all",
            steering: "all",
            minEngineDisplacement: "all",
            maxEngineDisplacement: "all",
            color: "all",
            driveType: "all",
            features: [],
            query: "",
            recommended: false,
            onSale: false     // ← default for query
        };

        // if they clicked the little “×” on a badge
        if (filterKey === "features") {
            // delegate to your central handler so activeFilters syncs
            handleFilterChange(filterKey, defaults[filterKey]);
        } else {
            handleFilterChange(filterKey, defaults[filterKey]);
        }
    };


    // Clears *all* filters at once
    const clearAllFilters = () => {
        setFilters({
            make: "all",
            model: "all",
            bodyType: "all",
            subBodyType: "all",
            minPrice: "all",
            maxPrice: "all",
            minYear: "all",
            maxYear: "all",
            minMileage: "all",
            maxMileage: "all",
            transmission: "all",
            fuelType: "all",
            steering: "all",
            minEngineDisplacement: "all",
            maxEngineDisplacement: "all",
            color: "all",
            driveType: "all",
            features: [],
            query: "",    // ← reset query as well
        });
        setActiveFilters([]);
    };



    // -------------------------
    // 4. Helper to show “Model” options:
    //    - if `make === "all"`, show nothing
    //    - otherwise show `carModels` loaded from the API
    // -------------------------
    const getAvailableModels = () => {
        if (filters.make === "all") return []
        return carModels
    }


    const dropdownGroups = [
        [
            {
                placeholder: "make",
                options: [
                    { value: "none", label: "Select Make" },
                    ...carMakes.map((make) => ({
                        value: make.toUpperCase(),
                        label: make,
                    })),
                ],
            },
            {
                placeholder: "model",
                options: [
                    { value: "none", label: "Select Model" },
                    ...carModels.map((model) => ({
                        value: model.toUpperCase(),
                        label: model,
                    })),
                ],
            },
            {
                placeholder: "bodyType",
                options: [
                    { value: "none", label: "Body Type" },
                    ...carBodytypes.map((bodytype) => ({
                        value: bodytype,
                        label: bodytype,
                    })),
                ],
            },
            {
                placeholder: "subBodyType",
                options: [
                    { value: "none", label: "Sub-Body Type" },
                    ...subBodyTypes.map((bodytype) => ({
                        value: bodytype,
                        label: bodytype,
                    })),
                ],
            },
        ],
        [
            {
                placeholder: "minPrice",
                options: PRICE_OPTIONS,
            },
            {
                placeholder: "minYear",
                options: YEAR_OPTIONS,
            },
            {
                placeholder: "minMileage",
                options: MILEAGE_OPTIONS,
            },
        ],
        [
            {
                placeholder: "maxPrice",
                options: PRICE_OPTIONS
            },
            {
                placeholder: "maxYear",
                options: YEAR_OPTIONS
            },
            {
                placeholder: "maxMileage",
                options: MILEAGE_OPTIONS
            },
        ],
    ]
    const [isSearching, setIsSearching] = useState(false)
    const handleSearch = async () => {
        if (isSearching) return
        setIsSearching(true)

        const isRecommended = filters.recommended
        const isOnSale = filters.onSale

        const {
            make, model, bodyType, subBodyType, minYear, maxYear,
            minPrice, maxPrice, minMileage, maxMileage,
            color, transmission, minEngineDisplacement,
            maxEngineDisplacement, driveType, steering,
            fuelType, features = [], query
        } = filters

        const finalMaker = make === "all" ? "" : make
        const finalModel = model === "all" ? "" : model
        const finalBody = bodyType === "all" ? "" : bodyType
        const finalSubBodyType = subBodyType === "all" ? "" : subBodyType
        const finalMinY = minYear === "all" ? "" : minYear
        const finalMaxY = maxYear === "all" ? "" : maxYear
        const finalMinP = minPrice === "all" ? "" : minPrice
        const finalMaxP = maxPrice === "all" ? "" : maxPrice
        const finalMinM = minMileage === "all" ? "" : minMileage
        const finalMaxM = maxMileage === "all" ? "" : maxMileage
        const finalColor = color === "all" ? "" : color
        const finalTrans = transmission === "all" ? "" : transmission
        const finalMinE = minEngineDisplacement === "all" ? "" : minEngineDisplacement
        const finalMaxE = maxEngineDisplacement === "all" ? "" : maxEngineDisplacement
        const finalDrive = driveType === "all" ? "" : driveType
        const finalSteer = steering === "all" ? "" : steering
        const finalFuel = fuelType === "all" ? "" : fuelType
        const finalQ = query ? query : ""

        const parts = ["stock"]
        if (isRecommended) parts.push("recommended")
        if (isOnSale) parts.push("sale")
        if (finalMaker) parts.push(encodeURIComponent(finalMaker))
        if (finalModel) parts.push(encodeURIComponent(finalModel))

        const route = `/${parts.join("/")}`

        const qp = {}
        if (finalBody) qp.bodytype = finalBody
        if (finalSubBodyType) qp.subBodyType = finalSubBodyType
        if (finalMinY) qp.minYear = finalMinY
        if (finalMaxY) qp.maxYear = finalMaxY
        if (finalMinP) qp.minPrice = finalMinP
        if (finalMaxP) qp.maxPrice = finalMaxP
        if (finalMinM) qp.minMileage = finalMinM
        if (finalMaxM) qp.maxMileage = finalMaxM
        if (finalQ) qp.searchKeywords = finalQ
        if (finalColor) qp.color = finalColor
        if (finalTrans) qp.transmission = finalTrans
        if (finalMinE) qp.minEngineDisplacement = finalMinE
        if (finalMaxE) qp.maxEngineDisplacement = finalMaxE
        if (finalDrive) qp.driveType = finalDrive
        if (finalSteer) qp.steering = finalSteer
        if (finalFuel) qp.fuelType = finalFuel

        const featureCodeMap = FEATURES.reduce((m, f) => {
            m[f.id] = f.code
            return m
        }, {})
        const numericFeatures = features
            .map(fid => featureCodeMap[fid])
            .filter(c => typeof c === "number")
        if (numericFeatures.length) {
            qp.features = JSON.stringify(numericFeatures)
        }

        const qs = new URLSearchParams(qp).toString()
        const finalUrl = qs ? `${route}?${qs}` : route;

        // this will do a hard navigation, full refresh:
        window.location.href = finalUrl;

        setTimeout(() => {
            setIsSearching(false)
            onClose()
        }, 200)
    }

    const [loading, setLoading] = useState(false);
    const [insertedId, setInsertedId] = useState(null);
    const [error, setError] = useState(null);
    const handleClick = async () => {
        setLoading(true);
        setError(null);

        try {
            const newId = await writeVehicleProduct();
            setInsertedId(newId);
        } catch (err) {
            console.error(err);
            setError(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (isRecommended) {
            setFilters(f => ({ ...f, recommended: true }));
        }
    }, [isRecommended]);
    useEffect(() => {
        if (isSale) {
            setFilters(f => ({ ...f, onSale: true }));
        }
    }, [isSale]);
    const isTruck = filters.bodyType === "Truck";

    const filterContent = (
        <>
            <Card className="w-full max-w-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-blue-600" />
                            Filter Cars
                        </CardTitle>
                        {activeFilters.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        )}
                    </div>

                    {activeFilters.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {activeFilters.map((filterKey) => {
                                // 1) human-friendly labels
                                const labelMap = {
                                    query: "Keywords",
                                    features: "Features",
                                    make: "Make",
                                    model: "Model",
                                    bodyType: "Body Type",
                                    subBodyType: 'Sub-Body Type',
                                    minPrice: "Price (min)",
                                    maxPrice: "Price (max)",
                                    minYear: "Year (from)",
                                    maxYear: "Year (to)",
                                    minMileage: "Mileage (min)",
                                    maxMileage: "Mileage (max)",
                                    minEngineDisplacement: "Engine (min)",
                                    maxEngineDisplacement: "Engine (max)",
                                    driveType: "Drive Type",
                                    steering: "Steering",
                                    fuelType: "Fuel Type",
                                    transmission: "Transmission",
                                    color: "Color",
                                    recommended: "Recommended",
                                    onSale: "On Sale",
                                };
                                const label = labelMap[filterKey] ||
                                    filterKey.charAt(0).toUpperCase() + filterKey.slice(1);

                                // 2) raw filter value
                                let raw = filters[filterKey];

                                // 3) if it’s features, show length
                                if (filterKey === "features") {
                                    raw = filters.features.length;
                                }

                                // 4) if it’s make, unslug into pretty text
                                if (filterKey === "make" && typeof raw === "string") {
                                    raw = raw
                                        .split("-")
                                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                        .join(" ");
                                }

                                // 5) arrays join, others stay as-is
                                const displayValue = Array.isArray(raw) ? raw.join(", ") : raw;

                                return (
                                    <Badge key={filterKey} variant="secondary" className="text-xs">
                                        {label}: {displayValue}
                                        <button
                                            onClick={() => clearFilter(filterKey)}
                                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}

                </CardHeader>

                {/* <div className="p-2 ml-4">
                    <div className="flex items-center space-x-4">

                        <label className="flex items-center space-x-1 text-xs text-gray-700">
                            <input
                                type="checkbox"
                                checked={filters.recommended}
                                onChange={(e) => handleFilterChange("recommended", e.target.checked)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                            />
                            <Star className="w-3 h-3 text-blue-600" />
                            <span>Recommended</span>
                        </label>


                        <label className="flex items-center space-x-1 text-xs text-gray-700">
                            <input
                                type="checkbox"
                                checked={filters.onSale}
                                onChange={(e) => handleFilterChange("onSale", e.target.checked)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                            />
                            <Percent className="w-3 h-3 text-blue-600" />
                            <span>On Sale</span>
                        </label>
                    </div>
                </div> */}
                <AnimatedFilter
                    recommended={filters.recommended}
                    onRecommendedChange={checked => handleFilterChange('recommended', checked)}
                    onSale={filters.onSale}
                    onSaleChange={checked => handleFilterChange('onSale', checked)}
                />


                <CardContent className="space-y-6">
                    {/* Main Filters */}
                    <div className="space-y-4">
                        {/* Make */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Make</Label>
                            <Select value={filters.make} onValueChange={(value) => handleFilterChange("make", value)}>
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="All Makes" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]  w-[var(--radix-select-trigger-width)]
    overflow-y-auto
    max-h-[40vh]">
                                    <SelectItem value="all">All Makes</SelectItem>
                                    {carMakes.map((make) => (
                                        <SelectItem key={make} value={make}>
                                            {make}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>


                        {/* Model */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Model</Label>
                            <Select
                                value={filters.model}
                                onValueChange={(val) => handleFilterChange("model", val)}
                                disabled={filters.make === "all" || isFetchingModels}
                            >
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue
                                        placeholder={
                                            filters.make === "all"
                                                ? "Select a make first"
                                                : isFetchingModels
                                                    ? "Loading models..."
                                                    : getAvailableModels().length > 0
                                                        ? "All Models"
                                                        : "No Models Found"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004] w-[var(--radix-select-trigger-width)]
    overflow-y-auto
    max-h-[40vh]">
                                    <SelectItem value="all">All Models</SelectItem>
                                    {getAvailableModels().map((modelName) => (
                                        <SelectItem key={modelName} value={modelName}>
                                            {modelName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </div>


                    {/* More Filters Link */}
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all hover:scale-105"
                            onClick={() => setShowMoreFilters(!showMoreFilters)}
                        >
                            {showMoreFilters ? (
                                <>
                                    <Minus className="h-4 w-4 mr-1" />
                                    Less Filters
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-1" />
                                    More Filters
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Additional Filters (hidden by default) */}
                    {showMoreFilters && (
                        <div className="space-y-4 pt-2 border-t">
                            {/* Model */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Search</Label>
                                <Autocomplete
                                    dropdownGroups={dropdownGroups}
                                    onSelect={(opt) => {
                                        handleFilterChange(opt.category, opt.value)
                                    }}
                                    handleSearch={handleSearch}
                                    query={queryValue ?? ""}
                                    setQuery={onChangeQuery}
                                />
                            </div>
                            {/* Body Type */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Body Type</Label>
                                <Select value={filters.bodyType} onValueChange={(value) => handleFilterChange("bodyType", value)}>
                                    <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent container={containerRef.current} className="z-[9004] h-[40vh]">
                                        <SelectItem value="all">All Types</SelectItem>
                                        {carBodytypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/*Sub-Body Type */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Sub-Body Type</Label>
                                <Select
                                    value={filters.subBodyType}
                                    onValueChange={(value) => handleFilterChange("subBodyType", value)}
                                    disabled={!isTruck}
                                >
                                    <SelectTrigger
                                        disabled={!isTruck}
                                        className={`
          py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors
          ${!isTruck ? "opacity-50 pointer-events-none" : ""}
        `}
                                    >
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent
                                        container={containerRef.current}
                                        className="z-[9004] h-[40vh]"
                                    >
                                        <SelectItem value="all">All Types</SelectItem>
                                        {subBodyTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Price Range */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Price Range</Label>
                                <div className="flex items-center gap-2">
                                    <Select value={filters.minPrice} onValueChange={(value) => handleFilterChange("minPrice", value)}>
                                        <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Min Price" />
                                        </SelectTrigger>
                                        <SelectContent container={containerRef.current} className="z-[9004]">
                                            <SelectItem value="all">No Min</SelectItem>
                                            {PRICE_OPTIONS.map((price) => (
                                                <SelectItem key={price.value} value={price.value}>
                                                    {price.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-muted-foreground">~</span>
                                    <Select value={filters.maxPrice} onValueChange={(value) => handleFilterChange("maxPrice", value)}>
                                        <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Max Price" />
                                        </SelectTrigger>
                                        <SelectContent container={containerRef.current} className="z-[9004]">
                                            <SelectItem value="all">No Max</SelectItem>
                                            {PRICE_OPTIONS.map((price) => (
                                                <SelectItem key={price.value} value={price.value}>
                                                    {price.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Year Range */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Year Range</Label>
                                <div className="flex items-center gap-2">
                                    <Select value={filters.minYear} onValueChange={(value) => handleFilterChange("minYear", value)}>
                                        <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Min Year" />
                                        </SelectTrigger>
                                        <SelectContent container={containerRef.current} className="z-[9004]">
                                            <SelectItem value="all">Any Year</SelectItem>
                                            {YEAR_OPTIONS.map((year) => (
                                                <SelectItem key={year.value} value={year.value}>
                                                    {year.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-muted-foreground">~</span>
                                    <Select value={filters.maxYear} onValueChange={(value) => handleFilterChange("maxYear", value)}>
                                        <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Max Year" />
                                        </SelectTrigger>
                                        <SelectContent container={containerRef.current} className="z-[9004]">
                                            <SelectItem value="all">Any Year</SelectItem>
                                            {YEAR_OPTIONS.map((year) => (
                                                <SelectItem key={year.value} value={year.value}>
                                                    {year.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Mileage Range */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Mileage Range</Label>
                                <div className="flex items-center gap-2">
                                    <Select value={filters.minMileage} onValueChange={(value) => handleFilterChange("minMileage", value)}>
                                        <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Min Mileage" />
                                        </SelectTrigger>
                                        <SelectContent container={containerRef.current} className="z-[9004]">
                                            <SelectItem value="all">Any Mileage</SelectItem>
                                            {MILEAGE_OPTIONS.map((mileage) => (
                                                <SelectItem key={mileage.value} value={mileage.value}>
                                                    {mileage.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-muted-foreground">~</span>
                                    <Select value={filters.maxMileage} onValueChange={(value) => handleFilterChange("maxMileage", value)}>
                                        <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Max Mileage" />
                                        </SelectTrigger>
                                        <SelectContent container={containerRef.current} className="z-[9004]">
                                            <SelectItem value="all">Any Mileage</SelectItem>
                                            {MILEAGE_OPTIONS.map((mileage) => (
                                                <SelectItem key={mileage.value} value={mileage.value}>
                                                    {mileage.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {/* Transmission */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Transmission</Label>
                                <Select value={filters.transmission} onValueChange={(value) => handleFilterChange("transmission", value)}>
                                    <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                        <SelectValue placeholder="All Transmissions" />
                                    </SelectTrigger>
                                    <SelectContent container={containerRef.current} className="z-[9004]">
                                        <SelectItem value="all">All Transmissions</SelectItem>
                                        {TRANSMISSION.map((trans) => (
                                            <SelectItem key={trans.id} value={trans.label}>
                                                {trans.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Fuel Type */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Fuel Type</Label>
                                <Select value={filters.fuelType} onValueChange={(value) => handleFilterChange("fuelType", value)}>
                                    <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                        <SelectValue placeholder="All Fuel Types" />
                                    </SelectTrigger>
                                    <SelectContent container={containerRef.current} className="z-[9004] max-h-[40vh]">
                                        <SelectItem value="all">All Fuel Types</SelectItem>
                                        {FUEL_TYPES.map((fuel) => (
                                            <SelectItem key={fuel.id} value={fuel.label}>
                                                {fuel.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Drive Type */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Drive Type</Label>
                                <Select value={filters.driveType} onValueChange={(value) => handleFilterChange("driveType", value)}>
                                    <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                        <SelectValue placeholder="All Drive Types" />
                                    </SelectTrigger>
                                    <SelectContent container={containerRef.current} className="z-[9004]">
                                        <SelectItem value="all">All Drive Types</SelectItem>
                                        {DRIVE_TYPE.map((fuel) => (
                                            <SelectItem key={fuel.id} value={fuel.id}>
                                                {fuel.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Engine Displacement Range */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Engine Displacement</Label>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={filters.minEngineDisplacement}
                                        onValueChange={(value) => handleFilterChange("minEngineDisplacement", value)}
                                    >
                                        <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Min Engine" />
                                        </SelectTrigger>
                                        <SelectContent container={containerRef.current} className="z-[9004]">
                                            <SelectItem value="all">Any Size</SelectItem>
                                            {ENGINE_DISPLACEMENT_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-muted-foreground">~</span>
                                    <Select
                                        value={filters.maxEngineDisplacement}
                                        onValueChange={(value) => handleFilterChange("maxEngineDisplacement", value)}
                                    >
                                        <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Max Engine" />
                                        </SelectTrigger>
                                        <SelectContent container={containerRef.current} className="z-[9004]">
                                            <SelectItem value="all">Any Size</SelectItem>
                                            {ENGINE_DISPLACEMENT_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {/*Steering*/}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Steering</Label>
                                <Select value={filters.steering} onValueChange={(value) => handleFilterChange("steering", value)}>
                                    <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                        <SelectValue placeholder="All Colors" />
                                    </SelectTrigger>
                                    <SelectContent container={containerRef.current} className="z-[9004]">
                                        <SelectItem value="all">Steering</SelectItem>
                                        {STEERING.map((steering) => (
                                            <SelectItem key={steering.id} value={steering.label}>
                                                {steering.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Colors */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Color</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {COLORS.map((color) => {
                                        const isSelected = filters.color === color.value

                                        return (
                                            <div key={color.value} className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => handleFilterChange("color", isSelected ? "all" : color.value)}
                                                    className={`
                            w-10 h-10 rounded-full transition-all duration-200 relative overflow-hidden
                            ${color.bg}
                            ${color.border ? "border-2 border-gray-300" : ""}
                            ${color.type === "metallic" ? "shadow-inner" : ""}
                            ${isSelected ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"}
                          `}
                                                    title={color.name}
                                                >
                                                    {color.type === "metallic" && (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 rounded-full" />
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div
                                                                className={`w-3 h-3 rounded-full ${color.value === "white" ||
                                                                    color.value === "pearl-white" ||
                                                                    color.value === "beige" ||
                                                                    color.value === "champagne" ||
                                                                    color.value === "yellow"
                                                                    ? "bg-gray-800"
                                                                    : "bg-white"
                                                                    }`}
                                                            />
                                                        </div>
                                                    )}
                                                </button>
                                                <span className="text-xs text-center text-muted-foreground leading-tight max-w-[60px]">
                                                    {color.name}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Features Button (opens modal) */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full flex items-center justify-center">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Features {filters.features.length > 0 && `(${filters.features.length})`}
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Select Features</DialogTitle>
                                    </DialogHeader>

                                    <div className="py-4 space-y-6">
                                        {/* Safety System */}
                                        <div>
                                            <h3 className="font-semibold text-sm mb-3 text-foreground">Safety System</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                                {FEATURES.filter((f) => f.id.startsWith("SafetySystem")).map((feature) => (
                                                    <Button
                                                        key={feature.id}
                                                        variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                        className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                        onClick={() => toggleFeature(feature.id)}
                                                    >
                                                        {feature.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Comfort */}
                                        <div>
                                            <h3 className="font-semibold text-sm mb-3 text-foreground">Comfort</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                                {FEATURES.filter((f) => f.id.startsWith("Comfort")).map((feature) => (
                                                    <Button
                                                        key={feature.id}
                                                        variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                        className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                        onClick={() => toggleFeature(feature.id)}
                                                    >
                                                        {feature.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Interior */}
                                        <div>
                                            <h3 className="font-semibold text-sm mb-3 text-foreground">Interior</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                                {FEATURES.filter((f) => f.id.startsWith("Interior")).map((feature) => (
                                                    <Button
                                                        key={feature.id}
                                                        variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                        className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                        onClick={() => toggleFeature(feature.id)}
                                                    >
                                                        {feature.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Exterior */}
                                        <div>
                                            <h3 className="font-semibold text-sm mb-3 text-foreground">Exterior</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                                {FEATURES.filter((f) => f.id.startsWith("Exterior")).map((feature) => (
                                                    <Button
                                                        key={feature.id}
                                                        variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                        className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                        onClick={() => toggleFeature(feature.id)}
                                                    >
                                                        {feature.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Selling Points */}
                                        <div>
                                            <h3 className="font-semibold text-sm mb-3 text-foreground">Selling Points</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                                {FEATURES.filter((f) => f.id.startsWith("SellingPoints")).map((feature) => (
                                                    <Button
                                                        key={feature.id}
                                                        variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                        className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                        onClick={() => toggleFeature(feature.id)}
                                                    >
                                                        {feature.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4 border-t">
                                        <Button variant="outline" onClick={() => handleFilterChange("features", [])} className="px-8">
                                            Clear
                                        </Button>

                                        <DialogTrigger asChild>
                                            <Button className="px-8">Ok</Button>
                                        </DialogTrigger>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* Apply Filters Button */}
                    <div className="sticky bottom-14 bg-white shadow-lg hover:shadow-xl border-t z-[9995]">
                        <Button
                            disabled={isSearching}
                            aria-busy={isSearching}
                            onClick={handleSearch}
                            className="w-full bg-[#0000ff] hover:bg-[#0000dd] text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                            size="lg"
                        >
                            Apply Filters ({totalCountLocal ? totalCountLocal : 0})
                        </Button>
                    </div>

                    {/* <ConvertVehicleProductsButton /> */}
                </CardContent>
            </Card>
        </>
    )
    const sidebarContent = (
        <>
            <div className="pb-4 ">
                <div className="flex items-center justify-end space-x-2">

                    {activeFilters.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>

                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {activeFilters.map((filter) => {
                            // 1) human‐friendly labels
                            const labelMap = {
                                query: 'Keywords',
                                features: 'Features',
                                make: 'Make',
                                model: 'Model',
                                bodyType: 'Body Type',
                                subBodyType: 'Sub-Body Type',
                                minPrice: 'Price (min)',
                                maxPrice: 'Price (max)',
                                minYear: 'Year (from)',
                                maxYear: 'Year (to)',
                                minMileage: 'Mileage (min)',
                                maxMileage: 'Mileage (max)',
                                minEngineDisplacement: 'Engine (min)',
                                maxEngineDisplacement: 'Engine (max)',
                                driveType: 'Drive Type',
                                steering: 'Steering',
                                fuelType: 'Fuel Type',
                                transmission: 'Transmission',
                                color: 'Color',
                            };

                            // 2) pick label or fallback
                            const label =
                                labelMap[filter] ||
                                filter.charAt(0).toUpperCase() + filter.slice(1);

                            // 3) grab the raw value from filters
                            let raw = filters[filter];

                            // features is an array → show length
                            if (filter === 'features') {
                                raw = filters.features.length;
                            }

                            // 4) format the display value
                            const value =
                                Array.isArray(raw)
                                    ? raw.join(', ')
                                    : raw;

                            return (
                                <Badge key={filter} variant="secondary" className="text-xs">
                                    {label}: {value}
                                    <button
                                        onClick={() => clearFilter(filter)}
                                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            );
                        })}
                    </div>
                )}

            </div>
            <div className="w-full">
                <AnimatedFilter
                    recommended={filters.recommended}
                    onRecommendedChange={checked => handleFilterChange('recommended', checked)}
                    onSale={filters.onSale}
                    onSaleChange={checked => handleFilterChange('onSale', checked)}
                />

            </div>

            <div className="space-y-6 px-2">
                {/* Main Filters */}
                <div className="space-y-4">
                    {/* Make */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Make</Label>
                        <Select value={filters.make} onValueChange={(value) => handleFilterChange("make", value)}>
                            <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                <SelectValue placeholder="All Makes" />
                            </SelectTrigger>
                            <SelectContent container={containerRef.current} className="z-[9004]">
                                <SelectItem value="all">All Makes</SelectItem>
                                {carMakes.map((make) => (
                                    <SelectItem key={make} value={make}>
                                        {make}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Model */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Model</Label>
                        <Select
                            value={filters.model}
                            onValueChange={(val) => handleFilterChange("model", val)}
                            disabled={filters.make === "all" || isFetchingModels}
                        >
                            <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                <SelectValue
                                    placeholder={
                                        filters.make === "all"
                                            ? "Select a make first"
                                            : isFetchingModels
                                                ? "Loading models..."
                                                : getAvailableModels().length > 0
                                                    ? "All Models"
                                                    : "No Models Found"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent container={containerRef.current} className="z-[9004]">
                                <SelectItem value="all">All Models</SelectItem>
                                {getAvailableModels().map((modelName) => (
                                    <SelectItem key={modelName} value={modelName}>
                                        {modelName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>


                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Search</Label>
                        <Autocomplete
                            dropdownGroups={dropdownGroups}
                            onSelect={(opt) => {
                                handleFilterChange(opt.category, opt.value);
                            }}
                            handleSearch={handleSearch}
                            query={queryValue}


                            setQuery={onChangeQuery}
                        />
                    </div>
                </div>




                <div className="space-y-4">
                    {/* Body Type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Body Type</Label>
                        <Select value={filters.bodyType} onValueChange={(value) => handleFilterChange("bodyType", value)}>
                            <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent container={containerRef.current} className="z-[9004] ">
                                <SelectItem value="all">All Types</SelectItem>
                                {carBodytypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/*Sub-Body Type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Sub-Body Type</Label>
                        <Select
                            value={filters.subBodyType}
                            onValueChange={(value) => handleFilterChange("subBodyType", value)}
                            disabled={!isTruck}
                        >
                            <SelectTrigger
                                disabled={!isTruck}
                                className={`
          py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors
          ${!isTruck ? "opacity-50 pointer-events-none" : ""}
        `}
                            >
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent
                                container={containerRef.current}
                                className="z-[9004]"
                            >
                                <SelectItem value="all">All Types</SelectItem>
                                {subBodyTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Price Range */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Price Range</Label>
                        <div className="flex items-center gap-2">
                            <Select value={filters.minPrice} onValueChange={(value) => handleFilterChange("minPrice", value)}>
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="Min Price" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]">
                                    <SelectItem value="all">No Min</SelectItem>
                                    {PRICE_OPTIONS.map((price) => (
                                        <SelectItem key={price.value} value={price.value}>
                                            {price.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">~</span>
                            <Select value={filters.maxPrice} onValueChange={(value) => handleFilterChange("maxPrice", value)}>
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="Max Price" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]">
                                    <SelectItem value="all">No Max</SelectItem>
                                    {PRICE_OPTIONS.map((price) => (
                                        <SelectItem key={price.value} value={price.value}>
                                            {price.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Year Range */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Year Range</Label>
                        <div className="flex items-center gap-2">
                            <Select value={filters.minYear} onValueChange={(value) => handleFilterChange("minYear", value)}>
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="Min Year" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]">
                                    <SelectItem value="all">Any Year</SelectItem>
                                    {YEAR_OPTIONS.map((year) => (
                                        <SelectItem key={year.value} value={year.value}>
                                            {year.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">~</span>
                            <Select value={filters.maxYear} onValueChange={(value) => handleFilterChange("maxYear", value)}>
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="Max Year" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]">
                                    <SelectItem value="all">Any Year</SelectItem>
                                    {YEAR_OPTIONS.map((year) => (
                                        <SelectItem key={year.value} value={year.value}>
                                            {year.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Mileage Range */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Mileage Range</Label>
                        <div className="flex items-center gap-2">
                            <Select value={filters.minMileage} onValueChange={(value) => handleFilterChange("minMileage", value)}>
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="Min Mileage" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]">
                                    <SelectItem value="all">Any Mileage</SelectItem>
                                    {MILEAGE_OPTIONS.map((mileage) => (
                                        <SelectItem key={mileage.value} value={mileage.value}>
                                            {mileage.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">~</span>
                            <Select value={filters.maxMileage} onValueChange={(value) => handleFilterChange("maxMileage", value)}>
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="Max Mileage" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]">
                                    <SelectItem value="all">Any Mileage</SelectItem>
                                    {MILEAGE_OPTIONS.map((mileage) => (
                                        <SelectItem key={mileage.value} value={mileage.value}>
                                            {mileage.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Transmission */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Transmission</Label>
                        <Select value={filters.transmission} onValueChange={(value) => handleFilterChange("transmission", value)}>
                            <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                <SelectValue placeholder="All Transmissions" />
                            </SelectTrigger>
                            <SelectContent container={containerRef.current} className="z-[9004]">
                                <SelectItem value="all">All Transmissions</SelectItem>
                                {TRANSMISSION.map((trans) => (
                                    <SelectItem key={trans.id} value={trans.label}>
                                        {trans.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fuel Type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Fuel Type</Label>
                        <Select value={filters.fuelType} onValueChange={(value) => handleFilterChange("fuelType", value)}>
                            <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                <SelectValue placeholder="All Fuel Types" />
                            </SelectTrigger>
                            <SelectContent container={containerRef.current} className="z-[9004]">
                                <SelectItem value="all">All Fuel Types</SelectItem>
                                {FUEL_TYPES.map((fuel) => (
                                    <SelectItem key={fuel.id} value={fuel.label}>
                                        {fuel.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Drive Type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Drive Type</Label>
                        <Select value={filters.driveType} onValueChange={(value) => handleFilterChange("driveType", value)}>
                            <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                <SelectValue placeholder="All Drive Types" />
                            </SelectTrigger>
                            <SelectContent container={containerRef.current} className="z-[9004]">
                                <SelectItem value="all">All Drive Types</SelectItem>
                                {DRIVE_TYPE.map((fuel) => (
                                    <SelectItem key={fuel.id} value={fuel.id}>
                                        {fuel.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Engine Displacement Range */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Engine Displacement</Label>
                        <div className="flex items-center gap-2">
                            <Select
                                value={filters.minEngineDisplacement}
                                onValueChange={(value) => handleFilterChange("minEngineDisplacement", value)}
                            >
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="Min Engine" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]">
                                    <SelectItem value="all">Any Size</SelectItem>
                                    {ENGINE_DISPLACEMENT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">~</span>
                            <Select
                                value={filters.maxEngineDisplacement}
                                onValueChange={(value) => handleFilterChange("maxEngineDisplacement", value)}
                            >
                                <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="Max Engine" />
                                </SelectTrigger>
                                <SelectContent container={containerRef.current} className="z-[9004]">
                                    <SelectItem value="all">Any Size</SelectItem>
                                    {ENGINE_DISPLACEMENT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/*Steering*/}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Steering</Label>
                        <Select value={filters.steering} onValueChange={(value) => handleFilterChange("steering", value)}>
                            <SelectTrigger className="py-[20px] w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 transition-colors">
                                <SelectValue placeholder="All Colors" />
                            </SelectTrigger>
                            <SelectContent container={containerRef.current} className="z-[9004]">
                                <SelectItem value="all">Steering</SelectItem>
                                {STEERING.map((steering) => (
                                    <SelectItem key={steering.id} value={steering.label}>
                                        {steering.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Colors */}
                    <div className="space-y-3">

                        <Label className="text-sm font-medium">Color</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {COLORS.map((color) => {
                                const isSelected = filters.color === color.value

                                return (
                                    <div key={color.value} className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => handleFilterChange("color", isSelected ? "all" : color.value)}
                                            className={`
                            w-10 h-10 rounded-full transition-all duration-200 relative overflow-hidden
                            ${color.bg}
                            ${color.border ? "border-2 border-gray-300" : ""}
                            ${color.type === "metallic" ? "shadow-inner" : ""}
                            ${isSelected ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"}
                          `}
                                            title={color.name}
                                        >
                                            {color.type === "metallic" && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 rounded-full" />
                                            )}
                                            {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${color.value === "white" ||
                                                            color.value === "pearl-white" ||
                                                            color.value === "beige" ||
                                                            color.value === "champagne" ||
                                                            color.value === "yellow"
                                                            ? "bg-gray-800"
                                                            : "bg-white"
                                                            }`}
                                                    />
                                                </div>
                                            )}
                                        </button>
                                        <span className="text-xs text-center text-muted-foreground leading-tight max-w-[60px]">
                                            {color.name}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Features Button (opens modal) */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full flex items-center justify-center">
                                <Settings className="h-4 w-4 mr-2" />
                                Features {filters.features.length > 0 && `(${filters.features.length})`}
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Select Features</DialogTitle>
                            </DialogHeader>

                            <div className="py-4 space-y-6">
                                {/* Safety System */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-3 text-foreground">
                                        Safety System
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                        {FEATURES.filter(f => f.id.startsWith("SafetySystem")).map(feature => (
                                            <Button
                                                key={feature.id}
                                                variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                onClick={() => toggleFeature(feature.id)}
                                            >
                                                {feature.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Comfort */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-3 text-foreground">Comfort</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                        {FEATURES.filter(f => f.id.startsWith("Comfort")).map(feature => (
                                            <Button
                                                key={feature.id}
                                                variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                onClick={() => toggleFeature(feature.id)}
                                            >
                                                {feature.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Interior */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-3 text-foreground">Interior</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                        {FEATURES.filter(f => f.id.startsWith("Interior")).map(feature => (
                                            <Button
                                                key={feature.id}
                                                variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                onClick={() => toggleFeature(feature.id)}
                                            >
                                                {feature.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Exterior */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-3 text-foreground">Exterior</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                        {FEATURES.filter(f => f.id.startsWith("Exterior")).map(feature => (
                                            <Button
                                                key={feature.id}
                                                variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                onClick={() => toggleFeature(feature.id)}
                                            >
                                                {feature.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Selling Points */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-3 text-foreground">
                                        Selling Points
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                        {FEATURES.filter(f => f.id.startsWith("SellingPoints")).map(feature => (
                                            <Button
                                                key={feature.id}
                                                variant={filters.features.includes(feature.id) ? "default" : "outline"}
                                                className="h-auto p-3 text-xs font-normal justify-center text-center whitespace-normal"
                                                onClick={() => toggleFeature(feature.id)}
                                            >
                                                {feature.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>


                            <div className="flex justify-between pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => handleFilterChange("features", [])}
                                    className="px-8"
                                >
                                    Clear
                                </Button>

                                <DialogTrigger asChild>
                                    <Button className="px-8">Ok</Button>
                                </DialogTrigger>
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>


                <div className="sticky bottom-0 bg-white p-2 border-t z-[9995]">
                    <Button
                        disabled={isSearching}
                        aria-busy={isSearching}
                        onClick={handleSearch}
                        className="w-full bg-[#0000ff] hover:bg-[#0000dd] text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        size="lg"
                    >
                        Apply Filters ({totalCountLocal ?? 0})
                    </Button>
                </div>
                {/* <ConvertVehicleProductsButton /> */}

            </div>
        </>
    )
    if (context === "sidebar") {
        return (
            <div ref={containerRef} className="gap-2 w-full mb-4">
                {sidebarContent}
            </div>
        )
    }
    return (
        <div ref={containerRef}>
            {filterContent}
        </div>
    )
}
