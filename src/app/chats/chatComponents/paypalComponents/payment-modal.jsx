"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { EmailStep } from "./email-step"
import { SignatureStep } from "./signature-step"
import { ReviewStep } from "./review-step"
import { getFirebaseFunctions } from "../../../../../firebase/clientApp"


export default function PaymentModal({ timestamp, invoiceNumber, carData, chatId, invoiceData, isOpen, onClose }) {
  console.log(timestamp, 'timestamp inside payment modal')

  const [currentStep, setCurrentStep] = React.useState(1)
  const [paymentData, setPaymentData] = React.useState({
    email: "",
    signature: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleEmailComplete = (email) => {
    setPaymentData((prev) => ({ ...prev, email }))
    setCurrentStep(2)
  }

  const handleSignatureComplete = (signature) => {
    setPaymentData((prev) => ({ ...prev, signature }))
    setCurrentStep(3)
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const sanitizeForDocId = (s) => String(s).replaceAll("/", "-").replaceAll("\\\\", "-").trim();
  const pad6 = (n) => String(Number(n)).padStart(6, "0");

  function makeReserveKey({ chatId, invNum, year }) {
    return sanitizeForDocId(`reserve:${chatId}:${year}:${pad6(invNum)}`);
  }

  function makeSignatureKey({ chatId, invNum, year, email }) {
    return sanitizeForDocId(`signature:${chatId}:${year}:${pad6(invNum)}:${(email || "").toLowerCase().trim()}`);
  }
  const norm2 = (n) => (Number(n || 0)).toFixed(2);

  const chassis = carData?.chassisNumber || "-";
  const model = carData?.carName || "-";
  const incot = invoiceData?.paymentDetails?.incoterms || "-";
  const port = invoiceData?.discharge?.port || "Port of Dar es Salaam only";
  const mainItemDescription = [
    `Invoice No. RMJ-${invoiceNumber}\\n\\n${chassis}\\n\\n${model}\\n\\n${incot}\\n\\n${port}\\n\\nBuyer reviewed and agreed to conditions (refund/FX policy, no address change)`
  ].join("\\n\\n");

  function formatTokyoLocal(ymdHmsMsStr) {
    if (!ymdHmsMsStr) return '';
    // Match: 2025/10/07 [anything/at] 14:23:45.678
    const m = ymdHmsMsStr.match(
      /(\d{4}\/\d{2}\/\d{2}).*?(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?/
    );
    if (!m) return ymdHmsMsStr; // fallback if unexpected format

    const [, date, hh, mm, ss, msRaw = ''] = m;
    const ms = msRaw ? msRaw.padStart(3, '0').slice(0, 3) : '000';
    return `${date} at ${hh}:${mm}:${ss}.${ms}`;
  }

  const handleSubmit = async ({ consent }) => {
    try {
      setIsSubmitting(true);

      // Dynamically load firebase functions
      const [functionsInstance, { httpsCallable }] = await Promise.all([
        getFirebaseFunctions(),
        import("firebase/functions")
      ]);

      const reserveOrderIdFromInvoice = httpsCallable(functionsInstance, "reserveOrderIdFromInvoice");
      const createSignatureAndUpload = httpsCallable(functionsInstance, "createSignatureAndUpload");

      // ---------------------------------------------------------
      // 1. Fetch Fresh Tokyo Time for the Timestamp
      // ---------------------------------------------------------
      let currentTimestamp = new Date().toISOString(); // fallback
      try {
        const fetchJson = (url) => fetch(url).then(r => {
          if (!r.ok) throw new Error('Network response was not ok');
          return r.json();
        });

        // Fetch time from your API
        const tokyoTimeData = await fetchJson("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time");

        // Format using the helper provided
        if (tokyoTimeData && tokyoTimeData.datetime) {
          currentTimestamp = formatTokyoLocal(tokyoTimeData.datetime);
        }
      } catch (error) {
        console.warn("Failed to fetch fresh Tokyo time, using local fallback:", error);
      }
      // ---------------------------------------------------------

      // ---------------------------------------------------------
      // 2. Calculate Currency Conversion
      // ---------------------------------------------------------
      const currencyData = invoiceData?.currency || {};
      const selectedCurrency = invoiceData?.selectedCurrencyExchange || "USD";
      // invoiceData.paymentDetails.totalAmount is always in USD per your note
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
      const finalAmount = Math.round(totalUSD * rate).toString();
      // ---------------------------------------------------------

      const clientYear = new Date().getFullYear();
      const invNum = Number(invoiceNumber);
      const reserveIdemKey = makeReserveKey({ chatId, invNum, year: clientYear });
      const signatureIdemKey = makeSignatureKey({ chatId, invNum, year: clientYear, email: paymentData.email });

      // 2) Reserve order on chat (idempotent)
      await reserveOrderIdFromInvoice({
        chatId,
        merchantInvoiceNumber: invNum,
        clientYear,
        idempotencyKey: reserveIdemKey,
      });

      // 3) Create signature (idempotent)
      const sigRes = await createSignatureAndUpload({
        chatId,
        merchantInvoiceNumber: invNum,
        signerEmail: paymentData.email,
        consent,
        snapshot: {
          currency: targetCurrency, // Use target currency
          total: Number(finalAmount), // Use converted total
          incoterms: invoiceData?.paymentDetails?.incoterms,
          deliveryScope: port,
          vin: carData?.chassisNumber || null,
          model: carData?.carName || null,
          stockId: carData?.stockID || null,
          consigneeEmail: invoiceData?.consignee?.email
        },
        signatureDataUrl: paymentData.signature || undefined,
        clientYear,
        idempotencyKey: signatureIdemKey,
      });

      const { customId, orderId } = sigRes.data || {};

      const items = [
        {
          name: String(`${carData?.carName} RMJ-${invoiceNumber}` || "Vehicle"),
          quantity: "1",
          unit_amount: { value: finalAmount }, // Converted Amount
          description: mainItemDescription,
          unit_of_measure: "QUANTITY",
          reference: orderId,
        },
        {
          name: "Delivery",
          quantity: "1",
          unit_amount: { value: norm2(0) },
          description: port,
          unit_of_measure: "QUANTITY",
        }
      ];

      const reference = orderId || `ORD-${clientYear}-${String(invNum).padStart(6, "0")}`;

      // 4) Create/send PayPal invoice
      const res = await fetch("/api/paypal/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: targetCurrency, // Converted Currency Code
          payer: { email_address: paymentData.email },
          items,
          note: invoiceData?.paypalNote,
          reference,
          dueDate: invoiceData?.dueDate,
          allowPartial: invoiceData?.allowPartial ?? false,
          minPartialValue: invoiceData?.minPartialValue,
          customId,                                         // signatureId
          invoiceNumber: String(invNum).padStart(6, "0"),
          forceNew: true,                                   // ← set true if you expect a NEW invoice each time
          retryToken: signatureIdemKey,                     // helps server keep the same new number on retries
          chatId,                                           // Passed for server logging
          timestamp: currentTimestamp,                      // Passed: "YYYY/MM/DD at HH:mm:ss.sss"
        }),
        cache: "no-store",
      });

      const data = await res.json();

      if (data?.ok && data?.hostedUrl) {

        // --- TRY TO OPEN POPUP (No blank page first) ---
        const popup = window.open(data.hostedUrl, "_blank", "noopener,noreferrer");
        if (popup) popup.focus();
        // -----------------------------------------------

        // 3.5) Pin the NEW URL/ids to the chat
        const pinIdemKey = `${reserveIdemKey}:pin:${data.invoiceId}`;
        await reserveOrderIdFromInvoice({
          chatId,
          merchantInvoiceNumber: invNum,
          clientYear,
          idempotencyKey: pinIdemKey,
          paypalInvoiceId: data.invoiceId,
          hostedUrl: data.hostedUrl,
          paypalInvoiceNumber: data.paypalInvoiceNumber,
          status: "awaiting_payment",
        });

        // Close modal (no alerts)
        onClose();

      } else if (res.status === 409) {
        console.warn("Invoice conflict: This signature already has a PAID invoice.");
      } else {
        console.error("Invoice error:", data);
      }

      setCurrentStep(1);
      setPaymentData({ email: "", signature: "" });

    } catch (err) {
      console.error("Payment submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1)
    setPaymentData({ email: "", signature: "" })
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // prevent closing the modal while a submit is in progress
        if (!open) {
          if (isSubmitting) return;
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[90vh] overflow-hidden min-h-0">
        {/* A11y-only header to satisfy DialogContent requirement */}
        <DialogHeader className="sr-only">
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Three-step payment flow: Email, Signature, Review.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[90vh]">

          <div className="border-b border-border bg-muted/30 px-6 py-3 pr-12">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">Complete Payment</h2>
              <span className="text-sm font-medium text-muted-foreground">Step {currentStep} of 3</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${step <= currentStep ? "bg-[#0070BA]" : "bg-muted"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Step content: make this the scroll container so each step's buttons scroll into view */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {currentStep === 1 && (
              <EmailStep
                onComplete={handleEmailComplete}
                initialEmail={paymentData.email}
              />
            )}

            {currentStep === 2 && (
              <SignatureStep
                onComplete={handleSignatureComplete}
                onBack={handleBack}
                initialSignature={paymentData.signature}
              />
            )}

            {currentStep === 3 && (
              <ReviewStep
                isSubmitting={isSubmitting}
                paymentData={paymentData}
                onBack={handleBack}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}