import type { Document } from "mongodb";
import { ObjectId } from "mongodb";
import mongoClient from "@/lib/db";

/** Shape of a document in the `history` collection. */
export interface HistoryDocument {
  _id: ObjectId;
  userId: string;
  sentence: string;
  provider: string;
  model: string;
  createdAt: Date;
}

export const historyCollection = mongoClient
  .db()
  .collection<HistoryDocument & Document>("history");

// Ensure compound indexes exist (idempotent — no-op if already created)
historyCollection.createIndex(
  { userId: 1, createdAt: -1 },
  { background: true },
);
historyCollection.createIndex(
  { userId: 1, sentence: 1 },
  { background: true, unique: true },
);

/**
 * Save a sentence to the user's history.
 *
 * Uses upsert on { userId, sentence } so re-analyzing the same sentence
 * updates the existing entry (with fresh timestamp) instead of creating
 * a duplicate. This brings it to the top of the history list.
 *
 * Called by both `/api/analyze` and `/api/analyze-image`.
 */
export async function saveToHistory(
  userId: string,
  sentence: string,
  provider: string,
  model: string,
): Promise<void> {
  await historyCollection.updateOne(
    { userId, sentence },
    {
      $set: { provider, model, createdAt: new Date() },
      $setOnInsert: { _id: new ObjectId(), userId, sentence },
    },
    { upsert: true },
  );
}
