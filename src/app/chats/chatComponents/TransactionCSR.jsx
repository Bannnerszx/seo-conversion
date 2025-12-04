"use client"
import { getFirebaseFunctions, getFirebaseFirestore } from "../../../../firebase/clientApp"
import Link from "next/link"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { subscribeToChatDoc } from "./chatSubscriptions"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Send, X, Download, CheckCircle, Loader, Loader2, CreditCard } from "lucide-react"
import { toast } from 'sonner';
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
import PayPalInvoiceBlock from "./PayPalInvoiceBlock"

// import { AssistiveTouch } from "./AssistiveTouch"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
// Network helpers to improve reliability on slow (3G) networks
const DEFAULT_NETWORK_TIMEOUT = 15000; // 15s per attempt
const DEFAULT_NETWORK_RETRIES = 2; // number of retries after the first attempt

function callWithTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
    ]);
}

async function retryableCall(fn, arg, options = {}) {
    // allow automatic scaling for slow networks (3g/2g)
    const connection = typeof navigator !== 'undefined' && navigator.connection ? navigator.connection : null;
    const effective = connection && connection.effectiveType ? connection.effectiveType : null;

    // defaults
    let retries = options.retries ?? DEFAULT_NETWORK_RETRIES;
    let timeout = options.timeout ?? DEFAULT_NETWORK_TIMEOUT;
    const backoff = options.backoff ?? 1000;

    if (effective) {
        // increase timeouts and retries on slow connections
        if (effective.includes('3g')) {
            timeout = Math.max(timeout, 30000); // 30s
            retries = Math.max(retries, 3);
        } else if (effective.includes('2g') || effective.includes('slow-2g')) {
            timeout = Math.max(timeout, 60000); // 60s
            retries = Math.max(retries, 4);
        }
        // if downlink / rtt available we could further tune; keep simple for now
    }
    let attempt = 0;
    while (true) {
        try {
            // fn is expected to be a callable (like an httpsCallable result) that returns a Promise
            return await callWithTimeout(fn(arg), timeout);
        } catch (err) {
            attempt++;
            if (attempt > retries) {
                throw err;
            }
            // exponential backoff with tiny jitter
            const delay = backoff * Math.pow(2, attempt - 1) + Math.round(Math.random() * 200);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
}

// Warm-up helper: safely repeat light-weight fetches to prime network connections
async function warmUpNetwork() {
    try {
        const fetchJson = (url) => () => fetch(url).then(r => {
            if (!r.ok) throw new Error('Network response was not ok');
            return r.json();
        });

        // perform two quick fetches spaced out to avoid hammering but to warm DNS/TCP
        await retryableCall(fetchJson("https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo"), null).catch(() => { });
        await new Promise((r) => setTimeout(r, 500));
        await retryableCall(fetchJson("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time"), null).catch(() => { });
    } catch (e) {
        // don't escalate: warm-up is best-effort
        // console.debug('Warm-up failed', e);
    }
}

export default function TransactionCSR({ loadingBooking, isLoadingTransaction, vehicleStatus, accountData, isMobileView, isDetailView, handleBackToList, bookingData, countryList, currency, dueDate, handleLoadMore, invoiceData, userEmail, contact, messages, onSendMessage, isLoading, chatId, chatMessages }) {

    const [newMessage, setNewMessage] = useState("");
    // 3. Remove top-level httpsCallable definitions
    // const sendMessage = httpsCallable(functions, 'sendMessage');
    // const updateCustomerFiles = httpsCallable(functions, 'updateCustomerFiles');

    const scrollAreaRef = useRef(null)
    const endOfMessagesRef = useRef(null);
    const startOfMessagesRef = useRef(null);
    const fileInputRef = useRef(null);
    const [attachedFile, setAttachedFile] = useState(null);
    const [loadingSent, setLoadingSent] = useState(false)
    const [warningOpen, setWarningOpen] = useState(false)
    const [warningMessage, setWarningMessage] = useState("")
    const [pendingSendPayload, setPendingSendPayload] = useState(null);
    const autoRetryRef = useRef({ running: false, attempts: 0, maxAttempts: 4 });

    const startAutoRetry = (pending, options = {}) => {
        const maxAttempts = options.maxAttempts ?? 4;
        const baseDelay = options.baseDelay ?? 2000;
        if (!pending) return;
        setPendingSendPayload(pending);
        if (autoRetryRef.current.running) return;
        autoRetryRef.current = { running: true, attempts: 0, maxAttempts };

        toast("Network error — will retry automatically", { id: `retry-${Date.now()}` });

        const attemptFn = async () => {
            autoRetryRef.current.attempts += 1;
            const attempt = autoRetryRef.current.attempts;
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.round(Math.random() * 300);
            toast(`Retry attempt ${attempt}/${maxAttempts}...`, { id: `retry-attempt-${Date.now()}` });
            try {
                // 4. Dynamic loading for retry
                const [functionsInstance, { httpsCallable }] = await Promise.all([
                    getFirebaseFunctions(),
                    import("firebase/functions")
                ]);

                if (pending.type === 'file') {
                    const updateCustomerFiles = httpsCallable(functionsInstance, 'updateCustomerFiles');
                    await retryableCall(updateCustomerFiles, pending.payload, { retries: 1, timeout: 30000 });
                } else {
                    const sendMessage = httpsCallable(functionsInstance, 'sendMessage');
                    await retryableCall(sendMessage, pending.payload, { retries: 1, timeout: 20000 });
                }
                toast.success('Message uploaded successfully');
                setPendingSendPayload(null);
                autoRetryRef.current.running = false;
                return;
            } catch (err) {
                console.error('Auto-retry attempt failed:', err);
                if (autoRetryRef.current.attempts >= maxAttempts) {
                    toast.error('Automatic retries failed — please refresh the page to try again.');
                    autoRetryRef.current.running = false;
                    return;
                }
                setTimeout(attemptFn, delay);
            }
        };
        setTimeout(attemptFn, 500);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            setWarningMessage(
                `File size (${sizeMB} MB) exceeds the ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)} MB limit.\nTip: You can just take a screenshot and re-upload it instead.`
            );
            setWarningOpen(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
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

    useEffect(() => {
        let mounted = true;
        const fetchJson = (url) => () => fetch(url).then(r => {
            if (!r.ok) throw new Error('Network response was not ok');
            return r.json();
        });

        (async () => {
            try {
                const [ip, time] = await Promise.all([
                    retryableCall(fetchJson("https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo")),
                    retryableCall(fetchJson("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time")),
                ]);
                if (!mounted) return;
                setIpInfo(ip ?? null);
                setTokyoTime(time ?? null);
            } catch (err) {
                if (!mounted) return;
                console.error("Preload fetch failed", err);
            }
            try { warmUpNetwork(); } catch (e) { }
        })();
        return () => { mounted = false; };
    }, []);


    function formatTokyoLocal(ymdHmsMsStr) {
        if (!ymdHmsMsStr) return '';
        const m = ymdHmsMsStr.match(
            /(\d{4}\/\d{2}\/\d{2}).*?(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?/
        );
        if (!m) return ymdHmsMsStr;

        const [, date, hh, mm, ss, msRaw = ''] = m;
        const ms = msRaw ? msRaw.padStart(3, '0').slice(0, 3) : '000';
        return `${date} at ${hh}:${mm}:${ss}.${ms}`;
    }

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

    const rand = () =>
        (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `r_${Data.now()}_${Math.random().toString(36).slice(2)}`;

    async function hashFile(file) {
        try {
            const buf = await file.arrayBuffer();
            const digest = await crypto.subtle.digest('SHA-256', buf);
            return Array.from(new Uint8Array(digest))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            return `${file.name}|${file.size}|${file.lastModified}`;
        }
    }

    async function hashText(text) {
        try {
            const enc = new TextEncoder().encode(text);
            const digest = await crypto.subtle.digest('SHA-256', enc);
            return Array.from(new Uint8Array(digest))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            return `${text.length}|${text.slice(0, 16)}`
        }
    }

    function saveIdem(key, meta = {}) {
        try { localStorage.setItem(`idem:${key}`, JSON.stringify({ status: 'pending', ...meta })); } catch { }
    }
    function completeIdem(key, meta = {}) {
        try { localStorage.setItem(`idem:${key}`, JSON.stringify({ status: 'completed', ...meta })); } catch { }
    }

    function isCompletedIdem(key) {
        try {
            const v = localStorage.getItem(`idem:${key}`);
            if (!v) return false;
            const j = JSON.parse(v);
            return j.status === 'completed';
        } catch (error) {
            return false;
        }
    }
    const sanitizeForDocId = (s) => String(s).replaceAll("/", "-").replaceAll("\\", "-").trim();

    const handleSendMessage = async (e) => {
        if (loadingSent || isLoading || (!newMessage.trim() && !attachedFile)) {
            return;
        }
        setLoadingSent(true);
        e.preventDefault();

        if (!newMessage.trim() && !attachedFile) {
            setLoadingSent(false);
            return;
        }

        let idempotencyKey = null;
        try {
            if (attachedFile) {
                const fileHash = await hashFile(attachedFile);
                idempotencyKey = sanitizeForDocId(`file:${chatId}:${userEmail}:${fileHash}`)
            } else {
                const text = newMessage.trim();
                const textHash = await hashText(text || 'File attached.');
                idempotencyKey = sanitizeForDocId(`text:${chatId}:${userEmail}:${textHash}`)
            }
        } catch (err) {
            idempotencyKey = sanitizeForDocId(`fallback:${chatId}:${userEmail}`);
        }

        if (isCompletedIdem(idempotencyKey)) {
            setLoadingSent(false);
            return;
        }
        saveIdem(idempotencyKey, { chatId, type: attachedFile ? 'file' : 'text' });

        try {
            let result;
            let currentIpInfo = ipInfo;
            let currentTokyoTime = tokyoTime;

            try {
                const connection = typeof navigator !== 'undefined' && navigator.connection ? navigator.connection : null;
                const effective = connection && connection.effectiveType ? connection.effectiveType : null;
                if (effective && (effective.includes('3g') || effective.includes('2g'))) {
                    warmUpNetwork().catch(() => { });
                }
                const fetchJson = (url) => () => fetch(url).then(r => {
                    if (!r.ok) throw new Error('Network response was not ok');
                    return r.json();
                })

                const [freshIp, fresTime] = await Promise.all([
                    retryableCall(fetchJson("https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo")),
                    retryableCall(fetchJson("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time"))
                ]);

                currentIpInfo = freshIp;
                currentTokyoTime = fresTime;
                setIpInfo(freshIp);
                setTokyoTime(fresTime);
            } catch (error) {
                console.warn("Failed to fetch fresh data, using cached values:", error);
            }

            if (!currentIpInfo || !currentTokyoTime) {
                throw new Error("No IP infor or time data available");
            }

            const formattedTime = formatTokyoLocal(currentTokyoTime?.datetime);
            const ip = currentIpInfo.ip;
            const ipCountry = currentIpInfo.country_name;
            const ipCountryCode = currentIpInfo.country_code;

            // 5. Dynamic loading for sending message
            const [functionsInstance, { httpsCallable }] = await Promise.all([
                getFirebaseFunctions(),
                import("firebase/functions")
            ]);

            if (attachedFile) {
                const fileData = {
                    chatId,
                    selectedFile: attachedFile,
                    userEmail,
                    messageValue: newMessage.trim() ? newMessage : "File attached.",
                    ipInfo: currentIpInfo,
                    formattedTime,
                    idempotencyKey,
                };

                try {
                    const updateCustomerFiles = httpsCallable(functionsInstance, 'updateCustomerFiles');
                    result = await retryableCall(updateCustomerFiles, fileData, { retries: 3, timeout: 20000, backoff: 1500 });
                    console.log("Function returned successfully [file upload function]:", result);
                    if (!result) throw new Error("Failed to send message via function API");
                } catch (error) {
                    const pending = { type: 'file', payload: { ...fileData, idempotencyKey } };
                    startAutoRetry(pending, { maxAttempts: 5, baseDelay: 3000 });
                    throw error
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
                    idempotencyKey,
                };

                try {
                    const sendMessage = httpsCallable(functionsInstance, 'sendMessage');
                    result = await retryableCall(sendMessage, bodyData, { retries: 2, timeout: 15000 });
                    console.log("Function returned successfully:", result);
                    if (!result) throw new Error("Failed to send message via function API");
                } catch (error) {
                    const pending = { type: 'text', payload: { ...bodyData, idempotencyKey } };
                    startAutoRetry(pending, { maxAttempts: 4, baseDelay: 2000 });
                    throw error
                }
            }
            completeIdem(idempotencyKey, { finishedAt: Date.now() });

            setNewMessage('');
            setAttachedFile(null);
            if (fileInputRef && fileInputRef.current) fileInputRef.current.value = "";
            setLoadingSent(false);
        } catch (error) {
            console.error("Error sending message:", error);
            setLoadingSent(false);
        }
    }

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
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
            setShouldScroll(false);
        }

    }, [chatMessages, shouldScroll]);


    const stockID = contact?.carData?.stockID;
    const hit = stockID ? vehicleStatus.find(v => String(v.id) === String(stockID)) : undefined;
    const { stockStatus, reservedTo } = hit ?? {};
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
    const currencyInside = currencies.find((c) => c.code === selectedCurrencyCode) || currencies[0];

    const basePrice = parseFloat(contact?.carData?.fobPrice) * parseFloat(contact?.currency.jpyToUsd);
    const baseFinalPrice = invoiceData?.paymentDetails.totalAmount ? parseFloat(invoiceData?.paymentDetails.totalAmount) - (contact?.inspection ? 300 : 0) :
        basePrice + parseFloat(contact?.carData?.dimensionCubicMeters) * parseFloat(contact?.freightPrice);

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
                                                const [firestore, { doc, updateDoc }] = await Promise.all([
                                                    getFirebaseFirestore(),
                                                    import('firebase/firestore')
                                                ]);
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

                {/* send failures will be retried automatically and surfaced via toasts */}

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
                                        className={`max-w-[75%] p-3 rounded-lg ${message.messageType === "paypalPayment"
                                            ? "bg-white text-inherit w-[355px]"
                                            : message.sender === userEmail
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

                                                    <PreviewInvoice tokyoTime={tokyoTime} ipInfo={ipInfo} userEmail={userEmail} chatId={chatId} accountData={accountData} selectedChatData={contact} invoiceData={invoiceData} />
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
                                        {message.messageType === "paypalPayment" && (
                                            <>
                                                <p
                                                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                    className={message.sender === userEmail ? "text-white" : "text-gray-800"}
                                                >
                                                    {renderTextWithLinks(message.text)}
                                                </p>
                                                <PayPalInvoiceBlock tokyoTime={tokyoTime} chatId={chatId} invoiceNumber={contact?.invoiceNumber} carData={contact?.carData} invoiceData={invoiceData} renderTextWithLinks={renderTextWithLinks} message={message} userEmail={userEmail} />
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

                                                {message.text.includes('Shipping Instruction') && (
                                                    loadingBooking ? (
                                                        <Button
                                                            variant="default"
                                                            disabled
                                                            aria-busy="true"
                                                            className="gap-2 bg-purple-50 text-purple-600 border-purple-200"
                                                        >
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            <span>Loading...</span>
                                                        </Button>
                                                    ) : bookingData?.sI?.url ? (
                                                        <Button
                                                            variant="default"
                                                            className="gap-2 bg-purple-50 text-purple-600 border-purpl-200 hover:bg-purple-100"
                                                            onClick={() => window.open(bookingData?.sI?.url, '_bank')}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            <span>Download SI</span>
                                                        </Button>
                                                    ) : null
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
                        className="h-6 w-6 p-0"
                        onClick={() => {
                            setAttachedFile(null);
                            // also clear the hidden file input so selecting the same file again fires onChange
                            if (fileInputRef && fileInputRef.current) fileInputRef.current.value = "";
                        }}
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