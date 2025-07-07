"use client"

import React, { useState, useEffect } from "react"
import { ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ScrollToTop({ showAfter = 300, className = "" }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [showAfter])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  if (!isVisible) return null

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-[#0000ff] hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
      size="icon"
      aria-label="Scroll to top"
    >
      <ChevronUp className="h-6 w-6" />
    </Button>
  )
}
