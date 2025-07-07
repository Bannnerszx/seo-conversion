"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/stock", label: "Car Stock" },
  { href: "/howtobuy", label: "How to Buy" },
  { href: "/about", label: "About Us" },
  { href: "/localintroduction", label: "Local Introduction" },
  { href: "/contactus", label: "Contact Us" },
];

export function SideMenu({ isOpen, setIsOpen }) {
  return (
    <div className="fixed right-4 top-4 z-10">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 flex flex-col items-center justify-center bg-white border border-gray-300 rounded-lg transition group shadow-md"
          >
            <Menu className="w-6 h-6 text-[#0000ff] group-hover:text-[#0036b1]" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full max-w-[295px]">
          <SheetHeader>
            <SheetTitle className="sr-only">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col space-y-1 mt-8">
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-3 text-base font-medium hover:bg-gray-100 px-4 rounded-md ${
                  index === 0 ? "bg-gray-100" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
