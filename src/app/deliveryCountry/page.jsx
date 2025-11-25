// app/your-route/page.jsx
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClientAppCheck from "../../../firebase/ClientAppCheck";
import DeliveryClient from "./deliveryCountComponents/DeliveryClient";
export default async function Page() {
  // 1️⃣ Read comma-separated list of all legacy cookie names and the current cookie name
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || "";
  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME;

  // 2️⃣ Convert the legacy names string into an array
  const oldNames = OLD_NAMES_ENV
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  // 3️⃣ Read cookies() synchronously (no await)
  const cookieStore = await cookies()

  // 4️⃣ If any legacy cookie still exists, redirect to /login
  for (const legacyName of oldNames) {
    if (cookieStore.get(legacyName)?.value) {
      redirect("/login");
    }
  }

  // 5️⃣ Read only the current cookie
  const sessionCookie = COOKIE_NAME ? cookieStore.get(COOKIE_NAME)?.value : null;

  // 6️⃣ If there’s no current cookie, redirect to /login
  if (!sessionCookie) {
    redirect("/login");
  }

  // 7️⃣ Verify via /api/verify-session
  let userEmail = null;

  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const verifyRes = await fetch(`${origin}/api/verify-session`, {
      method: "GET",
      headers: {
        // Forward only COOKIE_NAME
        cookie: `${COOKIE_NAME}=${sessionCookie}`,
      },
      cache: "no-store",
    });

    const apiJson = await verifyRes.json();

    if (!apiJson.valid) {
      // If invalid, redirect to /login
      redirect("/login");
    }

    // If valid, extract email
    userEmail = apiJson.claims.email || null;
  } catch (err) {
    console.error("[DeliveryPage] /api/verify-session error:", err);
    redirect("/login");
  }

  // 🔐 Optional: if you still want to check for user profile completeness,
  // you can keep this part and import your helper:
  //
  // const { exists, missingFields } = await checkUserExist(userEmail);
  // if (!exists || (missingFields && missingFields.length > 0)) {
  //   redirect("/accountCreation");
  // }

  // 8️⃣ Render the authenticated Delivery page
  return (
    <>
      <ClientAppCheck />
      <DeliveryClient userEmail={userEmail} />
    </>
  );
}
