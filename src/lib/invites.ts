import { randomBytes, randomUUID } from "node:crypto";
import type { InviteCode } from "@common/types";
import type { Selectable } from "kysely";
import { type Database, db } from "@/lib/db";

const INVITE_CODE_TTL_MS = 24 * 60 * 60 * 1000;

export type InviteCodeRow = Selectable<Database["inviteCodes"]>;

function generateInviteCode() {
  return randomBytes(18).toString("base64url");
}

export function serializeInviteCode(inviteCode: InviteCodeRow): InviteCode {
  return {
    id: inviteCode.id,
    code: inviteCode.code,
    createdAt: inviteCode.createdAt.toISOString(),
    expiresAt: inviteCode.expiresAt.toISOString(),
  };
}

export async function findValidInviteCode(
  code: string,
): Promise<InviteCodeRow | null> {
  const row = await db
    .selectFrom("inviteCodes")
    .selectAll()
    .where("code", "=", code)
    .where("usedAt", "is", null)
    .where("expiresAt", ">", new Date())
    .executeTakeFirst();
  return row ?? null;
}

export async function createInviteCode(
  createdByUserId: string,
): Promise<InviteCodeRow> {
  const now = new Date();
  return db
    .insertInto("inviteCodes")
    .values({
      id: randomUUID(),
      code: generateInviteCode(),
      createdByUserId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + INVITE_CODE_TTL_MS),
      usedAt: null,
      usedByUserId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}
