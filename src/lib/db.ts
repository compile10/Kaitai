import { safeMessage } from "@common/redaction";
import type { CardReviewPhase, DeckCard, RunRank } from "@common/types";
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
    preferences: ColumnType<
      Record<string, unknown>,
      string | undefined,
      string
    >;
    updated_at: Date;
    xp: ColumnType<number, number | undefined, number>;
    current_streak: ColumnType<number, number | undefined, number>;
    longest_streak: ColumnType<number, number | undefined, number>;
    last_played_on: ColumnType<string | null, string | undefined, string>;
    daily_quest_target: ColumnType<number, number | undefined, number>;
    daily_quest_progress: ColumnType<number, number | undefined, number>;
    daily_quest_date: ColumnType<string | null, string | undefined, string>;
    time_zone: ColumnType<string | null, string | undefined, string | null>;
  };
  decks: {
    id: string;
    owner_id: string | null;
    name: string;
    description: ColumnType<string, string | undefined, string>;
    // jsonb: written as serialized JSON, read back as a parsed array.
    cards: ColumnType<DeckCard[], string | undefined, string>;
    card_count: ColumnType<number, never, never>;
    version: ColumnType<number, number | undefined, number>;
    created_at: ColumnType<Date, Date | undefined, never>;
    updated_at: ColumnType<Date, Date | undefined, Date>;
  };
  user_deck_data: {
    user_id: string;
    deck_id: string;
    // jsonb: written as serialized JSON, read back as a parsed object.
    settings: ColumnType<Record<string, unknown>, string | undefined, string>;
    best_score: ColumnType<number | null, never, number | null>;
    best_rank: ColumnType<RunRank | null, never, RunRank | null>;
    best_combo: ColumnType<number, never, number>;
    runs_played: ColumnType<number, never, number>;
    added_at: ColumnType<Date, Date | undefined, never>;
    last_played_at: ColumnType<Date | null, never, Date>;
  };
  card_review_state: {
    user_id: string;
    deck_id: string;
    card_id: string;
    phase: CardReviewPhase;
    due: Date;
    stability: number;
    difficulty: number;
    scheduled_days: number;
    learning_step: ColumnType<number, number | undefined, number>;
    reps: number;
    lapses: ColumnType<number, number | undefined, number>;
    last_reviewed_at: Date;
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
// date columns are calendar days in the account's time zone; keep them as
// YYYY-MM-DD instead of a Date at server-local midnight.
types.setTypeParser(types.builtins.DATE, (value) => value);

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
