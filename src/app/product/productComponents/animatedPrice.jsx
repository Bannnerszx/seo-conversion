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
    const animationFrame = useRef(null);
    const displayValueRef = useRef(displayValue);

    useEffect(() => {
        // If the value didn't change since last settled value, skip.
        if (!isFirstRender.current && previousValue.current === value) return;

        // Cancel any previous animation frame to avoid overlap
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
            animationFrame.current = null;
        }

        // On first render, we animate from 0 to value. On subsequent updates,
        // start the animation from the currently displayed value so rapid
        // updates transition smoothly from whatever the user currently sees.
        isFirstRender.current = false;
        startTime.current = null;

        // Use the current displayed value as the animation start point.
        const startVal = typeof displayValueRef.current === 'number' ? displayValueRef.current : previousValue.current || 0;
        previousValue.current = startVal;

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
            displayValueRef.current = currentValue;

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
                displayValueRef.current = value;
                previousValue.current = value;
                animationFrame.current = null;
            }
        };

        animationFrame.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
            animationFrame.current = null;
        };
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
                    <span className="text-4xl">{Math.trunc(displayValue).toLocaleString()}</span>

                </>
            )}

        </p>
    );
}

export function AnimatedCurrencyPrice({ selectedPort, basePrice, selectedCurrency, duration = 1000, className = "font-bold" }) {
    const computedPrice = Number(basePrice || 0) * (selectedCurrency?.value ?? 1);

    return (
        <AnimatedPrice
            selectedPort={selectedPort}
            value={computedPrice}
            duration={duration}
            symbol={selectedCurrency?.symbol ?? ""}
            className={className}
        />
    );
}
