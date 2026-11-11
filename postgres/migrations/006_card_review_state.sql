-- FSRS scheduling state for one card, per account. A card with no row is new.
-- Card level, Mastered and Nemesis are derived from stability and lapses.

CREATE TABLE card_review_state (
  user_id text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  deck_id text NOT NULL,
  -- DeckCard id within the deck's cards array.
  card_id text NOT NULL,
  phase text NOT NULL CHECK (phase IN ('learning', 'review', 'relearning')),
  due timestamptz NOT NULL,
  stability double precision NOT NULL CHECK (stability > 0),
  difficulty double precision NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  scheduled_days integer NOT NULL CHECK (scheduled_days >= 0),
  -- Index of the current short-term step while learning or relearning.
  learning_step integer NOT NULL DEFAULT 0 CHECK (learning_step >= 0),
  reps integer NOT NULL CHECK (reps >= 1),
  lapses integer NOT NULL DEFAULT 0 CHECK (lapses >= 0),
  last_reviewed_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, deck_id, card_id)
);
CREATE INDEX card_review_state_due_idx ON card_review_state (user_id, deck_id, due);
