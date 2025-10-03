"use client"
import Link from "next/link"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { firestore } from "../../../../firebase/clientApp"
import { doc, updateDoc } from "firebase/firestore"
import { subscribeToChatDoc } from "./chatSubscriptions"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Send, X, Download, CheckCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import CarDetails from "./carDetails"
import ActionButtonsChat from "./actionButtonsChat"
import { AnnouncementBar } from "./announcementBar"
import PreviewInvoice from "./previewInvoice"
import DeliveryAddress from "./deliveryAddress"
import ChatMessage from "./messageLinks"
import WarningDialog from "./warningDialog"
import ProductReview from "./ProductReview"
import TransactionCSRLoader from "./TransactionCSRLoader"
import { useBootData } from "./useBootDataTransactionCSR"
import { toast } from "sonner"
// import { AssistiveTouch } from "./AssistiveTouch"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export default function TransactionCSR({ isLoadingTransaction, vehicleStatus, accountData, isMobileView, isDetailView, handleBackToList, bookingData, countryList, currency, dueDate, handleLoadMore, invoiceData, userEmail, contact, messages, onSendMessage, isLoading, chatId, chatMessages }) {
    const {
        ipInfo,
        getFreshTime,
        getFreshIP,
        formatTokyoLocal,
        ready: bootReady,
    } = useBootData();

    const [newMessage, setNewMessage] = useState("");
    const sendMessage = httpsCallable(functions, "sendMessage");
    const updateCustomerFiles = httpsCallable(functions, "updateCustomerFiles");
    const scrollAreaRef = useRef(null);
    const endOfMessagesRef = useRef(null);
    const startOfMessagesRef = useRef(null);
    const fileInputRef = useRef(null);
    const [attachedFile, setAttachedFile] = useState(null);
    const [loadingSent, setLoadingSent] = useState(false);
    const [warningOpen, setWarningOpen] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const navigatedToPaymentRef = useRef(false);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            setWarningMessage(`File size (${sizeMB} MB) exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`);
            setWarningOpen(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            setAttachedFile({ name: file.name, type: file.type, data: base64 });
        };
        reader.readAsDataURL(file);
    };

    const handleDialogOpenChange = useCallback((open) => {
        if (!open) {
            if (fileInputRef.current) fileInputRef.current.value = "";
            setAttachedFile(null);
            setWarningMessage("");
            setWarningOpen(false);
        } else {
            setWarningOpen(true);
        }
    }, []);

    // ===== Subscribe to payment modal trigger (unchanged; can optionally gate on bootReady)
    useEffect(() => {
        if (!chatId || !isDetailView) {
            setShowPaymentModal(false);
            return;
        }
        const unsubscribe = subscribeToChatDoc(chatId, (chatData) => {
            if (!chatData) {
                setShowPaymentModal(false);
                return;
            }
            const rawStep = chatData?.stepIndicator?.value ?? chatData?.tracker ?? null;
            const tracker = rawStep == null ? null : Number(rawStep);
            if (tracker === 4 && !Number.isNaN(tracker)) {
                try {
                    const alreadyConfirmed = chatData?.confirmedPayment === true;
                    const isCancelled = chatData?.isCancelled === true;
                    setShowPaymentModal(!alreadyConfirmed && !isCancelled);
                } catch (err) {
                    console.error("Failed to handle payment event:", err);
                    setShowPaymentModal(false);
                }
            } else {
                setShowPaymentModal(false);
            }
        });
        return () => unsubscribe();
    }, [chatId, isDetailView]);


    // ===== Always fresh time on send; IP comes from boot (cached ok)

    const handleSendMessage = async (e) => {
        if (loadingSent || isLoading || (!newMessage.trim() && !attachedFile)) return;
        e.preventDefault();
        setLoadingSent(true);

        const hasText = !!newMessage.trim();
        const hasFile = !!attachedFile;

        const codeOf = (errOrObj) =>
            typeof errOrObj?.code === "string" && errOrObj.code.startsWith("functions/")
                ? errOrObj.code.slice("functions/".length)
                : (errOrObj?.code || "");

        const friendlyError = (errOrObj, fallback = "Something went wrong. Please try again.") => {
            const code = codeOf(errOrObj);
            if (code === "permission-denied" && errOrObj?.details?.allowedExtensions) {
                return `This file type isn’t allowed. Please upload: ${errOrObj.details.allowedExtensions.join(", ")}`;
            }
            switch (code) {
                case "unauthenticated": return "Please sign in and try again.";
                case "invalid-argument": return "Some required information is missing or invalid. Please recheck and try again.";
                case "permission-denied": return errOrObj?.message || "You don’t have permission to do that.";
                case "resource-exhausted": return "Upload limit reached. Try a smaller file or wait a bit.";
                case "aborted":
                case "cancelled": return "The request was interrupted. Please try again.";
                case "deadline-exceeded": return "The server took too long to respond. Please try again.";
                case "internal": return errOrObj?.details?.cause ? `Server error: ${errOrObj.details.cause}` : "We hit a server error. Please try again.";
                default: return errOrObj?.message || fallback;
            }
        };

        try {
            // 1) fresh time required
            const freshTime = await getFreshTime(3500);
            if (!freshTime) {
                if (hasFile) toast.error("Couldn’t reach the time server. Please try again.", { duration: 12000 });
                setLoadingSent(false); // stop spinner; DO NOT dismiss any toast (none yet)
                return;
            }

            // 2) best-effort IP
            const ipData = ipInfo || await getFreshIP(2500);
            const formattedTime = formatTokyoLocal(freshTime?.datetime);

            // ============ FILE PATH (file-only or file+text) — use toasts ============
            if (hasFile) {
                const tId = toast.loading("Uploading file…"); // we'll REPLACE this toast, not dismiss it
                try {
                    const res = await updateCustomerFiles({
                        chatId,
                        selectedFile: attachedFile,
                        userEmail,
                        messageValue: hasText ? newMessage.trim() : "File attached.",
                        ...(ipData && { ipInfo: ipData }),
                        formattedTime,
                    });

                    const data = res?.data;
                    if (!data?.success) {
                        const serverErr = {
                            code: data?.code || data?.errorCode,
                            message: data?.message || data?.errorMessage,
                            details: data?.details,
                        };
                        // replace loading toast with ERROR and leave it visible (no dismiss)
                        toast.error(friendlyError(serverErr, "Upload failed."), { id: tId, duration: 12000 });
                        setLoadingSent(false); // stop spinner AFTER showing error
                        return;
                    }

                    // replace loading toast with SUCCESS
                    toast.success("File uploaded successfully.", { id: tId, duration: 3000 });

                    // optional: also send text (no toasts for text-only per your rule)
                    if (hasText) {
                        try {
                            await sendMessage({
                                chatId,
                                newMessage: newMessage.trim(),
                                userEmail,
                                formattedTime,
                                ...(ipData?.ip && {
                                    ip: ipData.ip,
                                    ipCountry: ipData.country_name,
                                    ipCountryCode: ipData.country_code,
                                }),
                            });
                        } catch (err) {
                            // show a new error toast (not the loading one) and keep it on screen
                            toast.error(friendlyError(err, "Message failed after upload."), { duration: 12000 });
                            setLoadingSent(false);
                            return;
                        }
                    }

                } catch (err) {
                    // replace loading toast with ERROR; do NOT dismiss it
                    toast.error(friendlyError(err, "Upload failed."), { id: tId, duration: 12000 });
                    setLoadingSent(false);
                    return;
                }

                // ============ TEXT-ONLY PATH — no toasts ============
            } else if (hasText) {
                try {
                    await sendMessage({
                        chatId,
                        newMessage: newMessage.trim(),
                        userEmail,
                        formattedTime,
                        ...(ipData?.ip && {
                            ip: ipData.ip,
                            ipCountry: ipData.country_name,
                            ipCountryCode: ipData.country_code,
                        }),
                    });
                } catch (err) {
                    console.error("Text-only send failed:", err);
                    setLoadingSent(false); // stop spinner immediately on error
                    return;
                }
            }

            // success cleanup
            setNewMessage("");
            setAttachedFile(null);
            setLoadingSent(false); // stop spinner on success

        } catch (outer) {
            // unexpected outer error
            if (hasFile) toast.error("Action failed. Please try again.", { duration: 12000 });
            console.error(outer);
            setLoadingSent(false); // make sure spinner stops
        }
    };
    const resetFilePicker = (opts = { keepState: false }) => {
        // always clear the native input so selecting the same file fires onChange
        if (fileInputRef.current) fileInputRef.current.value = "";
        // optionally keep React state (useful when just opening the picker)
        if (!opts.keepState) setAttachedFile(null);
    };

    // ===== Scroll behaviors (unchanged)
    useEffect(() => {
        if (!chatId || !isDetailView) {
            console.warn("chatId or isDetailView is not set. Messages cannot be fetched or scrolled.");
            return;
        }
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, isDetailView]);

    const renderTextWithLinks = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (!text) return null;
        const parts = text.split(urlRegex);
        const matches = text.match(urlRegex) || [];
        return (
            <>
                {parts.map((part, index) => {
                    if (matches.includes(part)) {
                        return (
                            <Link
                                key={index}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white-600 underline hover:underline"
                            >
                                {part}
                            </Link>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </>
        );
    };

    const [lastChatId, setLastChatId] = useState(chatId);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        if (chatId !== lastChatId) {
            setShouldScroll(true);
            setLastChatId(chatId);
        }
    }, [chatId, lastChatId]);

    useEffect(() => {
        if (shouldScroll && chatMessages.length > 0 && endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
            setShouldScroll(false);
        }
    }, [chatMessages, shouldScroll]);

    // ===== Pricing (unchanged)
    const { stockStatus, reservedTo } = vehicleStatus[contact?.carData?.stockID] || {};
    const isReservedOrSold = (stockStatus === "Reserved" || stockStatus === "Sold") && reservedTo !== userEmail;

    const selectedCurrencyCode = contact?.selectedCurrencyExchange;
    const currencies = [
        { code: "USD", symbol: "USD$", value: 1 },
        { code: "EUR", symbol: "€", value: contact?.currency.usdToEur },
        { code: "JPY", symbol: "¥", value: contact?.currency.usdToJpy },
        { code: "CAD", symbol: "CAD$", value: contact?.currency.usdToCad },
        { code: "AUD", symbol: "AUD$", value: contact?.currency.usdToAud },
        { code: "GBP", symbol: "GBP£", value: contact?.currency.usdToGbp },
        { code: "ZAR", symbol: "R", value: contact?.currency.usdToZar },
    ];
    const currencyInside = currencies.find((c) => c.code === selectedCurrencyCode) || currencies[0];

    const basePrice =
        parseFloat(contact?.carData?.fobPrice) *
        parseFloat(contact?.currency.jpyToUsd);

    const baseFinalPrice = invoiceData?.paymentDetails.totalAmount
        ? parseFloat(invoiceData?.paymentDetails.totalAmount) - (contact?.inspection ? 300 : 0)
        : basePrice + parseFloat(contact?.carData?.dimensionCubicMeters) * parseFloat(contact?.freightPrice);

    const inspectionSurcharge = contact?.inspection === true ? 300 * currencyInside.value : 0;
    const insuranceSurcharge = contact?.insurance === true ? 50 * currencyInside.value : 0;
    const finalPrice = (baseFinalPrice * currencyInside.value + inspectionSurcharge + insuranceSurcharge);

    // ===== Example UI gates
    const disableSend = !bootReady || loadingSent || isLoading;
    return (
        isLoadingTransaction ? <TransactionCSRLoader /> : (
            <div className="flex flex-col h-full">

                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-full p-2">
                                        <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">Payment Confirmed</h3>
                                        <p className="text-blue-100 text-sm">Transaction completed successfully</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6">
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Your payment has been approved and processed. Please confirm to proceed.
                                </p>

                                {/* Payment details */}
                                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className="font-semibold text-gray-900">

                                            {
                                                (() => {
                                                    const invoiceTotal = Number(invoiceData?.paymentDetails?.totalAmount);
                                                    const fallback = Number(finalPrice);

                                                    const amount =
                                                        invoiceTotal > 0 ? invoiceTotal :
                                                            fallback > 0 ? fallback :
                                                                null;
                                                    return amount != null
                                                        ? `${currencyInside.symbol} ${Math.ceil(amount).toLocaleString()}`
                                                        : 'ASK';
                                                })()
                                            }

                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-gray-600">Status:</span>
                                        <span className="text-green-600 font-medium">Approved</span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex justify-end">
                                    <button
                                        id="rmj_payment_confirm"
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                                        onClick={async () => {
                                            try {
                                                // Persist confirmation to Firestore so it's durable and cross-device
                                                await updateDoc(doc(firestore, 'chats', chatId), { confirmedPayment: true })
                                                try { window.dataLayer = window.dataLayer || [] } catch (e) { }
                                                if (typeof window !== 'undefined' && window.dataLayer) {
                                                    window.dataLayer.push({ event: 'rmj_payment_confirmed', chatId })
                                                }
                                                // One-time navigate to /chats/payment/:chatId for SEO/analytics if not yet navigated
                                                try {
                                                    if (typeof window !== 'undefined' && !navigatedToPaymentRef.current) {
                                                        const targetPath = `/chats/payment/${chatId}`
                                                        const currentPath = window.location.pathname || ''
                                                        if (!currentPath.startsWith(targetPath)) {
                                                            navigatedToPaymentRef.current = true
                                                            window.location.assign(targetPath)
                                                        } else {
                                                            navigatedToPaymentRef.current = true
                                                        }
                                                    }
                                                } catch (navErr) {
                                                    console.error('Navigation to payment failed:', navErr)
                                                }
                                            } catch (err) {
                                                console.error('Failed to persist confirmedPayment:', err)
                                            } finally {
                                                setShowPaymentModal(false)
                                            }
                                        }}
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                <WarningDialog
                    open={warningOpen}
                    onOpenChange={handleDialogOpenChange}
                    title="File Size Warning"
                    description={warningMessage}
                    confirmText="OK"
                />

                <div className="relative w-full">




                    <div className="relative z-[5]">
                        {/* this is your dynamic‐height content */}
                        <CarDetails
                            chatId={chatId}
                            accountData={accountData}
                            isDetailView={isDetailView}
                            isMobileView={isMobileView}
                            handleBackToList={handleBackToList}
                            bookingData={bookingData}
                            countryList={countryList}
                            currency={currency}
                            dueDate={dueDate}
                            contact={contact}
                            invoiceData={invoiceData}
                        />

                        {/* your existing action buttons (still in flow) */}
                        {contact?.stepIndicator?.value >= 2 && (
                            <ActionButtonsChat
                                accountData={accountData}
                                bookingData={bookingData}
                                chatId={chatId}
                                countryList={countryList}
                                selectedChatData={contact}
                                invoiceData={invoiceData}
                                userEmail={userEmail}
                                vehicleStatus={vehicleStatus}
                            />
                        )}

                        {/* announcement bar pulled out of flow but placed at parent’s bottom */}
                        {(contact?.stepIndicator?.value === 2 || contact?.stepIndicator?.value === 3 || isReservedOrSold) && (
                            <div className="absolute top-full left-0 w-full z-[1] px-1 mt-1">
                                <AnnouncementBar
                                    invoiceData={invoiceData}
                                    accountData={accountData}
                                    chatId={chatId}
                                    selectedChatData={contact}
                                    countryList={countryList}
                                    userEmail={userEmail}
                                    vehicleStatus={vehicleStatus}
                                />
                            </div>
                        )}
                    </div>



                </div>

                <ScrollArea
                    onScrollCapture={(e) => {
                        if (e.target.scrollTop === 0) handleLoadMore();
                    }}
                    ref={scrollAreaRef}
                    className="h-full p-4 custom-scroll bg-[#E5EBFE]"
                >

                    <div className="space-y-4 mt-8">
                        {chatMessages.map((message, index) => (
                            <div key={index} className="w-full">
                                <div className={`flex w-full ${message.sender === userEmail ? "justify-end" : "justify-start"}`}>

                                    <div
                                        className={`max-w-[75%] p-3 rounded-lg ${message.sender === userEmail
                                            ? "bg-blue-500 text-white rounded-br-none"
                                            : "bg-white text-gray-800 rounded-bl-none"
                                            }`}
                                    >

                                        {!message.messageType && (
                                            <p
                                                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                className={message.sender === userEmail ? "text-white" : "text-gray-800"}
                                            >
                                                {renderTextWithLinks(message.text)}
                                            </p>
                                        )}

                                        {message.messageType === 'InvoiceAmendment' && (
                                            <p
                                                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", }}
                                                className={message.sender === userEmail ? "text-white" : "text-gray-800"}
                                            >
                                                {renderTextWithLinks(message.text)}
                                            </p>
                                        )}
                                        {message.messageType === 'FullPayment' && (
                                            <p
                                                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                className={message.sender === userEmail ? "text-white" : "text-gray-800"}
                                            >
                                                {renderTextWithLinks(message.text)}
                                            </p>
                                        )}

                                        {message.messageType === 'InputPayment' && (
                                            <p
                                                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                className={message.sender === userEmail ? "text-white" : "text-gray-800"}
                                            >
                                                {renderTextWithLinks(message.text)}
                                            </p>
                                        )}
                                        {message.messageType === 'IssuedInvoice' && (
                                            <>
                                                <p
                                                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                    className={message.sender === userEmail ? "text-white" : "text-gray-800"}
                                                >
                                                    {renderTextWithLinks(message.text)}
                                                </p>
                                                <div className={`mt-2 flex justify-${message.sender === userEmail ? "end" : "start"}`}>

                                                    <PreviewInvoice userEmail={userEmail} chatId={chatId} accountData={accountData} selectedChatData={contact} invoiceData={invoiceData} />
                                                </div>
                                            </>

                                        )}
                                        {message.messageType === 'InputDocDelAdd' && (
                                            <>
                                                <p
                                                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                    className={message.sender === userEmail ? "text-white" : "text-gray-800"}
                                                >
                                                    {renderTextWithLinks(message.text)}
                                                </p>
                                                <div className={`mt-2 flex justify-${message.sender === userEmail ? "end" : "start"}`}>
                                                    <DeliveryAddress accountData={accountData} countryList={countryList} chatId={chatId} userEmail={userEmail} />
                                                </div>
                                            </>

                                        )}

                                        {message.messageType === 'important' && (
                                            <div
                                                className={`flex flex-col ${message.sender === userEmail ? 'items-end' : 'items-start'
                                                    } space-y-4`}
                                            >

                                                <div
                                                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                    className="text-base"
                                                >
                                                    {message.text}
                                                </div>

                                                {message.text.includes('Vessel Name') && bookingData?.sI?.url && (
                                                    <Button
                                                        variant="default"
                                                        className="gap-2 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                                                        onClick={() => window.open(bookingData.sI.url, '_blank')}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        <span>Download SI</span>
                                                    </Button>
                                                )}


                                                {message.text.includes('B/L') && bookingData?.bL?.url && (
                                                    <Button
                                                        variant="default"
                                                        className="gap-2 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                                                        onClick={() => window.open(bookingData.bL.url, '_blank')}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        <span>Download BL</span>
                                                    </Button>
                                                )}
                                            </div>
                                        )}



                                        <ChatMessage accountData={accountData} message={message} userEmail={userEmail} />

                                    </div>

                                </div>


                                <div className={`w-full flex ${message.sender === userEmail ? "justify-end" : "justify-start"}`}>
                                    <span className="text-xs text-gray-500">
                                        {message.timestamp}
                                    </span>
                                </div>
                                {index === chatMessages.length - 1 && contact?.stepIndicator?.value >= 6 && (
                                    <div className="w-full">
                                        {/* The bubble itself */}
                                        <div className="flex w-full justify-start">
                                            <div className="max-w-[75%] p-3 rounded-lg bg-white text-gray-800 rounded-bl-none">
                                                <p
                                                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                    className="text-gray-800"
                                                >
                                                    We’d love your feedback! Please leave a review of your experience.
                                                </p>

                                                <ProductReview step={contact?.stepIndicator?.value} chatId={chatId} invoiceData={invoiceData?.consignee} carData={contact?.carData} accountName={`${accountData?.textFirst} ${accountData?.textLast}`} />
                                            </div>
                                        </div>

                                        {/* ✅ Timestamp just like other messages */}
                                        <div className="w-full flex justify-start">
                                            <span className="text-xs text-gray-500">
                                                {message.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[70%] p-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
                                    <div className="flex space-x-1">
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: "0ms" }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: "150ms" }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: "300ms" }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>
                </ScrollArea>
                {/* <AssistiveTouch /> */}
                <ChatInput resetFilePicker={resetFilePicker} accountData={accountData} loadingSent={loadingSent} setAttachedFile={setAttachedFile} fileInputRef={fileInputRef} attachedFile={attachedFile} handleFileUpload={handleFileUpload} userEmail={userEmail} chatId={chatId} newMessage={newMessage} setNewMessage={setNewMessage} handleSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
        )


    )
}


export function ChatInput({
    newMessage,
    setNewMessage,
    handleSendMessage,
    isLoading,
    handleFileUpload,
    attachedFile,
    fileInputRef,
    setAttachedFile,
    loadingSent,
    accountData,
    resetFilePicker
}) {




    // Calculate rows based on newline count: minimum 1, maximum 4
    const computedRows = Math.min(
        Math.max(newMessage.split("\n").length, 1),
        6
    )

    return (
        <div className="p-4 border-t border-gray-200">
            {/* File attachment preview - now positioned ABOVE the form */}
            {attachedFile && (
                <div className="mb-3 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">
                            {attachedFile.name}
                            <span className="text-gray-500 text-xs ml-1">
                                (
                                {(
                                    /* Base64 → bytes ≈ length * 3/4, then to KB */
                                    (attachedFile.data.length * 3) / 4 / 1024
                                ).toFixed(1)}{" "}
                                KB
                                )
                            </span>
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachedFile(null)}
                        className="h-6 w-6 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Textarea
                    rows={computedRows}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 resize-none"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            // only send if there's text OR a file, and we're not already sending
                            if (
                                loadingSent ||
                                isLoading ||
                                (!newMessage.trim() && !attachedFile)
                            ) return;
                            handleSendMessage(e);
                        }
                    }}
                />
                {/* File upload button */}
                <Button
                    type="button"
                    size="icon"
                    onClick={() => {
                        resetFilePicker({ keepState: true });   // clear input only
                        fileInputRef.current?.click();          // open picker
                    }}
                    disabled={isLoading || loadingSent}
                    aria-label="Attach file"
                    title="Attach file"
                >

                    <Paperclip className="h-4 w-4" />
                </Button>
                {/* Send button */}
                <Button
                    type="submit"
                    size="icon"
                    disabled={
                        isLoading ||
                        loadingSent ||
                        (!newMessage.trim() && !attachedFile)
                    }
                >
                    {loadingSent
                        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                        : <Send className="h-4 w-4" />
                    }
                </Button>
                {/* Hidden file input */}
                <input disabled={isLoading} type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" aria-label="Upload file" />
            </form>
        </div>
    )
}