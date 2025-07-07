"use client"

import { useState, useEffect } from "react"
import { XCircle, Clock, Receipt, ShoppingCart, Car } from "lucide-react"
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
    vehicleStatus,
    onBrowseOtherVehicles,
    invoiceData,
    selectedCurrency
  }) {
    const [isVisible, setIsVisible] = useState(false)
    const [isClosed, setIsClosed] = useState(false)
    const [isOrderMounted, setIsOrderMounted] = useState(false)
  
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    }, [])
  
    const stepValue = selectedChatData?.stepIndicator?.value
  
    // detect cancelled flag
    const isCancelled =
      selectedChatData && "isCancelled" in selectedChatData
        ? selectedChatData.isCancelled
        : false
  
    // if banner manually closed or no step AND not cancelled, hide entirely
    if (isClosed || (!stepValue && !isCancelled)) return null
  
    // for the “reserved/sold” logic
    const { stockStatus, reservedTo } =
      vehicleStatus[selectedChatData.carData.stockID] || {}
    const isReservedOrSold =
      (stockStatus === "Reserved" || stockStatus === "Sold") &&
      reservedTo !== userEmail
  
    // pick icon
    const getIcon = () => {
      if (isCancelled) {
        return <XCircle className="h-[25px] max-w-[25px] w-full text-red-500" />
      } else if (isReservedOrSold) {
        return <Clock className="h-[25px] max-w-[25px] w-full text-amber-500" />
      } else if (stepValue >= 3 && !isOrderMounted) {
        return <Receipt className="h-[25px] max-w-[25px] w-full text-green-500" />
      } else if (stepValue >= 2) {
        return <ShoppingCart className="h-[25px] max-w-[25px] w-full text-red-500" />
      }
    }
  
    // pick message
    const getMessage = () => {
      if (isCancelled) {
        return "This transaction has been cancelled."
      } else if (isReservedOrSold) {
        return stockStatus === "Reserved"
          ? "This vehicle has been reserved by another customer."
          : "This vehicle has been sold to another customer."
      } else if (stepValue >= 3 && !isOrderMounted) {
        return "Please upload the payment slip to continue"
      } else if (stepValue >= 2) {
        return "This unit is now ready to be ordered in your name."
      }
    }
  
    // buttons: none for cancelled
    const renderButtons = () => {
      if (isCancelled) {
        return null
      } else if (isReservedOrSold) {
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
      } else if (stepValue >= 3 && !isOrderMounted) {
        return (
          <PaymentSlip
            selectedCurrency={selectedCurrency}
            invoiceData={invoiceData}
            chatId={chatId}
            selectedChatData={selectedChatData}
            userEmail={userEmail}
          />
        )
      } else if (stepValue >= 2) {
        return (
          <OrderButton
            accountData={accountData}
            chatId={chatId}
            selectedChatData={selectedChatData}
            countryList={countryList}
            userEmail={userEmail}
            isOrderMounted={isOrderMounted}
            setIsOrderMounted={setIsOrderMounted}
          />
        )
      }
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
        </div>
      </div>
    )
  }