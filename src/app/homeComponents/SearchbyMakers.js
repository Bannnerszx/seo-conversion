
import Link from "next/link";
const SquareGrays = () => {
    const createOddRowOfSquares = () =>
        Array.from({ length: 20 }, (_, index) => (
            <div
                key={`odd-${index}`}
                className={`w-2 h-2 ${index % 2 === 0 ? 'bg-gray-400' : 'bg-transparent'} ml-[1px]`}
            />
        ));

    const createEvenRowOfSquares = () =>
        Array.from({ length: 20 }, (_, index) => (
            <div
                key={`even-${index}`}
                className={`w-2 h-2 ${index % 2 !== 0 ? 'bg-gray-400' : 'bg-transparent'} ml-[1px]`}
            />
        ));

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-center">{createOddRowOfSquares()}</div>
            <div className="flex items-center justify-center">{createEvenRowOfSquares()}</div>
        </div>
    );
};


const SearchByMakers = ({brand, makeCounts}) => {


    return (
        <>
            <div className="flex items-center gap-4 px-6 py-4">
             
                <div className="h-[2px] bg-black flex-1 max-w-[70px] ml-[-25]" />

           
                <h1 className="text-base text-[30px] font-bold text-gray-800 whitespace-nowrap font">Search by Makes</h1>

              
                <SquareGrays />
            </div>

        
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 p-6">
                {brand.map((brand) => (
                    <Link key={brand.id} href={`/stock/${brand.name}`}>
                        <div className="rounded-lg p-4 flex flex-col items-center justify-center">
                            <div className="transition-transform hover:scale-125 hover:outline-gray-500">
                                {brand.logo}
                            </div>
                            <p className="font-bold text-center mt-2">{brand.name} ({makeCounts[brand.name] ?? 0})</p>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );

};

export default SearchByMakers;