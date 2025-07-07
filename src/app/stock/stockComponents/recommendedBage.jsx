"use client";

import { Flame } from "lucide-react";

export default function FireBadge({
  text = "RECOMMENDED",
  size = "md",
  width,
  height,
  className = "",
}) {
  const sizeClasses = {
    sm: "px-4 py-2 md:px-4 md:py-2 text-sm gap-1 md:gap-1 px-2 py-2",
    md: "px-6 py-3 md:px-6 md:py-3 text-lg gap-2 md:gap-2 px-3 py-3",
    lg: "px-8 py-4 md:px-8 md:py-4 text-xl gap-3 md:gap-3 px-4 py-4",
    xl: "px-10 py-5 md:px-10 md:py-5 text-2xl gap-4 md:gap-4 px-5 py-5",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const customStyle = {
    width: width || "auto",
    height: height || "auto",
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Badge */}
      <div
        className={`relative inline-flex items-center ${sizeClasses[size]} bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full text-white font-black shadow-2xl`}
        style={customStyle}
      >
        <Flame className={`${iconSizes[size]} animate-bounce text-yellow-200`} />
        <span className="relative z-10 font-black tracking-wide text-shadow-fire drop-shadow-lg hidden md:inline">
          {text}
        </span>
        <Flame
          className={`${iconSizes[size]} animate-bounce text-yellow-200 hidden md:inline`}
          style={{ animationDelay: "0.5s" }}
        />

        {/* Enhanced text shadow for better visibility - only on desktop */}
        <div className="absolute inset-0 flex items-center justify-center hidden md:flex">
          <span className="font-black tracking-wide text-black opacity-30 blur-sm transform translate-x-0.5 translate-y-0.5">
            {text}
          </span>
        </div>

        {/* Fire glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 rounded-full blur-md opacity-75 animate-fire-glow -z-10"></div>
      </div>

      {/* Fire particles - scaled based on size */}
      <div
        className={`absolute -top-2 left-1/4 ${
          size === "sm" ? "w-1 h-1" : size === "lg" ? "w-3 h-3" : size === "xl" ? "w-4 h-4" : "w-2 h-2"
        } bg-red-500 rounded-full animate-fire-particle-1`}
      ></div>
      <div
        className={`absolute -top-3 left-1/2 ${
          size === "sm" ? "w-1 h-1" : size === "lg" ? "w-2 h-2" : size === "xl" ? "w-3 h-3" : "w-1.5 h-1.5"
        } bg-orange-400 rounded-full animate-fire-particle-2`}
      ></div>
      <div
        className={`absolute -top-2 right-1/4 ${
          size === "sm" ? "w-1 h-1" : size === "lg" ? "w-3 h-3" : size === "xl" ? "w-4 h-4" : "w-2 h-2"
        } bg-yellow-400 rounded-full animate-fire-particle-3`}
      ></div>
      <div
        className={`absolute -top-4 right-1/3 ${
          size === "sm" ? "w-0.5 h-0.5" : size === "lg" ? "w-1.5 h-1.5" : size === "xl" ? "w-2 h-2" : "w-1 h-1"
        } bg-red-400 rounded-full animate-fire-particle-4`}
      ></div>
      <div
        className={`absolute -top-3 left-1/3 ${
          size === "sm" ? "w-1 h-1" : size === "lg" ? "w-2 h-2" : size === "xl" ? "w-3 h-3" : "w-1.5 h-1.5"
        } bg-orange-500 rounded-full animate-fire-particle-5`}
      ></div>

      {/* Additional flame effects - scaled */}
      <div
        className={`absolute -top-1 left-2 ${
          size === "sm" ? "w-2 h-4" : size === "lg" ? "w-4 h-8" : size === "xl" ? "w-5 h-10" : "w-3 h-6"
        } bg-gradient-to-t from-red-600 to-transparent rounded-full animate-flame-flicker opacity-60`}
      ></div>
      <div
        className={`absolute -top-2 right-2 ${
          size === "sm" ? "w-1 h-3" : size === "lg" ? "w-3 h-7" : size === "xl" ? "w-4 h-9" : "w-2 h-5"
        } bg-gradient-to-t from-orange-500 to-transparent rounded-full animate-flame-flicker-2 opacity-70`}
      ></div>
      <div
        className={`absolute -top-1 left-1/2 transform -translate-x-1/2 ${
          size === "sm" ? "w-2 h-5" : size === "lg" ? "w-5 h-9" : size === "xl" ? "w-6 h-11" : "w-4 h-7"
        } bg-gradient-to-t from-yellow-500 to-transparent rounded-full animate-flame-flicker-3 opacity-50`}
      ></div>

      <style jsx>{`
        .text-shadow-fire {
          text-shadow:
            0 0 5px rgba(255, 255, 255, 0.8),
            0 0 10px rgba(255, 255, 255, 0.6),
            0 0 15px rgba(255, 255, 255, 0.4),
            2px 2px 4px rgba(0, 0, 0, 0.8),
            1px 1px 2px rgba(0, 0, 0, 1);
        }

        @keyframes fire-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }

        @keyframes fire-particle-1 {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-20px) translateX(-5px);
            opacity: 0;
          }
        }

        @keyframes fire-particle-2 {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-25px) translateX(2px);
            opacity: 0;
          }
        }

        @keyframes fire-particle-3 {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-18px) translateX(3px);
            opacity: 0;
          }
        }

        @keyframes fire-particle-4 {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-22px) translateX(-2px);
            opacity: 0;
          }
        }

        @keyframes fire-particle-5 {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-19px) translateX(4px);
            opacity: 0;
          }
        }

        @keyframes flame-flicker {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
            opacity: 0.6;
          }
          25% {
            transform: scaleY(1.2) scaleX(0.8);
            opacity: 0.8;
          }
          50% {
            transform: scaleY(0.8) scaleX(1.1);
            opacity: 0.4;
          }
          75% {
            transform: scaleY(1.1) scaleX(0.9);
            opacity: 0.7;
          }
        }

        @keyframes flame-flicker-2 {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
            opacity: 0.7;
          }
          33% {
            transform: scaleY(1.3) scaleX(0.7);
            opacity: 0.5;
          }
          66% {
            transform: scaleY(0.9) scaleX(1.2);
            opacity: 0.8;
          }
        }

        @keyframes flame-flicker-3 {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
            opacity: 0.5;
          }
          20% {
            transform: scaleY(1.1) scaleX(0.9);
            opacity: 0.7;
          }
          40% {
            transform: scaleY(0.7) scaleX(1.3);
            opacity: 0.3;
          }
          60% {
            transform: scaleY(1.2) scaleX(0.8);
            opacity: 0.6;
          }
          80% {
            transform: scaleY(0.9) scaleX(1.1);
            opacity: 0.4;
          }
        }

        .animate-fire-glow {
          animation: fire-glow 2s ease-in-out infinite;
        }

        .animate-fire-particle-1 {
          animation: fire-particle-1 1.5s ease-out infinite;
        }

        .animate-fire-particle-2 {
          animation: fire-particle-2 1.8s ease-out infinite 0.3s;
        }

        .animate-fire-particle-3 {
          animation: fire-particle-3 1.6s ease-out infinite 0.6s;
        }

        .animate-fire-particle-4 {
          animation: fire-particle-4 1.7s ease-out infinite 0.9s;
        }

        .animate-fire-particle-5 {
          animation: fire-particle-5 1.4s ease-out infinite 1.2s;
        }

        .animate-flame-flicker {
          animation: flame-flicker 0.8s ease-in-out infinite;
        }

        .animate-flame-flicker-2 {
          animation: flame-flicker-2 1.2s ease-in-out infinite 0.4s;
        }

        .animate-flame-flicker-3 {
          animation: flame-flicker-3 1s ease-in-out infinite 0.8s;
        }
      `}</style>
    </div>
  );
}
