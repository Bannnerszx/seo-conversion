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


// lib/mongo.js
import { MongoClient } from "mongodb";

// 1. Load from environment variable (Local or Secret Manager)
const uri = process.env.NEXT_PUBLIC_MONGO_DB;
const DB_NAME = "mongodb";

if (!uri) {
  throw new Error(
    'Invalid/Missing environment variable: "MONGO_DB"'
  );
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Reuse the client across hot reloads in dev
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // New client in production
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  clientPromise = client.connect();
}

export async function getDb() {
  const c = await clientPromise;
  return c.db(DB_NAME);
}