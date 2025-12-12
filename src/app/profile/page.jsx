'use server'
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountData, getCountries, checkUserExist, fetchNotificationCounts } from "../actions/actions";
import ProfilePage from "./profileComponents/profileMain";
import { Toaster } from "sonner";
import ClientAppCheck from "../../../firebase/ClientAppCheck";

export async function generateMetadata({ params }) {
    return {
        title: 'Profile',
        description: 'Profile',
    }
};

export default async function OrderPage() {
  // 1️⃣ Read comma-separated list of all legacy cookie names and the current cookie name
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES 
  const COOKIE_NAME   = process.env.SESSION_COOKIE_NAME 

  // 2️⃣ Convert the legacy names into an array
  const oldNames = OLD_NAMES_ENV
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)

  // 3️⃣ Read cookies() synchronously
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
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://dev.realmotor.jp"
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
    console.error("[OrderPage] /api/verify-session error:", err)
    redirect("/login")
  }

  // 8️⃣ Check if the user exists and has no missing fields
  const { exists, missingFields } = await checkUserExist(userEmail)
  if (!exists || (missingFields && missingFields.length > 0)) {
    redirect("/accountCreation")
  }

  // 9️⃣ Fetch additional data
  const accountData = await getAccountData(userEmail)
  const countryList = await getCountries()
 
  // 🔟 Render the protected profile page
  return (
    <>
      <ClientAppCheck />
      <Toaster />
      <ProfilePage 
        userEmail={userEmail}
        accountData={accountData}
        countryList={countryList}
      />
    </>
  )
}