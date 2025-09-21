import Link from 'next/link'
import { Menu, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet'





const NAV_LINKS = [
    { href: '/stock', label: 'Car Stock' },
    { href: '/howtobuy', label: 'How to Buy' },
    { href: '/about', label: 'About Us' },
    { href: '/localintroduction', label: 'Local Introduction' },
    { href: '/contactus', label: 'Contact Us' },
]
export function SideMenu({ isOpen, setIsOpen }) {
    const [expandedItem, setExpandedItem] = useState(null)

    return (
        <div className="mb-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-15 h-15 flex flex-col items-center justify-center border-gray-300 rounded-lg transition group"
                    >
                        <Menu className="w-7 h-7 text-[#0000ff] group-hover:text-[#0036b1]" />

                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[80vw] max-h-[calc(100vh)] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col space-y-4 mt-8">
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

                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}