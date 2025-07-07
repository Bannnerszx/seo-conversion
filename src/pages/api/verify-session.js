// pages/api/verify-session.js
import { admin } from "@/lib/firebaseAdmin"
import { deleteCookie } from "cookies-next/server"

export default async function handler(req, res) {
  // 1️⃣ Read comma-separated list of all legacy cookie names and the current cookie name
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES 
  const COOKIE_NAME   = process.env.SESSION_COOKIE_NAME 

  // 2️⃣ Convert the legacy names into an array
  const oldNames = OLD_NAMES_ENV
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)

  // 3️⃣ If any legacy cookie is present, delete it immediately and return invalid
  for (const legacyName of oldNames) {
    if (req.cookies[legacyName]) {
      deleteCookie(legacyName, { req, res, path: "/" })
      return res.status(200).json({ valid: false })
    }
  }

  // 4️⃣ Read only the “current” cookie
  const sessionCookie = req.cookies[COOKIE_NAME]
  if (!sessionCookie) {
    return res.status(200).json({ valid: false })
  }

  // 5️⃣ Attempt to verify the current session cookie with Firebase Admin
  try {
    const decodedClaims = await admin
      .auth()
      .verifySessionCookie(sessionCookie, /* checkRevoked= */ true)

    return res.status(200).json({
      valid: true,
      claims: {
        uid: decodedClaims.uid,
        email: decodedClaims.email || null,
      },
    })
  } catch {
    // 6️⃣ If invalid or expired, delete it and return invalid
    deleteCookie(COOKIE_NAME, { req, res, path: "/" })
    return res.status(200).json({ valid: false })
  }
}
