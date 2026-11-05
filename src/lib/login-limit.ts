import { createHmac } from "node:crypto";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

/** Bound distributed guesses without storing submitted email addresses. */
export async function enforceAccountLoginLimit(email: string, secret: string) {
  const now = Date.now();
  const key = createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex");
  // Conflicting on the primary key lets concurrent attempts increment one counter.
  const counter = await db
    .insertInto("account_login_limits")
    .values({
      id: `login:${key}:${Math.floor(now / WINDOW_MS)}`,
      count: 1,
      expires_at: new Date(now + WINDOW_MS),
    })
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => ({
        count: eb("account_login_limits.count", "+", 1),
      })),
    )
    .returning("count")
    .executeTakeFirst();
  if (!counter || counter.count > MAX_ATTEMPTS) {
    throw new APIError(
      "TOO_MANY_REQUESTS",
      { message: "Too many sign-in attempts. Try again later." },
      {
        "Retry-After": String(
          Math.ceil((WINDOW_MS - (now % WINDOW_MS)) / 1000),
        ),
      },
    );
  }
}
