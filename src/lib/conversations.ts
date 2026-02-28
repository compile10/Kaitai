import type {
  ConversationListItem,
  ConversationMessage,
  ConversationScore,
} from "@common/types";
import type { Document } from "mongodb";
import { ObjectId } from "mongodb";
import mongoClient from "@/lib/db";

export interface ConversationDocument {
  _id: ObjectId;
  userId: string;
  topic: string;
  messages: ConversationMessage[];
  isComplete: boolean;
  score?: ConversationScore;
  provider: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export const conversationsCollection = mongoClient
  .db()
  .collection<ConversationDocument & Document>("conversations");

conversationsCollection.createIndex(
  { userId: 1, updatedAt: -1 },
  { background: true },
);

function toConversationResponse(doc: ConversationDocument) {
  return {
    id: doc._id.toHexString(),
    topic: doc.topic,
    messages: doc.messages,
    isComplete: doc.isComplete,
    score: doc.score,
    provider: doc.provider,
    model: doc.model,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function createConversation(
  userId: string,
  topic: string,
  provider: string,
  model: string,
  initialMessage: ConversationMessage,
) {
  const now = new Date();
  const doc: ConversationDocument = {
    _id: new ObjectId(),
    userId,
    topic,
    messages: [initialMessage],
    isComplete: false,
    provider,
    model,
    createdAt: now,
    updatedAt: now,
  };
  await conversationsCollection.insertOne(
    doc as ConversationDocument & Document,
  );
  return toConversationResponse(doc);
}

export async function listConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const docs = await conversationsCollection
    .find({ userId }, { projection: { topic: 1, isComplete: 1, updatedAt: 1 } })
    .sort({ updatedAt: -1 })
    .toArray();

  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    topic: doc.topic,
    isComplete: doc.isComplete,
    updatedAt: doc.updatedAt.toISOString(),
  }));
}

export async function getConversation(id: string, userId: string) {
  if (!ObjectId.isValid(id)) return null;
  const doc = await conversationsCollection.findOne({
    _id: new ObjectId(id),
    userId,
  });
  return doc ? toConversationResponse(doc) : null;
}

export async function appendMessages(
  id: string,
  userId: string,
  messages: ConversationMessage[],
) {
  if (!ObjectId.isValid(id)) return false;
  const result = await conversationsCollection.updateOne(
    { _id: new ObjectId(id), userId, isComplete: false },
    {
      $push: { messages: { $each: messages } } as unknown as Record<
        string,
        never
      >,
      $set: { updatedAt: new Date() },
    },
  );
  return result.matchedCount === 1;
}

export async function deleteConversation(
  id: string,
  userId: string,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await conversationsCollection.deleteOne({
    _id: new ObjectId(id),
    userId,
  });
  return result.deletedCount === 1;
}

export async function completeConversation(
  id: string,
  userId: string,
  score: ConversationScore,
) {
  if (!ObjectId.isValid(id)) return false;
  const result = await conversationsCollection.updateOne(
    { _id: new ObjectId(id), userId },
    { $set: { isComplete: true, score, updatedAt: new Date() } },
  );
  return result.matchedCount === 1;
}
