import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  Users,
  Zap,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignUpButton } from "@/app/components/SignUpButton";

/**
 * SignupBanner displays different banner variants with title, subtitle, features, and CTA.
 */
export function SignupBanner({
  variant = "hero",
  title,
  subtitle,
  features = [
    "Expert negotiation",
    "Quality inspection",
    "Global shipping",
    "Best prices guaranteed",
  ],
  buttonText = "Start Free Trial",
  buttonHref = "/signup",
  showStats = true,
  showFeatures = true,
  className = "",
}) {
  const defaultTitles = {
    hero: "Transform Your Business Today",
    compact: "Export Premium Japanese Cars",
    sidebar: "Join Thousands of Users",
    floating: "Don't Miss Out!",
  };

  const defaultSubtitles = {
    hero:
      "Join over 10,000+ businesses that trust our platform to grow their success. Start your free trial today and see the difference.",
    compact:
      "Professional car export service from Japan. We negotiate, inspect, and ship directly to your door.",
    sidebar: "Experience the power of our platform with a free trial.",
    floating: "Limited time offer - Start your free trial now!",
  };

  const bannerTitle = title || defaultTitles[variant];
  const bannerSubtitle = subtitle || defaultSubtitles[variant];

  // Hero variant
  if (variant === "hero") {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10" />

        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
            {bannerTitle}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto">
            {bannerSubtitle}
          </p>

          {showStats && (
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-600" />
                <span className="font-semibold">10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-600" />
                <span className="font-semibold">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <span className="font-semibold">99.9% Uptime</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <SignUpButton href={buttonHref} variant="contrast" size="xl" orientation="horizontal" className="group">
              {buttonText}
              <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </SignUpButton>

            {showFeatures && (
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div className={cn("bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100 border border-amber-200 rounded-2xl p-6", className)}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{bannerTitle}</h3>
            <p className="text-gray-700">{bannerSubtitle}</p>
          </div>
          <div className="flex-shrink-0">
            <SignUpButton href={buttonHref} variant="contrast" size="lg">
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </SignUpButton>
          </div>
        </div>
        {showFeatures && (
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 mt-4 pt-4 border-t border-amber-200 text-sm text-gray-600">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Sidebar variant
  if (variant === "sidebar") {
    return (
      <div className={cn("bg-gradient-to-b from-amber-50 to-orange-50 border-l-4 border-amber-400 p-6 space-y-4", className)}>
        <div className="flex items-center gap-2 text-amber-600">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold text-sm uppercase tracking-wide">Special Offer</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900">{bannerTitle}</h3>
        <p className="text-gray-700 text-sm">{bannerSubtitle}</p>
        <SignUpButton href={buttonHref} variant="contrast" size="md" className="w-full">
          {buttonText}
        </SignUpButton>
        {showFeatures && (
          <div className="space-y-2 text-xs text-gray-600">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Floating variant
  if (variant === "floating") {
    return (
      <div className={cn("fixed bottom-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-2xl max-w-sm z-50", className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-bold text-sm mb-1">{bannerTitle}</h4>
            <p className="text-xs text-amber-100 mb-3">{bannerSubtitle}</p>
            <SignUpButton
              href={buttonHref}
              variant="contrast"
              size="sm"
              className="w-full bg-white text-amber-600 hover:bg-amber-50"
            >
              {buttonText}
            </SignUpButton>
          </div>
          <button className="text-amber-200 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
