// One-off copy of the MongoDB data into a freshly migrated, empty Postgres.
// Run after `npm run db:migrate` with the web app stopped. Everything is copied in
// one transaction, so a failed run leaves Postgres empty and can be retried.
import { MongoClient } from "mongodb";
import pg from "pg";

const BATCH_SIZE = 500;

class CopyRefusedError extends Error {}

const { MONGODB_URI, DATABASE_URL } = process.env;
if (!MONGODB_URI || !DATABASE_URL) {
  console.error("MONGODB_URI and DATABASE_URL must both be set");
  process.exit(1);
}

/** ObjectIds become their hex string, which is also the Postgres row ID. */
function id(value) {
  if (value === null || value === undefined) return null;
  if (value._bsontype === "ObjectId") return value.toHexString();
  return String(value);
}

const now = new Date();
const userIds = new Set();
const byKnownUser = (row) => userIds.has(row.user_id ?? row.userId);

const TABLES = [
  {
    collection: "user",
    table: "user",
    map: (doc) => ({
      id: id(doc._id),
      name: doc.name,
      email: doc.email,
      emailVerified: doc.emailVerified ?? false,
      image: doc.image ?? null,
      createdAt: doc.createdAt ?? now,
      updatedAt: doc.updatedAt ?? doc.createdAt ?? now,
      role: doc.role ?? null,
      banned: doc.banned ?? false,
      banReason: doc.banReason ?? null,
      banExpires: doc.banExpires ?? null,
    }),
    after: (rows) => {
      for (const row of rows) userIds.add(row.id);
    },
  },
  {
    collection: "account",
    table: "account",
    map: (doc) => ({
      id: id(doc._id),
      accountId: id(doc.accountId),
      providerId: doc.providerId,
      userId: id(doc.userId),
      accessToken: doc.accessToken ?? null,
      refreshToken: doc.refreshToken ?? null,
      idToken: doc.idToken ?? null,
      accessTokenExpiresAt: doc.accessTokenExpiresAt ?? null,
      refreshTokenExpiresAt: doc.refreshTokenExpiresAt ?? null,
      scope: doc.scope ?? null,
      password: doc.password ?? null,
      createdAt: doc.createdAt ?? now,
      updatedAt: doc.updatedAt ?? doc.createdAt ?? now,
    }),
    keep: byKnownUser,
  },
  {
    collection: "session",
    table: "session",
    filter: { expiresAt: { $gt: now } },
    map: (doc) => ({
      id: id(doc._id),
      expiresAt: doc.expiresAt,
      token: doc.token,
      createdAt: doc.createdAt ?? now,
      updatedAt: doc.updatedAt ?? doc.createdAt ?? now,
      ipAddress: doc.ipAddress ?? null,
      userAgent: doc.userAgent ?? null,
      userId: id(doc.userId),
      impersonatedBy: id(doc.impersonatedBy),
    }),
    keep: byKnownUser,
  },
  {
    collection: "verification",
    table: "verification",
    filter: { expiresAt: { $gt: now } },
    map: (doc) => ({
      id: id(doc._id),
      identifier: doc.identifier,
      value: doc.value,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt ?? now,
      updatedAt: doc.updatedAt ?? doc.createdAt ?? now,
    }),
  },
  {
    collection: "inviteCodes",
    table: "inviteCodes",
    filter: { expiresAt: { $gt: now } },
    map: (doc) => ({
      id: id(doc._id),
      code: doc.code,
      createdByUserId: id(doc.createdByUserId),
      createdAt: doc.createdAt ?? now,
      expiresAt: doc.expiresAt,
      usedAt: doc.usedAt ?? null,
      usedByUserId: id(doc.usedByUserId),
    }),
    keep: (row) => userIds.has(row.createdByUserId),
  },
  {
    collection: "history",
    table: "history",
    map: (doc) => ({
      id: id(doc._id),
      user_id: id(doc.userId),
      sentence: doc.sentence,
      provider: doc.provider ?? "unknown",
      model: doc.model ?? "unknown",
      created_at: doc.createdAt ?? now,
    }),
    keep: byKnownUser,
  },
  {
    collection: "user_settings",
    table: "user_settings",
    map: (doc) => ({
      user_id: id(doc.userId),
      preferences: JSON.stringify(doc.preferences ?? {}),
      updated_at: doc.updatedAt ?? now,
    }),
    keep: byKnownUser,
  },
];

async function insertBatch(client, table, rows) {
  const columns = Object.keys(rows[0]);
  const values = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map((column) => {
      values.push(row[column]);
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const result = await client.query(
    `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")})
     VALUES ${tuples.join(", ")}`,
    values,
  );
  return result.rowCount ?? 0;
}

const mongo = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
const client = new pg.Client({ connectionString: DATABASE_URL });

try {
  await mongo.connect();
  await client.connect();
  await client.query("BEGIN");
  const {
    rows: [{ populated }],
  } = await client.query(`SELECT EXISTS (SELECT 1 FROM "user") AS populated`);
  if (populated) {
    // Merging into existing rows could keep revoked sessions, old password
    // hashes, or lifted bans; the copy only targets an empty database.
    throw new CopyRefusedError(
      "Postgres already has users. Remove the postgres-data volume and rerun the migrations before copying again.",
    );
  }

  const report = [];
  for (const spec of TABLES) {
    const docs = await mongo
      .db()
      .collection(spec.collection)
      .find(spec.filter ?? {})
      .toArray();
    const mapped = docs.map(spec.map);
    const rows = spec.keep ? mapped.filter(spec.keep) : mapped;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      inserted += await insertBatch(
        client,
        spec.table,
        rows.slice(i, i + BATCH_SIZE),
      );
    }
    spec.after?.(rows);
    const {
      rows: [{ count }],
    } = await client.query(
      `SELECT count(*)::int AS count FROM "${spec.table}"`,
    );
    report.push({
      table: spec.table,
      mongo: docs.length,
      skipped: docs.length - rows.length,
      inserted,
      postgres: count,
    });
  }

  await client.query("COMMIT");
  console.table(report);
  console.info(
    "Copy committed. `skipped` rows referenced users that no longer exist.",
  );
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  // Driver errors can contain connection strings.
  console.error(
    "Copy failed and was rolled back:",
    error instanceof CopyRefusedError
      ? error.message
      : error instanceof Error && typeof error.code === "string"
        ? `${error.message} (SQLSTATE ${error.code})`
        : "check both database connections",
  );
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
  await mongo.close().catch(() => {});
}
