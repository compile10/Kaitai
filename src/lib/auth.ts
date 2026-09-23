import { getCurrentAdapter } from "@better-auth/core/context";
import { expo } from "@better-auth/expo";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { ObjectId } from "mongodb";
import { ac, adminRole, userRole } from "@/lib/auth-permissions";
import mongoClient from "@/lib/db";
import { findValidInviteCode } from "@/lib/invites";
import { enforceAccountLoginLimit } from "@/lib/login-limit";

const INVITE_CODE_ERROR = "A valid invite code is required to sign up.";

function inviteCodeFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const { inviteCode } = body as Record<string, unknown>;
  if (typeof inviteCode !== "string" || inviteCode.trim() === "") {
    return null;
  }
  return inviteCode.trim();
}

if (process.env.NODE_ENV === "production") {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
  }
  let url: URL;
  try {
    url = new URL(process.env.BETTER_AUTH_URL ?? "");
  } catch {
    throw new Error("BETTER_AUTH_URL must be an HTTPS origin");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("BETTER_AUTH_URL must be an HTTPS origin");
  }
}
const clientIpHeader = (process.env.RATE_LIMIT_IP_HEADER ?? "x-forwarded-for")
  .trim()
  .toLowerCase();

if (!/^[a-z0-9-]+$/.test(clientIpHeader)) {
  throw new Error("RATE_LIMIT_IP_HEADER is not a valid HTTP header name");
}

export const auth = betterAuth({
  database: mongodbAdapter(mongoClient.db(), { client: mongoClient }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      // Every authenticated request must observe revoked sessions and bans.
      enabled: false,
    },
  },
  rateLimit: {
    storage: "database",
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: [clientIpHeader],
    },
  },
  trustedOrigins: [
    "kaitai://",
    ...(process.env.NODE_ENV === "development" ? ["exp://", "exp://**"] : []),
  ],
  // The invite gate below is scoped to /sign-up/email, so any new public
  // signup surface added later (e.g. social login) must be gated separately.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/sign-in/email" &&
        typeof ctx.body?.email === "string"
      ) {
        await enforceAccountLoginLimit(ctx.body?.email, ctx.context.secret);
      }
      if (ctx.path !== "/sign-up/email") {
        return;
      }
      const inviteCode = inviteCodeFromBody(ctx.body);
      if (!inviteCode || !(await findValidInviteCode(inviteCode))) {
        throw new APIError("BAD_REQUEST", { message: INVITE_CODE_ERROR });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Only /sign-up/email carries an invite code; other user-creation
        // paths (admin createUser, dev seeding) are exempt from the check.
        before: async (_user, ctx) => {
          if (ctx?.path !== "/sign-up/email") return;
          const inviteCode = inviteCodeFromBody(ctx.body);
          if (!inviteCode)
            throw new APIError("BAD_REQUEST", { message: INVITE_CODE_ERROR });
          const userId = new ObjectId().toHexString();
          // The current adapter shares the signup transaction, including rollback.
          const adapter = await getCurrentAdapter(ctx.context.adapter);
          let claimed: unknown;
          try {
            claimed = await adapter.update({
              model: "inviteCodes",
              where: [
                { field: "code", value: inviteCode },
                { field: "usedAt", value: null },
                { field: "expiresAt", operator: "gt", value: new Date() },
              ],
              update: { usedAt: new Date(), usedByUserId: userId },
            });
          } catch (error) {
            // Two transactions claiming one invite can conflict before commit.
            if (
              error &&
              typeof error === "object" &&
              "code" in error &&
              error.code === 112
            ) {
              throw new APIError("BAD_REQUEST", {
                message: INVITE_CODE_ERROR,
              });
            }
            throw error;
          }
          if (!claimed)
            throw new APIError("BAD_REQUEST", { message: INVITE_CODE_ERROR });
          return { data: { ..._user, id: userId } };
        },
      },
    },
  },
  plugins: [
    {
      id: "invite-gate",
      schema: {
        inviteCodes: {
          fields: {
            code: { type: "string", required: true },
            expiresAt: { type: "date", required: true },
            usedAt: { type: "date", required: false },
            usedByUserId: { type: "string", required: false },
          },
        },
      },
    },
    expo(),
    admin({
      ac,
      roles: {
        admin: adminRole,
        user: userRole,
      },
    }),
    nextCookies(), // must be last
  ],
  experimental: {
    joins: true,
  },
});
