"use client"
import { functions } from "../../../../firebase/clientApp"
import { httpsCallable } from "firebase/functions"
import { useState, useEffect, useRef, use } from "react"
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

export default function OrderButton({ handlePreviewInvoiceModal, context, setIsHidden, ipInfo, tokyoTime, accountData, isOrderMounted, setIsOrderMounted, userEmail, chatId, selectedChatData, countryList, invoiceData, anchor = false }) {
    // ... (useEffect and other logic remains unchanged) ...
    useEffect(() => {
        if (typeof document === 'undefined') return;
        try {
            if (isOrderMounted) {
                document.body.classList.add('rmj-order-open');
            } else {
                document.body.classList.remove('rmj-order-open');
            }
        } catch (e) { }
        return () => {
            try { document.body.classList.remove('rmj-order-open'); } catch (e) { }
        };
    }, [isOrderMounted]);
    const [ordered, setOrdered] = useState(false)
    const [showAlert, setShowAlert] = useState(false);
    const [isLoading, setIsLoading] = useState(false)

    // ... (Existing API and helper functions: uploadJackallSalesInfoData, prepareSalesData, etc. - KEEP UNCHANGED) ...
    const uploadJackallSalesInfoData = async (salesArray) => {
        try {
            const response = await fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/uploadJackallSalesInfo", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(salesArray),
            });
            if (!response.ok) console.error("Failed to append data to CSV:", response.statusText);
        } catch (error) { console.error("Upload error:", error); }
    };
    // ... (Keep prepareSalesData, assignSalesInfoIdViaCallable, assignSalesInfoIdViaLocalTxn, getOrAssignedSalesInfoId, deleteFromTcvBoth unchanged) ...
    const prepareSalesData = (newId, formattedSalesDate, selectedChatData, accountData) => ({ id: `${newId}`, stock_system_id: selectedChatData?.carData?.jackall_id || "", sales_date: formattedSalesDate, fob: 0, freight: 0, insurance: 0, inspection: 0, cost_name1: "0", cost1: 0, cost_name2: "0", cost2: 0, cost_name3: "0", cost3: 0, cost_name4: "0", cost4: 0, cost_name5: "0", cost5: 0, coupon_discount: 0, price_discount: 0, subtotal: 0, clients: accountData.client_id || "", sales_pending: "1", });
    const assignSalesInfoIdViaCallable = async (chatId) => { const callable = httpsCallable(functions, 'processJackallSalesInfo'); const res = await callable({ chatId }); return res.data };
    const assignSalesInfoIdViaLocalTxn = async (chatId) => { const countsDocRef = doc(firestore, 'counts', 'jackall_ids'); const chatDocRef = doc(firestore, 'chats', chatId); const { resultindId, wasNew } = await runTransaction(firestore, async (tx) => { const [countsSnap, chatSnap] = await Promise.all([tx.get(countsDocRef), tx.get(chatDocRef)]); if (!chatSnap.exists()) throw new Error(`Chat ${chatId} missing`); if (!countsSnap.exists()) throw new Error('counts/jackall_ids missing'); const chatData = chatSnap.data() || {}; if (chatData.salesInfoId != null) { return { resultingId: chatData.salesInfoId, wasNew: false } } const currentId = countsSnap.get('sales-info-id') ?? 0; const nextId = currentId + 1; tx.update(chatDocRef, { salesInfoId: nextId }); tx.update(countsDocRef, { 'sales-info-id': increment(1) }); return { resultingId: nextId, wasNew: true } }); return { resultindId, wasNew } };
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const getOrAssignedSalesInfoId = async (chatId) => { const serverPromise = assignSalesInfoIdViaCallable(chatId); const localPromise = (async () => { await delay(150); return assignSalesInfoIdViaLocalTxn(chatId) })(); let winner; try { winner = await Promise.any([serverPromise, localPromise]) } catch (error) { const [srv, loc] = await Promise.allSettled([serverPromise, localPromise]); const srvErr = srv.status === 'rejected' ? srv.reason?.message : null; const locErr = loc.status === 'rejected' ? loc.reason?.message : null; throw new Error(`Failed to assign salesInfoId (server: ${srvErr || 'ok'}, local: ${locErr || 'ok'})`); } Promise.allSettled([serverPromise, localPromise]).catch(() => { }); return winner; }
    const deleteFromTcvBoth = async () => { const apis = ['https://asia-northeast2-real-motor-japan.cloudfunctions.net/uploadToTcvSalesF', 'https://asia-northeast2-real-motor-japan.cloudfunctions.net/uploadToTcvSales']; const payload = [{ ItemType: 'Car', CommandType: 'Delete', ReferenceNo: selectedChatData?.carData?.referenceNumber || '', Title: '', Comments: '', Price: '', Currency: 'JPY', IsPayTrade: 'True', IsNew: 'False', IsAccident: 'False', IsDomestic: 'False', IsInternational: 'True', MakeID: '', ModelID: '', ChassisNo: '', GradeTrim: '', Year: '', Month: '', Mileage: '', ExteriorColorID: '', InteriorColorID: '', Door: '', BodyStyleID1: '', BodyStyleID2: '', Displacement: '', TransmissionID: '', DriveTypeID: '', Passengers: '', SteeringID: '', FuelTypeID: '', VINSerialNo: '', Length: '', Width: '', Height: '', MechanicalProblem: '', OptionIDs: '', Images: '', MileageOption: '', Staff: 'sales2', Comment: '', IsPostedOption: 'False' }]; for (const api of apis) { try { const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify(payload), }); if (!response.ok) { throw new Error(`Server at ${api} returned error: ${response.status}`); } } catch (error) { console.error(`Error sending data to ${api}:`, error); } } };

    const setOrderItemFunction = httpsCallable(functions, 'setOrderItem')
    const navigatedToOrderedRef = useRef(false)





    // ... (performOrder and handleConfirm unchanged) ...
    const performOrder = async (skipReservation = false, currentTokyoTime = null) => {
        // Use fresh time if provided, otherwise fallback to prop
        const timeToUse = currentTokyoTime || tokyoTime;
        const momentDate = moment(timeToUse?.datetime, "YYYY/MM/DD HH:mm:ss.SSS");
        const formattedSalesDate = momentDate.format('YYYY/MM/DD');

        if (!skipReservation) {
            const { data } = await setOrderItemFunction({
                chatId,
                userEmail,
                ipInfo, // Note: This might still be stale if called directly, but handleConfirm handles the main flow
                tokyoTime: timeToUse,
                invoiceNumber: selectedChatData?.invoiceNumber,
                stockID: selectedChatData?.carData?.stockID
            });
            if (!data.success) {
                throw new Error("The order could not be confirmed by the server.")
            }
        }
        const { resultingId, wasNew } = await getOrAssignedSalesInfoId(chatId);
        await submitJackallClient({ userEmail, newClientId: accountData?.client_id, firstName: accountData?.textFirst, lastName: accountData?.textLast, zip: accountData?.textZip, street: accountData?.textStreet, city: accountData?.city, phoneNumber: accountData?.textPhoneNumber, countryName: accountData?.country, note: '' });
        const salesData = prepareSalesData(resultingId, formattedSalesDate, selectedChatData, accountData);
        if (wasNew) {
            await uploadJackallSalesInfoData([salesData]);
        } else {
            console.log("SalesInfo upload skipped; salesInfoId was already present.")
        }
        await deleteFromTcvBoth();
        return true
    }
    const handleConfirm = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            // Fetch fresh data immediately when button is clicked
            const [ipResp, timeResp] = await Promise.all([
                fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo"),
                fetch("https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time")
            ]);

            // Fallback to props if fetch fails, but usually we want the fresh data
            const freshIpInfo = ipResp.ok ? await ipResp.json() : ipInfo;
            const freshTokyoTime = timeResp.ok ? await timeResp.json() : tokyoTime;

            const { data } = await setOrderItemFunction({
                chatId,
                userEmail,
                ipInfo: freshIpInfo,
                tokyoTime: freshTokyoTime,
                invoiceNumber: selectedChatData?.invoiceNumber,
                stockID: selectedChatData?.carData?.stockID,
                // ADD THESE LINES:
                carName: selectedChatData?.carData?.carName || "Unknown Car",
                imageUrl: selectedChatData?.carData?.imageUrl || "",
                referenceNumber: selectedChatData?.carData?.referenceNumber || "" // or referenceNumber depending on your object structure
            });

            if (!data.success) {
                throw new Error("The order could not be reserved by the server.")
            }
            setOrdered(true);
            setIsOrderMounted(false);
            handlePreviewInvoiceModal(false);
            if (typeof window !== 'undefined' && !navigatedToOrderedRef.current) {
                const targetPath = `/chats/ordered/${chatId}`;
                navigatedToOrderedRef.current = true;
                window.location.assign(targetPath)
            }

            // Pass the fresh time to performOrder
            performOrder(true, freshTokyoTime).catch((err) => {
                console.error('Background order continuation failed:', err);
                try { setShowAlert(true) } catch (e) { }
            })
        } catch (error) {
            console.log("Order reservation failed:", error?.message || error);
            setShowAlert(true)
        } finally {
            setIsLoading(false)
        }
    }

    const [copied, setCopied] = useState(false)
    const copyInvoiceNumber = async () => { try { await navigator.clipboard.writeText(`RMJ-${selectedChatData?.invoiceNumber}`); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch (err) { console.error("Failed to copy:", err) } }

    const selectedCurrencyCode = selectedChatData?.selectedCurrencyExchange;
    const toNumber = (v, fallback = 0) => {
        if (v == null) return fallback;
        if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
        if (typeof v === 'string') {
            const n = parseFloat(v.replace(/[^\d.-]/g, ''));
            return Number.isFinite(n) ? n : fallback;
        }
        return fallback;
    };
    const formatMoney = (amount, symbol) =>
        Number.isFinite(amount) ? `${symbol} ${Math.trunc(amount).toLocaleString()}` : 'ASK';

    // --- currency setup ---
    const currencies = [
        { code: "USD", symbol: "USD$", value: 1 },
        { code: "EUR", symbol: "€", value: selectedChatData?.currency?.usdToEur },
        { code: "JPY", symbol: "¥", value: selectedChatData?.currency?.usdToJpy },
        { code: "CAD", symbol: "CAD$", value: selectedChatData?.currency?.usdToCad },
        { code: "AUD", symbol: "AUD$", value: selectedChatData?.currency?.usdToAud },
        { code: "GBP", symbol: "GBP£", value: selectedChatData?.currency?.usdToGbp },
        { code: "ZAR", symbol: "R", value: selectedChatData?.currency?.usdToZar },
    ];

    const pickCurrency = (code) =>
        currencies.find(c => c.code === code) || currencies[0];

    const rates = {
        USD: 1,
        EUR: toNumber(selectedChatData?.currency?.usdToEur, NaN),
        JPY: toNumber(selectedChatData?.currency?.usdToJpy, NaN),
        CAD: toNumber(selectedChatData?.currency?.usdToCad, NaN),
        AUD: toNumber(selectedChatData?.currency?.usdToAud, NaN),
        GBP: toNumber(selectedChatData?.currency?.usdToGbp, NaN),
        ZAR: toNumber(selectedChatData?.currency?.usdToZar, NaN),
        jpyToUsd: toNumber(selectedChatData?.currency?.jpyToUsd, NaN),
    };

    const fromUSD = (usdAmount, toCode = 'USD') => {
        const usd = toNumber(usdAmount, NaN);
        if (!Number.isFinite(usd)) return NaN;
        const mul = rates[toCode] ?? 1;
        return Number.isFinite(mul) ? usd * mul : NaN;
    };

    // --- core compute ---
    const fobPriceUSD = toNumber(selectedChatData?.carData?.fobPrice) *
        (Number.isFinite(rates.jpyToUsd) ? rates.jpyToUsd : 1);
    const dimM3 = toNumber(selectedChatData?.carData?.dimensionCubicMeters);
    const freightUSD = toNumber(selectedChatData?.freightPrice);
    const fallbackUSD = (Number.isFinite(fobPriceUSD) ? fobPriceUSD : 0) +
        (Number.isFinite(dimM3) ? dimM3 : 0) *
        (Number.isFinite(freightUSD) ? freightUSD : 0);

    const invoiceTotalUSD = toNumber(invoiceData?.paymentDetails?.totalAmount, NaN);
    const hasInvoiceTotal = Number.isFinite(invoiceTotalUSD);

    const targetCurrencyCode = hasInvoiceTotal && invoiceData?.selectedCurrencyExchange
        ? invoiceData.selectedCurrencyExchange
        : pickCurrency(selectedCurrencyCode).code;

    const targetCurrency = pickCurrency(targetCurrencyCode);

    const baseFinalUSD = hasInvoiceTotal ? invoiceTotalUSD : fallbackUSD;

    let amountInTarget = fromUSD(baseFinalUSD, targetCurrencyCode);

    // --- UPDATE 1: Add Clearing & Delivery to fallback calculation ---
    if (!hasInvoiceTotal) {
        // Use inspectionPrice from chat if available
        const inspPrice = selectedChatData?.inspectionPrice ? selectedChatData.inspectionPrice : 300;

        const inspection = selectedChatData?.inspection ? fromUSD(inspPrice, targetCurrencyCode) : 0;
        const insurance = selectedChatData?.insurance ? fromUSD(50, targetCurrencyCode) : 0;

        // New costs
        const clearing = selectedChatData?.clearing ? fromUSD(selectedChatData.clearingPrice || 0, targetCurrencyCode) : 0;
        const delivery = selectedChatData?.delivery ? fromUSD(selectedChatData.deliveryPrice || 0, targetCurrencyCode) : 0;

        amountInTarget = toNumber(amountInTarget, 0) + inspection + insurance + clearing + delivery;
    }
    // ----------------------------------------------------------------

    const finalDisplay = formatMoney(amountInTarget, targetCurrency.symbol);

    return (
        <>
            <Button
                id="rmj_order_confirm"
                type="button"
                size={anchor ? 'lg' : (context === 'invoice' ? 'default' : 'sm')}
                onClick={() => {
                    setOrdered(false)
                    setIsOrderMounted(true)
                    setIsHidden(true)
                }}
                className={
                    anchor
                        ? "ml-2 font-medium bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 px-6 py-3 text-lg rounded-md shadow-lg"
                        : (context === 'invoice'
                            ? "ml-2 font-medium bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                            : "ml-2 font-medium bg-red-500 hover:bg-red-600 text-white")
                }
            >
                {context === 'invoice' ? (
                    <span className={`flex items-center gap-2 ${anchor ? 'text-lg' : ''}`}>
                        <svg className={anchor ? "w-5 h-5" : "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Order Now
                    </span>
                ) : (
                    'Order Now'
                )}
            </Button>
            <FloatingAlertPortal show={showAlert} onClose={() => setShowAlert(false)} duration={5000} />
            {isOrderMounted && (
                <Modal context={'order'} showModal={isOrderMounted} setShowModal={setIsOrderMounted}>
                    {isLoading === false ? (
                        <Card className="w-full max-w-lg border-4 border-red-500 shadow-2xl max-h-[95vh] overflow-y-auto bg-blac">
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
                                            <Button type="button" onClick={copyInvoiceNumber} variant="outline" size="sm">
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
                                                    {finalDisplay}
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
                                    <Button type="button" onClick={handleConfirm} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {isLoading ? 'Processing...' : 'I Understand - Proceed'}
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