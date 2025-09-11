import { db } from "@/lib/firebaseAdmin";

// Simple in-memory cache: { images: [], ts: Number }
const IMAGES_CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing car ID" });

  // Try cache first
  try {
    const cached = IMAGES_CACHE.get(id);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return res.status(200).json({ images: cached.images, cached: true });
    }
  } catch (e) {
    // ignore cache errors and continue
    console.error('Cache check error:', e);
  }

  try {
    // Try doc by id
    const snap = await db.collection("VehicleProducts").doc(id).get();
    let images = [];

    if (snap.exists) {
      const data = snap.data() || {};
      images = Array.isArray(data.images)
        ? data.images
        : typeof data.images === "string"
        ? [data.images]
        : [];
    }

    // If no images yet, try query by stockID
    if (!images.length) {
      const q = await db
        .collection("VehicleProducts")
        .where("stockID", "==", id)
        .limit(1)
        .get();
      if (!q.empty) {
        const d = q.docs[0].data() || {};
        images = Array.isArray(d.images)
          ? d.images
          : typeof d.images === "string"
          ? [d.images]
          : [];
      }
    }

    try {
      IMAGES_CACHE.set(id, { images, ts: Date.now() });
    } catch (e) {
      console.error('Cache set error:', e);
    }

    return res.status(200).json({ images });
  } catch (err) {
    console.error("Error in /api/car-images/[id]:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
