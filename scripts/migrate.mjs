import { readdir, readFile } from "node:fs/promises";
import { Kysely, PostgresDialect, sql } from "kysely";
import { Migrator } from "kysely/migration";
import pg from "pg";

const MIGRATIONS_DIR = new URL("../postgres/migrations/", import.meta.url);

/** Each `postgres/migrations/NNN_name.sql` file is one forward-only migration. */
const provider = {
  async getMigrations() {
    const files = (await readdir(MIGRATIONS_DIR))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    const migrations = {};
    for (const file of files) {
      const text = await readFile(new URL(file, MIGRATIONS_DIR), "utf8");
      migrations[file.replace(/\.sql$/, "")] = {
        // No parameters, so pg sends it as one multi-statement simple query.
        up: (db) => sql.raw(text).execute(db),
      };
    }
    return migrations;
  },
};

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 }),
  }),
});

try {
  // Postgres runs all pending migrations in one transaction, under a lock.
  const { error, results } = await new Migrator({
    db,
    provider,
  }).migrateToLatest();
  for (const result of results ?? []) {
    console.info(`${result.status}: ${result.migrationName}`);
  }
  if (error) {
    // Only server-reported SQL errors are printed; connection errors can contain
    // connection details.
    console.error(
      "Migration failed:",
      error instanceof Error && typeof error.code === "string"
        ? `${error.message} (SQLSTATE ${error.code})`
        : "check database access and the failed migration above",
    );
    process.exitCode = 1;
  } else if (!results?.length) {
    console.info("Database schema is up to date.");
  }
} finally {
  await db.destroy();
}
