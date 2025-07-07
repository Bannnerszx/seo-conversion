import Image from "next/image";
import { ChevronDown, Heart, Share2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FavoriteCard({ favorite, currency, userEmail, handleUnfavorite }) {
  const fobDollar =
    parseFloat(currency.jpyToUsd) * parseFloat(favorite.fobPrice) || 0;

  return (
    // Make this container relative for the overlay
    <div className="relative bg-white rounded-lg border overflow-hidden">
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Vehicle image */}
          <div className="md:w-2/5 lg:w-1/3 relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
              <Image
                src={favorite.images?.[0] ?? "/placeholder.jpg"}
                alt={`${favorite.regYear} ${favorite.make} ${favorite.model}` || "Product Image"}
                fill
                className="object-cover"
              />

              {/* Heart button */}
              <button
                onClick={() => handleUnfavorite(favorite.stockID, userEmail)}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
                aria-label="Toggle favorite"
              >
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              </button>
            </div>

            <div className="absolute top-1 left-2 bg-white/90 px-2 py-1 rounded text-xs">
              Added: {favorite.dateAdded}
            </div>
          </div>

          {/* Right side - Vehicle details */}
          <div className="md:w-3/5 lg:w-2/3 flex flex-col">
            <div>
              <h2 className="text-xl font-bold mb-1">
                {favorite.regYear} {favorite.make} {favorite.model}
              </h2>
              <p className="text-gray-600 text-sm mb-4">{favorite.carDescription}</p>
            </div>

            <div className="mb-6">
              <p className="text-blue-600 text-2xl font-bold">
                ${Math.ceil(fobDollar).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-gray-500 text-sm">Year</p>
                <p className="font-medium">{favorite.regYear}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Mileage</p>
                <p className="font-medium">{favorite.mileage}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Exterior Color</p>
                <p className="font-medium">{favorite.exteriorColor}</p>
              </div>
            </div>
            <div className="mt-auto grid grid-cols-1 gap-3 mx-auto w-full max-w-full">
              <Link
                href={`/product/${favorite.stockID}`}
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md h-10 px-4 transition-colors"
              >
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Status overlay stuck to this specific card */}
      {(favorite.stockStatus.startsWith("Sold") ||
        favorite.stockStatus === "Reserved") && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <span
              className={
                `${favorite.stockStatus.startsWith("Sold")
                  ? "text-[120px] max-[426px]:text-[25px]"
                  : "text-[90px] max-[426px]:text-[18px]"
                } font-bold transform -rotate-45 select-none ` +
                (favorite.stockStatus.startsWith("Sold")
                  ? "text-red-500/50"
                  : "text-[#ffd700]/50")
              }
            >
              {favorite.stockStatus.startsWith("Sold")
                ? "SOLD"
                : favorite.stockStatus.toUpperCase()}
            </span>
          </div>
        )}
    </div>
  );
}
