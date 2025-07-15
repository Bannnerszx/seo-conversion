"use client";

import React, { useContext } from "react";
import { BannerContext } from "@/app/components/BannerContext";
export default function BreadCrumbChild({ children }) {
    const showBanner = useContext(BannerContext);

    const mtClass = showBanner ? "mt-32" : "mt-28";

    return (
        <div
            className={`px-6
    ${mtClass}
  `}
        >
            {children}
        </div>
    );
}
