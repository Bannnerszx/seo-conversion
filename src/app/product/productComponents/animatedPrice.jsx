"use client";

import { useEffect, useState, useRef } from "react";

export function AnimatedPrice({ value, duration = 1000, symbol = "", className = "font-bold", selectedPort }) {
    // Start at 0 to force an animation on mount.
    const [displayValue, setDisplayValue] = useState(0);
    // Keep track of the previous value; initially 0.
    const previousValue = useRef(0);
    // A flag to detect the first render.
    const isFirstRender = useRef(true);
    const startTime = useRef(null);

    useEffect(() => {
        // If it's not the first render and the value hasn't changed, skip the animation.
        if (!isFirstRender.current && previousValue.current === value) return;

        // On first render, we animate from 0 to value.
        isFirstRender.current = false;
        startTime.current = null;

        const animate = (timestamp) => {
            if (startTime.current === null) {
                startTime.current = timestamp;
            }

            const elapsed = timestamp - startTime.current;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for a smoother animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = previousValue.current + (value - previousValue.current) * easeOutQuart;

            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
                previousValue.current = value;
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <p className={className}>
            {displayValue === 0 && selectedPort ? (
                <>
                    <span className="text-4xl">ASK</span>
                </>
            ) : (
                <>
                    <span className="text-md">{symbol}</span>{" "}
                    <span className="text-4xl">{Math.ceil(displayValue).toLocaleString()}</span>

                </>
            )}

        </p>
    );
}

export function AnimatedCurrencyPrice({ selectedPort, basePrice, selectedCurrency, duration = 1000, className = "font-bold" }) {
    const computedPrice = (basePrice) * selectedCurrency.value;

    return (
        <AnimatedPrice
            selectedPort={selectedPort}
            value={computedPrice}
            duration={duration}
            symbol={selectedCurrency.symbol}
            className={className}
        />
    );
}
