'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

import Link from 'next/link';
import { useCurrency } from '@/providers/CurrencyContext';
import Image from 'next/image';
const SquareGrays = () => {
    const createOddRowOfSquares = () =>
        Array.from({ length: 20 }, (_, index) => (
            <div
                key={`odd-${index}`}
                className={`w-2 h-2 ${index % 2 === 0 ? 'bg-blue-800' : 'bg-transparent'} ml-[1px]`}
            />
        ));

    const createEvenRowOfSquares = () =>
        Array.from({ length: 20 }, (_, index) => (
            <div
                key={`even-${index}`}
                className={`w-2 h-2 ${index % 2 !== 0 ? 'bg-blue-800' : 'bg-transparent'} ml-[1px]`}
            />
        ));

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-center">{createOddRowOfSquares()}</div>
            <div className="flex items-center justify-center">{createEvenRowOfSquares()}</div>
        </div>
    );
};
const NewArrivals = ({ newVehicles, currency }) => {
    const scrollContainerRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const { selectedCurrency } = useCurrency();

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const cardWidth = container.clientWidth;
            const newIndex = Math.round(scrollLeft / cardWidth);
            setActiveIndex(newIndex);
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <div className="flex items-center gap-4 px-6 py-4">
                {/* Line */}
                <div className="h-[2px] bg-[#0000ff] flex-1 max-w-[70px] ml-[-25]" />

                {/* Text */}
                <h1 className="text-base text-[30px] font-bold text-[#0000ff] whitespace-nowrap font">New Arrivals</h1>

                {/* Squares */}
                <SquareGrays />
            </div>
            <div className="w-full z-1">
                <div className='p-4'>
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto pb-8 -mr-4 pr-4 scroll-smooth"
                    >
                        <div className="flex gap-4">
                            {newVehicles.map((car) => {
                                // Calculate the base price for this vehicle
                                const basePrice = parseFloat(car.fobPrice) * parseFloat(currency.jpyToUsd);

                                return (
                                    <div
                                        key={car.id}
                                        className="flex-none w-[85vw] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(16.666%-14px)]"
                                    >
                                        <Link key={car.id} href={`/product/${car.id}`}>
                                            <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg h-full">
                                                <div className="relative h-auto">
                                                    <Image
                                                        src={car.images[0]}
                                                        alt={`Photo of ${car.make} ${car.model}`}
                                                        sizes="100vw"
                                                        style={{
                                                            width: '100%',
                                                            height: 'auto',
                                                        }}
                                                        width={500}
                                                        height={300}
                                                        loading='lazy'
                                                    />
                                                    <div className="absolute top-4 right-4">
                                                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                            NEW
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-5">

                                                    <div className="space-y-2">
                                                        <div className="flex items-center text-gray-600">
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            <span className="text-sm">
                                                                {car.regYear}/{car.regMonth}
                                                            </span>
                                                        </div>
                                                        <span className="text-lg font-semibold whitespace-nowrap overflow-hidden text-ellipsis block max-w-full">{car.carName}</span>
                                                        <div className="flex items-center text-blue-600 font-semibold mt-3">

                                                            <span>
                                                                {selectedCurrency.symbol}{" "}
                                                                {Math.ceil(basePrice * selectedCurrency.value).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}

                        </div>
                    </div>


                </div>
            </div>
        </>
    );
};

export default NewArrivals;