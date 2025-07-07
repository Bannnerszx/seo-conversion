"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
const InfoBannerSlider = () => {
  const [banners, setBanners] = useState([])
  const [contentWidth, setContentWidth] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    // Fetch active, prioritized banners from admin API
    const loadBanners = async () => {
      try {
        const res = await fetch('/api/fetch-banner-info')
        if (!res.ok) throw new Error('Failed to fetch banners')
        const data = await res.json()
        setBanners(data)
      } catch (error) {
        console.error(error)
      }
    }

    loadBanners()
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      setContentWidth(containerRef.current.scrollWidth)
    }
  }, [banners])

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleBannerClick = url => {
    window.open(url, "_blank")
  }

  return (
    <div className="h-10 bg-black overflow-hidden flex items-center">
      <div className="relative w-full">
        <motion.div
          ref={containerRef}
          className="flex items-center whitespace-nowrap"
          animate={{
            x: [viewportWidth, -contentWidth],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {banners.map((banner, index) => {
            const isLast = index === banners.length - 1

            return banner.url ? (
              <button
                key={banner.id}
                onClick={() => handleBannerClick(banner.url)}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="text-white text-base underline">
                  <span className="font-bold">{banner.title}:</span> {banner.description}
                </span>
                {!isLast && <span className="text-gray-400 mx-2.5 font-bold">|</span>}
              </button>
            ) : (
              <div key={banner.id} className="flex items-center">
                <span className="text-white text-base">
                  <span className="font-bold">{banner.title}:</span> {banner.description}
                </span>
                {!isLast && <span className="text-gray-400 mx-2.5 font-bold">|</span>}
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

export default InfoBannerSlider
