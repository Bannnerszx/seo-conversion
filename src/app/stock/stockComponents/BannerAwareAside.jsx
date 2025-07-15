"use client";

import React, { useContext } from "react";
import { BannerContext } from "@/app/components/BannerContext";
export default function BannerAwareAside({ children }) {
    const showBanner = useContext(BannerContext)

    const topClass = showBanner ? "top-[120px] mt-32" : "top-[80px] mt-20";
console.log(showBanner,'filters')
    return (
        <aside
            className={`
    hidden lg:block
    max-w-1/3
    sticky ${topClass}
    self-start
  `}
        >
            {children}
        </aside>
    );
}
