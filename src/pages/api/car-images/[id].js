import { db } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing car ID" });
  }

  try {
    // Only fetch the 'images' field
    const snap = await db
      .collection("VehicleProducts")
      .doc(id)
      .get({ fieldMask: ["images"] });

    if (!snap.exists) {
      return res.status(404).json({ error: "Car not found" });
    }

    const data = snap.data() || {};
    const [image] = Array.isArray(data.images) ? data.images : [];

    // Cache for 1 day, allow SWR for 7 days
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=604800"
    );

    return res.status(200).json({ image: image ?? null });
  } catch (error) {
    console.error("Error fetching car images:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
