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

export async function createInviteCode(
  createdByUserId: string,
): Promise<InviteCodeDocument> {
  try {
    await inviteCodesCollection.createIndex({ code: 1 }, { unique: true });
    await inviteCodesCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    );
  } catch {
    // Driver errors can contain stored values; keep the failure diagnostic generic.
    throw new Error(
      "Invite index initialization failed; check duplicates and index permissions",
    );
  }
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
