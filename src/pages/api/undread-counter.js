import { admin } from "@/lib/firebaseAdmin";
export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    const userEmail = Array.isArray(req.query.userEmail)
        ? req.query.userEmail[0]
        : req.query.userEmail;

    if (!userEmail) {
        return res.status(400).end('Missing userEmail');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.write(`: connected\n\n`);

    // 1) build the Query (no .get())
    const q = admin
        .firestore()
        .collection('chats')
        .where('participants.customer', '==', userEmail)
        .where('customerRead', '==', false);

    // 2) subscribe
    const unsubscribe = q.onSnapshot(
        (snapshot) => {
            const count = snapshot.size;       // total docs matching
            res.write(`data: ${count}\n\n`);
        },
        (err) => {
            console.error('SSE snapshot error:', err);
            res.write(`event: error\ndata: 0\n\n`);
        }
    );

    req.on('close', () => {
        unsubscribe();
        res.end();
    });
}