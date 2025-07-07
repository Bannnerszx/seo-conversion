// pages/api/login.js
import { setCookie, deleteCookie } from "cookies-next/server"
import { admin } from "@/lib/firebaseAdmin"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  const { token } = req.body
  if (!token) {
    return res.status(400).json({ error: "Missing token" })
  }

  try {
    // 1️⃣ Verify the incoming ID token
    const decoded = await admin.auth().verifyIdToken(token)

    // 2️⃣ Create a session cookie (14 days)
    const expiresIn = 14 * 24 * 60 * 60 * 1000
    const sessionCookie = await admin.auth().createSessionCookie(token, { expiresIn })

    // 3️⃣ Read cookie names from env:
    //    - a comma-separated list of all legacy cookie names
    //    - the “current” cookie name
    const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || ""
    const COOKIE_NAME  = process.env.SESSION_COOKIE_NAME

    // 4️⃣ Split the legacy list into an array, trim whitespace, and delete each
    const oldNames = OLD_NAMES_ENV
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean) // remove empty strings

    for (const legacyName of oldNames) {
      deleteCookie(legacyName, { req, res, path: "/" })
    }

    // 5️⃣ Finally, set the new cookie under COOKIE_NAME
    setCookie(COOKIE_NAME, sessionCookie, {
      req,
      res,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 14 * 24 * 60 * 60, // 14 days in seconds
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("❌ [login-api] error:", error)
    return res
      .status(401)
      .json({ error: error.code || error.message || "Invalid or expired token" })
  }
}
