import { MongoClient } from "mongodb";


const uri = process.env.NEXT_PUBLIC_MONGODB_URI ? process.env.NEXT_PUBLIC_MONGODB_URI : process.env.API_KEY
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
