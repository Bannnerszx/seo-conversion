"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createPortal } from "react-dom"

export function FloatingAlert({ show = false, onClose, duration = 5000 }) {
  const [visible, setVisible] = useState(show)
  const [progress, setProgress] = useState(100)
  const [FM, setFM] = useState(null) // { AnimatePresence, motion }

  // only load framer-motion when we actually need to animate
  useEffect(() => {
    if (show && !FM) {
      import("framer-motion").then((mod) => {
        setFM({ AnimatePresence: mod.AnimatePresence, motion: mod.motion })
      })
    }
  }, [show, FM])

  useEffect(() => {
    setVisible(show)
    setProgress(100)

    if (!show) return
    const startTime = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (elapsed >= duration) {
        clearInterval(id)
        setVisible(false)
        onClose?.()
      }
    }, 50) // lower CPU than 16ms; still smooth for a 5s bar

    return () => clearInterval(id)
  }, [show, duration, onClose])

  // Non-animated fallback UI
  const AlertBody = (
    <div className="w-full max-w-md">
      <Alert variant="destructive" className="shadow-lg bg-white relative">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <div className="w-full">
          <AlertTitle className="text-base sm:text-lg">Reservation Failed</AlertTitle>
          <AlertDescription className="text-sm sm:text-base">
            This vehicle has been reserved by another customer.
          </AlertDescription>
        </div>
        <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full overflow-hidden">
          <div
            className="h-full bg-white/40 transition-[width] duration-50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Alert>
    </div>
  )

  return (
    <>
      {visible && (
        <div className="fixed top-[75px] left-0 right-0 flex items-center justify-center z-50 p-4">
          {FM ? (
            <FM.AnimatePresence>
              {visible && (
                <FM.motion.div
                  key="floating-alert"
                  initial={{ y: -50, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -50, opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full"
                >
                  {AlertBody}
                </FM.motion.div>
              )}
            </FM.AnimatePresence>
          ) : (
            // while framer-motion is loading, show the non-animated version
            AlertBody
          )}
        </div>
      )}
    </>
  )
}

export function FloatingAlertPortal({ show, onClose, duration }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(
    <FloatingAlert show={show} onClose={onClose} duration={duration} />,
    document.body
  )
}
