import { createHmac } from "node:crypto";
import { APIError } from "better-auth/api";
import { RateLimiterPostgres, RateLimiterRes } from "rate-limiter-flexible";
import { pool } from "@/lib/db";

export interface RateLimitPolicy {
  message: string;
  user: RateLimiterPostgres;
  ip: RateLimiterPostgres;
}

interface PolicyOptions {
  name: string;
  message: string;
  userLimit: number;
  ipLimit: number;
  windowSeconds: number;
}

function createLimiter(
  keyPrefix: string,
  points: number,
  windowSeconds: number,
): RateLimiterPostgres {
  return new RateLimiterPostgres({
    storeClient: pool,
    storeType: "pool",
    tableName: "rate_limits",
    // The migrations create the table and schedule pruning with pg_cron.
    tableCreated: true,
    clearExpiredByTimeout: false,
    keyPrefix,
    points,
    duration: windowSeconds,
  });
}

function createPolicy({
  name,
  message,
  userLimit,
  ipLimit,
  windowSeconds,
}: PolicyOptions): RateLimitPolicy {
  return {
    message,
    user: createLimiter(`${name}:user`, userLimit, windowSeconds),
    ip: createLimiter(`${name}:ip`, ipLimit, windowSeconds),
  };
}

export const RATE_LIMIT_POLICIES = {
  telemetry: createPolicy({
    name: "telemetry",
    message: "Too many error reports.",
    userLimit: 20,
    ipLimit: 60,
    windowSeconds: 60,
  }),
  analyzeSentence: createPolicy({
    name: "analyze-sentence",
    message: "Too many sentence analysis requests.",
    userLimit: 10,
    ipLimit: 30,
    windowSeconds: 60,
  }),
  analyzeImage: createPolicy({
    name: "analyze-image",
    message: "Too many image analysis requests.",
    userLimit: 3,
    ipLimit: 10,
    windowSeconds: 60,
  }),
  history: createPolicy({
    name: "history",
    message: "Too many history requests.",
    userLimit: 60,
    ipLimit: 180,
    windowSeconds: 60,
  }),
  settings: createPolicy({
    name: "settings",
    message: "Too many settings requests.",
    userLimit: 30,
    ipLimit: 90,
    windowSeconds: 60,
  }),
  inviteCodes: createPolicy({
    name: "invite-codes",
    message: "Too many invite code requests.",
    userLimit: 5,
    ipLimit: 15,
    windowSeconds: 60 * 60,
  }),
};

const accountLoginLimiter = createLimiter("login:account", 20, 15 * 60);

type Dimension = "user" | "ip" | "account";

export type RateLimitDecision =
  | { allowed: true }
  | {
      allowed: false;
      limit: number;
      retryAfter: number;
      resetAt: number;
      message: string;
    };

function identifierKey(
  secret: string,
  dimension: Dimension,
  identifier: string,
): string {
  return createHmac("sha256", secret)
    .update(`${dimension}\0${identifier}`)
    .digest("base64url");
}

async function consume(
  limiter: RateLimiterPostgres,
  secret: string,
  dimension: Dimension,
  identifier: string,
  message: string,
): Promise<RateLimitDecision> {
  try {
    await limiter.consume(identifierKey(secret, dimension, identifier));
    return { allowed: true };
  } catch (error) {
    if (!(error instanceof RateLimiterRes)) throw error;

    const retryAfter = Math.max(1, Math.ceil(error.msBeforeNext / 1000));
    return {
      allowed: false,
      limit: limiter.points,
      retryAfter,
      resetAt: Math.ceil((Date.now() + error.msBeforeNext) / 1000),
      message: `${message} Try again in ${retryAfter} seconds.`,
    };
  }
}

export interface RateLimitCaller {
  /** Keys are HMACs under this secret, so no raw identifier is stored. */
  secret: string;
  ip: string;
  userId?: string;
}

export async function checkRateLimit(
  { secret, ip, userId }: RateLimitCaller,
  policy: RateLimitPolicy,
): Promise<RateLimitDecision> {
  if (userId) {
    const userDecision = await consume(
      policy.user,
      secret,
      "user",
      userId,
      policy.message,
    );
    if (!userDecision.allowed) return userDecision;
  }

  return consume(policy.ip, secret, "ip", ip, policy.message);
}

/** Bound distributed guesses at one account without storing submitted email addresses. */
export async function enforceAccountLoginLimit(
  email: string,
  secret: string,
): Promise<void> {
  const decision = await consume(
    accountLoginLimiter,
    secret,
    "account",
    email.trim().toLowerCase(),
    "Too many sign-in attempts.",
  );
  if (decision.allowed) return;

  throw new APIError(
    "TOO_MANY_REQUESTS",
    { message: decision.message },
    { "Retry-After": String(decision.retryAfter) },
  );
}
