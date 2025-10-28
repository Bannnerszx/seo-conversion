// import { MongoClient } from "mongodb";


// const uri = "mongodb://realmototorjapan-read:c8dvZIF2H8fvzVSSCkrNeSH692cFymAHgYFAKvGGv8fJOZXI@758f241f-9cca-4dbd-a976-e89a49a78ce3.asia-northeast2.firestore.goog:443/mongodb-prod?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false"

// // 3. Throw an error if neither variable was defined.
// if (!uri) {
//   throw new Error('Please define NEXT_PUBLIC_MONGODB_URI (for dev) or API_KEY (for prod) environment variable.');
// }

// // Now `uri` holds the correct connection string.
// const dbName = "mongodb-prod";

// let cachedClient = global._mongoClient;
// let cachedDb = global._mongoDb;

// export async function getDb() {
//     if (cachedClient && cachedDb) {
//         return cachedDb;
//     }
//     const client = new MongoClient(uri);
//     await client.connect();
//     const db = client.db(dbName);

//     global._mongoClient = client;
//     global._mongoDb = db;
//     return db;
// }

//

// lib/mongo.js
import { MongoClient } from "mongodb";

// ⚠️ For security, put this in an environment variable instead of hardcoding.
const uri =
  "mongodb://marcvan12:uEPndYYIpXDKLjbQYQhWq5KFYmOzArIrppILkF-hinB60xvF@1cb538ec-3061-46d9-b9da-8e12231c58c0.asia-northeast2.firestore.goog:443/mongodb?authSource=admin&loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false";

// let uri;

// 1. Check for the local development variable first.
if (process.env.NEXT_PUBLIC_MONGODB_URI) {
  uri = process.env.NEXT_PUBLIC_MONGODB_URI;
}
// 2. If it's not found, check for the production variable and clean it.
else if (process.env.API_KEY) {
  uri = process.env.API_KEY.trim();
}
if (!uri) {
  throw new Error("Missing MongoDB connection string.");
}

const DB_NAME = "mongodb";

// Use a cached connection in dev to prevent multiple connections during hot reloads

//the quick brown
let cached = global._mongoClientPromise;

if (!cached) {
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  cached = client.connect();
  global._mongoClientPromise = cached;
}

export async function getDb() {
  const client = await cached;
  return client.db(DB_NAME);
}
