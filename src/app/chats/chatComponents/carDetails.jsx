import Image from "next/image"
import { useRef, useEffect, useState } from "react";
import TimelineStatus from "./timelineStatus"
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react"
import Link from "next/link";

export default function CarDetails({ chatId, handleBackToList, isMobileView, isDetailView, countryDetails, contact, invoiceData, dueDate }) {
    const router = useRouter()
    const selectedCurrencyCode = contact?.selectedCurrencyExchange; // e.g. "JPY"

    const toNumber = (v, fallback = 0) => {
        if (v == null) return fallback;
        if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
        if (typeof v === 'string') {
            const n = parseFloat(v.replace(/[^\d.-]/g, ''));
            return Number.isFinite(n) ? n : fallback;
        }
        return fallback;
    };

    const formatMoney = (amount, symbol) =>
        Number.isFinite(amount) ? `${symbol} ${Math.round(amount).toLocaleString()}` : 'ASK';

    // --- currency setup (USD pivot) ---
    const currencies = [
        { code: "USD", symbol: "USD$", value: 1 },
        { code: "EUR", symbol: "€", value: contact?.currency?.usdToEur },
        { code: "JPY", symbol: "¥", value: contact?.currency?.usdToJpy },
        { code: "CAD", symbol: "CAD$", value: contact?.currency?.usdToCad },
        { code: "AUD", symbol: "AUD$", value: contact?.currency?.usdToAud },
        { code: "GBP", symbol: "GBP£", value: contact?.currency?.usdToGbp },
        { code: "ZAR", symbol: "R", value: contact?.currency?.usdToZar },
    ];

    const pickCurrency = (code) =>
        currencies.find(c => c.code === code) || currencies[0];

    const rates = {
        USD: 1,
        EUR: toNumber(contact?.currency?.usdToEur, NaN),
        JPY: toNumber(contact?.currency?.usdToJpy, NaN),
        CAD: toNumber(contact?.currency?.usdToCad, NaN),
        AUD: toNumber(contact?.currency?.usdToAud, NaN),
        GBP: toNumber(contact?.currency?.usdToGbp, NaN),
        ZAR: toNumber(contact?.currency?.usdToZar, NaN),
        jpyToUsd: toNumber(contact?.currency?.jpyToUsd, NaN),
    };

    const fromUSD = (usdAmount, toCode = 'USD') => {
        const usd = toNumber(usdAmount, NaN);
        if (!Number.isFinite(usd)) return NaN;
        const mul = rates[toCode] ?? 1;
        return Number.isFinite(mul) ? usd * mul : NaN;
    };

    // --- core compute ---
    // Fallback parts (all in USD)
    const fobPriceUSD = toNumber(contact?.carData?.fobPrice) *
        (Number.isFinite(rates.jpyToUsd) ? rates.jpyToUsd : 1);
    const dimM3 = toNumber(contact?.carData?.dimensionCubicMeters);
    const freightUSD = toNumber(contact?.freightPrice);
    const fallbackUSD = (Number.isFinite(fobPriceUSD) ? fobPriceUSD : 0) +
        (Number.isFinite(dimM3) ? dimM3 : 0) *
        (Number.isFinite(freightUSD) ? freightUSD : 0);


    console.log(contact?.carData?.fobPrice, 'usd')

    // Invoice totals are ALWAYS USD in your system:
    const invoiceTotalUSD = toNumber(invoiceData?.paymentDetails?.totalAmount, NaN);
    const hasInvoiceTotal = Number.isFinite(invoiceTotalUSD);

    // If invoice exists, display using the invoice’s chosen display currency,
    // otherwise use the UI-selected currency.
    const targetCurrencyCode = hasInvoiceTotal && invoiceData?.selectedCurrencyExchange
        ? invoiceData.selectedCurrencyExchange
        : pickCurrency(selectedCurrencyCode).code;

    const targetCurrency = pickCurrency(targetCurrencyCode);

    // Base (USD): invoice wins (authoritative); else fallback.
    const baseFinalUSD = hasInvoiceTotal ? invoiceTotalUSD : fallbackUSD;

    // Only add surcharges when using fallback (NOT when invoice exists)
    let amountInTarget = fromUSD(baseFinalUSD, targetCurrencyCode);

    if (!hasInvoiceTotal) {
        // FIX: Use saved inspection price if available, otherwise 300
        const savedInspectionPrice = contact?.inspectionPrice ? toNumber(contact.inspectionPrice) : 300;

        const inspection = contact?.inspection ? fromUSD(savedInspectionPrice, targetCurrencyCode) : 0;
        const insurance = contact?.insurance ? fromUSD(50, targetCurrencyCode) : 0;

        // Add Clearing & Delivery
        const clearing = contact?.clearing ? fromUSD(contact.clearingPrice || 0, targetCurrencyCode) : 0;
        const delivery = contact?.delivery ? fromUSD(contact.deliveryPrice || 0, targetCurrencyCode) : 0;

        amountInTarget = toNumber(amountInTarget, 0) + inspection + insurance + clearing + delivery;
    }

    // Final for render
    const finalDisplay = formatMoney(amountInTarget, targetCurrency.symbol);

    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const carId = contact?.carData?.stockID
    const C = useRef(new Map());

    useEffect(() => {
        if (!carId) {
            setThumbnailUrl('/placeholder.jpg');
            setLoading(false);
            return;
        }

        let aborted = false;
        const ctrl = new AbortController();

        async function loadImage() {
            setLoading(true);
            setError(null);

            if (C.current.has(carId)) {
                if (!aborted) {
                    setThumbnailUrl(C.current.get(carId) || '');
                    setLoading(false);
                }
                return;
            }

            try {
                const res = await fetch(`/api/car-images/${encodeURIComponent(carId)}`, {
                    signal: ctrl.signal,
                });

                if (!res.ok) {
                    C.current.set(carId, '');
                    if (!aborted) setThumbnailUrl('');
                    return;
                }

                const json = await res.json();
                const url = typeof json?.thumbnailUrl === 'string' ? json.thumbnailUrl : '';

                C.current.set(carId, url);
                if (!aborted) setThumbnailUrl(url);
            } catch (err) {
                if (!aborted && err.name !== 'AbortError') {
                    setThumbnailUrl('');
                    setError(err);
                }
            } finally {
                if (!aborted) setLoading(false);
            }
        }

        loadImage();

        return () => {
            aborted = true;
            ctrl.abort();
        };
    }, [carId]);

    const src = thumbnailUrl || '/placeholder.jpg';


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
                            src={src}
                            alt={contact?.carData?.carName ? contact.carData.carName : 'Car image'}
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
                        <span className="text-green-600">{finalDisplay}</span>
                    </div>

                    <div className="text-sm">{contact?.country} / {contact?.port}</div>
                    <div className="text-sm font-semibold text-green-600">
                        {[
                            (invoiceData?.paymentDetails?.inspectionIsChecked ?? contact?.inspection) ? 'INSPECTION' : null,
                            (invoiceData?.paymentDetails?.incoterms
                                ? (invoiceData?.paymentDetails?.incoterms === 'C&F' ? 'C&F' : 'CIF')
                                : (contact?.insurance ? 'CIF' : 'C&F')),
                            (invoiceData?.paymentDetails?.warrantyIsChecked ?? contact?.warranty) ? 'WARRANTY' : null,
                            contact?.clearing ? 'CLEARING' : null,
                            contact?.delivery ? 'DELIVERY' : null
                        ].filter(Boolean).join(' + ')}
                    </div>
                    <div className="text-xs text-red-500">Due Date: {dueDate ? dueDate : `No due date available`}</div>
                </div>
            </div>
        </div>
    )
}