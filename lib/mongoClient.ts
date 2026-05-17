// lib/mongoClient.ts
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 5000,
  tls: true,
  retryWrites: true,
  w: 'majority' as const,
};

let client: MongoClient | null = null;
let pendingClientPromise: Promise<MongoClient> | null = null;

function getClientPromise() {
  if (pendingClientPromise) {
    return pendingClientPromise;
  }

  if (!uri) {
    pendingClientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'));
    return pendingClientPromise;
  }

  if (!client) {
    client = new MongoClient(uri, options);
  }

  pendingClientPromise = client.connect().catch((error) => {
    pendingClientPromise = null;
    throw error;
  });

  return pendingClientPromise;
}

const clientPromise = new Proxy({} as Promise<MongoClient>, {
  get(_target, property) {
    const promise = getClientPromise();
    const value = promise[property as keyof Promise<MongoClient>];

    if (typeof value === 'function') {
      return value.bind(promise);
    }

    return value;
  },
}) as Promise<MongoClient>;

export default clientPromise;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | null;
}
