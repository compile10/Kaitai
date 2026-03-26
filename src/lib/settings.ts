import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "@common/providers";
import type { Provider } from "@common/types";
import type { Document } from "mongodb";
import mongoClient from "@/lib/db";

export { DEFAULT_MODEL, DEFAULT_PROVIDER };

export interface SettingsDocument {
  userId: string;
  provider: Provider;
  model: string;
  updatedAt: Date;
}

export interface ResolvedSettings {
  provider: Provider;
  model: string;
}

const settingsCollection = mongoClient
  .db()
  .collection<SettingsDocument & Document>("user_settings");

// Ensure index exists once per process (HMR-safe)
// biome-ignore lint/suspicious/noExplicitAny: globalThis augmentation without declaration merging
if (!(globalThis as any)["kaitai.settings.indexes"]) {
  (globalThis as any)["kaitai.settings.indexes"] = true;
  void settingsCollection.createIndex({ userId: 1 }, { unique: true });
}

export async function getUserSettings(
  userId: string,
): Promise<ResolvedSettings | null> {
  const doc = await settingsCollection.findOne({ userId });
  if (!doc) return null;
  return { provider: doc.provider, model: doc.model };
}

export async function upsertUserSettings(
  userId: string,
  provider: Provider,
  model: string,
): Promise<ResolvedSettings> {
  await settingsCollection.updateOne(
    { userId },
    { $set: { provider, model, updatedAt: new Date() } },
    { upsert: true },
  );
  return { provider, model };
}

/**
 * Resolve the provider/model for a request.
 * If a session is present, reads from the DB (falling back to defaults).
 * Otherwise returns hardcoded defaults.
 */
export async function resolveSettings(
  session: { user: { id: string } } | null,
): Promise<ResolvedSettings> {
  if (!session) {
    return { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL };
  }

  const settings = await getUserSettings(session.user.id);
  if (settings) return settings;

  return { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL };
}
