"use client"
import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";

export default function UserIcon({ email, context }) {
    const [showEmail, setShowEmail] = useState(false);
    const hideTimerRef = useRef(null);

    const startHideTimer = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowEmail(false), 1500);
    };

    // Show for 3s on initial mount
    useEffect(() => {
        setShowEmail(true);
        startHideTimer();
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    // Click: (re)show and auto-hide after 3s
    const handleClick = () => {
        setShowEmail(true);
        startHideTimer();
    };
    const isOrder = context === "order";

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                className={`flex items-center gap-2 p-2 rounded-full transition-colors
        ${isOrder ? "hover:bg-white/10 focus:ring-white/40" : "hover:bg-black/5 focus:ring-[#0000ff]/30"}
        focus:outline-none focus:ring-2`}
                aria-label="User profile"
            >
                <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2
          ${isOrder
                            ? "bg-[#0000ff] border-white text-white"
                            : "bg-white border-[#0000ff] text-[#0000ff]"
                        }`}
                >
                    <User className="h-5 w-5" />
                </div>
            </button>

            {/* Email tooltip */}
            <div
                className={`absolute right-0 top-full mt-2 px-3 py-2 rounded-md shadow-lg whitespace-nowrap
        pointer-events-none transition-all duration-300 border-2
        ${showEmail ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
        ${isOrder
                        ? "bg-[#fff] text-black border-white"
                        : "bg-white text-[#111] border-[#0000ff]"
                    }`}
            >
                {email}

                {/* Arrow */}
                <div
                    className={`absolute -top-1.5 right-4 h-2 w-2 rotate-45
          border-l-2 border-t-2
          ${isOrder
                            ? "bg-[#fff] border-white"
                            : "bg-white border-[#0000ff]"
                        }`}
                />
            </div>
        </div>
    );
}
