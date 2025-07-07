import React, { useState } from 'react';
import { Check } from 'lucide-react';

export default function AnimatedFilter({
  recommended,
  onRecommendedChange,
  onSale,
  onSaleChange
}) {

  const [design4Sale, setDesign4Sale] = useState(false);

  return (
    <>
      <div className='px-6 mb-1'>


        <div className="space-y-1">
          {/* Recommended - Warm Gradient */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onRecommendedChange(!recommended)}

            className={`
          flex items-center justify-between p-3 cursor-pointer select-none transition-all duration-200
          ${recommended
                ? 'border-orange-400 shadow-lg bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white'
                : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
              }
        `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${recommended
                    ? "bg-white border-white shadow-md"
                    : "border-orange-300 hover:border-orange-400"}
                `}
              >
                {recommended && <Check className="w-4 h-4 text-orange-600 stroke-2" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${recommended ? "bg-white" : "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"}`}
                  ></div>
                  <span className={`font-semibold text-sm ${recommended ? "text-white" : "text-orange-900"}`}>
                    Recommended
                  </span>
                </div>
                <p className={`text-xs ${recommended ? "text-white/90" : "text-orange-700"}`}>
                  Premium quality choice
                </p>
              </div>
            </div>
            {recommended && (
              <div className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium border border-white/30">
                PREMIUM
              </div>
            )}
          </div>

          {/* On Sale - Pure Red */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSaleChange(!onSale)}
            onKeyPress={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSaleChange(!onSale)
              }
            }}
            className={`
    flex items-center justify-between p-3 cursor-pointer select-none transition-all duration-200
    ${onSale
                ? 'border-red-600 bg-red-600 shadow-lg text-white'
                : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-sm'
              }
  `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${onSale
                    ? "bg-white border-white shadow-md"
                    : "border-red-300 hover:border-red-400"}
                `}
              >
                {onSale && <Check className="w-4 h-4 text-red-600 stroke-2" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 bg-red-600 rounded-full ${onSale ? "bg-white" : ""}`}></div>
                  <span className={`font-semibold text-sm ${onSale ? "text-white" : "text-red-900"}`}>
                    On Sale
                  </span>
                </div>
                <p className={`text-xs ${onSale ? "text-white/90" : "text-red-700"}`}>
                  Special discount available
                </p>
              </div>
            </div>
            {onSale && (
              <div className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium border border-white/30">
                SAVE
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
