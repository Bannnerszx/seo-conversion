import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { makeFavorite, removeFavorite } from "@/app/actions/actions"

export default function AnimatedHeartButton({
  product,
  userEmail,
  resultsIsFavorited = {},
  router   // lookup from parent
}) {
  // 1) Initialize local state from parent’s map
  const [isFavorite, setIsFavorite] = useState(
    !!resultsIsFavorited[product.stockID]
  )
  const [isAnimating, setIsAnimating] = useState(false)

  // 2) If parent re-fetches favorites and changes the map, sync up
  useEffect(() => {
    setIsFavorite(!!resultsIsFavorited[product.stockID])
  }, [resultsIsFavorited, product.stockID])

  async function toggleFavorite() {
    if (!userEmail) {
      router.push('/login');
      return;
    }

    if (isFavorite) {
      await removeFavorite({ stockId: product.stockID, userEmail });
      setIsFavorite(false);
    } else {
      await makeFavorite({ product, userEmail });
      setIsFavorite(true);
    }
    
    // trigger animation every toggle
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="relative overflow-hidden"
      onClick={toggleFavorite}
    >
      {/* Heart icon */}
      <Heart
        className={cn(
          "mr-1 h-4 w-4 transition-all duration-300 ease-in-out",
          isFavorite
            ? "fill-red-500 stroke-red-500"
            : "stroke-current",
          isAnimating && "animate-heartbeat"
        )}
      />

      {/* Label text */}
      <span className="hidden min-[769px]:inline">
        {isFavorite ? "Added to favorites" : "Add to favorites"}
      </span>

      {/* Floating hearts while animating */}
      {isAnimating && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="h-4 w-4 fill-red-500 stroke-red-500 animate-heart-float" />
          <Heart className="h-3 w-3 fill-red-500 stroke-red-500 animate-heart-float-alt" />
          <Heart className="h-5 w-5 fill-red-500 stroke-red-500 animate-heart-float-extra" />
          <Heart className="h-4 w-4 fill-red-500 stroke-red-500 animate-heart-float-extra-two" />
          <Heart className="h-3 w-3 fill-red-500 stroke-red-500 animate-heart-float-extra-three" />
        </span>
      )}

      {/* animations’ keyframes */}
      <style jsx global>{`
        @keyframes heartbeat {
          0%,100%{transform:scale(1)}50%{transform:scale(1.3)}
        }
        .animate-heartbeat {
          animation: heartbeat 0.6s ease-in-out;
        }
        @keyframes float-up {
          0%{transform:translateY(0) scale(0.5);opacity:0}
          50%{opacity:0.8}
          100%{transform:translateY(-20px) scale(1);opacity:0}
        }
        .animate-heart-float { animation: float-up 0.8s ease-out forwards; }
        @keyframes float-up-alt {
          0%{transform:translateY(0) scale(0.5) translateX(5px);opacity:0}
          50%{opacity:0.6}
          100%{transform:translateY(-15px) translateX(-5px) scale(0.8);opacity:0}
        }
        .animate-heart-float-alt { animation: float-up-alt 0.7s ease-out 0.1s forwards; }
        @keyframes float-up-extra {
          0%{transform:translateY(0) scale(0.4);opacity:0}
          50%{opacity:0.7}
          100%{transform:translateY(-25px) scale(1.1);opacity:0}
        }
        .animate-heart-float-extra { animation: float-up-extra 0.9s ease-out forwards; }
        @keyframes float-up-extra-two {
          0%{transform:translateY(0) scale(0.3);opacity:0}
          50%{opacity:0.8}
          100%{transform:translateY(-30px) scale(1.2);opacity:0}
        }
        .animate-heart-float-extra-two { animation: float-up-extra-two 1s ease-out forwards; }
        @keyframes float-up-extra-three {
          0%{transform:translateY(0) scale(0.6);opacity:0}
          50%{opacity:0.5}
          100%{transform:translateY(-10px) scale(0.9);opacity:0}
        }
        .animate-heart-float-extra-three { animation: float-up-extra-three 0.8s ease-out forwards; }
      `}</style>
    </Button>
  )
}
