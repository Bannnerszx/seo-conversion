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
import { functions } from "../../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
export default function PaymentModal({ invoiceNumber, carData, chatId, invoiceData, isOpen, onClose }) {
    const reserveOrderIdFromInvoice = httpsCallable(functions, "reserveOrderIdFromInvoice");
    const createSignatureAndUpload = httpsCallable(functions, "createSignatureAndUpload");
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

    const sanitizeForDocId = (s) => String(s).replaceAll("/", "-").replaceAll("\\", "-").trim();
    const pad6 = (n) => String(Number(n)).padStart(6, "0");

    function makeReserveKey({ chatId, invNum, year }) {
        return sanitizeForDocId(`reserve:${chatId}:${year}:${pad6(invNum)}`);
    }

    function makeSignatureKey({ chatId, invNum, year, email }) {
        return sanitizeForDocId(`signature:${chatId}:${year}:${pad6(invNum)}:${(email || "").toLowerCase().trim()}`);
    }
    const norm2 = (n) => (Number(n || 0)).toFixed(2);

    const chassis = carData?.chassisNumber || "-";
    const model = carData?.model || "-";
    const incot = invoiceData?.paymentDetails?.incoterms || "-";
    const port = invoiceData?.discharge?.port || "Port of Dar es Salaam only";
    const mainItemDescription = [
        `Invoice No. RMJ-${invoiceNumber}\n\n${chassis}\n\n${model}\n\n${incot}\n\n${port}\n\nBuyer reviewed and agreed to conditions (refund/FX policy, no address change)`

    ].join("\n\n");

    const handleSubmit = async ({ consent }) => {
        try {
            setIsSubmitting(true);

            const clientYear = new Date().getFullYear();
            const invNum = Number(invoiceNumber);
            const reserveIdemKey = makeReserveKey({ chatId, invNum, year: clientYear });
            const signatureIdemKey = makeSignatureKey({ chatId, invNum, year: clientYear, email: paymentData.email });

            const norm2 = (n) => (Number(n || 0)).toFixed(2);
            const port = String(invoiceData?.discharge?.port || "Port of Dar es Salaam only");

            // 1) Reserve order on chat (idempotent)
            await reserveOrderIdFromInvoice({
                chatId,
                merchantInvoiceNumber: invNum,
                clientYear,
                idempotencyKey: reserveIdemKey,
            });

            // 2) Create signature (idempotent)
            const sigRes = await createSignatureAndUpload({
                chatId,
                merchantInvoiceNumber: invNum,
                signerEmail: paymentData.email,
                consent,
                snapshot: {
                    currency: invoiceData?.selectedCurrencyExchange,
                    total: Number(invoiceData?.paymentDetails?.totalAmount || 0),
                    incoterms: invoiceData?.paymentDetails?.incoterms,
                    deliveryScope: port,
                    vin: carData?.chassisNumber || null,
                    model: carData?.carName || null,
                    stockId: carData?.stockID || null, 
                },
                signatureDataUrl: paymentData.signature || undefined,
                clientYear,
                idempotencyKey: signatureIdemKey,
            });

            const { customId, orderId } = sigRes.data || {};

            const items = [
                {
                    name: String(carData?.carName || "Vehicle"),
                    quantity: "1",
                    unit_amount: { value: norm2(invoiceData?.paymentDetails?.totalAmount || 0) },
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

            // 3) Create/send PayPal invoice
            const res = await fetch("/api/paypal/create-invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currency: invoiceData?.selectedCurrencyExchange || "USD",
                    payer: { email_address: paymentData.email },
                    items,
                    note: invoiceData?.paypalNote,
                    reference,
                    dueDate: invoiceData?.dueDate,
                    allowPartial: invoiceData?.allowPartial ?? false,
                    minPartialValue: invoiceData?.minPartialValue,
                    customId,                                      // signatureId
                    invoiceNumber: String(invNum).padStart(6, "0"),
                    forceNew: true,                                // ← set true if you expect a NEW invoice each time
                    retryToken: signatureIdemKey,                  // helps server keep the same new number on retries
                    chatId,                                        // optional, for server logging
                }),
                cache: "no-store",
            });

            const data = await res.json();

            if (data?.ok && data?.hostedUrl) {
                // 3.5) Pin the NEW URL/ids to the chat using a DIFFERENT key, so it actually writes
                const pinIdemKey = `${reserveIdemKey}:pin:${data.invoiceId}`;  // ← different key
                await reserveOrderIdFromInvoice({
                    chatId,
                    merchantInvoiceNumber: invNum,
                    clientYear,
                    idempotencyKey: pinIdemKey,                   // ← not the same as the first call
                    paypalInvoiceId: data.invoiceId,
                    hostedUrl: data.hostedUrl,
                    paypalInvoiceNumber: data.paypalInvoiceNumber,
                    status: "awaiting_payment",
                });

                // 4) Open the *current* payer link
                window.open(data.hostedUrl, "_blank", "noopener,noreferrer");
            } else if (res.status === 409) {
                alert("This signature already has a PAID invoice. Create a new signature to issue a new invoice.");
            } else {
                console.error("Invoice error:", data);
                alert(data?.error || data?.message || "Failed to create/send invoice.");
            }

            setCurrentStep(1);
            setPaymentData({ email: "", signature: "" });
            onClose();
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
                if (!open) handleClose()
            }}
        >
            <DialogContent className="max-w-lg p-0 gap-0 max-h-[90vh] overflow-hidden">
                {/* A11y-only header to satisfy DialogContent requirement */}
                <DialogHeader className="sr-only">
                    <DialogTitle>Complete Payment</DialogTitle>
                    <DialogDescription>
                        Three-step payment flow: Email, Signature, Review.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col h-full">

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

                    {/* Step content */}
                    <div className="flex-1 overflow-y-auto">
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
