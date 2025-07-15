import { MongoClient } from "mongodb";


let uri;

// 1. Check for the local development variable first.
if (process.env.NEXT_PUBLIC_MONGODB_URI) {
  uri = process.env.NEXT_PUBLIC_MONGODB_URI;
} 
// 2. If it's not found, check for the production variable and clean it.
else if (process.env.API_KEY) {
  uri = process.env.API_KEY.trim();
}

// 3. Throw an error if neither variable was defined.
if (!uri) {
  throw new Error('Please define NEXT_PUBLIC_MONGODB_URI (for dev) or API_KEY (for prod) environment variable.');
}

// Now `uri` holds the correct connection string.
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
