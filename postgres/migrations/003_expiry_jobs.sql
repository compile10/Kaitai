-- Requires the pg_cron image in postgres/Dockerfile. Scheduling by name
-- replaces an existing job with the same name.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-invite-codes',
  '*/15 * * * *',
  $$DELETE FROM "inviteCodes" WHERE "expiresAt" < now()$$
);

SELECT cron.schedule(
  'expire-account-login-limits',
  '*/15 * * * *',
  $$DELETE FROM account_login_limits WHERE expires_at < now()$$
);

-- expire is epoch milliseconds.
SELECT cron.schedule(
  'expire-api-rate-limits',
  '*/15 * * * *',
  $$DELETE FROM api_rate_limits WHERE expire < (extract(epoch FROM now()) * 1000)::bigint$$
);

-- pg_cron records every run; keep a week of history.
SELECT cron.schedule(
  'prune-cron-run-details',
  '0 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'$$
);
