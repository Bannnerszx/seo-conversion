"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}
