CREATE TABLE history (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  sentence text NOT NULL,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sentence)
);
CREATE INDEX history_user_created_idx ON history (user_id, created_at DESC);

CREATE TABLE user_settings (
  user_id text PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Column order matters: rate-limiter-flexible inserts positional VALUES.
CREATE TABLE rate_limits (
  key varchar(255) PRIMARY KEY,
  points integer NOT NULL DEFAULT 0,
  expire bigint
);
CREATE INDEX rate_limits_expire_idx ON rate_limits (expire);
