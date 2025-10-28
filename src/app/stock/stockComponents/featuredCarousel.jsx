"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
const cars = [
    {
        id: 1,
        make: "Toyota",
        model: "Alphard",
        year: 2020,
        price: 45000,
        mileage: 25000,
        fuelType: "Hybrid",
        transmission: "Automatic",
        location: "Tokyo, Japan",
        rating: 4.8,
        reviews: 24,
        images: ["https://firebasestorage.googleapis.com/v0/b/samplermj.firebasestorage.app/o/vehicle%2F2024100038%2F0.jpg?alt=media&token=e90e4d48-b68b-4472-b321-e49e7d4d0c01"],
        featured: true,
        condition: "Excellent",
        bodyType: "Van",
        stockId: "N202404093F-24",
    },
    {
        id: 2,
        make: "Honda",
        model: "Civic",
        year: 2019,
        price: 22000,
        mileage: 35000,
        fuelType: "Petrol",
        transmission: "Manual",
        location: "Osaka, Japan",
        rating: 4.6,
        reviews: 18,
        images: ["/placeholder.svg?height=400&width=600"],
        featured: false,
        condition: "Good",
        bodyType: "Sedan",
        stockId: "H201905142A-18",
    },
    {
        id: 3,
        make: "Nissan",
        model: "GT-R",
        year: 2021,
        price: 85000,
        mileage: 8000,
        fuelType: "Petrol",
        transmission: "Automatic",
        location: "Tokyo, Japan",
        rating: 4.9,
        reviews: 31,
        images: ["/placeholder.svg?height=600&width=1200"],
        featured: true,
        condition: "Excellent",
        bodyType: "Coupe",
        stockId: "N202108156C-31",
    },
    {
        id: 4,
        make: "Toyota",
        model: "Prius",
        year: 2018,
        price: 18000,
        mileage: 45000,
        fuelType: "Hybrid",
        transmission: "Automatic",
        location: "Kyoto, Japan",
        rating: 4.4,
        reviews: 12,
        images: ["/placeholder.svg?height=400&width=600"],
        featured: false,
        condition: "Good",
        bodyType: "Hatchback",
        stockId: "T201803287H-12",
    },
    {
        id: 5,
        make: "Mazda",
        model: "CX-5",
        year: 2020,
        price: 28000,
        mileage: 20000,
        fuelType: "Petrol",
        transmission: "Automatic",
        location: "Hiroshima, Japan",
        rating: 4.7,
        reviews: 22,
        images: ["/placeholder.svg?height=600&width=1200"],
        featured: true,
        condition: "Excellent",
        bodyType: "SUV",
        stockId: "M202006194S-22",
    },
    {
        id: 6,
        make: "Subaru",
        model: "Impreza",
        year: 2019,
        price: 24000,
        mileage: 30000,
        fuelType: "Petrol",
        transmission: "Manual",
        location: "Sendai, Japan",
        rating: 4.5,
        reviews: 16,
        images: ["/placeholder.svg?height=400&width=600"],
        featured: false,
        condition: "Good",
        bodyType: "Sedan",
        stockId: "S201907123S-16",
    },
    {
        id: 7,
        make: "Lexus",
        model: "RX",
        year: 2021,
        price: 52000,
        mileage: 15000,
        fuelType: "Hybrid",
        transmission: "Automatic",
        location: "Tokyo, Japan",
        rating: 4.8,
        reviews: 28,
        images: ["/placeholder.svg?height=400&width=600"],
        featured: false,
        condition: "Excellent",
        bodyType: "SUV",
        stockId: "L202105234S-28",
    },
    {
        id: 8,
        make: "Honda",
        model: "Accord",
        year: 2020,
        price: 26000,
        mileage: 28000,
        fuelType: "Petrol",
        transmission: "Automatic",
        location: "Osaka, Japan",
        rating: 4.5,
        reviews: 19,
        images: ["/placeholder.svg?height=400&width=600"],
        featured: false,
        condition: "Good",
        bodyType: "Sedan",
        stockId: "H202003187S-19",
    },
]


export default function FeaturedCarsCarousel() {
    const [searchQuery, setSearchQuery] = useState("")
    const [priceRange, setPriceRange] = useState([0, 100000])
    const [selectedMake, setSelectedMake] = useState("")
    const [selectedBodyType, setSelectedBodyType] = useState("")
    const [selectedFuelType, setSelectedFuelType] = useState("")
    const [sortBy, setSortBy] = useState("featured")
    const [favorites, setFavorites] = useState([])
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
    const dragStartX = useRef(null)

    const featuredCars = useMemo(() => cars.filter(c => c.featured), [])

    // Auto-rotate
    useEffect(() => {
        const iv = setInterval(() => {
            setCurrentCarouselIndex(i => (i + 1) % featuredCars.length)
        }, 5000)
        return () => clearInterval(iv)
    }, [featuredCars.length])

    const nextCarousel = () =>
        setCurrentCarouselIndex(i => (i + 1) % featuredCars.length)
    const prevCarousel = () =>
        setCurrentCarouselIndex(i =>
            i - 1 < 0 ? featuredCars.length - 1 : i - 1
        )

    // Handlers for touch
    const handleTouchStart = e => {
        dragStartX.current = e.touches[0].clientX
    }
    const handleTouchEnd = e => {
        if (dragStartX.current === null) return
        const delta = dragStartX.current - e.changedTouches[0].clientX
        if (delta > 50) nextCarousel()
        else if (delta < -50) prevCarousel()
        dragStartX.current = null
    }

    // Handlers for mouse (desktop drag)
    const handleMouseDown = e => {
        dragStartX.current = e.clientX
    }
    const handleMouseUp = e => {
        if (dragStartX.current === null) return
        const delta = dragStartX.current - e.clientX
        if (delta > 50) nextCarousel()
        else if (delta < -50) prevCarousel()
        dragStartX.current = null
    }

    return (
        <div className="relative bg-white px-2">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">Featured Vehicles</h3>
                    <p className="text-gray-600 mt-2">Hand-picked premium cars from our collection</p>
                </div>
                <div
                    className="relative h-80 lg:h-96 overflow-hidden select-none"
                    // touch events
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    // mouse events
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => (dragStartX.current = null)}
                >
                    {featuredCars.map((car, idx) => (
                        <div
                            key={car.id}
                            className={`absolute inset-0 -z-5 transition-opacity duration-700 ${idx === currentCarouselIndex ? "opacity-100" : "opacity-0"
                                }`}
                        >
                            <div className="relative h-full">
                                <Image
                                    src={car.images[0] || "/placeholder.svg"}
                                    alt={`${car.make} ${car.model}`}
                                    fill
                                    className="object-cover"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

                                <div className="absolute inset-0 flex items-center">
                                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                                        <div className="max-w-lg text-white">
                                            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                                                {car.year} {car.make} {car.model}
                                            </h2>
                                            <div className="flex items-center gap-4 mb-6 min-[768px]:mx-8">
                                                <span className="text-3xl font-bold">
                                                    ${car.price.toLocaleString()}
                                                </span>
                                                <Badge className="bg-blue-600 text-white">USD</Badge>
                                            </div>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Arrows */}
                    <button
                        onClick={prevCarousel}
                        className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm items-center justify-center transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={nextCarousel}
                        className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm items-center justify-center transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {featuredCars.map((_, idx) => (
                            <button
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-colors ${idx === currentCarouselIndex ? "bg-white" : "bg-white/50"
                                    }`}
                                onClick={() => setCurrentCarouselIndex(idx)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}