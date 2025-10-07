"use client"
import { format } from "date-fns"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Calendar as CalendarIcon, Upload, RefreshCw, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import moment from "moment"
import Modal from "@/app/components/Modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { updatePaymentNotifications } from "@/app/actions/actions"
import WarningDialog from "./warningDialog"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB


export default function PaymentSlip({ chatId, selectedChatData, userEmail, invoiceData }) {
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

    const handlePaymentSlip = async () => {
        setPayment(true);
        setPaymentVisible(true);
        // try {
        //     // const result = await setOrderItem(chatId, selectedChatData);
        //     console.log('Order result:', result);
        // } catch (error) {
        //     console.error('Error setting order item:', error);
        // }
    };
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
    const triggerError = (field) => {
        setErrors((e) => ({ ...e, [field]: true }));
        setTimeout(() => setErrors((e) => ({ ...e, [field]: false })), 400);
    };
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ipInfo, setIpInfo] = useState(null);
    const [tokyoTime, setTokyoTime] = useState(null);



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





    const handleSendMessage = async (e) => {
        e.preventDefault();
        setPaymentVisible(false);

        // ⏸️ 1) Don't do anything if we're already in-flight
        if (isSubmitting) return;

        // clear previous field errors
        setErrors({ name: false, date: false, file: false });

        // 2) validation
        if (!nameOfRemitter.trim()) {
            triggerError("name");
            return; // note: we haven't flipped isSubmitting yet, so no spinner lock
        }
        if (!date) {
            triggerError("date");
            return;
        }
        if (!attachedFile) {
            triggerError("file");
            return;
        }

        // 3) safe to start submitting
        setIsSubmitting(true);
        try {
            // prepare your payload
            const calendarETD = format(date, "yyyy/MM/dd");
            const messageData = `Wire Date: ${calendarETD}

Name of Remitter: ${nameOfRemitter}

${newMessage.trim()}
`;

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

            const formattedTime = moment(currentTokyoTime.datetime, "YYYY/MM/DD HH:mm:ss.SSS")
                .format("YYYY/MM/DD [at] HH:mm:ss.SSS");

            // your core update call
            await updatePaymentNotifications({
                nameOfRemitter,
                calendarETD,
                selectedFile: attachedFile,
                chatId,
                userEmail,
                messageValue: messageData,
                ipInfo: currentIpInfo,
                formattedTime,
            });

            // clear form on success
            setNameOfRemitter("");
            setDate(null);
            setNewMessage("");
            setAttachedFile(null);

        } catch (err) {
            console.error(err);
            // re-use your triggerError calls if you want to shake the fields
            triggerError("name");
            triggerError("date");
            triggerError("file");
        } finally {
            // 4) ALWAYS unlock the form
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
                size="sm"
                onClick={handlePaymentSlip}
                className="ml-2 font-medium text-green-600 border border-green-600 bg-white hover:bg-green-50"
            >
                Payment Slip
            </Button>

            {payment && (
                <Modal context={'order'} showModal={paymentVisible} setShowModal={setPaymentVisible}>
                    <Card className="w-full !max-w-none relative animate-zoomIn bg-white">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className="absolute right-2 top-2 h-8 w-8 rounded-full"
                            aria-label="Close"
                            onClick={() => setPaymentVisible(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-blue-600 text-xl font-bold">PAYMENT NOTIFICATIONS</CardTitle>
                            <div className="h-0.5 bg-blue-600 w-full mt-1 mb-4"></div>
                            <CardDescription className="text-black text-lg font-medium">
                                Amount {formattedTotal}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground",
                                            errors.date ? "border-red-500 animate-shake" : " border-gray-300"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                        {date ? format(date, "yyyy/MM/dd") : "WIRE DATE"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                                    <Calendar disabled={disableFutureDates} mode="single" selected={date} onSelect={setDate} initialFocus />
                                </PopoverContent>
                            </Popover>

                            <div>
                                <Input
                                    id="remitterName"
                                    placeholder="Name of Remitter"
                                    className={cn(
                                        "w-full",
                                        errors.name
                                            ? "border-red-500 animate-shake"
                                            : "border-gray-300"
                                    )}
                                    value={nameOfRemitter}
                                    onChange={(e) => setNameOfRemitter(e.target.value)}
                                />
                            </div>

                            <div>
                                <Textarea
                                    id="textMessage"
                                    placeholder="Text Message (optional)"
                                    className="min-h-[100px] border-gray-300"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-2">
                                {attachedFile && (
                                    <div className="mb-3 p-2 bg-gray-50 rounded flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Paperclip className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium">
                                                <span title={attachedFile.name} className="inline-block max-w-[250px] truncate">
                                                    {attachedFile.name}
                                                </span>
                                                <span className="text-gray-500 text-xs ml-1">
                                                    ({(attachedFile.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </span>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setAttachedFile(null)} className="h-6 w-6 p-0">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <Button className="bg-blue-600 hover:bg-blue-700 w-full" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Payment Slip
                                </Button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" aria-label="Upload file" />
                                <Button
                                    onClick={(e) => handleSendMessage(e)}
                                    disabled={isSubmitting}
                                    variant="outline"
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full"
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
                            </div>
                        </CardContent>
                    </Card>

                </Modal>

            )}


        </>

    )
}

