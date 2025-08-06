"use client"
import moment from "moment"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from 'firebase/functions'
import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Download, Heart, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
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
const Dropdown = ({ placeholder, options, value, onChange, className = '' }) => {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Set hydration state after the component mounts
        setIsHydrated(true);
    }, []);

    if (!isHydrated) {
        // Render a basic placeholder or nothing during SSR
        return (
            <div className={`relative inline-block w-full ${className}`}>
                <select
                    value={value}
                    className={`w-full border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300 ${className}`}
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
        );
    }

    // Render the Select component after hydration
    return (
        <div className={`relative inline-block w-full ${className}`} style={{ zoom: 1.25, transformOrigin: "top left" }}>
            <Select value={decodeURIComponent(value)} onValueChange={onChange}>
                <SelectTrigger className={`bg-white ${className}`}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    collisionPadding={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="
    w-[var(--radix-select-trigger-width)]
    overflow-y-auto
    max-h-[20vh]
  "
                >
                    {options.map((option, idx) => (
                        <SelectItem key={idx} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
async function handleCreateConversation(
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
    insuranceToggle,
    ipInfo,
    tokyoTimeData
) {
    setLoadingChat(true);

    // 1) Make sure we have a user and an account
    if (!user) {
        console.log("User not logged in or email not verified.");
        setLoadingChat(false);
        return router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
    const { exists, missingFields } = await checkUserExist(user)
    if (!exists || (missingFields && missingFields.length > 0)) {
        return router.push("/accountCreation")
    }


    // 2) Check for an existing chat
    const chatId = `chat_${carData?.stockID}_${user}`;
    const checkChat = await checkChatExists(carData?.stockID, user)
    if (checkChat.exists) {
        console.log("Chat already exists for this inquiry.");
        setShowAlert(true);
        setLoadingChat(false);
        return setTimeout(() => router.push(`/chats/${chatId}`), 100);
    }

    // 3) Validate dropdowns
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
        // 4) Fetch IP info + Tokyo time in parallel

        const m = moment(tokyoTimeData.datetime, 'YYYY/MM/DD HH:mm:ss.SSS');
        const formattedTime = m.format('YYYY/MM/DD [at] HH:mm:ss');
        const docId = m.format('YYYY-MM');
        const dayField = m.format('DD');

        // 5) Optionally record offer stats
        if (docId && carData && user && dayField && exists && (!missingFields || missingFields.length === 0)) {
            await addOfferStatsCustomer({ docId, carData, userEmail: user, dayField });
        }

        // 6) **Only now** actually create the chat
        //    (this will never run for non-existent users or if chatExists was true)
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
            toggle: inspectionData.toggle,
            insurance: insuranceToggle,
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
        };

        if (exists && (!missingFields || missingFields.length === 0)) {
            // … build chatData …
            const res = await addChat(chatData);
            console.log("Chat created:", res.data.chatId);
            setLoadingChat(false);
            router.push(`/chats/${chatId}`);
        }

    } catch (err) {
        console.error('Failed to create chat:', err);
        setLoadingChat(false);
    }
}


const downloadImagesAsZip = async ({ images, setIsDownloading, carData }) => {
    if (!images || images?.length === 0) {
        alert("No images to download")
        return
    }

    setIsDownloading(true)
    const zip = new JSZip()

    try {
        // Download each image and add to zip
        for (const [index, imageUrl] of images?.entries()) {
            try {
                console.log(`Downloading image: ${imageUrl}`)
                const response = await fetch(imageUrl)

                if (!response.ok) {
                    throw new Error(`Failed to fetch image at ${imageUrl}`)
                }

                // Convert response to Blob then to ArrayBuffer (needed by JSZip)
                const blob = await response.blob()
                const arrayBuffer = await blob.arrayBuffer()
                const extension = getFileExtension(imageUrl) || "jpg"
                const filename = `image_${index + 1}.${extension}`

                zip.file(filename, arrayBuffer)
            } catch (error) {
                console.error(`Error downloading ${imageUrl}:`, error)
            }
        }

        // Generate the zip file as a blob
        const zipBlob = await zip.generateAsync({ type: "blob" })

        // Create download link
        const url = URL.createObjectURL(zipBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${carData.carName}.zip`
        document.body.appendChild(link)
        link.click()

        // Clean up
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Error processing images:", error)
        alert("There was an error downloading images?.")
    } finally {
        setIsDownloading(false)
    }
}

// Helper function to get file extension from URL
const getFileExtension = (url) => {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : null;
};

export default function CarProductPageCSR({ carData, countryArray, currency, useAuth, resultsIsFavorited, }) {
    const addChat = httpsCallable(functions, 'addChat')


    const router = useRouter();
    const [insuranceToggle, setInsuranceToggle] = useState(false)
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
    const searchParams = useSearchParams();
    const country = searchParams.get("country");
    const port = searchParams.get("port");

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

    const isRequired = inspectionData?.inspectionIsRequired === "Required";
    const checkedValue =
        isRequired
            ? true
            : inspectionToggle !== undefined
                ? inspectionToggle
                : !!inspectionData?.toggle;
    const finalPrice =
        baseFinalPrice
        + (checkedValue ? (inspectionPrice ?? 300) : 0)
        + (insuranceToggle ? 50 : 0);


    useEffect(() => {
        if (!isRequired) {
            setInspectionToggle(false);
        }
    }, [selectedCountry, isRequired]);

    const [freightOrigPrice, setFreightOrigPrice] = useState('');
    useEffect(() => {
        const getPortInspection = async () => {
            // If selectedPort is blank, set profitMap to blank and exit early.
            if (selectedPort === 'none' || !selectedPort) {
                setProfitMap('');
                return;
            }
            setIsFetchingModels(true);
            try {
                // Update URL to send "selectedPort" as the query parameter
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
                setPorts([]); // Clear ports if no country is selected
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

    const handleDropdownChangeLocation = (key, value) => {
        setDropdownValuesLocations((prevValues) => {
            if (key === "Select Country") {
                return {
                    ...prevValues,
                    [key]: value,
                    "Select Port": "",
                };
            }
            return {
                ...prevValues,
                [key]: value,
            };
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


    const textareaRef = useRef(null);

    // Access the value anytime using textareaRef.current.value
    // Example usage:

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
        isDataLoading ||                              // still fetching…
        loadingChat ||                                //…or chatting
        !selectedCountry ||                           // country must be picked
        !selectedPort ||                              // port must be picked
        (
            !isOtherPort &&                           // if _not_ “Others”…
            (                                       // …then require both price & profit
                !freightOrigPrice ||
                !profitMap
            )
        ) ||
        carData?.stockStatus?.startsWith("Sold") ||
       carData?.stockStatus?.startsWith("Reserved") || carData?.stockStatus === "Hidden";
    const src =
        Array.isArray(images) && images?.length > 0 && images[currentImageIndex]
            ? images[currentImageIndex]
            : '/placeholder.jpg'

    const THUMB_COUNT = 10;
    // fall back to an empty array if images is undefined/null
    const safeImages = images ?? [];
    // at least THUMB_COUNT slots, or more if you have more images
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
        // anything else falls back to unavailable
        return "";
    }
    const status = formatStockStatus(carData?.stockStatus);

    // 2) Decide when to show the watermark
    const showWatermark = ["SOLD", "RESERVED", "UNAVAILABLE"].includes(status);

    // 3) Pick a color class for each status
    let watermarkColorClass;
    switch (status) {
        case "SOLD":
            watermarkColorClass = "text-red-500/50";
            break;
        case "RESERVED":
            watermarkColorClass = "text-[#ffd700]/50";
            break;
        case "UNAVAILABLE":
            // without text-sm, it'll stay text-[120px]/max-[426px]:text-[25px]
            watermarkColorClass = "text-gray-500/30";
            break;
        default:
            watermarkColorClass = "";
    }
    return (
        <div className=" mx-auto px-4 py-8 z-[9999]">
            <FloatingAlertPortal
                show={showAlert}
                onClose={() => setShowAlert(false)}
                duration={5000} // 5 seconds
            />
            {loadingChat && <Loader />}
            {/* {isFullscreen && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center">
                    <div className="relative w-full h-[80vh] max-w-6xl">
                        <Image
                            src={images[currentImageIndex] || "/placeholder.svg"}
                            alt={`Image ${currentImageIndex + 1}`}
                            fill
                            className="object-contain"

                        />
                    </div>

                    <div className="absolute bottom-4 left-0 right-0">
                        <div className="flex justify-center gap-2 px-4">
                            <Button variant="ghost" size="icon" onClick={handlePrevImage} className="text-white hover:bg-white/20">
                                <ChevronLeft className="h-6 w-6" />
                            </Button>

                            <div className="flex-1 max-w-3xl overflow-x-auto hide-scrollbar">
                                <div className="flex gap-2 justify-center">
                                    {images?.map((image, index) => (
                                        <div
                                            key={index}
                                            id={`fullscreen-thumbnail-${index}`}
                                            className={`flex-shrink-0 w-16 h-12 overflow-hidden rounded-md border cursor-pointer ${index === currentImageIndex ? "ring-2 ring-white" : "opacity-70"
                                                }`}
                                            onClick={() => handleThumbnailClick(index)}
                                        >
                                            <Image
                                                src={image || "/placeholder.svg"}
                                                alt={`Thumbnail ${index + 1}`}
                                                width={80}
                                                height={60}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button variant="ghost" size="icon" onClick={handleNextImage} className="text-white hover:bg-white/20">
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            )} */}
            <div className="max-w-screen-2xl mx-auto p-4 font-sans">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                    {/* Left side - Car images and thumbnails */}
                    <div className="w-full">
                        {/* TITLE & ACTIONS */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-bold">{carData?.carName}</h1>
                                <p className="text-sm text-muted-foreground">{carData?.carDescription}</p>
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
                            {/* MAIN IMAGE WRAPPER */}
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

                            {/* THUMBNAILS */}
                            <div className="relative">
                                {/* Scrollable thumbnail container */}
                                <div
                                    ref={thumbnailsRef}
                                    className="
      relative flex flex-row gap-2 w-full overflow-x-auto z-[101]
      h-auto lg:h-[600px] lg:w-[145px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible
    "
                                >
                                    <div className="flex flex-row gap-2 px-1 lg:flex-col lg:gap-2 z-10">
                                        {Array.from({ length: thumbnailCount }).map((_, idx) => {
                                            const imgSrc = safeImages[idx] ?? "/placeholder.jpg";
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleThumbnailClick(idx)}
                                                    className={`
            cursor-pointer overflow-hidden rounded-md border transition
            ${idx === currentImageIndex
                                                            ? "ring-2 ring-primary"
                                                            : "opacity-70 hover:opacity-100"}
          `}
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

                                {/* Floating left scroll button (mobile only) */}
                                <button
                                    onClick={() => scrollThumbnails(-100)}
                                    className="
      absolute left-2 top-1/2 -translate-y-1/2
      p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg z-[950]
      lg:hidden hover:bg-white transition-all
    "
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {/* Floating right scroll button (mobile only) */}
                                <button
                                    onClick={() => scrollThumbnails(100)}
                                    className="
      absolute right-2 top-1/2 -translate-y-1/2
      p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg z-[950]
      lg:hidden hover:bg-white transition-all
    "
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>


                    </div>

                    {/* Right side - buttons */}
                    <div className="w-full">
                        <div className="flex justify-end mt-6">
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

                        <Card className="my-6 relative overflow-visible">
                            {/* Watermark overlay */}
                            {showWatermark && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                                    <span
                                        className={`
        text-[85px]
        max-[426px]:text-[25px]
        font-bold
        transform -rotate-45
        select-none
        ${watermarkColorClass}
      `}
                                    >
                                        {status}
                                    </span>
                                </div>
                            )}

                            {/* Actual card content */}
                            <CardContent className="relative z-0 p-6">
                                {/* Background stripe */}
                                <div className="relative mb-6">
                                    <div className="absolute -inset-6 bg-[#E5EBFD] rounded-t-md" />
                                    <div className="relative grid grid-cols-2 gap-4 p-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Current FOB Price</p>
                                            <AnimatedCurrencyPrice
                                                basePrice={basePrice}
                                                selectedCurrency={{ symbol: selectedCurrency.symbol, value: selectedCurrency.value }}
                                                duration={1000}
                                                selectedPort={selectedPort}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Estimated Price</p>
                                            <AnimatedCurrencyPrice
                                                basePrice={profitMap && selectedPort && selectedCountry ? finalPrice : 0}
                                                selectedCurrency={{ symbol: selectedCurrency.symbol, value: selectedCurrency.value }}
                                                duration={1000}
                                                selectedPort={selectedPort}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdowns & switches */}
                                <div className="relative mb-6 z-[9999]">
                                    <div className="absolute -inset-6 bg-[#F2F5FE] -z-10" />
                                    <div className="space-y-2 max-w-full relative z-10 p-4">
                                        {dropdownGroupsLocations.map((group, gi) => (
                                            <div key={gi} className="grid gap-4 sm:grid-cols-2">
                                                {group.map((dd, i) => {
                                                    const shake = (dd.placeholder === "Select Country" && shakeCountry)
                                                        || (dd.placeholder === "Select Port" && shakePort);
                                                    return (
                                                        <Dropdown
                                                            key={i}
                                                            placeholder={dd.placeholder}
                                                            options={dd.options}
                                                            value={dropdownValuesLocations[dd.placeholder] || ""}
                                                            onChange={v => handleDropdownChangeLocation(dd.placeholder, v)}
                                                            className={shake ? "animate-shake border-red-500" : ""}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}

                                        <div className="grid grid-cols-2 gap-8 pt-4">
                                            <div className="flex items-center space-x-2">
                                                <Switch

                                                    id="inspection"
                                                    checked={checkedValue}
                                                    disabled={inspectionData?.isToggleDisabled || isRequired || carData?.stockStatus?.startsWith("Sold") || carData?.stockStatus === "Reserved"}
                                                    onCheckedChange={checked => {
                                                        if (!isRequired) setInspectionToggle(checked);
                                                    }}
                                                    className="data-[state=checked]:bg-[#7b9cff]"
                                                />
                                                <Label htmlFor="inspection">Inspection</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Switch id="insurance"
                                                    onCheckedChange={checked => setInsuranceToggle(checked)}
                                                    className="data-[state=checked]:bg-[#7b9cff]" />
                                                <Label htmlFor="insurance">Insurance</Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Message & submit */}
                                <div className="space-y-4 p-4">
                                    <Textarea placeholder="Write your message here" className="min-h-[120px]" ref={textareaRef} />
                                    <div className="flex items-start space-x-2">
                                        <Checkbox id="terms" />
                                        <Label htmlFor="terms" className="text-sm pt-0.5">
                                            I agree to Privacy Policy and Terms of Agreement
                                        </Label>
                                    </div>
                                    <Button
                                        disabled={isButtonDisabled}
                                        onClick={() =>
                                            handleCreateConversation(
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
                                                insuranceToggle,
                                                ipInfo,
                                                tokyoTimeData
                                            )
                                        }
                                        className="w-full bg-blue-600 hover:bg-blue-700 py-6"
                                    >
                                        Send Inquiry
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>

        </div>
    )
}

