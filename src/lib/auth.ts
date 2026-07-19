import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { ac, adminRole, userRole } from "@/lib/auth-permissions";
import mongoClient from "@/lib/db";
import {
  claimInviteCode,
  findValidInviteCode,
  markInviteCodeUsedBy,
} from "@/lib/invites";

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

// Server side Better Auth instance
export const auth = betterAuth({
  database: mongodbAdapter(mongoClient.db(), { client: mongoClient }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [
    "kaitai://",
    ...(process.env.NODE_ENV === "development" ? ["exp://", "exp://**"] : []),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
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
          if (ctx?.path !== "/sign-up/email") {
            return;
          }
          const inviteCode = inviteCodeFromBody(ctx.body);
          if (!inviteCode || !(await claimInviteCode(inviteCode))) {
            throw new APIError("BAD_REQUEST", { message: INVITE_CODE_ERROR });
          }
        },
        after: async (user, ctx) => {
          if (ctx?.path !== "/sign-up/email") {
            return;
          }
          const inviteCode = inviteCodeFromBody(ctx.body);
          if (!inviteCode) {
            // Unreachable via normal flows: the before hooks reject sign-ups
            // without a valid invite code, so getting here means they were
            // bypassed and user creation was not gated.
            console.error(
              `[auth] Sign-up user ${user.id} was created without an invite code in the request body; invite hooks did not run as expected.`,
            );
            return;
          }
          await markInviteCodeUsedBy(inviteCode, user.id);
        },
      },
    },
  },
  plugins: [
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
