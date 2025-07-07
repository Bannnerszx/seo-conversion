"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
export function FloatingAlert({ show = false, onClose, duration = 5000 }) {
    const [visible, setVisible] = useState(show)
    const [progress, setProgress] = useState(100)

    useEffect(() => {
        setVisible(show)
        setProgress(100)

        if (show) {
            // Start the progress countdown
            const startTime = Date.now()
            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime
                const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
                setProgress(remaining)

                if (elapsed >= duration) {
                    clearInterval(interval)
                    setVisible(false)
                    if (onClose) onClose()
                }
            }, 16) // ~60fps update

            return () => clearInterval(interval)
        }
    }, [show, duration, onClose])

    return (
        <AnimatePresence>
            {visible && (
                <div className="fixed top-[75px] left-0 right-0 flex items-center justify-center z-50 p-4">
                    <motion.div
                        className="w-full max-w-md"
                        initial={{ y: -50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -50, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <Alert variant="destructive" className="shadow-lg bg-white">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <div className="w-full">
                                <AlertTitle className="text-base sm:text-lg">
                                    Chat Already Exists
                                </AlertTitle>
                                <AlertDescription className="text-sm sm:text-base">
                                    A chat already exists for this inquiry. Please check your existing conversations.
                                </AlertDescription>
                            </div>

                            {/* Progress bar */}
                            <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white/40"
                                    initial={{ width: "100%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0, ease: "linear" }}
                                />
                            </div>
                        </Alert>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
export function FloatingAlertPortal({ show, onClose, duration }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return createPortal(
        <FloatingAlert show={show} onClose={onClose} duration={duration} />,
        document.body
    )
}