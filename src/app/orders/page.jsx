
'use server'
import { db } from "@/lib/firebaseAdmin";
import MainOrderPage from "./orderComponents/orderMain";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountData, checkUserExist } from "../actions/actions";
import { fetchCurrency, } from "../../../services/fetchFirebaseData";
import ClientAppCheck from "../../../firebase/ClientAppCheck";

async function fetchPrefetchedData(userEmail) {
  try {
    // 1) fetch 20 most recent chats across stepIndicator values >= 3
    // Use `in` to filter specific step values so we can order by lastMessageDate only.
    const chatsSnapshot = await db
      .collection("chats")
      .where("participants.customer", "==", userEmail)
      .where("stepIndicator.value", "in", [3, 4, 5, 6, 7])
      .orderBy("lastMessageDate", "desc")
      .limit(20)
      .get();

    const data = await Promise.all(
      chatsSnapshot.docs.map(async (chatDoc) => {
        const chat = { id: chatDoc.id, ...chatDoc.data() };


        // 3) one-off fetch of the invoice doc
        let invoiceData = null;
        let formattedDate = "No due date available";

        const invoiceNumber = chat.invoiceNumber;
        if (invoiceNumber) {
          const invoiceSnap = await db
            .collection("IssuedInvoice")
            .doc(invoiceNumber)
            .get();

          if (invoiceSnap.exists) {
            invoiceData = invoiceSnap.data();

            const due = invoiceData.bankInformations?.dueDate;
            if (due) {
              formattedDate = new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "2-digit",
                year: "numeric",
              }).format(new Date(due));
            }
          }
        }

        return {
          ...chat,

          invoice: { invoiceData, formattedDate },
        };
      })
    );

    return data;
  } catch (error) {
    console.error("Error prefetching data with Admin SDK:", error);
    return [];
  }
}


export async function generateMetadata({ params }) {
  return {
    title: 'Orders | REAL MOTOR JAPAN',
    description: 'Orders',
  }
};


export default async function OrderPage() {
  // 1️⃣ Read comma-separated list of all legacy cookie names and the current cookie name
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES
  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME

  // 2️⃣ Convert the legacy names string into an array
  const oldNames = OLD_NAMES_ENV
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)

  // 3️⃣ Read cookies() synchronously (no await)
  const cookieStore = await cookies()

  // 4️⃣ If any legacy cookie still exists, treat as not logged in
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
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://dev.realmotor.jp"
    const verifyRes = await fetch(`${origin}/api/verify-session`, {
      method: "GET",
      headers: { cookie: `${COOKIE_NAME}=${sessionCookie}` },
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
    console.error("[OrderPage] /api/verify-session error:", err)
    redirect("/login")
  }

  // 8️⃣ Now userEmail is valid. Check if the user exists and has no missing fields.
  const { exists, missingFields } = await checkUserExist(userEmail)
  if (!exists || (missingFields && missingFields.length > 0)) {
    redirect("/accountCreation")
  }

  // 9️⃣ Fetch any needed data
  const currency = await fetchCurrency()
  const accountData = await getAccountData(userEmail)


  const prefetchedData = await fetchPrefetchedData(userEmail);

  // 🔟 Render the protected order page

  return (
    <>
      <ClientAppCheck />
      <MainOrderPage
        prefetchedData={prefetchedData}
        currency={currency}
        userEmail={userEmail}
        accountData={accountData}
      />
    </>
  )
}