import { auth } from "@/lib/auth";
import mongoClient from "@/lib/db";

/** Default credentials for local developer testing only. Override via env. */
export const DEV_ADMIN_DEFAULTS = {
  email: "admin@localhost.dev",
  password: "dev-admin-password",
  name: "Dev Admin",
} as const;

/**
 * Idempotently creates a development admin account.
 * No-ops outside NODE_ENV=development and when the account already exists.
 */
export async function seedDevAdmin(): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const email = process.env.DEV_ADMIN_EMAIL ?? DEV_ADMIN_DEFAULTS.email;
  const password =
    process.env.DEV_ADMIN_PASSWORD ?? DEV_ADMIN_DEFAULTS.password;
  const name = process.env.DEV_ADMIN_NAME ?? DEV_ADMIN_DEFAULTS.name;

  try {
    const existing = await mongoClient
      .db()
      .collection("user")
      .findOne({ email });
    if (existing) {
      return;
    }

    await auth.api.createUser({
      body: {
        email,
        password,
        name,
        role: "admin",
      },
    });

    console.info(`[dev-seed] Created developer admin account: ${email}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/already|exist/i.test(message)) {
      return;
    }
    console.error("[dev-seed] Failed to seed developer admin account:", error);
  }
}
