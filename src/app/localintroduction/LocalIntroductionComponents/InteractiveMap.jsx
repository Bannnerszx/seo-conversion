"use client"

import React, { useState, useRef, useEffect } from "react"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useMediaQuery } from "./use-mobile"
import { motion } from "framer-motion"
// World map topojson

// Define regions with their coordinates and zoom levels
const regions = [
    {
        name: "Africa",
        coordinates: [20, 0],
        zoom: 2.5,
        markerCoordinates: [25, 5],
        description: "Explore the diverse cultures and landscapes of Africa.",
        countries: [
            { name: "Zambia", coordinates: [27.8, -13.1], flag: "🇿🇲" },
            { name: "Uganda", coordinates: [32.3, 1.4], flag: "🇺🇬" },
            { name: "Tanzania", coordinates: [34.9, -6.2], flag: "🇹🇿" },
            { name: "Kenya", coordinates: [37.9, 0.0], flag: "🇰🇪" },
            { name: "DR_Congo", coordinates: [21.75, -4.04], flag: "🇨🇩" },
            { name: "Mozambique", coordinates: [35.5296, -18.6657], flag: "🇲🇿" },
            { name: "Malawi", coordinates: [34.3015, -13.2543], flag: "🇲🇼" },
            { name: "Zimbabwe", coordinates: [29.1549, -19.0154], flag: "🇿🇼" },
            { name: "Burundi", coordinates: [29.9189, -3.3731], flag: "🇧🇮" },
        ],
    },
    {
        name: "Asia",
        coordinates: [100, 30],
        zoom: 2,
        markerCoordinates: [105, 25],
        description: "Discover the rich heritage and traditions of Asia.",
        countries: [
            { name: "China", coordinates: [104.2, 35.9], flag: "🇨🇳" },
            { name: "India", coordinates: [78.9, 20.6], flag: "🇮🇳" },
            { name: "Japan", coordinates: [138.2, 36.2], flag: "🇯🇵" },
            { name: "Thailand", coordinates: [100.9, 15.9], flag: "🇹🇭" },
            { name: "Vietnam", coordinates: [108.3, 14.1], flag: "🇻🇳" },
        ],
    },
    {
        name: "Caribbean",
        coordinates: [-75, 18],
        zoom: 5,
        markerCoordinates: [-75, 15],
        description: "Experience the beautiful islands of the Caribbean.",
        countries: [
            { name: "Antigua and Barbuda", coordinates: [-61.7964, 17.0608], flag: "🇦🇬" },
            { name: "Saint Lucia", coordinates: [-60.9789, 13.9094], flag: "🇱🇨" },
            { name: "Barbados", coordinates: [-59.5432, 13.1939], flag: "🇧🇧" },
            { name: "Jamaica", coordinates: [-77.2975, 18.1096], flag: "🇯🇲" },
            { name: "Saint Vincent and the Grenadines", coordinates: [-61.2872, 12.9843], flag: "🇻🇨" },
            { name: "Trinidad and Tobago", coordinates: [-61.2225, 10.6918], flag: "🇹🇹" },
            { name: "Saint Kitts and Nevis", coordinates: [-62.7830, 17.3578], flag: "🇰🇳" },
            { name: "Cayman Islands", coordinates: [-81.2546, 19.3133], flag: "🇰🇾" },
            { name: "Netherlands Antilles", coordinates: [-68.9900, 12.1696], flag: "🇳🇱" },
            { name: "Panama", coordinates: [-80.7821, 8.5380], flag: "🇵🇦" },
            { name: "Grenada", coordinates: [-61.6780, 12.1165], flag: "🇬🇩" },
            { name: "Cuba", coordinates: [-77.7812, 21.5218], flag: "🇨🇺" },
            { name: "Dominican Republic", coordinates: [-70.1627, 18.7357], flag: "🇩🇴" },
            { name: "Haiti", coordinates: [-72.2852, 18.9712], flag: "🇭🇹" },
            { name: "Puerto Rico", coordinates: [-66.5901, 18.2208], flag: "🇵🇷" },
            // if you really need PNG here
        ],
    },
    {
        name: "Oceania",
        coordinates: [140, -10],           // center roughly on the region
        zoom: 3,                          // adjust to taste
        markerCoordinates: [147.18, -6.31], // PNG’s own coords
        description: "Discover the islands and cultures of Oceania.",
        countries: [
            {
                name: "Papua New Guinea",
                coordinates: [147.1803, -6.3150],
                flag: "🇵🇬",
            },
        ],
    },
    {
        name: "Northern America",
        coordinates: [-100, 60],
        zoom: 3,
        markerCoordinates: [-98, 57],
        description: "Discover the natural beauty and vibrant cities of Canada.",
        countries: [
            { name: "Canada", coordinates: [-100, 60], flag: "🇨🇦" },
        ],
    },
    {
        name: "World",
        coordinates: [0, 0],
        zoom: 1,
        description: "View the entire world map.",
        countries: [],
    },
];


