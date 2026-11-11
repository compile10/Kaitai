-- Flashcard decks (docs/flashcards/README.md). A deck holds only shared
-- content; a deck can be added by many accounts, so per-account data
-- (review state, play settings, personal bests) belongs in separate tables
-- keyed by (deck id, card id).

-- Starter decks are not stored here: they will ship with the app as JSON with
-- "starter:" ids, which the id check below keeps out of this table.

CREATE TABLE decks (
  id text PRIMARY KEY CHECK (id NOT LIKE 'starter:%'),
  -- Nullable: a deck may have no owner.
  owner_id text REFERENCES "user" ("id"),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  -- Array of DeckCard (common/types.ts). Card ids must stay stable across
  -- edits: per-account review state refers to them.
  cards jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(cards) = 'array'),
  card_count integer GENERATED ALWAYS AS (jsonb_array_length(cards)) STORED,
  -- Bumped on every content change; lets clients detect stale copies and
  -- lets writers reject concurrent edits.
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX decks_owner_idx ON decks (owner_id, updated_at DESC);
