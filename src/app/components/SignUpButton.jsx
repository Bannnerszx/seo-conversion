import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * GradientButton component with customizable size, variant, orientation, and optional width/height classes.
 */
export function SignUpButton({
  children,
  href,
  variant = "primary",
  size = "md",
  orientation = "horizontal", // "horizontal" (icon left) or "vertical" (icon top)
  widthClass = "",
  heightClass = "",
  className = "",
  external = false,
  ...props
}) {
  // layout classes based on orientation
  const layoutClasses =
    orientation === "vertical"
      ? "inline-flex flex-col items-center justify-center"
      : "inline-flex items-center justify-center";

  const baseClasses =
    `${layoutClasses} font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 rounded-md shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`;

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 text-white focus:ring-blue-300 shadow-blue-500/25 hover:shadow-blue-500/40",
    secondary:
      "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white focus:ring-emerald-300 shadow-emerald-500/25 hover:shadow-emerald-500/40",
    accent:
      "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:via-rose-600 hover:to-orange-600 text-white focus:ring-pink-300 shadow-pink-500/25 hover:shadow-pink-500/40",
    rainbow:
      "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 text-white focus:ring-purple-300 shadow-purple-500/25 hover:shadow-purple-500/40",
    contrast:
      "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 text-white focus:ring-amber-300 shadow-amber-500/25 hover:shadow-amber-500/40",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-5 text-2xl",
  };

  // Italicize text when using the 'contrast' variant
  const textStyleClass = variant === "contrast" ? "italic font-bold" : "";

  // Combine all classes: base, variant, size, optional width/height, textStyle, plus any extras
  const buttonClasses = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    widthClass,
    heightClass,
    textStyleClass,
    className
  );

  // Render link if href provided
  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses}
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={buttonClasses} {...props}>
        {children}
      </Link>
    );
  }

  // Default button
  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
}
