import { createHmac } from "node:crypto";
import { APIError } from "better-auth/api";
import mongoClient, { onceIndexes } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

const ensureLoginLimitIndexes = onceIndexes("Login rate-limit", () =>
  mongoClient
    .db()
    .collection("accountLoginLimits")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
);

/** Bound distributed guesses without storing submitted email addresses. */
export async function enforceAccountLoginLimit(email: string, secret: string) {
  await ensureLoginLimitIndexes();
  const now = Date.now();
  const key = createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex");
  const counters = mongoClient
    .db()
    .collection<{ _id: string; count: number; expiresAt: Date }>(
      "accountLoginLimits",
    );
  const filter = { _id: `login:${key}:${Math.floor(now / WINDOW_MS)}` };
  // Matching the unique _id lets concurrent upserts increment the same counter.
  const counter = await counters.findOneAndUpdate(
    filter,
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(now + WINDOW_MS) },
    },
    { upsert: true, returnDocument: "after" },
  );
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
