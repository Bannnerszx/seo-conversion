"use client"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertTriangle, X, Copy } from "lucide-react"
import Modal from "@/app/components/Modal"
import Loader from "@/app/components/Loader"
import moment from "moment"
import { firestore } from "../../../../firebase/clientApp";
import { runTransaction, doc, increment } from "firebase/firestore"
import { submitJackallClient, submitUserData } from "@/app/actions/actions";
import { FloatingAlertPortal } from "./floatingAlert"

export default function OrderButton({ ipInfo, tokyoTime, accountData, isOrderMounted, setIsOrderMounted, userEmail, chatId, selectedChatData, countryList, invoiceData }) {
    const [ordered, setOrdered] = useState(false)
    const [showAlert, setShowAlert] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
    // navigation to /chats/ordered removed — UI will stay on the current chat detail
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


    // const handleOrder = async () => {
    //     setIsLoading(true);
    //     setOrdered(true);
    //     setIsOrderMounted(true);
    //     router.push(`/chats/ordered/${chatId}`)
    //     try {


    //         // 2) format date
    //         const momentDate = moment(
    //             tokyoTime?.datetime,
    //             "YYYY/MM/DD HH:mm:ss.SSS"
    //         );
    //         const formattedSalesDate = momentDate.format("YYYY/MM/DD");

    //         // 3) allocate/retrieve salesInfoId
    //         const { resultingId, wasNew } = await processJackallSalesInfo(chatId);
    //         await submitJackallClient({
    //             userEmail,
    //             newClientId: accountData?.client_id,
    //             firstName: accountData?.textFirst,
    //             lastName: accountData?.textLast,
    //             zip: accountData?.textZip,
    //             street: accountData?.textStreet,
    //             city: accountData?.city,
    //             phoneNumber: accountData?.textPhoneNumber,
    //             countryName: accountData?.country,
    //             note: "",
    //         })

    //         // 4) only prepare & upload if it’s newly allocated
    //         const salesData = prepareSalesData(
    //             resultingId,
    //             formattedSalesDate,
    //             selectedChatData,
    //             accountData
    //         );

    //         // 1) If it's new, upload; if not, just log and skip upload
    //         if (wasNew) {
    //             await uploadJackallSalesInfoData([salesData]);
    //         } else {
    //             console.log("SalesInfo upload skipped; salesInfoId was already present.");
    //         }

    //         // 2) Always set the order item, regardless of wasNew
    //         const { data } = await setOrderItemFunction({ chatId, userEmail, ipInfo, tokyoTime, invoiceNumber: selectedChatData?.invoiceNumber, stockID: selectedChatData?.carData?.stockID });
    //         if (data.success) {
    //             console.log("✅ Ordered!");
    //             setIsLoading(false)
    //         } else {
    //             throw new Error("Function returned no success flag");
    //         }


    //         // 3) Then clean up
    //         await deleteFromTcvBoth();

    //     } catch (error) {
    //         console.error("Error in handleOrder:", error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // Define animation classes

    // const result = await setOrderItem(chatId, selectedChatData, userEmail)
    const navigatedToOrderedRef = useRef(false)

    const handleOrder = async () => {
        setIsLoading(true);
        setOrdered(true);
        setIsOrderMounted(true);
        try {
            // ---- STEP 1 Format date ----
            const momentDate = moment(tokyoTime?.datetime, "YYYY/MM/DD HH:mm:ss.SSS");
            const formattedSalesDate = momentDate.format('YYYY/MM/DD');

            //3) allocate/retrieve salesInfoId
            const { data } = await setOrderItemFunction({
                chatId,
                userEmail,
                ipInfo,
                tokyoTime,
                invoiceNumber: selectedChatData?.invoiceNumber,
                stockID: selectedChatData?.carData?.stockID
            });
            if (!data.success) {

                throw new Error("The order could not be confirmed by the server.")
            };
            console.log('Item reserved successfully in Firestore. Proceeding...');

            //----STEP 2: Proceed with other operations ONLY after successful reservation ----
            const { resultingId, wasNew } = await processJackallSalesInfo(chatId);
            await submitJackallClient({
                userEmail,
                newClientId: accountData?.client_id,
                firstName: accountData?.textFirst,
                lastName: accountData?.textLast,
                zip: accountData?.textZip,
                street: accountData?.textStreet,
                city: accountData?.city,
                phoneNumber: accountData?.textPhoneNumber,
                countryName: accountData?.country,
                note: ''
            })
            const salesData = prepareSalesData(resultingId, formattedSalesDate, selectedChatData, accountData);
            if (wasNew) {
                await uploadJackallSalesInfoData([salesData]);

            } else {
                console.log("SalesInfo upload skipped; salesInfoId was already present.")
            }

            // --- STEP 3: Final cleanup ---
            await deleteFromTcvBoth();

            // --- STEP 4: Update UI and navigate on FULL success ---
            console.log("Full order process complete!");
            setOrdered(true);
            setIsOrderMounted(true);
            // Perform a one-time navigation to /chats/ordered/:chatId to show ordered page
            try {
                if (typeof window !== 'undefined' && !navigatedToOrderedRef.current) {
                    const targetPath = `/chats/ordered/${chatId}`
                    const currentPath = window.location.pathname || ''
                    if (!currentPath.startsWith(targetPath)) {
                        navigatedToOrderedRef.current = true
                        // use location.assign to force a full navigation and let middleware show ordered URL
                        window.location.assign(targetPath)
                    } else {
                        navigatedToOrderedRef.current = true
                    }
                }
            } catch (navErr) {
                console.error('Navigation to ordered failed:', navErr)
            }

        } catch (error) {
            console.log("Order process failed:", error.message);
            setShowAlert(true);
            setIsLoading(false);
            setOrdered(false);
            setIsOrderMounted(false);
        } finally {
            setIsLoading(false)
        }
    }

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

    const selectedCurrencyCode = selectedChatData?.selectedCurrencyExchange;
    const currencies = [
        { code: "USD", symbol: "USD$", value: 1 },
        { code: "EUR", symbol: "€", value: selectedChatData?.currency.usdToEur },
        { code: "JPY", symbol: "¥", value: selectedChatData?.currency.usdToJpy },
        { code: "CAD", symbol: "CAD$", value: selectedChatData?.currency.usdToCad },
        { code: "AUD", symbol: "AUD$", value: selectedChatData?.currency.usdToAud },
        { code: "GBP", symbol: "GBP£", value: selectedChatData?.currency.usdToGbp },
        { code: "ZAR", symbol: "R", value: selectedChatData?.currency.usdToZar },
    ];
    // 3) find the matching currency (fallback to USD if nothing matches)
    const currency =
        currencies.find((c) => c.code === selectedCurrencyCode)
        || currencies[0];

    // 4) do your price math with currency.value
    const basePrice =
        parseFloat(selectedChatData?.carData?.fobPrice)
        * parseFloat(selectedChatData?.currency.jpyToUsd);

    const baseFinalPrice = invoiceData?.paymentDetails.totalAmount ? parseFloat(invoiceData?.paymentDetails.totalAmount) - (selectedChatData?.inspection ? 300 : 0) :
        basePrice
        + parseFloat(selectedChatData?.carData?.dimensionCubicMeters)
        * parseFloat(selectedChatData?.freightPrice);

    const inspectionSurcharge = selectedChatData?.inspection ? 300 * currency.value : 0;
    const insuranceSurcharge = selectedChatData?.insurance ? 50 * currency.value : 0
    const finalPrice = (baseFinalPrice * currency.value + inspectionSurcharge + insuranceSurcharge);
    return (
        <>

            <Button id="rmj_order_confirm" size="sm" onClick={handleOrder} className="ml-2 font-medium bg-red-500 hover:bg-red-600 text-white">
                Order Now
            </Button>
            <FloatingAlertPortal
                show={showAlert}
                onClose={() => setShowAlert(false)}
                duration={5000} // 5 seconds
            />
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
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <div className="flex gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-red-800">Critical Requirements</h4>
                                                <p className="text-red-700 text-sm mt-1">
                                                    Both invoice number and charge type must be correct or payment will fail.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoice Number */}
                                    <div className="bg-gray-50 border rounded-lg p-3">
                                        <label className="block text-sm font-medium mb-2">Invoice Number:</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-white border rounded px-3 py-2 font-mono text-lg font-bold text-blue-600">
                                                RMJ-{selectedChatData?.invoiceNumber}
                                            </code>
                                            <Button onClick={copyInvoiceNumber} variant="outline" size="sm">
                                                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Payment Steps */}
                                    <div>
                                        <h4 className="font-semibold mb-2">Payment Steps:</h4>
                                        <ol className="list-decimal list-inside space-y-2 text-sm">
                                            <li>
                                                Transfer{" "}
                                                <strong>
                                                    {currency.symbol} {Math.ceil(finalPrice).toLocaleString()}
                                                </strong>{" "}
                                                to our account
                                            </li>
                                            <li className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-500">
                                                <strong>Add invoice number to reference: RMJ-{selectedChatData?.invoiceNumber}</strong>
                                            </li>
                                            <li className="bg-red-50 p-2 rounded border-l-2 border-red-500">
                                                <strong>Set charge type to "OUR" (not "SHA") - you pay transfer fee</strong>
                                                <div className="text-red-700 text-xs mt-1">
                                                    Kindly be advised that future transactions with deductions upon receipt may be considered insufficient
                                                    payments.
                                                </div>
                                            </li>
                                            <li>Send transfer receipt</li>
                                        </ol>
                                    </div>

                                    {/* Action Button */}
                                    <Button onClick={() => setIsOrderMounted(false)} className="w-full bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="mr-2 h-4 w-4" />I Understand - Proceed
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (<Loader />)}

                </Modal>

            )}


        </>

    )
}

