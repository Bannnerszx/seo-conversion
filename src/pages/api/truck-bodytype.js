// pages/api/subbodytype.js
import { db } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { docId } = req.query;
  if (!docId || typeof docId !== "string") {
    res.status(400).json({ error: "Missing or invalid `docId`." });
    return;
  }

  try {
    const snap = await db.collection("SubBodyType").doc(docId).get();
    if (!snap.exists) {
      res.status(404).json({ error: `No document for ID "${docId}".` });
      return;
    }

    const data = snap.data();
    // read the field exactly as it’s stored
    const raw = data?.subBodyType;

    // normalize to array
    const subBodyTypes = Array.isArray(raw) ? raw : [];

    res.status(200).json(subBodyTypes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
}
