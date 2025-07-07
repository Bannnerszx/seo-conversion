// pages/api/migrate.js
import { db } from '@/lib/firebaseAdmin';
import { MongoClient } from 'mongodb';



let cachedClient = null;
async function getMongoClient() {
    if (cachedClient) return cachedClient;
    cachedClient = await MongoClient.connect('mongodb://marcvan12:uEPndYYIpXDKLjbQYQhWq5KFYmOzArIrppILkF-hinB60xvF@1cb538ec-3061-46d9-b9da-8e12231c58c0.asia-northeast2.firestore.goog:443/mongodb?loadBalanced=true&authMechanism=SCRAM-SHA-256&tls=true&retryWrites=false', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    return cachedClient;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {

        const mongo = await getMongoClient();
        const coll = mongo.db('mongodb').collection('VehicleProducts');

        const snapshot = await db.collection('VehicleProducts').get();
        const docs = snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));

        if (docs.length > 0) {
            await coll.insertMany(docs);
        }

        res.status(200).json({ migrated: docs.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}
