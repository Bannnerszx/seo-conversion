'use client'
import { useState, useEffect } from "react";
import CarFilterContent from "./carFilterContent"

import PriceCalculatorCard from "./carCalculatorContent"



export default function CarFilter({ d2dCountries, currency, saleUrl, recommendedUrl, totalCount, urlMaker, urlModel, isSale, isRecommended, countryArray, initialMaker = "", initialModel = "", carFiltersServer, carMakes, carBodytypes, country, port }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    fetch("/api/show-banner", { credentials: "same-origin" })
      .then((res) => res.json())
      .then(({ showBanner }) => setShowBanner(showBanner))
      .catch(() => { });
  }, []);
  const onClose = () => console.log('press here')
  return (
    <div
      className={`
    w-[350px]
    bg-white
    px-1
    overflow-x-hidden
    ${showBanner
          ? "max-h-[calc(100vh-8rem)]"
          : "max-h-[calc(100vh-5rem)]"
        }
  `}>
      <div className="mx-auto space-y-3 mb-6">

        <CarFilterContent currency={currency} saleUrl={saleUrl} recommendedUrl={recommendedUrl} totalCount={totalCount} urlMaker={urlMaker} urlModel={urlModel} isSale={isSale} isRecommended={isRecommended} onClose={onClose} carMakes={carMakes} carBodytypes={carBodytypes} />



        <PriceCalculatorCard d2dCountries={''} onClose={onClose} countryArray={countryArray} />

      </div>
    </div>
  )
}