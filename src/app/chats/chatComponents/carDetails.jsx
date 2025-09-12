import Image from "next/image"
import { useEffect, useState } from "react";
import TimelineStatus from "./timelineStatus"
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react"
import Link from "next/link";
export default function CarDetails({ chatId, handleBackToList, isMobileView, isDetailView, countryDetails, contact, invoiceData, dueDate }) {
    const router = useRouter()
    const selectedCurrencyCode = contact?.selectedCurrencyExchange; // e.g. "JPY"
    // Payment auto-navigation removed — SEO/admin will control visible URL for /chats/payment
    // 2) build your lookup table
    const currencies = [
        { code: "USD", symbol: "USD$", value: 1 },
        { code: "EUR", symbol: "€", value: contact?.currency?.usdToEur },
        { code: "JPY", symbol: "¥", value: contact?.currency?.usdToJpy },
        { code: "CAD", symbol: "CAD$", value: contact?.currency?.usdToCad },
        { code: "AUD", symbol: "AUD$", value: contact?.currency?.usdToAud },
        { code: "GBP", symbol: "GBP£", value: contact?.currency?.usdToGbp },
        { code: "ZAR", symbol: "R", value: contact?.currency?.usdToZar },
    ];

    // 3) find the matching currency (fallback to USD if nothing matches)
    const currency =
        currencies.find((c) => c.code === selectedCurrencyCode)
        || currencies[0];

    // 4) do your price math with currency.value
    const basePrice =
        parseFloat(contact?.carData?.fobPrice)
        * parseFloat(contact?.currency.jpyToUsd);

    const baseFinalPrice = invoiceData?.paymentDetails.totalAmount ? parseFloat(invoiceData?.paymentDetails.totalAmount) - (contact?.inspection ? 300 : 0) :
        basePrice
        + parseFloat(contact?.carData?.dimensionCubicMeters)
        * parseFloat(contact?.freightPrice);

    const inspectionSurcharge = contact?.inspection ? 300 * currency.value : 0;
    const insuranceSurcharge = contact?.insurance ? 50 * currency.value : 0
    const finalPrice = (baseFinalPrice * currency.value + inspectionSurcharge + insuranceSurcharge);


    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const carId = contact?.carData?.stockID
useEffect(() => {
  let cancelled = false;

  const normalizeToArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload === "string") return payload ? [payload] : [];
    if (typeof payload === "object") {
      if (Array.isArray(payload.images)) return payload.images;
      if (typeof payload.images === "string") return [payload.images];
      if (typeof payload.image === "string") return [payload.image];
      if (typeof payload.url === "string") return [payload.url];
      if (typeof payload.href === "string") return [payload.href];
    }
    return [];
  };

  async function loadImages() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/car-images/${carId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : await res.text();

      const imagesArr = normalizeToArray(data);

      if (!cancelled) {
        setImages(imagesArr);
      }
    } catch (err) {
      if (!cancelled) {
        setImages([]); // keep state consistent
        setError(err);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  if (carId) {
    loadImages();
  } else {
    setImages([]);
    setLoading(false);
  }

  return () => {
    cancelled = true;
  };
}, [carId]);

    const src = images[0] ? images[0] : '/placeholder.jpg';
    

    return (

        <div className="w-full overflow-x-auto mx-auto rounded-sm p-4 font-sans bg-white">
            <div className="flex gap-4 lg:max-w-[730px] w-[790px]">

                <div className="min-[768px]:hidden flex justify-center items-center">
                    <Link
                        href={'/chats'}
                        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                        aria-label="Back to list"
                    >

                        <ChevronLeft className="w-10 h-10 text-gray-700 cursor-pointer" />

                    </Link>
                </div>


                <div className="flex flex-col gap-2">
                    <div className="relative w-20 h-20 overflow-hidden rounded-[50%] border border-gray-200">
                        <Image
                            src={
                                src
                            }
                            alt={
                                contact?.carData?.carName
                                    ? contact.carData.carName
                                    : 'Car image'
                            }
                            layout="fill"
                            className="object-fit"
                        />

                    </div>
                </div>

                {/* Middle - Title and details */}
                <div className="flex-1">
                    <h2 className="text-lg font-bold">
                        <a href={`/product/${contact?.carData?.stockID}`} className="text-blue-600 hover:underline">
                            {contact?.carData?.carName}
                        </a>
                    </h2>
                    <div className="text-xs text-gray-500">{contact?.carData?.referenceNumber}</div>


                    <div className="mt-4 flex items-center justify-between relative">
                        {/* <div className="absolute h-0.5 bg-gray-300 w-full top-1/2 -translate-y-1/2 z-0"></div>
                        {[1, 2, 3, 4, 5, 6, 7].map((step, index) => (
                            <div key={index} className="z-10 flex flex-col items-center">
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${index < 2 ? "bg-blue-500 text-white" : "bg-gray-200"
                                        }`}
                                >
                                    {index === 0 ? <span className="text-xs">✓</span> : <span className="text-xs">{step}</span>}
                                </div>
                            </div>
                        ))} */}
                        <TimelineStatus currentStep={contact?.stepIndicator.value} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-x-1 text-sm hide-after-1077">
                    <div className="text-gray-600">{contact?.carData?.chassisNumber}</div>
                    <div className="text-gray-600">{contact?.carData?.modelCode}</div>
                    <div className="text-gray-600">{contact?.carData?.mileage} km</div>
                    <div className="text-gray-600">{contact?.carData?.fuel}</div>
                    <div className="text-gray-600">{contact?.carData?.transmission}</div>
                </div>


                {/* Right side - Price and location */}
                <div className="flex flex-col gap-2 min-w-[180px]">
                    <div className="font-bold">
                        Total Price:{' '}
                        <span className="text-green-600">
                            {
                                (() => {
                                    const invoiceTotal = Number(invoiceData?.paymentDetails?.totalAmount);
                                    const fallback = Number(finalPrice);

                                    const amount =
                                        invoiceTotal > 0 ? invoiceTotal :
                                            fallback > 0 ? fallback :
                                                null;
                                    return amount != null
                                        ? `${currency.symbol} ${Math.ceil(amount).toLocaleString()}`
                                        : 'ASK';
                                })()
                            }

                        </span>
                    </div>

                    <div className="text-sm">{contact?.country} / {contact?.port}</div>
                    <div className="text-sm font-semibold text-green-600">
                        {[
                            (invoiceData?.paymentDetails?.inspectionIsChecked ?? contact?.inspection) ? 'INSPECTION' : null,
                            (invoiceData?.paymentDetails?.incoterms
                                ? (invoiceData?.paymentDetails?.incoterms === 'C&F' ? 'C&F' : 'CIF')
                                : (contact?.insurance ? 'CIF' : 'C&F')),
                            (invoiceData?.paymentDetails?.warrantyIsChecked ?? contact?.warranty) ? 'WARRANTY' : null
                        ].filter(Boolean).join(' + ')}


                    </div>
                    <div className="text-xs text-red-500">Due Date: {dueDate ? dueDate : `No due date available`}</div>
                </div>
            </div>
        </div>


    )
}

