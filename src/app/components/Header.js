"use client"
import Link from "next/link"
import { Menu, UserPlus, LogIn, MessageSquare, CircleUser, ChevronDown, TrendingUp, Tag, Package } from "lucide-react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "../providers/AuthProvider"
import { Skeleton } from "@/components/ui/skeleton"
import CurrencyDropdown from "./CurrencyDropdown"
import { usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut, ShoppingBag, Heart } from "lucide-react"
import ImageHeader from "./ImageHeader"
import NotificationCount from "./NotificationBell"
import InfoBannerSlider from "./InforBannerSlider"

const NAV_LINKS = [
    { href: "/stock", label: "Car Stock", hasDropdown: true },
    { href: "/howtobuy", label: "How to Buy" },
    { href: "/about", label: "About Us" },
    { href: "/localintroduction", label: "Local Introduction" },
    { href: "/contactus", label: "Contact Us" },
]
const categories = ["Toyota", "Nissan", "Honda", "Mitsubishi"]
const ToyotaIcon = () => (
    <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"

    >
        <path d="M12 4.236c-6.627 0-12 3.476-12 7.762 0 4.289 5.373 7.766 12 7.766s12-3.476 12-7.766-5.373-7.762-12-7.762zm0 12.196c-.986 0-1.79-1.942-1.84-4.385a21.093 21.093 0 003.68 0c-.05 2.442-.854 4.385-1.84 4.385zm-1.719-6.324c.268-1.727.937-2.953 1.719-2.953s1.45 1.226 1.719 2.953a19.436 19.436 0 01-3.438 0zM12 5.358c-1.287 0-2.385 1.928-2.79 4.619-2.44-.38-4.143-1.248-4.143-2.256 0-1.36 3.104-2.461 6.933-2.461 3.83 0 6.933 1.102 6.933 2.461 0 1.008-1.703 1.876-4.143 2.256-.405-2.69-1.503-4.618-2.79-4.618zm-10.28 6.35c0-1.315.507-2.55 1.388-3.61-.009.074-.015.15-.015.226 0 1.657 2.485 3.07 5.953 3.59-.003.12-.003.242-.003.364 0 3.09.866 5.705 2.063 6.593-5.26-.317-9.385-3.403-9.385-7.163zm11.174 7.163c1.197-.888 2.063-3.504 2.063-6.593 0-.123-.002-.243-.003-.363 3.466-.52 5.953-1.932 5.953-3.591 0-.076-.006-.152-.015-.226.881 1.063 1.387 2.295 1.387 3.61 0 3.76-4.125 6.846-9.385 7.163zm0 0z" />
    </svg>
);
const NissanIcon = () => (
    <svg
        className="w-6 h-6"

        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"

    >
        <path d="M20.576 14.955l-.01.028c-1.247 3.643-4.685 6.086-8.561 6.086-3.876 0-7.32-2.448-8.562-6.09l-.01-.029H.71v.329l1.133.133c.7.08.847.39 1.038.78l.048.096c1.638 3.495 5.204 5.752 9.08 5.752 3.877 0 7.443-2.257 9.081-5.747l.048-.095c.19-.39.338-.7 1.038-.781l1.134-.134v-.328zM3.443 9.012c1.247-3.643 4.686-6.09 8.562-6.09 3.876 0 7.319 2.447 8.562 6.09l.01.028h2.728v-.328l-1.134-.133c-.7-.081-.847-.39-1.038-.781l-.047-.096C19.448 4.217 15.88 1.96 12.005 1.96c-3.881 0-7.443 2.257-9.081 5.752l-.048.095c-.19.39-.338.7-1.038.781l-1.133.133v.329h2.724zm13.862 1.586l-1.743 2.795h.752l.31-.5h2.033l.31.5h.747l-1.743-2.795zm1.033 1.766h-1.395l.7-1.124zm2.81-1.066l2.071 2.095H24v-2.795h-.614v2.085l-2.062-2.085h-.795v2.795h.619zM0 13.393h.619v-2.095l2.076 2.095h.781v-2.795h-.619v2.085L.795 10.598H0zm4.843-2.795h.619v2.795h-.62zm4.486 2.204c-.02.005-.096.005-.124.005H6.743v.572h2.5c.019 0 .167 0 .195-.005.51-.048.743-.472.743-.843 0-.381-.243-.79-.705-.833-.09-.01-.166-.01-.2-.01H7.643a.83.83 0 01-.181-.014c-.129-.034-.176-.148-.176-.243 0-.086.047-.2.18-.238a.68.68 0 01.172-.014h2.357v-.562H7.6c-.1 0-.176.004-.238.014a.792.792 0 00-.695.805c0 .343.214.743.685.81.086.009.205.009.258.009H9.2c.029 0 .1 0 .114.005.181.023.243.157.243.276a.262.262 0 01-.228.266zm4.657 0c-.02.005-.096.005-.129.005H11.4v.572h2.5c.019 0 .167 0 .195-.005.51-.048.743-.472.743-.843 0-.381-.243-.79-.705-.833-.09-.01-.166-.01-.2-.01H12.3a.83.83 0 01-.181-.014c-.129-.034-.176-.148-.176-.243 0-.086.047-.2.18-.238a.68.68 0 01.172-.014h2.357v-.562h-2.395c-.1 0-.176.004-.238.014a.792.792 0 00-.695.805c0 .343.214.743.686.81.085.009.204.009.257.009h1.59c.029 0 .1 0 .114.005.181.023.243.157.243.276a.267.267 0 01-.228.266z" />
    </svg>
)
const HondaIcon = () => (
    <svg
        className="w-6 h-6"

        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"

    >
        <path d="M23.903 6.87c-.329-3.219-2.47-3.896-4.354-4.205-.946-.16-2.63-.299-3.716-.339-.946-.06-3.168-.09-3.835-.09-.658 0-2.89.03-3.836.09-1.076.04-2.77.18-3.716.339C2.563 2.984.42 3.66.092 6.869c-.08.877-.1 2.023-.09 3.248.03 2.032.2 3.407.3 4.364.069.657.338 2.62.687 3.636.478 1.395.916 1.803 1.424 2.222.937.757 2.471.996 2.79 1.056 1.733.309 5.24.368 6.785.368 1.544 0 5.05-.05 6.784-.368.329-.06 1.863-.29 2.79-1.056.508-.419.946-.827 1.424-2.222.35-1.016.628-2.979.698-3.636.1-.957.279-2.332.299-4.364.04-1.225.01-2.371-.08-3.248m-1.176 5.4c-.189 2.57-.418 4.105-.747 5.22-.289.977-.637 1.624-1.165 2.093-.867.787-2.063.956-2.76 1.056-1.514.229-4.055.299-6.057.299-2.003 0-4.544-.08-6.058-.3-.697-.099-1.893-.268-2.76-1.055-.518-.469-.876-1.126-1.155-2.093-.329-1.105-.558-2.65-.747-5.22-.11-1.544-.09-4.055.08-5.4.258-2.012 1.255-3.019 3.387-3.397.996-.18 2.34-.309 3.606-.369 1.016-.07 2.7-.1 3.637-.09.936-.01 2.62.03 3.636.09 1.275.06 2.61.19 3.606.369 2.142.378 3.139 1.395 3.388 3.397.199 1.345.229 3.856.11 5.4M17.526 3.88c-.548 2.461-.767 3.587-1.216 5.37-.428 1.714-.767 3.298-1.335 4.065-.587.777-1.365.947-1.893 1.006-.279.03-.478.04-1.066.05-.597 0-.797-.02-1.076-.05-.528-.06-1.315-.229-1.892-1.006-.578-.767-.907-2.351-1.335-4.065-.469-1.773-.678-2.909-1.236-5.37 0 0-.548.02-.797.04-.329.02-.588.05-.867.09 0 0 .32 5.061.459 7.203.15 2.252.418 6.057.667 8.927 0 0 .458.07 1.226.12.807.049 1.165.049 1.165.049.329-1.265.747-3.019 1.206-3.766.378-.608.966-.677 1.295-.717.518-.07.956-.08 1.166-.08.199-.01.637 0 1.165.08.329.05.917.11 1.295.717.469.747.877 2.5 1.206 3.766 0 0 .358-.01 1.165-.05a11.35 11.35 0 001.226-.12c.249-2.869.518-6.665.667-8.926.14-2.142.459-7.203.459-7.203-.28-.04-.538-.07-.867-.09-.23-.02-.787-.04-.787-.04z" />
    </svg>
)
const MitsubishiIcon = () => (
    <svg
        className="w-6 h-6"

        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"

    >
        <path
            fill={'red'}
            d="M8 22.38H0l4-6.92h8zm8 0h8l-4-6.92h-8zm0-13.84l-4-6.92-4 6.92 4 6.92z" />
    </svg>
)
const categoryIcons = {
    Toyota: ToyotaIcon,
    Nissan: NissanIcon,
    Honda: HondaIcon,
    Mitsubishi: MitsubishiIcon,
};

