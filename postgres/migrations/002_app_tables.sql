CREATE TABLE history (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  sentence text NOT NULL,
  provider text NOT NULL,
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

CREATE TABLE account_login_limits (
  id text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX account_login_limits_expires_at_idx ON account_login_limits (expires_at);

-- Column order matters: rate-limiter-flexible inserts positional VALUES.
CREATE TABLE api_rate_limits (
  key varchar(255) PRIMARY KEY,
  points integer NOT NULL DEFAULT 0,
  expire bigint
);
CREATE INDEX api_rate_limits_expire_idx ON api_rate_limits (expire);
