'use server'
import ChatPageCSR from "./chatComponents/pageCSR";
import {  db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchCurrency } from "../../../services/fetchFirebaseData";
import { getCountries, checkUserExist, getAccountData } from "../actions/actions";
import { Toaster } from "sonner";

async function fetchPrefetchedData(userEmail) {
    try {
        const chatsQuery = db.collection('chats')
            .where('participants.customer', '==', userEmail)
            .orderBy('lastMessageDate', 'desc')
            .limit(12);

        const chatsSnapshot = await chatsQuery.get();
     
        const data = await Promise.all(
            chatsSnapshot.docs.map(async (chatDoc) => {
                const chatData = { id: chatDoc.id, ...chatDoc.data() };
         
                const messagesQuery = db.collection('chats').doc(chatDoc.id).collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(15);

                const messagesSnapshot = await messagesQuery.get();
             
                const messages = messagesSnapshot.docs.map(messageDoc => ({
                    id: messageDoc.id,
                    ...messageDoc.data(),
                    timestamp: messageDoc.data().timestamp ? messageDoc.data().timestamp.toString() : null,
                }));

                return { ...chatData, messages };
            })
        );

  
        return data;
    } catch (error) {
        console.error("Error prefetching data with Admin SDK:", error);
        return [];
    }
}

export async function generateMetadata() {
  return {
    title: 'Transactions | REAL MOTOR JAPAN',
    description: "Transactions",
  };
};

export default async function ChatPage() {
  // 1️⃣ Read comma-separated list of all legacy cookie names and the current cookie name
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES
  const COOKIE_NAME   = process.env.SESSION_COOKIE_NAME   

  // 2️⃣ Convert the legacy names string into an array
  const oldNames = OLD_NAMES_ENV
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)

  // 3️⃣ Read cookies() synchronously (no await)
  const cookieStore = await cookies()

  // 4️⃣ If any legacy cookie still exists, redirect to /login
  for (const legacyName of oldNames) {
    if (cookieStore.get(legacyName)?.value) {
      redirect("/login")
    }
  }

  // 5️⃣ Read only the current cookie
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value

  // 6️⃣ If there’s no current cookie, redirect to /login
  if (!sessionCookie) {
    redirect("/login")
  }

  // 7️⃣ Verify via /api/verify-session
  let userEmail = null
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verifyRes = await fetch(`${origin}/api/verify-session`, {
      method: "GET",
      headers: {
        // Forward only COOKIE_NAME
        cookie: `${COOKIE_NAME}=${sessionCookie}`,
      },
      cache: "no-store",
    })
    const apiJson = await verifyRes.json()

    if (!apiJson.valid) {
      // If invalid, redirect to /login
      redirect("/login")
    }

    // If valid, extract email
    userEmail = apiJson.claims.email || null
  } catch (err) {
    console.error("[ChatPage] /api/verify-session error:", err)
    redirect("/login")
  }

  // 8️⃣ Fetch shared data
  const currency    = (await fetchCurrency()) || []
  const countryList = await getCountries()

  // 9️⃣ Check if the user exists and has no missing fields
  const { exists, missingFields } = await checkUserExist(userEmail)
  if (!exists || (missingFields && missingFields.length > 0)) {
    redirect("/accountCreation")
  }

  // 🔟 Fetch account data
  const accountData = await getAccountData(userEmail)

  // 1️⃣1️⃣ Fetch prefetched data for /chats route
  const prefetchedData = await fetchPrefetchedData(userEmail);

  // Validate chat ownership


  // 1️⃣2️⃣ Render the Chat page
  return (
    <>
      <Toaster />
      <ChatPageCSR
        accountData={accountData}
        userEmail={userEmail}
        currency={currency}
        countryList={countryList}
        prefetchedData={prefetchedData}
      />
    </>
  )
}