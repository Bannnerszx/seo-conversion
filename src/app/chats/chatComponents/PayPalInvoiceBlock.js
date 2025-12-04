'use client'
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PaymentModal from "./paypalComponents/payment-modal";
import { getFirebaseFunctions } from "../../../../firebase/clientApp";

export default function PayPalInvoiceBlock({ tokyotime, chatId, invoiceNumber, carData, invoiceData, message, userEmail, renderTextWithLinks }) {
    // 3. Remove top-level callable definition
   
    const [payerEmail, setPayerEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const validEmail = /\S+@\S+\.\S+/.test(payerEmail);
    const [checking, setChecking] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = async () => {
        setChecking(true);
        try {
            // 4. Load Functions Dynamically
            const [functionsInstance, { httpsCallable }] = await Promise.all([
                getFirebaseFunctions(),
                import("firebase/functions")
            ]);
            const getPaymentState = httpsCallable(functionsInstance, "getPaymentState");

            const { data: state } = await getPaymentState({ chatId });

            switch (state.suggestedAction) {
                case "none":
                    if (state.hostedUrl) window.open(state.hostedUrl, "_blank", "noopener,noreferrer");
                    else alert("This invoice has already been paid."); //add modal here if ever

                    return;

                case "openHostedUrl":
                    if (state.hostedUrl) {
                        window.open(state.hostedUrl, "_blank", "noopener,noreferrer");
                        return;
                    }
                default:
                    // Your existing modal flow that creates the signature THEN creates invoice
                    setIsModalOpen(true);
                    return;
            }
        } catch (error) {
            console.error("Error checking payment state:", error);
            alert("Unable to verify payment status. Please try again.");
        } finally {
            setChecking(false);
        }
    };


    return (

        <div className="w-full py-3">

            {/* 
            <div className="rounded-md border p-3 bg-white/70 text-gray-900 space-y-3">
               

                <button
                    disabled={!validEmail || submitting}
                    onClick={async () => {
                        try {
                            setSubmitting(true);
                            const res = await fetch("/api/paypal/create-invoice", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    currency: "USD",
                                    // only email; name omitted (optional)
                                    payer: { email_address: payerEmail },

                                    // use your message payload or fallbacks
                                    items: message?.paypal?.items || [
                                        { name: "Unit A", quantity: "1", unit_amount: { value: "100.00" } },
                                    ],
                                    note: message?.paypal?.note,
                                    reference: message?.paypal?.reference,
                                    dueDate: message?.paypal?.dueDate,                // optional "YYYY-MM-DD"
                                    allowPartial: message?.paypal?.allowPartial ?? false,
                                    minPartialValue: message?.paypal?.minPartialValue // optional
                                }),
                            });

                            const data = await res.json();
                            if (data?.ok && data?.hostedUrl) {
                                window.open(data.hostedUrl, "_blank", "noopener,noreferrer"); // ← new tab
                            } else {
                                console.error("Invoice error:", data);
                                alert(data?.error || data?.message || "Failed to create/send invoice.");
                            }
                        } catch (e) {
                            console.error(e);
                            alert(String(e?.message || e));
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
                >
                    {submitting ? "Creating…" : "Continue to Payment"}
                </button>
            </div> */}



            <div className="text-center text-xs text-slate-600 mb-2">
                Pay securely with
            </div>
            <Button
                onClick={handleClick}
                variant="paypal"
                className="w-full min-h-[52px] font-bold text-base rounded-20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg giver:shadow-xl flex items-center justify-center gap-3 bg-[#ffd140] hover:bg-[#f7c600] border-0"
            >
                {checking ? "Checking…" : <img src={'/paypal-button.png'} alt="PayPal" className="h-5" />}
            </Button>
            <p className="text-xs text-center text-slate-600 mt-2 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Fast & secure checkout

            </p>

            <PaymentModal timestamp={tokyotime} chatId={chatId} invoiceNumber={invoiceNumber} carData={carData} invoiceData={invoiceData} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>

    );
}