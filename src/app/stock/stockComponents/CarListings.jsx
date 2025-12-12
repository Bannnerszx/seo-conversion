'use client'
import { ScrollToTop } from "./scrollToTop";
import Image from "next/image";
import { ShipWheel as SteeringWheel, Heart, Car, Gauge, Palette, Fuel, Eye, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useCurrency } from "@/providers/CurrencyContext";
import AnimatedHeartButton from "./animatedHeart";
import { useSort } from "./sortContext";
import { useRouter, useSearchParams } from "next/navigation";
import RecommendedBadge from "./recommendedBage";
import SalesOffDisplay from "./salesOffDisplay";
import { getFirebaseFunctions } from "../../../../firebase/clientApp";
// Skeleton placeholder for loading (unchanged)
export function CarCardSkeleton() {
  return (
    <Card className="max-w-7xl mx-auto  border border-gray-200 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-64 sm:h-auto sm:w-96 l:w-[36rem] flex-shrink-0">
          <Skeleton className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24 mt-6" />
          <div className="mt-6 justify-self-end">
            <Skeleton className="w-20 h-6" />
          </div>
        </div>
      </div>
    </Card>
  );
}

const toInt = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

// Single car card display
function CarCard({
  handleViewDetailsClick,
  chatCount,
  views,
  thumbnailImage,
  carName,
  fobPrice,
  regYear,
  mileage,
  exteriorColor,
  engineDisplacement,
  dimensionCubicMeters,
  referenceNumber,
  stockID,
  currency,
  portParams,
  countryParams,
  product,
  userEmail,
  resultsIsFavorited,
  isRecommended,
  router,
  fobHistory,
  insuranceParams,
  inspectionParams,
  carDescription,
  imageCount
}) {
  const qs = new URLSearchParams();
  if (countryParams) qs.set('country', countryParams);
  if (portParams) qs.set('port', portParams);
  if (inspectionParams === '1') qs.set('inspection', '1');
  if (insuranceParams === '1') qs.set('insurance', '1');
  const href = qs.toString()
    ? `/product/${stockID}?${qs.toString()}`
    : `/product/${stockID}`;


  const safeViews = toInt(views, 0);
  const safeChatCount = toInt(chatCount, 0);

  const { profitMap, inspectionToggle, insuranceToggle } = useSort();

  const { selectedCurrency } = useCurrency();
  const imageUrl = thumbnailImage;
  const basePrice = parseFloat(fobPrice) * parseFloat(currency.jpyToUsd);
  const baseFinalPrice = (basePrice) + (parseFloat(dimensionCubicMeters) * parseFloat(profitMap));
  const finalPrice = (((baseFinalPrice * selectedCurrency.value) + (inspectionToggle ? 300 : 0) + (insuranceToggle ? 50 : 0)));

  return (
    <Card key={stockID} className="w-full mx-auto border border-gray-200 rounded-lg shadow-lg">
      <div className="flex max-[650px]:flex-col flex-col min-[1170px]:flex-row max-[1023px]:flex-row">

        {/* 1. REMOVED all 'h-[...]' and 'h-auto' classes from this div.
         Its height will now be set by the image inside it.
    */}
        <div
          className="
        relative
        w-full
        max-[650px]:w-full        
        min-[1170px]:w-[28rem]         
        max-[1023px]:w-[26rem]      
        flex-shrink-0
      "
        >
          <Link
            onClick={() => handleViewDetailsClick(stockID)}
            href={
              countryParams && portParams
                ? `/product/${stockID}?country=${countryParams}&port=${portParams}`
                : `/product/${stockID}`
            }
          >
            <Image
              src={imageUrl ? imageUrl : '/placeholder.jpg'}
              alt={carName}


              width={1200}  /* Example: 1200 */
              height={800} /* Example: 800 */

              sizes="(max-width: 650px) 100vw, (max-width: 1023px) 26rem, 28rem"
              className="
            object-contain 
            rounded-t-lg 
            min-[1170px]:rounded-l-lg 
            min-[1170px]:rounded-tr-none
            
            /* 4. ADDED 'w-full' and 'h-auto' 
               This makes the image 100% wide and automatically adjust its height.
            */
            w-full
            h-auto
          "
              priority
            />
          </Link>

          {/* These badges will still work because the parent div is 'relative' */}
          <Badge variant="secondary" className="absolute left-4 top-4 bg-white/90 font-medium">
            <SteeringWheel className="mr-2 h-4 w-4" />
            {referenceNumber}
          </Badge>

          {isRecommended && (
            <div className="absolute right-4 top-2">
              <RecommendedBadge size="sm" text="HOT" />
            </div>
          )}

        </div>


        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-6">
            <h3 className="text-xl font-bold">{carName}</h3>
            <AnimatedHeartButton
              router={router}
              resultsIsFavorited={resultsIsFavorited}
              product={product}
              stockID={stockID}
              userEmail={userEmail}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              {safeChatCount > 3 && safeViews > 7 && (
                <Badge variant="outline" className="gap-1.5 border-orange-200 bg-orange-50 text-orange-700">
                  <TrendingUp className="h-3 w-3" />
                  High Demand
                </Badge>
              )}

              <Badge variant="secondary" className="gap-1.5">
                <Eye className="h-3 w-3" />
                {safeViews + 2} views today
              </Badge>


              {imageCount === 0 && (
                <Badge variant="destructive" className="gap-1.5">
                  Photos Coming Soon
                </Badge>
              )}
            </div>
            <div className="p-1">
              <div className="flex items-center gap-2">

                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-600">
                  {safeChatCount + 2} {safeChatCount === 1 ? "person" : "people"} inquiring right now
                </span>
                <div className="flex gap-1">
                  <span className="inline-block h-2 w-2 animate-[blink_1.5s_ease-in-out_0s_infinite] rounded-full bg-blue-600"></span>
                  <span className="inline-block h-2 w-2 animate-[blink_1.5s_ease-in-out_0.5s_infinite] rounded-full bg-blue-600"></span>
                  <span className="inline-block h-2 w-2 animate-[blink_1.5s_ease-in-out_1s_infinite] rounded-full bg-blue-600"></span>
                </div>
              </div>
            </div>

          </div>


          {/* This line changed: use max-[425px] instead of max-[1024px] */}
          <div className="mt-6 flex flex-row justify-between max-[425px]:flex-col max-[425px]:space-y-4">
            <div>
              <div className="text-sm text-gray-500">FOB Price</div>
              <div className="space-y-1">

                <div className="flex justify-center">
                  <div className="text-3xl font-bold text-center">
                    <span className="text-sm">{selectedCurrency.symbol}</span>{' '}
                    {Math.ceil(basePrice * selectedCurrency.value).toLocaleString()}
                  </div>
                </div>
                <SalesOffDisplay currency={currency} selectedCurrency={selectedCurrency} fobHistory={fobHistory} fobPrice={fobPrice} />
              </div>

            </div>

            {countryParams && portParams && (
              <div>
                <div className="text-sm text-gray-500">Final Price</div>
                <div className="text-3xl font-bold text-[#0000ff]">
                  {!profitMap ? (
                    'ASK'
                  ) : (
                    <>
                      <span className="text-sm">{selectedCurrency.symbol}</span>{' '}
                      {Math.trunc(finalPrice).toLocaleString()}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Car className="iconText text-gray-500 w-5 h-5" />
              <span className="label text-gray-500">Year</span>
              <span className="font-medium">{regYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="iconText text-gray-500 w-5 h-5" />
              <span className="label text-gray-500">Mileage</span>
              <span className="font-medium">{mileage?.toLocaleString()} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Palette className="iconText text-gray-500 w-5 h-5" />
              <span className="label text-gray-500">Exterior Color</span>
              <span className="font-medium">{exteriorColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="iconText text-gray-500 w-5 h-5" />
              <span className="label text-gray-500">Engine Displacement</span>
              <span className="font-medium">{engineDisplacement}cc</span>
            </div>
          </div>

          <div className="mt-4 space-y-1 w-[85%]">
            <p className="text-sm text-red-400 font-semibold italic line-clamp-4 text-left overflow-hidden w-full break-all">
              {carDescription}
            </p>
          </div>


          <div className="grid sm:w-full">
            <div className="mt-6 justify-self-stretch sm:justify-self-end">
              <Link href={href} onClick={() => handleViewDetailsClick(stockID)}>
                <Button className="flex items-center w-full sm:w-auto bg-[#0000ff] hover:bg-[#0000dd] font-semibold" size="lg">
                  <Eye className="text-white w-5 h-5" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>

  );
}


export default function CarListings({ resultsIsFavorited, products, currency, country, port, userEmail }) {
  const router = useRouter()
  const searchParams = useSearchParams();

  const inspectionParam = searchParams.get('inspection') === '1' ? '1' : undefined;
  const insuranceParam = searchParams.get('insurance') === '1' ? '1' : undefined;

  const clearingParam = searchParams.get('clearing') === '1' ? '1' : undefined;
  const deliveryParam = searchParams.get('delivery');

  const { withPhotosOnly } = useSort();
  const filtered = products
    ?.filter(car => car.fobPriceNumber)
    .filter(car => !withPhotosOnly || (car.images?.length ?? 0) > 0);

  // 3. Remove top-level function call
  // const incrementView = httpsCallable(functions, 'incrementViewCounter')

  const handleViewDetailsClick = async (productId) => {
    const viewLoggedKey = `viewed_${productId}`;

    if (!sessionStorage.getItem(viewLoggedKey)) {
      try {
        // 4. Dynamic load inside click handler
        const [functionsInstance, { httpsCallable }] = await Promise.all([
          getFirebaseFunctions(),
          import("firebase/functions")
        ]);
        const incrementView = httpsCallable(functionsInstance, 'incrementViewCounter');

        incrementView({ docId: productId });

        sessionStorage.setItem(viewLoggedKey, 'true');
      } catch (error) {
        console.error("Error incrementing view:", error)
      }
    }
  }
  return (
    <div className="space-y-4 p-2 mx-auto w-full">
      <ScrollToTop />

      {filtered && filtered.length > 0 ? (
        filtered.map((car, index) => (
          <CarCard
            handleViewDetailsClick={handleViewDetailsClick}
            key={index}
            chatCount={car.chatCount}
            {...car}
            router={router}
            product={car}
            currency={currency}
            countryParams={country}
            portParams={port}
            userEmail={userEmail}

            // Pass existing params
            inspectionParams={inspectionParam}
            insuranceParams={insuranceParam}

            // Pass NEW params
            clearingParams={clearingParam}
            deliveryParams={deliveryParam}

            resultsIsFavorited={resultsIsFavorited}
          />
        ))
      ) : (
        <div className="mx-auto max-w-md my-16 p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            No Results Found
          </h2>
          <p className="text-gray-600">
            We couldn’t find any vehicles matching your filters. Please adjust your criteria and try again.
          </p>
        </div>
      )}
    </div>
  );
}