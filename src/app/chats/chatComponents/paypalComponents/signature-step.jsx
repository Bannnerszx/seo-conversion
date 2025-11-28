"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function SignatureStep({ onComplete, onBack, initialSignature = "" }) {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(!!initialSignature)

    // Setup canvas & load initial signature
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const setup = () => {
            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            ctx.strokeStyle = "#000000"
            ctx.lineWidth = 2
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
        }

        setup()

        if (initialSignature) {
            const img = new Image()
            img.onload = () => {
                const ctx = canvas.getContext("2d")
                if (!ctx) return
                const rect = canvas.getBoundingClientRect()
                ctx.drawImage(img, 0, 0, rect.width, rect.height)
                setHasSignature(true)
            }
            img.src = initialSignature
        }

        // Optional: re-setup on resize (handles DPR changes)
        // const onResize = () => setup()
        // window.addEventListener("resize", onResize)
        // return () => window.removeEventListener("resize", onResize)
    }, [initialSignature])

    const getXY = (e) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        const isTouch = "touches" in e
        const clientX = isTouch ? e.touches[0].clientX : e.clientX
        const clientY = isTouch ? e.touches[0].clientY : e.clientY
        return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const startDrawing = (e) => {
        if ("touches" in e) e.preventDefault()
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        setIsDrawing(true)
        setHasSignature(true)

        const { x, y } = getXY(e)
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e) => {
        if (!isDrawing) return
        if ("touches" in e) e.preventDefault()

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const { x, y } = getXY(e)
        ctx.lineTo(x, y)
        ctx.stroke()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clearSignature = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasSignature(false)
    }

    const handleContinue = () => {
        const canvas = canvasRef.current
        if (!canvas || !hasSignature) return
        const signatureData = canvas.toDataURL("image/png")
        onComplete(signatureData)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Add Your Signature</h3>
                <p className="text-sm text-muted-foreground">
                    Draw your signature using your finger or mouse
                </p>
            </div>

            <div className="space-y-4">
                <div className="relative border-2 border-dashed border-border rounded-lg bg-muted/20">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-48 touch-none cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    {!hasSignature && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-sm text-muted-foreground">Sign here</p>
                        </div>
                    )}
                </div>

                <Button
                    variant="outline"
                    onClick={clearSignature}
                    className="w-full bg-transparent"
                    disabled={!hasSignature}
                >
                    Clear Signature
                </Button>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1 h-12 font-semibold bg-transparent">
                    Back
                </Button>
                <Button
                    onClick={handleContinue}
                    disabled={!hasSignature}
                    className="flex-1 h-12 bg-[#0070BA] hover:bg-[#005EA6] text-white font-semibold"
                >
                    Continue to Review
                </Button>
            </div>
        </div>
    )
}
