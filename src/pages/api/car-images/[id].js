//pages/api/car-images/[id].js
import { unstable_cache } from "next/cache";
import { db } from "@/lib/firebaseAdmin";

async function fetchImagesFromDB(id) {
  let images = [];
  const snap = await db.collection('VehicleProducts').doc(String(id)).get();
  if (snap.exists) {
    const data = snap.data() || {};
    images = Array.isArray(data.images)
      ? data.images
      : typeof data.images === "string"
        ? [data.images]
        : [];
  }
  if (!images.length) {
    const q = await db.collection('VehicleProducts').where('stockID', '==', id).limit(1).get();
    if (!q.empty) {
      const d = q.docs[0].data() || {};
      images = Array.isArray(d.images)
        ? d.images
        : typeof d.images === 'string'
          ? [d.images]
          : [];
    }
  }
  return images;
}

function getImagesCachedFactory(id) {
  return unstable_cache(
    async () => fetchImagesFromDB(id),
    ['car-images', String(id)],
    { revalidate: 300, tags: ["car-images", `car:${id}`] }
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing car ID' });

  const getImagesCached = getImagesCachedFactory(id);
  const images = await getImagesCached();

  res.setHeader('Cached-Control', 'public, max-age=300, stale-while-revalidate=60');
  const etag = `W/"${Buffer.from(
    JSON.stringify([images.length, images[0], images[images.length - 1] || ""])
  )
    .toString("base64")
    .slice(0, 16)}"`;
  res.setHeader("ETag", etag);
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  return res.status(200).json({ images });
}