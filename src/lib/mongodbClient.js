import { MongoClient } from "mongodb";

const uri = process.env.NEXT_PUBLIC_MONGODB_URI ? process.env.NEXT_PUBLIC_MONGODB_URI : "mongodb://realmototorjapan-read:c8dvZIF2H8fvzVSSCkrNeSH692cFymAHgYFAKvGGv8fJOZXI@758f241f-9cca-4dbd-a976-e89a49a78ce3.asia-northeast2.firestore.goog:443/mongodb-prod?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false"
const dbName = "mongodb-prod";

let cachedClient = global._mongoClient;
let cachedDb = global._mongoDb;

export async function getDb() {
    if (cachedClient && cachedDb) {
        return cachedDb;
    }
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    global._mongoClient = client;
    global._mongoDb = db;
    return db;
}
