'use client'
import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ArrowDownUp, DollarSign, Camera, Filter, Calculator, ChevronLeft, ChevronRight } from "lucide-react"
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSearchParams, useParams } from 'next/navigation'
import { useRouter } from '@bprogress/next'

import { useCurrency } from '@/providers/CurrencyContext'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sidebar } from './SideBar'
import { useSort } from './sortContext'
export default function SearchHeader({
  initialLimit = 50,
  currency,
  products,
  totalCount,
  children,
  sortField = 'dateAdded',
  sortDirection = 'desc',
  currentPage = 1,
  country = '',
  port = '',
  carMakes,
  carBodytypes,
  countryArray,
  context
}) {
  
  const params = useParams()
  // URLSearchParams for ?foo=bar
  const searchParams = useSearchParams()

  const router = useRouter()
  const filters = Array.isArray(params.filters) ? params.filters : []

  // build a plain object of all ?query= pairs
  const queryParams = {}
  for (const key of searchParams.keys()) {
    queryParams[key] = searchParams.get(key)
  }

  const { setSelectedCurrency, selectedCurrency } = useCurrency()
  const { setWithPhotosOnly, withPhotosOnly } = useSort();
  const defaultSort = `${sortField}-${sortDirection}`
  const [sortValue, setSortValue] = useState(defaultSort)
  const [limitValue, setLimitValue] = useState(String(initialLimit))

  useEffect(() => {
    const hasSort = searchParams.has('sort')
    const hasPage = searchParams.has('page')

    // Reset to default if both are missing
    if (!hasSort && !hasPage) {
      setSortValue(defaultSort)
      setLimitValue(String(initialLimit))
    }
  }, [searchParams, defaultSort, initialLimit])

  const isLastPage = products?.length < Number(initialLimit)
  const nextPage = currentPage + 1
  const prevPage = currentPage > 1 ? currentPage - 1 : 1

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    router.push(`?${params.toString()}`, { showProgress: true })
  }

  const onSortChange = (value) => {
    setSortValue(value)
    updateParams({ sort: value, page: '1' })
  }

  const onPerPageChange = (newLimit) => {
    setLimitValue(newLimit)
    updateParams({ limit: newLimit, page: '1' })
  }

  const onCurrencyChange = (code) => {
    const options = [
      { code: 'USD', symbol: "USD$", value: 1 },
      { code: 'EUR', symbol: "EUR€", value: currency.usdToEur },
      { code: 'JPY', symbol: "JPY¥", value: currency.usdToJpy },
      { code: 'CAD', symbol: "CAD$", value: currency.usdToCad },
      { code: 'AUD', symbol: "AUD$", value: currency.usdToAud },
      { code: 'GBP', symbol: "GBP£", value: currency.usdToGbp },
      { code: 'ZAR', symbol: "ZAR", value: currency.usdToZar },
    ]
    const sel = options.find((c) => c.code === code)
    if (sel) setSelectedCurrency(sel)
  }

  const updatePageURL = (page) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    return params.toString()
  }

  const PaginationButtons = () => (
    <div className="flex gap-3 justify-end my-4">
      <Link
        href={currentPage > 1 ? `?${updatePageURL(prevPage)}` : '#'}
        aria-disabled={currentPage <= 1}
        className={cn(
          'h-10 w-10 flex items-center justify-center rounded-md transition-colors',
          currentPage > 1
            ? 'bg-[#0000ff] hover:bg-[#0000dd] text-white'
            : 'bg-gray-400 text-white cursor-not-allowed'
        )}
        onClick={(e) => currentPage <= 1 && e.preventDefault()}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>

      <Link
        href={!isLastPage ? `?${updatePageURL(nextPage)}` : '#'}
        aria-disabled={isLastPage}
        className={cn(
          'h-10 w-10 flex items-center justify-center rounded-md transition-colors',
          !isLastPage
            ? 'bg-[#0000ff] hover:bg-[#0000dd] text-white'
            : 'bg-gray-400 text-white cursor-not-allowed'
        )}
        onClick={(e) => isLastPage && e.preventDefault()}
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  );

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMode, setSidebarMode] = useState("filter") // values: "filter" or "calculator"
  const openFilter = () => {
    setSidebarMode("filter")
    setSidebarOpen(true)
  }
  const openCalculator = () => {
    setSidebarMode("calculator")
    setSidebarOpen(true)
  }
  const closeSidebar = () => {
    setSidebarOpen(false)
  }



  const hasQueryParams = Array.from(searchParams.keys()).length > 0

  const isPureStock = filters.length === 0 && !hasQueryParams

  useEffect(() => {
    setWithPhotosOnly(isPureStock)
  }, [isPureStock])


  // 3) Always let the user toggle
  const handleWithPhotosChange = (e) => {
    setWithPhotosOnly(e);
  };
  return (
    <>
      <div className="mx-auto w-full">
        <div className="z-10 bg-white px-4 py-3">

          <div className="mx-auto flex flex-col">
            <div className="min-[1024px]:hidden flex gap-3 mb-3">
              <Button
                onClick={openFilter}
                className="flex-1 bg-transparent h-11 border-2 border-[#0000ff] text-blue-600 font-medium hover:bg-blue-50"
              >
                <Filter className="h-4 w-4 mr-2 text-blue-600" />
                Filter
              </Button>

              <Button
                onClick={openCalculator}
                className="flex-1 bg-transparent h-11 border-2 border-[#0000ff] text-blue-600 font-medium hover:bg-blue-50"
              >
                <Calculator className="h-4 w-4 mr-2 text-blue-600" />
                Calculator
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{totalCount}</span>
                <span className="text-sm text-gray-600">units found</span>
              </div>
              <PaginationButtons />
            </div>


            <TooltipProvider>
              <div className="hidden sm:flex items-center justify-between w-full py-2 gap-2">
                <div className="max-[767px]:hidden flex items-center gap-4">
                  <span className="text-sm text-gray-600">Sort by</span>
                  <Select value={sortValue} onValueChange={onSortChange}>
                    <SelectTrigger className="w-[180px] h-9 px-3">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dateAdded-asc">Update Old to New</SelectItem>
                      <SelectItem value="dateAdded-desc">Update New to Old</SelectItem>
                      <SelectItem value="fobPriceNumber-asc">Price Low to High</SelectItem>
                      <SelectItem value="fobPriceNumber-desc">Price High to Low</SelectItem>
                      <SelectItem value="regYearNumber-desc">Year New to Old</SelectItem>
                      <SelectItem value="regYearNumber-asc">Year Old to New</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2 group">
                    <Checkbox
                      id="photos-filter"
                      checked={withPhotosOnly}
                      onCheckedChange={handleWithPhotosChange}
                      className=" rounded border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors duration-200 group-hover:border-blue-400"
                    />
                    <Label
                      htmlFor="photos-filter"
                      className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1.5 group-hover:text-blue-600 transition-colors duration-200"
                    >
                      <Camera className="h-3.5 w-3.5  group-hover:text-blue-500 transition-colors duration-200" />
                      With photos
                    </Label>
                  </div>
                </div>

                <div className="max-[767px]:hidden flex items-center gap-1">
                  <span className="text-sm text-gray-600">View Price in</span>
                  <Select defaultValue={selectedCurrency.code} onValueChange={onCurrencyChange}>
                    <SelectTrigger className="w-[100px] h-9 px-3">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "JPY", "CAD", "AUD", "GBP", "ZAR"].map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="md:hidden">
                {/* Main action buttons - Filter and Calculator */}


                {/* Secondary controls - compact layout */}
                <div className="flex items-center justify-between gap-2">

                  <div className="flex items-center gap-1 flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ArrowDownUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>Sort by</TooltipContent>
                    </Tooltip>
                    <Select defaultValue={sortValue} onValueChange={onSortChange}>
                      <SelectTrigger className="h-9 px-2 border-blue-300">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dateAdded-asc">Update Old to New</SelectItem>
                        <SelectItem value="dateAdded-desc">Update New to Old</SelectItem>
                        <SelectItem value="fobPriceNumber-asc">Price Low to High</SelectItem>
                        <SelectItem value="fobPriceNumber-desc">Price High to Low</SelectItem>
                        <SelectItem value="regYearNumber-desc">Year New to Old</SelectItem>
                        <SelectItem value="regYearNumber-asc">Year Old to New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Currency dropdown - more compact */}
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DollarSign className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>Currency</TooltipContent>
                    </Tooltip>
                    <Select defaultValue={selectedCurrency.code} onValueChange={onCurrencyChange}>
                      <SelectTrigger className="h-9 px-2 border-blue-300 w-[80px]">
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent>
                        {["USD", "EUR", "JPY", "CAD", "AUD", "GBP", "ZAR"].map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>



                </div>
              </div>
            </TooltipProvider>

            <div className="flex items-center space-x-2 group ml-5 my-4 md:hidden">
              <Checkbox
                id="photos-filter"
                checked={withPhotosOnly}
                onCheckedChange={handleWithPhotosChange}
                className="rounded border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors duration-200 group-hover:border-blue-400"
              />
              <Label
                htmlFor="photos-filter"
                className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1.5 group-hover:text-blue-600 transition-colors duration-200"
              >
                <Camera className="h-3.5 w-3.5 group-hover:text-blue-500 transition-colors duration-200" />
                With photos
              </Label>
            </div>

          </div>

        </div>

        <div className="p-4 text-center text-gray-500">

          {children}
        </div>

        <PaginationButtons />
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} mode={sidebarMode} carMakes={carMakes} carBodytypes={carBodytypes} countryArray={countryArray} />
      </div>
    </>
  )
}
