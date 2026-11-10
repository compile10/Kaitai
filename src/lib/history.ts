import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Save a sentence to the user's history.
 *
 * Upserts on (user_id, sentence) so re-analyzing the same sentence refreshes
 * the existing entry's timestamp instead of creating a duplicate, bringing it
 * to the top of the history list.
 *
 * Called by `analyzeForUser`, which backs `/api/analyze` and `/api/analyze-image`.
 */
export async function saveToHistory(
  userId: string,
  sentence: string,
  model: string,
): Promise<void> {
  const createdAt = new Date();
  await db
    .insertInto("history")
    .values({
      id: randomUUID(),
      user_id: userId,
      sentence,
      model,
      created_at: createdAt,
    })
    .onConflict((oc) =>
      oc
        .columns(["user_id", "sentence"])
        .doUpdateSet({ model, created_at: createdAt }),
    )
    .execute();
}

/** One page of the user's history, newest first, without diagnostic metadata. */
export async function listHistory(
  userId: string,
  limit: number,
  offset: number,
) {
  const [count, rows] = await Promise.all([
    db
      .selectFrom("history")
      .select((eb) => eb.fn.countAll<number>().as("total"))
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("history")
      .select(["id", "sentence", "created_at"])
      .where("user_id", "=", userId)
      .orderBy("created_at", "desc")
      // Tie-break so equal timestamps cannot shift between pages.
      .orderBy("id", "desc")
      .limit(limit)
      .offset(offset)
      .execute(),
  ]);
  return { total: count.total, rows };
}
