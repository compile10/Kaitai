import { randomBytes } from "node:crypto";
import type { InviteCode } from "@common/types";
import type { Document } from "mongodb";
import { ObjectId } from "mongodb";
import mongoClient from "@/lib/db";

const INVITE_CODE_TTL_MS = 24 * 60 * 60 * 1000;

export interface InviteCodeDocument {
  _id: ObjectId;
  code: string;
  createdByUserId: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date | null;
  usedByUserId?: string | null;
}

export const inviteCodesCollection = mongoClient
  .db()
  .collection<InviteCodeDocument & Document>("inviteCodes");

// Ensure indexes exist once per process (HMR-safe)
const globalWithInviteIndexes = globalThis as typeof globalThis &
  Record<"kaitai.inviteCodes.indexes", boolean | undefined>;

if (!globalWithInviteIndexes["kaitai.inviteCodes.indexes"]) {
  globalWithInviteIndexes["kaitai.inviteCodes.indexes"] = true;
  void inviteCodesCollection.createIndex({ code: 1 }, { unique: true });
  void inviteCodesCollection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  );
}

function generateInviteCode() {
  return randomBytes(18).toString("base64url");
}

export function serializeInviteCode(
  inviteCode: InviteCodeDocument,
): InviteCode {
  return {
    id: inviteCode._id.toHexString(),
    code: inviteCode.code,
    createdAt: inviteCode.createdAt.toISOString(),
    expiresAt: inviteCode.expiresAt.toISOString(),
  };
}

export async function findValidInviteCode(
  code: string,
): Promise<InviteCodeDocument | null> {
  return inviteCodesCollection.findOne({
    code,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

/**
 * Atomically marks an unused, unexpired invite code as used. Returns false if
 * the code is invalid or was already claimed (e.g. by a concurrent sign-up).
 */
export async function claimInviteCode(code: string): Promise<boolean> {
  const claimed = await inviteCodesCollection.findOneAndUpdate(
    { code, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  );
  return claimed !== null;
}

export async function markInviteCodeUsedBy(
  code: string,
  userId: string,
): Promise<void> {
  await inviteCodesCollection.updateOne(
    { code },
    { $set: { usedByUserId: userId } },
  );
}

export async function createInviteCode(
  createdByUserId: string,
): Promise<InviteCodeDocument> {
  const now = new Date();
  const inviteCode: InviteCodeDocument = {
    _id: new ObjectId(),
    code: generateInviteCode(),
    createdByUserId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + INVITE_CODE_TTL_MS),
    usedAt: null,
    usedByUserId: null,
  };

  await inviteCodesCollection.insertOne(inviteCode);
  return inviteCode;
}
