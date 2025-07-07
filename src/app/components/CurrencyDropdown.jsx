"use client";

import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/providers/CurrencyContext";
import { symbol } from "zod";

export default function CurrencyDropdown({ currency }) {
    const { selectedCurrency, setSelectedCurrency } = useCurrency();

    // Define your list of currencies with static values or conversion rates.
    const currencies = [
        { code: "USD", symbol: "USD$", value: 1 },
        { code: "EUR", symbol: "EUR€", value: currency.usdToEur },
        { code: "JPY", symbol: "JPY¥", value: currency.usdToJpy },
        { code: "CAD", symbol: "CAD$", value: currency.usdToCad },
        { code: "AUD", symbol: "AUD$", value: currency.usdToAud },
        { code: "GBP", symbol: "GBP£", value: currency.usdToGbp },
        { code: "ZAR", symbol: "R", value: currency.usdToZar }
    ];

    return (
        <div className="flex items-center">
            <p className="mr-2 text-[#0000ff]">Currency: </p>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 border border-[#0000ff] text-[#0000ff] font-medium transition-colors px-2 rounded-sm">
                    {selectedCurrency.code}
                    <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {currencies.map((curr) => (
                        <DropdownMenuItem
                            key={curr.code}
                            onClick={() => setSelectedCurrency(curr)}
                            className="flex items-center gap-2 text-blue-600"
                        >
                            <span>{curr.symbol}</span>
                            <span>{curr.code}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
