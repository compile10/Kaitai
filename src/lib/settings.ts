import type { UserSettings } from "@common/types";
import { db } from "@/lib/db";

/** Every account has a user_settings row; migration 009 creates it on signup. */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const row = await db
    .selectFrom("user_settings")
    .select("show_word_translations")
    .where("user_id", "=", userId)
    .executeTakeFirstOrThrow();
  return { showWordTranslations: row.show_word_translations };
}

/** Save the given preferences; omitted ones keep their stored values. */
export async function updateUserSettings(
  userId: string,
  update: Partial<UserSettings>,
): Promise<UserSettings> {
  if (update.showWordTranslations === undefined) {
    return getUserSettings(userId);
  }
  const row = await db
    .updateTable("user_settings")
    .set({
      show_word_translations: update.showWordTranslations,
      updated_at: new Date(),
    })
    .where("user_id", "=", userId)
    .returning("show_word_translations")
    .executeTakeFirstOrThrow();
  return { showWordTranslations: row.show_word_translations };
}
