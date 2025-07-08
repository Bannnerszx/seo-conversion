import { db } from "@/lib/firebaseAdmin";
export default async function handler(req, res) {
    const { chatId } = req.query;
    if (!chatId) {
        return res.status(400).json({ error: 'Missing chatId' });
    }


    try {
        const snap = await db.collection('chats').doc(chatId).get();
        if (!snap.exists) {
            return res.status(404).json({ error: 'Chat not found' })
        }
        const data = snap.data();
        const tracker = data?.stepIndicator?.value;
        return res.status(200).json({ tracker });
    } catch (e) {
        console.error('API error fetching tracker:', e);
        return res.status(500).json({error: 'Internal server error'})
    }
}