"use client"

import { useState, useEffect, useRef } from "react"
// removed: import { motion } from "framer-motion"

const InfoBannerSlider = () => {
  const [banners, setBanners] = useState([])
  const [contentWidth, setContentWidth] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const containerRef = useRef(null)

  // Lazy-load framer-motion
  const [FM, setFM] = useState(null) // { motion }
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    // fetch banners
    const loadBanners = async () => {
      try {
        const res = await fetch("/api/fetch-banner-info", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch banners")
        const data = await res.json()
        setBanners(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error(error)
      }
    }
    loadBanners()
  }, [])

  // measure content width after banners render
  useEffect(() => {
    if (containerRef.current) {
      setContentWidth(containerRef.current.scrollWidth || 0)
    }
  }, [banners])

  // track viewport width & reduced motion
  useEffect(() => {
    const apply = () => setViewportWidth(typeof window !== "undefined" ? window.innerWidth : 0)
    apply()
    window.addEventListener("resize", apply)
    // prefers-reduced-motion
    const mq = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (mq) {
      setPrefersReduced(!!mq.matches)
      const handler = (e) => setPrefersReduced(e.matches)
      mq.addEventListener?.("change", handler)
      return () => {
        window.removeEventListener("resize", apply)
        mq.removeEventListener?.("change", handler)
      }
    }
    return () => window.removeEventListener("resize", apply)
  }, [])

  // prewarm FM when likely visible
  const ensureFM = async () => {
    if (FM || prefersReduced) return
    const mod = await import("framer-motion")
    setFM({ motion: mod.motion })
  }

  // also try to load FM once content is wider than the viewport (needs to scroll)
  useEffect(() => {
    if (contentWidth > viewportWidth && !prefersReduced) {
      // don't await; fire-and-forget
      import("framer-motion").then((mod) => setFM({ motion: mod.motion })).catch(() => {})
    }
  }, [contentWidth, viewportWidth, prefersReduced])

  const handleBannerClick = (url) => {
    if (!url) return
    try {
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {}
  }

  const shouldScroll = banners.length > 0 && contentWidth > viewportWidth && !prefersReduced

  // ---- Static (no framer) or reduced-motion fallback
  if (!FM || !shouldScroll) {
    return (
      <div className="h-10 bg-black overflow-hidden flex items-center">
        <div className="relative w-full">
          <div
            ref={containerRef}
            className="flex items-center whitespace-nowrap px-3 gap-2"
            onMouseEnter={ensureFM}
            onFocus={ensureFM}
          >
            {banners.map((banner, index) => {
              const isLast = index === banners.length - 1
              const body = (
                <span className="text-white text-base">
                  <span className="font-bold">{banner.title}:</span> {banner.description}
                </span>
              )
              return banner.url ? (
                <button
                  key={banner.id ?? index}
                  onClick={() => handleBannerClick(banner.url)}
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <span className="text-white text-base underline">{body}</span>
                  {!isLast && <span className="text-gray-400 mx-2.5 font-bold">|</span>}
                </button>
              ) : (
                <div key={banner.id ?? index} className="flex items-center">
                  {body}
                  {!isLast && <span className="text-gray-400 mx-2.5 font-bold">|</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---- Animated version with framer-motion (only after lazy-load)
  const MotionDiv = FM.motion.div

  return (
    <div className="h-10 bg-black overflow-hidden flex items-center">
      <div className="relative w-full">
        <MotionDiv
          ref={containerRef}
          className="flex items-center whitespace-nowrap px-3 gap-2"
          animate={{ x: [viewportWidth, -contentWidth] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          onMouseEnter={ensureFM}
          onFocus={ensureFM}
        >
          {banners.map((banner, index) => {
            const isLast = index === banners.length - 1
            const body = (
              <span className="text-white text-base">
                <span className="font-bold">{banner.title}:</span> {banner.description}
              </span>
            )
            return banner.url ? (
              <button
                key={banner.id ?? index}
                onClick={() => handleBannerClick(banner.url)}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="text-white text-base underline">{body}</span>
                {!isLast && <span className="text-gray-400 mx-2.5 font-bold">|</span>}
              </button>
            ) : (
              <div key={banner.id ?? index} className="flex items-center">
                {body}
                {!isLast && <span className="text-gray-400 mx-2.5 font-bold">|</span>}
              </div>
            )
          })}
        </MotionDiv>
      </div>
    </div>
  )
}

export default InfoBannerSlider