// Country flag images

export const flagImages = {
    // North America
    Canada: "https://flagcdn.com/w80/ca.png",

    // Africa
    Zambia: "https://flagcdn.com/w80/zm.png",
    Uganda: "https://flagcdn.com/w80/ug.png",
    Tanzania: "https://flagcdn.com/w80/tz.png",
    Kenya: "https://flagcdn.com/w80/ke.png",
    DR_Congo: "https://flagcdn.com/w80/cd.png",
    Mozambique: "https://flagcdn.com/w80/mz.png",
    Malawi: "https://flagcdn.com/w80/mw.png",
    Zimbabwe: "https://flagcdn.com/w80/zw.png",
    Burundi: "https://flagcdn.com/w80/bi.png",

    // Asia
    China: "https://flagcdn.com/w80/cn.png",
    India: "https://flagcdn.com/w80/in.png",
    Japan: "https://flagcdn.com/w80/jp.png",
    Thailand: "https://flagcdn.com/w80/th.png",
    Vietnam: "https://flagcdn.com/w80/vn.png",

    // Caribbean
    Jamaica: "https://flagcdn.com/w80/jm.png",
    Cuba: "https://flagcdn.com/w80/cu.png",
    "Dominican Republic": "https://flagcdn.com/w80/do.png",
    Haiti: "https://flagcdn.com/w80/ht.png",
    "Puerto Rico": "https://flagcdn.com/w80/pr.png",
    "Antigua and Barbuda": "https://flagcdn.com/w80/ag.png",
    "Saint Lucia": "https://flagcdn.com/w80/lc.png",
    Barbados: "https://flagcdn.com/w80/bb.png",
    "Saint Vincent and the Grenadines": "https://flagcdn.com/w80/vc.png",
    "Trinidad and Tobago": "https://flagcdn.com/w80/tt.png",
    "Saint Kitts and Nevis": "https://flagcdn.com/w80/kn.png",
    "Cayman Islands": "https://flagcdn.com/w80/ky.png",
    "Netherlands Antilles": "https://flagcdn.com/w80/an.png",
    Panama: "https://flagcdn.com/w80/pa.png",
    Grenada: "https://flagcdn.com/w80/gd.png",
    "Papua New Guinea": "https://flagcdn.com/w80/pg.png",
};

// Default position
const DEFAULT_POSITION = { coordinates: [25.124154322505113, 12.809272571838703], zoom: 1 }

