"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/app/providers/AuthProvider"
import {
    User,
    MessageSquare,
    RotateCcw,
    Bookmark,
    ChevronDown,
    LogOut,
    Edit,
    ShoppingBag,
    Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
function useWindowSize() {
    const isClient = typeof window === "object"

    function getSize() {
        return {
            width: isClient ? window.innerWidth : 0,
            height: isClient ? window.innerHeight : 0,
        }
    }

    const [windowSize, setWindowSize] = useState(getSize)

    useEffect(() => {
        if (!isClient) return

        function handleResize() {
            setWindowSize(getSize())
        }

        window.addEventListener("resize", handleResize)
        handleResize()
        return () => window.removeEventListener("resize", handleResize)
    }, [isClient])

    return windowSize
}

export default function Sidebar({ count, activePage = "orders", pageTitle, accountData }) {
    const [profileOpen, setProfileOpen] = useState(false)
    const { width } = useWindowSize()
    const isMobile = width > 0 && width < 768
    const { logOut } = useAuth()


    function toggleProfile() {
        setProfileOpen(open => !open)
    }

    function getPageTitle() {
        if (pageTitle) return pageTitle
        switch (activePage) {
            case "profile": return "Profile"
            case "transactions": return "Transactions"
            case "orders": return "My Orders"
            case "favorites": return "My Favorites"
            default: return "My Orders"
        }
    }

    // Mobile header
    if (isMobile) {
        return (
            <div className="w-full bg-[#0000ff] text-white p-4 flex items-center justify-between">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-white p-0 hover:bg-blue-800">
                            <span className="font-bold text-lg mr-1">{getPageTitle()}</span>
                            <ChevronDown className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem className={activePage === "profile" ? "bg-blue-50 text-blue-700" : ""}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="pl-8">
                            <Edit className="mr-2 h-4 w-4" />
                            <Link href="/profile">Edit Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={activePage === "chats" ? "bg-blue-50 text-blue-700" : ""}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <Link href="/chats">Transactions</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className={activePage === "orders" ? "bg-blue-50 text-blue-700" : ""}>
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            <Link href="/orders">My Orders</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className={activePage === "favorites" ? "bg-blue-50 text-blue-700" : ""}>
                            <Heart className="mr-2 h-4 w-4" />
                            <Link href="/favorites">Favorites</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logOut()} className="text-red-500">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )
    }

    // Desktop sidebar
    return (
        <div className="w-[325px] flex flex-col h-full border-r">
            {/* Profile Header */}
            <div className="bg-[#0000ff] text-white p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-2">
                    <User className="h-8 w-8 text-blue-700" />
                </div>
                <div className="text-lg font-medium">{accountData.textFirst} {accountData.textLast}</div>
                <div className="text-sm">Customer</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1">
                <ul className="py-2">
                    {/* Profile with collapsible edit */}
                    <li>
                        <button
                            onClick={toggleProfile}
                            className={`w-full flex items-center justify-between px-6 py-3 ${activePage === "profile"
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            <div className="flex items-center">
                                <User
                                    className={`mr-3 h-5 w-5 ${activePage === "profile" ? "text-blue-700" : "text-gray-600"
                                        }`}
                                />
                                <span>Profile</span>
                            </div>
                            <ChevronDown
                                className={`h-5 w-5 transform transition-transform duration-200 ${profileOpen ? "rotate-180" : ""
                                    } ${activePage === "profile" ? "text-blue-700" : "text-gray-600"
                                    }`}
                            />
                        </button>
                        {profileOpen && (
                            <ul>
                                <li>
                                    <Link
                                        href="/profile"
                                        className="flex items-center pl-12 py-2 hover:bg-gray-100 text-gray-700"
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit Details</span>
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>

                    {/* Transactions */}
                    <li>
                        <Link
                            href="/chats"
                            className={`flex items-center justify-between px-6 py-3 ${activePage === "transactions"
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            <div className="flex items-center">
                                <MessageSquare
                                    className={`mr-3 h-5 w-5 ${activePage === "transactions" ? "text-blue-700" : "text-gray-600"
                                        }`}
                                />
                                <span>Transactions</span>
                            </div>
                            {count >= 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {count}
                                </span>
                            )}

                        </Link>
                    </li>

                    {/* Orders */}
                    <li>
                        <Link
                            href="/orders"
                            className={`flex items-center px-6 py-3 ${activePage === "orders"
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            <ShoppingBag
                                className={`mr-3 h-5 w-5 ${activePage === "orders" ? "text-blue-700" : "text-gray-600"
                                    }`}
                            />
                            <span>My Orders</span>
                        </Link>
                    </li>

                    {/* Favorites */}
                    <li>
                        <Link
                            href="/favorites"
                            className={`flex items-center px-6 py-3 ${activePage === "favorites"
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-100 text-gray-700"
                                }`}
                        >
                            <Heart
                                className={`mr-3 h-5 w-5 ${activePage === "favorites" ? "text-blue-700" : "text-gray-600"
                                    }`}
                            />
                            <span>Favorites</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* Logout */}
            <div className="p-4">
                <Button  onClick={logOut} className="w-full bg-[#0000ff] hover:bg-blue-800 h-10">
                    <LogOut className="mr-2 h-5 w-5" />
                    Log Out
                </Button>
            </div>
        </div>
    )
}
