"use client"
import Link from "next/link"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Ship, Info, X, Package, FileText, ExternalLink, Check, Download, Clock, User } from 'lucide-react'
import TimelineStatus from "@/app/chats/chatComponents/timelineStatus"
import { fetchBookingData, fetchInvoiceData } from "@/app/actions/actions";
import PreviewInvoice from "@/app/chats/chatComponents/previewInvoice";
import { doc, query, collection, where, orderBy, limit as qlimit, onSnapshot, startAfter, getDocs, updateDoc, documentId, getDoc } from "firebase/firestore"
import { firestore } from "../../../../firebase/clientApp"
import { m } from "framer-motion"

// 1️⃣ Define a single lookup object:

const LIVE_LIMIT = 20;
const PAGE_SIZE = 10;

let lastCursor = null;

const invoiceCache = new Map();

const statusConfig = {
    1: {
        color: 'bg-gray-100 text-gray-800',
        text: 'Negotiation',
    },
    2: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Proforma Invoice',
    },
    3: {
        color: 'bg-indigo-100 text-indigo-800',
        text: 'Order Item',
    },
    4: {
        color: 'bg-purple-100 text-purple-800',
        text: 'Payment Confirmation',
    },
    5: {
        color: 'bg-teal-100 text-teal-800',
        text: 'Shipping Schedule',
    },
    6: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Documents',
    },
    7: {
        color: 'bg-green-100 text-green-800',
        text: 'Vehicle Received',
    },
    // legacy statuses
    completed: {
        color: 'bg-green-100 text-green-800',
        text: 'Completed',
    },
    delayed: {
        color: 'bg-red-100 text-red-800',
        text: 'Delayed',
    },
    // fallback
    default: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Active',
    },
}
function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
        >
            {icon}
            {label}
        </button>
    )
}
function InfoItem({ label, value }) {
    return (
        <div className="flex flex-col">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    )
}

