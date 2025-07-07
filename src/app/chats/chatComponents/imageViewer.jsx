"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import Modal from "@/app/components/Modal";

const ImageViewer = ({ uri, alt = "Shared image", context }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scale, setScale] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [initialScale, setInitialScale] = useState(1);
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    // Load image dimensions when modal opens
    useEffect(() => {
        if (isModalOpen) {
            const img = new window.Image();
            img.onload = () => {
                setImageDimensions({ width: img.width, height: img.height });

                // Calculate initial scale to fit image in viewport
                if (containerRef.current) {
                    const containerWidth = containerRef.current.clientWidth;
                    const containerHeight = containerRef.current.clientHeight;

                    const widthRatio = containerWidth / img.width;
                    const heightRatio = containerHeight / img.height;

                    // Use the smaller ratio to ensure the entire image fits (90% of available space)
                    const fitScale = Math.min(widthRatio, heightRatio) * 0.9;

                    setInitialScale(fitScale);
                    setScale(fitScale);
                }
            };
            img.src = uri;
        }
    }, [isModalOpen, uri]);

    const openModal = () => {
        setIsModalOpen(true);
        // Reset position when opening
        setPosition({ x: 0, y: 0 });
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const zoomIn = () => {
        setScale((prevScale) => Math.min(prevScale + 0.2, 5));
    };

    const zoomOut = () => {
        setScale((prevScale) => Math.max(prevScale - 0.2, 0.1));
    };

    const resetZoom = () => {
        setScale(initialScale);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (scale > initialScale * 0.9) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && scale > initialScale * 0.9) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        if (isModalOpen) {
            // e.preventDefault();

            // Calculate zoom centered on cursor position
            const rect = imageRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);

            setScale(newScale);
        }
    };

    // Handle touch events for mobile
    const handleTouchStart = (e) => {
        if (scale > initialScale * 0.9 && e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y,
            });
        }
    };

    const handleTouchMove = (e) => {
        if (isDragging && scale > initialScale * 0.9 && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y,
            });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Add event listener for escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isModalOpen) {
                closeModal();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isModalOpen]);

    return (
        <>
            {/* Thumbnail image */}
            <div
                className="mt-2 rounded-lg overflow-hidden cursor-pointer"
                onClick={openModal}
            >
                {context === 'product' ? (
                    <Image
                        src={uri}
                        alt={alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover cursor-pointer"
                        priority
                    />
                ) : (
                    <Image
                        src={uri || "/placeholder.svg"}
                        alt={alt || "Image thumbnail"}
                        width={300}
                        height={150}
                        className="object-cover rounded-lg"
                    />
                )}

            </div>
            {isModalOpen && (
                <Modal ref={containerRef} context={'imageViewer'} showModal={isModalOpen} setShowModal={closeModal}>


                    <div className="absolute top-4 right-4 z-10 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={zoomIn}
                            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
                            title="Zoom in"
                        >
                            <ZoomIn size={20} />
                        </button>
                        <button
                            onClick={zoomOut}
                            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
                            title="Zoom out"
                        >
                            <ZoomOut size={20} />
                        </button>
                        <button
                            onClick={resetZoom}
                            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
                            title="Fit to screen"
                        >
                            <Maximize size={20} />
                        </button>
                        <button
                            onClick={closeModal}
                            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div
                        ref={imageRef}
                        className="relative w-full h-full"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            cursor: isDragging ? "grabbing" : scale > initialScale ? "grab" : "default",
                        }}
                    >
                        <div
                            className="absolute left-1/2 top-1/2 transform transition-transform duration-100 ease-out"
                            style={{
                                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            }}
                        >
                            <Image
                                src={uri || "/placeholder.svg"}
                                alt={alt}
                                width={imageDimensions.width || 1200}
                                height={imageDimensions.height || 1300}
                                className="max-w-none max-h-none object-contain"
                                unoptimized={true} // For better zoom quality
                                priority={true}
                            />
                        </div>
                    </div>

                    {/* Image dimensions indicator */}
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {imageDimensions.width} × {imageDimensions.height}
                    </div>


                </Modal>
            )}

        </>
    );
};

export default ImageViewer;
