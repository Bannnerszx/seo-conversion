"use client"

import moment from "moment"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from 'firebase/functions'
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Image from "next/image"
import { Download, Heart, ChevronLeft, ChevronRight, Loader2, UserPlus, Users, TrendingUp, Eye, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams } from 'next/navigation';
import { useCurrency } from "@/providers/CurrencyContext"
import { useSort } from "@/app/stock/stockComponents/sortContext"
import { AnimatedCurrencyPrice } from "./animatedPrice"
import { useInspectionToggle } from "./inspectionToggle"
import { fetchInspectionPrice, checkChatExists, checkUserExist, addOfferStatsCustomer } from "@/app/actions/actions"
import { FloatingAlertPortal } from "./floatingAlert";
import Loader from "@/app/components/Loader";
import { useRouter } from 'next/navigation';
import JSZip from "jszip"
import AnimatedHeartButton from "@/app/stock/stockComponents/animatedHeart";
import ImageViewer from "@/app/chats/chatComponents/imageViewer"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SignUpButton } from "@/app/components/SignUpButton"
import { Badge } from "@/components/ui/badge"

// ... (Keep Dropdown helper function exactly as is) ...
const Dropdown = ({ placeholder, options, value, onChange, className = '' }) => {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) {
        return (
            <div className={`relative inline-block w-full ${className}`}>
                <select
                    value={value}
                    className={`w-full border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300 ${className}`}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className={`relative inline-block w-full ${className} `} style={{ zoom: 1.25, transformOrigin: "top left" }}>
            <Select value={decodeURIComponent(value)} onValueChange={onChange}>
                <SelectTrigger className={`bg-white border-[#155DFC] ${className}`}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    collisionPadding={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="w-[var(--radix-select-trigger-width)] overflow-y-auto max-h-[20vh]"
                >
                    {options.map((option, idx) => (
                        <SelectItem key={idx} value={option.value}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

// --- UPDATED FUNCTION SIGNATURE ---
async function handleCreateConversation(
    acceptPaypal,
    addChat,
    router,
    setLoadingChat,
    setShowAlert,
    textareaRef,
    freightOrigPrice,
    profitMap,
    selectedCurrency,
    currency,
    inspectionPrice,
    inspectionData,
    carData,
    user,
    dropdownValuesLocations,
    setShakeCountry,
    setShakePort,
    insuranceSelected,
    ipInfo,
    tokyoTimeData,
    inspectionSelected,
    // NEW PARAMETERS ADDED HERE
    // clearing,
    // delivery,
    // deliveryAddress,
    // clearingPrice,
    // deliveryCity,
    // deliveryPrice
) {
    console.log(inspectionSelected, insuranceSelected)
    setLoadingChat(true);

    if (!user) {
        console.log("User not logged in or email not verified.");
        setLoadingChat(false);
        return router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
    const { exists, missingFields } = await checkUserExist(user)
    if (!exists || (missingFields && missingFields.length > 0)) {
        return router.push("/accountCreation")
    }

    const chatId = `chat_${carData?.stockID}_${user}`;
    const checkChat = await checkChatExists(carData?.stockID, user)
    if (checkChat.exists) {
        console.log("Chat already exists for this inquiry.");
        setShowAlert(true);
        setLoadingChat(false);
        return setTimeout(() => router.push(`/chats/${chatId}`), 100);
    }

    let error = false;
    if (!dropdownValuesLocations['Select Country'] || dropdownValuesLocations['Select Country'] === 'none') {
        setShakeCountry(true);
        error = true;
        setTimeout(() => setShakeCountry(false), 1000);
    }
    if (!dropdownValuesLocations['Select Port'] || dropdownValuesLocations['Select Port'] === 'none') {
        setShakePort(true);
        error = true;
        setTimeout(() => setShakePort(false), 1000);
    }
    if (error) {
        setLoadingChat(false);
        return;
    }

    try {
        const m = moment(tokyoTimeData.datetime, 'YYYY/MM/DD HH:mm:ss.SSS');
        const formattedTime = m.format('YYYY/MM/DD [at] HH:mm:ss.SSS');
        const docId = m.format('YYYY-MM');
        const dayField = m.format('DD');

        if (docId && carData && user && dayField && exists && (!missingFields || missingFields.length === 0)) {
            await addOfferStatsCustomer({ docId, carData, userEmail: user, dayField });
        }

        const chatData = {
            carId: carData.stockID,
            carData,
            formattedTime,
            inspectionPrice,
            recipientEmail: [
                'marc@realmotor.jp',
                'carl@realmotor.jp',
                'yusuke.k@realmotor.jp',
                'yuri.k@realmotor.jp',
                'qiong.han@realmotor.jp',
            ],
            selectedCountry: dropdownValuesLocations['Select Country'],
            selectedPort: dropdownValuesLocations['Select Port'],
            chatFieldCurrency: selectedCurrency.code,
            inspectionIsRequired: inspectionData.inspectionIsRequired,
            inspectionName: inspectionData.inspectionName,
            toggle: inspectionSelected,
            insurance: insuranceSelected,
            // --- ADDED NEW FIELDS TO CHAT DATA ---
            // clearing: clearing,
            // delivery: delivery,
            // deliveryAddress: deliveryAddress,
            // clearingPrice: clearingPrice,
            // deliveryCity: deliveryCity,
            // deliveryPrice: deliveryPrice,
            // -------------------------------------
            currency,
            profitMap: profitMap || 0,
            freightOrigPrice,
            textInput: textareaRef.current.value,
            ip: ipInfo.ip,
            ipCountry: ipInfo.country_name,
            ipCountryCode: ipInfo.country_code,
            addTransaction: {
                stockId: carData.stockID,
                dateOfTransaction: formattedTime,
                carName: carData.carName,
                referenceNumber: carData.referenceNumber,
            },
            paypalPayment: acceptPaypal
        };

        if (exists && (!missingFields || missingFields.length === 0)) {
            const res = await addChat(chatData);
            console.log("Chat created:", res.data.chatId);
            setLoadingChat(false);
            router.push(`/chats/${chatId}`);
        }

    } catch (err) {
        console.error('Failed to create chat:', err);
        setLoadingChat(false);
    }
};

// ... (Keep downloadImagesAsZip unchanged) ...
const downloadImagesAsZip = async ({ images, setIsDownloading, carData }) => {
    if (!images || images?.length === 0) {
        alert("No images to download")
        return
    }
    setIsDownloading(true)
    const zip = new JSZip()
    try {
        for (const [index, imageUrl] of images?.entries()) {
            try {
                console.log(`Downloading image: ${imageUrl}`)
                const response = await fetch(imageUrl)
                if (!response.ok) {
                    throw new Error(`Failed to fetch image at ${imageUrl}`)
                }
                const blob = await response.blob()
                const arrayBuffer = await blob.arrayBuffer()
                const extension = getFileExtension(imageUrl) || "jpg"
                const filename = `image_${index + 1}.${extension}`
                zip.file(filename, arrayBuffer)
            } catch (error) {
                console.error(`Error downloading ${imageUrl}:`, error)
            }
        }
        const zipBlob = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(zipBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${carData.carName}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Error processing images:", error)
        alert("There was an error downloading images?.")
    } finally {
        setIsDownloading(false)
    }
}

const getFileExtension = (url) => {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : null;
};

export default function CarProductPageCSR({ d2dCountries, chatCount, carData, countryArray, currency, useAuth, resultsIsFavorited, }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // 1. Parse URL Params for Clearing and Delivery
    const urlClearingOn = searchParams.get("clearing") === '1';
    const urlDeliveryCity = searchParams.get("delivery");

    const [d2dCities, setD2dCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);

    // 2. Initialize State from URL
    const [clearingEnabled, setClearingEnabled] = useState(() => urlClearingOn);
    const [deliveryEnabled, setDeliveryEnabled] = useState(() => !!urlDeliveryCity);
    const [deliveryCity, setDeliveryCity] = useState(() => urlDeliveryCity || '');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);

    const addChat = httpsCallable(functions, 'addChat')
    const [acceptPaypal, setAcceptPaypal] = useState(false)
    const [agreed, setAgreed] = useState(false)
    const [doorToDoorEnabled, setDoorToDoorEnabled] = useState(false);
    const [zones, setZones] = useState(null)

    const { user } = useAuth();
    const [shakeCountry, setShakeCountry] = useState(false);
    const [shakePort, setShakePort] = useState(false);
    const { setSelectedCurrency, selectedCurrency } = useCurrency();
    const { profitMap, setProfitMap } = useSort();
    const basePrice = (parseFloat(carData?.fobPrice) * parseFloat(currency.jpyToUsd));
    const baseFinalPrice = (basePrice) + (parseFloat(carData?.dimensionCubicMeters) * parseFloat(profitMap));

    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const images = carData?.images

    const handlePrevImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev === 0 ? images?.length - 1 : prev - 1))
    }, [images?.length])

    const handleNextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev === images?.length - 1 ? 0 : prev + 1))
    }, [images?.length])

    const handleThumbnailClick = (index) => {
        setCurrentImageIndex(index)
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying)
    }

    // Slideshow functionality
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                handleNextImage();
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, handleNextImage]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") {
                handlePrevImage();
            } else if (e.key === "ArrowRight") {
                handleNextImage();
            } else if (e.key === "Escape" && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handlePrevImage, handleNextImage, isFullscreen]);

    // Scroll the active thumbnail into view
    useEffect(() => {
        const activeThumb = document.getElementById(`thumbnail-${currentImageIndex}`)
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
        }
    }, [currentImageIndex])

    const [ports, setPorts] = useState([]);
    const country = searchParams.get("country");
    const port = searchParams.get("port");
    const inspection = searchParams.get("inspection")
    const insurance = searchParams.get("insurance")

    // Initialize state using the query parameters
    const [dropdownValuesLocations, setDropdownValuesLocations] = useState({
        "Select Country": country,
        "Select Port": port,
    });
    const selectedCountry = dropdownValuesLocations["Select Country"];
    const selectedPort = dropdownValuesLocations["Select Port"]
    const [inspectionPrice, setInspectionPrice] = useState('')
    const { inspectionData } = useInspectionToggle(dropdownValuesLocations);
    const [inspectionToggle, setInspectionToggle] = useState(undefined);
    const urlInspectionOn = inspection === '1';
    const urlInsuranceOn = insurance === '1';
    const [insuranceToggle, setInsuranceToggle] = useState(() => urlInsuranceOn);
    const rule = inspectionData?.inspectionIsRequired;
    const isRequired = rule === "Required"

    useEffect(() => {
        if (!inspectionData?.inspectionName) {
            return;
        }
        const getInspectionPrice = async () => {
            try {
                const inspectionPriceAsync = await fetchInspectionPrice(inspectionData?.inspectionName);
                setInspectionPrice(inspectionPriceAsync);
            } catch (error) {
                console.error('Error fetching inspection price:', error);
            }
        };
        getInspectionPrice();
    }, [inspectionData?.inspectionName, inspectionToggle]);

    const [d2dMatch, setD2dMatch] = useState(null);

    useEffect(() => {
        if (selectedCountry && d2dCountries && d2dCountries.length > 0) {
            const match = d2dCountries.find(
                (d2d) => d2d.name === selectedCountry || d2d.id === selectedCountry
            );
            setD2dMatch(match || null);
            if (match) {
                console.log(`✅ D2D Match Found for ${selectedCountry}:`, match);
            } else {
                console.log(`❌ No D2D configuration found for ${selectedCountry}`);
            }
        } else {
            setD2dMatch(null);
        }
    }, [selectedCountry, d2dCountries]);

    // 3. Effect to Sync Clearing/Delivery State from URL (Handle Back/Forward)
    useEffect(() => {
        // Sync Clearing
        setClearingEnabled(urlClearingOn);

        // Sync Delivery
        if (urlDeliveryCity) {
            setDeliveryEnabled(true);
            setDeliveryCity(urlDeliveryCity);
        } else {
            setDeliveryEnabled(false);
            setDeliveryCity('');
        }
    }, [urlClearingOn, urlDeliveryCity]);

    const inspectionAddOn = Number(inspectionPrice ?? 300) || 300;
    const clearingAddOn = (d2dMatch?.clearingPrice) ? Number(d2dMatch.clearingPrice) : 0;

    const selectedCityData = d2dCities.find(
        (c) => (c.name || c.id) === deliveryCity
    );
    const deliveryAddOn = (deliveryEnabled && selectedCityData?.deliveryPrice)
        ? Number(selectedCityData.deliveryPrice)
        : 0;
    const inspectionSelected =
        isRequired ? true
            : inspection !== null ? urlInspectionOn
                : (inspectionToggle ?? !!inspectionData?.toggle);

    const insuranceSelected = !!insuranceToggle;

    const finalPrice = useMemo(() => {
        const inspectionAdd = inspectionSelected ? inspectionAddOn : 0;
        const insuranceAdd = insuranceSelected ? 50 : 0;
        const clearingAdd = clearingEnabled ? clearingAddOn : 0;
        const deliveryAdd = deliveryEnabled ? deliveryAddOn : 0;
        return Number(baseFinalPrice || 0) + Number(inspectionAdd) + Number(insuranceAdd) + Number(clearingAdd) + Number(deliveryAdd);
    }, [baseFinalPrice, inspectionSelected, inspectionAddOn, insuranceSelected, clearingEnabled, clearingAddOn, deliveryEnabled, deliveryAddOn]);

    useEffect(() => {
        setInspectionToggle(prev => {
            if (isRequired) return true;
            if (inspection !== null) return urlInspectionOn;
            return prev ?? (inspectionData?.toggle ?? false);
        });
        setInsuranceToggle(prev => (prev === urlInsuranceOn ? prev : urlInsuranceOn));
    }, [
        isRequired,
        inspection, urlInspectionOn,
        insurance, urlInsuranceOn,
        inspectionData?.toggle,
        selectedCountry, selectedPort
    ]);

    const disableInspection =
        isRequired ||
        inspectionData?.isToggleDisabled === true ||
        carData?.stockStatus?.startsWith("Sold") ||
        carData?.stockStatus === "Reserved";

    const [freightOrigPrice, setFreightOrigPrice] = useState('');

    useEffect(() => {
        const getPortInspection = async () => {
            if (selectedPort === 'none' || !selectedPort) {
                setProfitMap('');
                return;
            }
            setIsFetchingModels(true);
            try {
                const res = await fetch(`/api/inspection?selectedPort=${selectedPort}`);
                const data = await res.json();
                setProfitMap(data?.portsInspection?.profitPrice);

                if (carData.port) {
                    const portPriceMapping = {
                        Nagoya: data?.portsInspection?.nagoyaPrice,
                        Kobe: data?.portsInspection?.kobePrice,
                        Yokohama: data?.portsInspection?.yokohamaPrice,
                        Kisarazu: data?.portsInspection?.yokohamaPrice,
                        Kawasaki: data?.portsInspection?.yokohamaPrice,
                        Kyushu: data?.portsInspection?.kyushuPrice,
                    };
                    setFreightOrigPrice(portPriceMapping[carData.port] || '');
                }
            } catch (error) {
                console.error("Error fetching ports:", error);
            } finally {
                setIsFetchingModels(false);
            }
        };
        getPortInspection();
    }, [selectedPort]);

    useEffect(() => {
        const getPorts = async () => {
            if (!selectedCountry) {
                setPorts([]);
                return;
            };
            setIsDataLoading(true);
            try {
                const res = await fetch(`/api/ports?ports=${selectedCountry}`);
                const data = await res.json();
                setPorts(data.ports);
                setIsDataLoading(false);
            } catch (error) {
                console.error("Error fetching ports:", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        getPorts();
    }, [selectedCountry]);

    const setPersist = (k, v) => { document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=31536000`; localStorage.setItem(k, v); };
    const clearPersist = (k) => { document.cookie = `${k}=; path=/; max-age=0`; localStorage.removeItem(k); };

  const handleDropdownChangeLocation = (key, value) => {
        // 1. Calculate the new values immediately
        let nextCountry = dropdownValuesLocations["Select Country"];
        let nextPort = dropdownValuesLocations["Select Port"];

        if (key === "Select Country") {
            nextCountry = value;
            nextPort = ""; // Reset port if country changes
        } else {
            nextPort = value;
        }

        // 2. Perform Side Effects (URL update & Persistence)
        // CRITICAL: Do this BEFORE setting state so it runs in the event handler, not the render phase
        const params = new URLSearchParams(window.location.search);
        
        if (nextCountry && nextCountry !== 'none') {
            params.set('country', nextCountry);
            setPersist('stock_country', nextCountry);
        } else {
            params.delete('country');
            clearPersist('stock_country');
        }

        if (nextPort && nextPort !== 'none') {
            params.set('port', nextPort);
            setPersist('stock_port', nextPort);
        } else {
            params.delete('port');
            clearPersist('stock_port');
        }

        const q = params.toString();
        // Safe to call router here because we are in the event handler
        router.replace(q ? `${window.location.pathname}?${q}` : window.location.pathname, { scroll: false });

        // 3. Update Local State (Purely)
        setDropdownValuesLocations({ 
            "Select Country": nextCountry, 
            "Select Port": nextPort 
        });
    };

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

    const textareaRef = useRef(null);
    const [showAlert, setShowAlert] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const thumbnailsRef = useRef(null);

    const scrollThumbnails = (offset) => {
        if (thumbnailsRef.current) {
            thumbnailsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    const isOtherPort = selectedPort === "Others";

    const isButtonDisabled =
        isDataLoading ||
        loadingChat ||
        !selectedCountry ||
        !selectedPort ||
        (
            !isOtherPort &&
            (
                !freightOrigPrice ||
                !profitMap
            )
        ) ||
        carData?.stockStatus?.startsWith("Sold") ||
        carData?.stockStatus?.startsWith("Reserved") || carData?.stockStatus === "Hidden"
        || !agreed;

    const src =
        Array.isArray(images) && images?.length > 0 && images[currentImageIndex]
            ? images[currentImageIndex]
            : '/placeholder.jpg'

    const THUMB_COUNT = 10;
    const safeImages = images ?? [];
    const thumbnailCount = Math.max(safeImages.length, THUMB_COUNT);
    const [ipInfo, setIpInfo] = useState(null);
    const [tokyoTimeData, setTokyoTimeData] = useState(null);

    useEffect(() => {
        let mounted = true;
        Promise.all([
            fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo").then(r => r.json()),
            fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time").then(r => r.json()),
        ])
            .then(([ip, time]) => {
                if (!mounted) return;
                setIpInfo(ip);
                setTokyoTimeData(time);
            })
            .catch(err => {
                if (!mounted) return;
                console.error("Preload fetch failed", err);
            });
        return () => { mounted = false; };
    }, []);

    function formatStockStatus(rawStatus) {
        if (!rawStatus) return "";
        if (rawStatus.startsWith("Sold")) {
            return "SOLD";
        }
        if (rawStatus.startsWith("Reserved")) {
            return "RESERVED";
        }
        if (rawStatus === "Hidden") {
            return "UNAVAILABLE";
        }
        return "";
    }
    const status = formatStockStatus(carData?.stockStatus);

    const showWatermark = ["SOLD", "RESERVED", "UNAVAILABLE"].includes(status);

    let watermarkColorClass;
    switch (status) {
        case "SOLD":
            watermarkColorClass = "text-red-500/50";
            break;
        case "RESERVED":
            watermarkColorClass = "text-[#ffd700]/50";
            break;
        case "UNAVAILABLE":
            watermarkColorClass = "text-gray-500/30";
            break;
        default:
            watermarkColorClass = "";
    }

    // useEffect(() => {
    //     if (d2dMatch?.id) {
    //         const fetchCities = async () => {
    //             setLoadingCities(true);
    //             try {
    //                 const res = await fetch(`/api/d2d-cities?countryId=${d2dMatch.id}`);
    //                 const data = await res.json();
    //                 if (data.cities) {
    //                     setD2dCities(data.cities);
    //                 } else {
    //                     setD2dCities([]);
    //                 }
    //             } catch (error) {
    //                 console.error("Error fetching cities:", error);
    //                 setD2dCities([]);
    //             } finally {
    //                 setLoadingCities(false);
    //             }
    //         };

    //         fetchCities();
    //     } else {
    //         setD2dCities([]);
    //     }
    // }, [d2dMatch]);


    return (
        <div className=" mx-auto px-4 py-8 z-[9999]">
            <FloatingAlertPortal
                show={showAlert}
                onClose={() => setShowAlert(false)}
                duration={5000}
            />
            {loadingChat && <Loader />}

            <div className="max-w-screen-2xl mx-auto p-4 font-sans">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                    {/* Left side - Car images and thumbnails */}
                    <div className="w-full">
                        {/* TITLE & ACTIONS */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-bold">{carData?.carName}</h1>
                                <p className="text-sm text-muted-foreground">{carData?.carDescription}</p>
                                <div className="flex items-start gap-2 mt-1">
                                    {chatCount > 3 && carData?.views + 2 > 7 && (
                                        <Badge className="gap-1.5 border-orange-200 bg-orange-50 text-orange-700 text-xs sm:text-sm">
                                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>High Demand</span>
                                        </Badge>
                                    )}

                                    <Badge variant="secondary" className="gap-1.5 text-xs sm:text-sm">
                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="truncate">{(carData?.views ?? 0) + 2} views today</span>
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {user && (
                                    <>
                                        <Button
                                            onClick={() => downloadImagesAsZip({ images, setIsDownloading, carData })}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-1"
                                        >
                                            <Download className="h-4 w-4" />
                                            <span className="hidden sm:inline">Download Images</span>
                                        </Button>
                                        <Dialog open={isDownloading} onOpenChange={setIsDownloading}>
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle>Downloading Images</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex flex-col items-center justify-center py-4">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="mt-2 text-center text-sm text-muted-foreground">
                                                        Please wait while we prepare your download...
                                                    </p>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                )}
                                <AnimatedHeartButton
                                    router={router}
                                    resultsIsFavorited={resultsIsFavorited}
                                    product={carData}
                                    userEmail={user}
                                />
                            </div>
                        </div>

                        {/* IMAGE + THUMBNAILS */}
                        <div className="flex flex-col lg:flex-row gap-4  w-full mx-auto">
                            <div className="relative w-full inline-block overflow-hidden rounded-md z-[100]">
                                <button
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full z-10"
                                    onClick={handlePrevImage}
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>

                                <ImageViewer
                                    uri={src}
                                    alt={carData?.carName || "Product image"}
                                    context="product"
                                />

                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full z-10"
                                    onClick={handleNextImage}
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>

                                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 text-xs rounded">
                                    Real Motor Japan {carData?.referenceNumber}
                                </div>
                            </div>

                            <div className="relative">
                                <div
                                    ref={thumbnailsRef}
                                    className="relative flex flex-row gap-2 w-full overflow-x-auto z-[101] h-auto lg:h-[600px] lg:w-[145px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible"
                                >
                                    <div className="flex flex-row gap-2 px-1 lg:flex-col lg:gap-2 z-10">
                                        {Array.from({ length: thumbnailCount }).map((_, idx) => {
                                            const imgSrc = safeImages[idx] ?? "/placeholder.jpg";
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleThumbnailClick(idx)}
                                                    className={`cursor-pointer overflow-hidden rounded-md border transition ${idx === currentImageIndex ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"}`}
                                                    style={{ aspectRatio: "4/3", width: "100px" }}
                                                >
                                                    <Image
                                                        src={imgSrc}
                                                        alt={`Thumbnail ${idx + 1}`}
                                                        width={100}
                                                        height={75}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <button onClick={() => scrollThumbnails(-100)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg z-[950] lg:hidden hover:bg-white transition-all"><ChevronLeft className="h-4 w-4" /></button>
                                <button onClick={() => scrollThumbnails(100)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg z-[950] lg:hidden hover:bg-white transition-all"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>

                    {/* Right side - buttons */}
                    <div className="w-full">
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-end items-center gap-3 mt-6">
                                {!user && (
                                    <SignUpButton
                                        href="/signup"
                                        variant="contrast"
                                        size="sm"
                                        orientation="horizontal"
                                        widthClass="w-40"
                                    >
                                        <UserPlus className="mr-2 h-6 w-6" />
                                        Sign Up Free
                                    </SignUpButton>
                                )}
                                <Select
                                    defaultValue={selectedCurrency.code}
                                    onValueChange={(value) => {
                                        const currencyOptions = [
                                            { code: "USD", symbol: "USD$", value: 1 },
                                            { code: "EUR", symbol: "EUR€", value: currency.usdToEur },
                                            { code: "JPY", symbol: "JPY¥", value: currency.usdToJpy },
                                            { code: "CAD", symbol: "CAD$", value: currency.usdToCad },
                                            { code: "AUD", symbol: "AUD$", value: currency.usdToAud },
                                            { code: "GBP", symbol: "GBP£", value: currency.usdToGbp },
                                            { code: "ZAR", symbol: "ZAR", value: currency.usdToZar },
                                        ]
                                        const selected = currencyOptions.find((curr) => curr.code === value)
                                        if (selected) setSelectedCurrency(selected)
                                    }}
                                >
                                    <SelectTrigger className="w-[90px] h-9 px-3 [&_svg]:text-[#0000ff] [&_svg]:stroke-[#0000ff] mx-3 -my-2">
                                        <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            { code: "USD", symbol: "USD$", value: 1 },
                                            { code: "EUR", symbol: "EUR€", value: currency.usdToEur },
                                            { code: "JPY", symbol: "JPY¥", value: currency.usdToJpy },
                                            { code: "CAD", symbol: "CAD$", value: currency.usdToCad },
                                            { code: "AUD", symbol: "AUD$", value: currency.usdToAud },
                                            { code: "GBP", symbol: "GBP£", value: currency.usdToGbp },
                                            { code: "ZAR", symbol: "ZAR", value: currency.usdToZar },
                                        ].map((curr) => (
                                            <SelectItem key={curr.code} value={curr.code}>
                                                {curr.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                            </div>
                            <div className="mt-2 -mb-2">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-bold text-blue-600">
                                        {chatCount + 2} {chatCount === 1 ? "person" : "people"} inquiring right now
                                    </span>
                                    <div className="flex gap-1">
                                        <span className="inline-block h-2 w-2 animate-[blink_1.5s_ease-in-out_0s_infinite] rounded-full bg-blue-600"></span>
                                        <span className="inline-block h-2 w-2 animate-[blink_1.5s_ease-in-out_0.5s_infinite] rounded-full bg-blue-600"></span>
                                        <span className="inline-block h-2 w-2 animate-[blink_1.5s_ease-in-out_1s_infinite] rounded-full bg-blue-600"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Card className="my-6 relative overflow-visible border-[3px] border-[#155DFC] bg-background">
                            {showWatermark && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                                    <span className={`text-[85px] max-[426px]:text-[25px] font-bold transform -rotate-45 select-none ${watermarkColorClass}`}>
                                        {status}
                                    </span>
                                </div>
                            )}

                            <CardContent className="relative z-0 p-6 md:p-8">
                                <div className="mb-8 rounded-lg border-2 border-[#155DFC] bg-[#F3FAFF] p-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-md border-2 border-[#155DFC] bg-card p-4">
                                            <p className="text-sm font-medium text-foreground mb-1">FOB Price</p>
                                            <div className="text-3xl font-bold text-foreground">
                                                <AnimatedCurrencyPrice
                                                    basePrice={basePrice}
                                                    selectedCurrency={{
                                                        symbol: selectedCurrency.symbol,
                                                        value: selectedCurrency.value,
                                                    }}
                                                    duration={1000}
                                                    selectedPort={selectedPort}
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-md border-2 border-[#155DFC] bg-card p-4">
                                            <p className="text-sm font-medium text-foreground mb-1">Final Price</p>
                                            <div className="text-3xl font-bold text-primary">
                                                <AnimatedCurrencyPrice
                                                    key={`final-${profitMap || ''}-${selectedPort || ''}-${selectedCountry || ''}-${finalPrice}`}
                                                    basePrice={profitMap && selectedPort && selectedCountry ? finalPrice : 0}
                                                    selectedCurrency={{
                                                        symbol: selectedCurrency.symbol,
                                                        value: selectedCurrency.value,
                                                    }}
                                                    duration={300}
                                                    selectedPort={selectedPort}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="mb-4 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#155DFC] text-sm font-bold text-primary-foreground">
                                            1
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground">Select Destination</h2>
                                    </div>

                                    <div>
                                        <div className="space-y-4 max-w-full">
                                            {dropdownGroupsLocations.map((group, gi) => (
                                                <div key={gi} className="grid gap-4 sm:grid-cols-2">
                                                    {group.map((dd, i) => {
                                                        const shake =
                                                            (dd.placeholder === 'Select Country' && shakeCountry) ||
                                                            (dd.placeholder === 'Select Port' && shakePort);

                                                        return (
                                                            <Dropdown
                                                                key={i}
                                                                placeholder={dd.placeholder}
                                                                options={dd.options}
                                                                value={dropdownValuesLocations[dd.placeholder] || ''}
                                                                onChange={v => handleDropdownChangeLocation(dd.placeholder, v)}
                                                                className={shake ? 'animate-shake border-red-500' : ''}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="mb-4 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#155DFC] text-sm font-bold text-primary-foreground">
                                            2
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground">Choose Services</h2>
                                    </div>

                                    <div className="rounded-lg  border-primary bg-card">
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (disableInspection || isRequired) return;

                                                    const next = !inspectionSelected;
                                                    setInspectionToggle(prev => !prev);

                                                    const params = new URLSearchParams(window.location.search);
                                                    if (next) params.set('inspection', '1');
                                                    else params.delete('inspection');

                                                    const q = params.toString();
                                                    router.replace(q ? `${location.pathname}?${q}` : location.pathname, {
                                                        scroll: false,
                                                    });
                                                }}
                                                disabled={disableInspection || isRequired}
                                                className={`relative rounded-full border-2 px-6 py-2.5 text-sm font-semibold transition-all ${inspectionSelected
                                                    ? 'border-[#155DFC] bg-[#155DFC] text-primary-foreground'
                                                    : disableInspection || isRequired
                                                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'border-[#155DFC] bg-card text-foreground hover:bg-[#155DFC] hover:text-primary-foreground'
                                                    }`}
                                            >
                                                Inspection
                                                {inspectionToggle && (
                                                    <span
                                                        className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${inspectionSelected ? 'bg-white text-[#155DFC]' : 'bg-[#155DFC] text-white'
                                                            }`}
                                                    >
                                                        +$300
                                                    </span>
                                                )}

                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = !insuranceSelected;
                                                    setInsuranceToggle(prev => !prev);

                                                    const params = new URLSearchParams(window.location.search);
                                                    if (next) params.set('insurance', '1');
                                                    else params.delete('insurance');

                                                    const q = params.toString();
                                                    router.replace(q ? `${location.pathname}?${q}` : location.pathname, {
                                                        scroll: false,
                                                    });
                                                }}
                                                className={`relative rounded-full border-2 px-6 py-2.5 text-sm font-semibold transition-all ${insuranceSelected
                                                    ? 'border-[#155DFC] bg-[#155DFC] text-primary-foreground'
                                                    : 'border-[#155DFC] bg-card text-foreground hover:bg-[#155DFC] hover:text-primary-foreground'
                                                    }`}
                                            >
                                                Insurance
                                                {insuranceToggle && (
                                                    <span
                                                        className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${insuranceSelected ? 'bg-white text-[#155DFC]' : 'bg-[#155DFC] text-white'
                                                            }`}
                                                    >
                                                        +$50
                                                    </span>
                                                )}

                                            </button>


                                        </div>
                                    </div>

                             
                                </div>

                                <div className="flex items-center gap-3 rounded-lg border-2 border-blue-500 bg-white p-3 -mt-3 mb-2">
                                    <Checkbox
                                        id="paypal"
                                        checked={acceptPaypal}
                                        onCheckedChange={(checked) => setAcceptPaypal(checked)}
                                        className="mt-1 border-2 border-input data-[state=checked]:bg-[#155dfc] data-[state=checked]:border-[#155dfc]"
                                    />
                                    <Label
                                        htmlFor="paypal"
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
                                    >
                                        <img src={'/paypal-button.png'} alt="PayPal" className="h-5" />
                                        Accept PayPal Payment
                                    </Label>
                                </div>

                                <div className="mb-6">
                                    <div className="mb-4 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#155DFC] text-sm font-bold text-primary-foreground">
                                            3
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground">Additional Information</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <Textarea
                                            placeholder="Write your message here"
                                            className="min-h-[120px] rounded-md border-2 border-input bg-card px-4 py-3"
                                            ref={textareaRef}
                                        />

                                        <div className="flex items-start space-x-2">
                                            <Checkbox
                                                id="terms"
                                                checked={agreed}
                                                onCheckedChange={val => setAgreed(val)}
                                                className="mt-1 border-2 border-input data-[state=checked]:bg-[#155dfc] data-[state=checked]:border-[#155dfc]"
                                            />
                                            <Label htmlFor="terms" className="text-sm pt-0.5">
                                                I agree to{' '}
                                                <a
                                                    href="/privacy-policy"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    onClick={e => e.stopPropagation()}
                                                    onMouseDown={e => e.preventDefault()}
                                                >
                                                    Privacy Policy
                                                </a>{' '}
                                                and{' '}
                                                <a
                                                    href="/terms-of-use"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    onClick={e => e.stopPropagation()}
                                                    onMouseDown={e => e.preventDefault()}
                                                >
                                                    Terms of Agreement
                                                </a>
                                                .
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* --- 2. UPDATED BUTTON CLICK --- */}
                                <Button
                                    id="rmj_inquiry_button"
                                    disabled={isButtonDisabled}
                                    onClick={() =>
                                        handleCreateConversation(
                                            acceptPaypal,
                                            addChat,
                                            router,
                                            setLoadingChat,
                                            setShowAlert,
                                            textareaRef,
                                            freightOrigPrice,
                                            profitMap,
                                            selectedCurrency,
                                            currency,
                                            inspectionPrice,
                                            inspectionData,
                                            carData,
                                            user,
                                            dropdownValuesLocations,
                                            setShakeCountry,
                                            setShakePort,
                                            insuranceSelected,
                                            ipInfo,
                                            tokyoTimeData,
                                            inspectionSelected,
                                            // New Values
                                            // clearingEnabled,
                                            // deliveryEnabled,
                                            // deliveryAddress,
                                            // clearingAddOn,
                                            // deliveryCity,
                                            // deliveryAddOn
                                        )
                                    }
                                    className="w-full rounded-md bg-[#155dfc] py-6 text-lg font-bold text-white hover:bg-[#155dfc]/90 disabled:opacity-50 disabled:cursor-not-allowed"

                                >
                                    Send Inquiry
                                </Button>
                            </CardContent>
                        </Card>

{/* 
                        {showDeliveryModal && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
                                <Card className="w-full max-w-md border-[3px] border-primary bg-background">
                                    <CardContent className="p-6">
                                        <div className="mb-6 flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-foreground">
                                                Delivery Details
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowDeliveryModal(false)}
                                                className="rounded-full p-1 hover:bg-gray-100"
                                            >
                                                <X className="h-5 w-5 text-foreground" />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <Label
                                                    htmlFor="delivery-city"
                                                    className="mb-2 block text-sm font-semibold text-foreground"
                                                >
                                                    City:
                                                </Label>
                                                <Select
                                                    value={deliveryCity}
                                                    onValueChange={(val) => setDeliveryCity(val)}
                                                    disabled={loadingCities || (!d2dCities.length && !loadingCities)}
                                                >
                                                    <SelectTrigger
                                                        id="delivery-city"
                                                        className="w-full h-[54px] rounded-md border-2 border-input bg-card px-4 text-foreground focus:ring-2 focus:ring-primary"
                                                    >
                                                        <SelectValue
                                                            placeholder={loadingCities ? "Loading cities..." : "Select a city"}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent
                                                        className="max-h-[40vh] overflow-y-auto z-[9999]"
                                                        side="bottom"
                                                        align="start"
                                                    >
                                                        {d2dCities && d2dCities.length > 0 ? (
                                                            d2dCities.map((city) => (
                                                                <SelectItem
                                                                    key={city.id}
                                                                    value={city.name || 'Others'}
                                                                    className="cursor-pointer py-3"
                                                                >
                                                                    {city.name || 'Others'}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-sm text-center text-muted-foreground">
                                                                {loadingCities ? "Loading..." : "No cities available for this region"}
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="delivery-address"
                                                    className="mb-2 block text-sm font-semibold text-foreground"
                                                >
                                                    Address:
                                                </Label>
                                                <Textarea
                                                    id="delivery-address"
                                                    value={deliveryAddress}
                                                    onChange={e => setDeliveryAddress(e.target.value)}
                                                    placeholder="Enter your delivery address"
                                                    className="min-h-[100px] resize-none rounded-md border-2 border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (!deliveryCity && !deliveryAddress) {
                                                        setDeliveryEnabled(false);
                                                    }

                                                    setShowDeliveryModal(false)
                                                }}
                                                variant="outline"
                                                className="flex-1 border-2 border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (!deliveryCity || !deliveryAddress) return;
                                                    setDeliveryEnabled(true);
                                                    setShowDeliveryModal(false)

                                                    // Update URL
                                                    const params = new URLSearchParams(window.location.search);
                                                    params.set('delivery', deliveryCity);

                                                    const q = params.toString();
                                                    router.replace(q ? `${location.pathname}?${q}` : location.pathname, {
                                                        scroll: false,
                                                    });
                                                }}
                                                disabled={!deliveryCity || !deliveryAddress}
                                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Confirm
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )} */}


                    </div>
                </div>
            </div>

        </div>
    )
}