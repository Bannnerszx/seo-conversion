//pages/api/show-banner.js
import { getCookie, setCookie } from "cookies-next/server";
import { admin } from "@/lib/firebaseAdmin";

//In-memory cache for the Firestore result
let cachedConfig = {
  showBanner: null,
  timestamp: 0
}

const CACHE_DURATION_MS = 60 * 1000; //Cache for 60 seconds

export default async function handler(req, res) {
  //0) prevent any caching of the final user-specific respsonse
  res.setHeader('Cache-Control', 'no-store')

  //1A) Check if we have a fresh cached value from firestore
  const now = Date.now();
  const isCacheInvalid = cachedConfig.showBanner === null || now - cachedConfig.timestamp >= CACHE_DURATION_MS
  if (isCacheInvalid) {
    console.log('Cache MISS: Fetching banner config from Firestore.');
    const docSnap = await admin
      .firestore()
      .collection('InfoBanner')
      .doc('config')
      .get();

    const showBannerFromDB = docSnap.exists ? docSnap.data().showBanner : false
    cachedConfig = {
      showBanner: showBannerFromDB,
      timestamp: now
    }
  } else {
    console.log('Cache HIT: Using cached banner config.');
  }

  //Now, the rest of the code can safely use the (potentially updated) cachedConfig
  if (!cachedConfig.showBanner) {
    return res.status(200).json({ showBanner: false });
  }

  //3. Otherwise, run the user-specific cookie logic
  const last = await getCookie('banner_last_shown', { req, res });
  const ageDays = last ? (now - Number(last)) / (1000 * 60 * 60 * 24) : Infinity;

  //4. If the user hasn't sseen the banner or saw it more than 2 days ago, show it
  if (!last || ageDays >= 2) {
    await setCookie('banner_last_shown', String(now), {
      req,
      res,
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.status(200).json({ showBanner: true });
  }

  //5. If they saw it recently, don't show it
  return res.status(200).json({ showBanner: false })
}