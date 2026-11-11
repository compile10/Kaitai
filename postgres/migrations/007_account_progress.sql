-- Account-wide flashcard progress. Dates are calendar days in the account's
-- time zone, which decides when the streak and daily quest roll over.

ALTER TABLE user_settings
  ADD COLUMN xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  ADD COLUMN current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  ADD COLUMN longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= current_streak),
  -- Null until the first finished Run.
  ADD COLUMN last_played_on date,
  ADD COLUMN daily_quest_target integer NOT NULL DEFAULT 40 CHECK (daily_quest_target > 0),
  -- Cards cleared on daily_quest_date; counts from 0 on a new day.
  ADD COLUMN daily_quest_progress integer NOT NULL DEFAULT 0 CHECK (daily_quest_progress >= 0),
  ADD COLUMN daily_quest_date date,
  -- IANA name, e.g. Asia/Tokyo; null falls back to UTC.
  ADD COLUMN time_zone text;
