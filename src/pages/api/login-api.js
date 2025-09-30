import { setCookie, deleteCookie } from 'cookies-next/server';
import { admin } from '@/lib/firebaseAdmin';
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache({
  max: 200,
  ttl: 60 * 100
});

const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,
  maxRequests: 5
};


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';

    const currentRequests = rateLimitCache.get(ip) || 0;
    if (currentRequests >= RATE_LIMIT_CONFIG.maxRequests) {
      res.setHeader('Retry-After', RATE_LIMIT_CONFIG.windowMs / 1000);
      return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    }
    rateLimitCache.set(ip, currentRequests + 1);

  } catch (err) {
    console.error('Rate limiting error:', err);
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing token" })
  }

  try {
    const expiresIn = 14 * 24 * 60 * 60 * 1000;
    const sessionCookie = await admin.auth().createSessionCookie(token, { expiresIn });

    const OLD_NAMES_ENV = process.env.OLD_SESSION_COOKIES_NAMES || "";
    const COOKIE_NAME = process.env.SESSION_COOKIE_NAME;

    const oldNames = OLD_NAMES_ENV
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    for (const legacyName of oldNames) {
      deleteCookie(legacyName, { req, res, path: '/' })
    }


    setCookie(COOKIE_NAME, sessionCookie, {
      req,
      res,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 14 * 24 * 60 * 60
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[login.js] error:", err)
    return res
    .status(401)
    .json({error: err.code || err.message || "Invalid or expired token"})
  }
}