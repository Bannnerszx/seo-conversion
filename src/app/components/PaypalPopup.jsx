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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const slides = [
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
    }, 4000)
    return () => clearInterval(id)
  }, [isVisible])

  // ---- Preload FM when desktop banner becomes visible
  useEffect(() => {
    if (!isMobile && isVisible) ensureFM()
  }, [isMobile, isVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  const slide = slides[currentSlide]

  // ---------- Mobile Modal (no framer-motion needed) ----------
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
            {/* Title */}
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

  // ---------- Desktop Banner ----------
  // If framer-motion not loaded (or user prefers reduced motion), show a non-animated fallback.
  if (!FM || prefersReduced) {
    return isVisible ? (
      <div
        className="fixed inset-x-0 bottom-5 px-10 z-[450] h-[200px]"
        // optional prewarm on first hover/focus
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
                      {i === 0 ? (
                        <Shield className="h-3 w-3" />
                      ) : i === 1 ? (
                        <Zap className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Nav */}
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
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentSlide ? "bg-white" : "bg-white/40"
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

  // With framer-motion loaded: animate the desktop banner
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
                        {i === 0 ? (
                          <Shield className="h-3 w-3" />
                        ) : i === 1 ? (
                          <Zap className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Nav */}
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
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentSlide ? "bg-white" : "bg-white/40"
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
