-- Account-wide flashcard progress moves from columns on user_settings
-- (007_account_progress.sql) to its own table, one row per account. Dates are
-- calendar days in the account's time zone, which decides when the streak and
-- daily quest roll over.

CREATE TABLE account_progress (
  user_id text PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= current_streak),
  -- A streak day is a day the daily quest was completed. Null until the first
  -- one; streak_days counts back from this day. Local dates after it are a new
  -- day in any time zone; dates up to it are still that day.
  last_streak_day date,
  -- True once a time zone change has forgiven a skipped day. Another skipped
  -- day breaks the streak until a quest is completed on a real day, which
  -- sets this back to false.
  streak_forgiveness_used boolean NOT NULL DEFAULT false,
  -- Streak days, newest first: the first bit is last_streak_day and each next
  -- bit is one day earlier. A year is kept for the calendar view; the streak
  -- columns hold exact counts that can run longer. A forgiveness moves
  -- last_streak_day forward and adds a 0 for each day skipped, so the first
  -- bit can be 0.
  streak_days bit varying(366) NOT NULL DEFAULT B'',
  CHECK ((last_streak_day IS NULL) = (length(streak_days) = 0)),
  -- Days forgiven after a time zone change skipped them, aligned with
  -- streak_days (first bit is last_streak_day). For the calendar only.
  forgiven_days bit varying(366) NOT NULL DEFAULT B'',
  daily_quest_target integer NOT NULL DEFAULT 40 CHECK (daily_quest_target > 0),
  -- Cards cleared on daily_quest_date; counts from 0 on a new day.
  daily_quest_progress integer NOT NULL DEFAULT 0 CHECK (daily_quest_progress >= 0),
  daily_quest_date date,
  -- IANA name, e.g. Asia/Tokyo; null falls back to UTC.
  time_zone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No code ever wrote these columns, so they hold only their defaults.
ALTER TABLE user_settings
  DROP COLUMN xp,
  DROP COLUMN current_streak,
  DROP COLUMN longest_streak,
  DROP COLUMN last_played_on,
  DROP COLUMN daily_quest_target,
  DROP COLUMN daily_quest_progress,
  DROP COLUMN daily_quest_date,
  DROP COLUMN time_zone;
