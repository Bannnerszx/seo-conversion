'use client'
import Image from "next/image"
import { Facebook, Instagram, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ContactModal from "./ContacUsModal"
import { useState } from "react"
import { emailUs } from "../actions/actions"
export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Image
              src="/rename.gif"
              alt="Real Motor Japan"
              width={200}          // replace with the actual width of your GIF
              height={200}         // replace with the actual height of your GIF
              className="h-15 w-auto m-auto"
              fetchPriority="high" // same intent as your original `<img>`
              priority              // tells Next.js to preload this image
            // keep `false` to run it through the Next.js optimizer
            />
            <address className="mt-4 not-italic text-sm text-gray-600">
              <p>5-2 Nishihaiagari, Kamigaoka-cho,</p>
              <p>Toyota City, Aichi Prefecture, 473-0931,</p>
              <p>Japan</p>
            </address>
            <div className="mt-4 space-y-2">
              <a href="tel:+81-565-85-0602" className="flex items-center text-sm text-gray-600 hover:text-primary">
                <Phone className="mr-2 h-4 w-4" />
                +81-565-85-0602
              </a>
              <p className="flex items-center text-sm text-gray-600">
                <Mail className="mr-2 h-4 w-4" />
                Fax: +81-565-85-0606
              </p>
            </div>
            <Button variant="default" className="mt-6 w-full" onClick={() => setIsModalOpen(true)}>
              Contact Us
            </Button>
            <ContactModal isOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
            {/* Contents */}
            <div>
              <p className="text-sm font-semibold text-gray-900">Contents</p>
              <ul className="mt-4 space-y-2">
                {[
                  { label: "Used Car Stock", url: "/stock" },
                  { label: "How to Buy", url: "/howtobuy" },
                  { label: "About Us", url: "/about" },
                  { label: "Local Introduction", url: "/localintroduction" },
                  { label: "Contact Us", url: "/contactus" },
                ].map(({ label, url }) => (
                  <li key={label}>
                    <Link href={url} className="text-sm text-gray-600 hover:text-primary">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Makers */}
            <div>
              <p className="text-sm font-semibold text-gray-900">Makers</p>
              <ul className="mt-4 space-y-2">
                {[
                  "TOYOTA",
                  "MAZDA",
                  "NISSAN",
                  "BMW",
                  "HONDA",
                  "LAND ROVER",
                  "MITSUBISHI",
                  "ISUZU",
                  "MERCEDES-BENZ",
                  "JEEP",
                  "VOLKSWAGEN",
                ].map((maker) => (
                  <li key={maker}>
                    <Link href={`/stock/${maker}`} className="text-sm text-gray-600 hover:text-primary">
                      {maker}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Body Types */}
            <div>
              <p className="text-sm font-semibold text-gray-900">Body Types</p>
              <ul className="mt-4 space-y-2">
                {["Couper", "Convertible", "Sedan", "Wagon", "Hatchback", "Van/Minivan", "Truck", "SUV"].map((type) => (
                  <li key={type}>
                    <Link href={`/stock/?bodytype=${decodeURIComponent(type)}`} className="text-sm text-gray-600 hover:text-primary">
                      {type}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Find Car */}
            <div>
              <p className="text-sm font-semibold text-gray-900">Find Car</p>
              <ul className="mt-4 space-y-2">
                {["Browse All Stock", "Sale Cars", "Recommended Cars", "Luxury Cars"].map((item) => (
                  <li key={item}>
                    <Link href="/stock" className="text-sm text-gray-600 hover:text-primary">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex space-x-6">
              {[
                { name: "Terms of Use", href: "/terms-of-use" },
                { name: "Privacy Policy", href: "/privacy-policy" },
                { name: "Cookie Policy", href: "/cookie-policy" },
              ].map((item) => (
                <Link key={item.name} href={item.href} className="text-sm text-gray-600 hover:text-primary">
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-6">
              <Link aria-label="Facebook" href="https://www.facebook.com/RealMotorJP" className="text-gray-600 hover:text-primary">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link aria-label="Twitter" href="https://www.instagram.com/realmotorjp/" className="text-gray-600 hover:text-primary">
                <Instagram className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-gray-600">Copyright © Real Motor Japan All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}

