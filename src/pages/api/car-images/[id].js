import { db } from "@/lib/firebaseAdmin";
export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Missing car ID' });
    }

    try {
        // only fetch the `images` field
        const snap = await db
            .collection('VehicleProducts')
            .doc(id)
            .get({ fieldMask: ['images'] });

        if (!snap.exists) {
            return res.status(404).json({ error: 'Car not found' });
        }

        const data = snap.data();
        const images = Array.isArray(data.images) ? data.images : [];
        return res.status(200).json({ images });
    } catch (err) {
        console.error('Error fetching car images:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
