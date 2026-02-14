import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const uri = process.env.MONGODB_URI;
const options = {};

let mongoClient: MongoClient;

if (process.env.NODE_ENV === "development") {
  const g = globalThis as typeof globalThis & { _mongoClient?: MongoClient };
  if (!g._mongoClient) {
    g._mongoClient = new MongoClient(uri, options);
  }
  mongoClient = g._mongoClient;
} else {
  mongoClient = new MongoClient(uri, options);
}

export default mongoClient;