export default function InteractiveMap({ geoUrl }) {
    const [position, setPosition] = useState(DEFAULT_POSITION)
    const [selectedRegion, setSelectedRegion] = useState("World")
    const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 450 })
    const [isZoomed, setIsZoomed] = useState(false)
    const [showCountryList, setShowCountryList] = useState(false)
    const [hoveredCountry, setHoveredCountry] = useState(null)
    const [isPinBouncing, setIsPinBouncing] = useState(false)
    const containerRef = useRef(null)

    const isMobile = useMediaQuery("(max-width: 768px)")

    // Update map dimensions based on container size
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect()
                setMapDimensions({ width, height: height * 0.85 }) // Leave some space for buttons
            }
        }

        // Initial update
        updateDimensions()

        // Update on resize
        window.addEventListener("resize", updateDimensions)
        return () => window.removeEventListener("resize", updateDimensions)
    }, [])

    // Check if the map is zoomed
    useEffect(() => {
        // Consider the map zoomed if zoom is not 1 or coordinates are not [0,0]
        const zoomChanged = Math.abs(position.zoom - DEFAULT_POSITION.zoom) > 0.01
        const coordinatesChanged =
            Math.abs(position.coordinates[0] - DEFAULT_POSITION.coordinates[0]) > 0.01 ||
            Math.abs(position.coordinates[1] - DEFAULT_POSITION.coordinates[1]) > 0.01

        setIsZoomed(zoomChanged || coordinatesChanged)
    }, [position])

    // Start bouncing animation when hoveredCountry changes
    useEffect(() => {
        if (hoveredCountry) {
            setIsPinBouncing(true)
            const timer = setTimeout(() => setIsPinBouncing(false), 1000)
            return () => clearTimeout(timer)
        }
    }, [hoveredCountry])

    const handleRegionClick = (region) => {
        setPosition({
            coordinates: region.coordinates,
            zoom: region.zoom,
        })
        setSelectedRegion(region.name)

        // Show country list if the region has countries
        if (region.countries && region.countries.length > 0) {
            setShowCountryList(true)
        } else {
            setShowCountryList(false)
        }
    }

    const handleReset = () => {
        setPosition(DEFAULT_POSITION)
        setSelectedRegion("World")
        setShowCountryList(false)
        setHoveredCountry(null)
    }

    const handleMoveEnd = (newPosition) => {
        setPosition(newPosition)
    }

    const handleCountryHover = (country) => {
        setHoveredCountry(country)
    }

    const handleCountryLeave = () => {
        setHoveredCountry(null)
    }

    const handleCountrySelect = (countryName) => {
        window.location.href = `/localinformation/${encodeURIComponent(countryName)}`
    }

    // Calculate projection scale based on width
    const getProjectionScale = () => {
        return mapDimensions.width / 4.5
    }

    // Get the selected region object
    const selectedRegionObj = regions.find((r) => r.name === selectedRegion) || regions[3] // Default to World

    // Get coordinates for the hovered country
    const getHoveredCountryCoordinates = () => {
        if (!hoveredCountry || !selectedRegionObj) return null

        const country = selectedRegionObj.countries.find((c) => c.name === hoveredCountry)
        return country ? country.coordinates : null
    }

    return (
        <Card className="w-full h-full mx-auto">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-4xl font-bold">Local Introduction</CardTitle>
                <CardDescription className="text-lg">
                    You can check the local information by selecting from the country on the map.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 h-[calc(100%-5rem)]" ref={containerRef}>
                {isMobile ? (
                    <div className="space-y-4">
                        {/* Region Dropdown for Mobile */}
                        <Select
                            value={selectedRegion}
                            onValueChange={(value) => {
                                const region = regions.find((r) => r.name === value)
                                if (region) {
                                    handleRegionClick(region)
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a region" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Regions</SelectLabel>
                                    {regions.map((region) => (
                                        <SelectItem key={region.name} value={region.name}>
                                            {region.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {/* Country List for Mobile */}
                        {selectedRegion !== "World" && selectedRegionObj.countries.length > 0 && (
                            <div className="mt-4">
                                <h3 className="font-medium mb-2">Countries in {selectedRegion}</h3>
                                <div className="border rounded-md divide-y">
                                    {selectedRegionObj.countries.map((country) => (
                                        <Link
                                            key={country.name}
                                            href={`/localinformation/${encodeURIComponent(country.name)}`}
                                            className="block"
                                        >
                                            <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={flagImages[country.name] || "/placeholder.svg"}
                                                        alt={`${country.name} flag`}
                                                        className="w-8 h-6 object-cover border border-gray-200"
                                                    />
                                                    <span>{country.name}</span>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Region Description for Mobile */}
                        {selectedRegion !== "World" && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                <h3 className="font-bold">{selectedRegion}</h3>
                                <p className="text-sm text-gray-600">{selectedRegionObj.description}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative h-[85%]">
                        <ComposableMap
                            projection="geoEqualEarth"
                            projectionConfig={{
                                scale: getProjectionScale(),
                            }}
                            width={mapDimensions.width}
                            height={mapDimensions.height}
                            className="w-full h-full bg-white"
                        >
                            <ZoomableGroup center={position.coordinates} zoom={position.zoom} onMoveEnd={handleMoveEnd}>
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill="#DCD5E6"
                                                stroke="#FFFFFF"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { fill: "#F5F4F6", outline: "none" },
                                                    pressed: { fill: "#E42", outline: "none" },
                                                }}
                                            />
                                        ))
                                    }
                                </Geographies>


                                {regions
                                    .filter(region => region.name !== "World" && region.markerCoordinates)
                                    .map(region => {
                                        // only show markers for regions that aren’t currently selected
                                        if (selectedRegion === region.name) return null

                                        const [longitude, latitude] = region.markerCoordinates

                                        return (
                                            <Marker key={region.name} coordinates={[longitude, latitude]}>
                                                <g
                                                    fill="none"
                                                    stroke="#E7535F"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    transform="translate(-12, -24)"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => {
                                                        handleRegionClick(region)

                                                    }}
                                                >
                                                    <circle cx="12" cy="10" r="3" />
                                                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
                                                </g>

                                                {/* stem lines */}
                                                <line
                                                    x1="0"
                                                    y1="-22.5"
                                                    x2="20"
                                                    y2="-40"
                                                    style={{ stroke: '#E7535F', strokeWidth: '0.5' }}
                                                />
                                                <line
                                                    x1="20"
                                                    y1="-40"
                                                    x2="50"
                                                    y2="-40"
                                                    style={{ stroke: '#E7535F', strokeWidth: '0.5' }}
                                                />

                                                {/* dot at end of stem */}
                                                <circle
                                                    cx="50"
                                                    cy="-40"
                                                    r="1"
                                                    fill="#E7535F"
                                                    stroke="#E7535F"
                                                    strokeWidth="0.5"
                                                />

                                                {/* label */}
                                                <text
                                                    x="25"
                                                    y="-45"
                                                    textAnchor="start"
                                                    alignmentBaseline="middle"
                                                    fill="#E7535F"
                                                    fontSize="10px"
                                                    fontWeight="bold"
                                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                                    onClick={() => handleRegionClick(region)}
                                                >
                                                    {region.name}
                                                </text>
                                            </Marker>
                                        )
                                    })}

                                {hoveredCountry && getHoveredCountryCoordinates() && (
                                    <Marker coordinates={getHoveredCountryCoordinates()}>
                                        <motion.g
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: [-20, -32, -20] }}
                                            transition={{
                                                duration: 1,
                                                ease: "easeInOut",
                                                repeat: Infinity,
                                                repeatType: "loop"
                                            }}
                                            fill="none"
                                            stroke="#a286be"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            transform="translate(-12, -30)"
                                        >
                                            <circle cx="12" cy="10" r="3" />
                                            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />

                                        </motion.g>
                                    </Marker>
                                )}

                            </ZoomableGroup>
                        </ComposableMap>

                        {/* Country list modal */}
                        {showCountryList && selectedRegionObj.countries.length > 0 && (
                            <div
                                className="
                  absolute
                  top-1/2
               right-1/2
                  transform -translate-x-1/2 -translate-y-1/2
                  bg-white
                  rounded-lg
                  shadow-lg
                  w-80
                  max-h-[400px]
                  overflow-auto
                "
                            >
                                {/* header */}
                                <div className="sticky top-0 bg-gray-100 p-4 text-center font-bold text-xl border-b">
                                    {selectedRegion}
                                </div>

                                {/* list */}
                                <div className="divide-y">
                                    {selectedRegionObj.countries.map((country) => {
                                        // if this is the DR_Congo placeholder, remap everything to the full name
                                        const isDR = country.name === "DR_Congo";
                                        const lookupKey = isDR
                                            ? "DR_Congo"
                                            : country.name;
                                        const displayName = isDR
                                            ? "Democratic Republic of Congo (DR Congo)"
                                            : country.name;
                                        const hrefName = lookupKey; // we'll URI-encode this below

                                        return (
                                            <Link
                                                key={country.name}
                                                href={`/localinformation/${encodeURIComponent(hrefName)}`}
                                                className="block"
                                                onMouseEnter={() => handleCountryHover(country.name)}
                                                onMouseLeave={handleCountryLeave}
                                            >
                                                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={flagImages[lookupKey] || "/placeholder.svg"}
                                                            alt={`${displayName} flag`}
                                                            className="w-8 h-6 object-cover border border-gray-200"
                                                        />
                                                        <span>{displayName}</span>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Region information */}
                        {selectedRegion !== "World" && !showCountryList && (
                            <div className="absolute bottom-4 left-4 bg-white p-2 md:p-4 rounded-md shadow-md max-w-[200px] md:max-w-xs text-xs md:text-sm">
                                <h3 className="font-bold text-lg">{selectedRegion}</h3>
                                <p className="text-sm text-gray-600">{selectedRegionObj.description}</p>
                            </div>
                        )}

                        {/* Reset button - show whenever the map is zoomed */}
                        {isZoomed && (
                            <button
                                onClick={handleReset}
                                className="absolute top-4 right-4 bg-white px-2 py-1 rounded-md shadow-md text-xs md:text-sm hover:bg-gray-100"
                            >
                                Reset View
                            </button>
                        )}
                    </div>
                )}

                {/* Region buttons - only show on desktop */}
                {!isMobile && (
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {regions.map((region) => (
                            <button
                                key={region.name}
                                onClick={() => handleRegionClick(region)}
                                className={`px-4 py-2 rounded-md ${selectedRegion === region.name ? "bg-rose-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                                    }`}
                            >
                                {region.name}
                            </button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
