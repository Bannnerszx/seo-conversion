import { db } from "@/lib/firebaseAdmin"

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection("InfoBanner").get()
    const banners = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(b => b.active)
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

    res.status(200).json(banners)
  } catch (error) {
    console.error("fetch-banner-error:", error)
    res.status(500).end()
  }
}