import { DEFAULT_USER_SETTINGS, type UserSettings } from "@common/types";
import { db } from "@/lib/db";

export async function getUserSettings(
  userId: string,
): Promise<UserSettings | null> {
  const row = await db
    .selectFrom("user_settings")
    .select("preferences")
    .where("user_id", "=", userId)
    .executeTakeFirst();
  if (!row) return null;
  return {
    ...DEFAULT_USER_SETTINGS,
    ...(row.preferences as Partial<UserSettings>),
  };
}

export async function upsertUserSettings(
  userId: string,
  preferences: UserSettings,
): Promise<UserSettings> {
  const updatedAt = new Date();
  const json = JSON.stringify(preferences);
  await db
    .insertInto("user_settings")
    .values({ user_id: userId, preferences: json, updated_at: updatedAt })
    .onConflict((oc) =>
      oc
        .column("user_id")
        .doUpdateSet({ preferences: json, updated_at: updatedAt }),
    )
    .execute();
  return preferences;
}

/** Resolve account preferences for an authenticated request. */
export async function resolveSettings(session: {
  user: { id: string };
}): Promise<UserSettings> {
  return (
    (await getUserSettings(session.user.id)) ?? { ...DEFAULT_USER_SETTINGS }
  );
}
