"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Shield, CheckCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function PayPalBanner() {
    const [isVisible, setIsVisible] = useState(false)
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = async () => {
            // Add a small delay to ensure cookies are available
            await new Promise(resolve => setTimeout(resolve, 100));

            const res = await fetch("/api/show-paypal-popup", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            if (!res.ok) {
                console.error("Popup API failed:", res.status);
                return;
            }

            const { showPopup } = await res.json();
            if (showPopup) {
                setIsVisible(true)
                setIsMobileModalOpen(true)
            }
        };

        check();
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)

        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    useEffect(() => {
        if (isMobile && isVisible) {
            setIsMobileModalOpen(true)
        }
    }, [isMobile, isVisible])

    // Mobile version - Only modal, no banner
    if (isMobile) {
        return (
            <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
                <DialogTitle asChild>
                    <h2 className="sr-only">PayPal 0% Fees Campaign</h2>
                </DialogTitle>
                <DialogContent className="w-[90vw] max-w-sm mx-auto text-white border-blue-400 rounded-xl">
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: "url('/banner-background.jpeg')",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            zIndex: 0,
                        }}
                    ></div>

                    <div className="absolute inset-0 bg-blue-900/40"></div>

                    <div className="space-y-3 p-2 z-[99]">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-26 h-10 bg-white rounded flex items-center justify-center p-1">
                                <img src="/paypal-logo.png" alt="PayPal" className="w-full h-full object-contain" />
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">0% Fees</div>
                                <div className="text-xs text-blue-100">on unit payments</div>

                            </div>
                        </div>
                        <div className="flex items-center justify-start space-x-1">
                            <Calendar className="h-4 w-4 text-blue-200 font-bold" />
                            <span className="text-sm text-blue-200">Campaign period: August to October</span>
                        </div>
                        <div className="text-sm text-blue-100 leading-relaxed px-2">
                            Pay for your units via PayPal and enjoy zero transaction fees—secure, fast, and hassle-free payments.
                        </div>
                        <div className="flex items-center justify-center space-x-4 text-blue-100 text-xs">
                            <div className="flex items-center space-x-1">
                                <Shield className="h-3 w-3" />
                                <span>Secure</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Zap className="h-3 w-3" />
                                <span>Fast</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>Hassle-free</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Desktop version - Animated banner
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: "120%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className="fixed inset-x-0 bottom-5 px-10 z-[450]"
                >
                    <div
                        className="relative w-full text-white overflow-hidden"
                        style={{
                            backgroundImage: "url(/banner-background.jpeg)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                        }}
                    >
                        <div className="absolute inset-0 bg-blue-900/40"></div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 text-white hover:bg-white/20 z-20 h-10 w-10"
                            onClick={() => setIsVisible(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <div className="px-8 py-6 relative">
                            <div className="flex flex-col items-center text-center space-y-4 max-w-4xl mx-auto">
                                <div className="flex items-center space-x-8">
                                    <div className="w-26 h-12 bg-white rounded-lg flex items-center justify-center p-2">
                                        <img src="/paypal-logo.png" alt="PayPal" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center space-x-4 mb-2">
                                            <h3 className="text-2xl font-bold">🎉 Zero Fees on Units!</h3>
                                            <div className="text-3xl font-bold">0%</div>
                                        </div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Calendar className="h-5 w-5 text-blue-200" />
                                            <p className="text-blue-200 text-sm font-bold mb-0">Campaign period: August to October</p>
                                        </div>
                                        <p className="text-blue-100 text-base mb-3">
                                            Pay for your units via PayPal and enjoy zero transaction fees—secure, fast, and hassle-free
                                            payments.
                                        </p>
                                        <div className="flex items-center space-x-6 text-blue-100 text-sm">
                                            <div className="flex items-center space-x-1">
                                                <Shield className="h-4 w-4" />
                                                <span>Secure</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Zap className="h-4 w-4" />
                                                <span>Fast</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>Hassle-free</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
