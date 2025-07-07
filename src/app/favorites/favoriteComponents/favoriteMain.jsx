"use client"
import Link from "next/link"
import { useState } from "react"
import { removeFavorite } from "@/app/actions/actions"
import FavoriteCard from "./favoriteCard"
import Sidebar from "@/app/orders/orderComponents/sidebar"
import { SideMenu } from "@/app/orders/orderComponents/sideMenu"
export default function FavoritesPageCSR({ count, dataVehicles, currency, accountData, userEmail }) {
    const [favoriteList, setFavoriteList] = useState(dataVehicles)
    const [isRightMenuOpen, setIsRightMenuOpen] = useState(false)

    // Sample data for favorites

    const handleUnfavorite = async (stockID, userEmail) => {
        // 1) Grab the vehicle you're about to remove, so you can re-insert it in the exact state it was
        const vehicle = favoriteList.find(f => f.stockID === stockID);

        // 2) Optimistically update the UI
        setFavoriteList(prev => prev.filter(f => f.stockID !== stockID));

        try {
            // 3) Tell your backend
            await removeFavorite({stockId: stockID, userEmail});
        } catch (err) {
            // 4) Rollback if the network call fails
            console.error("Unfavorite failed:", err);
            if (vehicle) {
                setFavoriteList(prev => [...prev, vehicle]);
            }
        }
        console.log(stockID, userEmail)
        //add animation here
    };

    return (
        <div className="flex flex-col md:flex-row h-screen">
            {/* Sidebar */}
            <Sidebar count={count} activePage="favorites" accountData={accountData} />

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Only visible on desktop */}
                <header className="bg-[#0000ff] text-white p-4 hidden md:flex md:justify-between md:items-center">
                    <h1 className="text-2xl font-bold text-white">My Favorites</h1>
                </header>

                {/* Sort and filter controls */}
                {/* <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Sort by</span>
                        <Select defaultValue="date">
                            <SelectTrigger className="w-[180px] h-8 text-sm border-none shadow-none pl-0">
                                <SelectValue placeholder="Sort order" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Date Added (Newest First)</SelectItem>
                                <SelectItem value="date-asc">Date Added (Oldest First)</SelectItem>
                                <SelectItem value="price-high">Price High to Low</SelectItem>
                                <SelectItem value="price-low">Price Low to High</SelectItem>
                                <SelectItem value="year">Year (Newest First)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div> */}

                {/* Favorites list */}
                <div className="flex-1 p-4 space-y-4 bg-gray-50 overflow-y-auto">
                    {favoriteList.length > 0 ? (
                        favoriteList.map((favorite) => <FavoriteCard userEmail={userEmail} handleUnfavorite={handleUnfavorite} key={favorite.stockID} favorite={favorite} currency={currency} />)
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="text-gray-400 mb-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-16 w-16 mx-auto"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                <h3 className="text-xl font-medium mt-4">No favorites yet</h3>
                                <p className="mt-2 text-gray-500">Browse our car stock and add vehicles to your favorites list.</p>
                            </div>
                            <Link href={'/stock'} className="mt-4 px-4 py-2 bg-[#0000ff] text-white rounded-md hover:bg-blue-700 transition-colors">
                                Browse Car Stock
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Right side menu */}
            <SideMenu isOpen={isRightMenuOpen} setIsOpen={setIsRightMenuOpen} />
        </div>
    )
}
