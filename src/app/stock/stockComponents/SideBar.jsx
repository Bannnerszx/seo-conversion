"use client"
import { Sheet, SheetOverlay, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useState, useEffect } from "react"

import CarFilterContent from "./carFilterContent"
import PriceCalculatorCard from "./carCalculatorContent"
import { Calculator, Filter } from "lucide-react"

export function Sidebar({
    d2dCountries,
    isOpen,
    onClose,
    mode,
    countryArray,
    initialMaker = "",
    initialModel = "",
    carFiltersServer,
    carMakes,
    carBodytypes,
    country,
    port,
}) {
    // Filter state
    const [priceRange, setPriceRange] = useState([0, 100000])
    const [yearRange, setYearRange] = useState([2000, 2024])
    const [selectedBrands, setSelectedBrands] = useState([])

    // Calculator state
    const [display, setDisplay] = useState("0")
    const [previousValue, setPreviousValue] = useState(null)
    const [operation, setOperation] = useState(null)
    const [waitingForOperand, setWaitingForOperand] = useState(false)

    // Calculator functions
    const calculate = (firstValue, secondValue, operation) => {
        switch (operation) {
            case "+":
                return firstValue + secondValue
            case "-":
                return firstValue - secondValue
            case "×":
                return firstValue * secondValue
            case "÷":
                return firstValue / secondValue
            case "=":
                return secondValue
            default:
                return secondValue
        }
    }

    const inputNumber = (num) => {
        if (waitingForOperand) {
            setDisplay(num)
            setWaitingForOperand(false)
        } else {
            setDisplay(display === "0" ? num : display + num)
        }
    }

    const inputOperation = (nextOp) => {
        const inputValue = parseFloat(display)
        if (previousValue === null) {
            setPreviousValue(inputValue)
        } else if (operation) {
            const result = calculate(previousValue, inputValue, operation)
            setDisplay(String(result))
            setPreviousValue(result)
        }
        setWaitingForOperand(true)
        setOperation(nextOp)
    }

    const performCalculation = () => {
        const inputValue = parseFloat(display)
        if (previousValue !== null && operation) {
            const result = calculate(previousValue, inputValue, operation)
            setDisplay(String(result))
            setPreviousValue(null)
            setOperation(null)
            setWaitingForOperand(true)
        }
    }

    const clearCalculator = () => {
        setDisplay("0")
        setPreviousValue(null)
        setOperation(null)
        setWaitingForOperand(false)
    }

    const handleBrandChange = (brand, checked) => {
        setSelectedBrands((prev) =>
            checked ? [...prev, brand] : prev.filter((b) => b !== brand)
        )
    }

    const resetFilters = () => {
        setPriceRange([0, 100000])
        setYearRange([2000, 2024])
        setSelectedBrands([])
    }

    const applyFilters = () => {
        console.log("Applying filters:", { priceRange, yearRange, selectedBrands })
        onClose()
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            {/* Overlay above header */}
            <SheetOverlay className="fixed z-[9000] bg-black/50 backdrop-blur-sm" />

            {/* Even higher z-index for content */}
            <SheetContent

                side="left"
                className="fixed z-[9003] top-0 left-0 h-full w-80 bg-white border-r shadow-xl flex flex-col p-0"
            >

                {/* Hidden accessible title */}
                <SheetHeader>
                    {mode === 'filter' && (
                        <SheetTitle className="p-4 flex flex-row items-center space-x-2 border-b">
                            <Filter className="h-5 w-5 mr-2 text-blue-600" />
                            <span className="text-xl">Filter Cars</span>
                        </SheetTitle>
                    )}

                    {mode === 'calculator' && (
                        <SheetTitle className="p-4 flex flex-row items-center space-x-2 border-b">
                            <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                            <span className="text-xl">Price Calculator</span>
                        </SheetTitle>
                    )}

                    <SheetDescription className="sr-only">
                        No description here
                    </SheetDescription>
                </SheetHeader>
                {mode === 'filter' && (
                    <div className="flex-1 overflow-y-auto">
                        <CarFilterContent onClose={onClose} context={'sidebar'} carMakes={carMakes} carBodytypes={carBodytypes} />
                    </div>
                )}
                {mode === 'calculator' && (
                    <div className="flex-1 overflow-y-auto">
                        <PriceCalculatorCard d2dCountries={d2dCountries} onClose={onClose} countryArray={countryArray} context={'sidebar'} />
                    </div>
                )}

            </SheetContent>
        </Sheet>
    )
}
