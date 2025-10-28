// pages/api/logout.js
import { deleteCookie } from "cookies-next/server";
import { admin } from "@/lib/firebaseAdmin";
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Ensure the Firebase Admin SDK is initialized


  const COOKIE_NAME = process.env.SESSION_COOKIE_NAME;
  const sessionCookie = req.cookies[COOKIE_NAME] || "";

  // 1️⃣ First, revoke the session on the server
  if (sessionCookie) {
    try {
      const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
      await admin.auth().revokeRefreshTokens(decodedClaims.uid);
    } catch (error) {
      console.error("Error revoking session:", error.message);
    }
  }

  // 2️⃣ Then, delete the cookies from the browser (your existing logic)
  const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIE_NAMES || "";
  const oldNames = OLD_NAMES_ENV.split(",").map((name) => name.trim()).filter(Boolean);

  for (const legacyName of oldNames) {
    deleteCookie(legacyName, { req, res, path: "/" });
  }

  if (COOKIE_NAME) {
    deleteCookie(COOKIE_NAME, { req, res, path: "/" });
  }

  return res.status(200).json({ message: "Logged out successfully" });
}