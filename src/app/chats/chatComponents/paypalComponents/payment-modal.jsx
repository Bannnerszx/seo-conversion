"use client"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
// 1. Remove static import

// 2. Import Async Getter
import { getFirebaseFunctions } from "../../../../../firebase/clientApp"

// Step Components
import { ReviewStep } from "./review-step"
import {SignatureStep} from "./signature-step"
import { EmailStep } from "./email-step"
// Steps Enum
const STEPS = {
  REVIEW: "review",
  EMAIL: "email",
  SIGNATURE: "signature",
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
}

export default function PaymentModal({ timestamp, isOpen, onClose, carData, invoiceData, invoiceNumber, chatId }) {
  const [step, setStep] = useState(STEPS.REVIEW)
  const [payerEmail, setPayerEmail] = useState("")
  const [signatureData, setSignatureData] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false) // For internal async ops

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(STEPS.REVIEW)
      setPayerEmail("")
      setSignatureData(null)
      setErrorMessage("")
      setIsProcessing(false)
    }
  }, [isOpen])

  // --- Handlers for Transitions ---
  const handleReviewConfirm = () => setStep(STEPS.EMAIL)
  
  const handleEmailSubmit = (email) => {
    setPayerEmail(email)
    setStep(STEPS.SIGNATURE)
  }

  const handleSignatureSubmit = (data) => {
    setSignatureData(data)
    // After signing, we show the PayPal buttons (PROCESSING / PAYMENT step)
    setStep(STEPS.PROCESSING)
  }

  // --- PayPal Create Order ---
  // Calls your server endpoint to create the PayPal Order ID
  const createOrder = async () => {
    try {
      // ---------------------------------------------------------
      // 1. Calculate Currency Conversion
      // ---------------------------------------------------------
      const currencyData = invoiceData?.currency || {};
      const selectedCurrency = invoiceData?.selectedCurrencyExchange || "USD";
      // invoiceData.paymentDetails.totalAmount is always in USD
      const totalUSD = Number(invoiceData?.paymentDetails?.totalAmount || 0);

      let rate = 1;
      let targetCurrency = "USD";

      // If a specific currency is selected and valid, determine the rate
      if (selectedCurrency && selectedCurrency !== "None" && selectedCurrency !== "USD") {
          targetCurrency = selectedCurrency;
          switch (targetCurrency) {
              case "JPY": rate = Number(currencyData.usdToJpy || 1); break;
              case "EUR": rate = Number(currencyData.usdToEur || 1); break;
              case "AUD": rate = Number(currencyData.usdToAud || 1); break;
              case "GBP": rate = Number(currencyData.usdToGbp || 1); break;
              case "CAD": rate = Number(currencyData.usdToCad || 1); break;
              case "ZAR": rate = Number(currencyData.usdToZar || 1); break;
              default: rate = 1; targetCurrency = "USD"; break;
          }
      }

      // Convert and Round to nearest integer (No decimals)
      const finalAmount = Math.round(totalUSD * rate).toString();

      // Construct Items for PayPal
      const items = [{
          name: `${carData?.carName || "Vehicle"} (${carData?.stockID || "N/A"})`,
          description: `Invoice No: ${invoiceNumber}`,
          quantity: "1",
          unit_amount: {
              currency_code: targetCurrency,
              value: finalAmount
          }
      }];
      // ---------------------------------------------------------

      const res = await fetch("/api/paypal/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          invoiceNumber,
          userEmail: payerEmail, // or from context
          carData,
          signatureData, // Pass signature if needed for record keeping
          
          // Pass the calculated currency and items
          currency: targetCurrency,
          items: items,
        }),
      })

      const data = await res.json()
      
      if (!res.ok || !data.orderID) {
        throw new Error(data.error || "Failed to create order")
      }
      return data.orderID
    } catch (err) {
      console.error("Create Order Error:", err)
      setErrorMessage(err.message)
      setStep(STEPS.ERROR)
      throw err // Stop PayPal flow
    }
  }

  // --- PayPal On Approve ---
  // Captures the order
  const onApprove = async (data, actions) => {
    setIsProcessing(true)
    try {
        // Capture is often handled automatically by actions.order.capture() 
        // or by your server if using "intent=capture".
        // Let's assume client-side capture for simplicity, or call your verify API.
        const details = await actions.order.capture()
        
        // 3. Load Functions Dynamically
        const [functionsInstance, { httpsCallable }] = await Promise.all([
            getFirebaseFunctions(),
            import("firebase/functions")
        ]);
        const verifyPayment = httpsCallable(functionsInstance, 'verifyPayment');

        // Optional: Call your server to finalize/verify
        const verifyRes = await verifyPayment({
            orderID: data.orderID,
            chatId,
            details
        })

        if (verifyRes.data.success) {
            setStep(STEPS.SUCCESS)
        } else {
            throw new Error("Payment verification failed on server")
        }

    } catch (err) {
        console.error("Capture Error:", err)
        setErrorMessage("Payment captured but server verification failed. Please contact support.")
        setStep(STEPS.ERROR)
    } finally {
        setIsProcessing(false)
    }
  }

  const onError = (err) => {
    console.error("PayPal Error:", err)
    setErrorMessage("An error occurred with PayPal. Please try again.")
    setStep(STEPS.ERROR)
  }

  // --- Render Step Content ---
  const renderContent = () => {
    switch (step) {
      case STEPS.REVIEW:
        return (
          <ReviewStep 
            timestamp={timestamp}
            carData={carData}
            invoiceData={invoiceData}
            onConfirm={handleReviewConfirm}
            onCancel={onClose}
          />
        )
      case STEPS.EMAIL:
        return (
          <EmailStep 
            initialEmail={payerEmail}
            onSubmit={handleEmailSubmit}
            onBack={() => setStep(STEPS.REVIEW)}
          />
        )
      case STEPS.SIGNATURE:
        return (
          <SignatureStep 
            onSign={handleSignatureSubmit}
            onBack={() => setStep(STEPS.EMAIL)}
          />
        )
      case STEPS.PROCESSING:
        // This step shows the PayPal Buttons
        return (
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Complete Payment</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Review your order details one last time and proceed with PayPal.
              </p>
            </div>

            <div className="w-full max-w-xs min-h-[150px]">
               {/* PayPalScriptProvider is likely at root, but if needed here:
                 Ensure client-id matches your env.
               */}
               <PayPalButtons 
                 style={{ layout: "vertical", shape: "rect" }}
                 createOrder={createOrder}
                 onApprove={onApprove}
                 onError={onError}
                 disabled={isProcessing}
               />
            </div>
            
            {isProcessing && (
               <div className="flex items-center gap-2 text-blue-600">
                 <Loader2 className="h-4 w-4 animate-spin" />
                 <span className="text-sm font-medium">Processing transaction...</span>
               </div>
            )}
            
            <button 
                onClick={() => setStep(STEPS.SIGNATURE)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
                Back
            </button>
          </div>
        )
      case STEPS.SUCCESS:
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
            <h3 className="text-2xl font-bold text-gray-900">Payment Successful!</h3>
            <p className="text-gray-500 max-w-xs">
              Thank you! Your payment has been confirmed. A receipt has been sent to your email.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        )
      case STEPS.ERROR:
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 animate-in zoom-in duration-300" />
            <h3 className="text-2xl font-bold text-gray-900">Payment Failed</h3>
            <p className="text-red-600 max-w-xs">
              {errorMessage || "Something went wrong. Please try again or contact support."}
            </p>
            <div className="flex gap-3 mt-4">
                <button
                onClick={() => setStep(STEPS.PROCESSING)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                Try Again
                </button>
                <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                Close
                </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header - Optional, can be customized per step if needed */}
        <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">
                {step === STEPS.REVIEW && "Review Details"}
                {step === STEPS.EMAIL && "Confirm Email"}
                {step === STEPS.SIGNATURE && "Sign & Agree"}
                {step === STEPS.PROCESSING && "Payment"}
                {step === STEPS.SUCCESS && "Confirmed"}
                {step === STEPS.ERROR && "Error"}
            </DialogTitle>
            {/* Steps Indicator (Optional) */}
            <div className="flex gap-1">
                {[STEPS.REVIEW, STEPS.EMAIL, STEPS.SIGNATURE, STEPS.PROCESSING].includes(step) && (
                    <div className="text-xs text-gray-400 font-mono">
                        {step === STEPS.REVIEW && "1/4"}
                        {step === STEPS.EMAIL && "2/4"}
                        {step === STEPS.SIGNATURE && "3/4"}
                        {step === STEPS.PROCESSING && "4/4"}
                    </div>
                )}
            </div>
        </div>

        {/* Body */}
        <div className="p-6">
            {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}