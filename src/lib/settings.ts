import { DEFAULT_USER_SETTINGS, type UserSettings } from "@common/types";
import mongoClient, { onceIndexes } from "@/lib/db";

export interface SettingsDocument {
  userId: string;
  preferences?: Partial<UserSettings>;
  updatedAt: Date;
}

const settingsCollection = mongoClient
  .db()
  .collection<SettingsDocument>("user_settings");

const ensureSettingsIndexes = onceIndexes("Settings", () =>
  settingsCollection.createIndex({ userId: 1 }, { unique: true }),
);

export async function getUserSettings(
  userId: string,
): Promise<UserSettings | null> {
  const doc = await settingsCollection.findOne({ userId });
  if (!doc) return null;
  return { ...DEFAULT_USER_SETTINGS, ...doc.preferences };
}

export async function upsertUserSettings(
  userId: string,
  preferences: UserSettings,
): Promise<UserSettings> {
  await ensureSettingsIndexes();
  await settingsCollection.updateOne(
    { userId },
    { $set: { preferences, updatedAt: new Date() } },
    { upsert: true },
  );
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
