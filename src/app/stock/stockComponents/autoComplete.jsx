"use client";
import { Search } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";

/**
 * Autocomplete Component
 * ----------------------
 * Props:
 *  - dropdownGroups: Array of groups with { placeholder, options: [{ value, label }] }
 *  - onSelect(opt): callback when an option is chosen
 */
export function Autocomplete({ query,setQuery,dropdownGroups, onSelect, context = 'homepage', handleSearch }) {
   
    const [showResults, setShowResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef(null);

    // Flatten all dropdown options
    const allOptions = useMemo(() => {
        return dropdownGroups
            .flat()
            .flatMap((group) =>
                group.options
                    .filter((o) => o.value !== "none")
                    .map((o) => ({
                        value: o.value,
                        label: o.label,
                        category: group.placeholder,
                    }))
            );
    }, [dropdownGroups]);

    // Token-based filtering
    const filteredRaw = useMemo(() => {
        const tokens = query?.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return allOptions;
        return allOptions.filter((opt) =>
            tokens.every((t) => opt.label.toLowerCase().includes(t))
        );
    }, [allOptions, query]);

    // Prefix-first sorting
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return filteredRaw;
        return [...filteredRaw].sort((a, b) => {
            const aStarts = a.label.toLowerCase().startsWith(q);
            const bStarts = b.label.toLowerCase().startsWith(q);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return 0;
        });
    }, [filteredRaw, query]);

    // Group by category for display, but keep flat list for keyboard nav
    const grouped = useMemo(() => {
        return filtered.reduce((acc, opt) => {
            (acc[opt.category] = acc[opt.category] || []).push(opt);
            return acc;
        }, {});
    }, [filtered]);

    // Handle selection
    const handleSelect = (opt) => {
        onSelect(opt);
        setQuery("");
        setShowResults(false);
        setActiveIndex(-1);

    };

    // Keyboard navigation
    const flatList = filtered;
    const onKeyDown = (e) => {
        switch (e.key) {
            case "ArrowDown":
                if (!showResults) return;
                e.preventDefault();
                setActiveIndex((prev) =>
                    Math.min(prev + 1, flatList.length - 1)
                );
                break;

            case "ArrowUp":
                if (!showResults) return;
                e.preventDefault();
                setActiveIndex((prev) =>
                    Math.max(prev - 1, 0)
                );
                break;

            case "Enter":
                e.preventDefault();
                if (showResults && activeIndex >= 0) {
                    // select the highlighted item in the dropdown
                    handleSelect(flatList[activeIndex]);
                } else {
                    // dropdown is closed (or no item is highlighted) → fire your search
                    handleSearch(undefined, query);
                    setShowResults(false);
                }
                break;

            case "Escape":
                setShowResults(false);
                break;

            default:
                break;
        }
    };


    // Close results on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
                setActiveIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative z-[9999]" ref={wrapperRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
            <Input
                placeholder="Search keywords, make, model…"

                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowResults(true);
                   
                }}
                onFocus={() => setShowResults(true)}
                onKeyDown={onKeyDown}
                className="w-full pl-10 h-12 border-blue-200"
            />

            {showResults && (
                <div className="absolute top-full left-0 right-0 z-[99999] mt-1 rounded-md border bg-white shadow-md max-h-[310px]">
                    <Command className="rounded-lg border shadow-md z-[9999]">
                        <CommandList>
                            {filtered.length === 0 && <CommandEmpty>{`Searching for ${query}.`}</CommandEmpty>}
                            {Object.entries(grouped).map(([category, opts]) => (
                                <CommandGroup key={category} heading={category}>
                                    {opts.map((opt, idx) => {
                                        // find global index
                                        const globalIdx = flatList.findIndex(o => o.value === opt.value && o.category === opt.category);
                                        return (
                                            <CommandItem
                                                key={`${category}-${opt.value}`}
                                                onSelect={() => handleSelect(opt)}
                                                className={globalIdx === activeIndex ? 'bg-gray-100' : ''}
                                            >
                                                {opt.label}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            ))}
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
}