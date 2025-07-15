// File: pages/api/convertVehicleProducts.js
import { db } from '@/lib/firebaseAdmin';
import { FieldPath } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const collectionRef = db.collection('VehicleProducts');
    const batchSize = 500;
    const keys = ['regYear'];

    let lastDoc = null;
    let updatedCount = 0;

    while (true) {
      // Only documents with stockStatus == "On-Sale"
      let query = collectionRef
        .where('stockStatus', '==', 'On-Sale')
        .orderBy(FieldPath.documentId())
        .limit(batchSize);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) break;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates = {};

        keys.forEach((key) => {
          const rawVal = data[key];
          const num =
            typeof rawVal === 'string'
              ? parseFloat(rawVal.replace(/[^\d.-]/g, ''))
              : Number(rawVal);
          updates[`${key}Number`] = Number.isFinite(num) ? num : null;
        });

        if (Object.keys(updates).length) {
          await docSnap.ref.update(updates);
          updatedCount++;
          console.log(
            `✅ [Batch Update] Document "${docSnap.id}" updated with:`,
            updates
          );
        } else {
          console.log(
            `⚠️ [Batch Skipped] Document "${docSnap.id}" has no parsable fields.`
          );
        }
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    console.log(`🏁 Conversion complete. Total documents updated: ${updatedCount}`);
    return res
      .status(200)
      .json({ message: `Updated ${updatedCount} VehicleProducts docs.` });
  } catch (err) {
    console.error('🚨 Conversion error:', err);
    return res.status(500).json({ error: err.message });
  }
}
