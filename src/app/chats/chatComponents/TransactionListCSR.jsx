"use client"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Search } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton"
import { SideMenu } from "./sideMenu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreditCard, Heart, LogOut, MoreVertical, ShoppingBag, User, ChevronDown, MessageSquare } from "lucide-react"

export function Ribbon({ stockStatus, className, children, userEmail, reservedTo }) {
  // Check if it's Reserved or Sold
  const isReservedOrSold = (stockStatus === "Reserved" || stockStatus === "Sold") && reservedTo !== userEmail

  // Determine color based on stock status
  const badgeClasses =
    stockStatus === "Sold"
      ? "bg-red-100 text-red-800 border border-red-300 dark:bg-gray-700 dark:text-red-300"
      : "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-gray-700 dark:text-yellow-300"

  return (
    <div className="relative">
      {children}

      {isReservedOrSold && (
        <div className="absolute top-6 left-2 z-10">
          <span className={cn("text-sm font-medium px-2.5 py-0.5 rounded-sm", badgeClasses, className)}>
            {stockStatus}
          </span>
        </div>
      )}
    </div>
  )
}
const C = new Map();
const TTL = 5 * 60 * 1000;
export default function TransactionList({
  vehicleStatus,
  makeTrueRead,
  loadingMore,
  hasMore,
  loadMore,
  selectedContact,
  onSelectContact,
  userEmail,
  chatId,
  setSearchQuery,
  searchQuery,
  setChatList,
  chatList,
  setChatId, // <-- Added setChatId here
}) {
  const [isOpen, setIsOpen] = useState(false)


  const { user, logOut } = useAuth()

  // server‑side subscription + keyword filter



  const [isOpenDropdown, setIsOpenDropdown] = useState(false)


  // pagination observer unchanged...
  const observer = useRef(null)
  const lastElementRef = useRef(null)

  const observerRef = useCallback((node) => {
    if (observer.current) observer.current.disconnect()

    if (!node || !hasMore || loadingMore) return

    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    observer.current.observe(node)
    lastElementRef.current = node
  }, [loadMore, hasMore, loadingMore]);



  const markRead = useCallback(
    (chatId) => {
      if (!userEmail) return
      makeTrueRead(chatId)
    },
    [userEmail]
  )
  const [imagesMap, setImagesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    let cancelled = false;

    async function run() {
      // no chats → clear state and stop loading
      if (!Array.isArray(chatList) || chatList.length === 0) {
        setImagesMap({});
        setLoading(false);
        return;
      }

      setLoading(true);

      const map = {};

      await Promise.all(
        chatList.map(async (chat) => {
          const id = chat?.carData?.stockID;
          if (!id) return;

          // 1) prefer embedded images if present
          const embedded = chat?.carData?.images;
          if (Array.isArray(embedded) && embedded.length > 0) {
            map[id] = embedded;
            // prime cache for consistency with /orders
            C.set(id, { images: embedded, ts: Date.now() });
            return;
          }

          // 2) use cache if fresh
          const cached = C.get(id);
          if (cached && Date.now() - cached.ts < TTL) {
            map[id] = cached.images;
            return;
          }

          // 3) fallback to API fetch
          try {
            const res = await fetch(`/api/car-images/${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const json = await res.json();
            const imgs = Array.isArray(json.images) ? json.images : [];
            map[id] = imgs;
            C.set(id, { images: imgs, ts: Date.now() });
          } catch {
            map[id] = []; // on error, set empty like before
          }
        })
      );

      if (!cancelled) {
        setImagesMap(map);
        setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [chatList]);

  // map Firestore data to your UI shape

  const contacts = chatList.map((chat) => {
    const stock = chat?.carData?.stockID;
    const imgs = imagesMap[stock] || [];           // grab the fetched array
    return {
      id: chat.id,
      name: chat.carData?.carName || "Unknown Car",
      avatar: imgs[0] || "/placeholder.jpg",         // first fetched image or placeholder
      status: chat.status || "offline",
      lastMessage: chat.lastMessage || "",
      time: (() => {
        if (!chat?.lastMessageDate) return "";

        let raw = chat?.lastMessageDate;
        let normalized;

        if (typeof raw === "string") {
          // Split date and time
          let [datePart, timePart] = raw.split(" at ");

          // If no “.” in the seconds, append “.000”
          if (!timePart.includes(".")) {
            timePart += ".000";
          }

          // Build an ISO-ish string and swap slashes for dashes
          normalized = `${datePart} ${timePart}`.replace(/\//g, "-");
        } else {
          // Firestore timestamp
          const d = new Date(raw.seconds * 1000);
          return d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }

        const d = new Date(normalized);
        return d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      })(),
      customerRead: chat.customerRead,
      stockID: stock,
    };
  });



  const zoom = useZoomLevel()


  let mdWidthClass = ""
  if (zoom >= 250) {
    mdWidthClass = "md:w-20"
  } else if (zoom >= 175) {
    mdWidthClass = "md:w-24"
  } else if (zoom >= 150) {
    mdWidthClass = "md:w-36"
  } else if (zoom >= 125) {
    mdWidthClass = "md:w-52"
  } else {
    mdWidthClass = "md:w-[250px]"
  }


  return (
    <div className="flex flex-col h-full">
      {!user ? (
        <>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="relative">
              <Skeleton className="absolute left-2 top-2.5 h-4 w-4" />
              <Skeleton className="pl-8 h-10 w-full" />
            </div>
          </div>
          {/* Contacts List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {Array(12)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="flex items-center p-3 rounded-lg cursor-pointer mb-1 hover:bg-gray-100">
                    <div className="relative">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" />
                    </div>
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-5" />
                      </div>
                      <Skeleton className="h-4 w-38 mt-1" />
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <SideMenu isOpen={isOpen} setIsOpen={setIsOpen} />
              <DropdownMenu open={isOpenDropdown} onOpenChange={setIsOpenDropdown}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center justify-between w-auto px-1 py-2 -mt-4">
                    <h2 className="text-xl font-bold">Transactions</h2>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-200 ${isOpenDropdown ? "rotate-180" : ""}`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 z-[1000]">
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/chats">
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Transactions</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/orders">
                    <DropdownMenuItem>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/favorites">
                    <DropdownMenuItem>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favorites</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logOut()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search makes, model ..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

          </div>

          <div className="flex-1 overflow-y-auto" style={{ height: "calc(100% - 88px)" }}>
            <div className="w-full py-2">
              {contacts.length > 0 ? (
                <>
                  {contacts.map((contact, index) => {
                    const isLast = index === contacts.length - 1 // ✅ check if this is the last item
                    const { stockStatus, reservedTo } = vehicleStatus[contact.stockID] || {};
                    const isReservedOrSold = (stockStatus === "Reserved" || stockStatus === "Sold") && reservedTo !== userEmail;

                    return (
                      <Ribbon key={contact.id} stockStatus={stockStatus} userEmail={userEmail} reservedTo={reservedTo}>
                        <div
                          key={contact.id}
                          ref={isLast ? observerRef : null}
                          className={`
                        flex w-full items-center p-3 mb-1 cursor-pointer hover:bg-gray-100
                        ${chatId === contact.id
                              ? "bg-gray-100 border-x-2 border-blue-500"
                              : ""
                            }
                          ${isReservedOrSold && "opacity-50"}
                      `}
                          onClick={() => {

                            setChatId(contact.id);
                            onSelectContact(contact);
                            markRead(contact.id);
                          }}
                        >

                          {/* avatar + status */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={contact?.avatar}
                              alt={contact.name}
                              className="w-12 h-12 rounded-full"
                            />
                            {!contact.customerRead && (
                              <span
                                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${contact.customerRead === false
                                  ? "bg-blue-400"
                                  : ""
                                  }`}
                              />
                            )}
                          </div>

                          {/* name + last message + time */}
                          <div className="ml-3 flex-1 flex justify-between items-start overflow-hidden">
                            <div className="flex flex-col min-w-0 max-w-[70%]">
                              <h3
                                className={`truncate ${contact.customerRead === false
                                  ? "font-bold"
                                  : "font-medium"
                                  }`}
                              >
                                {contact.name}
                              </h3>
                              <p
                                className={`truncate text-sm text-gray-500 ${contact.customerRead === false
                                  ? "font-bold"
                                  : ""
                                  }`}
                              >
                                {contact.lastMessage || "No messages yet"}
                              </p>
                            </div>
                            {contact.time && (
                              <div className="flex flex-col items-end ml-2">
                                <span
                                  className={`text-xs text-gray-800 ${contact.customerRead === false
                                    ? "font-bold"
                                    : ""
                                    }`}
                                >
                                  {contact.time}
                                </span>
                              </div>
                            )}
                          </div>

                        </div>
                      </Ribbon>
                    )
                  }




                  )}


                  <div
                    ref={observerRef}
                    className="h-10 w-full flex justify-center items-center"
                  >
                    {loadingMore ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500" />
                    ) : hasMore ? (
                      <div className="text-xs text-gray-400">Scroll for more</div>
                    ) : (
                      <div className="text-xs text-gray-400">No more transactions</div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No Vehicles found
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
function useZoomLevel() {
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    const handleResize = () => {
      // Using devicePixelRatio as an approximate zoom percentage.
      setZoom(Math.round(window.devicePixelRatio * 100))
    }

    window.addEventListener("resize", handleResize)
    // Trigger once on mount.
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return zoom
}