function OrderCard({ order, userEmail }) {
    console.log(order?.invoice?.invoiceData?.paymentDetails.totalAmount, 'amount')
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState("shipping");
    const [invoiceData, setInvoiceData] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    const [hasFetchedInvoice, setHasFetchedInvoice] = useState(false);
    const [hasFetchedBooking, setHasFetchedBooking] = useState(false);
    const selectedCurrencyCode = order?.selectedCurrencyExchange;
    const currencies = [
        { code: "USD", symbol: "$", value: 1 },
        { code: "EUR", symbol: "€", value: order?.currency?.usdToEur },
        { code: "JPY", symbol: "¥", value: order?.currency?.usdToJpy },
        { code: "CAD", symbol: "CAD$", value: order?.currency?.usdToCad },
        { code: "AUD", symbol: "AUD$", value: order?.currency?.usdToAud },
        { code: "GBP", symbol: "GBP£", value: order?.currency?.usdToGbp },
        { code: "ZAR", symbol: "R", value: order?.currency?.usdToZar },
    ];
    const currency = currencies.find((c) => c.code === selectedCurrencyCode)
        || currencies[0];



    const basePrice =
        parseFloat(order?.carData?.fobPrice)
        * parseFloat(order?.currency.jpyToUsd);

    const baseFinalPrice = order.invoice?.invoiceData?.paymentDetails.totalAmount ? parseFloat(order.invoice?.invoiceData?.paymentDetails.totalAmount) - (order?.inspection ? 300 : 0) :
        basePrice
        + parseFloat(order?.carData?.dimensionCubicMeters)
        * parseFloat(order?.freightPrice);

    const inspectionSurcharge = order?.inspection ? 300 * currency.value : 0;
    const insuranceSurcharge = order?.insurance ? 50 * currency.value : 0
    const finalPrice = (baseFinalPrice * currency.value + inspectionSurcharge + insuranceSurcharge);




    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }


    const getStatusColor = (status) => {
        return (statusConfig[status] || statusConfig.default).color
    }

    const getStatusText = (status) => {
        return (statusConfig[status] || statusConfig.default).text
    }
    const isOverdue = new Date(order.dueDate) < new Date() && order.status !== 'completed'
    function formatToShortDate(ts) {
        // remove the “ at …” part so Date can parse it
        const cleaned = ts.replace(/ at.*$/, '')
        const date = new Date(cleaned)
        return date.toLocaleDateString('en-US', {
            month: 'short',   // “Jun”
            day: '2-digit', // “23”
            year: 'numeric'  // “2025”
        })
    }
    function formatToTime(ts) {
        let dateObj

        if (ts?.toDate) {
            // Firestore Timestamp
            dateObj = ts.toDate()
        } else {
            // Remove the millisecond fraction, normalize slashes, and drop "at"
            const cleaned = ts
                .replace(/\.\d+/, '')       // "2025/06/23 at 11:26:13"
                .replace(/\//g, '-')        // "2025-06-23 at 11:26:13"
                .replace(' at ', ' ')       // "2025-06-23 11:26:13"
            dateObj = new Date(cleaned)
        }

        return dateObj.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
        })
    }
    const openModal = async () => {
        setShowModal(true);

        // only fetch once, when modal opens
        if (
            order?.invoiceNumber &&
            order.stepIndicator.value > 3 &&
            !hasFetchedInvoice && !hasFetchedBooking
        ) {
            try {
                const [dataInvoice, dataBooking, chatData] = await Promise.all([
                    fetchInvoiceData({ invoiceNumber: order.invoiceNumber }),
                    fetchBookingData({
                        userEmail,
                        invoiceNumber: order.invoiceNumber
                    }),
                ]);

                setInvoiceData(dataInvoice);
                setBookingData(dataBooking);

                setHasFetchedInvoice(true);
                setHasFetchedBooking(true);
            } catch (err) {
                console.error("Failed to fetch details:", err);
            }
        }
    };
    function extractTime(ts) {
        const m = ts.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
        return m ? m[1] : ''
    }
    function extractDate(ts) {
        // split off the date portion
        const [datePart] = ts.split(' ')
        const [day, month, year] = datePart.split('/').map(Number)
        // JS months are 0‑indexed
        const dateObj = new Date(year, month - 1, day)

        return dateObj.toLocaleDateString('en-US', {
            month: 'short',  // “Jun”
            day: '2-digit',// “24”
            year: 'numeric' // “2025”
        })
    }
    function extractDateFromLog(log) {
        // split off everything after the first space
        const [datePart] = log.split(' ')
        const [day, month, year] = datePart.split('/').map(Number)
        const dateObj = new Date(year, month - 1, day)
        return dateObj.toLocaleDateString('en-US', {
            month: 'short',  // "Jul"
            day: '2-digit',// "08"
            year: 'numeric' // "2025"
        })
    }


    function extractTimeFromLog(log) {
        const m = log.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
        return m ? m[1] : ''
    }

    const rawTs = order?.payments?.[0]?.timestamp
    const rawBookingTs = bookingData?.exportCert?.timestamp
    const rawBookingShippingTs = bookingData?.shippingInfo?.lastUpdated
    const rawBookingSi = bookingData?.sI?.lastUpdated
    const date = rawTs ? formatToShortDate(rawTs) : 'TBA'
    const time = rawTs ? formatToTime(rawTs) : 'TBA'
    const dateBooking = rawBookingTs ? extractDate(rawBookingTs) : 'TBA'
    const dateShipping = rawBookingShippingTs ? extractDateFromLog(rawBookingShippingTs) : 'TBA'
    const timeShipping = rawBookingShippingTs ? extractTimeFromLog(rawBookingShippingTs) : 'TBA'
    const dateSi = rawBookingSi ? extractDateFromLog(rawBookingSi) : 'TBA'
    const timeSi = rawBookingSi ? extractTimeFromLog(rawBookingSi) : 'TBA'
    const carOrder = {
        id: "T202406909/RM-21",
        title: "2009 NISSAN NOTE",
        features: "NAVI,CD PLAYER,KEYLESS,GOOD CONDITION",
        price: "$622",
        year: "2009",
        mileage: "68944",
        exteriorColor: "Silver",
        image: "/placeholder.svg", // Replace with actual image path
        shipping: {
            carrier: bookingData?.shippingInfo?.carrier,
            vesselLoading: bookingData?.shippingInfo?.departure?.vesselName,
            voyNoLoading: bookingData?.shippingInfo?.departure?.voyNo,
            portOfLoading: bookingData?.shippingInfo?.departure?.portOfLoading,
            etd: bookingData?.shippingInfo?.departure?.etd_jst,
            vesselDischarge: bookingData?.shippingInfo?.arrival?.vesselName,
            voyNoDischarge: bookingData?.shippingInfo?.arrival?.voyNo,
            portOfDischarge: bookingData?.shippingInfo?.arrival?.portOfDischarge,
            eta: bookingData?.shippingInfo?.departure?.eta_jst,
        },
        documents: [
            { name: "Invoice No. ", status: "Uploaded", url: <PreviewInvoice invoiceData={invoiceData} selectedChatData={order} context={'invoice'} /> },
            { name: "Export Certificate", status: "Uploaded", url: bookingData?.exportCert?.url },
            { name: "SI", status: "Uploaded", url: bookingData?.sI?.url },
            { name: "B/L", status: "Uploaded", url: bookingData?.bL?.url },
        ],
        statuses: [
            {
                stage: "Booking",
                status: order.stepIndicator.value >= 4 ? "completed" : "in-progress",
                actionTaker: "RMJ",
                action: "Payment Confirmed.",
                date: date,
                time: time,
                location: "Nagoya, Japan",
            },
            {
                stage: "Booking",
                status: "completed",
                actionTaker: "RMJ",
                action: "Coordinated with shipping company.",
                date: date,
                time: time,
                location: "Tokyo, Japan",
            },
            {
                stage: "Booking",
                status: bookingData?.exportCert?.url ? "completed" : "in-progress",
                actionTaker: "RMJ",
                action: "Uploaded Export Certificate",
                date: dateBooking,
                time: bookingData?.exportCert?.timestamp ? extractTime(bookingData?.exportCert?.timestamp) : 'TBA',
                location: "Yokohama Port, Japan",
            },
            {
                stage: "Shipping",
                status: bookingData?.shippingInfo?.departure?.etd_jst ? "completed" : "in-progress",
                actionTaker: "Shipping Company",
                action: "Updated shipping information.",
                date: dateShipping,
                time: timeShipping,
                location: "Destination Port",
            },
            {
                stage: "Shipping",
                status: bookingData?.sI?.url ? "completed" : "in-progress",
                actionTaker: "Shipping Company",
                action: "Uploaded Shipping information details.",
                date: dateSi,
                time: timeSi,
                location: "Destination Country",
            },
            {
                stage: "Booking",
                status: bookingData?.bL?.url ? "completed" : "in-progress",
                actionTaker: "RMJ",
                action: "Uploaded B/L.",
                date: "May 10, 2023",
                time: "10:30",
                location: "Destination Country",
            },
            {
                stage: "Booking",
                status: bookingData?.dhl?.trackingNumber ? "completed" : "in-progress",
                actionTaker: "RMJ",
                action: "Updated DHL information.",
                date: "May 10, 2023",
                time: "10:30",
                location: "Destination Country",
            },
        ],
        dhl: {
            name: order?.docDelAdd?.deliveryInfo?.formData?.fullName,
            address: order?.docDelAdd?.deliveryInfo?.formData?.address,
            city: order?.docDelAdd?.deliveryInfo?.formData?.city,
            country: order?.docDelAdd?.deliveryInfo?.formData?.country,
            trackingNumber: bookingData?.dhl?.trackingNumber,
        },
        consignee: {
            name: invoiceData?.consignee?.name,
            address: invoiceData?.consignee?.address,
            city: invoiceData?.consignee?.city,
            country: invoiceData?.consignee?.country,
            Tel: invoiceData?.consignee?.contactNumber,

        },
        notify: {
            name: invoiceData?.notifyParty?.name,
            address: invoiceData?.notifyParty?.address,
            city: invoiceData?.notifyParty?.city,
            country: invoiceData?.notifyParty?.country,
            Tel: invoiceData?.notifyParty?.contactNumber,
        },
    }
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const carId = order?.carData?.stockID
    useEffect(() => {
        let cancelled = false;

        async function loadImages() {
            setLoading(true);
            try {
                const res = await fetch(`/api/car-images/${carId}`);
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const json = await res.json();
                if (!cancelled) {
                    setImages(Array.isArray(json.images) ? json.images : []);
                }
            } catch (err) {
                if (!cancelled) setError(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (carId) {
            loadImages();
        } else {
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [carId]);
    const src = images[0] ? images[0] : '/placeholder.jpg';
    return (
        <Card className="w-full">
            <CardContent className="p-4 space-y-4">
                {/* Mobile-first Header */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-18 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                                src={src}
                                alt={order.carData?.model}
                                className="h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base leading-tight">{order?.carData?.carName ? order?.carData?.carName : `Unit`}</h3>
                            <Badge variant="outline" className="text-xs px-2 py-1 mt-2">
                                {order?.invoiceNumber ? `RMJ-${order?.invoiceNumber}` : `RMJ-`}
                            </Badge>
                            <Badge className={`text-xs px-2 py-1 mt-2 ml-2 ${getStatusColor(order.stepIndicator.value)}`}>
                                {getStatusText(order.stepIndicator.value)}
                            </Badge>
                        </div>
                    </div>

                </div>

                {/* Progress Section */}
                <div className="space-y-3">

                    <TimelineStatus currentStep={order?.stepIndicator?.value} />

                </div>

                {/* Mobile-first Details Grid */}
                <div className="space-y-1">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-1">
                        {/* Total Price */}
                        <div className="flex items-center gap-3 p-3 rounded-lg">
                            <p className="text-xl font-bold flex items-center justify-center text-green-600">
                                $
                            </p>
                            <div>
                                <p className="text-sm text-gray-600">Total Price</p>
                                <p className="font-bold text-lg text-green-600">
                                    {
                                        (() => {
                                            const invoiceTotal = Number(order?.invoice?.invoiceData?.paymentDetails?.totalAmount);
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

                                </p>
                            </div>
                        </div>

                        {/* C&F */}
                        <div className="flex items-center gap-3 p-3  rounded-lg">
                            <Ship className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-gray-600">

                                    {[
                                        (order.invoice?.invoiceData?.paymentDetails?.inspectionIsChecked ?? order?.inspection) ? 'INSPECTION' : null,
                                        (order.invoice?.invoiceData?.paymentDetails?.incoterms
                                            ? (order.invoice?.invoiceData?.paymentDetails?.incoterms === 'C&F' ? 'C&F' : 'CIF')
                                            : (order?.insurance ? 'CIF' : 'C&F')),
                                        (order.invoice?.invoiceData?.paymentDetails?.warrantyIsChecked ?? order?.warranty) ? 'WARRANTY' : null
                                    ].filter(Boolean).join(' + ')}
                                </p>
                            </div>
                        </div>

                        {/* Port */}
                        <div className="flex items-center gap-3 p-3  rounded-lg">
                            <MapPin className="h-5 w-5 text-purple-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm text-gray-600">Destination Port</p>
                                <p className="font-semibold text-sm text-purple-600 leading-tight">
                                    {order?.country} / {order?.port}
                                </p>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-3 p-3 rounded-lg">
                            <Calendar className={`h-5 w-5 flex-shrink-0 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                            <div>
                                <p className="text-sm text-gray-600">Due Date</p>
                                <p className={`font-semibold text-sm ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                                    {order.invoice?.formattedDate}
                                    {isOverdue && <span className="ml-1"></span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="flex gap-3 pt-2 border-t">
                    <Link
                        href={`/chats/${order?.id}`}
                        className="  flex              
      items-center 
      justify-center
      bg-blue-600 hover:bg-blue-700
      text-white text-sm font-medium
      rounded-md
      px-4 py-2       
      transition-colors
      whitespace-normal
      h-10   
      text-center        "
                    >
                        Send Message
                    </Link>
                    {order.stepIndicator.value > 3 && (
                        <Button
                            onClick={openModal}
                            variant="outline"
                            className="
      border-blue-600 text-blue-600
      hover:bg-blue-50
      flex items-center justify-center
      px-4 py-2          
      whitespace-normal 
      flex-wrap          
      h-auto             
    "
                        >
                            <Info className="h-4 w-4" />
                            Progress Details
                        </Button>
                    )}
                </div>
                {showModal && (
                    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col -m-2">

                        <div className="bg-[#0000ff] text-white p-4 flex items-center">
                            <button
                                onClick={() => setShowModal(false)}
                                className="mr-2 p-1 rounded-full hover:bg-blue-700 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <h2 className="text-lg font-semibold">Order Progress Details</h2>
                        </div>

                        <div className="bg-white border-b sticky top-0 z-10">
                            <div className="overflow-x-auto">
                                <div className="flex p-2 space-x-2">
                                    <TabButton
                                        active={activeTab === "shipping"}
                                        onClick={() => setActiveTab("shipping")}
                                        icon={<Package className="h-4 w-4 mr-1" />}
                                        label="Shipping"
                                    />
                                    <TabButton
                                        active={activeTab === "documents"}
                                        onClick={() => setActiveTab("documents")}
                                        icon={<FileText className="h-4 w-4 mr-1" />}
                                        label="Documents"
                                    />
                                    <TabButton
                                        active={activeTab === "tracking"}
                                        onClick={() => setActiveTab("tracking")}
                                        icon={<MapPin className="h-4 w-4 mr-1" />}
                                        label="Tracking"
                                    />
                                    <TabButton
                                        active={activeTab === "dhl"}
                                        onClick={() => setActiveTab("dhl")}
                                        icon={<ExternalLink className="h-4 w-4 mr-1" />}
                                        label="DHL Info"
                                    />
                                    <TabButton
                                        active={activeTab === "consignee"}
                                        onClick={() => setActiveTab("consignee")}
                                        icon={<User className="h-4 w-4 mr-1" />}
                                        label="Consignee"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">

                            {activeTab === "shipping" && (
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <Package className="h-5 w-5 text-blue-600 mr-2" />
                                        <h3 className="font-semibold text-lg">Shipping Information</h3>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-4">
                                                <InfoItem label="Carrier" value={carOrder.shipping.carrier} />
                                            </div>
                                            <div className="space-y-4">
                                                <InfoItem label="ETD:" value={carOrder.shipping.etd} />
                                                <InfoItem label="Vessel Name:" value={carOrder.shipping.vesselLoading} />
                                                <InfoItem label="Voyage No:" value={carOrder.shipping.voyNoLoading} />
                                                <InfoItem label="Port of Loading:" value={carOrder.shipping.portOfLoading} />


                                            </div>
                                            <div className="space-y-4">
                                                <InfoItem label="ETA:" value={carOrder.shipping.eta} />
                                                <InfoItem label="Vessel Name:" value={carOrder.shipping.vesselDischarge} />
                                                <InfoItem label="Voyage No:" value={carOrder.shipping.voyNoDischarge} />
                                                <InfoItem label="Port of Discharge:" value={carOrder.shipping.portOfDischarge} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "documents" && (
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center">
                                        <FileText className="h-5 w-5 text-blue-600 mr-2" />
                                        <h3 className="font-semibold text-lg">Documents</h3>
                                    </div>

                                    {/* Invoice No. (render its url component directly) */}
                                    {(() => {
                                        const invoiceDoc = carOrder.documents.find(d => d.name === "Invoice No. ");
                                        if (!invoiceDoc) return null;
                                        return (
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-gray-500" />
                                                    <span className="font-medium">Invoice No.</span>
                                                </div>
                                                {/* here invoiceDoc.url is assumed to be a React node */}
                                                <div>{invoiceDoc.url}</div>
                                            </div>
                                        );
                                    })()}

                                    {/* All the other docs as download links */}
                                    <div className="space-y-3">
                                        {carOrder.documents
                                            .filter(d => d.name !== "Invoice No. ")
                                            .map((doc, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-gray-500" />
                                                        <span className="font-medium">{doc.name}</span>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <Badge
                                                            variant={doc.status === "Uploaded" ? "success" : "outline"}
                                                            className={
                                                                doc.status === "Uploaded"
                                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                                    : ""
                                                            }
                                                        >
                                                            {doc.status}
                                                        </Badge>

                                                        {doc.url && doc.status === "Uploaded" && (
                                                            <a
                                                                href={doc.url}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center space-x-1 hover:text-blue-700"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                                <span className="text-sm">Download</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}




                            {activeTab === "tracking" && (
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                                        <h3 className="font-semibold text-lg">Tracking Status</h3>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <div className="relative">
                                            {/* Vertical line connecting all status items */}
                                            <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-gray-300 h-full"></div>

                                            {carOrder.statuses.map((status, idx) => (
                                                <div key={idx} className="flex items-start pl-10 relative mb-6">
                                                    {/* Icon circle */}
                                                    <div className="absolute left-2 top-0 w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center z-10">
                                                        {status.status === "completed" ? (
                                                            <Check className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Clock className="h-4 w-4 text-gray-500" />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 ml-1">
                                                        {/* Stage badge + Taker */}
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div
                                                                className={`px-2 py-1 rounded-[20px] ${status.status === "completed" ? "bg-[#0000ff]" : "bg-gray-100"
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`text-xs font-semibold ${status.status === "completed" ? "text-white" : "text-black"
                                                                        }`}
                                                                >
                                                                    {status.stage}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-gray-400">{status.actionTaker}</span>
                                                        </div>

                                                        {/* Action description */}
                                                        <p className="text-sm text-black mb-1">{status.action}</p>

                                                        {/* Date, time and location */}
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{status.date}</span>
                                                            <Clock className="h-3 w-3 ml-2" />
                                                            <span>{status.time}</span>
                                                            <MapPin className="h-3 w-3 ml-2" />
                                                            <span>{status.location}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "dhl" && (
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <ExternalLink className="h-5 w-5 text-blue-600 mr-2" />
                                        <h3 className="font-semibold text-lg">DHL Information</h3>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <InfoItem label="Name" value={carOrder.dhl.name} />
                                                <InfoItem label="Address" value={carOrder.dhl.address} />
                                                <InfoItem label="City" value={carOrder.dhl.city} />
                                                <InfoItem label="Country" value={carOrder.dhl.country} />
                                                <InfoItem label="Tracking Number" value={carOrder.dhl.trackingNumber} />
                                            </div>
                                        </div>
                                    </div>

                                    <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Track on DHL Website
                                    </Button>
                                </div>
                            )}

                            {/* Consignee Information */}
                            {activeTab === "consignee" && (
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <User className="h-5 w-5 text-blue-600 mr-2" />
                                        <h3 className="font-semibold text-lg">Consignee / Notify Party Information</h3>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-lg">Consignee Information</h4>
                                                <InfoItem label="Name" value={carOrder.consignee.name} />
                                                <InfoItem label="Address" value={carOrder.consignee.address} />
                                                <InfoItem label="City" value={carOrder.consignee.city} />
                                                <InfoItem label="Country" value={carOrder.consignee.country} />
                                                <InfoItem label="Tel Number" value={carOrder.consignee.Tel} />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-lg">Notify Party</h4>
                                                <InfoItem label="Name" value={carOrder.notify.name} />
                                                <InfoItem label="Address" value={carOrder.notify.address} />
                                                <InfoItem label="City" value={carOrder.notify.city} />
                                                <InfoItem label="Country" value={carOrder.notify.country} />
                                                <InfoItem label="Tel Number" value={carOrder.notify.Tel} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t p-4">
                            <Button onClick={() => setShowModal(false)} className="w-full" variant="outline">
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function formatDueDate(due) {
    if (!due) return "No due date available";
    try {
        if (due?.toDate) {
            const d = due.toDate();
            return new Intl.DateTimeFormat("en-US", { month: "long", day: "2-digit", year: "numeric" }).format(d)
        }
        if (typeof due === "string") {
            const s = due.replace(" at ", " ");
            const d = new Date(s);

            if (!Number.isNaN(d.getTime())) {
                return new Intl.DateTimeFormat("en-US", { month: "long", day: "2-digit", year: "numeric" }).format(due)
            }
        }
    } catch { }
    return "No due date available"
}

async function fetchInvoice(invoiceNumber) {
    if (!invoiceNumber) return null;
    if (invoiceCache.has(invoiceNumber)) return invoiceCache.get(invoiceNumber);

    let result = { invoiceData: null, formattedDate: "No due date available" };

    try {
        const invSnap = await getDoc(doc(firestore, "IssuedInvoice", invoiceNumber));
        if (invSnap.exists()) {
            const invoiceData = invSnap.data();
            const formattDate = formatDueDate(invoiceData?.bankInformations?.dueDate);
            result = { invoiceData, formattedDate };
        }
    } catch { }

    invoiceCache.set(invoiceNumber, result);
    return result;
}

const norm = (c) => c ? ({
    ...c,
    lastMessageDateStr: String(c.lastMessageDate ?? c.lastMessageDateStr ?? ""),
}) : c;

const sortChats = (a, b) => {
    if (!a && !b) return 0
    if (!a) return 1;
    if (!b) return -1;

    const aS = String(a.lastMessageDateStr ?? a.lastMessageDate ?? '');
    const bS = String(b.lastMessageDateStr ?? b.lastMessageDate ?? '');

    const cmp = bS.localeCompare(aS);
    if (cmp !== 0) return cmp;
    return String(b.id ?? '').localeCompare(String(a.id ?? ''));
}




async function hydrateMissingInvoice(items) {
    const enriched = await Promise.all(
        items.map(async (c) => {
            if (c.invoice || !c.invoiceNumber) return c;
            const invoice = await fetchInvoice(c.invoiceNumber);
            return { ...c, invoice }
        })
    );
    return enriched;
};

async function loadMoreData(userEmail, callback) {
    if (!userEmail || !lastCursor) {
        callback([], true);
        return;
    }

    try {
        const nextQuery = query(
            collection(firestore, 'chats'),
            where('participants.customer', '==', userEmail),
            orderBy("lastMessageDate", "desc"),
            orderBy(documentId(), "desc"),
            startAfter(lastCursor.lmd || "", lastCursor.id),
            qlimit(PAGE_SIZE)
        );
        const snap = await getDocs(nextQuery);
        let moreChats = snap.docs.map((d) => norm({ id: d.id, ...d.data() }));

        moreChats = await hydrateMissingInvoice(moreChats);

        if (snap.docs.length > 0) {
            const last = snap.docs[snap.docs.length - 1];
            lastCursor = { lmd: String(last.get("lastMessageDate") || ''), id: last.id }
        }
        const noMore = snap.docs.length < PAGE_SIZE;
        callback(moreChats, noMore)
    } catch (err) {
        console.error("Error loading more chats:", err);
        callback([], true)

    }
}

export default function Component({ prefetchedData = [], currency, userEmail }) {
    const [chatList, setChatList] = useState(() =>
        prefetchedData.map(norm).filter(Boolean)
    );
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (prefetchedData.length > 0) {
            const oldest = prefetchedData[prefetchedData.length - 1];
            lastCursor = {
                lmd: String(oldest.lastMessageDate ?? oldest.lastMessageDateStr ?? ""),
                id: oldest.id
            }
        } else {
            lastCursor = null
        }
    }, [prefetchedData])
    useEffect(() => {
        prefetchedData.forEach((c) => {
            if (c.invoiceNumber && c.invoice) {
                invoiceCache.set(c.invoiceNumber, c.invoice)
            }
        })
    }, [prefetchedData])

    const liveQuery = useMemo(() => {
        if (!userEmail) return null;
        return query(
            collection(firestore, 'chats'),
            where('participants.customer', '==', userEmail),
            orderBy('lastMessageDate', "desc"),
            orderBy(documentId(), "desc"),
            qlimit(LIVE_LIMIT)
        );
    }, [userEmail])

    useEffect(() => {
        if (!liveQuery) return;

        const unsub = onSnapshot(liveQuery, async (snap) => {
            const liveRaw = snap.docs.map((d) => norm({ id: d.id, ...d.data() }));

            //carry over invoice from previous state to avoid flicker
            setChatList((prev) => {
                const live = snap.docs.map((d) => norm({ id: d.id, ...d.data() })).filter(Boolean);

                // carry over existing invoice (optional, avoids flicker)
                const prevMap = new Map(prev.map((x) => [x.id, x]));
                const liveCarry = live.map((c) => (c.invoice || !prevMap.get(c.id)?.invoice)
                    ? c
                    : { ...c, invoice: prevMap.get(c.id).invoice }
                );

                const liveIds = new Set(liveCarry.map((x) => x.id));
                const older = prev.filter((x) => x && !liveIds.has(x.id));

                const merged = [...liveCarry, ...older].filter(Boolean).sort(sortChats);

                const tail = merged[merged.length - 1];
                if (tail) lastCursor = { lmd: tail.lastMessageDateStr, id: tail.id };

                return merged;
            });

            const live = await hydrateMissingInvoice(liveRaw);
            setChatList((prev) => {
                const map = new Map(prev.map((x) => [x.id, x]));
                live.forEach((c) => map.set(c.id, { ...map.get(c.id), ...c }));
                const merged = Array.from(map.values()).sort(sortChats);
                const tail = merged[merged.length - 1];
                if (tail) lastCursor = { lmd: tail.lastMessageDateStr, id: tail.id };
                return merged;
            });
        });

        return () => unsub();
    }, [liveQuery])
    //added reusable loadMore callback
    const loadMore = useCallback(() => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);

        loadMoreData(userEmail, (moreChats, noMore) => {
            setChatList((prev) => {
                const prevIds = new Set(prev.map((c) => c?.id).filter(Boolean));
                const merged = [
                    ...prev.filter(Boolean),
                    ...moreChats.map(norm).filter((c) => c && !prevIds.has(c.id)),
                ].sort(sortChats);

                const tail = merged[merged.length - 1];
                if (tail) lastCursor = { lmd: tail.lastMessageDateStr, id: tail.id };

                return merged;
            });
            setHasMore(!noMore);
            setLoadingMore(false)
        });
    }, [userEmail, hasMore, loadingMore])


    const observer = useRef(null);
    const observerRef = useCallback(
        (node) => {
            if (observer.current) observer.current.disconnect();
            if (!node || !hasMore || loadingMore) return;

            observer.current = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && hasMore && !loadingMore) {
                        loadMore();
                    }
                },
                { threshold: 0.1, rootMargin: '100px' }
            );
            observer.current.observe(node);
        },
        [loadMore, hasMore, loadingMore]
    )


    return (
        <div className="container mx-auto p-4 pb-24 min-h-screen space-y-6">
            {/* <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">Vehicle Export Orders</h1>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base">Track and manage your vehicle export orders</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Badge variant="outline" className="bg-blue-50 text-sm px-3 py-1">
                        {mockOrders.filter(o => o.status === 'active').length} Active
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-sm px-3 py-1">
                        {mockOrders.filter(o => o.status === 'completed').length} Completed
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-sm px-3 py-1">
                        {mockOrders.filter(o => o.status === 'delayed').length} Delayed
                    </Badge>
                </div>
            </div> */}

            <div className="space-y-4 sm:space-y-6">
                {chatList.map((order, index) => {
                    const isLast = index === chatList.length - 1;

                    return (
                        <OrderCard
                            key={order.id}
                            order={order}
                            currency={currency}
                            userEmail={userEmail}
                            observerRef={observerRef}
                            isLast={isLast}
                        />
                    )
                })}
            </div>
            {hasMore && (
                <div ref={observerRef} className="mt-6 flex items-center justify-center">
                    <button
                        onClick={loadMore}            // manual fallback
                        disabled={loadingMore}
                        className="px-4 py-2 rounded-xl border border-gray-300 shadow-sm disabled:opacity-60"
                    >
                        {loadingMore ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
        </div>
    )
}
