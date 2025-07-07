export default function SalesOffDisplay({
  fobHistory = [],
  fobPrice,
  selectedCurrency,
  currency,
}) {
  // 1) Determine the highest historical FOB price
  const basePrice =
    fobHistory.length > 0
      ? Math.max(...fobHistory.map((h) => Number(h.fobPrice)))
      : 0;

  // 2) Parse the current FOB price
  const newPrice = Number(fobPrice);

  // 3) If there’s no “sale” (i.e. basePrice ≤ newPrice), render nothing
  if (!(basePrice > newPrice)) return null;

  // 4) Convert that base price into the selected currency
  const baseInUSD = basePrice * (currency?.jpyToUsd ?? 1);
  const baseInSelected =
    Math.ceil(baseInUSD * (selectedCurrency?.value ?? 1)).toLocaleString(
      "en-US"
    );

  // 5) Calculate percentage off
  const amountOff = basePrice - newPrice;
  const percentageOff = Math.floor((amountOff / basePrice) * 100);

  return (
    <div className="flex justify-center">
      <div className="relative inline-block">
        {percentageOff > 0 && (
          <>
            {/* mobile */}
            <span className="absolute -top-2 left-full inline-flex items-center justify-center w-8 aspect-square bg-red-500 text-white text-[12px] font-bold rounded-full shadow block min-[769px]:hidden">
              <span className="flex flex-col items-center leading-tight">
                <span>-{percentageOff}%</span>
              </span>
            </span>
            {/* desktop */}
            <span className="absolute left-full w-16 ml-1 top-1/2 transform -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded hidden min-[769px]:inline-block">
              {percentageOff}% OFF!
            </span>
          </>
        )}
        <div className="text-md text-gray-400 line-through">
          {baseInSelected}
        </div>
      </div>
    </div>
  );
}
