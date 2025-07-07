"use client"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertTriangle, X, Bell, Copy } from "lucide-react"
import { setOrderItem } from "@/app/actions/actions"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Modal from "@/app/components/Modal"
import InvoiceAmendmentForm from "./amendInvoice"
import Loader from "@/app/components/Loader"
import moment from "moment"
import { firestore } from "../../../../firebase/clientApp";
import { runTransaction, doc, increment } from "firebase/firestore"


export default function OrderButton({ accountData, isOrderMounted, setIsOrderMounted, userEmail, chatId, selectedChatData, countryList }) {
    const [ordered, setOrdered] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    // useEffect(() => {
    //     onMount?.()
    //     return () => onUnmount?.()
    // }, [])

    //jackall payment section (disable first since it is not prod mode)

    const uploadJackallSalesInfoData = async (salesArray) => {
        try {
            const response = await fetch(
                "https://asia-northeast2-real-motor-japan.cloudfunctions.net/uploadJackallSalesInfo",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(salesArray),
                }
            );
            if (!response.ok) {
                console.error("Failed to append data to CSV:", response.statusText);
            }
        } catch (error) {
            console.error("Upload error:", error);
        }
    };

    // 2) Build the object, given newId & formatted date
    const prepareSalesData = (
        newId,
        formattedSalesDate,
        selectedChatData,
        accountData
    ) => ({
        id: `${newId}`,
        stock_system_id: selectedChatData?.carData?.jackall_id || "",
        sales_date: formattedSalesDate,
        fob: 0,
        freight: 0,
        insurance: 0,
        inspection: 0,
        cost_name1: "0",
        cost1: 0,
        cost_name2: "0",
        cost2: 0,
        cost_name3: "0",
        cost3: 0,
        cost_name4: "0",
        cost4: 0,
        cost_name5: "0",
        cost5: 0,
        coupon_discount: 0,
        price_discount: 0,
        subtotal: 0,
        clients: accountData.client_id || "",
        sales_pending: "1",
    });

    // 3) Atomically allocate or retrieve salesInfoId
    const processJackallSalesInfo = async (chatId) => {
        const countsDocRef = doc(firestore, "counts", "jackall_ids");
        const chatDocRef = doc(firestore, "chats", chatId);

        const { resultingId, wasNew } = await runTransaction(
            firestore,
            async (tx) => {
                const countsSnap = await tx.get(countsDocRef);
                const chatSnap = await tx.get(chatDocRef);

                if (!countsSnap.exists()) {
                    throw new Error("counts/jackall_ids missing");
                }
                if (!chatSnap.exists()) {
                    throw new Error(`Chat ${chatId} missing`);
                }

                const chatData = chatSnap.data();
                // already has one?
                if (chatData.salesInfoId != null) {
                    return { resultingId: chatData.salesInfoId, wasNew: false };
                }

                // allocate new
                const currentId = countsSnap.data()["sales-info-id"];
                const nextId = currentId + 1;
                tx.update(chatDocRef, { salesInfoId: nextId });
                tx.update(countsDocRef, { "sales-info-id": increment(1) });
                return { resultingId: nextId, wasNew: true };
            }
        );


        return { resultingId, wasNew };
    };
    const deleteFromTcvBoth = async () => {
        const apis = ['https://asia-northeast2-real-motor-japan.cloudfunctions.net/uploadToTcvSalesF', 'https://asia-northeast2-real-motor-japan.cloudfunctions.net/uploadToTcvSales'];

        const payload = [{
            ItemType: 'Car',
            CommandType: 'Delete',
            ReferenceNo: selectedChatData?.carData?.referenceNumber || '',
            Title: '',
            Comments: '',
            Price: '',
            Currency: 'JPY',
            IsPayTrade: 'True',
            IsNew: 'False',
            IsAccident: 'False',
            IsDomestic: 'False',
            IsInternational: 'True',
            MakeID: '',
            ModelID: '',
            ChassisNo: '',
            GradeTrim: '',
            Year: '',
            Month: '',
            Mileage: '',
            ExteriorColorID: '',
            InteriorColorID: '',
            Door: '',
            BodyStyleID1: '',
            BodyStyleID2: '',
            Displacement: '',
            TransmissionID: '',
            DriveTypeID: '',
            Passengers: '',
            SteeringID: '',
            FuelTypeID: '',
            VINSerialNo: '',
            Length: '',
            Width: '',
            Height: '',
            MechanicalProblem: '',
            OptionIDs: '',
            Images: '',
            MileageOption: '',
            Staff: 'sales2',
            Comment: '',
            IsPostedOption: 'False'
        }];

        for (const api of apis) {
            try {

                console.log('Payload:', JSON.stringify(payload, null, 2));

                const response = await fetch(api, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const responseText = await response.text();

                if (!response.ok) {
                    throw new Error(`Server at ${api} returned error: ${response.status}`);
                }

            } catch (error) {
                console.error(`Error sending data to ${api}:`, error);
            }
        }
    };
    // 4) Combined in your order handler

    const setOrderItemFunction = httpsCallable(functions, 'setOrderItem')


    const handleOrder = async () => {
        setIsLoading(true);
        setOrdered(true);
        setIsOrderMounted(true);
        router.push(`/chats/ordered/${chatId}`)
        try {
            // 1) fetch IP & Tokyo time
            const [ipResp, timeResp] = await Promise.all([
                fetch(
                    "https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo"
                ),
                fetch(
                    "https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time"
                ),
            ]);
            const [ipInfo, tokyoTime] = await Promise.all([
                ipResp.json(),
                timeResp.json(),
            ]);


            // 2) format date
            const momentDate = moment(
                tokyoTime?.datetime,
                "YYYY/MM/DD HH:mm:ss.SSS"
            );
            const formattedSalesDate = momentDate.format("YYYY/MM/DD");

            // 3) allocate/retrieve salesInfoId
            const { resultingId, wasNew } = await processJackallSalesInfo(chatId);

            // 4) only prepare & upload if it’s newly allocated
            const salesData = prepareSalesData(
                resultingId,
                formattedSalesDate,
                selectedChatData,
                accountData
            );

            // 1) If it's new, upload; if not, just log and skip upload
            if (wasNew) {
                await uploadJackallSalesInfoData([salesData]);
            } else {
                console.log("SalesInfo upload skipped; salesInfoId was already present.");
            }

            // 2) Always set the order item, regardless of wasNew
            const { data } = await setOrderItemFunction({  chatId, userEmail, ipInfo, tokyoTime, invoiceNumber: selectedChatData?.invoiceNumber, stockID: selectedChatData?.carData?.stockID });
            if (data.success) {
                console.log("✅ Ordered!");
                setIsLoading(false)
            } else {
                throw new Error("Function returned no success flag");
            }

            console.log("Order result:", data.success);

            // 3) Then clean up
            await deleteFromTcvBoth();

        } catch (error) {
            console.error("Error in handleOrder:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Define animation classes
    const animateScaleIn = "transition-all duration-500 animate-[scaleIn_0.5s_ease-out]"
    const animateFadeIn = "transition-all duration-500 animate-[fadeIn_0.6s_ease-out]"
    const animateFadeInDelay = "transition-all duration-500 animate-[fadeIn_0.8s_ease-out]"
    // const result = await setOrderItem(chatId, selectedChatData, userEmail)
    const [copied, setCopied] = useState(false)

    const copyInvoiceNumber = async () => {
        try {
            await navigator.clipboard.writeText(`RMJ-${selectedChatData?.invoiceNumber}`)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }
    return (
        <>

            <Button size="sm" onClick={handleOrder} className="ml-2 font-medium bg-red-500 hover:bg-red-600 text-white">
                Order Now
            </Button>

            {ordered && (
                <Modal context={'order'} showModal={isOrderMounted} setShowModal={() => setIsOrderMounted(true)}>
                    {isLoading === false ? (
                        <Card className="w-full max-w-lg border-4 border-red-500 shadow-2xl max-h-[95vh] overflow-y-auto">
                            <CardContent className="p-0">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 sm:p-4 flex items-center justify-between animate-pulse">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="bg-white/20 p-1.5 sm:p-2 rounded-full">
                                            <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base sm:text-lg">CRITICAL PAYMENT INSTRUCTION</h3>
                                            <p className="text-red-100 text-xs sm:text-sm">Please read carefully before proceeding</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setOrdered(false)}
                                        className="text-white hover:bg-white/20 p-1 sm:p-2"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Content */}
                                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                    {/* Warning Message */}
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 animate-bounce" />
                                            <div>
                                                <h4 className="font-semibold text-yellow-800 mb-1 sm:mb-2 text-sm sm:text-base">
                                                    IMPORTANT: Include Invoice Number in Bank Transfer
                                                </h4>
                                                <p className="text-yellow-700 text-xs sm:text-sm leading-relaxed">
                                                    When making your bank transfer, you <strong>MUST</strong> include the invoice number in the
                                                    transfer description/reference field. This is essential for us to identify your payment and
                                                    process your order.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoice Number */}
                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 sm:p-4">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                            Your Invoice Number:
                                        </label>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            <code className="flex-1 bg-white border border-gray-300 rounded px-2 sm:px-3 py-2 font-mono text-sm sm:text-lg font-bold text-blue-600 text-center sm:text-left">
                                                {`RMJ-${selectedChatData?.invoiceNumber}`}
                                            </code>
                                            <Button
                                                onClick={copyInvoiceNumber}
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center justify-center gap-2 bg-transparent text-xs sm:text-sm py-2"
                                            >
                                                {copied ? (
                                                    <>
                                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Instructions */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Payment Instructions:</h4>
                                        <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                                            <li>Copy the invoice number above</li>
                                            <li>Go to your bank's online banking or visit a branch</li>
                                            <li>
                                                Make a transfer for <strong>$18,500</strong> to our account
                                            </li>
                                            <li className="bg-red-50 p-2 sm:p-3 rounded border-l-4 border-red-400 animate-pulse">
                                                <strong className="text-red-800">
                                                    PASTE THE INVOICE NUMBER ({`RMJ-${selectedChatData?.invoiceNumber}`}) in the transfer description/reference field
                                                </strong>
                                            </li>
                                            <li>Send us the transfer receipt via email or chat</li>
                                        </ol>
                                    </div>

                                    {/* Warning Box */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 animate-pulse">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-xs sm:text-sm">
                                                <p className="font-semibold text-red-800 mb-1">
                                                    ⚠️ Without the invoice number, your payment cannot be processed!
                                                </p>
                                                <p className="text-red-700">
                                                    This may cause delays in shipping your vehicle. Please double-check that you've included the
                                                    invoice number before confirming the transfer.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-4">
                                        <Button
                                            onClick={() => setIsOrderMounted(false)}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-sm sm:text-base"
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />I Understand - Proceed to Payment
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={copyInvoiceNumber}
                                            className="w-full bg-transparent text-sm sm:text-base py-3"
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Invoice Number Again
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (<Loader />)}

                </Modal>

            )}


        </>

    )
}

