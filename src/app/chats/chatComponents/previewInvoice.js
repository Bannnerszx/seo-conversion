import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, Image } from "react-native-web";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Download, Car, Loader2, } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '../../../../firebase/clientApp';
import { usePathname } from 'next/navigation';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { toast } from 'sonner';
// import { captureRef } from 'react-native-view-shot';
// import QRCode from 'react-native-qrcode-svg';

import Loader from '@/app/components/Loader';
import Modal from '@/app/components/Modal';
import OrderButton from './confirmOrderModal';

async function blobToBase64(blob) {
    const ab = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary)
}

const PreviewInvoice = ({ countryList, ipInfo, tokyoTime, preloadError, refetchPreloads, vehicleStatus = {}, messageText, chatId, selectedChatData, invoiceData, context, userEmail, accountData }) => {
    const [isHidden, setIsHidden] = useState(false);





    let formattedIssuingDate;
    let formattedDueDate;
    const mobileViewBreakpoint = 768;
    // npm install html2canvas jspdf
    // import jsPDF from 'jspdf';
    // import html2canvas from 'html2canvas';
    // const image = imageLogo
    // const hanko = hankoOnline
    const [imageLoaded, setImageLoaded] = useState(false)

    const [previewInvoiceVisible, setPreviewInvoiceVisible] = useState(false);
    const [screenWidth, setScreenWidth] = useState(0);
    const [screenHeight, setScreenHeight] = useState(0);

    useEffect(() => {
        const getDims = () => {
            const w = window.innerWidth;
            // visualViewport gives the *actual* visible height on mobile as the URL bar shows/hides
            const h = window.visualViewport?.height ?? window.innerHeight;
            setScreenWidth(Math.round(w));
            setScreenHeight(Math.round(h));
        };

        // rAF to avoid layout thrash during rapid resizes
        let rafId = 0;
        const onResize = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(getDims);
        };

        // initial
        getDims();

        // listeners
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        // track dynamic viewport height on mobile
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', onResize);
            window.visualViewport.addEventListener('scroll', onResize);
        }

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', onResize);
                window.visualViewport.removeEventListener('scroll', onResize);
            }
        };
    }, []);

    const [isPreviewHovered, setIsPreviewHovered] = useState(false);

    const invoiceRef = useRef(null);
    const qrCodeRef = useRef(null);
    const [invoiceImageUri, setInvoiceImageUri] = useState('');
    const hoverPreviewIn = () => setIsPreviewHovered(true);
    const hoverPreviewOut = () => setIsPreviewHovered(false);
    const [firstCaptureUri, setFirstCaptureUri] = useState('');
    const [capturedImageUri, setCapturedImageUri] = useState('');
    // const [vehicleImageUri, setVehicleImageUri] = useState(globalImageUrl);
    const [featuresTrueCount, setFeaturesTrueCount] = useState(0);
    const [rerenderState, setRerenderState] = useState(0);
    const [imagePreviewKey, setImagePreviewKey] = useState(0);

    const handlePreviewInvoiceModal = (shouldOpen) => {
        setPreviewInvoiceVisible(shouldOpen);
        if (!shouldOpen) {
            setCapturedImageUri('');
        }
    };
    //order button inside invoice
    const [isOrderMounted, setIsOrderMounted] = useState(false)

    const stockID = selectedChatData?.carData?.stockID
    const stepValue = selectedChatData?.stepIndicator?.value ?? 0
    const isCancelled =
        selectedChatData && "isCancelled" in selectedChatData
            ? !!selectedChatData.isCancelled
            : false

    const { stockStatus, reservedTo } = (stockID && vehicleStatus?.[stockID]) || {}
    const isReservedOrSold =
        (stockStatus === "Reserved" || stockStatus === "Sold") &&
        reservedTo !== userEmail
    const isOrderPrereqsReady =
        !!ipInfo &&
        !!tokyoTime &&
        !!accountData &&
        !!selectedChatData &&
        Array.isArray(countryList) &&
        countryList.length > 0
    // ✅ Payment phase ONLY when step >= 3
    const shouldShowPayment = stepValue >= 3

    const renderButtons = () => {
        if (isCancelled) return null;
        if (isReservedOrSold) {
            return (
                <Button
                    variant='outline'
                    size='sm'
                    className='text-amber-600 border-amber-600 hover:bg-amber-50'
                    onClick={onBrowseOtherVehicles}
                >
                    <Car className='mr-2 h-4 w-4' />
                    Browse Similar Vehicles
                </Button>
            )
        }

        if (stepValue === 2) {
            if (!isOrderPrereqsReady) {
                return (
                    <div className='flex items-center gap-2'>
                        <Button variant="secondary" size="sm" disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Preparing...
                        </Button>
                        {preloadError && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refetchPreloads}
                                className="border-amber-600 text-amber-700"
                            >
                                Retry
                            </Button>
                        )}

                    </div>
                )
            }
            return (
                <OrderButton
                    context={'order'}
                    ipInfo={ipInfo}
                    tokyoTime={tokyoTime}
                    accountData={accountData}
                    chatId={chatId}
                    selectedChatData={selectedChatData}
                    countryList={countryList}
                    userEmail={userEmail}
                    invoiceData={invoiceData}
                    isOrderMounted={isOrderMounted}
                    setIsOrderMounted={setIsOrderMounted}
                    setIsHidden={setIsHidden}
                    handlePreviewInvoiceModal={handlePreviewInvoiceModal}
                />
            )
        }
    }
    //order button inside invoice

    function countTrueValuesInCarData(invoiceData) {
        let count = 0;

        // Check if carData exists in invoiceData
        if (invoiceData?.carData) {
            // List of fields to check within carData
            const fields = ['interior', 'exterior', 'safetySystem', 'comfort', 'sellingPoints'];

            fields.forEach(field => {
                if (invoiceData?.carData[field]) {
                    // Count true values in each field of carData
                    count += Object.values(invoiceData?.carData[field]).filter(value => value === true).length;
                }
            });
        }

        return count;
    }

    useEffect(() => {

        if (previewInvoiceVisible) {
            setRerenderState(rerenderState + 1);
        }
    }, [previewInvoiceVisible])


    useEffect(() => {
        let cancelled = false;

        async function captureImageAsync() {
            if (!invoiceRef.current || !invoiceData) return;

            // wait a frame so layout/webfonts settle
            await new Promise(r => requestAnimationFrame(() => r()));

            // dynamic import so it’s not in the initial bundle
            const mod = await import('html2canvas');
            const html2canvas = mod.default || mod;

            const el = invoiceRef.current;
            const scale = 1; // tweak 0.8–1.5 for quality vs size

            const canvas = await html2canvas(el, {
                scale,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#fff',
                windowWidth: el.scrollWidth,
                windowHeight: el.scrollHeight,
            });

            if (cancelled) return;

            const imageUri = canvas.toDataURL('image/jpeg', 0.9);
            setFeaturesTrueCount(countTrueValuesInCarData(invoiceData));
            setCapturedImageUri(imageUri);
        }

        captureImageAsync();

        return () => { cancelled = true; };
    }, [invoiceRef.current]); // <- not invoiceRef.current



    useEffect(() => {
        setCapturedImageUri(capturedImageUri);
    }, [capturedImageUri]);

    const captureImage = async () => {
        try {
            const el = invoiceRef.current;
            if (!el) throw new Error('invoiceRef missing');

            // Load only when needed
            const html2canvas = (await import('html2canvas')).default || (await import('html2canvas'));

            // Tweak these for quality vs size
            const scale = 1; // 0.8–1.5 is a good range
            const width = el.scrollWidth;
            const height = el.scrollHeight;

            const canvas = await html2canvas(el, {
                scale,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#fff',
                windowWidth: width,
                windowHeight: height,
                // If your element uses webfonts, give them time to load first
                // onclone: (doc) => { /* optional */ },
            });

            // JPEG quality: 0.7–0.9 usually looks good, keeps size down
            const imageUri = canvas.toDataURL('image/jpeg', 0.9);
            return imageUri;
        } catch (error) {
            console.error('Error capturing view:', error);
            return null;
        }
    };


    const createPDF = async () => {
        const el = invoiceRef.current;
        if (!el) {
            console.error('No element to capture');
            return;
        }

        try {
            // Load libs only when needed
            const [{ jsPDF }, html2canvas] = await Promise.all([
                import('jspdf').then(m => ({ jsPDF: m.jsPDF || m.default })),
                import('html2canvas').then(m => m.default || m),
            ]);

            const scale = 1; // tweak for quality vs size
            const canvas = await html2canvas(el, {
                scale,
                useCORS: true,           // helpful if images/fonts are cross-origin
                allowTaint: false,
                backgroundColor: '#fff', // avoid transparent to black issues
                windowWidth: el.scrollWidth,
                windowHeight: el.scrollHeight,
            });

            const imageData = canvas.toDataURL('image/jpeg', 0.9);

            // A4 in mm
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Fit width, keep aspect
            const imgProps = pdf.getImageProperties(imageData);
            const ratio = imgProps.height / imgProps.width;
            const imgWidth = pageWidth;
            const imgHeight = imgWidth * ratio;

            // If content is taller than one page, add pages
            let y = 0;
            while (y < imgHeight) {
                if (y > 0) pdf.addPage();
                pdf.addImage(
                    imageData,
                    'JPEG',
                    0,
                    -y * (pageHeight / imgHeight), // shift viewport
                    imgWidth,
                    imgHeight,
                    undefined,
                    'FAST'
                );
                y += pageHeight;
            }

            const filename =
                (selectedChatData?.stepIndicator?.value ?? 0) < 3
                    ? `Proforma Invoice (${invoiceData?.carData?.carName} [${invoiceData?.carData?.referenceNumber}]) (A4 Paper Size).pdf`
                    : `Invoice No. ${selectedChatData?.invoiceNumber} (A4 Paper Size).pdf`;

            pdf.save(filename);
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
    };


    const handleCaptureAndCreatePDF = async () => {
        const capturedImageUri = await captureImage();
        if (capturedImageUri) {
            await createPDF(capturedImageUri);
        }

        handlePreviewInvoiceModal(false);
    };


    if (invoiceData) {
        const issuingDateString = invoiceData?.bankInformations?.issuingDate;
        const dueDateString = invoiceData?.bankInformations?.dueDate;
        const issuingDateObject = new Date(issuingDateString);
        const dueDateObject = new Date(dueDateString);


        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        formattedIssuingDate = issuingDateObject?.toLocaleDateString(undefined, options);
        formattedDueDate = dueDateObject?.toLocaleDateString(undefined, options);

    }

    const originalWidth = 794;
    const originalHeight = 1123;


    const originalSmallWidth = 794;
    const originalSmallHeight = 1123;

    const newWidth = 2480;
    const newHeight = 3508;

    const smallWidth = 377;
    const smallHeight = 541;

    const smallWidthScaleFactor = smallWidth / originalSmallWidth;
    const smallHeightScaleFactor = smallHeight / originalSmallHeight;

    const widthScaleFactor = newWidth / originalWidth;
    const heightScaleFactor = newHeight / originalHeight;

    const openImage = () => {

        const imageWindow = window.open();
        imageWindow.document.write(`
                <style>
                    body {
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        overflow: hidden;
                    }
                    img {
                        width: 595px;
                        height: 842px;
                        object-fit: contain;
                        transition: transform 0.25s ease;
                        cursor: zoom-in; /* Set cursor to magnifying glass */
                    }
                    .zoomed {
                        transform: scale(3);
                        transform-origin: center;
                        cursor: zoom-out; /* Change cursor to indicate zooming out */
                    }
                </style>
                <img id="zoomableImage" src="${capturedImageUri}" alt="Base64 Image" draggable="false" />
                <script>
                    const image = document.getElementById('zoomableImage');
    
                    image.addEventListener('mousedown', function(e) {
                        const rect = this.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
    
                        // Set the transform origin to the mouse position
                        this.style.transformOrigin = \`\${x}px \${y}px\`;
                        this.classList.add('zoomed');
                    });
    
                    document.addEventListener('mouseup', function() {
                        image.classList.remove('zoomed');
                    });
                </script>
            `);

    };


    const s2ab = (s) => {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    };


    const freightCalculation = ((selectedChatData?.m3 ? selectedChatData?.m3 :
        (selectedChatData?.carData && selectedChatData?.carData?.dimensionCubicMeters ?
            selectedChatData?.carData?.dimensionCubicMeters : 0)) *
        Number(selectedChatData?.freightPrice));

    const totalPriceCalculation = (selectedChatData?.fobPrice ? selectedChatData?.fobPrice :
        (selectedChatData?.carData && selectedChatData?.carData?.fobPrice ?
            selectedChatData?.carData?.fobPrice : 0) *
        (selectedChatData?.jpyToUsd ? selectedChatData?.jpyToUsd :
            (selectedChatData?.currency && selectedChatData?.currency.jpyToUsd ?
                selectedChatData?.currency.jpyToUsd : 0))) + freightCalculation;

    const convertedCurrency = (baseValue) => {
        // Ensure baseValue is a valid number
        const baseValueNumber = Number(baseValue);

        if (isNaN(baseValueNumber)) {
            return 'Invalid base value';
        }

        const numberFormatOptions = {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        };

        if (invoiceData.selectedCurrencyExchange == 'None' || !invoiceData.selectedCurrencyExchange || invoiceData.selectedCurrencyExchange == 'USD') {
            return `$${Math.round(baseValueNumber).toLocaleString('en-US', numberFormatOptions)}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'JPY') {
            const jpyValue = baseValueNumber * Number(selectedChatData?.currency.usdToJpy);
            return `¥${Math.round(jpyValue).toLocaleString('en-US', numberFormatOptions)}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'EUR') {
            const euroValue = baseValueNumber * Number(selectedChatData?.currency.usdToEur);
            return `€${Math.round(euroValue).toLocaleString('en-US', numberFormatOptions)}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'AUD') {
            const audValue = baseValueNumber * Number(selectedChatData?.currency.usdToAud);
            return `A$${Math.round(audValue).toLocaleString('en-US', numberFormatOptions)}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'GBP') {
            const gbpValue = baseValueNumber * Number(selectedChatData?.currency.usdToGbp);
            return `£${Math.round(gbpValue).toLocaleString('en-US', numberFormatOptions)}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'CAD') {
            const cadValue = baseValueNumber * Number(selectedChatData?.currency.usdToCad);
            return `C$${Math.round(cadValue).toLocaleString('en-US', numberFormatOptions)}`;
        }

        // Add a default return value if none of the conditions are met
        return `$${Math.round(baseValueNumber).toLocaleString('en-US', numberFormatOptions)}`;
    };

    const totalPriceCalculated = () => {

        const totalAdditionalPrice = invoiceData.paymentDetails.additionalPrice.reduce((total, price) => {
            const converted = Number(price); // Convert each price using your currency conversion function
            const numericPart = price.replace(/[^0-9.]/g, ''); // Remove non-numeric characters, assuming decimal numbers
            return total + parseFloat(numericPart); // Add the numeric value to the total
        }, 0);

        const totalUsd = ((Number(invoiceData.paymentDetails.fobPrice)
            + Number(invoiceData.paymentDetails.freightPrice)
            + (invoiceData.paymentDetails.inspectionIsChecked
                ? (Number(invoiceData.paymentDetails.inspectionPrice))
                : 0)
            + (invoiceData.paymentDetails.incoterms == 'CIF'
                ? Number(invoiceData.paymentDetails.insurancePrice)
                : 0)
            + totalAdditionalPrice))
            // * Number(invoiceData.currency.jpyToEur)
            ;

        const totalJpy = ((Number(invoiceData.paymentDetails.fobPrice)
            + Number(invoiceData.paymentDetails.freightPrice)
            + (invoiceData.paymentDetails.inspectionIsChecked
                ? (Number(invoiceData.paymentDetails.inspectionPrice))
                : 0)
            + (invoiceData.paymentDetails.incoterms == 'CIF'
                ? Number(invoiceData.paymentDetails.insurancePrice)
                : 0)
            + totalAdditionalPrice)
            * Number(invoiceData.currency.usdToJpy));

        const totalEur = ((Number(invoiceData.paymentDetails.fobPrice)
            + Number(invoiceData.paymentDetails.freightPrice)
            + (invoiceData.paymentDetails.inspectionIsChecked
                ? (Number(invoiceData.paymentDetails.inspectionPrice))
                : 0)
            + (invoiceData.paymentDetails.incoterms == 'CIF'
                ? Number(invoiceData.paymentDetails.insurancePrice)
                : 0)
            + totalAdditionalPrice)
            * Number(invoiceData.currency.usdToEur));


        // const totalEur = Number(invoiceData.paymentDetails.fobPrice) * Number(invoiceData.currency.usdToEur)
        //     + (valueCurrency * Number(invoiceData.currency.usdToEur))
        //     + Number(invoiceData.paymentDetails.freightPrice) * Number(invoiceData.currency.usdToEur)
        //     + (valueCurrency * Number(invoiceData.currency.usdToEur))
        //     + (invoiceData.paymentDetails.inspectionIsChecked
        //         ? (Number(invoiceData.paymentDetails.inspectionPrice) * Number(invoiceData.currency.usdToEur)
        //             + (valueCurrency * Number(invoiceData.currency.usdToEur)))
        //         : 0)
        //     + totalAdditionalPrice;

        const totalAud = ((Number(invoiceData.paymentDetails.fobPrice)
            + Number(invoiceData.paymentDetails.freightPrice)
            + (invoiceData.paymentDetails.inspectionIsChecked
                ? (Number(invoiceData.paymentDetails.inspectionPrice))
                : 0)
            + (invoiceData.paymentDetails.incoterms == 'CIF'
                ? Number(invoiceData.paymentDetails.insurancePrice)
                : 0)
            + totalAdditionalPrice)
            * Number(invoiceData.currency.usdToAud))

        const totalGbp = ((Number(invoiceData.paymentDetails.fobPrice)
            + Number(invoiceData.paymentDetails.freightPrice)
            + (invoiceData.paymentDetails.inspectionIsChecked
                ? (Number(invoiceData.paymentDetails.inspectionPrice))
                : 0)
            + (invoiceData.paymentDetails.incoterms == 'CIF'
                ? Number(invoiceData.paymentDetails.insurancePrice)
                : 0)
            + totalAdditionalPrice)
            * Number(invoiceData.currency.usdToGbp))

        const totalCad = ((Number(invoiceData.paymentDetails.fobPrice)
            + Number(invoiceData.paymentDetails.freightPrice)
            + (invoiceData.paymentDetails.inspectionIsChecked
                ? (Number(invoiceData.paymentDetails.inspectionPrice))
                : 0)
            + (invoiceData.paymentDetails.incoterms == 'CIF'
                ? Number(invoiceData.paymentDetails.insurancePrice)
                : 0)
            + totalAdditionalPrice)
            * Number(invoiceData.currency.usdToCad))

        if (invoiceData.selectedCurrencyExchange == 'None' || !invoiceData.selectedCurrencyExchange || invoiceData.selectedCurrencyExchange == 'USD') {
            return `$${Math.round(totalUsd).toLocaleString('en-US', { useGrouping: true })}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'JPY') {
            return `¥${Math.round(totalJpy).toLocaleString('en-US', { useGrouping: true })}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'EUR') {
            return `€${Math.round(totalEur).toLocaleString('en-US', { useGrouping: true })}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'AUD') {
            return `A$${Math.round(totalAud).toLocaleString('en-US', { useGrouping: true })}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'GBP') {
            return `£${Math.round(totalGbp).toLocaleString('en-US', { useGrouping: true })}`;
        }
        if (invoiceData.selectedCurrencyExchange == 'CAD') {
            return `C$${Math.round(totalCad).toLocaleString('en-US', { useGrouping: true })}`;
        }
    }
    //pathname for open invoice
    const pathname = usePathname()
    const openedOnce = useRef(false)

    useEffect(() => {
        if (openedOnce.current) return;
        if (!pathname?.startsWith('/chats/ordered/')) return;

        // extract {chatId} from /chats/ordered/{chatId}[...]
        const parts = pathname.split('/');
        const chatId = parts[3]; // 0:"",1:"chats",2:"ordered",3:"{chatId}"
        if (!chatId) return;


        (async () => {
            try {
                const ref = doc(firestore, 'chats', chatId);

                const didOpen = await runTransaction(firestore, async (tx) => {
                    const snap = await tx.get(ref);
                    const already = snap.exists() && snap.data()?.firstOpened === true;
                    if (already) return false; // don’t open modal

                    tx.set(ref, { firstOpened: true }, { merge: true });
                    return true; // we’re the first → open modal
                });

                if (didOpen) {
                    handlePreviewInvoiceModal(true); // opens your modal once
                }

                openedOnce.current = true; // prevent re-running in this session
            } catch (err) {
                console.error('firstOpened check failed:', err);
                // Fallback: still avoid looping forever
                openedOnce.current = true;
            }
        })();
    }, [pathname]);

    //pathname for open invoice

    //     <Pressable

    //                         onPress={() => handlePreviewInvoiceModal(true)}
    //                         focusable={false}
    //                         variant='ghost'
    //                         onHoverIn={hoverPreviewIn}
    //                         onHoverOut={hoverPreviewOut}
    //                         style={({ pressed, hovered }) => ([context === 'chat' ? {
    //                             backgroundColor: pressed
    //                                 ? '#C0C0C0'  // Darker gray on press
    //                                 : hovered
    //                                     ? '#E0E0E0'  // Slightly darker gray on hover
    //                                     : '#FAFAFA',  // Default background color
    //                             padding: 15,
    //                             margin: 5,
    //                             borderRadius: 10,
    //                             borderWidth: 1,
    //                             borderColor: '#E0E0E0',
    //                             shadowColor: '#000',
    //                             shadowOffset: { width: 0, height: 2 },
    //                             shadowOpacity: 0.1,
    //                             shadowRadius: 4,
    //                             elevation: 2, // For Android shadow
    //                         } : {
    //                             padding: 5,
    //                             paddingVertical: 8,
    //                             paddingHorizontal: 20,
    //                             flexDirection: 'row', // Align items in a row
    //                             alignItems: 'center', // Center items vertically
    //                             justifyContent: 'center',
    //                             borderRadius: 5,
    //                             backgroundColor: isPreviewHovered ? '#0772ad' : '#0A8DD5',


    //                         }])}
    //                     >

    // </Pressable>

    useEffect(() => {
        if (capturedImageUri && context === 'invoice') {
            handleCaptureAndCreatePDF()
        }
    }, [capturedImageUri, context]);

    const uploadInFlightRef = useRef(false);




    // async function uploadInvoicePDFAndOpen() {
    //     if (uploadInFlightRef.current) return;
    //     uploadInFlightRef.current = true;

    //     try {
    //         // Decide which link to use: proforma (< step 3) vs original invoice
    //         const invoiceNo = selectedChatData?.invoiceNumber || 'proforma';
    //         const isProforma =
    //             (selectedChatData?.stepIndicator?.value ?? 0) < 3 ||
    //             /proforma/i.test(String(invoiceNo));

    //         // 1) Check Firestore first (no DOM access yet)
    //         try {
    //             const snap = await getDoc(doc(firestore, 'chats', chatId));
    //             const data = snap.exists() ? snap.data() : null;
    //             const arr = isProforma
    //                 ? data?.invoiceLink?.proformaInvoice
    //                 : data?.invoiceLink?.origInvoice;

    //             const existingUrl = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
    //             if (existingUrl) {
    //                 window.open(existingUrl, '_blank', 'noopener,noreferrer');

    //                 return { url: existingUrl, path: null };
    //             }
    //         } catch (e) {
    //             console.warn('Invoice link check failed; will generate:', e);
    //         }

    //         // 2) No link yet → capture & generate PDF
    //         const el = invoiceRef?.current;
    //         if (!el) {
    //             console.error('No element to capture (open the preview first).');
    //             return;
    //         }

    //         const [{ jsPDF }, html2canvas] = await Promise.all([
    //             import('jspdf').then(m => ({ jsPDF: m.jsPDF || m.default })),
    //             import('html2canvas').then(m => m.default || m),
    //         ]);

    //         const canvas = await html2canvas(el, {
    //             scale: 1,
    //             useCORS: true,            // correct casing
    //             allowTaint: false,
    //             backgroundColor: '#fff',
    //             windowWidth: el.scrollWidth,
    //             windowHeight: el.scrollHeight,
    //         });

    //         const imageData = canvas.toDataURL('image/jpeg', 0.9);
    //         const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    //         const pageWidth = pdf.internal.pageSize.getWidth();
    //         const pageHeight = pdf.internal.pageSize.getHeight();

    //         const imgProps = pdf.getImageProperties(imageData);
    //         const ratio = imgProps.height / imgProps.width;
    //         const imgWidth = pageWidth;
    //         const imgHeight = imgWidth * ratio;

    //         let y = 0;
    //         while (y < imgHeight) {
    //             if (y > 0) pdf.addPage();
    //             pdf.addImage(
    //                 imageData,
    //                 'JPEG',
    //                 0,
    //                 -y * (pageHeight / imgHeight),
    //                 imgWidth,
    //                 imgHeight,
    //                 undefined,
    //                 'FAST'
    //             );
    //             y += pageHeight;
    //         }

    //         const rawFilename =
    //             (selectedChatData?.stepIndicator?.value ?? 0) < 3
    //                 ? `Proforma Invoice (${invoiceData?.carData?.carName} [${invoiceData?.carData?.referenceNumber}]) (A4 Paper Size).pdf`
    //                 : `Invoice No. ${invoiceNo} (A4 Paper Size).pdf`;
    //         const filename = String(rawFilename).replace(/[^\w\s.\-\[\]\(\)]/g, '_');

    //         // Blob -> base64
    //         const pdfBlob = pdf.output('blob');
    //         const base64Pdf = await (async () => {
    //             const ab = await pdfBlob.arrayBuffer();
    //             let s = ''; const b = new Uint8Array(ab);
    //             for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    //             return btoa(s);
    //         })();

    //         // 3) Upload via callable (also writes URL into invoiceLink.*)

    //         const callUpload = httpsCallable(functions, 'uploadInvoicePdf');
    //         const res = await callUpload({
    //             chatId,
    //             invoiceNumber: invoiceNo,
    //             filename,
    //             base64Pdf,
    //             userEmail,
    //         });

    //         if (!res?.data?.success && !res?.data?.ok) {
    //             throw new Error(res?.data?.error || 'Upload failed');
    //         }

    //         const url = res.data.downloadURL || res.data.url;

    //         // 4) Open in a new tab
    //         window.open(url, '_blank', 'noopener,noreferrer');

    //         return { url, path: res.data.path };
    //     } catch (err) {
    //         console.error('uploadInvoicePDFAndOpen failed:', err);
    //     } finally {
    //         uploadInFlightRef.current = false;
    //         handlePreviewInvoiceModal(false)
    //     }
    // }

    // function openInvoicePdfServerSide({ chatId, userEmail, isProforma, invoiceData, selectedChatData }) {
    //     const form = document.createElement('form');
    //     form.method = 'POST';
    //     form.action = '/api/generate-invoice';
    //     form.target = '_blank';                // 🔥 open in a new tab as a real PDF
    //     form.acceptCharset = 'utf-8';          // be explicit

    //     const input = document.createElement('input');
    //     input.type = 'hidden';
    //     input.name = 'json';                   // server reads req.body.json
    //     input.value = JSON.stringify({ chatId, userEmail, isProforma, invoiceData, selectedChatData });

    //     form.appendChild(input);
    //     document.body.appendChild(form);
    //     form.submit();
    //     form.remove();
    // }



  async function uploadInvoicePDFAndOpen() {
  if (uploadInFlightRef.current) return;
  uploadInFlightRef.current = true;

  try {
    const isProforma = (selectedChatData?.stepIndicator?.value ?? 0) < 3;
    const res = await httpsCallable(functions, "generateInvoicePdf")({
      chatId, userEmail, isProforma, invoiceData, selectedChatData,
    });

    const url = res?.data?.downloadURL;
    if (!url) throw new Error("No URL returned");

    const viewerUrl = `/invoice-viewer?u=${encodeURIComponent(url)}&t=${Date.now()}`;
    window.location.assign(viewerUrl); // same tab = mobile-safe
  } catch (e) {
    console.error(e);
    toast?.error?.(e?.message || "Failed to generate invoice");
  } finally {
    uploadInFlightRef.current = false;
    handlePreviewInvoiceModal(false);
  }
}





    return (
        <>
            <> {invoiceData &&

                <>
                    <Button
                        onClick={() => { handlePreviewInvoiceModal(true); }}
                        variant="default" className="gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    >
                        <FileText className="h-3 w-3 mr-1" />
                        {selectedChatData?.invoiceNumber && selectedChatData?.stepIndicator.value > 2 ? `Invoice No. ${selectedChatData?.invoiceNumber}` : 'Preview Invoice'}

                        {/* {selectedChatData?.invoiceNumber && selectedChatData?.stepIndicator.value > 2 ?
                            <Text style={{ fontWeight: 700, color: context === 'chat' ? 'black' : 'white', }}>
                                <AntDesign name='filetext1' size={16} color={context === 'chat' ? 'black' : 'white'} /> {context === 'chat' ? messageText : `Invoice No. ${selectedChatData?.invoiceNumber}`}
                            </Text>
                            :
                            <Text style={{ fontWeight: 700, color: context === 'chat' ? 'black' : 'white', }}>
                                {context === 'chat' ? messageText : `Preview Invoice`}
                            </Text>} */}

                    </Button>


                    <Modal context={'invoice'} showModal={previewInvoiceVisible} setShowModal={handlePreviewInvoiceModal}>

                        {previewInvoiceVisible &&

                            <>
                                {!context && (
                                    screenWidth < mobileViewBreakpoint
                                        ? null
                                        : (
                                            <View
                                                style={{
                                                    gap: 10,

                                                    flexDirection: 'row',
                                                    margin: 2,
                                                    zIndex: 9999,
                                                }}

                                            >

                                                {!isHidden && (
                                                    <Button
                                                        onClick={() => capturedImageUri && handleCaptureAndCreatePDF()}
                                                        disabled={!capturedImageUri}
                                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <Download size={18} />
                                                        <span>Download as PDF</span>
                                                    </Button>
                                                )}
                                                {!isHidden && (
                                                    <Button
                                                        onClick={() => capturedImageUri && openImage()}
                                                        disabled={!capturedImageUri}
                                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors"
                                                    >
                                                        <ImageIcon size={18} />
                                                        <span>View Image</span>
                                                    </Button>
                                                )}
                                                {!isReservedOrSold && !isCancelled && (
                                                    <div className={`ml-auto flex justify-end ${!isHidden ? "" : "left-[1500px]  absolute"}`}>{renderButtons()}</div>
                                                )}




                                            </View>
                                        )
                                )}

                                {!isHidden && (
                                    <ScrollView
                                        keyboardShouldPersistTaps="always"
                                        style={{ position: context === 'invoice' ? 'absolute' : null, top: context === 'invoice' ? -99999 : null, zIndex: 1, maxHeight: screenHeight < 960 ? 520 : 750, width: '100%', maxWidth: screenWidth < 960 ? '100%' : 900, alignSelf: 'center' }}
                                    >
                                        <View style={{
                                            position: 'absolute',
                                            top: 0,
                                            bottom: 0,
                                            right: 0,
                                            left: 0,
                                            backgroundColor: 'white',
                                            zIndex: 50,
                                            flex: 1,
                                            alignItems: 'center', // Center horizontally
                                        }}>
                                            {capturedImageUri ? (
                                                (screenWidth < mobileViewBreakpoint ? uploadInvoicePDFAndOpen() :
                                                    <Image
                                                        key={imagePreviewKey}
                                                        source={{ uri: capturedImageUri.toString() }}
                                                        style={{
                                                            marginTop: 5,
                                                            width: screenWidth < mobileViewBreakpoint ? 377 : 595,
                                                            height: screenWidth < mobileViewBreakpoint ? 541 : 842,
                                                            resizeMode: 'stretch',
                                                            borderWidth: 1,
                                                            borderColor: '#DADDE1',
                                                        }}
                                                    />
                                                )
                                            ) : (
                                                <Loader />
                                            )}
                                        </View>

                                        {/* Main content with invoice details */}
                                        {

                                            <View ref={invoiceRef}
                                                style={{
                                                    width: newWidth,
                                                    height: newHeight,
                                                    backgroundColor: 'white',
                                                    zIndex: 1
                                                }}>

                                                <View style={{ position: 'absolute', left: 38 * widthScaleFactor, top: 38 * heightScaleFactor }}>
                                                    <Image
                                                        source={{ uri: '/RMJ logo for invoice.png' }}
                                                        style={{
                                                            width: 95 * widthScaleFactor,
                                                            height: 85 * heightScaleFactor,
                                                            resizeMode: 'stretch',

                                                        }}
                                                    />
                                                </View>

                                                <View style={{ position: 'absolute', alignSelf: 'center', top: 80 * heightScaleFactor }}>
                                                    {/* Title */}
                                                    {selectedChatData?.stepIndicator.value < 3 ?
                                                        <Text style={{ fontWeight: 700, fontSize: 25 * widthScaleFactor }}>{`PROFORMA INVOICE`}</Text> :
                                                        <Text style={{ fontWeight: 700, fontSize: 25 * widthScaleFactor }}>{`INVOICE`}</Text>
                                                    }
                                                </View>

                                                <View style={{ position: 'absolute', right: 38 * widthScaleFactor, top: 38 * heightScaleFactor }}>
                                                    {/* QR CODE */}
                                                    {selectedChatData?.stepIndicator.value < 3 ?
                                                        null :
                                                        <View
                                                            ref={qrCodeRef}
                                                        >
                                                            <QRCodeSVG
                                                                value={invoiceData?.cryptoNumber}
                                                                size={80 * widthScaleFactor}
                                                                fgColor="black"
                                                                bgColor="white"
                                                            />
                                                        </View>

                                                    }
                                                </View>

                                                <View style={{ position: 'absolute', right: 121 * widthScaleFactor, top: 34 * heightScaleFactor }}>
                                                    {/* Invoice Number */}
                                                    {selectedChatData?.stepIndicator.value < 3 ?
                                                        null :
                                                        <Text style={{ fontWeight: 750, fontSize: 14 * widthScaleFactor }}>{`Invoice No. RMJ-${selectedChatData?.invoiceNumber}`}</Text>
                                                    }
                                                </View>

                                                {selectedChatData?.stepIndicator.value < 3 ?
                                                    <View style={{ position: 'absolute', right: 38 * widthScaleFactor, top: 34 * heightScaleFactor, }}>
                                                        {/* Issuing Date */}
                                                        <View style={{ flexDirection: 'row', alignSelf: 'flex-end', }}>
                                                            <Text style={{ fontWeight: 750, fontSize: 14 * widthScaleFactor }}>{`Issuing Date: `}</Text>
                                                            <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor }}>{`${formattedIssuingDate}`}</Text>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', alignSelf: 'flex-end', }}>
                                                            <Text style={{ fontWeight: 750, fontSize: 14 * widthScaleFactor, color: '#F00A0A', }}>{`Valid Until: `}</Text>
                                                            <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor }}>{`${formattedDueDate}`}</Text>
                                                        </View>

                                                    </View>
                                                    :
                                                    <View style={{ position: 'absolute', right: 121 * widthScaleFactor, top: 49 * heightScaleFactor, flexDirection: 'row' }}>
                                                        {/* Issuing Date */}
                                                        <Text style={{ fontWeight: 750, fontSize: 14 * widthScaleFactor }}>{`Issuing Date: `}</Text>
                                                        <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor }}>{`${formattedIssuingDate}`}</Text>
                                                    </View>
                                                }

                                                <View style={{
                                                    position: 'absolute',
                                                    left: 40 * widthScaleFactor,
                                                    top: 134 * heightScaleFactor,
                                                    width: 280 * widthScaleFactor,
                                                }}>
                                                    {/* Shipper */}
                                                    <Text style={{
                                                        fontWeight: 750,
                                                        fontSize: 16 * widthScaleFactor,
                                                        borderBottomWidth: 3, // Adjust the thickness of the underline
                                                        width: 'fit-content', // Make the underline cover the text width
                                                        marginBottom: 5,
                                                        lineHeight: 100
                                                        // Add some space between text and underline
                                                    }}>
                                                        {`Shipper`}
                                                    </Text>
                                                    <Text style={{ fontWeight: 750, fontSize: 14 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`Real Motor Japan (YANAGISAWA HD CO.,LTD)`}</Text>
                                                    <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`26-2 Takara Tsutsumi-cho Toyota City, Aichi Prefecture, Japan, 473-0932`}</Text>
                                                    <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`FAX: +81565850606`}</Text>

                                                    <Text style={{ fontWeight: 700, fontSize: 14 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`Shipped From:`}</Text>
                                                    <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.departurePort}, ${invoiceData?.departureCountry}`}</Text>

                                                    <Text style={{ fontWeight: 700, fontSize: 14 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`Shipped To:`}</Text>
                                                    <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.discharge.port}, ${invoiceData?.discharge.country}`}</Text>
                                                    {invoiceData?.placeOfDelivery && invoiceData?.placeOfDelivery !== '' ?
                                                        <>
                                                            <Text style={{ fontWeight: 700, fontSize: 14 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`Place of Delivery:`}</Text>
                                                            <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.placeOfDelivery}`}</Text>
                                                        </>
                                                        : null}
                                                    {invoiceData?.cfs && invoiceData?.cfs !== '' ?
                                                        <>
                                                            <Text style={{ fontWeight: 700, fontSize: 14 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`CFS:`}</Text>
                                                            <Text style={{ fontWeight: 400, fontSize: 14 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.cfs}`}</Text>
                                                        </>
                                                        : null}

                                                    <View style={{ flex: 1, flexDirection: 'row', width: 715 * widthScaleFactor, }}>

                                                        <View style={{
                                                            flex: 1, width: 280 * widthScaleFactor,
                                                        }}>
                                                            {/* Buyer Information */}
                                                            <Text style={{
                                                                fontWeight: 750,
                                                                fontSize: 18 * widthScaleFactor,
                                                                borderBottomWidth: 3, // Adjust the thickness of the underline
                                                                borderBottomColor: '#0A78BE',
                                                                width: 'fit-content', // Make the underline cover the text width
                                                                marginBottom: 5, // Add some space between text and underline
                                                                color: '#0A78BE',
                                                                marginTop: 25 * heightScaleFactor,
                                                                lineHeight: 100

                                                            }}>
                                                                {`Buyer Information`}
                                                            </Text>
                                                            <Text style={{ fontWeight: 750, fontSize: 16 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.consignee.name}`}</Text>
                                                            <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, marginTop: 6 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.consignee.address}, ${invoiceData?.consignee.city}, ${invoiceData?.consignee.country}`}</Text>
                                                            <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.consignee.email}`}</Text>
                                                            <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.consignee.contactNumber}`}</Text>
                                                            <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`FAX: ${invoiceData?.consignee.fax == '' ? 'N/A' : invoiceData?.consignee.fax}`}</Text>

                                                        </View>

                                                        <View style={{ flex: 1, paddingLeft: 20 * widthScaleFactor, width: 280 * widthScaleFactor, }}>
                                                            {/* Notify Party */}
                                                            <Text style={{
                                                                fontWeight: 750,
                                                                fontSize: 18 * widthScaleFactor,
                                                                borderBottomWidth: 3, // Adjust the thickness of the underline
                                                                borderBottomColor: '#FF0000',
                                                                width: 'fit-content', // Make the underline cover the text width
                                                                marginBottom: 5, // Add some space between text and underline
                                                                color: '#FF0000',
                                                                marginTop: 25 * heightScaleFactor,
                                                                lineHeight: 100
                                                            }}>
                                                                {`Notify Party`}
                                                            </Text>
                                                            {invoiceData?.notifyParty.sameAsConsignee == true ? (
                                                                <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, }}>{`Same as consignee / buyer`}</Text>) :
                                                                (<>
                                                                    <Text style={{ fontWeight: 750, fontSize: 16 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.notifyParty.name}`}</Text>
                                                                    <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.notifyParty.address}`}</Text>
                                                                    <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.notifyParty.email}`}</Text>
                                                                    <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.notifyParty.contactNumber}`}</Text>
                                                                    <Text style={{ fontWeight: 400, fontSize: 16 * widthScaleFactor, marginTop: 20, lineHeight: 14 * widthScaleFactor }}>{`FAX: ${invoiceData?.notifyParty.fax == '' ? 'N/A' : invoiceData?.notifyParty.fax}`}</Text>
                                                                </>)}
                                                        </View>

                                                    </View>


                                                </View>
                                                {selectedChatData?.stepIndicator.value < 3 ?

                                                    <View style={{ position: 'absolute', right: 38 * widthScaleFactor, top: 130 * heightScaleFactor, borderWidth: 3, width: 430 * widthScaleFactor, borderColor: '#FF5C00', height: 194 * heightScaleFactor, }}>
                                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', }}>
                                                            {/* <Entypo size={50 * widthScaleFactor} name='warning' color={'#FF0000'} /> */}
                                                            <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, color: '#FF0000', marginLeft: 20 * widthScaleFactor, }}>{`Bank Information will be provided after placing an order.`}</Text>
                                                        </View>
                                                    </View>
                                                    :
                                                    <View style={{ position: 'absolute', right: 38 * widthScaleFactor, top: 130 * heightScaleFactor, borderWidth: 3, width: 430 * widthScaleFactor, borderColor: '#1ABA3D', }}>

                                                        <View style={{ flex: 1, alignItems: 'center', }}>
                                                            <Text style={{ fontWeight: 750, fontSize: 14 * widthScaleFactor, color: '#114B33', }}>{`Bank Information`}</Text>
                                                        </View>

                                                        <View style={{ flex: 1, flexDirection: 'row', marginHorizontal: 5 * widthScaleFactor, marginBottom: 5 * heightScaleFactor, }}>
                                                            <View style={{ flex: 1, marginRight: 50 * widthScaleFactor, }}>
                                                                <Text style={{
                                                                    fontWeight: 750,
                                                                    fontSize: 14 * widthScaleFactor,
                                                                    borderBottomWidth: 3, // Adjust the thickness of the underline
                                                                    width: 'fit-content', // Make the underline cover the text width
                                                                    lineHeight: 90 // Add some space between text and underline
                                                                }}>
                                                                    {`Bank Account`}
                                                                </Text>

                                                                <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor, marginTop: 3 * heightScaleFactor, }}>{`Bank Name: `}
                                                                    <Text style={{ fontWeight: 400, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.bankInformations.bankAccount.bankName}`}</Text>
                                                                </Text>

                                                                <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor, marginTop: 3 * heightScaleFactor, }}>{`Branch Name: `}
                                                                    <Text style={{ fontWeight: 400, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.bankInformations.bankAccount.branchName}`}</Text>
                                                                </Text>

                                                                <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor, marginTop: 3 * heightScaleFactor, }}>{`SWIFTCODE: `}
                                                                    <Text style={{ fontWeight: 400, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.bankInformations.bankAccount.swiftCode}`}</Text>
                                                                </Text>

                                                                <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor, marginTop: 3 * heightScaleFactor, }}>{`Address: `}
                                                                    <Text style={{ fontWeight: 400, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.bankInformations.bankAccount.address}`}</Text>
                                                                </Text>

                                                                <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor, marginTop: 3 * heightScaleFactor, }}>{`Name of Account Holder: `}
                                                                    <Text style={{ fontWeight: 400, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.bankInformations.bankAccount.accountHolder}`}</Text>
                                                                </Text>

                                                                <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor, marginBottom: 2 * heightScaleFactor, }}>{`Account Number: `}
                                                                    <Text style={{ fontWeight: 400, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.bankInformations.bankAccount.accountNumberValue}`}</Text>
                                                                </Text>
                                                            </View>

                                                            <View style={{ flex: 1 }}>

                                                                <Text style={{
                                                                    fontWeight: 750,
                                                                    fontSize: 14 * widthScaleFactor,
                                                                    borderBottomWidth: 3, // Adjust the thickness of the underline
                                                                    width: 'fit-content', // Make the underline cover the text width
                                                                    marginBottom: 2,
                                                                    lineHeight: 90 // Add some space between text and underline
                                                                }}>
                                                                    {`Payment Terms`}
                                                                </Text>

                                                                <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`Terms: `}
                                                                    <Text style={{ fontWeight: 400, fontSize: 12 * widthScaleFactor, lineHeight: 14 * widthScaleFactor }}>{`${invoiceData?.bankInformations.paymentTerms}`}</Text>
                                                                </Text>

                                                                <View style={{ paddingTop: 30 * heightScaleFactor, }}>

                                                                    <Text style={{
                                                                        fontWeight: 750,
                                                                        fontSize: 14 * widthScaleFactor,
                                                                        borderBottomWidth: 3, // Adjust the thickness of the underline
                                                                        width: 'fit-content', // Make the underline cover the text width
                                                                        marginBottom: 2, // Add some space between text and underline
                                                                        color: '#F00A0A',
                                                                        borderBottomColor: '#F00A0A',
                                                                        lineHeight: 90
                                                                    }}>
                                                                        {`Payment Due`}
                                                                    </Text>

                                                                    <Text style={{ fontWeight: 750, fontSize: 12 * widthScaleFactor, color: '#F00A0A', lineHeight: 14 * widthScaleFactor }}>{`Due Date: `}
                                                                        <Text style={{ fontWeight: 400, fontSize: 12 * widthScaleFactor, color: 'black', lineHeight: 14 * widthScaleFactor }}>{`${formattedDueDate}`}</Text>
                                                                    </Text>

                                                                </View>

                                                            </View>

                                                        </View>

                                                    </View>}


                                                <View style={{
                                                    position: 'absolute',
                                                    left: 38 * widthScaleFactor,
                                                    top: (invoiceData?.placeOfDelivery && invoiceData?.cfs) || (invoiceData?.placeOfDelivery !== '' && invoiceData?.cfs !== '') ? 577 * heightScaleFactor : 537 * heightScaleFactor,
                                                    width: 718 * widthScaleFactor,
                                                    borderWidth: 1 * widthScaleFactor,
                                                    borderColor: '#C2E2F4',
                                                    alignSelf: 'center',
                                                }}>
                                                    <View style={{ flex: 1, flexDirection: 'row', }}>

                                                        <View style={{ flex: 2, justifyContent: 'center', }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 10 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                    color: '#008AC6',
                                                                }}>
                                                                {`Description`}
                                                            </Text>

                                                        </View>

                                                        <View style={{ flex: 2, justifyContent: 'center', }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 10 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                    color: '#008AC6',
                                                                }}>
                                                                {`Notes`}
                                                            </Text>
                                                        </View>

                                                        <View style={{ flex: 1, justifyContent: 'center', }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 10 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                    color: '#008AC6',
                                                                }}>
                                                                {`Quantity`}
                                                            </Text>
                                                        </View>

                                                        <View style={{ flex: 2, justifyContent: 'center', }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 10 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                    color: '#008AC6',
                                                                }}>
                                                                {`Amount`}
                                                            </Text>
                                                        </View>

                                                    </View>

                                                    <View style={{ flex: 1, flexDirection: 'row', }}>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 5,
                                                        }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    marginLeft: 2 * widthScaleFactor,
                                                                }}>
                                                                {`FOB`}
                                                            </Text>
                                                        </View>


                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 2,
                                                        }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 4 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                }}>
                                                                {`${convertedCurrency(Number(invoiceData?.paymentDetails.fobPrice))}`}
                                                            </Text>
                                                        </View>

                                                    </View>

                                                    <View style={{ flex: 1, flexDirection: 'row', }}>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 5,
                                                        }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    marginLeft: 2 * widthScaleFactor,
                                                                }}>
                                                                {`Freight`}
                                                            </Text>
                                                        </View>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 2,
                                                        }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                }}>
                                                                {`${convertedCurrency(Number(invoiceData?.paymentDetails.freightPrice))}`}
                                                            </Text>
                                                        </View>

                                                    </View>

                                                    <View style={{ flex: 1, flexDirection: 'row', }}>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 5,
                                                            flexDirection: 'row',
                                                        }}>
                                                            {invoiceData?.paymentDetails.inspectionIsChecked && (invoiceData?.paymentDetails.incoterms == "C&F" || invoiceData?.paymentDetails.incoterms == "FOB") && <Text
                                                                style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    marginLeft: 2 * widthScaleFactor,
                                                                }}>
                                                                {invoiceData?.paymentDetails.inspectionIsChecked ? `Inspection [${invoiceData?.paymentDetails.inspectionName}]` : ' '}
                                                            </Text>}

                                                            {invoiceData?.paymentDetails.inspectionIsChecked && invoiceData?.paymentDetails.incoterms == "CIF" &&
                                                                <>
                                                                    <Text
                                                                        style={{
                                                                            fontWeight: 400,
                                                                            fontSize: 12 * widthScaleFactor,
                                                                            lineHeight: 14 * widthScaleFactor,
                                                                            marginBottom: 3 * heightScaleFactor,
                                                                            marginLeft: 2 * widthScaleFactor,
                                                                        }}>
                                                                        {invoiceData?.paymentDetails.inspectionIsChecked ? `Inspection [${invoiceData?.paymentDetails.inspectionName}]` : ' '}
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontWeight: 400,
                                                                            fontSize: 12 * widthScaleFactor,
                                                                            lineHeight: 14 * widthScaleFactor,
                                                                            marginBottom: 3 * heightScaleFactor,
                                                                            marginLeft: 2 * widthScaleFactor,
                                                                        }}>
                                                                        {invoiceData?.paymentDetails.incoterms == "CIF" ? ` + Insurance` : ' '}
                                                                    </Text>
                                                                </>
                                                            }

                                                            {!invoiceData?.paymentDetails.inspectionIsChecked && invoiceData?.paymentDetails.incoterms == "CIF" &&
                                                                <Text
                                                                    style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        marginLeft: 2 * widthScaleFactor,
                                                                    }}>
                                                                    {invoiceData?.paymentDetails.incoterms == "CIF" ? `Insurance` : ' '}
                                                                </Text>
                                                            }

                                                            {!invoiceData?.paymentDetails.inspectionIsChecked && (invoiceData?.paymentDetails.incoterms == "C&F" || invoiceData?.paymentDetails.incoterms == "FOB") &&
                                                                <Text
                                                                    style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                    }}>
                                                                    {' '}
                                                                </Text>
                                                            }


                                                        </View>


                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 2,
                                                        }}>

                                                            {invoiceData?.paymentDetails.inspectionIsChecked && (invoiceData?.paymentDetails.incoterms == "C&F" || invoiceData?.paymentDetails.incoterms == "FOB") && <Text
                                                                style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                }}>
                                                                {invoiceData?.paymentDetails.inspectionIsChecked ? `${convertedCurrency(Number(invoiceData?.paymentDetails.inspectionPrice))}` : ' '}
                                                            </Text>}

                                                            {invoiceData?.paymentDetails.inspectionIsChecked && invoiceData?.paymentDetails.incoterms == "CIF" &&
                                                                <Text
                                                                    style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',
                                                                    }}>
                                                                    {invoiceData?.paymentDetails.inspectionIsChecked ? `${convertedCurrency(Number(invoiceData?.paymentDetails.inspectionPrice))}` : ' '}
                                                                    <Text
                                                                        style={{
                                                                            fontWeight: 400,
                                                                            fontSize: 12 * widthScaleFactor,
                                                                            lineHeight: 14 * widthScaleFactor,
                                                                            marginBottom: 3 * heightScaleFactor,
                                                                        }}>
                                                                        {invoiceData?.paymentDetails.incoterms === "CIF" ? ` + ${convertedCurrency(Number(invoiceData?.paymentDetails.insurancePrice))}` : ' '}
                                                                    </Text>
                                                                </Text>

                                                            }

                                                            {!invoiceData?.paymentDetails.inspectionIsChecked && invoiceData?.paymentDetails.incoterms == "CIF" &&
                                                                <Text
                                                                    style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',

                                                                    }}>
                                                                    {invoiceData?.paymentDetails.incoterms == "CIF" ? `${convertedCurrency(Number(invoiceData?.paymentDetails.insurancePrice))}` : ' '}
                                                                </Text>
                                                            }

                                                        </View>


                                                    </View>

                                                    <View style={{ flex: 1, flexDirection: 'row', }}>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 5,
                                                            flexDirection: 'row',
                                                        }}>
                                                            {invoiceData?.paymentDetails.additionalName && (invoiceData?.paymentDetails.additionalName).length > 0 && <Text
                                                                style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    marginLeft: 2 * widthScaleFactor,
                                                                }}>
                                                                {invoiceData?.paymentDetails.additionalName && (invoiceData?.paymentDetails.additionalName).length > 0 ? `${invoiceData?.paymentDetails.additionalName.join(' + ')}` : ' '}
                                                            </Text>}


                                                        </View>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 2,
                                                        }}>
                                                            <Text
                                                                style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                }}>
                                                                {invoiceData?.paymentDetails.additionalPrice && invoiceData?.paymentDetails.additionalPrice.length > 0
                                                                    ? invoiceData?.paymentDetails.additionalPrice.map(price => {
                                                                        const converted = convertedCurrency(Number(price));
                                                                        return converted;
                                                                    }).join(' + ')
                                                                    : ' '}
                                                            </Text>
                                                        </View>

                                                    </View>

                                                    <View style={{ flex: 1, flexDirection: 'row', }}>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 2,
                                                            flexDirection: 'row',
                                                            paddingVertical: 2 * heightScaleFactor,

                                                        }}>
                                                            {invoiceData?.carData && invoiceData?.carData?.carName ? (
                                                                <Text style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                    marginLeft: 2 * widthScaleFactor,
                                                                }}>
                                                                    {"Used Vehicle\n"}
                                                                    <Text style={{
                                                                        fontWeight: 700,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',
                                                                    }}>
                                                                        {`${invoiceData?.carData?.carName}\n`}
                                                                    </Text>
                                                                    <Text style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',
                                                                    }}>
                                                                        {`${invoiceData?.carData?.chassisNumber}\n`}
                                                                    </Text>
                                                                    <Text style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',
                                                                    }}>
                                                                        {`${invoiceData?.carData?.exteriorColor}\n`}
                                                                    </Text>
                                                                    <Text style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',
                                                                    }}>
                                                                        {`${Number(invoiceData?.carData?.engineDisplacement).toLocaleString('en-US')} cc\n`}
                                                                    </Text>
                                                                    <Text style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',
                                                                    }}>
                                                                        {`${Number(invoiceData?.carData?.mileage).toLocaleString('en-US')} km\n`}
                                                                    </Text>
                                                                    <Text style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',
                                                                    }}>
                                                                        {`${invoiceData?.carData?.fuel}\n`}
                                                                    </Text>
                                                                    <Text style={{
                                                                        fontWeight: 400,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        alignSelf: 'center',
                                                                    }}>
                                                                        {`${invoiceData?.carData?.transmission}\n`}
                                                                    </Text>
                                                                </Text>

                                                            ) : (
                                                                <Text>{' '}</Text>
                                                            )}


                                                        </View>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 2,
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                        }}>
                                                            {invoiceData?.paymentDetails && invoiceData?.paymentDetails.incoterms && invoiceData?.discharge.port && invoiceData?.discharge ? (
                                                                <Text style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                }}>
                                                                    {`${invoiceData?.paymentDetails.incoterms} ${invoiceData?.discharge.port}`}
                                                                </Text>
                                                            ) : (
                                                                <Text>{' '}</Text>
                                                            )}
                                                        </View>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 1,
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                        }}>
                                                            {invoiceData?.carData && invoiceData?.carData?.carName ? (
                                                                <Text style={{
                                                                    fontWeight: 400,
                                                                    fontSize: 12 * widthScaleFactor,
                                                                    lineHeight: 14 * widthScaleFactor,
                                                                    marginBottom: 3 * heightScaleFactor,
                                                                    alignSelf: 'center',
                                                                }}>
                                                                    {'1'}
                                                                </Text>
                                                            ) : (
                                                                <Text>{' '}</Text>
                                                            )}


                                                        </View>

                                                        <View style={{
                                                            borderTopWidth: 1 * widthScaleFactor,
                                                            borderColor: '#C2E2F4',
                                                            flex: 2,
                                                            justifyContent: 'center',
                                                            flexDirection: 'row',
                                                        }}>
                                                            {invoiceData?.paymentDetails && invoiceData?.paymentDetails.totalAmount ? (
                                                                <>
                                                                    <Text style={{
                                                                        fontWeight: 700,
                                                                        fontSize: 12 * widthScaleFactor,
                                                                        lineHeight: 14 * widthScaleFactor,
                                                                        marginBottom: 3 * heightScaleFactor,
                                                                        color: '#008AC6',
                                                                        marginRight: 10 * widthScaleFactor,
                                                                        top: 51 * heightScaleFactor,
                                                                        left: 50 * widthScaleFactor,
                                                                        position: 'absolute',
                                                                    }}>
                                                                        {"Total"}
                                                                        <Text style={{
                                                                            fontWeight: 700,
                                                                            fontSize: 12 * widthScaleFactor,
                                                                            lineHeight: 14 * widthScaleFactor,
                                                                            marginBottom: 3 * heightScaleFactor,
                                                                            alignSelf: 'center',
                                                                            color: '#00720B',
                                                                            marginLeft: 5 * widthScaleFactor,
                                                                        }}>
                                                                            {`${totalPriceCalculated()}`}
                                                                        </Text>
                                                                    </Text>

                                                                </>
                                                            ) : (
                                                                <Text>{' '}</Text>
                                                            )}
                                                        </View>

                                                    </View>

                                                </View>

                                                <View style={{ position: 'absolute', left: 38 * widthScaleFactor, top: 825 * heightScaleFactor, width: 350 * widthScaleFactor, }}>
                                                    <Text style={{
                                                        fontWeight: 700,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                    }}>
                                                        {'Payment Information:'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                    }}>
                                                        {'The customer is responsible for the bank charges incurred when the T/T (Telegraphic Transfer) is paid.'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                        marginBottom: 5 * heightScaleFactor,
                                                    }}>
                                                        {'No warranty service is provided on used vehicles.'}
                                                    </Text>

                                                    <Text style={{
                                                        fontWeight: 700,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                    }}>
                                                        {'Conditions for order cancellation:'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                    }}>
                                                        {'(1) Order Cancellation Penalty: If the order is cancelled after payment, a penalty of USD 220 will apply.'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                        marginBottom: 5 * heightScaleFactor,

                                                    }}>
                                                        {'(2) Non-refund: Payment for vehicles purchased through pre-delivery inspection is non-refundable.'}
                                                    </Text>

                                                    <Text style={{
                                                        fontWeight: 700,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                    }}>
                                                        {'Intermediary Banking Information:'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                    }}>
                                                        {'Bank Name: SUMITOMO MITSUI BANKING CORPORATION (NEW YORK BRANCH).'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,

                                                    }}>
                                                        {'Swift code: SMBCUS33'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                    }}>
                                                        {'Address: 277 Park Avenue'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,

                                                    }}>
                                                        {'City: New York, NY'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,

                                                    }}>
                                                        {'Postal Code: 10172'}
                                                    </Text>
                                                    <Text style={{
                                                        fontWeight: 400,
                                                        fontSize: 12 * widthScaleFactor,
                                                        lineHeight: 14 * heightScaleFactor,
                                                        marginBottom: 5 * heightScaleFactor,

                                                    }}>
                                                        {'Country: United States'}
                                                    </Text>
                                                </View>

                                                {selectedChatData?.stepIndicator.value < 3 ? null :
                                                    <View style={{ position: 'absolute', right: 39 * widthScaleFactor, top: 835 * heightScaleFactor, width: 300 * widthScaleFactor, }}>
                                                        <View style={{
                                                            width: 300 * widthScaleFactor,
                                                            alignItems: 'center',
                                                            paddingBottom: 80 * heightScaleFactor, // Adjust this value to control space between image and line
                                                        }}>
                                                            <Image

                                                                source={{ uri: '/RMJ Invoice Signature with Hanko.png' }}
                                                                style={{
                                                                    width: 276 * widthScaleFactor,
                                                                    height: 81 * heightScaleFactor,
                                                                    resizeMode: 'contain',
                                                                    alignSelf: 'center',
                                                                    marginBottom: 0, // Minimize margin to keep the line close
                                                                }}
                                                            />
                                                            <View style={{
                                                                borderBottomWidth: 1 * heightScaleFactor,
                                                                borderColor: 'black', // Change the color as needed
                                                                width: '100%', // Line width as per your requirement
                                                            }} />
                                                            <Text italic style={{
                                                                fontWeight: 700,
                                                                fontSize: 16 * widthScaleFactor,
                                                            }}>
                                                                {'Real Motor Japan'}
                                                            </Text>
                                                        </View>

                                                        <View style={{
                                                            width: 300 * widthScaleFactor,
                                                            alignItems: 'center',
                                                            paddingBottom: 5 * heightScaleFactor, // Adjust this value to control space between image and line
                                                        }}>

                                                            <View style={{
                                                                borderBottomWidth: 1 * heightScaleFactor,
                                                                borderColor: 'black', // Change the color as needed
                                                                width: '100%', // Line width as per your requirement
                                                            }} />
                                                            <Text italic style={{
                                                                fontWeight: 700,
                                                                fontSize: 16 * widthScaleFactor,
                                                            }}>
                                                                {'Your Signature'}
                                                            </Text>
                                                        </View>
                                                    </View>}


                                            </View>
                                        }


                                    </ScrollView>
                                )}

                            </>

                        }


                    </Modal>


                </>
            }
            </>
        </>
    );

}


export default PreviewInvoice