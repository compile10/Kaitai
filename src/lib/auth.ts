import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import mongoClient from "@/lib/db";

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
  plugins: [nextCookies()], // must be last
});
