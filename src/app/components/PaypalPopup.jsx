"use client"

import { useState, useEffect } from "react"
import {
  X,
  Zap,
  Shield,
  CheckCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Car,
  Gauge,
  MapPin,
  Fuel,
  LoaderPinwheel,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

// ---- small helper: pick overlay by slide type
const overlayClassByType = {
  paypal: "bg-blue-900/40",
  request: "bg-black/60",
}

// ---- small helper: pick accent text by slide type
const accentTextClassByType = {
  paypal: "text-yellow-300",
  request: "text-blue-300",
}

// ---- icons for carRequest so they're not the same as PayPal
const requestIcons = [Car, Gauge, MapPin, Fuel, LoaderPinwheel, BadgeCheck]

const slides = [
  {
    id: "carRequest",
    type: "request",
    content: {
      title: "🚗 Request a Vehicle",
      subtitle: "Tell us what you need",
      description:
        "Can't find the unit you’re looking for? Send us your specs and we’ll search our network and notify you when we find a match.",
      period: "Active now",
      features: [
        "Specs (Make/Model/Year)",
        "Budget",
        "Destination (Country/Port)",
        "Prefs (Mileage/Trans/Fuel/Options)",
      ],
      // same assets as PayPal (per your request)
      logo: "",
      background: "/requestVehicle.webp",
      // optional: link for CTA
      cta: { label: "Open Request Form", href: "/request-form" },
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

  // ---- Lazy-load Framer Motion for desktop banner
  const [FM, setFM] = useState(null) // { motion, AnimatePresence }
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    setPrefersReduced(!!mq?.matches)
    if (!mq || !mq.addEventListener) return
    const handler = (e) => setPrefersReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const ensureFM = async () => {
    if (FM || prefersReduced) return
    const mod = await import("framer-motion")
    setFM({ motion: mod.motion, AnimatePresence: mod.AnimatePresence })
  }

  // ---- Fetch flag to show popup
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
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
      } catch {
        // fail silently
      }
    }, 100)
    return () => clearTimeout(t)
  }, [])

  // ---- Detect mobile
  useEffect(() => {
    const onResize = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // ---- Keep modal open on mobile when visible
  useEffect(() => {
    if (isMobile && isVisible) setIsMobileModalOpen(true)
  }, [isMobile, isVisible])

  // ---- Carousel auto-advance
  useEffect(() => {
    if (!isVisible) return
    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 8000)
    return () => clearInterval(id)
  }, [isVisible])

  // ---- Preload FM when desktop banner becomes visible
  useEffect(() => {
    if (!isMobile && isVisible) ensureFM()
  }, [isMobile, isVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  const slide = slides[currentSlide]
  const overlayClass = overlayClassByType[slide.type] || "bg-blue-900/40"
  const accentTextClass = accentTextClassByType[slide.type] || "text-yellow-300"

  // ---------- Mobile Modal ----------
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
          <div className={`absolute inset-0 ${overlayClass} rounded-xl`} />
          <div className="space-y-3 p-4 relative z-10">
            {/* Logo */}
            {slide.content.logo && (
              <div className="flex justify-center mb-2">
                <img src={slide.content.logo} alt="Logo" className="h-10 object-contain" />
              </div>
            )}

            {/* Title */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${accentTextClass}`}>{slide.content.subtitle}</div>
              <div className="text-xl text-blue-100">{slide.content.title}</div>
            </div>

            <div className="flex items-center justify-center space-x-1">
              <Calendar className="h-4 w-4 text-white" />
              <span className="text-sm font-bold text-white">{slide.content.period}</span>
            </div>

            <p className="text-sm text-white/95 leading-relaxed">{slide.content.description}</p>

            {/* Features */}
            <div
              className={`flex flex-wrap justify-center gap-2 mt-2 text-xs ${slide.type === "request" ? "text-white" : "text-blue-100"
                }`}
            >
              {slide.content.features.map((feat, i) => {
                // choose icon set per slide type
                const Icon =
                  slide.type === "request"
                    ? requestIcons[i % requestIcons.length]
                    : [Shield, Zap, CheckCircle][Math.min(i, 2)]

                // chip style differs for request
                const chipClass =
                  slide.type === "request"
                    ? "flex items-center gap-1 rounded-full bg-white/10 backdrop-blur px-2 py-1 border border-white/20"
                    : "flex items-center gap-1"

                return (
                  <div key={i} className={chipClass}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{feat}</span>
                  </div>
                )
              })}
            </div>

            {/* CTA only for carRequest */}
            {slide.type === "request" && slide.content.cta?.href && (
              <div className="pt-2">
                <Button
                  asChild
                  className="w-full bg-[#0000ff] hover:bg-blue-600 text-white font-semibold"
                >
                  <a href={slide.content.cta.href} target="_blank" rel="noopener noreferrer">
                    {slide.content.cta.label}
                  </a>
                </Button>
              </div>
            )}

            {/* Carousel Nav */}
            <div className="flex justify-center items-center space-x-4 mt-3">
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

  // ---------- Desktop Banner ----------
  if (!FM || prefersReduced) {
    return isVisible ? (
      <div
        className="fixed inset-x-0 bottom-5 px-10 z-[450] h-[200px]"
        onMouseEnter={ensureFM}
        onFocus={ensureFM}
      >
        <div
          className="relative w-full h-full text-white overflow-hidden rounded-lg"
          style={{
            backgroundImage: `url(${slide.content.background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className={`absolute inset-0 ${overlayClass}`} />
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
              {/* Left: Logo */}
              <div className="flex-shrink-0">
                {slide.content.logo && (
                  <img
                    src={slide.content.logo || "/placeholder.svg"}
                    alt="Logo"
                    className="h-16 w-auto object-contain"
                  />
                )}
              </div>

              {/* Center */}
              <div className="flex-1 px-6">
                <div className="flex items-center flex-wrap gap-3 mb-1">
                  <h3 className="text-xl font-bold">{slide.content.title}</h3>
                  <div className={`text-2xl font-bold ${accentTextClass}`}>
                    {slide.content.subtitle}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-white/80" />
                  <p className="text-white text-xs font-medium">{slide.content.period}</p>
                </div>

                <p className="text-white/90 text-sm mb-3 line-clamp-2">{slide.content.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {slide.content.features.map((feat, i) => {
                    const Icon =
                      slide.type === "request"
                        ? requestIcons[i % requestIcons.length]
                        : [Shield, Zap, CheckCircle][Math.min(i, 2)]

                    const itemClass =
                      slide.type === "request"
                        ? "flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-2.5 py-1 border border-white/15"
                        : "flex items-center gap-1.5"

                    return (
                      <div key={i} className={itemClass}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-white/95">{feat}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right: Nav & CTA for request */}
              <div className="flex items-center gap-3">
                {slide.type === "request" && slide.content.cta?.href && (
                  <Button
                    asChild
                    className="bg-[#0000ff] hover:bg-blue-600 text-white font-semibold"
                  >
                    <a href={slide.content.cta.href} target="_blank" rel="noopener noreferrer">
                      {slide.content.cta.label}
                    </a>
                  </Button>
                )}

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
      </div>
    ) : null
  }

  // ---------- Animated Desktop ----------
  const MotionDiv = FM.motion.div
  const AnimatePresence = FM.AnimatePresence

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionDiv
          initial={{ y: "120%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="fixed inset-x-0 bottom-5 px-10 z-[450] h-[200px]"
          onMouseEnter={ensureFM}
          onFocus={ensureFM}
        >
          <div
            className="relative w-full h-full text-white overflow-hidden rounded-lg"
            style={{
              backgroundImage: `url(${slide.content.background})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className={`absolute inset-0 ${overlayClass}`} />
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
                {/* Left: Logo */}
                <div className="flex-shrink-0">
                  {slide.content.logo && (
                    <img
                      src={slide.content.logo || "/placeholder.svg"}
                      alt="Logo"
                      className="h-16 w-auto object-contain"
                    />
                  )}
                </div>

                {/* Center */}
                <div className="flex-1 px-6">
                  <div className="flex items-center flex-wrap gap-3 mb-1">
                    <h3 className="text-xl font-bold">{slide.content.title}</h3>
                    <div className={`text-2xl font-bold ${accentTextClass}`}>
                      {slide.content.subtitle}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-white/80" />
                    <p className="text-white text-xs font-medium">{slide.content.period}</p>
                  </div>
                  <p className="text-white/90 text-sm mb-3 line-clamp-2">{slide.content.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs">
                    {slide.content.features.map((feat, i) => {
                      const Icon =
                        slide.type === "request"
                          ? requestIcons[i % requestIcons.length]
                          : [Shield, Zap, CheckCircle][Math.min(i, 2)]

                      const itemClass =
                        slide.type === "request"
                          ? "flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-2.5 py-1 border border-white/15"
                          : "flex items-center gap-1.5"

                      return (
                        <div key={i} className={itemClass}>
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-white/95">{feat}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right: Nav & CTA */}
                <div className="flex items-center gap-3">
                  {slide.type === "request" && slide.content.cta?.href && (
                    <Button
                      asChild
                      className="bg-[#0000ff] hover:bg-blue-600 text-white font-semibold"
                    >
                      <a href={slide.content.cta.href} target="_blank" rel="noopener noreferrer">
                        {slide.content.cta.label}
                      </a>
                    </Button>
                  )}

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
        </MotionDiv>
      )}
    </AnimatePresence>
  )
}
