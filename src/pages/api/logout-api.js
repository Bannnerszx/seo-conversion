// pages/api/logout.js
import { deleteCookie } from "cookies-next/server"

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // 1️⃣ Read the comma-separated list of all legacy cookie names
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || ""
  // 2️⃣ Read the “current” cookie name
  const COOKIE_NAME   = process.env.SESSION_COOKIE_NAME

  // 3️⃣ Split OLD_NAMES_ENV into an array, trimming whitespace
  const oldNames = OLD_NAMES_ENV
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean) // remove any empty strings

  // 4️⃣ Delete each legacy cookie
  for (const legacyName of oldNames) {
    deleteCookie(legacyName, { req, res, path: "/" })
  }

  // 5️⃣ Delete the current cookie
  if (COOKIE_NAME) {
    deleteCookie(COOKIE_NAME, { req, res, path: "/" })
  }

  return res.status(200).json({ message: "Logged out successfully" })
}
