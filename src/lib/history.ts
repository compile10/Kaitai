import type { SentenceAnalysis } from "@common/types";
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
  analysis: SentenceAnalysis;
  createdAt: Date;
}

export const historyCollection = mongoClient
  .db()
  .collection<HistoryDocument & Document>("history");

// Ensure compound index exists (idempotent — no-op if already created)
historyCollection.createIndex(
  { userId: 1, createdAt: -1 },
  { background: true },
);

/**
 * Save a completed sentence analysis to the user's history.
 *
 * This is the single shared function called by both `/api/analyze` and
 * `/api/analyze-image` after a successful analysis.
 */
export async function saveToHistory(
  userId: string,
  sentence: string,
  provider: string,
  model: string,
  analysis: SentenceAnalysis,
): Promise<void> {
  await historyCollection.insertOne({
    _id: new ObjectId(),
    userId,
    sentence,
    provider,
    model,
    analysis,
    createdAt: new Date(),
  });
}
