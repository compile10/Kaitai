-- One row per deck an account has added: play settings and personal bests.
-- Per-card review state and account-wide progress (XP, streaks) live elsewhere.

CREATE TABLE user_deck_data (
  user_id text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  -- No foreign key: also holds "starter:" ids, which are not in decks. Rows for
  -- a deleted deck must be removed in the same transaction as the deck.
  deck_id text NOT NULL,
  -- DeckPlaySettings (common/types.ts); missing keys fall back to defaults.
  settings jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  -- Null until the first finished Run.
  best_score integer CHECK (best_score >= 0),
  best_rank text CHECK (best_rank IN ('S', 'A', 'B', 'C', 'D')),
  best_combo integer NOT NULL DEFAULT 0 CHECK (best_combo >= 0),
  runs_played integer NOT NULL DEFAULT 0 CHECK (runs_played >= 0),
  added_at timestamptz NOT NULL DEFAULT now(),
  last_played_at timestamptz,
  PRIMARY KEY (user_id, deck_id)
);
CREATE INDEX user_deck_data_recent_idx
  ON user_deck_data (user_id, last_played_at DESC NULLS LAST, added_at DESC);
