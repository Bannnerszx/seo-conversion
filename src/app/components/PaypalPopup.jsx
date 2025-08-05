"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X,
    Zap,
    Shield,
    CheckCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Gift,
    Snowflake,
    Heart,
    Star,
    CandlestickChart,
    CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const slides = [
    {
        id: "obon",
        type: "holiday",
        content: {
            icon: <CalendarDays className="h-8 w-8" />,
            title: "🏮 Obon Holiday Notice",
            subtitle: "❌Office Closed❌",
            description:
                "Please be advised that our office will be closed for the Obon holiday from August 9th to August 17th. We will resume normal operations on August 18th.",
            period: "August 9th - August 17th",
            features: ["Office Closed", "WhatsApp Available", "Resume Aug 18th"],
            logo: "/obon.webp",
            background: "/obon-logo.webp",
        },
    },
    {
        id: "paypal",
        type: "paypal",
        content: {
            title: "🎉 Zero Fees on Units!",
            subtitle: "0%",
            description:
                "Pay for your units via PayPal and enjoy zero transaction fees—secure, fast, and hassle-free payments.",
            period: "Campaign period: August to October",
            features: ["Secure", "Fast", "Hassle-free"],
            logo: "/paypal-logo.png",
            background: "/banner-background.jpeg",
        },
    },


]

export default function PayPalBanner() {
    const [isVisible, setIsVisible] = useState(false)
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        setTimeout(async () => {
            const res = await fetch("/api/show-paypal-popup", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            })
            if (res.ok) {
                const { showPopup } = await res.json()
                if (showPopup) {
                    setIsVisible(true)
                    setIsMobileModalOpen(true)
                }
            }
        }, 100)
    }, [])

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768)
        onResize()
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    useEffect(() => {
        if (isMobile && isVisible) {
            setIsMobileModalOpen(true)
        }
    }, [isMobile, isVisible])

    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length)
            }, 4000)
            return () => clearInterval(interval)
        }
    }, [isVisible])

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    const slide = slides[currentSlide]

    // Mobile Modal
    if (isMobile) {
        return (
            <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
                <DialogTitle asChild>
                    <h2 className="sr-only">Special Offers</h2>
                </DialogTitle>
                <DialogContent className="w-[90vw] max-w-sm mx-auto text-white border-blue-400 rounded-xl">
                    <div
                        className="absolute inset-0 bg-cover bg-center rounded-xl"
                        style={{ backgroundImage: `url(${slide.content.background})` }}
                        aria-hidden
                    />
                    <div className="absolute inset-0 bg-blue-900/40 rounded-xl" />
                    <div className="space-y-3 p-4 relative z-10">
                        {/* Logo */}
                        {slide.content.logo && (
                            <div className="flex justify-center mb-2">
                                <img src={slide.content.logo} alt="Logo" className="h-10 object-contain" />
                            </div>
                        )}
                        {/* Icon or Title */}
                        {slide.type === "holiday" && (
                            <div className="flex justify-center text-white mb-2">
                                {slide.content.icon}
                            </div>
                        )}
                        <div className="text-center">
                            <div className="text-2xl font-bold">{slide.content.subtitle}</div>
                            <div className="text-xl text-blue-100">{slide.content.title}</div>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                            <Calendar className="h-4 w-4 text-white" />
                            <span className="text-sm font-bold text-white">{slide.content.period}</span>
                        </div>
                        <p className="text-sm text-white leading-relaxed">{slide.content.description}</p>
                        <div className="flex flex-wrap justify-center gap-4 mt-2 text-blue-100 text-xs">
                            {slide.content.features.map((feat, i) => (
                                <div key={i} className="flex items-center space-x-1">
                                    {slide.type === "paypal" ? (
                                        [<Shield className="h-3 w-3" key="s" />, <Zap className="h-3 w-3" key="z" />, <CheckCircle className="h-3 w-3" key="c" />][i]
                                    ) : (
                                        <Star className="h-3 w-3" />
                                    )}
                                    <span>{feat}</span>
                                </div>
                            ))}
                        </div>
                        {/* Carousel Nav */}
                        <div className="flex justify-center items-center space-x-4 mt-4">
                            <Button variant="ghost" size="icon" onClick={prevSlide} className="text-white">
                                <ChevronLeft />
                            </Button>
                            <div className="flex space-x-2">
                                {slides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        className={`w-2 h-2 rounded-full ${idx === currentSlide ? "bg-white" : "bg-white/40"}`}
                                        onClick={() => setCurrentSlide(idx)}
                                    />
                                ))}
                            </div>
                            <Button variant="ghost" size="icon" onClick={nextSlide} className="text-white">
                                <ChevronRight />
                            </Button>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Desktop Banner
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: "120%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className="fixed inset-x-0 bottom-5 px-10 z-[450] h-[200px]"
                >
                    <div
                        className="relative w-full h-full text-white overflow-hidden rounded-lg"
                        style={{
                            backgroundImage: `url(${slide.content.background})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        <div className="absolute inset-0 bg-blue-900/40" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 text-white hover:bg-white/20 z-20 h-8 w-8"
                            onClick={() => setIsVisible(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="px-6 py-4 relative z-10 h-full">
                            <div className="flex items-center justify-between h-full max-w-6xl mx-auto">
                                {/* Left side - Logo */}
                                <div className="flex-shrink-0">
                                    {slide.content.logo && (
                                        <img
                                            src={slide.content.logo || "/placeholder.svg"}
                                            alt="Logo"
                                            className="h-16 w-auto object-contain"
                                        />
                                    )}
                                    {slide.type === "holiday" && !slide.content.logo && (
                                        <div className="text-white text-5xl">{slide.content.icon}</div>
                                    )}
                                </div>

                                {/* Center - Main Content */}
                                <div className="flex-1 px-6">
                                    <div className="flex items-center space-x-3 mb-1">
                                        <h3 className="text-xl font-bold">{slide.content.title}</h3>
                                        <div className="text-2xl font-bold text-yellow-300">{slide.content.subtitle}</div>
                                    </div>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Calendar className="h-4 w-4 text-blue-200" />
                                        <p className="text-white text-xs font-medium">{slide.content.period}</p>
                                    </div>
                                    <p className="text-blue-100 text-sm mb-3 line-clamp-2">{slide.content.description}</p>
                                    <div className="flex flex-wrap gap-4 text-blue-100 text-xs">
                                        {slide.content.features.map((feat, i) => (
                                            <div key={i} className="flex items-center space-x-1">
                                                {slide.type === "paypal" ? (
                                                    i === 0 ? (
                                                        <Shield className="h-3 w-3" />
                                                    ) : i === 1 ? (
                                                        <Zap className="h-3 w-3" />
                                                    ) : (
                                                        <CheckCircle className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <Star className="h-3 w-3" />
                                                )}
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right side - Navigation */}
                                <div className="flex flex-row items-center space-x-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={prevSlide}
                                        className="text-white hover:bg-white/20 h-8 w-8"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="flex flex-row items-center space-x-1">
                                        {slides.map((_, idx) => (
                                            <button
                                                key={idx}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? "bg-white" : "bg-white/40"
                                                    }`}
                                                onClick={() => setCurrentSlide(idx)}
                                            />
                                        ))}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={nextSlide}
                                        className="text-white hover:bg-white/20 h-8 w-8"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
