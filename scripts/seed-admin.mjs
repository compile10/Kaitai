import { pathToFileURL } from "node:url";
import { hashPassword } from "better-auth/crypto";
import { MongoClient, ObjectId } from "mongodb";
import { z } from "zod";

class SeedAdminError extends Error {}

const environmentSchema = z.object({
  NODE_ENV: z.literal("production"),
  MONGODB_URI: z
    .string()
    .trim()
    .regex(/^mongodb(?:\+srv)?:\/\/[^/]+\/[^?\s/]+(?:\?.*)?$/),
  ADMIN_EMAIL: z.string().trim().toLowerCase().email(),
  ADMIN_PASSWORD: z.string().min(12).max(128),
  ADMIN_NAME: z.string().trim().min(1),
});

export async function seedAdmin(environment = process.env) {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const fields = [
      ...new Set(parsed.error.issues.map((issue) => issue.path[0])),
    ];
    throw new SeedAdminError(
      `Invalid or missing environment: ${fields.join(", ")}. Require NODE_ENV=production, MONGODB_URI with a database name, ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD (12–128 characters).`,
    );
  }
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = parsed.data;
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("user");
    const accounts = db.collection("account");
    const password = await hashPassword(ADMIN_PASSWORD);
    return await client.withSession(async (session) =>
      session.withTransaction(async () => {
        const existing = await users.findOne(
          { email: ADMIN_EMAIL },
          { session },
        );
        if (existing) {
          if (!existing.role?.split(",").includes("admin")) {
            throw new SeedAdminError(
              "This email belongs to a non-admin account; refusing to promote it.",
            );
          }
          const credential = await accounts.findOne(
            { userId: existing._id, providerId: "credential" },
            { session },
          );
          if (existing.banned || !credential?.password) {
            throw new SeedAdminError(
              "The admin exists but is banned or has no password credential; repair it through account administration.",
            );
          }
          return "Admin already exists; credentials unchanged.";
        }
        if (
          await users.findOne(
            { role: /(^|,)admin(,|$)/ },
            { session, projection: { _id: 1 } },
          )
        ) {
          throw new SeedAdminError(
            "An admin already exists; this command only creates the initial admin.",
          );
        }

        const userId = new ObjectId();
        const now = new Date();
        // Better Auth's Mongo adapter stores referenced user IDs as ObjectIds
        // and credential account IDs as strings. Both records must commit together.
        await users.insertOne(
          {
            _id: userId,
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            emailVerified: false,
            role: "admin",
            banned: false,
            createdAt: now,
            updatedAt: now,
          },
          { session },
        );
        await accounts.insertOne(
          {
            _id: new ObjectId(),
            userId,
            accountId: userId.toHexString(),
            providerId: "credential",
            password,
            createdAt: now,
            updatedAt: now,
          },
          { session },
        );
        return "Initial admin created.";
      }),
    );
  } finally {
    await client.close();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    console.info(await seedAdmin());
  } catch (error) {
    // Driver errors can contain connection strings or credentials.
    console.error(
      error instanceof SeedAdminError
        ? error.message
        : "Admin seed failed. Check database access, replica-set support, and write permissions. No credentials are logged.",
    );
    process.exitCode = 1;
  }
}
