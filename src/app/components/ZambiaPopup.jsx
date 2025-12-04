"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // ✅ Import Next Image
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MapPin, X, CheckCircle } from "lucide-react";

export default function ZambiaPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

useEffect(() => {
  const check = async () => {
    // Add a small delay to ensure cookies are available
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const res = await fetch("/api/show-popup", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Popup API failed:", res.status);
      return;
    }

    const { showPopup } = await res.json();
    if (showPopup) setIsOpen(true);
  };

  check();
}, []);

  const handleOpenChange = (open) => {
    setIsOpen(open);
  };

  const handleContact = () => {
    setIsOpen(false);
    router.push("/localinformation/Zambia");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg w-[90vw] sm:w-full p-0 bg-white border-0 shadow-xl">
        <DialogTitle asChild>
          <h2 className="sr-only">
            Zambia Branches Available – Lusaka &amp; Chipata
          </h2>
        </DialogTitle>

        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="h-6 w-6 text-green-300" />
            <h2 className="text-lg font-semibold">We're Already Here!</h2>
          </div>
          <p className="text-blue-100 text-sm">
            Good news! We already have branches serving your area.
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="text-gray-800 font-medium">
              Lusaka &amp; Chipata
            </span>
          </div>

          <div className="flex justify-center mb-4 relative w-full max-w-sm mx-auto h-40 sm:h-48">
            {/* ✅ OPTIMIZATION: Replaced <img> with Next.js Image */}
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/samplermj.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm5.jpg?alt=media&token=bc72b182-3995-4d19-a69d-1cf43d713b94"
              alt="Our professional team at RMJ branch office in Zambia"
              fill
              className="object-cover rounded-lg border-2 border-blue-200 shadow-md"
              sizes="(max-width: 640px) 90vw, 400px"
              quality={60}
            />
          </div>

          <p className="text-center text-gray-600 text-sm mb-2">
            <span className="font-medium text-gray-800">
              Meet Our Local Team
            </span>
          </p>
          <p className="text-center text-gray-600 text-sm mb-6">
            Our established branches in Lusaka and Chipata are ready to serve
            you with local expertise and support.
          </p>

          <div className="flex space-x-3">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
              onClick={handleContact}
            >
              Contact Our Team
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm bg-transparent"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}