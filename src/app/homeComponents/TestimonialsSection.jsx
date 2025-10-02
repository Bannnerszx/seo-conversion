"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function TestimonialsSection({ testimonials = [], autoPlayInterval = 8000 }) {
    // ======= State & Refs
    const baseCount = testimonials.length
    const [activeIdx, setActiveIdx] = useState(0)      // index within the extended (tripled) array
    const [visualIdx, setVisualIdx] = useState(0)      // index within the base array (0..baseCount-1)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [cardsToShow, setCardsToShow] = useState(1)

    const containerRef = useRef(null)
    const itemRefs = useRef([])

    // Drag helpers (pointer + rAF)
    const isPointerDown = useRef(false)
    const dragStartX = useRef(0)
    const dragStartScrollLeft = useRef(0)
    const rafId = useRef(null)
    const pendingDelta = useRef(0)

    // ======= Build loop track (3x data for infinite)
    const loopData = baseCount > 0 ? [...testimonials, ...testimonials, ...testimonials] : []
    const MIDDLE_START = baseCount // start in the middle copy

    // Keep refs array sized
    useEffect(() => {
        itemRefs.current = new Array(loopData.length)
    }, [loopData.length])

    // ======= Responsive visible “density” (purely visual widths)
    useEffect(() => {
        const updateCardsToShow = () => {
            const w = typeof window !== "undefined" ? window.innerWidth : 0
            if (w >= 1024) setCardsToShow(3)
            else if (w >= 768) setCardsToShow(2)
            else setCardsToShow(1)
        }
        updateCardsToShow()
        window.addEventListener("resize", updateCardsToShow)
        return () => window.removeEventListener("resize", updateCardsToShow)
    }, [])

    // ======= Centering
    const scrollToIndex = useCallback((idx, behavior = "smooth") => {
        const container = containerRef.current
        const el = itemRefs.current[idx]
        if (!container || !el) return
        const left = el.offsetLeft + el.offsetWidth / 2 - container.clientWidth / 2
        container.scrollTo({ left, behavior })
    }, [])

    // Normalize to the middle copy if we drift to the edges
    const normalizeIfNeeded = useCallback((idx) => {
        if (baseCount === 0) return idx
        if (idx < baseCount) {
            // jumped too far left, bring to middle
            return idx + baseCount
        } else if (idx >= 2 * baseCount) {
            // jumped too far right, bring to middle
            return idx - baseCount
        }
        return idx
    }, [baseCount])

    // Snap to nearest card center after drag or free scroll
    const snapToNearest = useCallback(() => {
        const container = containerRef.current
        if (!container || loopData.length === 0) return
        const center = container.scrollLeft + container.clientWidth / 2
        let best = 0
        let bestDist = Infinity
        itemRefs.current.forEach((el, i) => {
            if (!el) return
            const c = el.offsetLeft + el.offsetWidth / 2
            const d = Math.abs(c - center)
            if (d < bestDist) {
                bestDist = d
                best = i
            }
        })
        let next = normalizeIfNeeded(best)
        setActiveIdx(next)
        setVisualIdx(baseCount ? next % baseCount : 0)
        // ensure we’re actually on the normalized position (instant)
        if (next !== best) scrollToIndex(next, "auto")
        else scrollToIndex(next, "smooth")
    }, [loopData.length, normalizeIfNeeded, baseCount, scrollToIndex])

    // ======= Init at middle copy and center
    useEffect(() => {
        if (baseCount === 0) return
        setActiveIdx(MIDDLE_START)
        setVisualIdx(0)
        // wait next tick for refs to exist
        const id = setTimeout(() => scrollToIndex(MIDDLE_START, "auto"), 0)
        return () => clearTimeout(id)
    }, [baseCount, scrollToIndex])

    // Keep centered when index/layout changes
    useEffect(() => {
        if (baseCount === 0) return
        scrollToIndex(activeIdx, "smooth")
    }, [activeIdx, cardsToShow, baseCount, scrollToIndex])

    // Re-center instantly on resize
    useEffect(() => {
        const onResize = () => scrollToIndex(activeIdx, "auto")
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [activeIdx, scrollToIndex])

    // ======= Autoplay (infinite)
    useEffect(() => {
        if (isHovered || isDragging || autoPlayInterval <= 0 || baseCount <= 1) return
        const id = setInterval(() => {
            setActiveIdx((prev) => {
                const next = prev + 1
                const normalized = normalizeIfNeeded(next)
                setVisualIdx(baseCount ? normalized % baseCount : 0)
                if (normalized !== next) {
                    // jump without animation then continue
                    scrollToIndex(normalized, "auto")
                }
                return normalized
            })
        }, autoPlayInterval)
        return () => clearInterval(id)
    }, [isHovered, isDragging, autoPlayInterval, baseCount, normalizeIfNeeded, scrollToIndex])

    // ======= Controls (infinite)
    const goToNext = useCallback(() => {
        setActiveIdx((prev) => {
            const next = prev + 1
            const normalized = normalizeIfNeeded(next)
            setVisualIdx(baseCount ? normalized % baseCount : 0)
            if (normalized !== next) scrollToIndex(normalized, "auto")
            return normalized
        })
    }, [normalizeIfNeeded, baseCount, scrollToIndex])

    const goToPrevious = useCallback(() => {
        setActiveIdx((prev) => {
            const next = prev - 1
            const normalized = normalizeIfNeeded(next)
            setVisualIdx(baseCount ? normalized % baseCount : 0)
            if (normalized !== next) scrollToIndex(normalized, "auto")
            return normalized
        })
    }, [normalizeIfNeeded, baseCount, scrollToIndex])

    // ======= Pointer events (smooth dragging with rAF)
    const finishPointer = useCallback((e) => {
        const c = containerRef.current
        if (!c) return
        isPointerDown.current = false
        setIsDragging(false)
        c.releasePointerCapture?.(e.pointerId)
        if (rafId.current) cancelAnimationFrame(rafId.current)
        rafId.current = null
        snapToNearest()
    }, [snapToNearest])

    // ======= Early out
    if (baseCount === 0) return null

    return (
        <div className="relative w-full bg-white py-6 md:py-12">
            <div className="text-center mb-6 md:mb-10 px-4">
                <Quote className="h-10 w-10 md:h-12 md:w-12 text-blue-600 mx-auto mb-3" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                    Customer Reviews
                </h2>
            </div>

            <div
                ref={containerRef}
                className={[
                    "relative w-screen mx-auto overflow-x-hidden overflow-y-hidden", // full width
                    "cursor-grab active:cursor-grabbing touch-pan-x",
                    isDragging ? "snap-none select-none" : "snap-x snap-mandatory",
                ].join(" ")}
                style={{ scrollBehavior: "auto", willChange: "scroll-position" }} // we control smoothness manually
                onPointerDown={(e) => {
                    const c = containerRef.current
                    if (!c) return
                    isPointerDown.current = true
                    setIsDragging(true)
                    c.setPointerCapture?.(e.pointerId)
                    dragStartX.current = e.clientX
                    dragStartScrollLeft.current = c.scrollLeft
                    pendingDelta.current = 0
                }}
                onPointerMove={(e) => {
                    if (!isPointerDown.current) return
                    const c = containerRef.current
                    if (!c) return
                    pendingDelta.current = dragStartX.current - e.clientX
                    if (rafId.current == null) {
                        rafId.current = requestAnimationFrame(() => {
                            c.scrollLeft = dragStartScrollLeft.current + pendingDelta.current
                            rafId.current = null
                        })
                    }
                }}
                onPointerUp={finishPointer}
                onPointerCancel={finishPointer}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex gap-4 md:gap-6 py-4 md:py-8">
                    {loopData.map((t, i) => (
                        <div
                            key={`${t.id ?? i}-${i}`} // stable enough for cloned sets
                            ref={(el) => (itemRefs.current[i] = el)}
                            className="shrink-0 snap-center px-1 transition-transform duration-300"
                            style={{
                                // visible density; middle remains centered via measurement
                                width:
                                    cardsToShow === 1 ? "85vw" : cardsToShow === 2 ? "50vw" : "33.333vw",
                                maxWidth: 460,
                            }}
                        >
                            <TestimonialCard
                                testimonial={t}
                                isActive={i === activeIdx}
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-8 mt-6 md:mt-10 px-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPrevious}
                    className="text-[#0000ff] hover:bg-blue-50 h-10 w-10 md:h-12 md:w-12"
                    aria-label="Previous testimonials"
                >
                    <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
                </Button>
                {/* 
                <Button
                    variant="outline"
                    className="bg-transparent border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-4 md:px-8 py-3 md:py-5 text-xs md:text-sm font-semibold tracking-wider"
                >
                    SEE ALL REVIEWS
                </Button> */}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNext}
                    className="text-[#0000ff] hover:bg-blue-50 h-10 w-10 md:h-12 md:w-12"
                    aria-label="Next testimonials"
                >
                    <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
                </Button>
            </div>
        </div>
    )
}

function TestimonialCard({ testimonial, isActive, draggable }) {
    return (
        <Card className={`bg-white shadow-lg overflow-hidden h-full ${isActive ? "ring-2 ring-[#0000ff]" : ""}`}>
            <div className="p-6 md:p-8 space-y-4 md:space-y-6 flex flex-col items-center text-center h-full">
                <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-4 border-blue-600">
                    <Image
                        src={testimonial.productImage || "/placeholder.svg"}
                        alt={testimonial.author ?? "Customer"}
                        fill
                        className="object-cover"
                        sizes="128px"
                        priority={false}
                        draggable={draggable ?? false}
                    />
                </div>


                <blockquote className="text-gray-700 text-base md:text-lg leading-relaxed flex-grow">
                    “{testimonial.quote}”
                </blockquote>
                <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={cn(
                                "h-5 w-5",
                                i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted",
                            )}
                        />
                    ))}
                </div>
                <div className="pt-4 border-t border-cyan-100 w-full">
                    <p className="font-bold text-lg md:text-xl text-gray-900">{testimonial.author}</p>
                    <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wider mt-1">Frequent Buyer</p>
                </div>
            </div>
        </Card>
    )
}
