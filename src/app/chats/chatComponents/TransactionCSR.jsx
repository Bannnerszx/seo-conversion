"use client"
import Link from "next/link"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
import { useState, useRef, useEffect, useCallback } from "react"
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
import moment from "moment"
import WarningDialog from "./warningDialog"
import ProductReview from "./ProductReview"
import TransactionCSRLoader from "./TransactionCSRLoader"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export default function TransactionCSR({ isLoadingTransaction, vehicleStatus, accountData, isMobileView, isDetailView, handleBackToList, bookingData, countryList, currency, dueDate, handleLoadMore, invoiceData, userEmail, contact, messages, onSendMessage, isLoading, chatId, chatMessages }) {

    const [newMessage, setNewMessage] = useState("");
    const sendMessage = httpsCallable(functions, 'sendMessage');
    const updateCustomerFiles = httpsCallable(functions, 'updateCustomerFiles');
    const scrollAreaRef = useRef(null)
    const endOfMessagesRef = useRef(null);
    const startOfMessagesRef = useRef(null);
    const fileInputRef = useRef(null);
    const [attachedFile, setAttachedFile] = useState(null);
    const [loadingSent, setLoadingSent] = useState(false)
    const [warningOpen, setWarningOpen] = useState(false)
    const [warningMessage, setWarningMessage] = useState("")

    //Get the notification error
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            setWarningMessage(
                `File size (${sizeMB} MB) exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`
            );
            setWarningOpen(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            // reader.result is "data:<mime>;base64,<data>"
            const base64 = reader.result.split(",")[1];
            setAttachedFile({
                name: file.name,
                type: file.type,
                data: base64,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDialogOpenChange = useCallback((open) => {
        if (!open) {
            // clear everything
            if (fileInputRef.current) fileInputRef.current.value = ""
            setAttachedFile(null)
            setWarningMessage("")
            setWarningOpen(false)
        } else {
            setWarningOpen(true)
        }
    }, [])
    const [ipInfo, setIpInfo] = useState(null);
    const [tokyoTime, setTokyoTime] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const navigatedToPaymentRef = useRef(false)

    // Initial load on mount
    useEffect(() => {
        let mounted = true;
        Promise.all([
            fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo").then(r => r.json()),
            fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time").then(r => r.json()),
        ])
            .then(([ip, time]) => {
                if (!mounted) return;
                setIpInfo(ip);
                setTokyoTime(time);
            })
            .catch(err => {
                if (!mounted) return;
                console.error("Preload fetch failed", err);
            });
        return () => { mounted = false; };
    }, []);

    // Subscribe to chat doc for payment events and show modal when appropriate (detail view only)
    // Persist confirmation to Firestore (confirmedPayment) so it survives cookie/LS clears.
    useEffect(() => {
        if (!chatId || !isDetailView) return

        const unsubscribe = subscribeToChatDoc(chatId, (chatData) => {
            if (!chatData) return
            const rawStep = chatData?.stepIndicator?.value ?? chatData?.tracker ?? null
            const tracker = rawStep == null ? null : Number(rawStep)
            // Only show modal when tracker reaches payment stage AND the chat hasn't been confirmed yet
            if (tracker !== null && !Number.isNaN(tracker) && tracker >= 4) {
                try {
                    const alreadyConfirmed = chatData?.confirmedPayment === true
                    if (!alreadyConfirmed) {
                        setShowPaymentModal(true)
                    } else {
                        // ensure modal is hidden if already confirmed elsewhere
                        setShowPaymentModal(false)
                    }
                } catch (err) {
                    console.error('Failed to handle payment event:', err)
                }
            }
        })

        return () => unsubscribe()
    }, [chatId, isDetailView])

    const handleSendMessage = async (e) => {
        if (loadingSent || isLoading || (!newMessage.trim() && !attachedFile)) {
            return;
        }
        setLoadingSent(true);
        e.preventDefault();

        if (!newMessage.trim() && !attachedFile) return;

        try {
            let currentIpInfo = ipInfo;
            let currentTokyoTime = tokyoTime;

            // Try to fetch fresh data with a timeout, but don't block if it fails
            try {
                const fetchPromise = Promise.all([
                    fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo").then(r => r.json()),
                    fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time").then(r => r.json()),
                ]);

                // Add a timeout to prevent hanging
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );

                const [freshIp, freshTime] = await Promise.race([fetchPromise, timeoutPromise]);
                currentIpInfo = freshIp;
                currentTokyoTime = freshTime;

                // Update state with fresh data for next time
                setIpInfo(freshIp);
                setTokyoTime(freshTime);
            } catch (fetchError) {
                console.warn("Failed to fetch fresh data, using cached values:", fetchError);
                // Continue with cached values
            }

            // If we still don't have any data (even cached), we need to handle this
            if (!currentIpInfo || !currentTokyoTime) {
                throw new Error("No IP info or time data available");
            }

            // Format the time
            const momentDate = moment(currentTokyoTime?.datetime, 'YYYY/MM/DD HH:mm:ss.SSS');
            const formattedTime = momentDate.format('YYYY/MM/DD [at] HH:mm:ss');

            // Extract IP info details
            const ip = currentIpInfo.ip;
            const ipCountry = currentIpInfo.country_name;
            const ipCountryCode = currentIpInfo.country_code;

            // Rest of your existing logic...

            if (attachedFile) {
                const fileData = {
                    chatId,
                    selectedFile: attachedFile,
                    userEmail,
                    messageValue: newMessage.trim() ? newMessage : "File attached.",
                    ipInfo: currentIpInfo,
                    formattedTime: formattedTime
                }

                const result = await updateCustomerFiles(fileData);
                console.log("Function returned successfully [file upload function]:", result);

                if (!result) {
                    throw new Error("Failed to send message via function API");
                }
            } else if (newMessage.trim()) {
                const bodyData = {
                    chatId,
                    newMessage,
                    userEmail,
                    formattedTime,
                    ip,
                    ipCountry,
                    ipCountryCode,
                };

                const result = await sendMessage(bodyData);
                console.log("Function returned successfully:", result);

                if (!result) {
                    throw new Error("Failed to send message via function API");
                }
            }

            setNewMessage("");
            setAttachedFile(null);
            setLoadingSent(false);
        } catch (error) {
            console.error("Error sending message:", error);
            setLoadingSent(false);
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (!chatId || !isDetailView) {
            console.warn("chatId or isDetailView is not set. Messages cannot be fetched or scrolled.");
            return;
        }

        // Scroll to bottom when messages change
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, isDetailView]);

    // const invoiceData = '';

    // const baseFinalPrice = (basePrice) + (parseFloat(carData?.dimensionCubicMeters) * parseFloat(profitMap));
    // const finalPrice = ((baseFinalPrice + (inspectionToggle ? inspectionPrice || 300 : 0)));
    const renderTextWithLinks = (text) => {
        // Regular expression to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        if (!text) return null;

        const parts = text.split(urlRegex);
        const matches = text.match(urlRegex) || [];

        return (
            <>
                {parts.map((part, index) => {
                    // If this part is a URL, render it as a link
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
                    // Otherwise, render it as regular text
                    return <span key={index}>{part}</span>;
                })}
            </>
        );
    };
    const [lastChatId, setLastChatId] = useState(chatId);
    const [shouldScroll, setShouldScroll] = useState(false);

    // Detect chat change
    useEffect(() => {
        if (chatId !== lastChatId) {
            setShouldScroll(true);
            setLastChatId(chatId);
        }
    }, [chatId, lastChatId]);

    // Handle scrolling only when messages are ready AND we need to scroll
    useEffect(() => {
        if (shouldScroll && chatMessages.length > 0 && endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
            setShouldScroll(false);
        }
    }, [chatMessages, shouldScroll]);
    const { stockStatus, reservedTo } = vehicleStatus[contact?.carData?.stockID] || {};
    const isReservedOrSold = (stockStatus === "Reserved" || stockStatus === "Sold") && reservedTo !== userEmail


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
    // 3) find the matching currency (fallback to USD if nothing matches)
    const currencyInside =
        currencies.find((c) => c.code === selectedCurrencyCode)
        || currencies[0];

    // 4) do your price math with currency.value
    const basePrice =
        parseFloat(contact?.carData?.fobPrice)
        * parseFloat(contact?.currency.jpyToUsd);

    const baseFinalPrice = invoiceData?.paymentDetails.totalAmount ? parseFloat(invoiceData?.paymentDetails.totalAmount) - (contact?.inspection ? 300 : 0) :
        basePrice
        + parseFloat(contact?.carData?.dimensionCubicMeters)
        * parseFloat(contact?.freightPrice);

    const inspectionSurcharge = contact?.inspection === true ? 300 * currencyInside.value : 0;
    const insuranceSurcharge = contact?.insurance === true ? 50 * currencyInside.value : 0
    const finalPrice = (baseFinalPrice * currencyInside.value + inspectionSurcharge + insuranceSurcharge);


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
                                                        ? `${currency.symbol} ${Math.ceil(amount).toLocaleString()}`
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

                    onScrollCapture={(event) => {
                        if (event.target.scrollTop === 0) {
                            handleLoadMore();
                        }
                    }}

                    ref={scrollAreaRef} className="h-full p-4 custom-scroll bg-[#E5EBFE]"
                >

                    <div className="space-y-4 mt-8">
                        {chatMessages.slice().reverse().map((message, index) => (
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

                                                    <PreviewInvoice accountData={accountData} selectedChatData={contact} invoiceData={invoiceData} />
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

                <ChatInput accountData={accountData} loadingSent={loadingSent} setAttachedFile={setAttachedFile} fileInputRef={fileInputRef} attachedFile={attachedFile} handleFileUpload={handleFileUpload} userEmail={userEmail} chatId={chatId} newMessage={newMessage} setNewMessage={setNewMessage} handleSendMessage={handleSendMessage} isLoading={isLoading} />
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
    accountData
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
                <Button type="button" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
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