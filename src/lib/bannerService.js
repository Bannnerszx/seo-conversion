import { admin } from "@/lib/firebaseAdmin";

// Simple in-memory cache (mimicking your API logic)
let cachedConfig = {
  showBanner: null,
  timestamp: 0
};

const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

export async function getBannerConfig() {
  const now = Date.now();
  const isCacheInvalid = cachedConfig.showBanner === null || now - cachedConfig.timestamp >= CACHE_DURATION_MS;

  if (isCacheInvalid) {
    try {
      // console.log('Cache MISS: Fetching banner config from Firestore.
      const docSnap = await admin
        .firestore()
        .collection('InfoBanner')
        .doc('config')
        .get();

      const showBannerFromDB = docSnap.exists ? docSnap.data().showBanner : false;
      
      cachedConfig = {
        showBanner: showBannerFromDB,
        timestamp: now
      };
    } catch (error) {
      console.error("Error fetching banner config:", error);
      // Fail safe: hide banner if DB fails
      return false;
    }
  }
  
  return cachedConfig.showBanner;
}