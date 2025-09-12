'use client'
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Image from "next/image"
import { FileText, MapPin, User, Calendar, Clock, Package, X, ExternalLink, MessageSquare, Info, Check, Download } from "lucide-react"
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { fetchBookingData, fetchInvoiceData } from "@/app/actions/actions";
import PreviewInvoice from "@/app/chats/chatComponents/previewInvoice";


async function fetchChatData(chatId) {
  const res = await fetch(`/api/get-chat-data?chatId=${chatId}`)
  if (!res.ok) throw new Error(`Chat fetch failed: ${res.status}`)
  return res.json()
}


export default function OrderCard({ order, currency, userEmail }) {
  const fobDollar = parseFloat(currency.jpyToUsd) * parseFloat(order.carData?.fobPrice) || 0;
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("shipping");
  const [invoiceData, setInvoiceData] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [hasFetchedInvoice, setHasFetchedInvoice] = useState(false);
  const [hasFetchedBooking, setHasFetchedBooking] = useState(false);
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
  console.log(images, 'log')
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
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side – Vehicle image */}
          <div className="md:w-2/5 lg:w-1/3">
            <div className="aspect-[4/3] overflow-hidden rounded-md">
              <Image
                src={src}
                alt={`${order.carData.regYear} ${order.carData.make} ${order.carData.model}` || "Product Image"}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Right side – Vehicle details */}
          <div className="md:w-3/5 lg:w-2/3 flex flex-col">
            {/* Vehicle title and features */}
            <div>
              <h2 className="text-xl font-bold mb-1">
                {order.carData.carName}
              </h2>
              <p className="text-gray-600 text-sm mb-4">{order.carData.carDescription}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-blue-600 text-2xl font-bold">
                ${Math.ceil(fobDollar).toLocaleString()}
              </p>
            </div>

            {/* Vehicle specs */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-gray-500 text-sm">Year</p>
                <p className="font-medium">{order.carData.regYear}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Mileage</p>
                <p className="font-medium">{order.carData.mileage}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Exterior Color</p>
                <p className="font-medium">{order.carData.exteriorColor}</p>
              </div>
            </div>


            <div className={`mt-auto grid ${order.stepIndicator.value > 3 ? "grid-cols-2" : "grid-cols-1"} max-[768px]:grid-cols-1 gap-3 mx-auto w-full max-w-full`}>
              <Link
                href={`/chats/${order.id}`}
                className="
      flex              
      items-center 
      justify-center
      bg-blue-600 hover:bg-blue-700
      text-white text-sm font-medium
      rounded-md
      px-4 py-2       
      transition-colors
      whitespace-normal
      h-10   
      text-center        
    "
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
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">

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
    </div>
  );
};

export function TabButton({ active, onClick, icon, label }) {
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


export function InfoItem({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
