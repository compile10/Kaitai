import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";
import { z } from "zod";

class SeedAdminError extends Error {}

// Serializes concurrent seed runs so only one can create the initial admin.
const SEED_LOCK_KEY = 4_811_517;

const environmentSchema = z.object({
  NODE_ENV: z.literal("production"),
  DATABASE_URL: z
    .string()
    .trim()
    .regex(/^postgres(?:ql)?:\/\/[^/]+\/[^?\s/]+(?:\?.*)?$/),
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
      `Invalid or missing environment: ${fields.join(", ")}. Require NODE_ENV=production, DATABASE_URL with a database name, ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD (12–128 characters).`,
    );
  }
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = parsed.data;
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  try {
    const password = await hashPassword(ADMIN_PASSWORD);
    await client.query("BEGIN");
    try {
      await client.query("SELECT pg_advisory_xact_lock($1)", [SEED_LOCK_KEY]);
      const message = await seedInTransaction(client, {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        password,
      });
      await client.query("COMMIT");
      return message;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function seedInTransaction(client, { email, name, password }) {
  const {
    rows: [existing],
  } = await client.query(
    `SELECT "id", "role", "banned" FROM "user" WHERE "email" = $1`,
    [email],
  );
  if (existing) {
    if (!existing.role?.split(",").includes("admin")) {
      throw new SeedAdminError(
        "This email belongs to a non-admin account; refusing to promote it.",
      );
    }
    const {
      rows: [credential],
    } = await client.query(
      `SELECT "password" FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [existing.id],
    );
    if (existing.banned || !credential?.password) {
      throw new SeedAdminError(
        "The admin exists but is banned or has no password credential; repair it through account administration.",
      );
    }
    return "Admin already exists; credentials unchanged.";
  }

  const { rowCount: adminCount } = await client.query(
    `SELECT 1 FROM "user" WHERE 'admin' = ANY (string_to_array("role", ',')) LIMIT 1`,
  );
  if (adminCount) {
    throw new SeedAdminError(
      "An admin already exists; this command only creates the initial admin.",
    );
  }

  const userId = randomUUID();
  const now = new Date();
  // Credential accounts use the user ID as their account ID.
  await client.query(
    `INSERT INTO "user" ("id", "email", "name", "emailVerified", "role", "banned", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, false, 'admin', false, $4, $4)`,
    [userId, email, name, now],
  );
  await client.query(
    `INSERT INTO "account" ("id", "userId", "accountId", "providerId", "password", "createdAt", "updatedAt")
     VALUES ($1, $2, $2, 'credential', $3, $4, $4)`,
    [randomUUID(), userId, password, now],
  );
  return "Initial admin created.";
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
        : "Admin seed failed. Check database access, that migrations have run, and write permissions. No credentials are logged.",
    );
    process.exitCode = 1;
  }
}
