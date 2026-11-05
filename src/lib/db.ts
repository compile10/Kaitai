import { safeMessage } from "@common/redaction";
import { type ColumnType, Kysely, PostgresDialect } from "kysely";
import { Pool, types } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export interface Database {
  history: {
    id: string;
    user_id: string;
    sentence: string;
    model: string;
    created_at: Date;
  };
  user_settings: {
    user_id: string;
    // jsonb: written as serialized JSON, read back as a parsed object.
    preferences: ColumnType<Record<string, unknown>, string, string>;
    updated_at: Date;
  };
  inviteCodes: {
    id: string;
    code: string;
    createdByUserId: string;
    createdAt: Date;
    expiresAt: Date;
    usedAt: Date | null;
    usedByUserId: string | null;
  };
  user: {
    id: string;
    email: string;
  };
}

// int8 (bigint, count(*)) values here are epoch milliseconds and counts, well
// within Number range; Better Auth's rate limiter does arithmetic on them.
types.setTypeParser(types.builtins.INT8, Number);

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5_000,
  });
  // Idle clients dropped by a server restart emit here; the pool discards them
  // and reconnects on the next query.
  pool.on("error", (error) => {
    console.error("Idle Postgres client error:", safeMessage(error));
  });
  return pool;
}

let pool: Pool;

if (process.env.NODE_ENV === "development") {
  const g = globalThis as typeof globalThis & { _pgPool?: Pool };
  g._pgPool ??= createPool();
  pool = g._pgPool;
} else {
  pool = createPool();
}

export { pool };

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});
