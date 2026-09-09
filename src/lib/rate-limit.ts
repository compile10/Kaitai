import { createHmac } from "node:crypto";
import { getIp } from "better-auth/api";
import type { NextRequest } from "next/server";
import { RateLimiterMongo, RateLimiterRes } from "rate-limiter-flexible";
import { auth } from "@/lib/auth";
import mongoClient from "@/lib/db";

export interface RateLimitPolicy {
  message: string;
  user: RateLimiterMongo;
  ip: RateLimiterMongo;
}

interface PolicyOptions {
  name: string;
  message: string;
  userLimit: number;
  ipLimit: number;
  windowSeconds: number;
}

function createPolicy({
  name,
  message,
  userLimit,
  ipLimit,
  windowSeconds,
}: PolicyOptions): RateLimitPolicy {
  const createLimiter = (dimension: "user" | "ip", points: number) =>
    new RateLimiterMongo({
      storeClient: mongoClient,
      dbName: mongoClient.db().databaseName,
      tableName: "apiRateLimits",
      keyPrefix: `${name}:${dimension}`,
      points,
      duration: windowSeconds,
    });

  return {
    message,
    user: createLimiter("user", userLimit),
    ip: createLimiter("ip", ipLimit),
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
  dimension: "user" | "ip",
  identifier: string,
): string {
  return createHmac("sha256", secret)
    .update(`${dimension}\0${identifier}`)
    .digest("base64url");
}

function getClientIp(request: NextRequest): string {
  const ip = getIp(request, auth.options);
  if (ip) return ip;

  throw new Error("Trusted client IP header is missing or invalid");
}

async function consume(
  limiter: RateLimiterMongo,
  secret: string,
  dimension: "user" | "ip",
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

export async function checkRateLimit(
  request: NextRequest,
  userId: string | undefined,
  policy: RateLimitPolicy,
): Promise<RateLimitDecision> {
  const { secret } = await auth.$context;

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

  return consume(policy.ip, secret, "ip", getClientIp(request), policy.message);
}
