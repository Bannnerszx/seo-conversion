'use client'

import CarFilterContent from "./carFilterContent"
import { Info } from "lucide-react"
import PriceCalculatorCard from "./carCalculatorContent"



export default function CarFilter({ saleUrl, recommendedUrl, totalCount, urlMaker, urlModel, isSale, isRecommended, countryArray, initialMaker = "", initialModel = "", carFiltersServer, carMakes, carBodytypes, country, port }) {

    const onClose = () => console.log('press here')
    return (
        <div className="w-[350px] bg-white px-1  max-h-[calc(100vh-5rem)] overflow-x-hidden">
            <div className="mx-auto space-y-3 mb-6">

                <CarFilterContent saleUrl={saleUrl} recommendedUrl={recommendedUrl} totalCount={totalCount} urlMaker={urlMaker} urlModel={urlModel} isSale={isSale} isRecommended={isRecommended} onClose={onClose} carMakes={carMakes} carBodytypes={carBodytypes} />



                <PriceCalculatorCard onClose={onClose} countryArray={countryArray} />

            </div>
        </div>
    )
}