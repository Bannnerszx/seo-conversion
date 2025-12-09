"use client"
// 1. Updated import: Added 'parse' to existing 'format' import
import { format, parse } from "date-fns"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Calendar as CalendarIcon, Upload, RefreshCw, Paperclip, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
// 2. Removed: import moment from "moment"
import Modal from "@/app/components/Modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import WarningDialog from "./warningDialog"
import PayPalInvoiceBlock from "./PayPalInvoiceBlock"
import { getFirebaseFunctions } from "../../../../firebase/clientApp";

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB


export default function PaymentSlip({ context = 'payment', chatId, selectedChatData, userEmail, invoiceData }) {
    const selectedCurrencyCode = selectedChatData?.selectedCurrencyExchange; // e.g. "JPY"

    const totalUSD = invoiceData?.paymentDetails?.totalAmount; // assume this is a Number

    const currencies = [
        { code: "USD", symbol: "USD$", value: 1 },
        { code: "EUR", symbol: "€", value: selectedChatData?.currency.usdToEur },
        { code: "JPY", symbol: "¥", value: selectedChatData?.currency.usdToJpy },
        { code: "CAD", symbol: "CAD$", value: selectedChatData?.currency.usdToCad },
        { code: "AUD", symbol: "AUD$", value: selectedChatData?.currency.usdToAud },
        { code: "GBP", symbol: "GBP£", value: selectedChatData?.currency.usdToGbp },
        { code: "ZAR", symbol: "R", value: selectedChatData?.currency?.usdToGbp },
    ];
    const [isLoading, setIsLoading] = useState(false)

    const [date, setDate] = useState(null)

    const [payment, setPayment] = useState(false)
    const [paymentVisible, setPaymentVisible] = useState(false);

    const [isPreparing, setIsPreparing] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isPreparingSlip, setIsPreparingSlip] = useState(false);


    // Define animation classes
    const animateScaleIn = "transition-all duration-500 animate-[scaleIn_0.5s_ease-out]"
    const animateFadeIn = "transition-all duration-500 animate-[fadeIn_0.6s_ease-out]"
    const animateFadeInDelay = "transition-all duration-500 animate-[fadeIn_0.8s_ease-out]"
    const disableFutureDates = (date) => {
        return date > new Date()
    };
    const [nameOfRemitter, setNameOfRemitter] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [attachedFile, setAttachedFile] = useState(null);
    const [errors, setErrors] = useState({ name: false, date: false, file: false });
    const fileInputRef = useRef(null);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [warningOpen, setWarningOpen] = useState(false)
    const [warningMessage, setWarningMessage] = useState("")

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
            setWarningMessage(
                `File size (${sizeMB} MB) exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`
            )
            setWarningOpen(true)

            // clear the input so selecting the same file again will retrigger onChange
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
        }

        setAttachedFile(file)
    }
    // clear file error when user selects a file
    useEffect(() => {
        if (attachedFile && errors.file) {
            setErrors((e) => ({ ...e, file: false }));
        }
    }, [attachedFile]);
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
    // set an error flag for a field and keep it until user corrects it
    const triggerError = (field) => {
        setErrors((e) => ({ ...e, [field]: true }));
    };

    const clearError = (field) => {
        setErrors((e) => ({ ...e, [field]: false }));
    };

    function fetchWithTimeout(url, ms = 5000) {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), ms);
        return fetch(url, { signal: ac.signal }).finally(() => clearTimeout(t));
    }

    const prepareDependencies = useCallback(async () => {
        if (isReady || isPreparing) return;
        setIsPreparing(true);

        try {
            const [ipRes, timeRes] = await Promise.all([
                fetchWithTimeout("https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo"),
                fetchWithTimeout("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time")
            ]);
            if (!ipRes.ok || !timeRes.ok) throw new Error("Prefetch failed");

            const [freshIp, freshTime] = await Promise.all([ipRes.json(), timeRes.json()]);
            setIpInfo(freshIp);
            setTokyoTime(freshTime);
            setIsReady(true)
        } catch (_) {
            setIsReady(false);

        } finally {
            setIsPreparing(false)
        }
    }, [isReady, isPreparing]);

    useEffect(() => {
        prepareDependencies();
    }, [prepareDependencies])
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ipInfo, setIpInfo] = useState(null);
    const [tokyoTime, setTokyoTime] = useState(null);

    const handlePaymentSlip = async (e) => {
        e?.preventDefault?.();

        if (!isReady) {
            setIsPreparingSlip(true);
            try {
                await prepareDependencies();
            } finally {
                setIsPreparingSlip(false);
            }
            if (!isReady) return;
        }

        setPayment(true);
        setPaymentVisible(true);
    }


    useEffect(() => {
        let mounted = true;
        Promise.all([
            fetch("https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo").then(r => r.json()),
            fetch("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time").then(r => r.json()),
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

    async function fileToBase64Payload(file) {
        const arrayBuffer = await file.arrayBuffer();

        let binary = "";
        const bytes = new Uint8Array(arrayBuffer);
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        const base64 = btoa(binary);
        return { name: file.name, type: file.type || "application/octet-stream", data: base64 };
    }

    // 4. Removed the top-level call to httpsCallable
    // const callUpdatePaymentNotifications = httpsCallable(functions, "updatePaymentNotifications");


    //Idempotency helpers
    const rand = () =>
        (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `r_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    async function sha256Bytes(bytes) {
        try {
            const digest = await crypto.subtle.digest('SHA-256', bytes);
            return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch {
            let h = 0;
            for (let i = 0; i < bytes.length; i++) h = (h * 31 + bytes[i]) | 0;
            return `f_${(h >>> 0).toString(16)}`;
        }
    }

    async function hashFileId(file) {
        try {
            const buf = await file.arrayBuffer();
            const nameBytes = new TextEncoder().encode(`${file.name}|${file.size}|${file.lastModified}`);
            const combined = new Uint8Array(nameBytes.length + buf.byteLength);
            combined.set(nameBytes, 0);
            combined.set(new Uint8Array(buf), nameBytes.length);
            return await sha256Bytes(combined);
        } catch {
            return `${file.name}|${file.size}|${file.lastModified}`;
        }
    }

    async function hashTextId(text) {
        try {
            const enc = new TextEncoder().encode(text || '');
            return await sha256Bytes(enc);
        } catch {
            return `${(text || '').length}:${(text || '').slice(0, 16)}`;
        }
    }

    function markIdemPending(key, meta = {}) {
        try { localStorage.setItem(`idem:${key}`, JSON.stringify({ status: 'pending', ...meta })); } catch { }
    }
    function markIdemDone(key, meta = {}) {
        try { localStorage.setItem(`idem:${key}`, JSON.stringify({ status: 'completed', ...meta })); } catch { }
    }
    function isIdemDone(key) {
        try {
            const v = localStorage.getItem(`idem:${key}`);
            if (!v) return false;
            return JSON.parse(v).status === 'completed'
        } catch {
            return false;
        }
    }
    const sanitizeForDocId = (s) =>
        String(s)
            .replaceAll("/", "-")     // avoid Firestore path splits
            .replaceAll("\\", "-")    // just in case
            .trim();

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        // validate all fields and set errors together so UI updates predictably
        const nextErrors = { name: false, date: false, file: false };
        let hasError = false;

        if (!nameOfRemitter.trim()) {
            nextErrors.name = true;
            hasError = true;
        }
        if (!date) {
            nextErrors.date = true;
            hasError = true;
        }
        if (!attachedFile) {
            nextErrors.file = true;
            hasError = true;
        }

        setErrors(nextErrors);
        if (hasError) return;

        setIsSubmitting(true);
        try {
            const calendarETD = format(date, "yyyy/MM/dd");

            const fileId = await hashFileId(attachedFile);
            const nameId = await hashTextId(nameOfRemitter.trim());

            // KEEP calendarETD as-is (even if it's yyyy/MM/dd)
            const keyBase = `pay:${chatId}:${userEmail}:${calendarETD}:${nameId}:${fileId}`;

            // Only sanitize the final id used for Firestore
            const idempotencyKey = sanitizeForDocId(keyBase);
            if (isIdemDone(idempotencyKey)) {
                setIsSubmitting(false);
                return;
            }
            markIdemPending(idempotencyKey, { chatId, calendarETD, type: 'paymentSlip' });




            const messageData = `Wire Date: ${calendarETD}

Name of Remitter: ${nameOfRemitter}

${newMessage.trim()}
`;

            let currentIpInfo = ipInfo;
            let currentTokyoTime = tokyoTime;

            // quick refresh (non-blocking on failure)
            try {
                const fetchPromise = Promise.all([
                    fetch("https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo").then((r) => r.json()),
                    fetch("https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time").then((r) => r.json()),
                ]);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
                const [freshIp, freshTime] = await Promise.race([fetchPromise, timeoutPromise]);
                currentIpInfo = freshIp;
                currentTokyoTime = freshTime;
                setIpInfo(freshIp);
                setTokyoTime(freshTime);
            } catch {
                // use cached values
            }

            if (!currentIpInfo || !currentTokyoTime) {
                throw new Error("No IP info or time data available");
            }

            // 3. REPLACED MOMENT: Use date-fns parse and format
            // Old: moment(currentTokyoTime.datetime, "YYYY/MM/DD HH:mm:ss.SSS").format("YYYY/MM/DD [at] HH:mm:ss");
            const parsedDate = parse(currentTokyoTime.datetime, 'yyyy/MM/dd HH:mm:ss.SSS', new Date());
            const formattedTime = format(parsedDate, "yyyy/MM/dd 'at' HH:mm:ss");

            const selectedFilePayload = await fileToBase64Payload(attachedFile);

            // 5. Dynamic Loading inside handler
            const [functionsInstance, { httpsCallable }] = await Promise.all([
                getFirebaseFunctions(),
                import("firebase/functions")
            ]);
            const callUpdatePaymentNotifications = httpsCallable(functionsInstance, "updatePaymentNotifications");

            const res = await callUpdatePaymentNotifications({
                chatId,
                userEmail,
                messageValue: messageData,
                formattedTime,
                ipInfo: currentIpInfo,
                nameOfRemitter,
                calendarETD,
                selectedFile: selectedFilePayload,
                idempotencyKey
            })


            markIdemDone(idempotencyKey, { finishedAt: Date.now() });
            setNameOfRemitter("");
            setDate(null);
            setNewMessage("");
            setAttachedFile(null);
            setIsSubmitting(false);
            setPaymentVisible(false);
            setPayment(false)
        } catch (err) {
            console.error(err);
            // indicate there was a problem with submission; user should re-check fields
            setErrors({ name: true, date: true, file: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currency =
        currencies.find((c) => c.code === selectedCurrencyCode)
        || currencies[0];

    const convertedTotal = totalUSD * currency.value;
    const formattedTotal = `${currency.symbol}${Math.floor(convertedTotal).toLocaleString()}`;
    return (
        <>
            <WarningDialog
                open={warningOpen}
                onOpenChange={handleDialogOpenChange}
                title="File Size Warning"
                description={warningMessage}
                confirmText="OK"
            />
            <Button
                type="button"
                size="sm"
                onClick={handlePaymentSlip}
                onMouseEnter={() => { if (!isReady && !isPreparing) prepareDependencies(); }}
                onFocus={() => { if (!isReady && !isPreparing) prepareDependencies(); }}
                disabled={isPreparing || isPreparingSlip}
                aria-busy={isPreparing || isPreparingSlip}
                className="ml-2 font-medium text-green-600 border border-green-600 bg-white hover:bg-green-50"
            >
                {isPreparing || isPreparingSlip ? (
                    <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-green-600" />
                        Preparing…
                    </span>
                ) : (
                    "Payment Slip"
                )}
            </Button>

            {payment && (
                <Modal context={'payment'} showModal={paymentVisible} setShowModal={setPaymentVisible}>
                    <Card className="w-full !max-w-none relative animate-zoomIn bg-white max-h-[85vh] sm:max-h-none overflow-hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className="absolute right-2 top-2 h-8 w-8 rounded-full"
                            aria-label="Close"
                            onClick={() => setPaymentVisible(false)}
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {/* Sticky, compact header */}
                        <CardHeader className="text-center pb-2 pt-3 sticky top-0 bg-white z-10">
                            <CardTitle className="text-blue-600 text-lg font-bold">PAYMENT NOTIFICATIONS</CardTitle>
                            <div className="h-0.5 bg-blue-600 w-full mt-1 mb-2"></div>
                            <CardDescription className="text-black text-base font-medium">
                                Amount {formattedTotal}
                            </CardDescription>
                        </CardHeader>

                        {/* Scrollable content area on mobile */}
                        <CardContent className="space-y-3 px-4 pb-4 overflow-y-auto max-h-[calc(85vh-96px)] sm:max-h-none">
                            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal h-10 text-sm",
                                            !date && "text-muted-foreground",
                                            errors.date ? "border-red-500 animate-shake" : "border-gray-300"
                                        )}
                                        type="button"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                        {date ? format(date, "yyyy/MM/dd") : "WIRE DATE"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                                    <Calendar
                                        disabled={disableFutureDates}
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => { setDate(d); if (errors.date) clearError('date'); setIsDateOpen(false); }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.date && (
                                <p className="text-xs text-red-600 mt-1">Please select wire date.</p>
                            )}

                            <div>
                                <Input
                                    id="remitterName"
                                    placeholder="Name of Remitter"
                                    className={cn(
                                        "w-full h-10 text-sm",
                                        errors.name ? "border-red-500 animate-shake" : "border-gray-300"
                                    )}
                                    value={nameOfRemitter}
                                    onChange={(e) => { setNameOfRemitter(e.target.value); if (errors.name) clearError('name'); }}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-600 mt-1">Please enter remitter name.</p>
                                )}
                            </div>

                            <div>
                                <Textarea
                                    id="textMessage"
                                    placeholder="Text Message (optional)"
                                    className="min-h-[80px] text-sm border-gray-300"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-1">
                                {attachedFile && (
                                    <div className="p-2 bg-gray-50 rounded flex items-center justify-between">
                                        <div className="flex items-center space-x-2 min-w-0">
                                            <Paperclip className="h-4 w-4 text-gray-500 shrink-0" />
                                            <span className="text-sm font-medium truncate">
                                                <span title={attachedFile.name} className="inline-block max-w-[220px] truncate">
                                                    {attachedFile.name}
                                                </span>
                                                <span className="text-gray-500 text-xs ml-1">
                                                    ({(attachedFile.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setAttachedFile(null)}
                                            className="h-6 w-6 p-0 shrink-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Button
                                        className={cn(
                                            "w-full transition-all duration-200 h-10 text-sm",
                                            errors.file
                                                ? "border-2 border-red-500 bg-red-500 hover:bg-red-600 text-white"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                        )}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        type="button"
                                    >
                                        {errors.file ? (
                                            <>
                                                <AlertCircle className="mr-2 h-4 w-4" />
                                                Upload Failed - Try Again
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Upload Payment Slip
                                            </>
                                        )}
                                    </Button>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        aria-label="Upload file"
                                    />

                                    {errors.file && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Please upload a payment slip file.
                                        </p>
                                    )}

                                    <Button
                                        onClick={(e) => handleSendMessage(e)}
                                        disabled={isSubmitting}
                                        variant="outline"
                                        className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full h-10 text-sm"
                                        type="button"
                                    >
                                        {isSubmitting ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-blue-600 mx-auto" />
                                        ) : (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Send Notification
                                            </>
                                        )}
                                    </Button>

                                    <span className="block text-center text-xs">or</span>

                                    <PayPalInvoiceBlock chatId={chatId} invoiceNumber={selectedChatData?.invoiceNumber} carData={selectedChatData?.carData} renderTextWithLinks={''} message={''} invoiceData={invoiceData} userEmail={userEmail} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                </Modal>

            )}


        </>

    )
}