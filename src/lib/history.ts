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
  try {
    await historyCollection.createIndex({ userId: 1, createdAt: -1 });
    await historyCollection.createIndex(
      { userId: 1, sentence: 1 },
      { unique: true },
    );
  } catch {
    // Driver errors can contain stored values; keep the failure diagnostic generic.
    throw new Error(
      "History index initialization failed; check duplicates and index permissions",
    );
  }
  await historyCollection.updateOne(
    { userId, sentence },
    {
      $set: { provider, model, createdAt: new Date() },
      $setOnInsert: { _id: new ObjectId(), userId, sentence },
    },
    { upsert: true },
  );
}
