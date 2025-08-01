// pages/api/show-paypal-popup.js
import { getCookie, setCookie } from "cookies-next/server";

export default async function handler(req, res) {
  // 0) disable HTTP caching
  res.setHeader("Cache-Control", "no-store");

  // 1) read the “last shown” timestamp from the PayPal‐specific cookie
  const last = await getCookie("paypal_popup_last_shown", { req, res });
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const elapsed = last ? now - Number(last) : Infinity;

  // 2) if never shown, or it’s been ≥ 1 day, reset the timer and show
  if (!last || elapsed >= oneDayMs) {
    await setCookie("paypal_popup_last_shown", String(now), {
      req,
      res,
      maxAge: 60 * 60 * 24 * 365,  // keep the cookie for up to a year
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.status(200).json({ showPopup: true });
  }

  // 3) otherwise, don’t show
  return res.status(200).json({ showPopup: false });
}
