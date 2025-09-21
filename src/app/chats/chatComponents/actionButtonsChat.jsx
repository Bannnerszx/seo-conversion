"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {  Download, ChevronLeft, ChevronRight } from "lucide-react";
import PreviewInvoice from "./previewInvoice";
import InvoiceAmendmentForm from "./amendInvoice";
import DocumentAddress from "./documentAddress";

export default function ActionButtonsChat({ accountData, bookingData, countryList, selectedChatData, invoiceData, userEmail, chatId }) {
    const scrollContainerRef = useRef(null);
    const leftScrollRef = useRef(null);
    const rightScrollRef = useRef(null);

    // Handle scroll indicators visibility
    const handleScrollVisibility = () => {
        if (!scrollContainerRef.current || !leftScrollRef.current || !rightScrollRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

        // Show/hide left scroll indicator
        if (scrollLeft > 0) {
            leftScrollRef.current.classList.remove("opacity-100");
            leftScrollRef.current.classList.add("opacity-100");
        } else {
            leftScrollRef.current.classList.remove("opacity-100");
            leftScrollRef.current.classList.add("opacity-100");
        }

        // Show/hide right scroll indicator
        if (scrollLeft + clientWidth < scrollWidth - 10) {
            rightScrollRef.current.classList.remove("opacity-100");
            rightScrollRef.current.classList.add("opacity-100");
        } else {
            rightScrollRef.current.classList.remove("opacity-100");
            rightScrollRef.current.classList.add("opacity-100");
        }
    };

    // Scroll left/right functions
    const scrollLeft = () => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    };

    const scrollRight = () => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    };

    // Set up scroll event listener
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        // Initial check
        handleScrollVisibility();

        // Add scroll listener
        scrollContainer.addEventListener("scroll", handleScrollVisibility);

        // Check on resize too
        window.addEventListener("resize", handleScrollVisibility);

        return () => {
            scrollContainer.removeEventListener("scroll", handleScrollVisibility);
            window.removeEventListener("resize", handleScrollVisibility);
        };
    }, []);
   
    const isCancelled =
        selectedChatData && "isCancelled" in selectedChatData
            ? selectedChatData.isCancelled
            : false

    if (isCancelled) return null

    return (
        <div className="relative h-[60px] w-full bg-white rounded-md shadow-sm">
            {/* Left scroll indicator */}
            <button
                ref={leftScrollRef}
                onClick={scrollLeft}
                className="absolute left-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-r from-white to-transparent opacity-0 transition-opacity duration-200 flex items-center"
                aria-label="Scroll left"
            >
                <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>

            {/* Scrollable container */}
            <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 p-3 overflow-x-auto scrollbar-hide h-full"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >

                {/* only show these when not cancelled */}
                {!isCancelled && selectedChatData.stepIndicator.value >= 2 && (
                    <PreviewInvoice
                        accountData={accountData}
                        selectedChatData={selectedChatData}
                        invoiceData={invoiceData}
                    />
                )}
                {!isCancelled && selectedChatData.stepIndicator.value >= 3 && (
                    <InvoiceAmendmentForm
                        accountData={accountData}
                        userEmail={userEmail}
                        chatId={chatId}
                        countryList={countryList}
                    />
                )}
                {!isCancelled && selectedChatData.stepIndicator.value >= 4 && (
                    <DocumentAddress
                        accountData={accountData}
                        chatId={chatId}
                        countryList={countryList}
                        userEmail={userEmail}
                    />
                )}

                {!isCancelled  && (
                    <div className="flex gap-2">
                        {bookingData?.sI?.hasUrl && (
                            <Button
                                variant="default"
                                className="gap-2 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                                onClick={() => window.open(bookingData.sI.url, '_blank')}
                            >
                                <Download className="h-4 w-4" />
                                <span>Download SI</span>
                            </Button>
                        )}

                        {bookingData?.bL?.hasUrl && (
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

            </div>

            {/* Right scroll indicator */}
            <button
                ref={rightScrollRef}
                onClick={scrollRight}
                className="absolute right-0 top-0 bottom-0 z-10 px-1 bg-gradient-to-l from-white to-transparent opacity-100 transition-opacity duration-200 flex items-center"
                aria-label="Scroll right"
            >
                <ChevronRight className="h-5 w-5 text-gray-500" />
            </button>

         
            <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        </div>

    );
}
