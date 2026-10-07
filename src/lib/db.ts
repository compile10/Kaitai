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

/**
 * Return a function that creates indexes once per process. Callers await it
 * before writing; a failure clears the cached attempt so the next call retries.
 */
export function onceIndexes(
  name: string,
  create: () => Promise<unknown>,
): () => Promise<void> {
  let ready: Promise<void> | undefined;
  return () => {
    ready ??= create().then(
      () => {},
      () => {
        ready = undefined;
        // Driver errors can contain stored values; keep the failure diagnostic generic.
        throw new Error(
          `${name} index initialization failed; check duplicates and index permissions`,
        );
      },
    );
    return ready;
  };
}
