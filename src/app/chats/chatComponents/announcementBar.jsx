"use client"

import { useState, useEffect } from "react"
import { XCircle, Clock, Receipt, ShoppingCart, Car, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import OrderButton from "./confirmOrderModal"
import PaymentSlip from "./paymentSlip"

export function AnnouncementBar({
  className,
  chatId,
  selectedChatData,
  countryList,
  userEmail,
  accountData,
  vehicleStatus ,
  onBrowseOtherVehicles,
  invoiceData,
  selectedCurrency
}) {
  const [ipInfo, setIpInfo] = useState(null)
  const [tokyoTime, setTokyoTime] = useState(null)
  const [preloadError, setPreloadError] = useState(null)
  const [isHidden, setIsHidden] = useState(false)
  const handlePreviewInvoiceModal = () => {
    console.log('hello')
  }
  // --- preload helpers (with retry) ---
  const refetchPreloads = async () => {
    setPreloadError(null)
    try {
      const [ip, time] = await Promise.all([
        fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo").then(r => r.json()),
        fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time").then(r => r.json()),
      ])
      setIpInfo(ip)
      setTokyoTime(time)
    } catch (err) {
      console.error("Preload fetch failed", err)
      setPreloadError(err?.message || "Failed to load prerequisites")
    }
  }

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo").then(r => r.json()),
      fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time").then(r => r.json()),
    ])
      .then(([ip, time]) => {
        if (!mounted) return
        setIpInfo(ip)
        setTokyoTime(time)
      })
      .catch((err) => {
        if (!mounted) return
        console.error("Preload fetch failed", err)
        setPreloadError(err?.message || "Failed to load prerequisites")
      })
    return () => { mounted = false }
  }, [])

  const [isVisible, setIsVisible] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [isOrderMounted, setIsOrderMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // --- derived flags ---
  const stepValue = selectedChatData?.stepIndicator?.value ?? 0

  const isCancelled =
    selectedChatData && "isCancelled" in selectedChatData
      ? !!selectedChatData.isCancelled
      : false

  // if banner manually closed or no step AND not cancelled, hide entirely
  if (isClosed || (stepValue === 0 && !isCancelled)) return null

  const stockID = selectedChatData?.carData?.stockID
  const { stockStatus, reservedTo } =
    stockID
      ? (vehicleStatus.find(v => String(v.id) === String(stockID)) || {})
      : {};

  console.log(stockStatus, 'status inside')
  const isReservedOrSold =
    (stockStatus === "Reserved" || stockStatus === "Sold") &&
    reservedTo !== userEmail

  // readiness for showing the OrderButton
  const isOrderPrereqsReady =
    !!ipInfo &&
    !!tokyoTime &&
    !!accountData &&
    !!selectedChatData &&
    Array.isArray(countryList) &&
    countryList.length > 0

  // ✅ Payment phase ONLY when step >= 3
  const shouldShowPayment = stepValue >= 3

  // when entering payment phase, ensure the order-mounted state doesn't keep us stuck
  useEffect(() => {
    if (shouldShowPayment && isOrderMounted) {
      setIsOrderMounted(false)
    }
  }, [shouldShowPayment, isOrderMounted])

  // --- icon + message ---
  const getIcon = () => {
    if (isCancelled) return <XCircle className="h-[25px] max-w-[25px] w-full text-red-500" />
    if (isReservedOrSold) return <Clock className="h-[25px] max-w-[25px] w-full text-amber-500" />
    if (shouldShowPayment) return <Receipt className="h-[25px] max-w-[25px] w-full text-green-500" />
    if (stepValue >= 2) return <ShoppingCart className="h-[25px] max-w-[25px] w-full text-red-500" />
    return null
  }

  const getMessage = () => {
    if (isCancelled) {
      return "This transaction has been cancelled."
    } else if (isReservedOrSold) {
      return stockStatus === "Reserved"
        ? "This vehicle has been reserved by another customer."
        : "This vehicle has been sold to another customer."
    } else if (shouldShowPayment) {
      return "Please upload the payment slip to continue"
    } else if (stepValue >= 2) {
      return isOrderPrereqsReady
        ? "This unit is now ready to be ordered in your name."
        : "Preparing order..."
    }
    return ""
  }

  // --- buttons ---
  const renderButtons = () => {
    if (isCancelled) return null

    if (isReservedOrSold) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-amber-600 border-amber-600 hover:bg-amber-50"
          onClick={onBrowseOtherVehicles}
        >
          <Car className="mr-2 h-4 w-4" />
          Browse Similar Vehicles
        </Button>
      )
    }

    if (shouldShowPayment) {
      return (
        <PaymentSlip
          selectedCurrency={selectedCurrency}
          invoiceData={invoiceData}
          chatId={chatId}
          selectedChatData={selectedChatData}
          userEmail={userEmail}
        />
      )
    }

    if (stepValue >= 2) {
      if (!isOrderPrereqsReady) {
        return (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing...
            </Button>
            {preloadError && (
              <Button
                variant="outline"
                size="sm"
                onClick={refetchPreloads}
                className="border-amber-600 text-amber-700"
              >
                Retry
              </Button>
            )}
          </div>
        )
      }

      return (
        <OrderButton
          ipInfo={ipInfo}
          tokyoTime={tokyoTime}
          accountData={accountData}
          chatId={chatId}
          selectedChatData={selectedChatData}
          countryList={countryList}
          userEmail={userEmail}
          isOrderMounted={isOrderMounted}
          setIsOrderMounted={setIsOrderMounted}
          invoiceData={invoiceData}
          setIsHidden={setIsHidden}
          handlePreviewInvoiceModal={handlePreviewInvoiceModal}
        />
      )
    }

    return null
  }

  return (
    <div
      className={cn(
        "transition-all duration-250 ease-in-out top-[200px] w-full rounded-xl bg-background px-4 py-3 shadow-[0_2px_5px_rgba(0,0,0,0.2)] z-10",
        isVisible ? "translate-y-0" : "-translate-y-4 opacity-0",
        isCancelled
          ? "border-l-4 border-red-500"
          : isReservedOrSold
            ? "border-l-4 border-amber-500"
            : "",
        className
      )}
    >
      <div className="justify-between">
        <div className="flex flex-1 items-center justify-center gap-3 text-md">
          {getIcon()}
          <p className="w-full truncate">{getMessage()}</p>

          {/* only show buttons when not reserved/sold or cancelled */}
          {!isReservedOrSold && !isCancelled && (
            <div className="ml-4 flex-shrink-0">{renderButtons()}</div>
          )}
        </div>

        {preloadError && stepValue >= 2 && !isOrderPrereqsReady && (
          <p className="mt-2 text-xs text-amber-700">
            Couldn’t load prerequisites: {preloadError}
          </p>
        )}
      </div>
    </div>
  )
}
