"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Edit3, Star, Upload, X } from "lucide-react"

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

export default function ProductReview() {
    // --- STATE MANAGEMENT ---
    const [isDragging, setIsDragging] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState("")
    const [uploadedImages, setUploadedImages] = useState([])
    const [imagePreviews, setImagePreviews] = useState([])

    // --- RATING LOGIC ---
    const handleStarClick = (starIndex) => {
        setRating(starIndex)
    }

    const handleStarHover = (starIndex) => {
        setHoverRating(starIndex)
    }

    // --- REFACTORED FILE HANDLING LOGIC ---

    /**
     * Central function to process a list of files (from either drag-and-drop or file input).
     * @param {FileList} fileList - The list of files to process.
     */
    const handleFiles = (fileList) => {
        const files = Array.from(fileList)
        const remainingSlots = 5 - uploadedImages.length

        // Filter for valid image types and only take as many as there are open slots.
        const newImageFiles = files
            .filter((file) => file.type.startsWith("image/"))
            .slice(0, remainingSlots)

        if (newImageFiles.length > 0) {
            setUploadedImages((prev) => [...prev, ...newImageFiles])

            const newPreviews = newImageFiles.map((file) => URL.createObjectURL(file))
            setImagePreviews((prev) => [...prev, ...newPreviews])
        }
    }

    /**
     * Handles file selection from the hidden file input (the "click" part).
     */
    const handleInputChange = (event) => {
        if (event.target.files) {
            handleFiles(event.target.files)
        }
    }

    /**
     * Removes an image from the preview and the upload list.
     * @param {number} index - The index of the image to remove.
     */
    const removeImage = (index) => {
        URL.revokeObjectURL(imagePreviews[index]) // Revoke URL to prevent memory leaks
        setUploadedImages((prev) => prev.filter((_, i) => i !== index))
        setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    }

    // --- DRAG-AND-DROP LOGIC ---
    const handleDragOver = (event) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const handleDragEnter = (event) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (event) => {
        // This check prevents the drag leave event from firing when moving over a child element
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setIsDragging(false)
    }

    const handleDrop = (event) => {
        event.preventDefault()
        setIsDragging(false)

        if (event.dataTransfer.files) {
            handleFiles(event.dataTransfer.files) // Use the central file handler
            // Clear the data transfer buffer
            if (event.dataTransfer.items) {
                event.dataTransfer.items.clear()
            } else {
                event.dataTransfer.clearData()
            }
        }
    }

    // --- FORM SUBMISSION AND RESET LOGIC ---
    const handleSubmit = () => {
        console.log({
            rating,
            comment,
            images: uploadedImages,
        })
        resetForm()
        setIsOpen(false)
    }

    const resetForm = () => {
        setRating(0)
        setHoverRating(0)
        setComment("")
        setUploadedImages([])
        // Clean up all created object URLs
        imagePreviews.forEach((url) => URL.revokeObjectURL(url))
        setImagePreviews([])
    }

    return (
        <div className="flex items-center justify-center p-4">
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) resetForm()
                }}
            >
                <DialogTrigger asChild>
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: 0.2,
                        }}
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            size="lg" // Adjusted for better visuals
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-base"
                        >
                            <Edit3 className="w-5 h-5 mr-2" />
                            Write a Review
                        </Button>
                    </motion.div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Write a Product Review</DialogTitle>
                        <DialogDescription>
                            Share your experience with this product. Your review helps other customers make informed decisions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        {/* Star Rating */}
                        <div className="grid gap-2">
                            <Label htmlFor="rating">Rating</Label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="p-1 hover:scale-110 transition-transform"
                                        onClick={() => handleStarClick(star)}
                                        onMouseEnter={() => handleStarHover(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    >
                                        <Star
                                            className={`w-6 h-6 transition-colors ${star <= (hoverRating || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                                }`}
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground">
                                    {rating > 0 && `${rating} out of 5 stars`}
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
                            disabled={rating === 0 || comment.trim().length === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Submit Review
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}