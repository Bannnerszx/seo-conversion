import { unstable_cache } from "next/cache";
import { db } from "@/lib/firebaseAdmin";
// Fetches only the thumbnailImage string from the database.
async function fetchThumbnailFromDB(id) {
  let thumbnailUrl = "";

  // Get the entire document reference first
  const docRef = db.collection('VehicleProducts').doc(String(id));
  const snap = await docRef.get();

  if (snap.exists) {
    // Access the specific field from the document's data
    const data = snap.data() || {};
    if (typeof data.thumbnailImage === "string") {
      thumbnailUrl = data.thumbnailImage;
    }
  }
  // 2. If not found, try fetching by stockID as a fallback.
  if (!thumbnailUrl) {
    const q = await db.collection('VehicleProducts').where('stockID', '==', id).select('thumbnailImage').limit(1).get();
    if (!q.empty) {
      const d = q.docs[0].data() || {};
      if (typeof d.thumbnailImage === 'string' && d.thumbnailImage) {
        thumbnailUrl = d.thumbnailImage;
      }
    }
  }

  return thumbnailUrl;
}

// Caching factory specifically for the thumbnail URL.
function getThumbnailCachedFactory(id) {
  return unstable_cache(
    async () => fetchThumbnailFromDB(id),
    ['car-thumbnail', String(id)], // Updated cache key for clarity.
    { revalidate: 300, tags: ["car-thumbnail", `car-thumb:${id}`] } // Updated tags.
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing car ID' });

  const getThumbnailCached = getThumbnailCachedFactory(id);
  const thumbnailUrl = await getThumbnailCached();

  // If no URL is found after checking DB, you might want to send a 404.
  if (!thumbnailUrl) {
    return res.status(404).json({ error: 'Thumbnail not found' });
  }

  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

  // A simpler ETag based on the thumbnail URL itself is sufficient.
  const etag = `W/"${Buffer.from(thumbnailUrl).toString("base64")}"`;
  res.setHeader("ETag", etag);

  // If the client's ETag matches, send a 304 Not Modified response.
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  // Return the single thumbnail URL in the response.
  return res.status(200).json({ thumbnailUrl });
}