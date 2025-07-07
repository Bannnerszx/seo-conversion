"use client"
import { firestore } from "../../../../firebase/clientApp"
import { doc, query, collection, where, orderBy, limit, onSnapshot, startAfter, getDocs, updateDoc } from "firebase/firestore"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import OrderCard from "./oderCard"
import Sidebar from "./sidebar"
import { SideMenu } from "./sideMenu";
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
let lastVisible = null;
export function subscribeToChatList(userEmail, callback) {
  if (!userEmail) {
    return () => { };
  }

  const constraints = [
    where("participants.customer", "==", userEmail),
    orderBy("lastMessageDate", "desc"),
    limit(12),
  ];
  const q = query(collection(firestore, "chats"), ...constraints);

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const chatList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      });

      // hand back the first page
      callback(chatList);

      // stash the last doc so loadMoreChatList can startAfter it
      lastVisible =
        querySnapshot.docs[querySnapshot.docs.length - 1] || lastVisible;
    },
    (error) => {
      console.error("Error fetching chat list: ", error);
    }
  );

  return unsubscribe;
};
const generateStatuses = (item) => [
  {
    stage: "Booking",
    actionTaker: "RMJ",
    status: true ? "completed" : "untreated",
    action: "Updated the DHL/EMS address confirmed via email."
  },
  {
    stage: "Booking",
    actionTaker: "RMJ",
    status: "completed",
    action: "Coordinated with the shipping line to book a vessel."
  },
  {
    stage: "Booking",
    actionTaker: "RMJ",
    status: true ? "completed" : "untreated",
    action: "Uploaded the Export Certificate."
  },
  {
    stage: "Booking",
    actionTaker: "SHIPPING COMPANY",
    status: true ? "completed" : "untreated",
    action: "Assigned a vessel to the vehicle as per the Booking Department's request."
  },
  {
    stage: "Booking",
    actionTaker: "RMJ",
    status: true ? "completed" : "untreated",
    action: "Updated the vessel schedule provided by the shipping company."
  },
  {
    stage: "Departure",
    actionTaker: "RMJ",
    status: true ? "completed" : "untreated",
    action: "Uploaded the Shipping Information."
  },
  {
    stage: "Departure",
    actionTaker: "SHIPPING COMPANY",
    status: true ? "completed" : "untreated",
    action: "Confirmed the vehicle was loaded onto the vessel."
  },

  {
    stage: "B/L",
    actionTaker: "RMJ",
    status: true ? "completed" : "untreated",
    action: "Uploaded the Bill of Lading (B/L)."
  },
  {
    stage: "Dispatch",
    actionTaker: "RMJ",
    status: true ? "completed" : "untreated",
    action: "Dispatched B/L documents via DHL and updated the tracking number."
  }
];

export default function MainOrderPage({ count, userEmail, currency, accountData }) {
  const [chatList, setChatList] = useState([]);
  const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const statuses = generateStatuses();
  useEffect(() => {
    // Subscribe to the chat list.
    const unsubscribe = subscribeToChatList(userEmail, (newChatList) => {
      setChatList(newChatList)
      setHasMore(newChatList.length === 12);
    })

    // Clean up the subscription when the component unmounts or userEmail changes.
    return () => unsubscribe()
  }, [userEmail]);

  console.log('chatlist', chatList)

  // Sample data based on your transaction list


  //booking and invoice data




  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <Sidebar count={count} accountData={accountData} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Only visible on desktop */}
        <header className="bg-[#0000ff] text-white p-4 hidden md:flex md:justify-between md:items-center">
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
        </header>

        {/* Sort controls */}
        {/* <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Sort by</span>
            <Select defaultValue="new">
              <SelectTrigger className="w-[180px] h-8 text-sm border-none shadow-none pl-0">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Message New to Old</SelectItem>
                <SelectItem value="old">Message Old to New</SelectItem>
                <SelectItem value="price-high">Price High to Low</SelectItem>
                <SelectItem value="price-low">Price Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div> */}

        {/* Order list */}
        <div className="flex-1 p-4 space-y-4 bg-gray-50 overflow-y-auto">
          {chatList.length > 0 ? (

            chatList.map((order) => (
              <OrderCard userEmail={userEmail} key={order.id} order={order} currency={currency} />
            ))

          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-gray-400 mb-4">
                <ShoppingBag className="h-[50px] w-[50px] mx-auto" />
                <h3 className="text-xl font-medium mt-4">No orders yet</h3>
                <p className="mt-2 text-gray-500">Browse our car stock and add vehicles to your order list.</p>
              </div>
              <Link href={'/stock'} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
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
