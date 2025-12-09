"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Check, Edit3, Star, Upload, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"])
const ALLOWED_EXT = /\.(jpe?g|png)$/i

export default function ProductReview({ chatId, accountName, invoiceData, carData, step }) {
  // 3. Remove top-level callable definition
  // const submitTestimony = httpsCallable(functions, "submitTestimony")

  // ---- Lazy-load Framer Motion when needed
  const [FM, setFM] = useState(null) // { motion, AnimatePresence }
  const [prefersReduced, setPrefersReduced] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)")
      setPrefersReduced(!!mq?.matches)
      if (mq && mq.addEventListener) {
        const handler = (e) => setPrefersReduced(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
      }
    }
  }, [])
  const ensureFM = async () => {
    if (FM || prefersReduced) return
    const mod = await import("framer-motion")
    setFM({ motion: mod.motion, AnimatePresence: mod.AnimatePresence })
  }

  // --- STATE MANAGEMENT ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [productRating, setProductRating] = useState(0)
  const [experienceRating, setExperienceRating] = useState(0)
  const [hoverProductRating, setHoverProductRating] = useState(0)
  const [hoverExperienceRating, setHoverExperienceRating] = useState(0)
  const [comment, setComment] = useState("")
  const [uploadedImages, setUploadedImages] = useState([]) // [{file:{name,type,data}}]
  const [imagePreviews, setImagePreviews] = useState([]) // object URLs
  const [uploadErrors, setUploadErrors] = useState([]) // string[]

  const isAllowedType = (file) =>
    (file.type && ALLOWED_TYPES.has(file.type)) || ALLOWED_EXT.test(file.name)

  const fileToPayload = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = String(reader.result).split(",")[1] || ""
        resolve({
          file: {
            name: file.name,
            type: file.type || "application/octet-stream",
            data: base64,
          },
        })
      }
      reader.onerror = () => reject(reader.error || new Error("File read failed"))
      reader.readAsDataURL(file)
    })

  // --- RATING LOGIC ---
  const handleStarClick = (starIndex, type) => {
    if (type === "product") {
      setProductRating(starIndex)
    } else {
      setExperienceRating(starIndex)
    }
  }
  const handleStarHover = (starIndex, type) => {
    if (type === "product") {
      setHoverProductRating(starIndex)
    } else {
      setHoverExperienceRating(starIndex)
    }
  }

  // --- FILE HANDLING ---
  const handleFiles = async (fileList) => {
    const files = Array.from(fileList)
    const remainingSlots = Math.max(0, 5 - uploadedImages.length)
    if (!remainingSlots) return

    const accepted = []
    const errors = []

    for (const f of files) {
      if (accepted.length >= remainingSlots) break
      if (!isAllowedType(f)) {
        errors.push(`${f.name}: only JPEG/PNG images are allowed.`)
        continue
      }
      if (f.size > MAX_SIZE) {
        const mb = (f.size / (1024 * 1024)).toFixed(2)
        errors.push(`${f.name}: ${mb} MB exceeds 5 MB limit.`)
        continue
      }
      accepted.push(f)
    }

    if (accepted.length === 0) {
      if (errors.length) setUploadErrors(errors)
      return
    }

    // Previews
    const newPreviews = accepted.map((f) => URL.createObjectURL(f))
    setImagePreviews((prev) => [...prev, ...newPreviews])

    // Payloads (base64)
    const newPayloads = await Promise.all(accepted.map(fileToPayload))
    setUploadedImages((prev) => [...prev, ...newPayloads])

    if (errors.length) setUploadErrors(errors)
  }

  const handleInputChange = (event) => {
    if (event.target.files) {
      handleFiles(event.target.files)
      // clear previous errors when new files chosen
      setUploadErrors([])
    }
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index])
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // --- DRAG-AND-DROP ---
  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }
  const handleDragEnter = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setIsDragging(false)
  }
  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files) {
      handleFiles(event.dataTransfer.files)
      // Clear the data transfer buffer
      if (event.dataTransfer.items) event.dataTransfer.items.clear()
      else event.dataTransfer.clearData()
    }
  }

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (isSubmitting) return
    if (!chatId) {
      console.error("Error: chatId is missing. Cannot save testimony.")
      return
    }
    setIsSubmitting(true)

    let currentIpInfo
    let currentTokyoTime
    try {
      const fetchPromise = Promise.all([
        fetch(
          "https://asia-northeast2-samplermj.cloudfunctions.net/ipApi/ipInfo"
        ).then((r) => r.json()),
        fetch(
          "https://asia-northeast2-samplermj.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time"
        ).then((r) => r.json()),
      ])
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      )
      const [freshIp, freshTime] = await Promise.race([fetchPromise, timeoutPromise])
      currentIpInfo = freshIp
      currentTokyoTime = freshTime
    } catch (e) {
      console.warn("Failed to fetch fresh data, using cached values:", e)
    }
    if (!currentIpInfo || !currentTokyoTime) {
      console.error("No IP/time data available")
      setIsSubmitting(false)
      return
    }

    // Replace moment: server returns "YYYY/MM/DD HH:mm:ss.SSS"
    const raw = currentTokyoTime?.datetime || ""
    const formattedTime = raw ? raw.replace(" ", " at ").split(".")[0] : ""

    const testimonyData = {
      comment: comment,
      chatId: chatId,
      accountName: accountName,
      carData: carData,
      consignee: invoiceData,
      lastMessageDate: formattedTime,
      images: uploadedImages.map(({ file }) => file),
      productRating: productRating,
      experienceRating: experienceRating,
    }

    try {
      console.log("Sending data to Cloud Function...", testimonyData)
      
      // 4. Dynamic Loading inside submit handler
      const [functionsInstance, { httpsCallable }] = await Promise.all([
          getFirebaseFunctions(),
          import("firebase/functions")
      ]);
      const submitTestimony = httpsCallable(functionsInstance, "submitTestimony");

      const result = await submitTestimony(testimonyData)
      console.log("Function returned successfully:", result.data)
    } catch (error) {
      console.error("Error calling the submitTestimony function:", error)
    }

    resetForm()
    setIsOpen(false)
    setIsSubmitting(false)
  }

  const resetForm = () => {
    setProductRating(0)
    setExperienceRating(0)
    setComment("")
    setUploadedImages([])
    imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    setImagePreviews([])
    setUploadErrors([])
  }

  // Animated wrapper that falls back to plain div if FM not loaded or reduced motion
  const AnimatedWrapper = ({ children }) => {
    if (!FM || prefersReduced) return <div>{children}</div>
    const MotionDiv = FM.motion.div
    return (
      <MotionDiv
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
        whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </MotionDiv>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (step === 7) return // prevent opening when done
          setIsOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogTrigger asChild>
          {step === 7 ? (
            <Button
              disabled
              size="2xl"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-base"
            >
              <Check className="w-5 h-5 mr-2" strokeWidth={5} />
              Feedback Done!
            </Button>
          ) : (
            <div onMouseEnter={ensureFM} onFocus={ensureFM}>
              <AnimatedWrapper>
                <Button
                  size="2xl"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-base"
                >
                  <Edit3 className="w-5 h-5 mr-2" />
                  Write a Feedback
                </Button>
              </AnimatedWrapper>
            </div>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Product Review</DialogTitle>
            <DialogDescription>
              Share your experience with this product. Your review helps other customers make informed decisions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Product Rating */}
            <div className="grid gap-2">
              <Label htmlFor="product-rating">Product Rating</Label>
              <p className="text-sm text-gray-600">Rate the product quality, features, and value</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 hover:scale-110 transition-transform"
                    onClick={() => handleStarClick(star, "product")}
                    onMouseEnter={() => handleStarHover(star, "product")}
                    onMouseLeave={() => setHoverProductRating(0)}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoverProductRating || productRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {productRating > 0 && `${productRating} out of 5 stars`}
                </span>
              </div>
            </div>

            {/* Experience Rating */}
            <div className="grid gap-2">
              <Label htmlFor="experience-rating">Experience Rating</Label>
              <p className="text-sm text-gray-600">
                Rate your overall experience (shipping, packaging, service)
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 hover:scale-110 transition-transform"
                    onClick={() => handleStarClick(star, "experience")}
                    onMouseEnter={() => handleStarHover(star, "experience")}
                    onMouseLeave={() => setHoverExperienceRating(0)}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoverExperienceRating || experienceRating)
                          ? "fill-blue-400 text-blue-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {experienceRating > 0 && `${experienceRating} out of 5 stars`}
                </span>
              </div>
            </div>

            {/* Comment Box */}
            <div className="grid gap-2">
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                placeholder="Tell us about your experience with this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Image Upload */}
            <div className="grid gap-2">
              <Label htmlFor="images">Photos (Optional)</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                      ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}
                      dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-800
                      ${isDragging ? "dark:bg-gray-800" : ""}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG or JPEG (MAX. 5 images)
                      </p>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleInputChange}
                      disabled={uploadedImages.length >= 5}
                    />
                  </label>
                </div>

                {/* Upload errors */}
                {uploadErrors.length > 0 && (
                  <ul className="text-sm text-red-600 list-disc pl-5 space-y-1">
                    {uploadErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative group">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                productRating === 0 ||
                experienceRating === 0 ||
                comment.trim().length === 0
              }
              className="bg-blue-600 hover:bg-blue-700"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