function DesktopNavigation({ router }) {
    const [hoveredItem, setHoveredItem] = useState(null);

    const [isTouch, setIsTouch] = useState(false);

    // detect touch devices
    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsTouch(window.matchMedia("(hover: none)").matches);
        }
    }, []);
    const handleStockTap = (href, label) => {
        if (!isTouch) return; // desktop still uses hover + Link
        if (hoveredItem !== label) {
            // first tap opens
            setHoveredItem(label);
        } else {
            // second tap navigates
            setHoveredItem(null);

        }
    };
    return (
        <nav className="hidden lg:flex items-center space-x-6 overflow-visible z-[9999]">
            {NAV_LINKS.map((link) => {
                if (link.href === "/stock") {
                    return (
                        <div
                            key={link.href}
                            className="relative overflow-visible"
                            onMouseEnter={() => {
                                if (!isTouch && link.hasDropdown) setHoveredItem(link.label);
                            }}
                            onMouseLeave={() => {
                                if (!isTouch) setHoveredItem(null);
                            }}
                        >
                            <div
                                role="button"
                                tabIndex={0}
                                className="py-5 flex items-center text-gray-600 hover:text-blue-600 transition-colors font-semibold cursor-pointer select-none"
                                onClick={() => handleStockTap(link.href, link.label)}
                            >
                                {link.label}
                                {link.hasDropdown && (
                                    <ChevronDown
                                        className={`ml-1 h-5 w-5 transition-transform duration-200 ${hoveredItem === link.label ? "rotate-180" : "rotate-0"
                                            }`}
                                    />
                                )}
                            </div>


                            <div
                                className={`
    ${hoveredItem === link.label
                                        ? "opacity-100 scale-y-100 translate-y-0"
                                        : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
                                    } transition-all duration-300 ease-out origin-top
    absolute z-[9999] top-full left-0 pb-4 pt-2
     max-h-[calc(100vh-4rem)]
    overflow-y-auto
  `}
                            >
                                <div className="w-56 bg-white border border-gray-200 rounded-md shadow-lg">
                                    <div className="p-2">
                                        <Link
                                            href={`/stock/recommended`}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="font-medium">Recommended</span>
                                        </Link>
                                        <Link
                                            href={`/stock/recommended/sale`}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <Tag className="h-4 w-4" />
                                            <span className="font-medium">Sale</span>
                                        </Link>
                                        <Link
                                            href={`/stock`}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <Package className="h-4 w-4" />
                                            <span className="font-medium">All Stock</span>
                                        </Link>
                                    </div>
                                    <div className="border-t border-gray-200"></div>
                                    <div className="p-2">
                                        {categories.map((category, idx) => {
                                            const Icon = categoryIcons[category];
                                            return (
                                                <Link
                                                    key={idx}
                                                    href={`/stock/${category}`}
                                                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    {Icon && <Icon className="w-5 h-5 text-gray-500" />}
                                                    <span className="ml-2 text-gray-700">{category}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>

                        </div>
                    )
                }
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="text-gray-600 hover:text-blue-600 transition-colors font-semibold py-5                                "
                    >
                        {link.label}
                    </Link>
                )
            })}
        </nav>
    )
}

function DesktopAuth() {
    const { user, loading, logOut, counts } = useAuth()
    if (loading) {
        return (
            <div className="flex items-center gap-4">
                {/* Render two Shadcn skeletons as placeholders */}
                <Skeleton className="w-36 h-12 rounded-sm" />
                <Skeleton className="w-36 h-12 rounded-sm" />
            </div>
        )
    }
    if (user) {
        return (
            <div className="flex items-center gap-4 font-semibold z-[9999]">

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="relative w-15 h-15 flex flex-col items-center justify-center rounded-lg transition group
             min-[1117px]:flex-row min-[1117px]:gap-2 min-[1117px]:px-4 min-[1117px]:py-2
             min-[1117px]:bg-transparent min-[1117px]:rounded-sm z-[9999]"
                        >
                            {/* wrap icon + badge in a relative box */}
                            <div className="relative">
                                <CircleUser
                                    className="
        w-7 h-7
        min-[1117px]:text-[#0000ff]
        min-[320px]:text-[#0000ff]
        z-[9999]
        transform transition-transform duration-200 ease-in-out
        group-hover:-translate-y-1
      "
                                />
                                <span
                                    className="
        absolute -top-2 -right-1    /* adjust to taste */
        inline-flex items-center justify-center
        w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full
        transform transition-transform duration-200 ease-in-out group-hover:-translate-y-1
      "
                                >
                                    <NotificationCount userEmail={user} />
                                </span>
                            </div>

                            <span className="text-sm min-[1117px]:text-gray-700 min-[320px]:text-gray-700">
                                Account
                            </span>
                        </button>

                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 z-[9999]">
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/chats" className="flex items-center gap-2 cursor-pointer relative">
                                <div className="relative">
                                    <MessageSquare className="w-4 h-4" />

                                    <span
                                        className="absolute -top-2 -right-2 inline-flex items-center justify-center 
              w-4 h-4 text-[10px] font-semibold text-white bg-red-500 rounded-full"
                                    >
                                        <NotificationCount userEmail={user} />
                                    </span>
                                </div>
                                <span>Transactions</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/orders" className="flex items-center gap-2 cursor-pointer">
                                <ShoppingBag className="w-4 h-4" />
                                <span>My Orders</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/favorites" className="flex items-center gap-2 cursor-pointer">
                                <Heart className="w-4 h-4" />
                                <span>Favorites</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => logOut()}
                            className="flex items-center gap-2 cursor-pointer text-red-600 hover:text-red-700"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )
    } else {
        return (
            <div className="flex items-center gap-4">
                {/* Sign Up Link */}
                <Link
                    href="/signup"
                    className="w-15 h-15 flex flex-col items-center justify-center rounded-lg transition group
              min-[1117px]:flex-row min-[1117px]:gap-2 min-[1117px]:px-4 min-[1117px]:py-2
              min-[1117px]:border min-[1117px]:border-blue-600 min-[1117px]:text-blue-600 min-[1117px]:rounded-sm"
                >
                    <UserPlus className="w-6 h- text-[#0000ff] group-hover:text-[#0036b1]" />
                    <span className="whitespace-nowrap text-sm font-semibold text-center text-gray-700 group-hover:text-[#a0a0a0] min-[1117px]:text-[#0000ff]">
                        Sign Up
                    </span>
                </Link>

                {/* Login Link */}
                <Link
                    href="/login"
                    className="whitespace-nowrap w-15 h-15 flex flex-col items-center justify-center rounded-lg transition group
              min-[1117px]:flex-row min-[1117px]:gap-2 min-[1117px]:px-4 min-[1117px]:py-2
              min-[1117px]:bg-[#0000ff] min-[1117px]:text-white min-[1117px]:rounded-sm"
                >
                    <LogIn className="w-7 h-7 text-[#0000ff] min-[1117px]:text-white" />
                    <span className="text-sm font-semibold text-center text-gray-700 group-hover:text-[#a0a0a0] min-[1117px]:text-white">
                        Log In
                    </span>
                </Link>
            </div>
        )
    }
}

function MobileMenu({ isOpen, setIsOpen }) {
    const { user, logOut, counts } = useAuth()
    const [expandedItem, setExpandedItem] = useState(null)

    return (
        <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-15 h-15 flex flex-col items-center justify-center border-gray-300 rounded-lg transition group"
                    >
                        <Menu className="w-7 h-7 text-[#0000ff] group-hover:text-[#0036b1]" />
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-[#a0a0a0]">Menu</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[80vw] max-h-[calc(100vh-1rem)] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col space-y-4 mt-8">
                        <div className="items-center space-x-2 mx-auto">
                            <span className="text-gray-700 font-bold whitespace-nowrap">
                                Proud members of
                            </span>
                            <Link
                                href="https://www.jumvea.or.jp/jpn/members/Yanagisawa-706"
                                target="_blank"
                                className="block mt-4"
                            >
                                <img
                                    src="/jumvea.webp"
                                    alt="JUMVEA"
                                    width={120}
                                    height={39}
                                    className="block"
                                />
                            </Link>
                        </div>
                        {NAV_LINKS.map((link) => {
                            if (link.href === "/stock") {
                                return (
                                    <div key={link.href}>
                                        <button
                                            onClick={() => setExpandedItem(expandedItem === link.label ? null : link.label)}
                                            className="flex items-center justify-between w-full text-left block py-2 text-lg font-medium hover:bg-gray-100 px-4 rounded-lg"
                                        >
                                            {link.label}
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform duration-200 ${expandedItem === link.label ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>
                                        {expandedItem === link.label && (
                                            <>
                                                <Link
                                                    href="/stock"
                                                    onClick={() => {
                                                        setIsOpen(false)
                                                        setExpandedItem(null)
                                                    }}
                                                    className="ml-4 mt-2 p-2 block text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"      >
                                                    All Stock
                                                </Link>

                                                <Link
                                                    href="/stock/recommended"
                                                    onClick={() => {
                                                        setIsOpen(false)
                                                        setExpandedItem(null)
                                                    }}
                                                    className="ml-4 mt-2 p-2 block text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Recommended
                                                </Link>
                                                <Link
                                                    href="/stock/sale"
                                                    onClick={() => {
                                                        setIsOpen(false)
                                                        setExpandedItem(null)
                                                    }}
                                                    className="ml-4 mt-2 p-2 block text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Sale
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )
                            }
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block py-2 text-lg font-medium hover:bg-gray-100 px-4 rounded-lg"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            )
                        })}
                        <div className="border-t pt-4 flex flex-col space-y-4">
                            {user ? (
                                <>
                                    <Link
                                        href="/chats"
                                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div className="relative">
                                            <MessageSquare className="w-5 h-5" />

                                            <span
                                                className="absolute -top-2 -right-2 inline-flex items-center justify-center 
              w-4 h-4 text-[10px] font-semibold text-white bg-red-500 rounded-full"
                                            >
                                                <NotificationCount userEmail={user} />
                                            </span>
                                        </div>
                                        <span>Transactions</span>
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <CircleUser className="w-5 h-5" />
                                        Profile
                                    </Link>
                                    <Link
                                        href="/orders"
                                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        My Orders
                                    </Link>
                                    <Link
                                        href="/favorites"
                                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Heart className="w-5 h-5" />
                                        Favorites
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logOut()
                                            setIsOpen(false)
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-left"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-center py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="text-center py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default function Header({ currency, counts, headerRef, showBanner, setShowBanner }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isFixed, setIsFixed] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsFixed(window.scrollY > 0)
        }

        // Immediately check the scroll position on mount
        handleScroll()

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])
    const pathname = usePathname()



    useEffect(() => {
        fetch('/api/show-banner', {
            credentials: 'same-origin',  // or 'include'
        })
            .then(res => res.json())
            .then(({ showBanner }) => {
                setShowBanner(showBanner)
            })
    }, [])

    if (pathname === "/") {
        return (
            <div ref={headerRef} className="z-[7500]">
                {showBanner && !isFixed && (
                    <div className="w-full">
                        <InfoBannerSlider />
                    </div>
                )}
                <div className="bg-white/90 p-2 flex items-center justify-end mr-4 z-[9500]">
                    {/* left side: span + logo */}


                    {/* right side: currency dropdown */}
                    <CurrencyDropdown currency={currency} />
                </div>


                <header
                    className={`${isFixed ? "fixed top-0 z-[50] bg-white/80" : "z-[50]"} shadow-md backdrop-blur-lg h-[75px] w-full  border-solid border-b-4 border-[#0000ff]`}
                >
                    <div className="flex items-center justify-between h-full z-[9191]">
                        <div className="flex items-center space-x-8 overflow-visible">
                            <Link href="/" className="h-auto overflow-hidden">
                                <ImageHeader
                                    src="/rmj.webp"
                                    alt="REAL MOTOR JAPAN"
                                    width={250}
                                    height={65}
                                    quality={75} // compress more aggressively
                                    priority // LCP priority
                                    sizes="(max-width: 640px) 150px, 250px"
                                    style={{ width: "250px", height: "70px", objectFit: "cover" }}
                                />
                            </Link>
                            <DesktopNavigation counts={counts} />
                        </div>
                        <div className="flex items-center space-x-5 mr-5">
                            <div className="hidden lg:flex lg:flex-col items-center justify-center h-full space-y-1">
                                <Link
                                    href="https://www.jumvea.or.jp/jpn/members/Yanagisawa-706"
                                    target="_blank"
                                    className="overflow-hidden"
                                >
                                    <ImageHeader
                                        src="/jumvea.webp"
                                        alt="REAL MOTOR JAPAN"
                                        width={80}
                                        height={39}
                                        quality={75}
                                        priority
                                        sizes="(max-width: 640px) 150px, 250px"
                                        className="max-h-[35px] w-auto mx-auto"

                                    />
                                </Link>
                                <p className="text-sm font-bold text-gray-700 text-center">
                                    Proud member
                                </p>
                            </div>



                            <DesktopAuth counts={counts} />
                            <MobileMenu counts={counts} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
                        </div>
                    </div>
                </header>
                {showBanner && isFixed && (
                    <div className="fixed top-[75px] left-0 right-0 w-full">
                        <InfoBannerSlider />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="z-[5000]">

            <header
                className="
    fixed top-0 left-0 right-0 z-50
    h-[75px] w-full
    bg-white/80 shadow-md
    border-b-4 border-[#0000ff]
  "
            >
                <div className="flex items-center justify-between h-full px-4 z-[9999]">
                    {/* left side: RMJ logo + nav */}
                    <div className="flex items-center space-x-8 overflow-visible">
                        <Link href="/" className="flex items-center">
                            <ImageHeader
                                src="/rmj.webp"
                                alt="REAL MOTOR JAPAN"
                                width={250}
                                height={65}
                                quality={75} // compress more aggressively
                                priority // LCP priority
                                sizes="(max-width: 640px) 150px, 250px"
                                style={{ width: "250px", height: "70px", objectFit: "cover" }}
                            />
                        </Link>

                        {/* new JUMVEA block */}


                        <DesktopNavigation />
                    </div>

                    {/* right side: auth & mobile menu */}
                    <div className="flex items-center space-x-5 mr-5 h-[75px]">
                        {/* logo + label wrapper */}
                        <div className="hidden lg:flex lg:flex-col items-center justify-center h-full space-y-1">
                            <Link
                                href="https://www.jumvea.or.jp/jpn/members/Yanagisawa-706"
                                target="_blank"
                                className="overflow-hidden"
                            >
                                <ImageHeader
                                    src="/jumvea.webp"
                                    alt="REAL MOTOR JAPAN"
                                    width={100}
                                    height={39}
                                    quality={80}
                                    priority
                                    sizes="(max-width: 640px) 150px, 250px"
                                    className="max-h-[35px] w-auto mx-auto"
                                />
                            </Link>
                            <p className="text-sm font-bold text-gray-700 text-center">
                                Proud member
                            </p>
                        </div>
                        <DesktopAuth counts={counts} />
                        <MobileMenu
                            counts={counts}
                            isOpen={isMenuOpen}
                            setIsOpen={setIsMenuOpen}
                        />
                    </div>


                </div>
            </header>

            {showBanner && (
                <div ref={headerRef} className="fixed top-[75px] left-0 right-0 w-full">
                    <InfoBannerSlider />
                </div>
            )}
        </div>
    )
}
